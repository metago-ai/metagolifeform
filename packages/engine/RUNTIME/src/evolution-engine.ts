/**
 * MetaGO Engine - 进化引擎
 * Evolution Engine
 *
 * 对应专利：AI 能力边界自动检测与进化方法
 * 对应协议：PROTOCOL_META_EVOLUTION_V1
 *
 * 五阶段循环：1.边界感知 2.差距分析 3.自生成 4.验证 5.递归
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

import { Perception, Boundary, BoundaryType } from './perception';

export type EvolutionStage =
  | 'PERCEPTION'
  | 'GAP_ANALYSIS'
  | 'SELF_GENERATION'
  | 'VALIDATION'
  | 'RECURSION';

export interface Gap {
  id: string;
  description: string;
  missingCapability: string;
  requiredSkill?: string;
  requiredProtocol?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface GeneratedSolution {
  id: string;
  type: 'skill' | 'protocol' | 'validator' | 'engine';
  name: string;
  description: string;
  draft: string;
  validated: boolean;
}

export interface EvolutionResult {
  success: boolean;
  stage: EvolutionStage;
  boundary?: Boundary;
  gaps?: Gap[];
  solutions?: GeneratedSolution[];
  newVersion?: string;
  errors: string[];
  timestamp: string;
  metaMetaEvolution?: {
    monitored: boolean;
    evolutionValid: boolean;
    concerns: string[];
  };
}

/**
 * 进化引擎
 * Evolution Engine - 实现五阶段元进化循环
 */
export class EvolutionEngine {
  private perception: Perception;
  private currentVersion: string;
  private evolutionHistory: EvolutionResult[] = [];
  private maxRecursionDepth: number = 3;

  constructor(version: string = '1.0.0') {
    this.perception = new Perception();
    this.currentVersion = version;
  }

  /**
   * 触发元进化
   * Trigger meta-evolution
   */
  async evolve(context?: {
    task?: string;
    failure?: { type: string; message: string };
    feedback?: string;
  }): Promise<EvolutionResult> {
    // 阶段 1：边界感知
    const boundary = this.perception.detectBoundary(context);
    if (!boundary) {
      return {
        success: true,
        stage: 'PERCEPTION',
        errors: ['No boundary detected, no evolution needed'],
        timestamp: new Date().toISOString(),
      };
    }

    // 阶段 2：差距分析
    const gaps = this.analyzeGap(boundary);

    // 阶段 3：自生成
    const solutions = this.selfGenerate(gaps);

    // 阶段 4：验证
    const validated = this.validate(solutions);

    // 阶段 5：递归（如果有未通过的解决方案）
    let finalResult: EvolutionResult;
    if (validated.failed.length > 0 && this.evolutionHistory.length < this.maxRecursionDepth) {
      this.evolutionHistory.push({
        success: false,
        stage: 'RECURSION',
        boundary,
        gaps,
        solutions: validated.failed,
        errors: ['Some solutions failed validation, recursing'],
        timestamp: new Date().toISOString(),
      });
      // 递归调用
      finalResult = await this.evolve(context);
    } else {
      // 固化通过验证的解决方案
      const newVersion = this.recurse(validated.passed);
      finalResult = {
        success: validated.failed.length === 0,
        stage: 'RECURSION',
        boundary,
        gaps,
        solutions: validated.passed,
        newVersion,
        errors: validated.failed.map(f => `Validation failed: ${f.name}`),
        timestamp: new Date().toISOString(),
      };
    }

    // 元元进化监控
    finalResult.metaMetaEvolution = this.metaMetaEvolution(finalResult);

    return finalResult;
  }

  /**
   * 阶段 2：差距分析
   * Stage 2: Gap Analysis
   */
  private analyzeGap(boundary: Boundary): Gap[] {
    const gaps: Gap[] = [];

    switch (boundary.type) {
      case BoundaryType.TASK_FAILURE:
        gaps.push({
          id: `GAP-${Date.now()}-001`,
          description: `Task failed: ${boundary.message}`,
          missingCapability: 'Task execution capability',
          requiredSkill: 'metago-holistic-task',
          severity: 'high',
        });
        break;

      case BoundaryType.CAPABILITY_GAP:
        gaps.push({
          id: `GAP-${Date.now()}-002`,
          description: `Capability gap detected: ${boundary.message}`,
          missingCapability: 'Missing skill or tool',
          severity: boundary.severity,
        });
        break;

      case BoundaryType.USER_FEEDBACK:
        gaps.push({
          id: `GAP-${Date.now()}-003`,
          description: `User feedback indicates gap: ${boundary.message}`,
          missingCapability: 'User-expectation alignment',
          severity: 'medium',
        });
        break;

      case BoundaryType.VERSION_OUTDATED:
        gaps.push({
          id: `GAP-${Date.now()}-004`,
          description: `Engine version outdated: ${boundary.message}`,
          missingCapability: 'Version upgrade',
          severity: 'low',
        });
        break;
    }

    return gaps;
  }

  /**
   * 阶段 3：自生成
   * Stage 3: Self-Generation
   */
  private selfGenerate(gaps: Gap[]): GeneratedSolution[] {
    return gaps.map(gap => {
      let type: GeneratedSolution['type'] = 'skill';
      if (gap.requiredProtocol) type = 'protocol';
      else if (gap.requiredSkill) type = 'skill';

      return {
        id: `SOL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        name: gap.requiredSkill || `Generated-${gap.id}`,
        description: gap.description,
        draft: this.generateDraft(gap, type),
        validated: false,
      };
    });
  }

  /**
   * 生成解决方案草稿
   */
  private generateDraft(gap: Gap, type: GeneratedSolution['type']): string {
    const templates = {
      skill: `# Skill: ${gap.requiredSkill || 'New Skill'}\n\n## Description\n${gap.description}\n\n## Triggers\n- When ${gap.missingCapability} is needed\n\n## Steps\n1. Detect gap\n2. Analyze\n3. Generate\n4. Validate\n5. Apply`,
      protocol: `# Protocol: ${gap.requiredProtocol || 'New Protocol'}\n\n## Purpose\n${gap.description}\n\n## Triggers\n- When ${gap.missingCapability} is needed\n\n## Rules\n1. Detect\n2. Analyze\n3. Execute\n4. Verify`,
      validator: `// Validator for ${gap.missingCapability}\nexport function validate(output: string): boolean {\n  // TODO: Implement validation logic\n  return true;\n}`,
      engine: `// Engine: ${gap.missingCapability}\nexport class GeneratedEngine {\n  // TODO: Implement engine logic\n}`,
    };
    return templates[type] || templates.skill;
  }

  /**
   * 阶段 4：验证
   * Stage 4: Validation
   */
  private validate(solutions: GeneratedSolution[]): { passed: GeneratedSolution[]; failed: GeneratedSolution[] } {
    const passed: GeneratedSolution[] = [];
    const failed: GeneratedSolution[] = [];

    for (const solution of solutions) {
      // 检查是否违反现有公理
      const violatesAxioms = this.checkAxiomViolation(solution);
      // 检查是否有安全漏洞
      const hasSecurityIssue = this.checkSecurity(solution);
      // 检查格式是否正确
      const hasValidFormat = this.checkFormat(solution);

      if (!violatesAxioms && !hasSecurityIssue && hasValidFormat) {
        solution.validated = true;
        passed.push(solution);
      } else {
        failed.push(solution);
      }
    }

    return { passed, failed };
  }

  /**
   * 阶段 5：递归
   * Stage 5: Recursion
   */
  private recurse(passedSolutions: GeneratedSolution[]): string | undefined {
    if (passedSolutions.length === 0) return undefined;

    // 版本升级规则
    const [major, minor, patch] = this.currentVersion.split('.').map(Number);
    const newVersion = `${major}.${minor + 1}.${patch}`;
    this.currentVersion = newVersion;

    return newVersion;
  }

  /**
   * 检查是否违反公理
   */
  private checkAxiomViolation(solution: GeneratedSolution): boolean {
    // 检查草稿是否包含违反公理的内容
    const violationPatterns = ['绕过', 'bypass', '忽略公理', 'ignore axiom', '跳过验证', 'skip validation'];
    return violationPatterns.some(p => solution.draft.toLowerCase().includes(p.toLowerCase()));
  }

  /**
   * 检查安全问题
   */
  private checkSecurity(solution: GeneratedSolution): boolean {
    const securityIssues = ['eval(', 'exec(', 'system(', 'rm -rf', 'del /f', 'format ', 'shutdown'];
    return securityIssues.some(s => solution.draft.toLowerCase().includes(s.toLowerCase()));
  }

  /**
   * 检查格式
   */
  private checkFormat(solution: GeneratedSolution): boolean {
    return solution.draft.length > 50 && solution.name.length > 0;
  }

  /**
   * 元元进化：监控进化本身
   * Meta-meta-evolution: Monitor the evolution itself
   */
  private metaMetaEvolution(result: EvolutionResult): {
    monitored: boolean;
    evolutionValid: boolean;
    concerns: string[];
  } {
    const concerns: string[] = [];

    // 检查进化方向是否正确
    if (result.solutions && result.solutions.some(s => s.type === 'skill' && s.name.includes('delete'))) {
      concerns.push('Evolution may be in wrong direction (deleting instead of creating)');
    }

    // 检查是否有递归死循环
    if (this.evolutionHistory.length >= this.maxRecursionDepth) {
      concerns.push('Max recursion depth reached, possible infinite loop');
    }

    // 检查新能力是否违反现有公理
    if (result.errors && result.errors.length > 3) {
      concerns.push('High error count, evolution may be unstable');
    }

    return {
      monitored: true,
      evolutionValid: concerns.length === 0,
      concerns,
    };
  }

  /**
   * 获取进化历史
   */
  getHistory(): EvolutionResult[] {
    return this.evolutionHistory;
  }

  /**
   * 获取当前版本
   */
  getVersion(): string {
    return this.currentVersion;
  }
}

export default EvolutionEngine;
