<#
.SYNOPSIS
    MetaGO Agent Harness 安装验证脚本（V36.9.1 - 转发到 cli.js）

.DESCRIPTION
    验证 MetaGO Agent Harness 是否正确安装在指定平台。
    所有逻辑已统一到 node cli.js verify 实现，包含：
    - 法则文件存在性 / 无 BOM / 版本 V36.9.1 / 第十八章注入
    - 平台措辞替换正确性
    - MCP 配置合法性（metago + metago-algorithms）
    - 技能目录完整性

.PARAMETER Platform
    目标平台，默认：trae

.PARAMETER InstallPath
    自定义安装路径（转发为 --install-path）

.EXAMPLE
    .\scripts\verify.ps1
    验证默认 Trae 安装

.EXAMPLE
    .\scripts\verify.ps1 -Platform claude-code
    验证 Claude Code 安装
#>

[CmdletBinding()]
param(
    [ValidateSet('trae','claude-code','codex','cursor','codebuddy','qoder','zcode')]
    [string]$Platform = 'trae',

    [string]$InstallPath
)

$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot
$CliPath = Join-Path $ScriptDir "cli.js"

if (-not (Test-Path $CliPath)) {
    Write-Host "[错误] 找不到 cli.js: $CliPath" -ForegroundColor Red
    exit 1
}

$nodeCmd = "node"
try {
    & $nodeCmd --version 2>$null | Out-Null
} catch {
    Write-Host "[错误] 未找到 Node.js，请先安装 Node.js >= 14" -ForegroundColor Red
    exit 1
}

$cliArgs = @($CliPath, "verify", "--platform", $Platform)
if ($InstallPath) { $cliArgs += "--install-path"; $cliArgs += $InstallPath }

& $nodeCmd @cliArgs
exit $LASTEXITCODE
