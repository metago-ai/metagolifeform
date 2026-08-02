<#
.SYNOPSIS
    MetaGO MCP Server 配置脚本（V36.9.0 - 转发到 cli.js）

.DESCRIPTION
    此脚本已统一到 node cli.js setup-mcp 实现，修复了旧版路径解析 bug。
    支持所有 7 个平台的 MCP 服务器配置（metago + metago-algorithms）。

.PARAMETER Platform
    目标平台：trae / claude-code / cursor / zcode / codebuddy / qoder / codex
    默认：trae

.PARAMETER SkipBuild
    跳过 npm 全局安装步骤

.EXAMPLE
    .\scripts\setup-mcp-server.ps1
    配置 MCP 到 Trae（默认）

.EXAMPLE
    .\scripts\setup-mcp-server.ps1 -Platform claude-code
    配置 MCP 到 Claude Code
#>

[CmdletBinding()]
param(
    [ValidateSet('trae','claude-code','cursor','zcode','codebuddy','qoder','codex')]
    [string]$Platform = 'trae',

    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot
$CliPath = Join-Path $ScriptDir "cli.js"

if (-not (Test-Path $CliPath)) {
    Write-Host "[Error] cli.js not found: $CliPath" -ForegroundColor Red
    exit 1
}

$nodeCmd = "node"
try {
    & $nodeCmd --version 2>$null | Out-Null
} catch {
    Write-Host "[Error] Node.js not found. Install Node.js >= 14 first." -ForegroundColor Red
    exit 1
}

$cliArgs = @($CliPath, "setup-mcp", "--platform", $Platform)
if ($SkipBuild) {
    $cliArgs += "--skip-build"
}

Write-Host ""
Write-Host "MetaGO MCP Config (V36.9.0)" -ForegroundColor Cyan
Write-Host "  Platform: $Platform" -ForegroundColor Gray
Write-Host ""

& $nodeCmd @cliArgs
exit $LASTEXITCODE
