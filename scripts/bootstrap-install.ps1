# MetaGO Lifeform Kit - Bootstrap Installer (ASCII-only, no BOM)
# Usage: irm https://gitee.com/metago/metagolifeform/raw/main/scripts/bootstrap-install.ps1 | iex
#
# This script downloads the repo and runs install.ps1 (which needs local files)

$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  MetaGO Lifeform Kit - Bootstrap' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

# 1. Determine clone target directory
$targetDir = Join-Path $env:TEMP 'metago-lifeform-install'

# 2. Clean up old clone if exists
if (Test-Path $targetDir) {
    Write-Host '[1/4] Cleaning up previous download...' -ForegroundColor Yellow
    Remove-Item -Path $targetDir -Recurse -Force
}

# 3. Clone the repository
Write-Host '[2/4] Downloading MetaGO Lifeform Kit from Gitee...' -ForegroundColor Yellow
$cloneUrl = 'https://gitee.com/metago/metagolifeform.git'
& git clone --depth 1 $cloneUrl $targetDir 2>&1 | ForEach-Object { Write-Host "  $_" }

if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host '[ERROR] git clone failed!' -ForegroundColor Red
    Write-Host 'Please ensure git is installed and accessible.' -ForegroundColor Red
    Write-Host 'Or download manually from: https://gitee.com/metago/metagolifeform' -ForegroundColor Yellow
    return
}

Write-Host '  Download complete!' -ForegroundColor Green

# 4. Run the actual installer
Write-Host ''
Write-Host '[3/4] Running install.ps1...' -ForegroundColor Yellow
Write-Host ''
$installScript = Join-Path $targetDir 'scripts\install.ps1'

if (-not (Test-Path $installScript)) {
    Write-Host "[ERROR] install.ps1 not found at: $installScript" -ForegroundColor Red
    return
}

# Execute the installer from the cloned repo (so $PSScriptRoot works)
& $installScript @args

# 5. Cleanup option
Write-Host ''
Write-Host '[4/4] Installation process complete!' -ForegroundColor Green
Write-Host ''
Write-Host "  Cloned repo location: $targetDir" -ForegroundColor Gray
Write-Host "  (You can delete this folder after installation if desired)" -ForegroundColor Gray
Write-Host ''
