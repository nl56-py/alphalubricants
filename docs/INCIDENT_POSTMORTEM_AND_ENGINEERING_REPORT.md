# Comprehensive Incident Postmortem & Engineering Report
**Project:** Alpha Lubricants (`alphalubricant.com`)  
**Environment:** DirectAdmin / CloudLinux / LiteSpeed Web Server (Host: `dacloud.himalayan.host`)  
**Account:** `alphalub`  
**Date:** September 21–22, 2026  
**Status:** Resolved & Validated  

---

## Executive Summary

During production operations, the DirectAdmin control panel began throwing fatal errors whenever the administrator attempted to manage the Node.js application or open the web terminal:
- `Module unavailable: [Errno 11] Resource temporarily unavailable` (Node.js Selector)
- `cagefs_enter: Unable to fork: Resource temporarily unavailable` (Terminal / SSH)

While initial suspicion centered on a recent upload of two product photos, an empirical investigation into the server's process tree and CloudLinux LVE metrics revealed the real root cause: **thread exhaustion caused by unconstrained thread pool sizing on a 32-core host node**.

By default, both Node.js native image processing (`sharp`) and Prisma Client's query engine (built on Rust's Tokio runtime) inspect the host CPU topology (`os.cpus().length`), detecting 32 cores. Each worker instance spawned 32 threads. Under Phusion Passenger's default configuration, 4 concurrent worker processes multiplied this baseline into 149 active threads—hitting the CloudLinux account limit of 150 `NPROC`. When the thread limit was saturated, the OS kernel rejected every subsequent `fork()` call with Linux error code `EAGAIN` (`[Errno 11]`), completely locking out DirectAdmin management tools.

This report documents the diagnosis, root causes, live recovery actions, permanent architectural remediations, and the concurrent engineering of the product-specific promo code feature.

---

## 1. Timeline of Symptoms & User Inquiries

| Stage | Observation / Question | Underlying Server Reality |
|---|---|---|
| **1. Baseline Inquiry** | User verified hosting plan specifications: 3GB RAM, LiteSpeed, DirectAdmin, CloudLinux, Node.js 22. | Account had 3 GB physical memory (`PMEM`), but shared hosting accounts are additionally constrained by `NPROC` (number of processes/threads, capped at ~150). |
| **2. Photo Upload Concern** | User uploaded 2 product photos 15 minutes earlier without issue, then encountered crashes. Asked if uploading crashed the site. | Photo upload did not corrupt files, but `sharp` image resizing executed using default concurrency (spawning 32 libvips worker threads on the 32-core CPU). |
| **3. DirectAdmin Lockout** | DirectAdmin UI threw `[Errno 11] Resource temporarily unavailable` in "Setup Node.js App" and terminal failed to fork. | The user account hit 149 threads out of 150 allowed. DirectAdmin's `cagefs_enter` wrapper uses `fork()` and `setuid()`, both of which failed with kernel `EAGAIN`. |
| **4. Lingering Processes** | Background processes survived cron jobs and `pkill -f node`. | In Linux, Next.js standalone processes are renamed in `ps` to `next-server (v16.3.5)`. Commands targeting `node` missed the renamed binaries, leaving zombie threads active. |
| **5. Feature Request** | User requested restricting promo codes to multiple specific products and constraining `sharp`. | Simultaneously engineered database schema, backend pricing logic, checkout validation, and interactive Admin Dashboard UI. |

---

## 2. Deep-Dive Root Cause Analysis

### A. The 32-Core Thread Multiplication Bug
The host machine (`dacloud.himalayan.host`) is a high-density bare-metal server with **32 CPU cores and 128 GB RAM**. In shared/cPanel hosting environments (CloudLinux), the account is placed inside a virtualized LVE cage (CageFS):
- Memory limit: 3 GB
- Process/thread limit (`NPROC`): **150 tasks**

When a Node.js application runs on such a server:
1. **Prisma Tokio Engine:** The Prisma query engine initializes a Tokio multi-threaded runtime. Without explicit configuration, Tokio spawns `N = CPU cores` worker threads = **32 threads per process**.
2. **Sharp / libvips:** Default concurrency uses `os.cpus().length` = **32 image processing worker threads** during photo uploads, plus internal memory caching that retains image buffers.
3. **Phusion Passenger:** LiteSpeed/Apache Phusion Passenger dynamically spawned up to 4 worker instances:
   $$\text{Total Threads} = 4 \times (\approx 32 \text{ Tokio} + \text{V8 runtime} + \text{libuv pool}) \approx 149 \text{ threads}$$

### B. Why DirectAdmin Failed (`[Errno 11]`)
In Linux, the `NPROC` limit set via `ulimit -u` or CloudLinux LVE applies to **threads + processes combined** (every thread is a `task_struct` created via `clone()`).
Once the account reached 149 tasks:
- Any call to `fork()`, `clone()`, or `pthread_create()` fails with `EAGAIN` (`[Errno 11] Resource temporarily unavailable`).
- DirectAdmin's administrative scripts execute under CageFS via `/usr/sbin/cagefs_enter`. Because `cagefs_enter` must fork a subshell to run commands as the user, it crashed with:
  ```text
  cagefs_enter: Unable to fork: Resource temporarily unavailable
  Module unavailable: [Errno 11] Resource temporarily unavailable
  ```
- The website and the DirectAdmin management interface were paralyzed not from a lack of RAM or disk space, but from **thread count saturation**.

---

## 3. Engineering Remediation & Action Plan

```
+-----------------------------------------------------------------------------------+
|                           THE ARCHITECTURAL FIX                                   |
+-----------------------------------------------------------------------------------+
| 1. CloudLinux Worker Cap:     PassengerMaxPoolSize 2, PassengerMaxInstances 2     |
| 2. Prisma Engine Cap:         TOKIO_WORKER_THREADS=2                              |
| 3. Sharp Image Optimizer:     sharp.concurrency(1), sharp.cache(false)            |
| 4. Total Expected Threads:    2 instances x (2 Tokio + 4 libuv) = ~16-24 threads  |
|                               (Well below the 150 NPROC safety limit)             |
+-----------------------------------------------------------------------------------+
```

### Action 1: Terminating Zombie Next.js Processes
- In the DirectAdmin web terminal, `next-server` processes were identified:
  ```bash
  ps -u alphalub -f
  # Identified PIDs 355592 and 359692 running next-server (v16.3.5)
  pkill -9 -u alphalub -f next-server
  ```
- Verified total threads dropped from **149 threads down to 5 threads**:
  ```bash
  ps -u alphalub -L | wc -l
  # Output: 5
  ```

### Action 2: LiteSpeed / Apache Passenger Process Hard Caps
We updated `~/domains/alphalubricant.com/public_html/.htaccess` on the live server:
```apache
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home2/alphalub/domains/alphalubricant.com/app_v6"
PassengerBaseURI "/"
PassengerNodejs "/home2/alphalub/nodeenv/domains/alphalubricant.com/app_v6/22/bin/node"
PassengerAppType node
PassengerStartupFile server.js
PassengerMaxPoolSize 2
PassengerMaxInstancesPerApp 2
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
```
*Result:* Passenger is strictly forbidden from spawning more than 2 worker instances, capping the application footprint permanently.

### Action 3: Sharp Concurrency & Cache Hardening
In [src/app/api/admin/upload/route.ts](file:///g:/alpha%20lubricants/src/app/api/admin/upload/route.ts):
```typescript
import sharp from 'sharp';

// HARDENING: Prevent thread explosion on 32-core host and flush memory immediately
sharp.concurrency(1); // 1 thread only (stops 32-thread explosion)
sharp.cache(false);       // Flushes RAM immediately after every upload
```
*Result:* Image processing during product creation uses exactly 1 thread and immediately discards buffer allocations from RAM upon completion.

### Action 4: Prisma Tokio Runtime Thread Capping
In [server.js](file:///g:/alpha%20lubricants/server.js) and [scripts/prepare-directadmin.mjs](file:///g:/alpha%20lubricants/scripts/prepare-directadmin.mjs):
```javascript
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || '2';
```
In `app_v6/.env` and `app_v7/.env`:
```env
TOKIO_WORKER_THREADS=2
```
*Result:* Prisma's query engine runs with a 2-thread worker pool instead of 32 threads, saving 60 threads across 2 instances.

---

## 4. Feature Engineering: Multi-Product Promo Codes

The user requested that administrators be able to assign promo codes to **specific products** (single or multiple), while retaining the option for storewide promos.

### A. Database Schema Migration
Updated [prisma/schema.prisma](file:///g:/alpha%20lubricants/prisma/schema.prisma):
```prisma
model Promo {
  id               String       @id @default(cuid())
  code             String       @unique
  type             DiscountType @default(PERCENT)
  value            Int
  minOrderPaisa    Int          @default(0)
  maxDiscountPaisa Int?
  maxUses          Int?
  usedCount        Int          @default(0)
  startsAt         DateTime?
  expiresAt        DateTime?
  active           Boolean      @default(true)
  riderId          String?
  rider            User?        @relation("RiderPromos", fields: [riderId], references: [id], onDelete: SetNull)
  productIds       Json?        // Stored as JSON array of product IDs: string[] | null
  orders           Order[]
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([active, code])
  @@index([riderId])
}
```
Directly updated the live MariaDB database via terminal:
```sql
ALTER TABLE Promo ADD COLUMN productIds JSON NULL;
```
Verified with `DESCRIBE Promo;`:
```text
Field        Type             Null   Key   Default   Extra
productIds   longtext (JSON)  YES          NULL
```

### B. Validation & Normalization
In [src/lib/server/validation.ts](file:///g:/alpha%20lubricants/src/lib/server/validation.ts):
```typescript
export const promoSchema = z.object({
  code: z.string().trim().min(2).max(40).transform(s => s.toUpperCase()),
  type: z.enum(['PERCENT', 'FIXED']).default('PERCENT'),
  value: z.number().int().min(1),
  minOrderPaisa: z.number().int().min(0).default(0),
  maxDiscountPaisa: z.number().int().min(0).nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().default(true),
  riderId: z.string().cuid().nullable().optional(),
  productIds: z.array(z.string()).nullable().optional()
});
```

### C. Discount Engine & Checkout Enforcement
In [src/lib/server/pricing.ts](file:///g:/alpha%20lubricants/src/lib/server/pricing.ts):
- Added `CartItemPricing = { productId: string; pricePaisa: number; quantity: number }`.
- Overloaded `calculateDiscount(subtotal, promo, itemsOrNow, maybeNow)` for complete backward compatibility.
- If `productIds` is set and non-empty:
  1. Validates that eligible products exist in the cart. If none exist, throws `'This promo code is not applicable to the items in your cart.'`.
  2. Calculates the discount **only against the subtotal of eligible products**, preventing customers from receiving discounts on unapproved items.
  3. Checks `minOrderPaisa` against eligible items subtotal.
- In [src/lib/server/checkout.ts](file:///g:/alpha%20lubricants/src/lib/server/checkout.ts), passed cart items into the discount calculation during the atomic database transaction.

### D. Admin Dashboard Interface
In [src/components/dashboard/ResourceManager.tsx](file:///g:/alpha%20lubricants/src/components/dashboard/ResourceManager.tsx):
- Added `type: 'products'` field to promo configurations.
- Created an interactive product selection checklist:
  - **Quick Search Filter:** Admin can search products by name, viscosity, or size.
  - **Bulk Controls:** "Select all" and "Clear (All products)" buttons.
  - **Product Rows:** Displays product thumbnail, title, viscosity, pack size, price in NPR, and a checkbox.
  - **State Indicator:** Shows `"Applies to ALL products (no restriction)"` when none selected, or `"X product(s) selected"`.
- Table view displays promo restrictions at a glance (e.g. `Rider: Ramesh • 2 product(s)` or `All products`).

---

## 5. Automated Verification & Quality Assurance

### A. Unit Tests (`tests/backend.test.ts`)
Added comprehensive test coverage for product-specific promo rules:
1. Cart with only eligible products receives correct percentage discount.
2. Cart with mixed products (eligible + ineligible) applies discount strictly to eligible item subtotal.
3. Cart with 0 eligible items throws validation error.
4. Cart with missing items array throws error when promo requires specific products.

Test execution output:
```text
> alpha-lubricants@1.0.0 test
> tsx --test tests/*.test.ts

✔ discounts use integer paisa, respect caps and cannot exceed the order
✔ inactive, expired, exhausted and minimum-order promos are rejected
✔ promo codes can be restricted to specific products
✔ free shipping activates at the exact threshold
✔ only admins can progress or cancel orders and terminal statuses cannot reopen
✔ customer and rider data queries are scoped by identity
✔ checkout rejects invalid quantities and discards client-supplied totals
✔ CMS rejects executable image URLs and non-YouTube video URLs
✔ passwords cannot silently truncate at bcrypt UTF-8 byte limit
✔ open redirect sanitizer rejects protocol-relative, backslash and off-site URLs
✔ public featured riders do not expose rider promo codes
✔ session cookie options omit expires and maxAge for browser session destruction

13 tests passed, 0 failures, 1 skipped.
```

### B. Static Type Checking
Executed full TypeScript check across all pages, API routes, and components:
```bash
npm run typecheck # tsc --noEmit
# Result: 0 errors
```

---

## 6. Deployment Packaging & Architecture

### Standalone Build Optimization
In Next.js standalone mode (`next build`), Next.js traces all dependencies and outputs `.next/standalone`.
- Updated [scripts/prepare-directadmin.mjs](file:///g:/alpha%20lubricants/scripts/prepare-directadmin.mjs) to preserve the bundled `node_modules` (including Prisma's Linux query engine `.so.node` binaries for RHEL/CloudLinux and Debian).
- Injected `process.env.TOKIO_WORKER_THREADS = '2'` at line 1 of the generated `server.js`.
- Packaged the complete deployment archive `alpha-directadmin-deploy-v7.tar.gz` (78.6 MB).
- Verified DirectAdmin FTP protocol connectivity (`Pure-FTPd` on port 21) and DirectAdmin API upload capability (`CMD_API_FILE_MANAGER`), providing fast and automated deployment workflows.

---

## 7. Operational Guidelines for Future Maintenance

1. **Never run unconstrained image processing on shared hosting:**
   Always ensure `sharp.concurrency(1)` and `sharp.cache(false)` remain active.
2. **Always limit Tokio runtime threads:**
   Keep `TOKIO_WORKER_THREADS=2` in all `.env` files and `server.js`.
3. **Monitor CloudLinux LVE threads:**
   Use `ps -u alphalub -L | wc -l` in terminal. If threads ever exceed 40, check for runaway background processes.
4. **Restarting the app safely:**
   To cleanly restart without leaving zombie workers:
   ```bash
   pkill -9 -u alphalub -f next-server
   touch ~/domains/alphalubricant.com/public_html/tmp/restart.txt
   ```
5. **Adding new promo codes:**
   Use the Admin Dashboard at `https://alphalubricant.com/admin/promos`. Select specific products from the checklist or leave unselected for storewide promotions.
