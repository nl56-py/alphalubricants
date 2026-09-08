param([ValidateSet('Init', 'Start', 'Stop', 'Status')][string]$Action = 'Status')
$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$localPath = Join-Path $projectPath '.local'
$databasePath = Join-Path $localPath 'mysql'
$configPath = Join-Path $localPath 'mysql.ini'
$clientPath = Join-Path $localPath 'mysql-client.ini'
$serverBinary = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe'
$adminBinary = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqladmin.exe'
$mysqlPort = 3308
function New-LocalPassword {
  $passwordBytes = New-Object byte[] 30
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $generator.GetBytes($passwordBytes)
  $generator.Dispose()
  return [Convert]::ToBase64String($passwordBytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
}
function Write-Utf8File([string]$Path, [string]$Value) {
  [System.IO.File]::WriteAllText($Path, $Value, (New-Object System.Text.UTF8Encoding($false)))
}
function Test-LocalDatabase {
  if (!(Test-Path -LiteralPath $clientPath)) { return $false }
  & $adminBinary "--defaults-extra-file=$clientPath" ping --silent 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}
if (!(Test-Path -LiteralPath $serverBinary)) { throw 'Install MySQL Server 8.0 or update serverBinary/adminBinary in this script.' }
if ($Action -eq 'Status') {
  if (Test-LocalDatabase) { Write-Output 'Alpha local MySQL is ready at 127.0.0.1:3308.' } else { Write-Output 'Alpha local MySQL is stopped or not initialized.' }
  exit 0
}
if ($Action -eq 'Stop') {
  if (Test-LocalDatabase) {
    & $adminBinary "--defaults-extra-file=$clientPath" shutdown
    if ($LASTEXITCODE -ne 0) { throw 'Local database shutdown failed.' }
    Write-Output 'Alpha local MySQL stopped.'
  } else { Write-Output 'Alpha local MySQL is already stopped.' }
  exit 0
}
if (Test-LocalDatabase) { Write-Output 'Alpha local MySQL is already running.'; exit 0 }
$existingListener = Get-NetTCPConnection -LocalPort $mysqlPort -State Listen -ErrorAction SilentlyContinue
if ($existingListener) { throw 'Port 3308 is in use. No existing process was modified.' }
$bootstrapPath = Join-Path $localPath 'mysql-bootstrap.sql'
if ($Action -eq 'Init') {
  if (Test-Path -LiteralPath $configPath) { throw 'Local configuration exists. Use Start; initialization will not replace existing data.' }
  if (Test-Path -LiteralPath (Join-Path $projectPath '.env')) { throw '.env already exists. Initialization will not replace it.' }
  New-Item -ItemType Directory -Path $localPath, $databasePath, (Join-Path $localPath 'mysql-files') -Force | Out-Null
  $rootPassword = New-LocalPassword
  $appPassword = New-LocalPassword
  $adminPassword = New-LocalPassword
  $normalizedData = $databasePath.Replace('\', '/')
  $normalizedLocal = $localPath.Replace('\', '/')
  Write-Utf8File $configPath @"
[mysqld]
basedir=C:/Program Files/MySQL/MySQL Server 8.0
datadir=$normalizedData
port=3308
bind-address=127.0.0.1
mysqlx=0
skip-name-resolve
skip-log-bin
max_connections=40
innodb_buffer_pool_size=64M
performance_schema=OFF
log-error=$normalizedLocal/mysql-error.log
pid-file=$normalizedLocal/mysql.pid
secure-file-priv=$normalizedLocal/mysql-files
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
"@
  Write-Utf8File $bootstrapPath @"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$rootPassword';
CREATE DATABASE IF NOT EXISTS alpha_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS alpha_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'alpha_local'@'127.0.0.1' IDENTIFIED BY '$appPassword';
GRANT ALL PRIVILEGES ON alpha_dev.* TO 'alpha_local'@'127.0.0.1';
GRANT ALL PRIVILEGES ON alpha_test.* TO 'alpha_local'@'127.0.0.1';
"@
  Write-Utf8File $clientPath @"
[client]
host=127.0.0.1
port=3308
protocol=TCP
user=root
password=$rootPassword
"@
  Write-Utf8File (Join-Path $projectPath '.env') @"
DATABASE_URL="mysql://alpha_local:${appPassword}@127.0.0.1:3308/alpha_dev"
TEST_DATABASE_URL="mysql://alpha_local:${appPassword}@127.0.0.1:3308/alpha_test"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@alpha.local"
ADMIN_PASSWORD="$adminPassword"
ADMIN_NAME="Alpha Local Administrator"
TRUST_PROXY="false"
"@
  Write-Utf8File (Join-Path $localPath 'credentials.txt') @"
LOCAL DEVELOPMENT ONLY - do not publish, commit, or reuse these passwords.
Application admin email: admin@alpha.local
Application admin password: $adminPassword
MySQL host: 127.0.0.1
MySQL port: 3308
MySQL application user: alpha_local
MySQL application password: $appPassword
MySQL root password: $rootPassword
Development database: alpha_dev
Isolated test database: alpha_test
"@
  & $serverBinary "--defaults-file=$configPath" --initialize-insecure
  if ($LASTEXITCODE -ne 0) { throw 'Initialization failed. Inspect .local/mysql-error.log; existing configurations were retained.' }
} elseif (!(Test-Path -LiteralPath $configPath)) { throw 'Run Init once before starting this local instance.' }
$serverArguments = @("`"--defaults-file=$configPath`"")
if (Test-Path -LiteralPath $bootstrapPath) { $serverArguments += "`"--init-file=$bootstrapPath`"" }
$localProcess = Start-Process -FilePath $serverBinary -ArgumentList $serverArguments -WindowStyle Hidden -PassThru
for ($attempt = 0; $attempt -lt 45; $attempt++) {
  Start-Sleep -Milliseconds 500
  if (Test-LocalDatabase) {
    if (Test-Path -LiteralPath $bootstrapPath) { Remove-Item -LiteralPath $bootstrapPath }
    Write-Output "Alpha local MySQL ready on 127.0.0.1:3308 (process $($localProcess.Id)). Credentials are in .local/credentials.txt."
    exit 0
  }
  if ($localProcess.HasExited) { throw 'The isolated MySQL process exited. Inspect .local/mysql-error.log.' }
}
throw 'Timed out waiting for local MySQL. Inspect .local/mysql-error.log.'
