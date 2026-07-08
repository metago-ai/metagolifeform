/**
 * MetaGO Engine - 主入口
 * Main Entry Point
 *
 * 聚合引擎所有组件：
 * - 加载器（EngineLoader）
 * - 公理验证器（AxiomValidator）
 * - 决策锁执行器（DecisionLock）
 * - 进化引擎（EvolutionEngine）—— 接入 KMWI 记忆 + 技能生成器
 * - 感知层（Perception）
 * - KMWI 四层记忆（KMWIMemory）—— 知识/记忆/智慧/直觉
 * - 技能智能生成器（SkillGenerator）—— 元创造五阶段
 * - 运行时记忆（RuntimeMemory）—— 轻量级事件记录
 * - 指标（Metrics）
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 2.0.0
 */

// ============================================================================
// 导出
// ============================================================================

export { EngineLoader, Genome, EngineState } from './loader';
export { AxiomValidator, ValidationResult, ValidationStatus } from './validators';
export { DecisionLock, DecisionLockResult, GateResult } from './decision-lock';
export { EvolutionEngine, EvolutionResult, EvolutionStage, Gap, GeneratedSolution, StageTiming } from './evolution-engine';
export { Perception, Boundary, BoundaryType } from './perception';
export { KMWIMemory, KnowledgeItem, MemoryItem, WisdomItem, IntuitionItem, KMWIStats, DecayRates, PromotionResult, MemoryLayer } from './kmwi-memory';
export { SkillGenerator, CreationResult, CreationType, CreationStage, CreationSeed, CreationDraft, ValidationResult as CreationValidationResult } from './skill-generator';
export { RuntimeMemory, MemoryRecord } from './memory';
export { Metrics, EngineMetrics } from './metrics';

// ============================================================================
// 导入
// ============================================================================

import { EngineLoader } from './loader';
import { AxiomValidator } from './validators';
import { DecisionLock } from './decision-lock';
import { EvolutionEngine } from './evolution-engine';
import { Perception } from './perception';
import { KMWIMemory } from './kmwi-memory';
import { SkillGenerator } from './skill-generator';
import { RuntimeMemory } from './memory';
import { Metrics } from './metrics';

// ============================================================================
// 引擎主类
// ============================================================================

/**
 * 引擎主类 - 聚合所有组件
 *
 * 组件依赖关系：
 *   MetaGOEngine
 *   ├── loader (EngineLoader)           —— 引擎加载
 *   ├── validator (AxiomValidator)      —— 公理验证
 *   ├── decisionLock (DecisionLock)     —— 决策锁
 *   ├── perception (Perception)         —— 边界感知
 *   ├── kmwi (KMWIMemory)               —— 四层记忆（基础层）
 *   ├── skillGenerator (SkillGenerator) —— 技能生成（依赖 kmwi）
 *   ├── evolution (EvolutionEngine)     —— 进化引擎（依赖 kmwi + skillGenerator）
 *   ├── memory (RuntimeMemory)          —— 轻量级事件记录
 *   └── metrics (Metrics)               —— 指标统计
 */
export class MetaGOEngine {
  public loader: EngineLoader;
  public validator: typeof AxiomValidator;
  public decisionLock: typeof DecisionLock;
  public evolution: EvolutionEngine;
  public perception: Perception;
  public kmwi: KMWIMemory;
  public skillGenerator: SkillGenerator;
  public memory: RuntimeMemory;
  public metrics: Metrics;

  constructor(enginePath?: string, version: string = '1.0.0') {
    this.loader = new EngineLoader(enginePath);
    this.validator = AxiomValidator;
    this.decisionLock = DecisionLock;

    // 先构造基础层（KMWI 记忆），再构造依赖它的组件
    this.kmwi = new KMWIMemory();
    this.skillGenerator = new SkillGenerator(this.kmwi);
    this.evolution = new EvolutionEngine(version, this.kmwi, this.skillGenerator);

    this.perception = new Perception();
    this.memory = new RuntimeMemory();
    this.metrics = new Metrics();
  }

  /**
   * 初始化引擎
   */
  async init(): Promise<boolean> {
    const state = await this.loader.load();
    this.metrics.increment('engine_load');
    return state.loaded;
  }

  /**
   * 验证输出
   */
  validate(output: string, context?: { input?: string; decision?: string; capability?: any }) {
    this.metrics.increment('validation_total');
    this.metrics.startTimer('validation');
    const results = this.validator.validateAll(output, context);
    this.metrics.endTimer('validation');

    const summary = this.validator.getSummary(results);
    this.metrics.increment('validation_pass', summary.pass);
    this.metrics.increment('validation_fail', summary.fail);
    this.metrics.increment('validation_warning', summary.warning);

    return { results, summary };
  }

  /**
   * 决策锁校验
   */
  async lock(output: string, intent?: string, userRequest?: string) {
    this.metrics.increment('decision_lock_total');
    this.metrics.startTimer('decision_lock');
    const result = await this.decisionLock.validate(output, intent, userRequest);
    this.metrics.endTimer('decision_lock');

    if (result.passed) {
      this.metrics.increment('decision_lock_pass');
    } else {
      this.metrics.increment('decision_lock_fail');
    }

    return result;
  }

  /**
   * 触发元进化
   */
  async evolve(context?: { task?: string; failure?: { type: string; message: string }; feedback?: string }) {
    this.metrics.increment('evolution_total');
    this.metrics.startTimer('evolution');
    const result = await this.evolution.evolve(context);
    this.metrics.endTimer('evolution');

    if (result.success) {
      this.metrics.increment('evolution_success');
    } else {
      this.metrics.increment('evolution_fail');
    }

    this.memory.record('evolution', result);
    return result;
  }

  /**
   * 触发技能智能生成（元创造）
   */
  async createSkill(problemDomain: string, context?: { failure?: string; existingSkills?: string[] }) {
    this.metrics.increment('skill_generation_total');
    this.metrics.startTimer('skill_generation');
    const result = await this.skillGenerator.create(problemDomain, context);
    this.metrics.endTimer('skill_generation');

    if (result.success) {
      this.metrics.increment('skill_generation_success');
    } else {
      this.metrics.increment('skill_generation_fail');
    }

    this.memory.record('decision', result, ['skill-generation', result.type]);
    return result;
  }

  /**
   * 获取 KMWI 记忆健康度
   */
  getMemoryHealth() {
    return this.kmwi.getHealth();
  }

  /**
   * 获取 KMWI 记忆衰减率
   */
  getMemoryDecay() {
    return this.kmwi.getDecayRates();
  }

  /**
   * 获取引擎状态报告
   */
  getStatus(): string {
    return [
      this.loader.getSummary(),
      '',
      '--- Metrics ---',
      this.metrics.exportReport(),
      '',
      '--- KMWI Memory ---',
      this.kmwi.getSummary(),
      '',
      '--- Evolution Engine ---',
      this.evolution.getSummary(),
      '',
      '--- Skill Generator ---',
      this.skillGenerator.getSummary(),
    ].join('\n');
  }
}

export default MetaGOEngine;
