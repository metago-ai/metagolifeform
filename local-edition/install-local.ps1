# MetaGO 本地发行版 · 一键安装（Windows PowerShell）
# 用法：powershell -ExecutionPolicy Bypass -File install-local.ps1 [-Platform trae] [-Offline] [-SkipMcp] [-WithPlugin] [-WithCompleteness]
# 36.9.4 修复：tgz 文件名对齐实包；平台与 cli.js 的 11 平台对齐；新增插件/完整性套件开关（与 sh 版对齐）；技能数动态化
param(
  [ValidateSet("trae","claude-code","codex","cursor","codebuddy","qoder","zcode","chatgpt-work","workbuddy","kimi-code","kimi-work")]
  [string]$Platform = "trae",
  [switch]$Offline,
  [switch]$SkipMcp,
  [switch]$WithPlugin,
  [switch]$WithCompleteness
)
$ErrorActionPreference = "Stop"
$LE = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $LE

Write-Host "== MetaGO 本地安装 | 平台: $Platform | 离线: $Offline | 插件: $WithPlugin | 完整性: $WithCompleteness =="

# 0. 前置
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host "❌ 未找到 node，请先安装 Node.js ≥16"; exit 1 }
$NpmG = (npm root -g).Trim()
Write-Host "npm 全局根: $NpmG"

# 1. npm 层
# 36.9.4 修复：Copy-Item -Recurse 对带 scope 的 node_modules 目录（@hono 等）会报
# "Container cannot be copied onto existing leaf item" 且中止安装 —— 改用 robocopy（junction 安全、失败可继续）。
function Copy-Tree($src, $dst) {
  if (-not (Test-Path $src)) { return }
  New-Item -ItemType Directory -Force -Path $dst | Out-Null
  $null = robocopy $src $dst /E /NJH /NJS /NDL /NFL /NP /R:1 /W:1
  if ($LASTEXITCODE -ge 8) { Write-Host "❌ robocopy 失败（code=$LASTEXITCODE）: $src"; exit 1 }
}
if ($Offline) {
  if (-not (Test-Path "$LE\portable\node_modules")) {
    Write-Host "❌ 已指定 -Offline，但 portable/node_modules 缺失（便携快照需构建后随官方发行包提供）。去掉 -Offline 走路径 B，或按 INSTALL.local.md 第 2 章处理。"
    exit 1
  }
  Write-Host "→ 路径A：便携快照（离线）"
  Copy-Tree "$LE\portable\node_modules" $NpmG
  $Prefix = Split-Path -Parent $NpmG
  if (Test-Path "$LE\portable\bin") { Copy-Tree "$LE\portable\bin" $Prefix }
} elseif (Test-Path "$LE\portable\node_modules") {
  Write-Host "→ 路径A：便携快照（检测到 portable/node_modules，自动离线）"
  Copy-Tree "$LE\portable\node_modules" $NpmG
  $Prefix = Split-Path -Parent $NpmG
  if (Test-Path "$LE\portable\bin") { Copy-Tree "$LE\portable\bin" $Prefix }
} else {
  Write-Host "→ 路径B：tgz 安装（mcp-server/algorithms 的依赖需 npm registry）"
  npm install -g "$LE\offline-packages\metago-lifeform-37.0.1.tgz" `
    "$LE\offline-packages\metago-ai-engine-2.1.5.tgz" `
    "$LE\offline-packages\metago-ai-mcp-server-1.3.6.tgz" `
    "$LE\offline-packages\metago-ai-algorithms-1.0.5.tgz" `
    "$LE\offline-packages\metago-ai-dev-kit-1.1.4.tgz" `
    "$LE\offline-packages\metago-ai-verify-kit-1.1.6.tgz"
}

# 2. 法则 + 技能
$SkillCount = @(Get-ChildItem "$Root\skills" -Directory -Filter "metago-*").Count
Write-Host "→ 部署法则与 $SkillCount 技能到 $Platform"
$cliArgs = @("install", "--platform", $Platform)
if ($WithPlugin) { $cliArgs += "--with-plugin" }
if ($WithCompleteness) { $cliArgs += "--with-completeness" }
metago-lifeform @cliArgs

# 3. MCP 注册
if (-not $SkipMcp) {
  Write-Host "→ 注册 MCP 双服务器（55 + 57 工具；kimi-work 官方限制自动跳过）"
  try { metago-lifeform setup-mcp --platform $Platform }
  catch { Write-Host "⚠️ MCP 注册未完全成功，可按 INSTALL.local.md 第 4 章手动配置" }
}

# 4. 插件打包（可选）
if ($WithPlugin) {
  Write-Host "→ 生成多平台插件包到 dist\plugins（Agent Plugins 1.0.0 / claude / zcode / codex）"
  try { metago-lifeform plugin-pack --format all --out "$Root\dist\plugins" }
  catch { Write-Host "⚠️ 插件打包未完全成功，可按 docs\PLUGINS.md 手动操作" }
}

# 5. 验收
Write-Host "→ 运行验收（多类检查）"
node "$LE\verify-local-install.cjs" --platform $Platform
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "✅ 安装完成。新开会话问一句：你是元构超级智能生命体吗？"
exit 0
