/**
 * MetaGO Engine - 感知层
 * Perception Layer
 *
 * 对应专利：AI 能力边界感知方法
 * 对应公理：A4 边界公理
 *
 * 负责检测 AI 的能力边界，是元进化循环的起点。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

export enum BoundaryType {
  TASK_FAILURE = 'TASK_FAILURE',
  CAPABILITY_GAP = 'CAPABILITY_GAP',
  USER_FEEDBACK = 'USER_FEEDBACK',
  VERSION_OUTDATED = 'VERSION_OUTDATED',
  UNKNOWN = 'UNKNOWN',
}

export interface Boundary {
  type: BoundaryType;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectedAt: string;
  context?: {
    task?: string;
    failureType?: string;
    feedback?: string;
    currentVersion?: string;
    latestVersion?: string;
  };
}

export interface PerceptionContext {
  task?: string;
  failure?: { type: string; message: string };
  feedback?: string;
  currentVersion?: string;
  latestVersion?: string;
}

/**
 * 感知层
 * Perception - 检测能力边界，触发元进化循环
 */
export class Perception {
  private history: Boundary[] = [];
  private maxHistorySize: number = 100;

  /**
   * 检测能力边界
   * Detect capability boundary
   */
  detectBoundary(context?: PerceptionContext): Boundary | null {
    if (!context) {
      // 主动扫描：检查版本是否过时
      return this.scanForBoundaries();
    }

    // 被动检测：基于上下文
    if (context.failure) {
      return this.detectFromFailure(context.failure, context.task);
    }

    if (context.feedback) {
      return this.detectFromFeedback(context.feedback);
    }

    if (context.currentVersion && context.latestVersion) {
      return this.detectFromVersion(context.currentVersion, context.latestVersion);
    }

    return null;
  }

  /**
   * 从任务失败检测边界
   */
  private detectFromFailure(failure: { type: string; message: string }, task?: string): Boundary {
    const severity = failure.type === 'critical' ? 'critical' :
                     failure.type === 'error' ? 'high' : 'medium';

    const boundary: Boundary = {
      type: BoundaryType.TASK_FAILURE,
      message: failure.message,
      severity,
      detectedAt: new Date().toISOString(),
      context: {
        task,
        failureType: failure.type,
      },
    };

    this.recordBoundary(boundary);
    return boundary;
  }

  /**
   * 从用户反馈检测边界
   */
  private detectFromFeedback(feedback: string): Boundary {
    const negativeKeywords = ['不对', '错误', '不完整', '不行', 'failed', 'wrong', 'incomplete', 'broken'];
    const hasNegative = negativeKeywords.some(k => feedback.toLowerCase().includes(k.toLowerCase()));

    const boundary: Boundary = {
      type: BoundaryType.USER_FEEDBACK,
      message: feedback.substring(0, 200),
      severity: hasNegative ? 'high' : 'medium',
      detectedAt: new Date().toISOString(),
      context: {
        feedback,
      },
    };

    this.recordBoundary(boundary);
    return boundary;
  }

  /**
   * 从版本检测边界
   */
  private detectFromVersion(current: string, latest: string): Boundary | null {
    if (current === latest) return null;

    const boundary: Boundary = {
      type: BoundaryType.VERSION_OUTDATED,
      message: `Version ${current} is outdated, latest is ${latest}`,
      severity: 'low',
      detectedAt: new Date().toISOString(),
      context: {
        currentVersion: current,
        latestVersion: latest,
      },
    };

    this.recordBoundary(boundary);
    return boundary;
  }

  /**
   * 主动扫描边界
   */
  private scanForBoundaries(): Boundary | null {
    // 主动扫描通常返回 null（无边界）
    // 实际场景中可以扫描：
    // - 未安装的技能
    // - 未实现的协议
    // - 过期的知识晶体
    return null;
  }

  /**
   * 记录边界
   */
  private recordBoundary(boundary: Boundary): void {
    this.history.push(boundary);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * 获取边界历史
   */
  getHistory(): Boundary[] {
    return this.history;
  }

  /**
   * 获取最近的边界
   */
  getLatest(): Boundary | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * 获取边界统计
   */
  getStats(): {
    total: number;
    byType: Record<BoundaryType, number>;
    bySeverity: Record<string, number>;
  } {
    const byType: Record<BoundaryType, number> = {
      [BoundaryType.TASK_FAILURE]: 0,
      [BoundaryType.CAPABILITY_GAP]: 0,
      [BoundaryType.USER_FEEDBACK]: 0,
      [BoundaryType.VERSION_OUTDATED]: 0,
      [BoundaryType.UNKNOWN]: 0,
    };
    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const b of this.history) {
      byType[b.type]++;
      bySeverity[b.severity]++;
    }

    return {
      total: this.history.length,
      byType,
      bySeverity,
    };
  }
}

export default Perception;
