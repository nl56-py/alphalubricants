# Local database

This project has a separate development MySQL instance bound to `127.0.0.1:3308`. It uses the installed MySQL 8.0 binary with its own configuration, data and logs under the ignored `.local/` directory. Existing Windows services and their databases are untouched. This instance is a hidden background process, not a Windows service.

```powershell
# Unified development command (starts local MySQL and Next.js simultaneously)
npm run dev

# Database control scripts
npm run db:status
npm run db:start
npm run db:stop
```

The one-time `Init` action generates random credentials and refuses to replace an existing `.env` or local database configuration. It requires `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe`; edit the two binary paths if your installation differs.

The application connects as `alpha_local`, which has privileges only on `alpha_dev` and `alpha_test`. Its password and the seeded administrator credentials are saved in the ignored `.env` and `.local/credentials.txt`. The separate root client configuration stays in `.local/mysql-client.ini`. Never publish these files or reuse their credentials in production.

`alpha_dev` is for the local app. `alpha_test` is a separate migrated database for concurrency and transactional tests. Seed products have zero stock until an administrator verifies inventory. Any local test inventory is development fixture data, not a statement about real stock.

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

The application URL is `http://localhost:3000` (or `http://localhost:3100` if launched via `scripts/start-local.ps1`). Running `npm run dev` automatically checks if the local MySQL database on port 3308 is running, starts it if it isn't, and launches Next.js with live terminal output. When stopped with `Ctrl+C`, it gracefully shuts down both. To keep the database running when stopping Next.js, pass `--keep-db`: `npm run dev -- --keep-db`. To run Next.js without database management, use `npm run dev:web`.

Open `/account/login` and sign in with the administrator email and password in `.local/credentials.txt`, then open `/admin`. Hero slides are managed under `/admin/content`; select the HERO content type and upload a poster image and optionally an MP4/WebM background video. Products are managed under `/admin/products`.
