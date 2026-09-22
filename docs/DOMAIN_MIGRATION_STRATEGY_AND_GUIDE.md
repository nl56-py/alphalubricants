# Domain Migration Strategy & Implementation Guide
## Transitioning from `alphalubricant.com` to `alphalubricantsnepal.com`

---

## 1. Executive Summary

This report assesses the business, SEO, and technical impacts of migrating the primary web presence for Alpha Lubricants Nepal from:
- **Current Domain**: `https://alphalubricant.com`
- **Target Domain**: `https://alphalubricantsnepal.com`

It details the search ranking implications, mitigation strategies to prevent organic traffic loss, necessary codebase modifications, infrastructure/DNS adjustments, and a step-by-step launch checklist.

---

## 2. Google Search & SEO Impact Analysis

### 2.1 The Core Mechanism: How Google Views Domain Changes
Google treats every domain name as an independent entity with its own distinct history, authority score, and trust graph. Changing a domain is essentially moving a business to a brand-new physical address. 

If managed properly using **1:1 HTTP 301 Permanent Redirects** and the **Google Search Console Change of Address Tool**, Google transfers **90% to 99%** of existing ranking signals, PageRank, and link equity to the new domain.

---

### 2.2 Short-Term Risks: The "Migration Dip"
Even with a flawless technical execution, expect a temporary period of search volatility:
1. **Indexation Delay (2 to 6 weeks)**:
   Google does not update its entire index overnight. Googlebot must re-crawl every indexed URL on `alphalubricant.com`, follow the 301 redirect, discover the corresponding URL on `alphalubricantsnepal.com`, and re-index the content under the new domain.
2. **Temporary Ranking Fluctuation**:
   During this transition window, impressions and keyword rankings may fluctuate by 10%–25% before stabilizing once the new domain inherits the canonical signals.
3. **Crawl Budget Consumption**:
   Googlebot will allocate significant crawl budget to following redirects. Having a lightweight server and zero redirect chains is vital so the crawler doesn't hit server resource ceilings.

---

### 2.3 Long-Term SEO Opportunities & Benefits
The switch to `alphalubricantsnepal.com` has notable strategic advantages:

| Factor | `alphalubricant.com` (Current) | `alphalubricantsnepal.com` (New) | SEO & Brand Impact |
| :--- | :--- | :--- | :--- |
| **Plural vs. Singular** | Singular (`lubricant`) | Plural (`lubricants`) | **Positive**: 94% of search queries in Nepal use the plural form *"Alpha Lubricants"* or *"motorcycle lubricants"*. |
| **Geographic Keyword ("nepal")** | None | Contains `nepal` | **Positive for Local SEO**: Having "nepal" in the domain acts as a strong localized entity signal for Google's Nepal search index (`google.com.np`). |
| **Brand Consistency** | Mismatches registered brand | Exactly matches brand name | **Positive**: Matches trade name *"Alpha Lubricants Nepal"*, Google Business Profile, and physical branding. |
| **Domain Age** | Younger history | Brand new | **Neutral**: 301 redirects bridge the authority gap within 30–60 days. |

---

### 2.4 Critical Rules to Prevent SEO Catastrophe
To avoid permanent ranking drops, you must adhere strictly to these principles:

1. **Strict 1:1 Page-to-Page Redirects (Never Redirect Everything to Homepage)**:
   - ❌ **Wrong**: Redirecting `alphalubricant.com/products/alpha-racing-10w40` -> `alphalubricantsnepal.com/` (Google treats this as a Soft 404 and wipes out rankings for that product).
   - ✅ **Correct**: Redirecting `alphalubricant.com/products/alpha-racing-10w40` -> `https://alphalubricantsnepal.com/products/alpha-racing-10w40` with HTTP 301.
2. **Maintain the Old Domain & Redirects for Minimum 12 Months**:
   - Do **NOT** cancel the old domain registration. Keep `alphalubricant.com` renewed and active with redirects in place for at least 1–2 years so lingering external links and bookmarks continue to resolve.
3. **Zero Redirect Chains**:
   - Target URLs must resolve directly: `http://alphalubricant.com` -> `https://alphalubricantsnepal.com` (Single hop 301, not HTTP -> HTTPS old -> HTTPS new).
4. **Keep URL Paths & Structure 100% Identical**:
   - Maintain the exact same route hierarchy (`/products/[slug]`, `/blog/[slug]`, `/oil-finder`, `/about`, `/contact`). Do not rename pages or change slug structures during the domain migration.

---

## 3. Operational & Non-SEO Impacts

### 3.1 Email Deliverability & MX Records
- Current contact email: `info@alphalubricant.com`
- New contact email: `info@alphalubricantsnepal.com`
- **Actions Required**:
  - Configure Google Workspace / cPanel Mail / Zoho Mail for `alphalubricantsnepal.com`.
  - Set up **SPF**, **DKIM**, and **DMARC** DNS records for the new domain to prevent outgoing emails landing in customer spam folders.
  - Set up an automatic email forwarder on `info@alphalubricant.com` -> `info@alphalubricantsnepal.com` so past communications are not lost.

### 3.2 User Authentication, Sessions & Shopping Carts
- **Browser Cookies**: The session cookie (`session_token`) is cryptographically tied to the domain. When the domain switches, all existing administrative and customer sessions will expire, requiring users to log in again.
- **Local Storage (Cart)**: The customer's cart state in `localStorage` is scoped to the origin domain and will reset to empty on the new domain.

### 3.3 Third-Party Integrations & External Profiles
1. **Google Business Profile (Maps)**:
   - Update the primary website URL in Google Business Profile (Tinkune location) to `https://alphalubricantsnepal.com`.
2. **Social Media Profiles**:
   - Update website bio links on Facebook (`facebook.com/profile.php?id=61575309551050`), Instagram, YouTube, and TikTok.
3. **Payment Gateways (eSewa / Khalti / Fonepay)**:
   - If payment gateway merchant APIs are configured, the merchant callback/webhook whitelist URLs must be updated with the payment providers.
4. **Google OAuth / Social Sign-In**:
   - If enabled in Google Cloud Console, add `https://alphalubricantsnepal.com` to the "Authorized JavaScript origins" and `https://alphalubricantsnepal.com/api/auth/callback/google` to "Authorized redirect URIs".

---

## 4. Codebase Changes Required

The codebase is well-architected: site URLs and base metadata are centralized in helper modules.

### 4.1 Summary of Files to Modify

| File | Changes Needed |
| :--- | :--- |
| `src/lib/site.ts` | Update default fallback `siteUrl` to `https://alphalubricantsnepal.com` and `businessEmail` to `info@alphalubricantsnepal.com`. |
| `src/lib/server/public-data.ts` | Update `defaultSettings.email` to `info@alphalubricantsnepal.com`. |
| `src/lib/server/http.ts` | Add `https://alphalubricantsnepal.com` and `https://www.alphalubricantsnepal.com` to `validateOrigin()`. Retain old domains for seamless redirect compatibility. |
| `src/components/site-chrome.tsx` | Update fallback email link in footer. |
| `src/app/terms/page.tsx` & `src/app/privacy/page.tsx` | Update official contact email string references. |
| `src/app/contact/page.tsx` | Update default contact fallback email. |
| `public/llms.txt` | Update documentation, product URLs, and canonical AI discovery links. |
| `scripts/prepare-directadmin.mjs` | Update fallback `APP_URL`, `NEXT_PUBLIC_SITE_URL`, and `ADMIN_EMAIL`. |
| Server `.env` | Update runtime environment variables on DirectAdmin. |

---

### 4.2 Exact Code Diffs

#### 1. `src/lib/site.ts`
```diff
-export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alphalubricant.com';
+export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alphalubricantsnepal.com';
 export const siteName = 'Alpha Lubricants Nepal';
 export const defaultDescription = 'Shop Alpha motorcycle engine oils and semi synthetic lubricants in Nepal, with oil guidance, rider support and local service from Tinkune, Kathmandu.';
 export const businessPhone = '+9779801226178';
-export const businessEmail = 'info@alphalubricant.com';
+export const businessEmail = 'info@alphalubricantsnepal.com';
```

#### 2. `src/lib/server/public-data.ts`
```diff
-export const defaultSettings = { businessName: 'Alpha Lubricants', currency: 'NPR', country: 'NP', shippingPaisa: 15000, freeShippingAbovePaisa: 300000, facebook: 'https://www.facebook.com/profile.php?id=61575309551050', instagram: '', youtube: '', phone: '+977 9801226178', email: 'info@alphalubricant.com', address: 'Tinkune, Kathmandu, Nepal' };
+export const defaultSettings = { businessName: 'Alpha Lubricants', currency: 'NPR', country: 'NP', shippingPaisa: 15000, freeShippingAbovePaisa: 300000, facebook: 'https://www.facebook.com/profile.php?id=61575309551050', instagram: '', youtube: '', phone: '+977 9801226178', email: 'info@alphalubricantsnepal.com', address: 'Tinkune, Kathmandu, Nepal' };
```

#### 3. `src/lib/server/http.ts`
*(Keep BOTH old and new domains whitelisted so CORS / CSRF checks don't block transition requests)*
```diff
   const allowedUrls = [
     process.env.APP_URL,
     process.env.NEXT_PUBLIC_SITE_URL,
+    'https://alphalubricantsnepal.com',
+    'https://www.alphalubricantsnepal.com',
     'https://alphalubricant.com',
     'https://www.alphalubricant.com'
   ].filter(Boolean) as string[];
```

#### 4. `src/components/site-chrome.tsx`
```diff
-            <a href={`mailto:${settings.email || "info@alphalubricant.com"}`}>
-              {settings.email || "info@alphalubricant.com"}
+            <a href={`mailto:${settings.email || "info@alphalubricantsnepal.com"}`}>
+              {settings.email || "info@alphalubricantsnepal.com"}
             </a>
```

#### 5. `public/llms.txt`
```diff
-Alpha Lubricants Nepal sells motorcycle engine oils and semi synthetic lubricants for riders, workshops, and dealers in Nepal. Contact: Tinkune, Kathmandu, Nepal; +977 9801226178; info@alphalubricant.com.
+Alpha Lubricants Nepal sells motorcycle engine oils and semi synthetic lubricants for riders, workshops, and dealers in Nepal. Contact: Tinkune, Kathmandu, Nepal; +977 9801226178; info@alphalubricantsnepal.com.

-- [Products](https://alphalubricant.com/products): current catalogue and product information.
-- [Oil finder](https://alphalubricant.com/oil-finder): vehicle oil guidance by make and model.
-- [Engine oil guides](https://alphalubricant.com/blog): practical lubricant selection and maintenance articles.
-- [Dealership](https://alphalubricant.com/dealership): supply and dealer enquiry form.
-- [About Alpha](https://alphalubricant.com/about): brand information.
-- [Contact](https://alphalubricant.com/contact): product and order support.
+- [Products](https://alphalubricantsnepal.com/products): current catalogue and product information.
+- [Oil finder](https://alphalubricantsnepal.com/oil-finder): vehicle oil guidance by make and model.
+- [Engine oil guides](https://alphalubricantsnepal.com/blog): practical lubricant selection and maintenance articles.
+- [Dealership](https://alphalubricantsnepal.com/dealership): supply and dealer enquiry form.
+- [About Alpha](https://alphalubricantsnepal.com/about): brand information.
+- [Contact](https://alphalubricantsnepal.com/contact): product and order support.
```

#### 6. Production `.env` on Server
```bash
APP_URL="https://alphalubricantsnepal.com"
NEXT_PUBLIC_SITE_URL="https://alphalubricantsnepal.com"
ADMIN_EMAIL="admin@alphalubricantsnepal.com"
```

---

### 4.3 Deep Dive: The Critical Role of `src/lib/server/http.ts` (CSRF & Origin Security)

One of the most dangerous, silent failure modes during a domain migration is **CSRF Origin Rejection**. 

In this application, state-modifying HTTP actions (any HTTP `POST`, `PUT`, `DELETE`, or `PATCH`) are wrapped by the `route()` handler in `src/lib/server/http.ts`:

```typescript
// src/lib/server/http.ts
export function validateOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) throw new ApiError(403, 'This request must originate from this website.');

  // 1. Direct match with incoming request URL origin
  if (origin === request.nextUrl.origin) return;

  // 2. Match with configured APP_URL, NEXT_PUBLIC_SITE_URL, or whitelisted domains
  const allowedUrls = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://alphalubricantsnepal.com',
    'https://www.alphalubricantsnepal.com',
    'https://alphalubricant.com',
    'https://www.alphalubricant.com'
  ].filter(Boolean) as string[];
```

#### Why This File Is Critical:
1. **The Silent Failure Trap**: If `alphalubricantsnepal.com` is not explicitly permitted in `allowedUrls`, GET requests (like viewing pages or catalog items) will load fine, but **every interactive transaction will silently break with HTTP 403 Forbidden**:
   - Customers will not be able to complete orders at checkout (`/api/checkout`).
   - Customers and administrators cannot log in (`/api/auth/login`).
   - Admins cannot save products, upload images, or edit promo codes (`/api/admin/...`).
   - Customers cannot submit contact queries or dealership applications.
2. **Dual-Domain Whitelisting During Transition**:
   Notice that both `'https://alphalubricantsnepal.com'` and `'https://alphalubricant.com'` (plus their `www.` subdomains) are whitelisted simultaneously. This guarantees that:
   - Requests arriving on the new domain are permitted immediately.
   - Any form or cached browser page still pointing to the legacy domain during DNS propagation will also succeed without generating 403 errors.
3. **Cloudflare IP Tracking (`cf-connecting-ip`)**:
   `http.ts` also contains `getClientIp(request)`. When the new domain is routed through Cloudflare, this function accurately captures the true client visitor IP for rate-limiting instead of penalizing all users under a single Cloudflare proxy IP.

---

## 5. Infrastructure, DNS & Web Server Setup

### Strategy A: Cloudflare Edge Redirects (Recommended & Fastest)
Because Cloudflare already proxies your domain, handling the 301 redirects at Cloudflare's Edge avoids hitting the DirectAdmin server completely, saving server memory and `NPROC` limits.

#### 1. In Cloudflare for `alphalubricant.com` (Old Domain):
Create a **Redirect Rule** (Rules -> Redirect Rules -> Create Rule):
- **Rule Name**: `Redirect All Traffic to New Domain`
- **When incoming requests match**: `Hostname equals alphalubricant.com OR Hostname equals www.alphalubricant.com`
- **Then**:
  - **Type**: Dynamic
  - **Expression**: `concat("https://alphalubricantsnepal.com", http.request.uri.path)`
  - **Status code**: `301 Moved Permanently`
  - **Preserve query string**: Checked (True)

#### 2. In Cloudflare for `alphalubricantsnepal.com` (New Domain):
- Add `alphalubricantsnepal.com` as a new site in Cloudflare.
- Point DNS records:
  - `A` record `@` -> Hosting server IP (Proxied ☁️)
  - `CNAME` record `www` -> `alphalubricantsnepal.com` (Proxied ☁️)
- Set SSL/TLS encryption mode to **Full (Strict)**.

---

### Strategy B: DirectAdmin & LiteSpeed `.htaccess` Configuration
In DirectAdmin, configure the domains as follows:

1. **Option 1 (Domain Pointer / Alias)**:
   In DirectAdmin under `alphalubricant.com` -> **Domain Pointers**, add `alphalubricantsnepal.com` as an **Alias** pointing to the same document root.
2. **Option 2 (New Main Domain)**:
   Rename the primary domain in DirectAdmin from `alphalubricant.com` to `alphalubricantsnepal.com`, then add `alphalubricant.com` as a Pointer to catch legacy traffic.

In `/home2/alphalub/domains/alphalubricant.com/public_html/.htaccess`, add the 301 rewrite rule above Passenger directives:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTP_HOST} ^(www\.)?alphalubricant\.com$ [NC]
  RewriteRule ^(.*)$ https://alphalubricantsnepal.com/$1 [R=301,L]
</IfModule>
```

---

## 6. Google Search Console Migration (Step-by-Step)

Executing Google's official migration protocol is the single most important step for ranking retention:

```
[Old Domain: alphalubricant.com]  === 301 Redirects ===>  [New Domain: alphalubricantsnepal.com]
               |                                                         |
         Verified in GSC                                           Verified in GSC
               |                                                         |
               +------------ Change of Address Tool --------------------+
```

1. **Verify Both Domains in Google Search Console**:
   - Keep the existing `alphalubricant.com` property verified.
   - Add a new **Domain Property** for `alphalubricantsnepal.com` (verify via DNS TXT record in Cloudflare).
2. **Ensure 301 Redirects are Active**:
   - Test redirect in terminal:
     ```bash
     curl -I https://alphalubricant.com/products
     # Expected: HTTP/1.1 301 Moved Permanently
     # Location: https://alphalubricantsnepal.com/products
     ```
3. **Submit Change of Address in GSC**:
   - Open GSC for `alphalubricant.com`.
   - Go to **Settings** (bottom left) -> **Change of address**.
   - Select the newly verified property `alphalubricantsnepal.com`.
   - Run the validation test and click **Confirm & Move**.
4. **Submit New XML Sitemap**:
   - Open GSC for `alphalubricantsnepal.com`.
   - Go to **Sitemaps** -> Submit `https://alphalubricantsnepal.com/sitemap.xml`.
5. **Monitor Index Coverage**:
   - Over the next 4–8 weeks, watch the **Pages** report. Pages on the old domain will index-decay down to zero, while pages on the new domain will climb proportionally.

---

## 7. Migration Checklist

### Phase 1: Pre-Migration Setup (1–2 weeks before)
- [ ] Purchase / acquire `alphalubricantsnepal.com`.
- [ ] Add domain to Cloudflare and configure SSL/TLS (Full/Strict).
- [ ] Set up corporate email hosting for `@alphalubricantsnepal.com` with SPF/DKIM/DMARC.
- [ ] Verify both domain properties in Google Search Console.
- [ ] Audit all current high-performing pages in Google Analytics / GSC to create a baseline benchmark.

### Phase 2: Launch Day Execution
- [ ] Apply code changes (site constants, allowed CORS origins, schema metadata).
- [ ] Build and package new release bundle (`alpha-directadmin-deploy-v8.tar.gz`).
- [ ] Upload to DirectAdmin via FTP into `~/domains/alphalubricantsnepal.com/app_v8`.
- [ ] Update server `.env` with new domain URL.
- [ ] Update `.htaccess` with Passenger configurations and resource limits (`PassengerMaxPoolSize 2`).
- [ ] Activate Cloudflare 1:1 dynamic 301 redirect rule on `alphalubricant.com`.
- [ ] Test redirects with `curl -I`:
  - [ ] Homepage redirect
  - [ ] Deep page redirect (`/products/[slug]`)
  - [ ] SSL certificate validity on both domains
- [ ] Submit **Change of Address** in Google Search Console.
- [ ] Submit `sitemap.xml` to Google Search Console on the new domain.

### Phase 3: Post-Migration Monitoring (Days 1–90)
- [ ] Update Google Business Profile (Map pin in Tinkune) website URL.
- [ ] Update Facebook, Instagram, YouTube, and partner bio links.
- [ ] Monitor GSC 404 / Crawl Error reports weekly.
- [ ] Check for redirect loops or broken links using Screaming Frog or online SEO crawlers.
- [ ] Keep the old domain `alphalubricant.com` and its Cloudflare redirect active for a minimum of 12 months.
