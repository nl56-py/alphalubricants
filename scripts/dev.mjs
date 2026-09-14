import { spawn, execSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';

const projectRoot = process.cwd();
const localDir = path.join(projectRoot, '.local');
const configPath = path.join(localDir, 'mysql.ini');
const clientPath = path.join(localDir, 'mysql-client.ini');
const pidPath = path.join(localDir, 'mysql.pid');
const serverBinary = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe';
const adminBinary = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqladmin.exe';
const mysqlPort = 3308;

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(port, maxAttempts = 50, intervalMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkPort(port)) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

async function main() {
  const isRunning = await checkPort(mysqlPort);
  let startedByUs = false;
  let mysqlProc = null;

  if (isRunning) {
    console.log(`\x1b[32m✔ Local MySQL is already running on 127.0.0.1:${mysqlPort}\x1b[0m`);
  } else {
    if (!fs.existsSync(configPath)) {
      console.error(`\x1b[31m✖ Local database is not initialized.\x1b[0m`);
      console.error(`Please run: powershell -ExecutionPolicy Bypass -File scripts/local-db.ps1 -Action Init`);
      process.exit(1);
    }

    if (!fs.existsSync(serverBinary)) {
      console.error(`\x1b[31m✖ MySQL Server binary not found at:\x1b[0m ${serverBinary}`);
      console.error(`Please install MySQL Server 8.0 or update scripts/dev.mjs.`);
      process.exit(1);
    }

    console.log(`\x1b[36mℹ Starting isolated local MySQL on 127.0.0.1:${mysqlPort}...\x1b[0m`);
    mysqlProc = spawn(serverBinary, [`--defaults-file=${configPath}`], {
      stdio: 'ignore',
      windowsHide: true,
      detached: false,
    });
    startedByUs = true;

    mysqlProc.on('error', (err) => {
      console.error(`\x1b[31m✖ Failed to spawn MySQL:\x1b[0m`, err);
    });

    const ready = await waitForPort(mysqlPort);
    if (!ready) {
      console.error(`\x1b[31m✖ Timed out waiting for MySQL on 127.0.0.1:${mysqlPort}.\x1b[0m`);
      console.error(`Check log at: ${path.join(localDir, 'mysql-error.log')}`);
      if (mysqlProc && !mysqlProc.killed) mysqlProc.kill();
      process.exit(1);
    }

    console.log(`\x1b[32m✔ Local MySQL is ready on 127.0.0.1:${mysqlPort}\x1b[0m`);
  }

  // Filter out any custom arguments passed to dev.mjs
  const extraArgs = process.argv.slice(2).filter((arg) => arg !== '--keep-db');
  const keepDb = process.argv.includes('--keep-db');

  const nextBin = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
  const nextArgs = ['dev', '--hostname', '0.0.0.0', ...extraArgs];

  console.log(`\x1b[36mℹ Launching Next.js development server...\x1b[0m\n`);

  const nextProc = spawn(process.execPath, [nextBin, ...nextArgs], {
    stdio: 'inherit',
    cwd: projectRoot,
    env: process.env,
  });

  let exiting = false;
  async function cleanup(code = 0) {
    if (exiting) return;
    exiting = true;

    if (nextProc && !nextProc.killed) {
      try { nextProc.kill(); } catch {}
    }

    if (startedByUs && !keepDb) {
      console.log(`\n\x1b[33mℹ Stopping local MySQL...\x1b[0m`);
      try {
        execSync(`"${adminBinary}" "--defaults-extra-file=${clientPath}" shutdown`, { stdio: 'ignore' });
      } catch {
        if (fs.existsSync(pidPath)) {
          try {
            const pid = parseInt(fs.readFileSync(pidPath, 'utf8').trim(), 10);
            if (!isNaN(pid)) process.kill(pid);
          } catch {}
        }
        if (mysqlProc && !mysqlProc.killed) {
          try { mysqlProc.kill(); } catch {}
        }
      }
      console.log(`\x1b[32m✔ Local MySQL stopped.\x1b[0m`);
    } else if (startedByUs && keepDb) {
      console.log(`\x1b[36mℹ Keeping local MySQL active in the background (--keep-db).\x1b[0m`);
    }

    process.exit(code);
  }

  process.on('SIGINT', () => cleanup(0));
  process.on('SIGTERM', () => cleanup(0));

  nextProc.on('exit', (code) => {
    cleanup(code ?? 0);
  });
}

main().catch((err) => {
  console.error('\x1b[31mUnexpected error:\x1b[0m', err);
  process.exit(1);
});
