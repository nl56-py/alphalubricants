# Local database

This project has a separate development MySQL instance bound to `127.0.0.1:3308`. It uses the installed MySQL 8.0 binary with its own configuration, data and logs under the ignored `.local/` directory. Existing Windows services and their databases are untouched. This instance is a hidden background process, not a Windows service.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1 -Action Status
powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1 -Action Start
powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1 -Action Stop
```

The one-time `Init` action generates random credentials and refuses to replace an existing `.env` or local database configuration. It requires `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe`; edit the two binary paths if your installation differs.

The application connects as `alpha_local`, which has privileges only on `alpha_dev` and `alpha_test`. Its password and the seeded administrator credentials are saved in the ignored `.env` and `.local/credentials.txt`. The separate root client configuration stays in `.local/mysql-client.ini`. Never publish these files or reuse their credentials in production.

`alpha_dev` is for the local app. `alpha_test` is a separate migrated database for concurrency and transactional tests. Seed products have zero stock until an administrator verifies inventory. Any local test inventory is development fixture data, not a statement about real stock.

```powershell
npm run db:migrate
npm run db:seed
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

The application URL is `http://localhost:3100`. The startup script starts MySQL and launches Next.js in a hidden background process. Run it again after restarting Windows. Stop and restart the Next.js process after changing `.env`. See `.local/mysql-error.log` for database startup diagnostics and `.local/web-error.log` for web startup errors.

Open `/account/login` and sign in with the administrator email and password in `.local/credentials.txt`, then open `/admin`. Hero slides are managed under `/admin/content`; select the HERO content type and upload a poster image and optionally an MP4/WebM background video. Products are managed under `/admin/products`.
