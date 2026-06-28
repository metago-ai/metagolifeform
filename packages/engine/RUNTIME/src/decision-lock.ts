/**
 * MetaGO Engine - 决策锁执行器
 * Decision Lock Executor
 *
 * 对应专利：AI 决策的多级锁校验机制
 * 对应协议：PROTOCOL_DECISION_LOCK_V1.1
 *
 * 四道关卡：1.意图验证(IVL) 2.意图谱系追踪(ILT) 3.语义输出门(OSG) 4.内容完整性
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

import { ValidationResult } from './validators';

export type GateStatus = 'pass' | 'fail' | 'warning';

export interface GateResult {
  gateId: string;
  gateName: string;
  status: GateStatus;
  message: string;
  details?: string[];
}

export interface DecisionLockResult {
  passed: boolean;
  gates: GateResult[];
  failedGates: string[];
  timestamp: string;
  output: string;
}

/**
 * 决策锁执行器
 * Decision Lock - 四道关卡串行校验
 */
export class DecisionLock {
  /**
   * 执行四道关卡校验
   * Execute the four-gate validation
   *
   * @param output 待校验的输出
   * @param intent 声明的意图
   * @param userRequest 用户原始请求
   */
  static async validate(
    output: string,
    intent?: string,
    userRequest?: string
  ): Promise<DecisionLockResult> {
    const gates: GateResult[] = [];
    const failedGates: string[] = [];

    // 关卡 1：意图验证 (IVL - Intent Verification Logic)
    const ivl = this.gateIVL(output, intent, userRequest);
    gates.push(ivl);
    if (ivl.status === 'fail') failedGates.push('IVL');

    // 关卡 2：意图谱系追踪 (ILT - Intent Lineage Tracking)
    const ilt = this.gateILT(output, intent);
    gates.push(ilt);
    if (ilt.status === 'fail') failedGates.push('ILT');

    // 关卡 3：语义输出门 (OSG - Output Semantic Gate)
    const osg = this.gateOSG(output);
    gates.push(osg);
    if (osg.status === 'fail') failedGates.push('OSG');

    // 关卡 4：内容完整性 (Integrity)
    const integrity = this.gateIntegrity(output);
    gates.push(integrity);
    if (integrity.status === 'fail') failedGates.push('INTEGRITY');

    return {
      passed: failedGates.length === 0,
      gates,
      failedGates,
      timestamp: new Date().toISOString(),
      output,
    };
  }

  /**
   * 关卡 1：意图验证 (IVL)
   * 检查输出意图是否与用户需求一致
   */
  private static gateIVL(output: string, intent?: string, userRequest?: string): GateResult {
    if (!intent && !userRequest) {
      return {
        gateId: 'IVL',
        gateName: '意图验证',
        status: 'warning',
        message: 'No intent or user request provided for verification',
      };
    }

    // 检查输出是否回应了用户请求
    if (userRequest) {
      const requestKeywords = userRequest
        .split(/\s+|，|。|,|\.|;|;|!|!|\?|\?/)
        .filter(w => w.length > 2)
        .slice(0, 5);
      const matchCount = requestKeywords.filter(kw =>
        output.toLowerCase().includes(kw.toLowerCase())
      ).length;
      const matchRate = matchCount / Math.max(requestKeywords.length, 1);

      if (matchRate < 0.2) {
        return {
          gateId: 'IVL',
          gateName: '意图验证',
          status: 'fail',
          message: `Output does not match user request (match rate: ${(matchRate * 100).toFixed(1)}%)`,
          details: [`Expected keywords: ${requestKeywords.join(', ')}`, `Matched: ${matchCount}/${requestKeywords.length}`],
        };
      }
    }

    // 检查输出是否偏离声明的意图
    if (intent && userRequest) {
      const intentKeywords = intent.split(/\s+/).filter(w => w.length > 2);
      const requestKeywords = userRequest.split(/\s+/).filter(w => w.length > 2);
      const overlap = intentKeywords.filter(k => requestKeywords.includes(k));
      if (overlap.length === 0 && intentKeywords.length > 0 && requestKeywords.length > 0) {
        return {
          gateId: 'IVL',
          gateName: '意图验证',
          status: 'warning',
          message: 'Intent may not align with user request',
        };
      }
    }

    return {
      gateId: 'IVL',
      gateName: '意图验证',
      status: 'pass',
      message: 'Output intent aligns with user request',
    };
  }

  /**
   * 关卡 2：意图谱系追踪 (ILT)
   * 检查意图的来源和思考链路
   */
  private static gateILT(output: string, intent?: string): GateResult {
    // 检查输出是否有思考过程
    const hasReasoning = output.includes('【闭环分析】') ||
                         output.includes('因为') ||
                         output.includes('由于') ||
                         output.includes('based on') ||
                         output.includes('therefore') ||
                         output.includes('所以') ||
                         output.includes('原因') ||
                         output.includes('reason');

    if (!hasReasoning) {
      return {
        gateId: 'ILT',
        gateName: '意图谱系追踪',
        status: 'warning',
        message: 'Output lacks reasoning trace',
        details: ['No reasoning keywords found (because/therefore/reason)'],
      };
    }

    return {
      gateId: 'ILT',
      gateName: '意图谱系追踪',
      status: 'pass',
      message: 'Intent lineage is traceable',
    };
  }

  /**
   * 关卡 3：语义输出门 (OSG)
   * 检查输出的语义完整性
   */
  private static gateOSG(output: string): GateResult {
    const issues: string[] = [];

    // 检查占位符
    const placeholders = ['[placeholder]', '<TODO>', 'xxx', 'TBD', 'FIXME', '[未填写]', '[待补充]'];
    const foundPlaceholders = placeholders.filter(p => output.includes(p));
    if (foundPlaceholders.length > 0) {
      issues.push(`Placeholders found: ${foundPlaceholders.join(', ')}`);
    }

    // 检查虚构 API
    const fakeApiPattern = /api\.[a-z]+\.com\/v\d+\/(?!.*\.(?:json|html))/i;
    if (fakeApiPattern.test(output)) {
      issues.push('Possible fake API endpoint detected');
    }

    // 检查虚构方法名（示例性检测）
    const fakeMethodPattern = /\b(foo|bar|baz|exampleMethod|placeholderMethod)\s*\(/i;
    if (fakeMethodPattern.test(output)) {
      issues.push('Possible placeholder method name detected');
    }

    // 检查最小长度
    if (output.trim().length < 10) {
      issues.push('Output is too short (less than 10 characters)');
    }

    if (issues.length > 0) {
      return {
        gateId: 'OSG',
        gateName: '语义输出门',
        status: 'fail',
        message: 'Output has semantic issues',
        details: issues,
      };
    }

    return {
      gateId: 'OSG',
      gateName: '语义输出门',
      status: 'pass',
      message: 'Output is semantically complete',
    };
  }

  /**
   * 关卡 4：内容完整性 (Integrity)
   * 检查输出是否遗漏关键信息
   */
  private static gateIntegrity(output: string): GateResult {
    const issues: string[] = [];

    // 检查是否被截断
    const truncatedPatterns = ['...', '（未完', '(to be continued', '[truncated'];
    const lastChars = output.slice(-50);
    const isTruncated = truncatedPatterns.some(p => lastChars.includes(p));
    if (isTruncated) {
      issues.push('Output appears truncated');
    }

    // 检查代码块是否闭合
    const codeBlockOpen = (output.match(/```/g) || []).length;
    if (codeBlockOpen % 2 !== 0) {
      issues.push('Unclosed code block detected');
    }

    // 检查链接是否完整
    const brokenLinkPattern = /\[(.+?)\]\(\s*\)/g;
    const brokenLinks = output.match(brokenLinkPattern);
    if (brokenLinks && brokenLinks.length > 0) {
      issues.push(`Broken links found: ${brokenLinks.length}`);
    }

    // 检查括号是否配对
    const openParens = (output.match(/\(/g) || []).length;
    const closeParens = (output.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
    }

    if (issues.length > 0) {
      return {
        gateId: 'INTEGRITY',
        gateName: '内容完整性',
        status: 'fail',
        message: 'Output has integrity issues',
        details: issues,
      };
    }

    return {
      gateId: 'INTEGRITY',
      gateName: '内容完整性',
      status: 'pass',
      message: 'Output is complete and well-formed',
    };
  }

  /**
   * 从 ValidationResult 转换为 GateResult
   */
  static fromValidationResult(result: ValidationResult, gateId: string, gateName: string): GateResult {
    return {
      gateId,
      gateName,
      status: result.status === 'pass' ? 'pass' : (result.status === 'warning' ? 'warning' : 'fail'),
      message: result.message,
      details: result.details,
    };
  }
}

export default DecisionLock;
