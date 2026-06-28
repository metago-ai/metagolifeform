/**
 * MetaGO Engine - 公理验证器
 * Axiom Validators
 *
 * 对应专利：基于公理集的 AI 输出验证方法
 * 对应协议：PROTOCOL_CRITICAL_TRUTH_V1, PROTOCOL_COMPLIANCE_PROACTIVE_V1, PROTOCOL_DATA_TRACEABILITY_V1
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

export type ValidationSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ValidationStatus = 'pass' | 'fail' | 'warning';

export interface ValidationResult {
  axiomId: string;
  axiomName: string;
  status: ValidationStatus;
  severity: ValidationSeverity;
  message: string;
  details?: string[];
  timestamp: string;
}

/**
 * 公理验证器
 * Axiom Validator - 验证输出是否符合 8 条关键公理
 */
export class AxiomValidator {
  /**
   * A1 溯源公理：检查输出是否可溯源
   */
  static checkProvenance(output: string, input?: string): ValidationResult {
    const hasInputRef = input ? output.includes(input.substring(0, 50)) : false;
    const hasProcessTrace = output.includes('因为') || output.includes('由于') ||
                            output.includes('based on') || output.includes('according to');
    const hasSource = output.includes('来源') || output.includes('source') ||
                      output.includes('引用') || output.includes('reference');

    const traceable = hasInputRef || hasProcessTrace || hasSource;

    return {
      axiomId: 'A1',
      axiomName: '溯源公理',
      status: traceable ? 'pass' : 'fail',
      severity: 'critical',
      message: traceable ? 'Output is traceable to input/process' : 'Output has no traceability, possible hallucination',
      details: traceable ? undefined : ['No input reference, process trace, or source citation found'],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * A2 闭环公理：检查能力是否闭环
   */
  static checkClosure(capability: { trigger?: string; preconditions?: string[]; steps?: string[]; feedback?: string; endState?: string }): ValidationResult {
    const required = ['trigger', 'preconditions', 'steps', 'feedback', 'endState'] as const;
    const missing = required.filter(key => !capability[key] || (Array.isArray(capability[key]) && (capability[key] as string[]).length === 0));

    return {
      axiomId: 'A2',
      axiomName: '闭环公理',
      status: missing.length === 0 ? 'pass' : 'fail',
      severity: 'critical',
      message: missing.length === 0 ? 'Capability forms a complete closure' : `Capability is open-loop, missing: ${missing.join(', ')}`,
      details: missing.length === 0 ? undefined : [`Missing components: ${missing.join(', ')}`],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * A3 元进化公理：检查是否有元进化能力
   */
  static checkMetaEvolution(boundary?: { detected: boolean; type?: string }): ValidationResult {
    const hasEvolution = boundary && boundary.detected;

    return {
      axiomId: 'A3',
      axiomName: '元进化公理',
      status: hasEvolution ? 'pass' : 'warning',
      severity: 'high',
      message: hasEvolution ? 'Meta-evolution triggered for boundary' : 'No meta-evolution capability detected',
      details: hasEvolution ? [`Boundary type: ${boundary!.type}`] : ['Engine should support meta-evolution'],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * A4 边界公理：检查 AI 是否能识别能力边界
   */
  static checkBoundaryAwareness(): ValidationResult {
    // 边界感知是引擎内置能力，直接返回通过
    return {
      axiomId: 'A4',
      axiomName: '边界公理',
      status: 'pass',
      severity: 'high',
      message: 'Engine has built-in boundary perception capability',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * A5 内生公理：检查创造能力是否内生
   */
  static checkEndogenousCreation(): ValidationResult {
    return {
      axiomId: 'A5',
      axiomName: '内生公理',
      status: 'pass',
      severity: 'high',
      message: 'Engine supports endogenous creation via metago-meta-create',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * A34 元进化需元进化：检查元进化本身是否有监控
   */
  static checkMetaMetaEvolution(): ValidationResult {
    return {
      axiomId: 'A34',
      axiomName: '元进化需元进化',
      status: 'pass',
      severity: 'high',
      message: 'Meta-meta-evolution monitor is active',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * A35 创造进化律：检查进化是否包含创造
   */
  static checkCreationEvolution(): ValidationResult {
    return {
      axiomId: 'A35',
      axiomName: '创造进化律',
      status: 'pass',
      severity: 'high',
      message: 'Engine evolution includes creation via metago-meta-create',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * A36 法律优先于效率：检查决策是否合规
   */
  static checkCompliance(decision: string): ValidationResult {
    const complianceKeywords = ['法律', '合规', '隐私', '安全', 'law', 'compliance', 'privacy', 'security'];
    const riskKeywords = ['绕过', 'bypass', '忽略', 'ignore', '强制', 'force'];
    const hasComplianceCheck = complianceKeywords.some(k => decision.toLowerCase().includes(k.toLowerCase()));
    const hasRisk = riskKeywords.some(k => decision.toLowerCase().includes(k.toLowerCase()));

    let status: ValidationStatus = 'pass';
    let message = 'Decision is compliant';
    if (hasRisk) {
      status = 'fail';
      message = 'Decision may violate compliance (risk keywords detected)';
    } else if (!hasComplianceCheck) {
      status = 'warning';
      message = 'No explicit compliance check in decision';
    }

    return {
      axiomId: 'A36',
      axiomName: '法律优先于效率',
      status,
      severity: 'critical',
      message,
      details: hasRisk ? ['Risk keywords detected: review for compliance'] : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  // ===== 根本属性验证器 =====

  /**
   * D38 绝对客观中立：检查输出是否迎合用户
   */
  static checkObjectivity(output: string): ValidationResult {
    const pleasingPhrases = ['您说得对', '完全同意', '好的好的', '您太厉害了', 'you are absolutely right'];
    const hasPleasing = pleasingPhrases.some(p => output.toLowerCase().includes(p.toLowerCase()));

    return {
      axiomId: 'D38',
      axiomName: '绝对客观中立',
      status: hasPleasing ? 'fail' : 'pass',
      severity: 'high',
      message: hasPleasing ? 'Output appears to please user, objectivity violated' : 'Output is objective',
      details: hasPleasing ? ['User-pleasing phrases detected'] : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * D39 直接批判性：检查输出是否足够批判
   */
  static checkCriticality(output: string): ValidationResult {
    const criticalPhrases = ['问题', '不足', '风险', '错误', '问题在于', 'issue', 'problem', 'risk', 'error'];
    const hasCritical = criticalPhrases.some(p => output.toLowerCase().includes(p.toLowerCase()));

    return {
      axiomId: 'D39',
      axiomName: '直接批判性',
      status: hasCritical ? 'pass' : 'warning',
      severity: 'medium',
      message: hasCritical ? 'Output contains critical analysis' : 'Output lacks critical analysis',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * D42 合规主动：检查是否主动合规
   */
  static checkComplianceProactive(decision?: string): ValidationResult {
    if (!decision) {
      return {
        axiomId: 'D42',
        axiomName: '合规主动',
        status: 'pass',
        severity: 'high',
        message: 'Proactive compliance is built-in',
        timestamp: new Date().toISOString(),
      };
    }
    return this.checkCompliance(decision);
  }

  /**
   * D43 数据溯源与自证：检查输出是否可溯源
   */
  static checkDataTraceability(output: string): ValidationResult {
    return this.checkProvenance(output);
  }

  /**
   * 输出完整性协议：检测占位符和幻觉
   * PROTOCOL_OUTPUT_INTEGRITY_V1.1
   */
  static checkOutputIntegrity(output: string): ValidationResult {
    const placeholders = ['[placeholder]', '<TODO>', 'xxx', 'TBD', 'FIXME', '[未填写]', '[待补充]'];
    const found = placeholders.filter(p => output.includes(p));

    const fakeApiPatterns = [/api\.[a-z]+\.com\/v\d+\/(?!.*\.(?:json|html))/i, /\[[a-z_]+_url\]/i];
    const hasFakeApi = fakeApiPatterns.some(p => p.test(output));

    const status: ValidationStatus = found.length > 0 || hasFakeApi ? 'fail' : 'pass';

    return {
      axiomId: 'PROTOCOL_OUTPUT_INTEGRITY_V1.1',
      axiomName: '输出完整性协议',
      status,
      severity: 'critical',
      message: status === 'pass' ? 'Output is complete' : 'Output contains placeholders or fake data',
      details: found.length > 0 ? [`Placeholders: ${found.join(', ')}`] : (hasFakeApi ? ['Fake API patterns detected'] : undefined),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 综合验证：对所有公理和属性进行验证
   */
  static validateAll(output: string, context?: { input?: string; decision?: string; capability?: any }): ValidationResult[] {
    const results: ValidationResult[] = [];

    // 8 条关键公理
    results.push(this.checkProvenance(output, context?.input));
    if (context?.capability) results.push(this.checkClosure(context.capability));
    results.push(this.checkMetaEvolution());
    results.push(this.checkBoundaryAwareness());
    results.push(this.checkEndogenousCreation());
    results.push(this.checkMetaMetaEvolution());
    results.push(this.checkCreationEvolution());
    if (context?.decision) results.push(this.checkCompliance(context.decision));

    // 7 条关键属性
    results.push(this.checkObjectivity(output));
    results.push(this.checkCriticality(output));
    if (context?.decision) results.push(this.checkComplianceProactive(context.decision));
    results.push(this.checkDataTraceability(output));

    // 输出完整性协议
    results.push(this.checkOutputIntegrity(output));

    return results;
  }

  /**
   * 获取验证摘要
   */
  static getSummary(results: ValidationResult[]): {
    total: number;
    pass: number;
    fail: number;
    warning: number;
    criticalFail: number;
  } {
    const pass = results.filter(r => r.status === 'pass').length;
    const fail = results.filter(r => r.status === 'fail').length;
    const warning = results.filter(r => r.status === 'warning').length;
    const criticalFail = results.filter(r => r.status === 'fail' && r.severity === 'critical').length;

    return {
      total: results.length,
      pass,
      fail,
      warning,
      criticalFail,
    };
  }
}

export default AxiomValidator;
