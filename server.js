// server.js - DirectAdmin / Phusion Passenger startup entry point
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || '2';
const port = process.env.PORT || 3000;
const host = process.env.HOSTNAME || '0.0.0.0';

process.env.PORT = String(port);
process.env.HOSTNAME = String(host);

// If running inside the standalone directory, start it directly
const directStandalone = path.join(__dirname, 'server.js');
const nestedStandalone = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(nestedStandalone)) {
  console.log(`[Alpha Lubricants] Starting from .next/standalone on ${host}:${port}...`);
  require(nestedStandalone);
} else if (__filename !== directStandalone && fs.existsSync(directStandalone)) {
  require(directStandalone);
} else {
  // Standard Next.js server fallback
  const next = require('next');
  const http = require('http');

  const app = next({ dev: false, hostname: host, port: Number(port) });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    http.createServer((req, res) => {
      handle(req, res);
    }).listen(port, host, () => {
      console.log(`[Alpha Lubricants] Server listening on http://${host}:${port}`);
    });
  }).catch((err) => {
    console.error('[Alpha Lubricants] Failed to start server:', err);
    process.exit(1);
  });
}
