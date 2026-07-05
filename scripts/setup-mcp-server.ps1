<#
.SYNOPSIS
    MetaGO MCP Server 一键安装与配置脚本（V2 修复版）

.DESCRIPTION
    自动完成 MCP Server 的安装、构建和平台配置。
    - 检查 Node.js 环境 (>= 18)
    - 安装依赖 (npm install)
    - 构建 TypeScript (npm run build)
    - 配置平台 MCP 服务器连接（自动备份现有配置）
    - 验证工具数 (应为 53)

.PARAMETER Platform
    目标平台：trae / claude-code / cursor / zcode / codebuddy / qoder / codex
    默认：trae

.EXAMPLE
    .\scripts\setup-mcp-server.ps1
    安装并配置到 Trae

.EXAMPLE
    .\scripts\setup-mcp-server.ps1 -Platform cursor
    安装并配置到 Cursor
#>

[CmdletBinding()]
param(
    [ValidateSet('trae','claude-code','cursor','zcode','codebuddy','qoder','codex')]
    [string]$Platform = 'trae',

    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$script:ScriptDir = $PSScriptRoot
$script:McpServerDir = Join-Path $script:ScriptDir "..\packages\mcp-server"
$script:ExpectedTools = 53

# ============================================================
# 输出辅助函数
# ============================================================
function Write-Step { param([string]$Msg) Write-Host ""; Write-Host "========== $Msg ==========" -ForegroundColor Cyan }
function Write-Ok { param([string]$Msg) Write-Host "  [OK] $Msg" -ForegroundColor Green }
function Write-Fail { param([string]$Msg) Write-Host "  [FAIL] $Msg" -ForegroundColor Red }
function Write-Info { param([string]$Msg) Write-Host "  $Msg" -ForegroundColor Gray }
function Write-Warn { param([string]$Msg) Write-Host "  [WARN] $Msg" -ForegroundColor Yellow }

# ============================================================
# 编码安全的文件 I/O 辅助函数
# ============================================================
# 读取 JSON 文件（UTF-8，容错处理）
function Read-JsonFileSafe {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return $null }
    try {
        $raw = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
        if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
        return $raw | ConvertFrom-Json
    } catch {
        Write-Warn "现有配置文件 JSON 解析失败：$($_.Exception.Message)"
        Write-Warn "将备份原文件并创建新配置"
        $backupPath = "$Path.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item -Path $Path -Destination $backupPath -Force
        Write-Info "已备份损坏的配置到：$backupPath"
        return $null
    }
}

# 写入 JSON 文件（UTF-8 无 BOM，符合 JSON 标准）
function Write-JsonFileSafe {
    param([string]$Path, [object]$Object)
    $json = $Object | ConvertTo-Json -Depth 20
    $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    [System.IO.File]::WriteAllBytes($Path, $jsonBytes)
}

# 添加或更新 mcpServers 中的 metago 条目
function Update-McpConfig {
    param([string]$ConfigPath, [string]$ServerName, [hashtable]$ServerConfig)

    $existing = Read-JsonFileSafe -Path $ConfigPath

    if ($null -eq $existing) {
        # 创建新配置
        $newConfig = @{
            mcpServers = @{
                $ServerName = $ServerConfig
            }
        }
        Write-JsonFileSafe -Path $ConfigPath -Object $newConfig
    } else {
        # 更新现有配置
        if ($null -eq $existing.mcpServers) {
            $existing | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue (New-Object PSObject) -Force
        }
        $serversHash = @{}
        if ($existing.mcpServers.PSObject.Properties) {
            foreach ($prop in $existing.mcpServers.PSObject.Properties) {
                $serversHash[$prop.Name] = $prop.Value
            }
        }
        $serversHash[$ServerName] = $ServerConfig

        $newConfig = @{
            mcpServers = $serversHash
        }
        Write-JsonFileSafe -Path $ConfigPath -Object $newConfig
    }
}

# ============================================================
# 步骤1：检查 Node.js 环境
# ============================================================
function Step1-CheckNode {
    Write-Step "步骤 1/5：检查 Node.js 环境"

    try {
        $nodeVersion = & node --version 2>$null
        if (-not $nodeVersion) { throw "node not found" }
        $versionNum = [int]($nodeVersion -replace '[^\d]', '').ToString().Substring(0,2)
        Write-Info "Node.js 版本：$nodeVersion"

        if ($versionNum -lt 18) {
            Write-Fail "Node.js 版本过低，需要 >= 18.0.0"
            Write-Info "下载地址：https://nodejs.org/"
            exit 1
        }
        Write-Ok "Node.js 环境检查通过"
    } catch {
        Write-Fail "未检测到 Node.js，请先安装 Node.js >= 18"
        Write-Info "下载地址：https://nodejs.org/"
        exit 1
    }
}

# ============================================================
# 步骤2：安装依赖
# ============================================================
function Step2-InstallDeps {
    Write-Step "步骤 2/5：安装 MCP Server 依赖"

    if (-not (Test-Path $script:McpServerDir)) {
        Write-Fail "MCP Server 目录不存在：$script:McpServerDir"
        exit 1
    }

    Write-Info "进入目录：$script:McpServerDir"
    Set-Location $script:McpServerDir

    if (Test-Path "node_modules") {
        Write-Info "node_modules 已存在，跳过安装"
    } else {
        Write-Info "运行 npm install..."
        & npm install 2>&1 | ForEach-Object { Write-Info $_ }
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "npm install 失败"
            exit 1
        }
    }
    Write-Ok "依赖安装完成"
}

# ============================================================
# 步骤3：构建 TypeScript
# ============================================================
function Step3-Build {
    Write-Step "步骤 3/5：构建 TypeScript"

    if ($SkipBuild) {
        Write-Info "跳过构建（-SkipBuild）"
        if (-not (Test-Path "dist\index.js")) {
            Write-Fail "dist/index.js 不存在，必须先构建"
            exit 1
        }
        Write-Ok "使用已有构建产物"
        return
    }

    Write-Info "运行 npm run build..."
    & npm run build 2>&1 | ForEach-Object { Write-Info $_ }
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "构建失败"
        exit 1
    }

    if (-not (Test-Path "dist\index.js")) {
        Write-Fail "构建产物 dist/index.js 不存在"
        exit 1
    }

    Write-Ok "TypeScript 构建完成"
}

# ============================================================
# 步骤4：配置平台 MCP 服务器连接
# ============================================================
function Step4-ConfigurePlatform {
    Write-Step "步骤 4/5：配置 $Platform 平台 MCP 服务器"

    $serverPath = (Resolve-Path "dist\index.js").Path

    $serverConfig = @{
        command = "node"
        args = @($serverPath)
    }

    $configPath = ""

    switch ($Platform) {
        'trae' {
            $configPath = "$env:APPDATA\Trae CN\User\mcp.json"
            Write-Info "Trae MCP 配置文件：$configPath"
        }
        'claude-code' {
            $configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
            Write-Info "Claude Desktop 配置文件：$configPath"
        }
        'cursor' {
            $configPath = Join-Path (Get-Location).Path ".cursor\mcp.json"
            Write-Info "Cursor MCP 配置文件：$configPath"
        }
        'zcode' {
            $configPath = "$env:USERPROFILE\.zcode\config\mcp.json"
            Write-Info "ZCode MCP 配置文件：$configPath"
        }
        'codebuddy' {
            $configPath = Join-Path (Get-Location).Path ".codebuddy\mcp.json"
            Write-Info "CodeBuddy MCP 配置文件：$configPath"
        }
        'qoder' {
            $configPath = Join-Path (Get-Location).Path ".qoder\mcp.json"
            Write-Info "Qoder MCP 配置文件：$configPath"
        }
        'codex' {
            $configPath = "$env:USERPROFILE\.codex\config.json"
            Write-Info "Codex 配置文件：$configPath"
        }
        Default {
            Write-Info "$Platform 平台请手动配置以下 JSON："
            Write-Host ($serverConfig | ConvertTo-Json -Depth 10)
            Write-Info "配置文件位置请参考平台文档"
            return
        }
    }

    # 确保配置目录存在
    $configDir = Split-Path $configPath -Parent
    if (-not (Test-Path $configDir)) {
        Write-Info "创建配置目录：$configDir"
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }

    # 备份现有配置（如果存在且未损坏）
    if (Test-Path $configPath) {
        $backupPath = "$configPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item -Path $configPath -Destination $backupPath -Force
        Write-Info "已备份现有配置到：$backupPath"
    }

    # 添加或更新 metago 服务器条目
    Update-McpConfig -ConfigPath $configPath -ServerName "metago" -ServerConfig $serverConfig

    Write-Ok "MCP 配置已写入：$configPath"
    Write-Info "MCP 服务器路径：$serverPath"
    Write-Info "命令：node `"$serverPath`""
}

# ============================================================
# 步骤5：验证工具数
# ============================================================
function Step5-VerifyTools {
    Write-Step "步骤 5/5：验证 MCP Server 工具数"

    Write-Info "启动 MCP Server 并请求 tools/list..."

    $testScript = @"
const { spawn } = require('child_process');
const child = spawn('node', ['dist/index.js'], { stdio: ['pipe', 'pipe', 'pipe'] });
let buffer = '';
function send(msg) { child.stdin.write(JSON.stringify(msg) + '\n'); }
child.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id === 1) {
        send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
        setTimeout(() => send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }), 200);
      } else if (msg.id === 2) {
        const tools = msg.result?.tools || [];
        console.log('TOOLS_COUNT:' + tools.length);
        if (tools.length > 0) {
          console.log('FIRST_TOOL:' + tools[0].name);
          console.log('LAST_TOOL:' + tools[tools.length-1].name);
        }
        child.kill();
        process.exit(0);
      }
    } catch (e) {}
  }
});
child.on('error', (err) => { console.error('ERROR:' + err.message); process.exit(1); });
send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'verify', version: '1.0.0' } } });
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(1); }, 15000);
"@

    $testFile = Join-Path $script:McpServerDir "_verify-tools.cjs"
    [System.IO.File]::WriteAllText($testFile, $testScript, [System.Text.UTF8Encoding]::new($false))

    try {
        $output = & node $testFile 2>&1
        $toolLine = $output | Where-Object { $_ -match "^TOOLS_COUNT:" } | Select-Object -First 1
        if ($toolLine) {
            $count = [int]($toolLine -replace "^TOOLS_COUNT:", "")
            Write-Info "实际注册工具数：$count"

            if ($count -ge $script:ExpectedTools) {
                Write-Ok "工具数验证通过（$count >= $($script:ExpectedTools)）"
            } else {
                Write-Fail "工具数不足：$count < $($script:ExpectedTools)"
                Write-Info "可能原因：skills-data.ts 或 toolkit-data.ts 不完整"
                exit 1
            }

            $firstLine = $output | Where-Object { $_ -match "^FIRST_TOOL:" } | Select-Object -First 1
            $lastLine = $output | Where-Object { $_ -match "^LAST_TOOL:" } | Select-Object -First 1
            if ($firstLine) { Write-Info "第一个工具：$($firstLine -replace '^FIRST_TOOL:', '')" }
            if ($lastLine) { Write-Info "最后一个工具：$($lastLine -replace '^LAST_TOOL:', '')" }
        } else {
            Write-Fail "无法获取工具列表，MCP Server 可能启动失败"
            Write-Info "输出：$output"
            exit 1
        }
    } catch {
        Write-Fail "验证失败：$($_.Exception.Message)"
        exit 1
    } finally {
        Remove-Item $testFile -Force -ErrorAction SilentlyContinue
    }
}

# ============================================================
# 主流程
# ============================================================
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MetaGO MCP Server 安装程序 v1.2.0" -ForegroundColor Cyan
Write-Host "  53 tools + 8 prompts" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  目标平台：$Platform" -ForegroundColor Gray
Write-Host "  MCP Server 目录：$script:McpServerDir" -ForegroundColor Gray

Step1-CheckNode
Step2-InstallDeps
Step3-Build
Step4-ConfigurePlatform
Step5-VerifyTools

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  MCP Server 安装完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  下一步：" -ForegroundColor Yellow
Write-Host "  1. 重启 $Platform" -ForegroundColor White
Write-Host "  2. 在 MCP 面板中查看 metago 服务器" -ForegroundColor White
Write-Host "  3. 应该能看到 53 个工具" -ForegroundColor White
Write-Host ""
