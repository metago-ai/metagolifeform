#requires -Version 5.1
<#
.SYNOPSIS
    MetaGO 版本戳同步脚本（sync-versions.ps1 · 36.9.3 新增，RELEASE-CHECKLIST §5 引用）
.DESCRIPTION
    以根 package.json version 为唯一事实源，同步所有版本戳：
    AGENTS.md（基于…V）、GENOME.json、INDEX 表、docs/MANIFEST.json、各子包 rules_version/metago_version。
    纯文本级替换（不做 JSON 往返，避免格式化抖动）。默认只报告差异；-Apply 才写入。幂等。
.EXAMPLE
    .\sync-versions.ps1          # 检查模式（报告漂移）
    .\sync-versions.ps1 -Apply   # 同步模式
#>
[CmdletBinding()]
param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$root = Split-Path -Parent $PSScriptRoot
$pkgText = [System.IO.File]::ReadAllText((Join-Path $root 'package.json'), $utf8)
$ver = ($pkgText | ConvertFrom-Json).version
$V = "V$ver"
Write-Host "== sync-versions | 事实源 package.json = $ver ($V) =="
$drift = 0
function FixFile($path, [scriptblock]$mut) {
  if (-not (Test-Path -LiteralPath $path)) { return }
  $c = [System.IO.File]::ReadAllText($path, $utf8)
  $n = & $mut $c
  if ($n -ne $c) {
    $script:drift++
    if ($Apply) { [System.IO.File]::WriteAllText($path, $n, $utf8); Write-Host "  FIX  $($path.Replace($root,''))" }
    else { Write-Host "  DRIFT $($path.Replace($root,''))" }
  }
}
FixFile (Join-Path $root 'AGENTS.md') { param($c)
  $c -replace '基于《元构全息智能引擎》V\d+\.\d+\.\d+', ('基于《元构全息智能引擎》' + $V) }
FixFile (Join-Path $root 'packages\engine\GENOME.json') { param($c)
  $c -replace '"package_version":\s*"[^"]+"', ('"package_version": "' + $ver + '"') `
     -replace '"metago_version":\s*"[^"]+"', ('"metago_version": "' + $V + '"') }
FixFile (Join-Path $root 'packages\engine\INDEX\skills.json') { param($c)
  $c -replace '"version":\s*"V\d+\.\d+\.\d+"', ('"version": "' + $V + '"') }
FixFile (Join-Path $root 'packages\engine\INDEX\engines.json') { param($c)
  $c -replace '"version":\s*"V\d+\.\d+\.\d+"', ('"version": "' + $V + '"') }
FixFile (Join-Path $root 'docs\MANIFEST.json') { param($c)
  $c -replace '"metago_version":\s*"[^"]+"', ('"metago_version": "' + $V + '"') `
     -replace '"package_version":\s*"[^"]+"', ('"package_version": "' + $ver + '"') }
foreach ($sub in @('algorithms','dev-kit','engine','verify-kit','mcp-server')) {
  FixFile (Join-Path $root ('packages\' + $sub + '\package.json')) { param($c)
    $c -replace '"rules_version":\s*"V\d+\.\d+\.\d+"', ('"rules_version": "' + $V + '"') `
       -replace '"metago_version":\s*"V\d+\.\d+\.\d+"', ('"metago_version": "' + $V + '"') }
}
if ($drift -eq 0) { Write-Host "全部版本戳一致 [OK]" }
elseif ($Apply) { Write-Host "已同步 $drift 处 [OK]" }
else { Write-Host "发现 $drift 处漂移 [WARN] 用 -Apply 同步"; exit 1 }
