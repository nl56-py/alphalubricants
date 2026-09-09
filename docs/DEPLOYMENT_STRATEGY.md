# Deployment Strategy: Alpha Lubricants

This document outlines the production deployment strategy for Alpha Lubricants (**Next.js 16 + React 19 + Prisma ORM + MariaDB/MySQL**) targeting cost-effective hosting on **Himalayan Host DirectAdmin** (~NPR 1,500/year plan) and hybrid options.

---

## 1. Architecture Overview

* **Frontend & Backend**: Next.js 16 (App Router) running in **standalone mode**.
* **Database Engine**: **MariaDB 10.x+** or MySQL 8.x running on the DirectAdmin server.
* **ORM / Database Client**: **Prisma Client** connecting over `localhost:3306` via standard MySQL protocol (`provider = "mysql"`).
* **Process / Web Server**: LiteSpeed Web Server / Apache with Phusion Passenger via DirectAdmin's **Setup Node.js App**.
* **Entry Point**: `server.js` at the application root which binds to DirectAdmin's assigned `PORT`.

> [!NOTE]
> **Prisma and MariaDB**: MariaDB serves as the persistent database engine. Prisma acts as the query client inside Next.js. They work together seamlessly without needing to replace Prisma.

---

## 2. Primary Strategy: DirectAdmin Native Hosting

### Step 1: Local Packaging
DirectAdmin shared hosting environments enforce process memory limits that can crash memory-heavy compilations (`next build`). To prevent this, build and package locally on your workstation:

```powershell
npm run package:da
```

What `npm run package:da` does:
1. Generates Prisma client with cross-platform Linux query engines (`rhel-openssl-1.0.x`, `rhel-openssl-1.1.x`, `rhel-openssl-3.0.x`, `debian-openssl-3.0.x`).
2. Builds Next.js in standalone mode (`output: 'standalone'`).
3. Copies `public/` and `.next/static/` into `.next/standalone/` to prevent asset 404 errors.
4. Generates an upload-ready directory: `deploy_directadmin/`.

---

### Step 2: Create the MariaDB Database in DirectAdmin
1. Log in to your DirectAdmin control panel.
2. Navigate to **MySQL Management** (or **Databases**).
3. Click **Create New Database**:
   * **Database Name**: e.g. `alpha_prod` (DirectAdmin prepends your account username, e.g. `user_alphaprod`).
   * **Database Username**: e.g. `user_alpha`.
   * **Password**: Generate a secure password and save it securely.
4. Note your database credentials:
   * **Host**: `localhost` (or `127.0.0.1:3306`)
   * **User**: `user_alpha`
   * **Database**: `user_alphaprod`

---

### Step 3: Upload Application Files
1. Open the local `deploy_directadmin/` folder.
2. Select all items inside `deploy_directadmin/` and compress them into a `.zip` archive (e.g., `alpha_deploy.zip`).
3. In DirectAdmin, open **File Manager**.
4. Create or open your application directory (e.g. `/home/username/domains/yourdomain.com/public_html` or `/home/username/nodeapp`).
5. Upload `alpha_deploy.zip` and extract its contents directly into that directory.

Ensure the extracted folder contains:
* `server.js`
* `package.json`
* `.next/`
* `public/`
* `node_modules/`
* `prisma/schema.prisma`
* `.htaccess`

---

### Step 4: Configure Node.js in DirectAdmin
1. In DirectAdmin, search for and open **Setup Node.js App**.
2. Click **Create Application**:
   * **Node.js version**: Choose **20.x** or **22.x**.
   * **Application mode**: `Production`.
   * **Application root**: Path to your extracted files (e.g., `domains/yourdomain.com/public_html`).
   * **Application URL**: Select your live domain or subdomain.
   * **Application startup file**: `server.js`.
3. Scroll to **Environment variables** and add:
   * `DATABASE_URL` = `mysql://user_alpha:YourPassword@localhost:3306/user_alphaprod`
   * `APP_URL` = `https://yourdomain.com`
   * `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.com`
   * `ADMIN_EMAIL` = `admin@yourdomain.com`
   * `ADMIN_PASSWORD` = `<StrongRandomPassword>`
   * `ADMIN_NAME` = `Alpha Lubricants Admin`
   * `TRUST_PROXY` = `true`
4. Click **Save** and then **Start / Restart Application**.

---

### Step 5: Initial Database Migration / Schema Sync

#### Option A: Via DirectAdmin SSH Terminal (Recommended)
Connect via SSH or use the DirectAdmin web terminal, activate the virtual environment created by the Node.js setup, and run:
```bash
npx prisma db push
```
*(Optionally seed data with `npx tsx scripts/seed.ts` if needed).*

#### Option B: Via Local Tunnel or phpMyAdmin
1. In DirectAdmin > MySQL Management, open **phpMyAdmin**.
2. Alternatively, temporarily add your local IP to DirectAdmin's **Access Hosts** (Remote MySQL), change `.env` locally to point to the remote MariaDB server, and run:
   ```powershell
   npm run db:push
   npm run db:seed
   ```
3. Remove your local IP from Access Hosts once finished for security.

---

## 3. Alternative Strategy: Hybrid (Free Vercel + DirectAdmin MariaDB)

If you prefer zero server management for the Next.js frontend with automated Git deployments:

1. **Host App on Vercel**: Connect your GitHub repository to [Vercel](https://vercel.com) (Free Hobby tier).
2. **Database on DirectAdmin**: Use your Himalayan Host DirectAdmin account for MariaDB and professional custom emails (`sales@yourdomain.com`).
3. **Enable Remote MySQL**: In DirectAdmin > **MySQL Management** > **Access Hosts**, add `%` (or Vercel IP range) to allow remote connections.
4. **Vercel Environment Variables**: Set `DATABASE_URL` on Vercel pointing to `mysql://user_alpha:password@your-directadmin-server-ip:3306/user_alphaprod`.

---

## 4. Environment Variables Reference

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | MySQL/MariaDB connection URI | `mysql://user:pass@localhost:3306/dbname` |
| `APP_URL` | Canonical public URL of the app | `https://alphalubricants.com.np` |
| `NEXT_PUBLIC_SITE_URL` | Client-accessible site URL | `https://alphalubricants.com.np` |
| `ADMIN_EMAIL` | Administrator account email | `admin@alphalubricants.com.np` |
| `ADMIN_PASSWORD` | Administrator initial password | `<strong_password>` |
| `ADMIN_NAME` | Administrator display name | `Alpha Admin` |
| `TRUST_PROXY` | Set `true` behind reverse proxies (LiteSpeed/Nginx) | `true` |

---

## 5. Ongoing Updates & Deployment Workflow

When making code changes:
1. Run tests and typecheck:
   ```powershell
   npm run typecheck
   npm test
   ```
2. Build the new package:
   ```powershell
   npm run package:da
   ```
3. Zip `deploy_directadmin/`, upload to DirectAdmin, overwrite existing files, and click **Restart Application** in the **Setup Node.js App** dashboard.
