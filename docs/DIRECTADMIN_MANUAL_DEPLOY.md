# Alpha Lubricants DirectAdmin Deployment Guide

This guide documents how `https://alphalubricant.com` is currently deployed on DirectAdmin and how to deploy future changes.

Do not commit real DirectAdmin, database, or admin passwords to the repository. Keep them only in DirectAdmin and the server `.env` file.

## Current Production Setup

- DirectAdmin panel: `https://dacloud.himalayan.host:2222`
- DirectAdmin user: `alphalub`
- Domain: `alphalubricant.com`
- Server IP: `36.253.137.4`
- Active Node app root: `domains/alphalubricant.com/app_v6`
- Startup file: `server.js`
- Node version: `22.x`
- App mode: `production`
- Runtime environment file: `domains/alphalubricant.com/app_v6/.env`

The old static `public_html/index.html` was renamed so DirectAdmin serves the Node.js app at the domain root.

## Seeded Admin User

The production seed uses these environment variables:

```env
ADMIN_EMAIL="admin@alphalubricant.com"
ADMIN_NAME="Alpha Lubricants Admin"
ADMIN_PASSWORD="<stored only in the server .env>"
```

Login URL:

```text
https://alphalubricant.com/admin
```

The seed script preserves an existing admin password. If the admin user already exists, running `npm run db:seed` again will not overwrite its password.

## Database Setup

The production database is a DirectAdmin MySQL/MariaDB database created under the `alphalub` hosting account.

The app connects using `DATABASE_URL` in:

```text
domains/alphalubricant.com/app_v6/.env
```

Format:

```env
DATABASE_URL="mysql://<db_user>:<db_password>@localhost:3306/<db_name>"
```

Other required production values:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
APP_URL="https://alphalubricant.com"
NEXT_PUBLIC_SITE_URL="https://alphalubricant.com"
UPLOAD_DIR="./storage/uploads"
TRUST_PROXY="true"
```

Applied migrations:

```text
202609080001_initial
202609080002_hero_video
202609090001_public_features
202609090002_hero_mobile_video
202609130001_schema_compatibility
```

Seed command used:

```bash
npm run db:seed
```

The seed creates initial settings, product catalog, hero/content entries, and the admin user if missing.

## Security, SEO, AEO, GEO Setup

Security headers are configured in `next.config.ts`, including:

- Content Security Policy
- Strict Transport Security
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- Cross-Origin policies

SEO/AEO/GEO configuration is in:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/products/[slug]/page.tsx`
- `src/lib/site.ts`
- `public/robots.txt`
- `public/llms.txt`
- `src/app/sitemap.ts` or the generated sitemap route

The live site was verified with production canonical and Open Graph URLs:

```text
https://alphalubricant.com
```

## How The App Was Deployed

1. Built the Next.js app in standalone mode using production URLs.
2. Packaged `.next/standalone`, `.next/static`, `public`, `prisma`, seed scripts, and deployment files.
3. Uploaded the archive to:

```text
domains/alphalubricant.com/
```

4. Extracted it into:

```text
domains/alphalubricant.com/app_v6
```

5. Copied the production `.env` into the app root.
6. Created a DirectAdmin Node.js Selector app:

```text
Application root: domains/alphalubricant.com/app_v6
Application URL: /
Startup file: server.js
Node version: 22.x
Mode: production
```

7. Installed modules from DirectAdmin Node.js Selector.
8. Ran migrations:

```bash
npm run db:migrate
```

9. Ran seed:

```bash
npm run db:seed
```

10. Restarted the Node.js app.

## Deploying Future Changes

From the project folder on your computer:

```bash
npm run typecheck
npm test
npm run package:da
tar -czf alpha-directadmin-deploy-vNEXT.tar.gz -C deploy_directadmin .
```

Upload `alpha-directadmin-deploy-vNEXT.tar.gz` to:

```text
domains/alphalubricant.com/
```

In DirectAdmin File Manager:

1. Create a new folder, for example:

```text
domains/alphalubricant.com/app_v7
```

2. Extract the archive into that folder.
3. Copy `.env` from the previous app folder into the new app folder.
4. In Setup Node.js App, change or recreate the app so it points to the new folder.
5. Click the Node.js Selector install modules action.
6. Run:

```bash
npm run db:migrate
npm run db:seed
```

7. Restart the app.

Keep the previous folder, such as `app_v6`, until the new deployment is verified. If something breaks, point Node.js Selector back to the previous app root and restart.

## Verification Commands

After deploying, check:

```bash
curl -I https://alphalubricant.com/
curl https://alphalubricant.com/api/health
curl -I https://alphalubricant.com/products
curl -I https://alphalubricant.com/admin
curl -I https://alphalubricant.com/robots.txt
curl -I https://alphalubricant.com/sitemap.xml
curl -I https://alphalubricant.com/llms.txt
```

Expected:

- `/api/health` returns `{"ok":true,"database":"connected"}`.
- Main pages return `200`.
- Canonical and Open Graph URLs use `https://alphalubricant.com`.
- Security headers are present.
- Admin login works.
