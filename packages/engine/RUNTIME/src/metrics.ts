/**
 * MetaGO Engine - 度量层
 * Metrics Layer
 *
 * 量化引擎是否生效，提供可验证的运行指标。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface EngineMetrics {
  // 引擎加载指标
  loadCount: number;
  lastLoadTime: string | null;
  loadDuration: number;

  // 公理验证指标
  totalValidations: number;
  passedValidations: number;
  failedValidations: number;
  warningValidations: number;
  validationPassRate: number;

  // 决策锁指标
  totalDecisionLocks: number;
  passedDecisionLocks: number;
  failedDecisionLocks: number;
  decisionLockPassRate: number;

  // 进化指标
  totalEvolutions: number;
  successfulEvolutions: number;
  failedEvolutions: number;
  evolutionSuccessRate: number;

  // 边界感知指标
  totalBoundaries: number;
  boundariesByType: Record<string, number>;
  boundariesBySeverity: Record<string, number>;

  // 性能指标
  avgValidationTime: number;
  avgDecisionLockTime: number;
  avgEvolutionTime: number;

  // 时间范围
  startTime: string;
  endTime: string;
}

/**
 * 度量层
 * Metrics - 量化引擎运行状态
 */
export class Metrics {
  private metrics: Metric[] = [];
  private counters: Map<string, number> = new Map();
  private timers: Map<string, number> = new Map();
  private maxMetrics: number = 10000;

  /**
   * 增加计数器
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
    this.record(name, current + value, 'count', tags);
  }

  /**
   * 记录指标
   */
  record(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
    });

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * 计时开始
   */
  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * 计时结束
   */
  endTimer(name: string, tags?: Record<string, string>): number {
    const start = this.timers.get(name);
    if (!start) return 0;
    const duration = Date.now() - start;
    this.timers.delete(name);
    this.record(`${name}_duration`, duration, 'ms', tags);
    return duration;
  }

  /**
   * 获取计数器
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  /**
   * 查询指标
   */
  query(filter: {
    name?: string;
    startTime?: string;
    endTime?: string;
    tags?: Record<string, string>;
  }): Metric[] {
    return this.metrics.filter(m => {
      if (filter.name && m.name !== filter.name) return false;
      if (filter.startTime && m.timestamp < filter.startTime) return false;
      if (filter.endTime && m.timestamp > filter.endTime) return false;
      if (filter.tags) {
        for (const [key, value] of Object.entries(filter.tags)) {
          if (m.tags?.[key] !== value) return false;
        }
      }
      return true;
    });
  }

  /**
   * 计算平均值
   */
  average(name: string): number {
    const values = this.metrics.filter(m => m.name === name).map(m => m.value);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 计算通过率
   */
  passRate(passName: string, failName: string): number {
    const pass = this.getCounter(passName);
    const fail = this.getCounter(failName);
    const total = pass + fail;
    if (total === 0) return 1;
    return pass / total;
  }

  /**
   * 获取完整指标快照
   */
  getSnapshot(): EngineMetrics {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    // 边界类型统计
    const boundaryMetrics = this.metrics.filter(m => m.name.startsWith('boundary_'));
    for (const m of boundaryMetrics) {
      if (m.tags?.type) byType[m.tags.type] = (byType[m.tags.type] || 0) + m.value;
      if (m.tags?.severity) bySeverity[m.tags.severity] = (bySeverity[m.tags.severity] || 0) + m.value;
    }

    return {
      loadCount: this.getCounter('engine_load'),
      lastLoadTime: this.metrics.find(m => m.name === 'engine_load')?.timestamp || null,
      loadDuration: this.average('engine_load_duration'),

      totalValidations: this.getCounter('validation_total'),
      passedValidations: this.getCounter('validation_pass'),
      failedValidations: this.getCounter('validation_fail'),
      warningValidations: this.getCounter('validation_warning'),
      validationPassRate: this.passRate('validation_pass', 'validation_fail'),

      totalDecisionLocks: this.getCounter('decision_lock_total'),
      passedDecisionLocks: this.getCounter('decision_lock_pass'),
      failedDecisionLocks: this.getCounter('decision_lock_fail'),
      decisionLockPassRate: this.passRate('decision_lock_pass', 'decision_lock_fail'),

      totalEvolutions: this.getCounter('evolution_total'),
      successfulEvolutions: this.getCounter('evolution_success'),
      failedEvolutions: this.getCounter('evolution_fail'),
      evolutionSuccessRate: this.passRate('evolution_success', 'evolution_fail'),

      totalBoundaries: this.getCounter('boundary_detected'),
      boundariesByType: byType,
      boundariesBySeverity: bySeverity,

      avgValidationTime: this.average('validation_duration'),
      avgDecisionLockTime: this.average('decision_lock_duration'),
      avgEvolutionTime: this.average('evolution_duration'),

      startTime: this.metrics[0]?.timestamp || new Date().toISOString(),
      endTime: this.metrics[this.metrics.length - 1]?.timestamp || new Date().toISOString(),
    };
  }

  /**
   * 导出为 JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.getSnapshot(), null, 2);
  }

  /**
   * 导出为可读报告
   */
  exportReport(): string {
    const m = this.getSnapshot();
    return [
      'MetaGO Engine Metrics Report',
      '============================',
      '',
      `Engine Loads: ${m.loadCount} (avg ${m.loadDuration.toFixed(0)}ms)`,
      '',
      'Axiom Validation:',
      `  Total: ${m.totalValidations}`,
      `  Pass: ${m.passedValidations} (${(m.validationPassRate * 100).toFixed(1)}%)`,
      `  Fail: ${m.failedValidations}`,
      `  Warning: ${m.warningValidations}`,
      `  Avg Time: ${m.avgValidationTime.toFixed(0)}ms`,
      '',
      'Decision Lock:',
      `  Total: ${m.totalDecisionLocks}`,
      `  Pass: ${m.passedDecisionLocks} (${(m.decisionLockPassRate * 100).toFixed(1)}%)`,
      `  Fail: ${m.failedDecisionLocks}`,
      `  Avg Time: ${m.avgDecisionLockTime.toFixed(0)}ms`,
      '',
      'Evolution:',
      `  Total: ${m.totalEvolutions}`,
      `  Success: ${m.successfulEvolutions} (${(m.evolutionSuccessRate * 100).toFixed(1)}%)`,
      `  Failed: ${m.failedEvolutions}`,
      `  Avg Time: ${m.avgEvolutionTime.toFixed(0)}ms`,
      '',
      'Boundaries:',
      `  Total: ${m.totalBoundaries}`,
      `  By Type: ${JSON.stringify(m.boundariesByType)}`,
      `  By Severity: ${JSON.stringify(m.boundariesBySeverity)}`,
      '',
      `Period: ${m.startTime} → ${m.endTime}`,
    ].join('\n');
  }

  /**
   * 清空指标
   */
  clear(): void {
    this.metrics = [];
    this.counters.clear();
    this.timers.clear();
  }
}

export default Metrics;
