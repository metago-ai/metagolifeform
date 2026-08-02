<#
.SYNOPSIS
    MetaGO Agent Harness 一键卸载脚本（V36.9.1 - 转发到 cli.js）

.DESCRIPTION
    支持 7 大平台：Trae / Claude Code / Codex / Cursor / CodeBuddy / Qoder / ZCode。
    所有逻辑已统一到 node cli.js uninstall 实现，包含：
    - 卸载前自动备份配置到 ~/.metago-backups/
    - 删除目标平台法则文件
    - 从 MCP 配置移除元构服务器
    - 技能目录默认保留（可加 -DeleteSkills 删除）

.PARAMETER Platform
    目标平台，可选值：trae、claude-code、codex、cursor、codebuddy、qoder、zcode
    默认：trae

.PARAMETER TraePath
    自定义 Trae 安装路径，默认为 $env:USERPROFILE\.trae-cn（转发为 --install-path）

.PARAMETER KeepSkills
    保留 metago 技能不删除（默认行为，cli.js 始终保留技能目录）

.PARAMETER DeleteSkills
    卸载时同时删除技能目录

.PARAMETER SkipBackup
    跳过卸载前备份

.EXAMPLE
    .\scripts\uninstall.ps1
    卸载默认平台（Trae）

.EXAMPLE
    .\scripts\uninstall.ps1 -Platform claude-code
    卸载 Claude Code 平台

.EXAMPLE
    .\scripts\uninstall.ps1 -Platform trae -DeleteSkills
    卸载 Trae 并删除技能目录
#>

[CmdletBinding()]
param(
    [ValidateSet('trae','claude-code','codex','cursor','codebuddy','qoder','zcode')]
    [string]$Platform = 'trae',

    [string]$TraePath,

    [switch]$KeepSkills,

    [switch]$DeleteSkills,

    [switch]$SkipBackup
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

$cliArgs = @($CliPath, "uninstall", "--platform", $Platform)
if ($TraePath) { $cliArgs += "--install-path"; $cliArgs += $TraePath }
if ($DeleteSkills) { $cliArgs += "--delete-skills" }
if ($SkipBackup) { $cliArgs += "--skip-backup" }

& $nodeCmd @cliArgs
exit $LASTEXITCODE
