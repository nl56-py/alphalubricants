$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
& (Join-Path $PSScriptRoot 'local-db.ps1') -Action Start
$listener = Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue
if (!$listener) {
  $nodePath = (Get-Command node).Source
  Start-Process -FilePath $nodePath -ArgumentList 'node_modules/next/dist/bin/next dev --webpack --hostname 0.0.0.0 --port 3100' -WorkingDirectory $projectPath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projectPath '.local/web.log') -RedirectStandardError (Join-Path $projectPath '.local/web-error.log') | Out-Null
}
Write-Output 'Local website: http://localhost:3100'
Write-Output 'Admin: http://localhost:3100/admin'
Write-Output 'Allow a few moments for startup. Credentials: .local/credentials.txt. Logs: .local/web.log and .local/web-error.log.'
