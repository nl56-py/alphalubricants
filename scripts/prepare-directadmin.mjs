import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 [DirectAdmin Packager] Starting build and package process...');

// 1. Generate Prisma Client (including Linux binary targets)
console.log('📦 Step 1: Generating Prisma Client with Linux binary engines...');
execSync('npx prisma generate', { cwd: rootDir, stdio: 'inherit' });

// 2. Build Next.js in standalone mode
console.log('🔨 Step 2: Building Next.js application...');
execSync('npx next build', { cwd: rootDir, stdio: 'inherit' });

const standaloneDir = path.join(rootDir, '.next', 'standalone');
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');

if (!fs.existsSync(standaloneDir)) {
  console.error('❌ Error: .next/standalone folder not found. Check next.config.ts output: "standalone"');
  process.exit(1);
}

// 3. Copy static assets into standalone folder
console.log('📂 Step 3: Copying static assets (.next/static)...');
fs.cpSync(staticSrc, staticDest, { recursive: true });

console.log('📂 Step 4: Copying public assets (public/)...');
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
}

// 4. Create an upload-ready deployment directory
const deployDir = path.join(rootDir, 'deploy_directadmin');
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

console.log('📋 Step 5: Preparing deploy_directadmin folder...');
fs.cpSync(standaloneDir, deployDir, { recursive: true });

// Copy prisma schema so migrations or introspection can work on server if needed
const prismaDeployDir = path.join(deployDir, 'prisma');
fs.mkdirSync(prismaDeployDir, { recursive: true });
fs.copyFileSync(path.join(rootDir, 'prisma', 'schema.prisma'), path.join(prismaDeployDir, 'schema.prisma'));

// Create an example .env file for DirectAdmin
const envSampleContent = `# DirectAdmin Production Environment Variables
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# MariaDB / MySQL Connection in DirectAdmin
# Format: mysql://<db_user>:<db_password>@localhost:3306/<db_name>
DATABASE_URL="mysql://your_db_user:your_db_password@localhost:3306/your_db_name"

# Your domain URL
APP_URL="https://yourdomain.com"
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"

# Admin user credentials
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="YourStrongPassword123!"
ADMIN_NAME="Alpha Lubricants Admin"
TRUST_PROXY="true"
`;

fs.writeFileSync(path.join(deployDir, '.env.production.example'), envSampleContent, 'utf8');

// Copy .htaccess for LiteSpeed / Apache reverse proxy if needed
const htaccessContent = `# LiteSpeed / DirectAdmin Rewrite rules for Node.js
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>
`;
fs.writeFileSync(path.join(deployDir, '.htaccess'), htaccessContent, 'utf8');

console.log('\n======================================================');
console.log('✅ DirectAdmin deployment package ready in:');
console.log(`   📁 ${deployDir}`);
console.log('======================================================');
console.log('How to deploy:');
console.log('1. Zip all files inside the "deploy_directadmin" folder.');
console.log('2. In DirectAdmin File Manager, upload and extract the zip to your app root (e.g. /home/user/domains/domain.com/public_html or nodeapp).');
console.log('3. In DirectAdmin > Setup Node.js App:');
console.log('   - Application root: your uploaded folder');
console.log('   - Application startup file: server.js');
console.log('   - Node version: 20.x or 22.x');
console.log('   - Environment: production');
console.log('4. Create your MariaDB database in DirectAdmin and set DATABASE_URL in environment variables.');
console.log('5. Click "Start App" or restart.');
console.log('======================================================\n');
