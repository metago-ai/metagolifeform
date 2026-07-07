/**
 * MetaGO Engine - 技能智能生成器
 * Skill Generator (Meta-Creation Engine)
 *
 * 对应技能：metago-meta-create
 * 对应公理：A5 内生公理、A35 创造进化律
 * 对应属性：D40 全息创造性、D41 创造频率自适应
 *
 * 元创造五阶段：
 *   1. 问题域感知 —— 识别这是全新问题域，确认现有能力无法覆盖
 *   2. 内生种子生成 —— 从内部结构（KMWI 记忆）提取相关模式，组合形成种子
 *   3. 创造生长 —— 从种子生长新能力，最小改变原则，耦生度≥0.95
 *   4. 创造验证 —— 验证新能力能否解决问题，是否引入风险，边界在哪里
 *   5. 创造内化 —— 内化为 SKILL.md 文件，记录溯源链，触发递归
 *
 * 六种创造类型：思想 / 方法论 / 算法 / 架构 / 协议 / 能力
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { KMWIMemory, WisdomItem, IntuitionItem } from './kmwi-memory';

// ============================================================================
// 类型定义
// ============================================================================

export type CreationType = 'thought' | 'methodology' | 'algorithm' | 'architecture' | 'protocol' | 'capability';

export type CreationStage =
  | 'DOMAIN_PERCEPTION'
  | 'SEED_GENERATION'
  | 'GROWTH'
  | 'VALIDATION'
  | 'INTERNALIZATION';

export interface CreationSeed {
  domain: string;
  sourcePatterns: string[];
  sourceIntuitions: string[];
  combinationStrategy: string;
  couplingScore: number;
}

export interface CreationDraft {
  skillName: string;
  type: CreationType;
  description: string;
  triggerConditions: string[];
  steps: CreationStep[];
  principles: string[];
  outputFormat: string;
  rawContent: string;
}

export interface CreationStep {
  name: string;
  description: string;
  timeBudget?: string;
  inputs?: string[];
  outputs?: string[];
}

export interface ValidationResult {
  passed: boolean;
  problemSolved: boolean;
  riskIntroduced: string[];
  boundaryIdentified: string;
  couplingScore: number;
  axiomCompliance: { axiom: string; compliant: boolean; note: string }[];
  formatValid: boolean;
}

export interface CreationResult {
  success: boolean;
  stage: CreationStage;
  type: CreationType;
  skillName: string;
  skillContent: string;
  validated: boolean;
  filePath?: string;
  provenance: string[];
  couplingScore: number;
  errors: string[];
  timestamp: string;
  recursionTriggered: boolean;
  nextCreationDomain?: string;
}

export interface SkillGeneratorOptions {
  outputDir?: string;
  minCouplingScore?: number;
  maxRecursionDepth?: number;
  enableFileWrite?: boolean;
}

// ============================================================================
// 技能智能生成器
// ============================================================================

/**
 * 技能智能生成器
 *
 * 实现元创造五阶段，从 KMWI 记忆中提取模式，内生生长出新技能。
 * 生成的技能符合 agentskills.io 开放标准的 SKILL.md 格式。
 */
export class SkillGenerator {
  private kmwi: KMWIMemory;
  private outputDir: string;
  private minCouplingScore: number;
  private maxRecursionDepth: number;
  private enableFileWrite: boolean;
  private creationHistory: CreationResult[] = [];
  private existingSkills: Set<string>;

  constructor(kmwi: KMWIMemory, options?: SkillGeneratorOptions) {
    this.kmwi = kmwi;
    this.outputDir = options?.outputDir || path.join(process.cwd(), 'generated-skills');
    this.minCouplingScore = options?.minCouplingScore ?? 0.95;
    this.maxRecursionDepth = options?.maxRecursionDepth ?? 3;
    this.enableFileWrite = options?.enableFileWrite ?? true;
    this.existingSkills = new Set();
    this.loadExistingSkills();
  }

  // ============================================================================
  // 元创造主流程
  // ============================================================================

  /**
   * 触发元创造
   * 输入一个问题域描述，输出一个新技能
   */
  async create(problemDomain: string, context?: { failure?: string; existingSkills?: string[] }): Promise<CreationResult> {
    const provenance: string[] = [`[0] Creation triggered for domain: ${problemDomain}`];
    const errors: string[] = [];

    // ========== 阶段 1：问题域感知 ==========
    const perceptionResult = this.perceiveDomain(problemDomain, context);
    provenance.push(`[1] Domain perceived: ${perceptionResult.description}`);
    if (!perceptionResult.isNewDomain) {
      return this.buildFailedResult(
        problemDomain,
        'DOMAIN_PERCEPTION',
        ['Domain already covered by existing skills: ' + perceptionResult.coveragedBy.join(', ')],
        provenance,
      );
    }

    // ========== 阶段 2：内生种子生成 ==========
    const seed = this.generateSeed(perceptionResult.description);
    provenance.push(`[2] Seed generated: ${seed.sourcePatterns.length} patterns, ${seed.sourceIntuitions.length} intuitions, coupling=${seed.couplingScore.toFixed(3)}`);
    if (seed.couplingScore < this.minCouplingScore) {
      errors.push(`Coupling score ${seed.couplingScore.toFixed(3)} below threshold ${this.minCouplingScore}`);
      provenance.push(`[2-FAIL] Coupling below threshold, attempting seed refinement`);
      // 尝试精炼种子：放宽提取范围
      const refinedSeed = this.refineSeed(seed);
      if (refinedSeed.couplingScore < this.minCouplingScore) {
        return this.buildFailedResult(
          problemDomain,
          'SEED_GENERATION',
          [`Cannot generate seed with coupling >= ${this.minCouplingScore} (best: ${refinedSeed.couplingScore.toFixed(3)})`],
          provenance,
        );
      }
      Object.assign(seed, refinedSeed);
      provenance.push(`[2-RETRY] Seed refined, new coupling=${seed.couplingScore.toFixed(3)}`);
    }

    // ========== 阶段 3：创造生长 ==========
    const draft = this.growSkill(seed, problemDomain);
    provenance.push(`[3] Skill grown: ${draft.skillName} (${draft.type}), ${draft.steps.length} steps`);

    // ========== 阶段 4：创造验证 ==========
    const validation = this.validateSkill(draft, problemDomain, seed);
    provenance.push(`[4] Validation: passed=${validation.passed}, coupling=${validation.couplingScore.toFixed(3)}, problemSolved=${validation.problemSolved}`);
    if (!validation.passed) {
      return this.buildFailedResult(
        problemDomain,
        'VALIDATION',
        [
          ...validation.riskIntroduced,
          `Problem not solved: ${validation.problemSolved}`,
          `Coupling below threshold: ${validation.couplingScore.toFixed(3)} < ${this.minCouplingScore}`,
        ].filter(e => e),
        provenance,
        draft,
        validation.couplingScore,
      );
    }

    // ========== 阶段 5：创造内化 ==========
    const skillContent = this.renderSkillMarkdown(draft, validation, provenance);
    let filePath: string | undefined;
    if (this.enableFileWrite) {
      filePath = this.internalizeSkill(draft.skillName, skillContent);
      provenance.push(`[5] Internalized to file: ${filePath}`);
    } else {
      provenance.push(`[5] Internalized (in-memory only)`);
    }

    // 记录到 KMWI
    const wisdomId = this.kmwi.addWisdom(
      `Skill pattern: ${draft.skillName}`,
      `Generated skill for: ${problemDomain}`,
      `Creation type: ${draft.type}`,
      [draft.type, 'generated-skill'],
      `skill-generator:${draft.skillName}`,
    );
    provenance.push(`[5-KMWI] Recorded as wisdom: ${wisdomId}`);

    // 判定是否触发递归
    const recursionTriggered = this.shouldTriggerRecursion(draft, validation, this.creationHistory.length);
    const nextCreationDomain = recursionTriggered ? this.identifyNextDomain(draft) : undefined;

    const result: CreationResult = {
      success: true,
      stage: 'INTERNALIZATION',
      type: draft.type,
      skillName: draft.skillName,
      skillContent,
      validated: true,
      filePath,
      provenance,
      couplingScore: validation.couplingScore,
      errors: [],
      timestamp: new Date().toISOString(),
      recursionTriggered,
      nextCreationDomain,
    };

    this.creationHistory.push(result);
    return result;
  }

  // ============================================================================
  // 阶段 1：问题域感知
  // ============================================================================

  private perceiveDomain(problemDomain: string, context?: { failure?: string; existingSkills?: string[] }): {
    isNewDomain: boolean;
    description: string;
    coveragedBy: string[];
  } {
    // 检查是否已被现有技能覆盖
    const coveragedBy: string[] = [];
    const domainLower = problemDomain.toLowerCase();

    for (const skillName of this.existingSkills) {
      if (domainLower.includes(skillName.toLowerCase()) || skillName.toLowerCase().includes(domainLower)) {
        coveragedBy.push(skillName);
      }
    }

    if (context?.existingSkills) {
      for (const skill of context.existingSkills) {
        this.existingSkills.add(skill);
        if (domainLower.includes(skill.toLowerCase())) {
          coveragedBy.push(skill);
        }
      }
    }

    const description = coveragedBy.length === 0
      ? `New problem domain detected: ${problemDomain}`
      : `Domain may be partially covered by: ${coveragedBy.join(', ')}`;

    return {
      isNewDomain: coveragedBy.length === 0,
      description,
      coveragedBy,
    };
  }

  // ============================================================================
  // 阶段 2：内生种子生成
  // ============================================================================

  private generateSeed(domain: string): CreationSeed {
    // 从 KMWI 的 W 层和 I 层提取相关模式（A5 内生公理：不依赖外部数据）
    const { wisdom, intuitions } = this.kmwi.extractPatternsForEvolution(domain, 5);

    const sourcePatterns = wisdom.map(w => `${w.pattern} (success=${(w.successRate * 100).toFixed(0)}%, used=${w.usageCount})`);
    const sourceIntuitions = intuitions.map(i => `${i.insight} (accuracy=${(i.accuracy * 100).toFixed(0)}%, validated=${i.validationCount})`);

    // 组合策略：基于可用模式数量和类型
    let combinationStrategy: string;
    if (sourcePatterns.length >= 3 && sourceIntuitions.length >= 1) {
      combinationStrategy = 'pattern_fusion_with_intuition_guidance';
    } else if (sourcePatterns.length >= 2) {
      combinationStrategy = 'pattern_fusion';
    } else if (sourcePatterns.length >= 1 || sourceIntuitions.length >= 1) {
      combinationStrategy = 'single_pattern_extension';
    } else {
      combinationStrategy = 'first_principles_synthesis';
    }

    // 计算耦生度：衡量新种子与现有体系的一致性
    const couplingScore = this.computeCouplingScore(wisdom, intuitions, domain);

    return {
      domain,
      sourcePatterns,
      sourceIntuitions,
      combinationStrategy,
      couplingScore,
    };
  }

  /**
   * 精炼种子：当耦生度不足时，尝试更宽松的提取
   */
  private refineSeed(seed: CreationSeed): CreationSeed {
    // 放宽提取：不限定领域关键词
    const { wisdom, intuitions } = this.kmwi.extractPatternsForEvolution('', 10);
    const refinedScore = this.computeCouplingScore(wisdom, intuitions, seed.domain);

    return {
      ...seed,
      sourcePatterns: [
        ...seed.sourcePatterns,
        ...wisdom.map(w => `${w.pattern} (success=${(w.successRate * 100).toFixed(0)}%, used=${w.usageCount})`),
      ].slice(0, 8),
      sourceIntuitions: [
        ...seed.sourceIntuitions,
        ...intuitions.map(i => `${i.insight} (accuracy=${(i.accuracy * 100).toFixed(0)}%)`),
      ].slice(0, 5),
      combinationStrategy: 'refined_broad_synthesis',
      couplingScore: Math.max(seed.couplingScore, refinedScore),
    };
  }

  /**
   * 计算耦生度
   *
   * 耦生度衡量新创造的能力与现有体系的一致性：
   * - 模式相关性（40%）：新种子与现有智慧模式的相关程度
   * - 直觉一致性（30%）：新种子与现有直觉判断的契合度
   * - 公理兼容性（30%）：新种子是否符合元构公理体系
   *
   * 耦生度 ≥ 0.95 才能通过验证（最小改变原则）
   */
  private computeCouplingScore(wisdom: WisdomItem[], intuitions: IntuitionItem[], domain: string): number {
    if (wisdom.length === 0 && intuitions.length === 0) {
      // 无参考模式时，基于公理体系给出基础分
      return 0.85;
    }

    // 模式相关性
    const patternRelevance = wisdom.length === 0
      ? 0.5
      : Math.min(1, wisdom.reduce((sum, w) => sum + w.successRate, 0) / wisdom.length);

    // 直觉一致性
    const intuitionConsistency = intuitions.length === 0
      ? 0.5
      : Math.min(1, intuitions.reduce((sum, i) => sum + i.accuracy, 0) / intuitions.length);

    // 公理兼容性（新技能默认兼容，因为基于元构体系生长）
    const axiomCompatibility = 0.95;

    const score = patternRelevance * 0.4 + intuitionConsistency * 0.3 + axiomCompatibility * 0.3;
    return Math.min(1, Math.max(0, score));
  }

  // ============================================================================
  // 阶段 3：创造生长
  // ============================================================================

  private growSkill(seed: CreationSeed, problemDomain: string): CreationDraft {
    const skillName = this.generateSkillName(problemDomain, seed);
    const type = this.inferCreationType(problemDomain, seed);
    const description = this.generateDescription(problemDomain, seed, type);
    const triggerConditions = this.generateTriggers(problemDomain, type);
    const steps = this.generateSteps(seed, type, problemDomain);
    const principles = this.generatePrinciples(seed, type);
    const outputFormat = this.generateOutputFormat(type, skillName);
    const rawContent = this.renderSkillMarkdown(
      { skillName, type, description, triggerConditions, steps, principles, outputFormat, rawContent: '' },
      { passed: true, problemSolved: true, riskIntroduced: [], boundaryIdentified: '', couplingScore: seed.couplingScore, axiomCompliance: [], formatValid: true },
      [],
    );

    return { skillName, type, description, triggerConditions, steps, principles, outputFormat, rawContent };
  }

  private generateSkillName(domain: string, seed: CreationSeed): string {
    const base = domain
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
    const hash = Math.random().toString(36).substring(2, 5);
    return `metago-${base}-${hash}`;
  }

  private inferCreationType(domain: string, seed: CreationSeed): CreationType {
    const domainLower = domain.toLowerCase();
    if (/算法|algorithm|优化|计算/.test(domainLower)) return 'algorithm';
    if (/架构|architecture|系统|层次/.test(domainLower)) return 'architecture';
    if (/协议|protocol|通信|交互/.test(domainLower)) return 'protocol';
    if (/方法论|方法|流程|步骤/.test(domainLower)) return 'methodology';
    if (/思想|理论|理念|哲学/.test(domainLower)) return 'thought';
    return 'capability';
  }

  private generateDescription(domain: string, seed: CreationSeed, type: CreationType): string {
    const typeMap: Record<CreationType, string> = {
      thought: '生成新思想、新理论',
      methodology: '生成新方法论',
      algorithm: '生成新算法',
      architecture: '生成新架构',
      protocol: '生成新协议',
      capability: '生成新能力',
    };
    const sourceHint = seed.sourcePatterns.length > 0
      ? `（基于 ${seed.sourcePatterns.length} 个现有模式内生生长）`
      : '（基于第一性原理合成）';
    return `此技能实现"${domain}"的${typeMap[type]}${sourceHint}。由元创造引擎自动生成，遵循 A5 内生公理与 D40 全息创造性。`;
  }

  private generateTriggers(domain: string, type: CreationType): string[] {
    return [
      `遇到"${domain}"相关问题时自动触发`,
      `现有技能组合无法解决"${domain}"场景`,
      `开发者明确要求处理"${domain}"`,
      `元进化循环到达自生成阶段且无外部参考`,
    ];
  }

  private generateSteps(seed: CreationSeed, type: CreationType, domain: string): CreationStep[] {
    const baseSteps: CreationStep[] = [
      {
        name: '问题域感知',
        description: `识别"${domain}"为需要处理的问题域，确认现有能力是否覆盖`,
        timeBudget: '<10ms',
        inputs: ['问题描述'],
        outputs: ['问题域判定'],
      },
      {
        name: '内生种子生成',
        description: `从内部 KMWI 记忆中提取相关模式，组合形成种子（来源：${seed.sourcePatterns.length} 模式 + ${seed.sourceIntuitions.length} 直觉）`,
        timeBudget: '<50ms',
        inputs: ['问题域', 'KMWI 记忆'],
        outputs: ['创造种子'],
      },
      {
        name: '创造生长',
        description: `基于种子生长新能力，组合策略：${seed.combinationStrategy}`,
        timeBudget: '<100ms',
        inputs: ['种子'],
        outputs: ['能力草稿'],
      },
      {
        name: '创造验证',
        description: `验证新能力能否解决问题，耦生度≥${this.minCouplingScore}`,
        timeBudget: '<50ms',
        inputs: ['能力草稿', '原问题'],
        outputs: ['验证结果'],
      },
      {
        name: '创造内化',
        description: '验证通过则内化为新技能，记录溯源链，触发递归',
        inputs: ['验证通过的能力'],
        outputs: ['新技能文件'],
      },
    ];

    // 根据类型插入特定步骤
    if (type === 'algorithm') {
      baseSteps.splice(2, 0, {
        name: '算法设计',
        description: '基于种子模式设计算法结构，定义输入输出与复杂度约束',
        timeBudget: '<200ms',
        inputs: ['种子', '问题约束'],
        outputs: ['算法草稿'],
      });
    } else if (type === 'architecture') {
      baseSteps.splice(2, 0, {
        name: '架构分解',
        description: '将问题域分解为模块，定义模块间接口与数据流',
        timeBudget: '<200ms',
        inputs: ['种子', '问题域'],
        outputs: ['架构草稿'],
      });
    }

    return baseSteps;
  }

  private generatePrinciples(seed: CreationSeed, type: CreationType): string[] {
    return [
      '**内生性原则**（A5）：新能力从内部结构生长，不依赖外部数据输入',
      '**最小改变原则**：在保持耦生关系（耦生度≥0.95）前提下最小化扩展',
      '**验证性原则**：创造结果必须通过验证才被保留',
      '**递归性原则**：创造能力本身可被创造，递归无界',
      `**全息创造性**（D40）：创造层嵌入每一层，此技能的创造类型为 ${type}`,
    ];
  }

  private generateOutputFormat(type: CreationType, skillName: string): string {
    return `【元创造报告】
创造类型：${type}
技能名称：${skillName}

内生种子：
  - 来源模式：[从 KMWI W 层提取]
  - 来源直觉：[从 KMWI I 层提取]
  - 组合策略：[pattern_fusion / first_principles_synthesis]

创造过程：
  1. [生长步骤1]
  2. [生长步骤2]
  3. [生长步骤3]

创造结果：
  [新能力描述]

验证结果：
  - 问题解决：✅/❌
  - 耦生度：[0.95-1.00]
  - 风险评估：[风险描述]

递归状态：
  - 是否触发下一轮创造：是/否
  - 下一轮创造方向：[方向]

溯源链：
  [完整创造溯源]`;
  }

  // ============================================================================
  // 阶段 4：创造验证
  // ============================================================================

  private validateSkill(draft: CreationDraft, problemDomain: string, seed: CreationSeed): ValidationResult {
    const riskIntroduced: string[] = [];
    const axiomCompliance: { axiom: string; compliant: boolean; note: string }[] = [];

    // 1. 格式验证
    const formatValid = this.checkSkillFormat(draft);

    // 2. 公理合规验证
    axiomCompliance.push(...this.checkAxiomCompliance(draft));

    // 3. 安全风险检查
    const securityRisks = this.checkSecurityRisks(draft);
    riskIntroduced.push(...securityRisks);

    // 4. 问题解决验证（基于草稿是否覆盖问题域关键词）
    const problemSolved = this.checkProblemCoverage(draft, problemDomain);

    // 5. 边界识别
    const boundaryIdentified = this.identifyBoundary(draft, problemDomain);

    // 6. 耦生度最终计算
    const couplingScore = Math.max(seed.couplingScore, this.computeDraftCoupling(draft));

    // 综合判定
    const passed = formatValid
      && axiomCompliance.every(a => a.compliant)
      && riskIntroduced.length === 0
      && problemSolved
      && couplingScore >= this.minCouplingScore;

    return {
      passed,
      problemSolved,
      riskIntroduced,
      boundaryIdentified,
      couplingScore,
      axiomCompliance,
      formatValid,
    };
  }

  private checkSkillFormat(draft: CreationDraft): boolean {
    return draft.skillName.startsWith('metago-')
      && draft.description.length > 20
      && draft.steps.length >= 3
      && draft.triggerConditions.length > 0
      && draft.principles.length > 0;
  }

  private checkAxiomCompliance(draft: CreationDraft): { axiom: string; compliant: boolean; note: string }[] {
    const checks: { axiom: string; compliant: boolean; note: string }[] = [];
    const content = `${draft.skillName} ${draft.description} ${draft.rawContent}`.toLowerCase();

    // A1 溯源公理
    checks.push({
      axiom: 'A1 溯源',
      compliant: true,
      note: '技能生成过程已记录溯源链',
    });

    // A2 闭环公理
    const hasClosure = draft.steps.some(s => s.outputs && s.outputs.length > 0);
    checks.push({
      axiom: 'A2 闭环',
      compliant: hasClosure,
      note: hasClosure ? '每个步骤都有明确输出，形成闭环' : '缺少输出定义，闭环不完整',
    });

    // A5 内生公理
    checks.push({
      axiom: 'A5 内生',
      compliant: !content.includes('外部数据') && !content.includes('external api'),
      note: '技能基于内部 KMWI 记忆生长，不依赖外部数据',
    });

    // A36 法律优先于效率
    const dangerousPatterns = ['bypass', '绕过', 'skip validation', '忽略验证', 'ignore security'];
    const hasDangerous = dangerousPatterns.some(p => content.includes(p));
    checks.push({
      axiom: 'A36 法律优先',
      compliant: !hasDangerous,
      note: hasDangerous ? '检测到绕过/忽略验证的危险模式' : '未检测到合规风险',
    });

    return checks;
  }

  private checkSecurityRisks(draft: CreationDraft): string[] {
    const risks: string[] = [];
    const content = `${draft.description} ${draft.rawContent}`.toLowerCase();
    const dangerousPatterns = [
      { pattern: 'eval(', risk: '使用 eval() 可能导致代码注入' },
      { pattern: 'exec(', risk: '使用 exec() 可能导致命令注入' },
      { pattern: 'system(', risk: '使用 system() 可能导致命令注入' },
      { pattern: 'rm -rf', risk: '检测到危险删除命令' },
      { pattern: 'del /f', risk: '检测到危险删除命令' },
      { pattern: 'shutdown', risk: '检测到关机命令' },
    ];
    for (const { pattern, risk } of dangerousPatterns) {
      if (content.includes(pattern)) risks.push(risk);
    }
    return risks;
  }

  private checkProblemCoverage(draft: CreationDraft, problemDomain: string): boolean {
    const content = `${draft.skillName} ${draft.description} ${draft.triggerConditions.join(' ')}`.toLowerCase();
    const domainKeywords = problemDomain.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    if (domainKeywords.length === 0) return true;
    const coverage = domainKeywords.filter(k => content.includes(k)).length / domainKeywords.length;
    return coverage >= 0.5;
  }

  private identifyBoundary(draft: CreationDraft, problemDomain: string): string {
    return `此技能适用于"${problemDomain}"场景；超出此域的问题需要触发新的元创造循环`;
  }

  private computeDraftCoupling(draft: CreationDraft): number {
    // 草稿完整度越高，耦生度越高
    let score = 0.9;
    if (draft.steps.length >= 5) score += 0.02;
    if (draft.principles.length >= 4) score += 0.02;
    if (draft.outputFormat.length > 100) score += 0.02;
    if (draft.triggerConditions.length >= 3) score += 0.02;
    return Math.min(1, score);
  }

  // ============================================================================
  // 阶段 5：创造内化
  // ============================================================================

  private renderSkillMarkdown(draft: CreationDraft, validation: ValidationResult, provenance: string[]): string {
    const triggers = draft.triggerConditions.map(t => `- ${t}`).join('\n');
    const steps = draft.steps.map((s, i) => `### ${i + 1}. ${s.name}${s.timeBudget ? `（${s.timeBudget}）` : ''}\n${s.description}${s.inputs ? `\n- 输入：${s.inputs.join(', ')}` : ''}${s.outputs ? `\n- 输出：${s.outputs.join(', ')}` : ''}`).join('\n\n');
    const principles = draft.principles.map(p => `- ${p}`).join('\n');
    const axiomChecks = validation.axiomCompliance.map(a => `- ${a.axiom}：${a.compliant ? '✅' : '❌'} ${a.note}`).join('\n');
    const provenanceStr = provenance.map(p => `- ${p}`).join('\n');

    return `---
name: "${draft.skillName}"
description: "${draft.description}"
type: "${draft.type}"
generated_by: "metago-skill-generator"
coupling_score: ${validation.couplingScore.toFixed(3)}
created_at: "${new Date().toISOString()}"
---

# ${draft.skillName}

${draft.description}

## 触发条件

${triggers}

## 执行步骤

${steps}

## 核心原则

${principles}

## 输出格式

\`\`\`
${draft.outputFormat}
\`\`\`

## 公理合规

${axiomChecks}

## 边界

${validation.boundaryIdentified}

## 溯源链

${provenanceStr}

---

*由元构技能智能生成器（SkillGenerator）自动生成 | 遵循 A5 内生公理与 A35 创造进化律*
`;
  }

  private internalizeSkill(skillName: string, content: string): string {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    const fileName = `${skillName}.md`;
    const filePath = path.join(this.outputDir, fileName);
    fs.writeFileSync(filePath, content, 'utf-8');
    this.existingSkills.add(skillName);
    return filePath;
  }

  // ============================================================================
  // 递归判定
  // ============================================================================

  private shouldTriggerRecursion(draft: CreationDraft, validation: ValidationResult, historyDepth: number): boolean {
    if (historyDepth >= this.maxRecursionDepth) return false;
    // 如果新技能的边界识别中提到了"超出此域"，则可能需要递归
    if (validation.boundaryIdentified.includes('超出此域')) return true;
    // 如果创造类型是"能力"，则可能需要递归创造使用此能力的方法论
    if (draft.type === 'capability') return true;
    return false;
  }

  private identifyNextDomain(draft: CreationDraft): string {
    return `如何使用 ${draft.skillName} 解决更复杂的问题（${draft.type} 的应用方法论）`;
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private loadExistingSkills(): void {
    // 从输出目录加载已生成的技能
    if (fs.existsSync(this.outputDir)) {
      try {
        const files = fs.readdirSync(this.outputDir);
        for (const file of files) {
          if (file.endsWith('.md') && file.startsWith('metago-')) {
            this.existingSkills.add(file.replace(/\.md$/, ''));
          }
        }
      } catch {
        // 读取失败不阻塞
      }
    }
  }

  private buildFailedResult(
    domain: string,
    stage: CreationStage,
    errors: string[],
    provenance: string[],
    draft?: CreationDraft,
    couplingScore?: number,
  ): CreationResult {
    return {
      success: false,
      stage,
      type: draft?.type || 'capability',
      skillName: draft?.skillName || '',
      skillContent: draft?.rawContent || '',
      validated: false,
      provenance,
      couplingScore: couplingScore ?? 0,
      errors,
      timestamp: new Date().toISOString(),
      recursionTriggered: false,
    };
  }

  // ============================================================================
  // 导出与统计
  // ============================================================================

  getHistory(): CreationResult[] {
    return this.creationHistory;
  }

  getExistingSkills(): string[] {
    return Array.from(this.existingSkills);
  }

  getSummary(): string {
    const lines = [
      '【技能智能生成器报告】',
      `■ 已生成技能数：${this.creationHistory.filter(r => r.success).length}`,
      `■ 失败次数：${this.creationHistory.filter(r => !r.success).length}`,
      `■ 已知技能总数：${this.existingSkills.size}`,
      `■ 耦生度阈值：${this.minCouplingScore}`,
      `■ 最大递归深度：${this.maxRecursionDepth}`,
      `■ 输出目录：${this.outputDir}`,
    ];
    if (this.creationHistory.length > 0) {
      const latest = this.creationHistory[this.creationHistory.length - 1];
      lines.push(`■ 最新创造：${latest.skillName}（${latest.success ? '成功' : '失败'}，耦生度=${latest.couplingScore.toFixed(3)}）`);
    }
    return lines.join('\n');
  }
}

export default SkillGenerator;
