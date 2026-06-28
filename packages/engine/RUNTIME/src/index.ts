/**
 * MetaGO Engine - 主入口
 * Main Entry Point
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

export { EngineLoader, Genome, EngineState } from './loader';
export { AxiomValidator, ValidationResult, ValidationStatus } from './validators';
export { DecisionLock, DecisionLockResult, GateResult } from './decision-lock';
export { EvolutionEngine, EvolutionResult, EvolutionStage } from './evolution-engine';
export { Perception, Boundary, BoundaryType } from './perception';
export { RuntimeMemory, MemoryRecord } from './memory';
export { Metrics, EngineMetrics } from './metrics';

import { EngineLoader } from './loader';
import { AxiomValidator } from './validators';
import { DecisionLock } from './decision-lock';
import { EvolutionEngine } from './evolution-engine';
import { Perception } from './perception';
import { RuntimeMemory } from './memory';
import { Metrics } from './metrics';

export { EngineLoader, AxiomValidator, DecisionLock, EvolutionEngine, Perception, RuntimeMemory, Metrics };

/**
 * 引擎主类 - 聚合所有组件
 */
export class MetaGOEngine {
  public loader: EngineLoader;
  public validator: typeof AxiomValidator;
  public decisionLock: typeof DecisionLock;
  public evolution: EvolutionEngine;
  public perception: Perception;
  public memory: RuntimeMemory;
  public metrics: Metrics;

  constructor(enginePath?: string, version: string = '1.0.0') {
    this.loader = new EngineLoader(enginePath);
    this.validator = AxiomValidator;
    this.decisionLock = DecisionLock;
    this.evolution = new EvolutionEngine(version);
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
   * 触发进化
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
   * 获取引擎状态报告
   */
  getStatus(): string {
    return [
      this.loader.getSummary(),
      '',
      '--- Metrics ---',
      this.metrics.exportReport(),
    ].join('\n');
  }
}

export default MetaGOEngine;
