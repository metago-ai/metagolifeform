# MetaGO 本地发行版 · 一键安装（Windows PowerShell）
# 用法：powershell -ExecutionPolicy Bypass -File install-local.ps1 [-Platform trae] [-Offline] [-SkipMcp]
param(
  [ValidateSet("trae","claude-code","codex","cursor","codebuddy","qoder","zcode")]
  [string]$Platform = "trae",
  [switch]$Offline,
  [switch]$SkipMcp
)
$ErrorActionPreference = "Stop"
$LE = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $LE

Write-Host "== MetaGO 本地安装 | 平台: $Platform | 离线: $Offline =="

# 0. 前置
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host "❌ 未找到 node，请先安装 Node.js ≥16"; exit 1 }
$NpmG = (npm root -g).Trim()
Write-Host "npm 全局根: $NpmG"

# 1. npm 层
if ($Offline -or (Test-Path "$LE\portable\node_modules")) {
  Write-Host "→ 路径A：便携快照（离线）"
  Copy-Item -Recurse -Force "$LE\portable\node_modules\*" $NpmG
  $Prefix = Split-Path -Parent $NpmG
  if (Test-Path "$LE\portable\bin") { Copy-Item -Recurse -Force "$LE\portable\bin\*" $Prefix }
} else {
  Write-Host "→ 路径B：tgz 安装（mcp-server/algorithms 的依赖需 npm registry）"
  npm install -g "$LE\offline-packages\metago-lifeform-36.9.1.tgz" `
    "$LE\offline-packages\metago-ai-engine-2.1.1.tgz" `
    "$LE\offline-packages\metago-ai-mcp-server-1.3.1.tgz" `
    "$LE\offline-packages\metago-ai-algorithms-1.0.1.tgz" `
    "$LE\offline-packages\metago-ai-dev-kit-1.1.0.tgz" `
    "$LE\offline-packages\metago-ai-verify-kit-1.1.2.tgz"
}

# 2. 法则 + 技能
Write-Host "→ 部署法则与 95 技能到 $Platform"
metago-lifeform install --platform $Platform

# 3. MCP 注册
if (-not $SkipMcp) {
  Write-Host "→ 注册 MCP 双服务器（53 + 57 工具）"
  try { metago-lifeform setup-mcp --platform $Platform }
  catch { Write-Host "⚠️ MCP 注册未完全成功，可按 INSTALL.local.md 第 4 章手动配置" }
}

# 4. 验收
Write-Host "→ 运行验收（V1–V6）"
node "$LE\verify-local-install.cjs"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "✅ 安装完成。新开会话问一句：你是元构超级智能生命体吗？"
