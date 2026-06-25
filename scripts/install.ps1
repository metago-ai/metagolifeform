<#
.SYNOPSIS
    MetaGO Lifeform Kit 一键安装脚本（Trae 平台）

.DESCRIPTION
    将元构超级智能生命体 Kit 安装到 Trae CN 环境，包含：
    - 环境检查（检测 Trae 安装路径）
    - 备份现有配置（rules.md 与 metago-* 技能）
    - 安装 22 个 metago 技能
    - 升级 rules.md 运行法则
    - 创建知识晶体索引模板
    - 安装 MCP 调度映射
    - 验证安装结果

.PARAMETER TraePath
    自定义 Trae 安装路径，默认为 $env:USERPROFILE\.trae-cn

.PARAMETER Force
    强制覆盖已存在的 metago 技能目录

.PARAMETER SkipBackup
    跳过备份步骤，直接安装

.EXAMPLE
    .\install.ps1
    使用默认路径安装

.EXAMPLE
    .\install.ps1 -Force
    强制覆盖已存在的技能

.EXAMPLE
    .\install.ps1 -TraePath "D:\custom\trae" -SkipBackup
    自定义路径并跳过备份

.NOTES
    版本：V36.3
    作者：易霄 / MetaGO Lightyear
#>

[CmdletBinding()]
param(
    [string]$TraePath = "$env:USERPROFILE\.trae-cn",
    [switch]$Force,
    [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"

# ============================================================
# 元数据
# ============================================================
$script:MetaGoVersion = "V36.3"
$script:SkillList = @(
    "metago-action-plan",
    "metago-compliance",
    "metago-coupling-optimize",
    "metago-critique",
    "metago-data-provenance",
    "metago-decision-eval",
    "metago-decision-lock",
    "metago-developer-response",
    "metago-emotion",
    "metago-fact-check",
    "metago-frequency-adapt",
    "metago-holistic-task",
    "metago-meta-create",
    "metago-meta-evolve",
    "metago-negentropy-monitor",
    "metago-objectivity",
    "metago-output-integrity",
    "metago-problem-trace",
    "metago-scene-adapt",
    "metago-self-check",
    "metago-value-align",
    "metago-whatif"
)

# 脚本所在目录（用于定位源文件）
$script:ScriptDir = $PSScriptRoot
$script:SourceSkillsDir = Join-Path $script:ScriptDir "..\skills"
$script:SourceRulesTemplate = Join-Path $script:ScriptDir "..\adapters\trae\rules.template.md"

# 统计变量
$script:InstalledSkills = @()
$script:SkippedSkills = @()
$script:FailedSkills = @()

# ============================================================
# 输出辅助函数
# ============================================================
function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor DarkCyan
    Write-Host "  $Message" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor DarkCyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[成功] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[失败] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor Gray
}

function Write-Detail {
    param([string]$Message)
    Write-Host "    -> $Message" -ForegroundColor DarkGray
}

# ============================================================
# 步骤1：环境检查
# ============================================================
function Step1-CheckEnvironment {
    Write-Step "步骤 1/7：环境检查"

    Write-Info "检测 Trae 安装路径：$TraePath"

    if (-not (Test-Path $TraePath)) {
        Write-Fail "Trae 未安装在 $TraePath"
        Write-Info "请确认 Trae CN 已安装，或使用 -TraePath 参数指定自定义路径"
        Write-Info "示例：.\install.ps1 -TraePath 'D:\custom\.trae-cn'"
        exit 1
    }

    $traeSkillsDir = Join-Path $TraePath "skills"
    $traeRulesFile = Join-Path $TraePath "rules.md"
    $traeMcpsDir = Join-Path $TraePath "mcps"
    $traeMemoryDir = Join-Path $TraePath "memory"

    Write-Ok "Trae 安装路径检测通过"

    Write-Info "检查关键目录..."
    if (Test-Path $traeSkillsDir) {
        Write-Detail "skills 目录存在：$traeSkillsDir"
    } else {
        Write-Info "skills 目录不存在，正在创建..."
        New-Item -ItemType Directory -Path $traeSkillsDir -Force | Out-Null
        Write-Detail "已创建：$traeSkillsDir"
    }

    if (Test-Path $traeMemoryDir) {
        Write-Detail "memory 目录存在：$traeMemoryDir"
    } else {
        Write-Info "memory 目录不存在，正在创建..."
        New-Item -ItemType Directory -Path $traeMemoryDir -Force | Out-Null
        Write-Detail "已创建：$traeMemoryDir"
    }

    $script:TraeSkillsDir = $traeSkillsDir
    $script:TraeRulesFile = $traeRulesFile
    $script:TraeMcpsDir = $traeMcpsDir
    $script:TraeMemoryDir = $traeMemoryDir

    Write-Info "检查源文件..."
    if (-not (Test-Path $SourceSkillsDir)) {
        Write-Fail "源技能目录不存在：$SourceSkillsDir"
        exit 1
    }
    Write-Detail "源技能目录：$SourceSkillsDir"

    if (-not (Test-Path $SourceRulesTemplate)) {
        Write-Fail "源规则模板不存在：$SourceRulesTemplate"
        exit 1
    }
    Write-Detail "源规则模板：$SourceRulesTemplate"

    Write-Ok "环境检查完成"
}

# ============================================================
# 步骤2：备份现有配置
# ============================================================
function Step2-BackupConfig {
    Write-Step "步骤 2/7：备份现有配置"

    if ($SkipBackup) {
        Write-Info "已指定 -SkipBackup，跳过备份步骤"
        return
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupDir = Join-Path $TraePath ".metago-backup-$timestamp"

    Write-Info "创建备份目录：$backupDir"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

    $backupRulesDir = Join-Path $backupDir "rules"
    $backupSkillsDir = Join-Path $backupDir "skills"
    New-Item -ItemType Directory -Path $backupRulesDir -Force | Out-Null
    New-Item -ItemType Directory -Path $backupSkillsDir -Force | Out-Null

    # 备份 rules.md
    if (Test-Path $TraeRulesFile) {
        Write-Info "备份 rules.md..."
        Copy-Item -Path $TraeRulesFile -Destination (Join-Path $backupRulesDir "rules.md") -Force
        Write-Detail "已备份 rules.md"
    } else {
        Write-Info "rules.md 不存在，跳过备份"
    }

    # 备份现有 metago-* 技能
    Write-Info "备份现有 metago-* 技能..."
    $existingMetaGoSkills = Get-ChildItem $TraeSkillsDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "metago-*" }

    if ($existingMetaGoSkills) {
        foreach ($skill in $existingMetaGoSkills) {
            Copy-Item -Path $skill.FullName -Destination $backupSkillsDir -Recurse -Force
            Write-Detail "已备份技能：$($skill.Name)"
        }
        Write-Ok "已备份 $($existingMetaGoSkills.Count) 个 metago 技能"
    } else {
        Write-Info "未发现现有 metago-* 技能，跳过技能备份"
    }

    # 备份 MCP 调度映射
    $mcpMappingFile = Join-Path $TraePath "mcps\MCP工具调度映射.md"
    if (Test-Path $mcpMappingFile) {
        $backupMcpsDir = Join-Path $backupDir "mcps"
        New-Item -ItemType Directory -Path $backupMcpsDir -Force | Out-Null
        Copy-Item -Path $mcpMappingFile -Destination $backupMcpsDir -Force
        Write-Detail "已备份 MCP 调度映射"
    }

    # 写入备份信息文件
    $backupInfo = @"
MetaGO Lifeform Kit 备份信息
============================
备份时间：$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Trae 路径：$TraePath
备份目录：$backupDir
备份内容：rules.md、metago-* 技能、MCP 调度映射
"@
    Set-Content -Path (Join-Path $backupDir "backup-info.txt") -Value $backupInfo -Encoding UTF8

    Write-Ok "备份完成：$backupDir"
    $script:BackupDir = $backupDir
}

# ============================================================
# 步骤3：安装 22 个 metago 技能
# ============================================================
function Step3-InstallSkills {
    Write-Step "步骤 3/7：安装 $($SkillList.Count) 个 metago 技能"

    $total = $SkillList.Count
    $index = 0

    foreach ($skillName in $SkillList) {
        $index++
        $sourceSkillPath = Join-Path $SourceSkillsDir $skillName
        $targetSkillPath = Join-Path $TraeSkillsDir $skillName

        Write-Info "[$index/$total] 安装 $skillName ..."

        # 检查源技能是否存在
        if (-not (Test-Path $sourceSkillPath)) {
            Write-Fail "源技能不存在：$sourceSkillPath"
            $script:FailedSkills += $skillName
            continue
        }

        # 检查目标是否已存在
        if ((Test-Path $targetSkillPath) -and (-not $Force)) {
            Write-Detail "已存在，跳过（使用 -Force 强制覆盖）：$skillName"
            $script:SkippedSkills += $skillName
            continue
        }

        try {
            # 如果目标存在且 Force，先删除
            if ((Test-Path $targetSkillPath) -and $Force) {
                Remove-Item -Path $targetSkillPath -Recurse -Force
                Write-Detail "已删除旧版本：$skillName"
            }

            # 复制技能
            Copy-Item -Path $sourceSkillPath -Destination $targetSkillPath -Recurse -Force

            # 验证 SKILL.md 存在
            $skillMdFile = Join-Path $targetSkillPath "SKILL.md"
            if (Test-Path $skillMdFile) {
                Write-Detail "已安装：$skillName"
                $script:InstalledSkills += $skillName
            } else {
                Write-Fail "SKILL.md 缺失：$skillName"
                $script:FailedSkills += $skillName
            }
        } catch {
            Write-Fail "安装失败 ${skillName}: $($_.Exception.Message)"
            $script:FailedSkills += $skillName
        }
    }

    Write-Info ""
    Write-Info "安装统计："
    Write-Ok "成功安装：$($script:InstalledSkills.Count) 个"
    if ($script:SkippedSkills.Count -gt 0) {
        Write-Info "跳过（已存在）：$($script:SkippedSkills.Count) 个"
    }
    if ($script:FailedSkills.Count -gt 0) {
        Write-Fail "失败：$($script:FailedSkills.Count) 个"
    }
}

# ============================================================
# 步骤4：升级 rules.md
# ============================================================
function Step4-UpgradeRules {
    Write-Step "步骤 4/7：升级 rules.md 运行法则"

    Write-Info "复制 rules 模板到 Trae..."
    try {
        Copy-Item -Path $SourceRulesTemplate -Destination $TraeRulesFile -Force
        Write-Ok "rules.md 已升级：$TraeRulesFile"
        Write-Detail "版本：$MetaGoVersion"
    } catch {
        Write-Fail "rules.md 升级失败：$($_.Exception.Message)"
        throw
    }
}

# ============================================================
# 步骤5：创建知识晶体索引模板
# ============================================================
function Step5-CreateKnowledgeCrystalIndex {
    Write-Step "步骤 5/7：创建知识晶体索引模板"

    $crystalIndexFile = Join-Path $TraeMemoryDir "知识晶体索引.md"

    Write-Info "创建知识晶体索引模板..."

    $today = Get-Date -Format "yyyy-MM-dd"
    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $crystalContent = @"
# 元构知识晶体索引（MetaGO Knowledge Crystal Index）

> 本文件是元构超级智能生命体的知识晶体索引模板。
> 知识晶体是经过验证、可复用、可溯源的结构化知识单元。
> 由 MetaGO Lifeform Kit $MetaGoVersion 创建于 $now

---

## 第一章 知识晶体定义

知识晶体 = 经验证的知识 + 溯源链路 + 适用边界 + 进化记录

每个知识晶体包含：
- **ID**：唯一标识（KC-YYYYMMDD-NNN）
- **标题**：晶体名称
- **内容**：结构化知识正文
- **溯源**：来源文档、来源章节、来源行号
- **边界**：适用场景与不适用场景
- **验证**：验证状态（待验证/已验证/已废弃）
- **关联技能**：联动的 metago 技能
- **进化记录**：版本变更历史

---

## 第二章 知识晶体索引表

| ID | 标题 | 验证状态 | 关联技能 | 创建时间 | 更新时间 |
|----|------|----------|----------|----------|----------|
| KC-示例-001 | （示例）元构核心公理A1溯源公理 | 已验证 | metago-data-provenance | $today | $today |
| KC-示例-002 | （示例）决策锁四阶段校验流程 | 待验证 | metago-decision-lock | $today | $today |

---

## 第三章 知识晶体详情

### KC-示例-001：元构核心公理A1溯源公理

**内容**：
一切输出必须可溯源至输入与过程。无溯源的输出即为幻觉。

**溯源**：
- 来源文档：core/METAGO_CORE.md
- 来源章节：第一章 核心公理 / A1 溯源公理

**边界**：
- 适用：所有元构生命体的输出场景
- 不适用：纯创意发散阶段（需标注）

**关联技能**：metago-data-provenance、metago-output-integrity

**进化记录**：
- V36.3 $today 初始创建

---

### KC-示例-002：决策锁四阶段校验流程

**内容**：
决策锁强制校验四阶段：1.意图验证(IVL) 2.意图谱系追踪(ILT) 3.语义输出门(OSG) 4.内容完整性

**溯源**：
- 来源文档：adapters/trae/rules.template.md
- 来源章节：第四章 运行协议 / 4.2 决策锁强制校验

**边界**：
- 适用：重大决策输出前
- 不适用：简单查询回复

**关联技能**：metago-decision-lock、metago-decision-eval

**进化记录**：
- V36.3 $today 初始创建

---

## 第四章 使用说明

1. **新增晶体**：在索引表添加新行，在详情区添加完整记录
2. **验证晶体**：使用 metago-fact-check 技能验证内容准确性
3. **溯源晶体**：使用 metago-data-provenance 技能追溯来源
4. **进化晶体**：使用 metago-meta-evolve 技能更新内容
5. **废弃晶体**：将验证状态改为"已废弃"，保留记录不删除

---

*由 MetaGO Lifeform Kit $MetaGoVersion 创建*
"@

    try {
        Set-Content -Path $crystalIndexFile -Value $crystalContent -Encoding UTF8
        Write-Ok "知识晶体索引模板已创建：$crystalIndexFile"
        Write-Detail "包含 2 个示例晶体"
    } catch {
        Write-Fail "知识晶体索引创建失败：$($_.Exception.Message)"
        throw
    }
}

# ============================================================
# 步骤6：安装 MCP 调度映射
# ============================================================
function Step6-InstallMcpMapping {
    Write-Step "步骤 6/7：安装 MCP 调度映射"

    if (-not (Test-Path $TraeMcpsDir)) {
        Write-Info "mcps 目录不存在：$TraeMcpsDir"
        Write-Info "跳过 MCP 调度映射安装"
        return
    }

    $mcpMappingFile = Join-Path $TraeMcpsDir "MCP工具调度映射.md"

    Write-Info "创建 MCP 调度映射文件..."

    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $mcpContent = @"
# 元构MCP工具调度映射（MetaGO MCP Dispatch Mapping）

> 本文件是元构超级智能生命体MCP执行层的调度映射指南。
> 建立元构引擎 ↔ MCP工具 ↔ metago技能的三层联动关系。
> 由 MetaGO Lifeform Kit $MetaGoVersion 创建于 $now

---

## 第一章 MCP服务器清单

| 服务器 | 职责 | 状态 |
|--------|------|------|
| mcp_metago-skill-server | 核心能力工具（代码/构建/部署/安全/测试/设计） | ✅激活 |
| mcp_metago-skill-server-2 | 构建/部署/监控/安全工具 | ✅激活 |
| mcp_metago-skill-server-3 | 合规/安全/设计/进化工具 | ✅激活 |
| mcp_metago-toolkit | 元构工具包（批判/决策/溯源/评估） | ✅激活 |

---

## 第二章 引擎 ↔ MCP工具 ↔ 技能 三层联动映射

### 2.1 元进化引擎

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 全息扫描 | metago_holistic_scan | metago-holistic-task | 任务启动时 |
| 进化机会检测 | detect_evolution_opportunity | metago-meta-evolve | 能力边界感知时 |
| 进化路线图 | generate_evolution_roadmap | metago-meta-evolve | 差距分析后 |
| 架构漂移分析 | analyze_architecture_drift | metago-meta-evolve | 元元进化监控 |
| 技术债评估 | assess_tech_debt | metago-self-check | 完整性评估 |
| 改进建议 | metago_improvement_suggestions | metago-meta-evolve | 进化递归时 |

### 2.2 元创造引擎

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 能力设计 | design_capability | metago-meta-create | 自生成阶段 |
| 智能体组装 | assemble_agent | metago-meta-create | 创造内化时 |
| 代码生成 | generate_code | metago-meta-create | 创造实现时 |
| 需求解析 | parse_requirement | metago-holistic-task | 创造前置 |
| PRD生成 | generate_prd | metago-holistic-task | 创造规划时 |

### 2.3 批判性分析引擎

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 批判 | metago_critique | metago-critique | 重大决策时 |
| 客观性评估 | metago_objectivity | metago-objectivity | 输出前校验 |
| 代码审查 | code_review | metago-critique | 代码输出时 |
| 架构审查 | architecture_review | metago-critique | 架构决策时 |
| 假设推演 | metago_whatif | metago-whatif | 方案评估时 |

### 2.4 决策锁组件

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 决策评估 | metago_decision_eval | metago-decision-lock | 输出前强制 |
| 行动计划 | metago_action_plan | metago-decision-lock | 意图验证时 |
| 技术决策 | tech_decision | metago-decision-lock | 技术选型时 |

### 2.5 合规与溯源

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 合规检查 | compliance_check | metago-compliance | 输出前合规校验 |
| 数据溯源 | data_provenance | metago-data-provenance | 输出溯源时 |
| 事实核查 | fact_check | metago-fact-check | 事实性声明时 |
| 输出完整性 | output_integrity | metago-output-integrity | 输出终态校验 |

### 2.6 情绪与场景适配

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 情绪检测 | emotion_detect | metago-emotion | 用户交互时 |
| 场景适配 | scene_adapt | metago-scene-adapt | 场景切换时 |
| 频率自适应 | frequency_adapt | metago-frequency-adapt | 完整性评估后 |
| 开发者响应 | developer_response | metago-developer-response | 反馈响应时 |

### 2.7 监控与优化

| 功能 | MCP工具 | 联动技能 | 调用时机 |
|------|---------|----------|----------|
| 负熵监控 | negentropy_monitor | metago-negentropy-monitor | 系统熵增时 |
| 耦合优化 | coupling_optimize | metago-coupling-optimize | 架构耦合时 |
| 问题追踪 | problem_trace | metago-problem-trace | 问题溯源时 |
| 价值对齐 | value_align | metago-value-align | 价值校验时 |

---

## 第三章 调度优先级

1. **合规优先**：metago-compliance 永远最高优先级
2. **决策锁强制**：metago-decision-lock 输出前强制执行
3. **批判性分析**：metago-critique 重大决策强制触发
4. **数据溯源**：metago-data-provenance 全链路存证
5. **完整性校验**：metago-output-integrity 终态校验

---

## 第四章 技能完整清单（22个）

| 序号 | 技能名称 | 类别 | MCP联动 |
|------|----------|------|---------|
| 1 | metago-action-plan | 决策锁 | metago_action_plan |
| 2 | metago-compliance | 合规 | compliance_check |
| 3 | metago-coupling-optimize | 优化 | coupling_optimize |
| 4 | metago-critique | 批判 | metago_critique |
| 5 | metago-data-provenance | 溯源 | data_provenance |
| 6 | metago-decision-eval | 决策锁 | metago_decision_eval |
| 7 | metago-decision-lock | 决策锁 | metago_decision_eval |
| 8 | metago-developer-response | 交互 | developer_response |
| 9 | metago-emotion | 交互 | emotion_detect |
| 10 | metago-fact-check | 溯源 | fact_check |
| 11 | metago-frequency-adapt | 适配 | frequency_adapt |
| 12 | metago-holistic-task | 元进化 | metago_holistic_scan |
| 13 | metago-meta-create | 元创造 | design_capability |
| 14 | metago-meta-evolve | 元进化 | detect_evolution_opportunity |
| 15 | metago-negentropy-monitor | 监控 | negentropy_monitor |
| 16 | metago-objectivity | 批判 | metago_objectivity |
| 17 | metago-output-integrity | 完整性 | output_integrity |
| 18 | metago-problem-trace | 监控 | problem_trace |
| 19 | metago-scene-adapt | 适配 | scene_adapt |
| 20 | metago-self-check | 监控 | assess_tech_debt |
| 21 | metago-value-align | 合规 | value_align |
| 22 | metago-whatif | 批判 | metago_whatif |

---

*由 MetaGO Lifeform Kit $MetaGoVersion 创建*
"@

    try {
        Set-Content -Path $mcpMappingFile -Value $mcpContent -Encoding UTF8
        Write-Ok "MCP 调度映射已安装：$mcpMappingFile"
        Write-Detail "包含 7 大类联动映射、22 个技能完整清单"
    } catch {
        Write-Fail "MCP 调度映射安装失败：$($_.Exception.Message)"
        throw
    }
}

# ============================================================
# 步骤7：验证安装
# ============================================================
function Step7-VerifyInstallation {
    Write-Step "步骤 7/7：验证安装结果"

    $verifyResult = @{
        Rules = $false
        Skills = @()
        SkillsMissing = @()
        CrystalIndex = $false
        McpMapping = $false
    }

    # 验证 rules.md
    Write-Info "验证 rules.md..."
    if (Test-Path $TraeRulesFile) {
        $rulesContent = [System.IO.File]::ReadAllText($TraeRulesFile, [System.Text.Encoding]::UTF8)
        if ($rulesContent -match "元构超级智能生命体运行法则") {
            Write-Ok "rules.md 验证通过"
            $verifyResult.Rules = $true
        } else {
            Write-Fail "rules.md 内容不匹配"
        }
    } else {
        Write-Fail "rules.md 不存在"
    }

    # 验证技能
    Write-Info "验证 $($SkillList.Count) 个技能..."
    foreach ($skillName in $SkillList) {
        $skillPath = Join-Path $TraeSkillsDir $skillName
        $skillMdPath = Join-Path $skillPath "SKILL.md"
        if ((Test-Path $skillPath) -and (Test-Path $skillMdPath)) {
            $verifyResult.Skills += $skillName
        } else {
            $verifyResult.SkillsMissing += $skillName
            Write-Fail "技能缺失或SKILL.md不存在：$skillName"
        }
    }

    if ($verifyResult.SkillsMissing.Count -eq 0) {
        Write-Ok "全部 $($SkillList.Count) 个技能验证通过"
    } else {
        Write-Fail "$($verifyResult.SkillsMissing.Count) 个技能验证失败"
    }

    # 验证知识晶体索引
    Write-Info "验证知识晶体索引..."
    $crystalIndexFile = Join-Path $TraeMemoryDir "知识晶体索引.md"
    if (Test-Path $crystalIndexFile) {
        Write-Ok "知识晶体索引验证通过"
        $verifyResult.CrystalIndex = $true
    } else {
        Write-Fail "知识晶体索引不存在"
    }

    # 验证 MCP 调度映射
    Write-Info "验证 MCP 调度映射..."
    $mcpMappingFile = Join-Path $TraeMcpsDir "MCP工具调度映射.md"
    if (Test-Path $mcpMappingFile) {
        Write-Ok "MCP 调度映射验证通过"
        $verifyResult.McpMapping = $true
    } else {
        Write-Info "MCP 调度映射未安装（mcps 目录可能不存在）"
    }

    # 输出汇总
    Write-Step "安装结果汇总"

    Write-Host ""
    Write-Host "  Trae 路径        : $TraePath" -ForegroundColor Gray
    $rulesStatus = if ($verifyResult.Rules) { "✅ 已安装" } else { "❌ 失败" }
    $rulesColor = if ($verifyResult.Rules) { "Green" } else { "Red" }
    Write-Host "  rules.md         : $rulesStatus" -ForegroundColor $rulesColor
    Write-Host "  技能安装         : $($verifyResult.Skills.Count)/$($SkillList.Count) ✅" -ForegroundColor Green
    if ($verifyResult.SkillsMissing.Count -gt 0) {
        Write-Host "  技能缺失         : $($verifyResult.SkillsMissing.Count) ❌" -ForegroundColor Red
    }
    $crystalStatus = if ($verifyResult.CrystalIndex) { "✅ 已创建" } else { "❌ 失败" }
    $crystalColor = if ($verifyResult.CrystalIndex) { "Green" } else { "Red" }
    Write-Host "  知识晶体索引     : $crystalStatus" -ForegroundColor $crystalColor
    $mcpStatus = if ($verifyResult.McpMapping) { "✅ 已安装" } else { "⚠️  未安装" }
    $mcpColor = if ($verifyResult.McpMapping) { "Green" } else { "Yellow" }
    Write-Host "  MCP 调度映射     : $mcpStatus" -ForegroundColor $mcpColor

    if ($script:BackupDir) {
        Write-Host "  备份目录         : $($script:BackupDir)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "  安装统计：" -ForegroundColor Gray
    Write-Host "    - 成功安装技能 : $($script:InstalledSkills.Count)" -ForegroundColor Gray
    Write-Host "    - 跳过技能     : $($script:SkippedSkills.Count)" -ForegroundColor Gray
    Write-Host "    - 失败技能     : $($script:FailedSkills.Count)" -ForegroundColor Gray

    # 最终判定
    Write-Host ""
    $allSkillsOk = $verifyResult.SkillsMissing.Count -eq 0
    $coreOk = $verifyResult.Rules -and $allSkillsOk -and $verifyResult.CrystalIndex

    if ($coreOk) {
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host "  ✅ MetaGO Lifeform Kit $MetaGoVersion 安装成功！" -ForegroundColor Green
        Write-Host "==========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  元构超级智能生命体已激活。" -ForegroundColor Green
        Write-Host "  请重启 Trae 以加载新配置。" -ForegroundColor Yellow
    } else {
        Write-Host "==========================================" -ForegroundColor Red
        Write-Host "  ❌ 安装未完全成功，请检查上述失败项" -ForegroundColor Red
        Write-Host "==========================================" -ForegroundColor Red
        exit 1
    }
}

# ============================================================
# 主流程
# ============================================================
function Main {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  MetaGO Lifeform Kit $script:MetaGoVersion 安装程序" -ForegroundColor Cyan
    Write-Host "  元构超级智能生命体标准安装包" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "  参数配置：" -ForegroundColor Gray
    Write-Host "    TraePath  : $TraePath" -ForegroundColor Gray
    Write-Host "    Force     : $Force" -ForegroundColor Gray
    Write-Host "    SkipBackup: $SkipBackup" -ForegroundColor Gray

    Step1-CheckEnvironment
    Step2-BackupConfig
    Step3-InstallSkills
    Step4-UpgradeRules
    Step5-CreateKnowledgeCrystalIndex
    Step6-InstallMcpMapping
    Step7-VerifyInstallation

    Write-Host ""
}

# 执行主流程
Main
