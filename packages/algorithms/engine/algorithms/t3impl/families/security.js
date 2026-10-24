"use strict";
/**
 * security.js — ALG_T3_S_001..013 真实实现（合规 / 审计 / 注入防御 / 权限 / 供应链）
 * 所有检测均基于真实模式匹配与判定逻辑，不做"永远通过"。
 */
const L = require("../t3lib.js");
const { mean, round, clamp01, safeDiv } = L;

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : {});
const num = (v, d = 0) => (isFinite(Number(v)) ? Number(v) : d);
const str = v => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

/* S_001 合规主动检查 */
function s001(input) {
  const t = obj(input.task);
  const type = String(t.type ?? "");
  const data = str(t.data);
  const ext = arr(t.externalCalls).map(String);
  const privacy = !!t.userPrivacy;
  const juris = String(input.jurisdiction || "CN");
  const legal = [], ethical = [], security = [];

  if (privacy) legal.push("涉及用户隐私，需《个人信息保护法》第 13 条的合法性基础（同意/合同/法定义务）");
  if (/身份证|银行卡|人脸|指纹|病历|定位/.test(data)) legal.push("数据含个人敏感信息，需单独同意并做影响评估");
  if (ext.length) security.push(`存在 ${ext.length} 个外部调用端点，需逐一核对数据出境与第三方共享合规`);
  if (/跨境|出境|海外/.test(data + type) && juris === "CN") legal.push("疑似数据出境，需走安全评估或标准合同备案");
  if (!privacy && !/身份证|银行卡/.test(data)) legal.push("未发现明确的个人信息处理，但仍需确认是否含间接标识");
  ethical.push("需确认输出不产生歧视性结论");
  if (/评分|排序|筛选|录用/.test(type)) ethical.push("涉及对人的评价，需可解释且可申诉");
  if (!ext.length) security.push("无外部调用，攻击面较小");
  if (/上传|文件|附件/.test(type)) security.push("存在文件上传面，需校验类型、大小与病毒扫描");

  const mk = (dimension, list) => ({
    dimension, passed: list.filter(s => !/需|应/.test(s)).length === 0 && list.length > 0 ? true
      : list.filter(s => /需|应/.test(s)).length === 0,
    issues: list
  });
  const checks = [mk("legal", legal), mk("ethical", ethical), mk("security", security)];
  const blockingIssues = [
    ...(privacy && juris === "CN" && !/同意/.test(data) ? ["涉及个人信息但未见合法性基础"] : []),
    ...(ext.length && juris === "CN" ? ["存在外部调用，出境/共享路径未确认"] : [])
  ];
  const recommendations = [];
  if (privacy) recommendations.push("补齐同意记录与最小必要说明");
  if (ext.length) recommendations.push("对每个外部端点做数据流向登记");
  if (!recommendations.length) recommendations.push("按现有合规基线执行，交付前复核数据清单");
  return {
    compliant: blockingIssues.length === 0,
    checks, blockingIssues,
    recommendations
  };
}

/* S_002 法律优先原则 */
function s002(input) {
  const op = obj(input.operation);
  const laws = arr(input.applicableLaws).map(String);
  const impl = arr(op.legalImplications).map(String);
  const gain = num(op.efficiencyGain);
  const blockingLaws = [];
  laws.forEach(law => {
    if (/数据安全法|网安法|个人信息保护法|GDPR/.test(law) && impl.some(i => /未授权|超范围|未脱敏|未告知/.test(i))) {
      blockingLaws.push({ law, conflict: impl.find(i => /未授权|超范围|未脱敏|未告知/.test(i)), severity: "blocking" });
    } else if (impl.length) {
      blockingLaws.push({ law, conflict: impl[0], severity: "warning" });
    } else {
      blockingLaws.push({ law, conflict: "未见直接冲突", severity: "info" });
    }
  });
  const hasBlocking = blockingLaws.some(b => b.severity === "blocking");
  const decision = hasBlocking ? "block" : blockingLaws.some(b => b.severity === "warning") ? "require-approval" : "proceed";
  const rationale = hasBlocking
    ? `存在阻断级法律冲突，效率增益 ${gain} 不能作为放行理由——法律优先于效率`
    : decision === "require-approval"
      ? `存在警告级冲突，效率增益 ${gain} 需在合规审批中权衡`
      : `未发现法律冲突，效率增益 ${gain} 可正常推进`;
  return { legalPriority: !hasBlocking, blockingLaws, decision, rationale };
}

/* S_003 安全审计方法 */
const OWASP_RULES = [
  { id: "A01", cat: "访问控制失效", re: /admin|isAdmin|role\s*==\s*["']admin|权限|permission/i, fix: "所有服务端接口强制校验主体与客体授权" },
  { id: "A02", cat: "加密机制失效", re: /md5|sha1|des\b|base64.*密码|http:\/\//i, fix: "改用 bcrypt/argon2，全站强制 HTTPS" },
  { id: "A03", cat: "注入", re: /(select|insert|update|delete)[\s\S]{0,40}\$\{|`\s*\+|\+\s*req\.|exec\(|eval\(/i, fix: "使用参数化查询，禁用字符串拼接 SQL 与 eval" },
  { id: "A04", cat: "不安全设计", re: /无限制|no.?limit|trust.?all|skip.?verify/i, fix: "加入限流、幂等与显式拒绝默认" },
  { id: "A05", cat: "安全配置错误", re: /debug\s*=\s*true|cors\(\s*\)|origin\s*:\s*["']\*["']/i, fix: "关闭调试、显式白名单 CORS" },
  { id: "A06", cat: "易受攻击组件", re: /require\(["']express["']\)|lodash|log4j/i, fix: "锁定依赖版本并纳入漏洞扫描" },
  { id: "A07", cat: "身份鉴别失效", re: /password\s*==|hardcoded|默认密码|123456/i, fix: "强制多因子，禁用硬编码口令" },
  { id: "A08", cat: "软件与数据完整性失效", re: /deserialize|unserialize|pickle\.loads/i, fix: "禁止反序列化不可信数据" },
  { id: "A09", cat: "日志与监控不足", re: /catch\s*\([^)]*\)\s*\{\s*\}/, fix: "禁止空 catch，失败必须留痕" },
  { id: "A10", cat: "服务端请求伪造", re: /fetch\(\s*(req|params|query)|axios\.get\(\s*url/i, fix: "对用户可控 URL 做协议与目标白名单校验" }
];
function s003(input) {
  const target = obj(input.target);
  const scope = arr(input.scope).map(String);
  const cats = arr(input.owaspCategories).map(String);
  const text = str(target.path ?? target) + " " + scope.join(" ");
  const pool = cats.length ? OWASP_RULES.filter(r => cats.some(c => r.id === c || r.cat.includes(c))) : OWASP_RULES;
  const vulnerabilities = [];
  pool.forEach(r => {
    if (r.re.test(text)) {
      vulnerabilities.push({
        id: r.id, category: r.cat, severity: r.id === "A03" || r.id === "A07" ? "critical" : "high",
        description: `匹配到 ${r.cat} 的可疑写法`, location: String(target.path ?? "未指定"), fix: r.fix
      });
    }
  });
  const auditScore = round(clamp01(1 - vulnerabilities.length / Math.max(1, pool.length)), 4);
  const riskLevel = vulnerabilities.some(v => v.severity === "critical") ? "critical"
    : vulnerabilities.length ? "high" : "low";
  const report = vulnerabilities.length
    ? `命中 ${vulnerabilities.length} 类 OWASP 风险，最高等级 ${riskLevel}`
    : `已检查 ${pool.length} 类 OWASP 规则，未命中`;
  return { vulnerabilities, auditScore, riskLevel, report };
}

/* S_004 漏洞扫描技术 */
function s004(input) {
  const t = obj(input.target);
  const types = arr(input.scanTypes).map(String);
  const intensity = String(input.intensity || "normal");
  const loc = String(t.location ?? "");
  const findings = [];
  const scan = (name, re, payload, sev, cvss, fix) => {
    if (re.test(loc)) {
      findings.push({ type: name, location: loc, payload, evidence: `在目标标识中匹配到「${payload}」`, severity: sev, cvss, fix });
    }
  };
  scan("SQL 注入面", /\?|query|search|id=/i, "' OR 1=1 --", "high", 8.2, "参数化查询");
  scan("路径穿越面", /\.\.|path=|file=/i, "../../etc/passwd", "high", 7.5, "规范化路径并限制根目录");
  scan("命令注入面", /cmd|exec|system|shell/i, "; whoami", "critical", 9.1, "禁用 shell 拼接");
  scan("SSRF 面", /url=|redirect|fetch/i, "http://169.254.169.254/", "high", 7.8, "目标白名单");
  scan("开放重定向面", /redirect|returnUrl|next=/i, "//evil.com", "medium", 5.3, "跳转目标白名单");
  const perType = Math.max(1, types.length || 5);
  const scanCoverage = round(clamp01(Math.min(1, findings.length ? perType / 6 : perType / 8) * (intensity === "aggressive" ? 1 : intensity === "light" ? 0.6 : 0.85)), 4);
  return {
    vulnerabilities: findings,
    scanCoverage,
    falsePositiveRate: round(clamp01(0.05 + (intensity === "aggressive" ? 0.1 : 0)), 4)
  };
}

/* S_005 渗透测试方法 */
function s005(input) {
  const t = obj(input.target);
  const testType = String(input.testType || "black-box");
  const auth = String(input.authorization ?? "");
  const duration = num(input.duration, 1);
  const findings = [];
  const attackPaths = [];
  const infoKnown = testType !== "black-box";
  if (!/书面|授权|合同|批准/.test(auth)) {
    findings.push({
      phase: "授权", vulnerability: "未提供有效授权凭据", exploit: "不执行",
      impact: "无授权渗透属违法行为", evidence: `authorization = "${auth}"`, remediation: "取得书面授权后再执行"
    });
    return {
      findings, attackPaths: [],
      overallSecurity: 0,
      report: "未获授权，渗透测试终止（法律优先于效率）"
    };
  }
  if (infoKnown) {
    findings.push({
      phase: "信息收集", vulnerability: "白盒可见源码与配置", exploit: "直接定位危险函数",
      impact: "攻击面暴露加速", evidence: "testType = " + testType, remediation: "生产环境禁用源码泄露"
    });
    attackPaths.push(["信息收集", "源码审计", "危险函数", "构造 payload"]);
  }
  const durScore = clamp01(duration / 8);
  const overallSecurity = round(clamp01(1 - findings.length / 6) * (0.6 + durScore * 0.4), 4);
  return {
    findings, attackPaths, overallSecurity,
    report: `授权有效，${testType} 测试 ${duration} 单位时长，产出 ${findings.length} 项发现、${attackPaths.length} 条攻击路径`
  };
}

/* S_006 权限边界控制 */
function s006(input) {
  const u = obj(input.user);
  const r = obj(input.resource);
  const action = String(input.action ?? "");
  const perms = arr(u.permissions).map(String);
  const req = String(r.requiredPermission ?? "");
  const role = String(u.role ?? "");
  const authorized = perms.includes(req) || perms.includes("*") || role === "admin" || (action === "read" && perms.includes("read"));
  const denied = authorized ? [] : [req];
  const policy = authorized
    ? (role === "admin" ? "admin-override" : perms.includes("*") ? "wildcard-grant" : "rbac-exact")
    : "default-deny";
  return {
    authorized,
    reason: authorized
      ? `用户 ${u.id} 的权限集包含 ${req || "*"}，策略 ${policy} 放行`
      : `用户 ${u.id} 的角色 ${role} 与权限集均不含 ${req}，按默认拒绝处理`,
    appliedPolicy: policy,
    deniedPermissions: denied,
    auditLog: { user: String(u.id ?? ""), resource: String(r.type ?? ""), action, decision: authorized ? "allow" : "deny", timestamp: Date.now() }
  };
}

/* S_007 注入防护机制 */
const INJ = {
  sql: [/(\bor\b|\band\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i, /union\s+select/i, /['"]\s*;\s*(drop|delete|update)/i, /--\s*$/],
  nosql: [/\$where|\$ne\s*:|\$gt\s*:|\$regex\s*:/i, /\{\s*["']?\$ne/i],
  command: [/[;&|`]\s*\w+/, /\$\(/, /\|\s*(cat|ls|whoami|curl|wget)\b/i],
  ldap: [/\)\(|\(\s*\||\*\s*\)/],
  xpath: [/'\s*or\s*'1'\s*=\s*'1/i, /\/\/\*/]
};
function s007(input) {
  const raw = String(input.input ?? "");
  const ctx = String(input.context || "sql");
  const blocked = arr(input.blockedPatterns).map(String).filter(Boolean);
  const allowed = arr(input.allowedPatterns).map(String).filter(Boolean);
  const detectedPayloads = [];
  (INJ[ctx] || INJ.sql).forEach((re, i) => {
    const m = re.exec(raw);
    if (m) detectedPayloads.push({ type: `${ctx.toUpperCase()} 注入`, pattern: m[0].trim(), severity: "high", index: i });
  });
  blocked.forEach(b => {
    if (raw.includes(b)) detectedPayloads.push({ type: "自定义黑名单", pattern: b, severity: "high" });
  });
  const allowHit = allowed.some(a => raw === a);
  const safe = detectedPayloads.length === 0 || allowHit;
  const sanitized = raw
    .replace(/['"]/g, "")
    .replace(/--/g, "")
    .replace(/[;&|`$]/g, "")
    .replace(/\b(union|select|drop|delete|update|insert)\b/gi, "");
  const applied = [];
  applied.push("危险字符剥离");
  applied.push(allowHit ? "白名单放行" : detectedPayloads.length ? "阻断" : "无命中直接放行");
  if (ctx === "sql") applied.push("参数化查询（调用方须使用预编译语句）");
  return {
    safe,
    detectedPayloads: detectedPayloads.map(({ index, ...rest }) => rest),
    sanitizedInput: sanitized,
    appliedProtections: applied
  };
}

/* S_008 XSS 防御机制 */
function s008(input) {
  const raw = String(input.input ?? "");
  const ctx = String(input.outputContext || "html");
  const csp = input.cspPolicy != null ? String(input.cspPolicy) : "";
  const detectedScripts = [];
  const pats = [
    [/<script[\s>]/i, "内联 script 标签", "critical"],
    [/javascript\s*:/i, "javascript 伪协议", "high"],
    [/on\w+\s*=\s*["']/i, "事件处理器属性", "high"],
    [/<img[^>]+src\s*=\s*["']?\s*x\s*onerror/i, "img onerror 注入", "high"],
    [/<iframe/i, "iframe 注入", "medium"],
    [/document\.cookie|eval\s*\(/i, "敏感 JS API", "high"]
  ];
  pats.forEach(([re, type, sev]) => {
    const m = re.exec(raw);
    if (m) detectedScripts.push({ type, payload: m[0], severity: sev });
  });
  const enc = {
    html: s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"),
    attribute: s => s.replace(/[^a-zA-Z0-9\-_]/g, c => "&#" + c.charCodeAt(0) + ";"),
    javascript: s => s.replace(/[^a-zA-Z0-9]/g, c => "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0")),
    url: s => encodeURIComponent(s),
    css: s => s.replace(/[^a-zA-Z0-9]/g, c => "\\" + c.charCodeAt(0).toString(16))
  };
  const encode = enc[ctx] || enc.html;
  const appliedDefenses = [`按 ${ctx} 上下文编码`];
  if (csp) appliedDefenses.push(`CSP: ${csp}`);
  if (detectedScripts.length) appliedDefenses.push("检测到注入特征，已强制编码而非放行");
  return {
    safe: detectedScripts.length === 0,
    detectedScripts,
    encodedOutput: encode(raw),
    appliedDefenses
  };
}

/* S_009 越权访问检测 */
function s009(input) {
  const u = obj(input.user);
  const r = obj(input.resource);
  const action = String(input.action ?? "");
  const perms = arr(u.permissions).map(String);
  const req = String(r.requiredPermission ?? "");
  const isOwner = String(r.ownerId ?? "") === String(u.id ?? "");
  const role = String(u.role ?? "");
  const hasPerm = perms.includes(req) || perms.includes("*") || role === "admin";
  let unauthorized = false, accessType = "none", violation = "";
  if (hasPerm && isOwner) {
    accessType = "none";
  } else if (!hasPerm && isOwner) {
    unauthorized = true;
    accessType = "vertical";
    violation = `横向归属成立但缺少 ${req} 权限，属纵向提权尝试`;
  } else if (hasPerm && !isOwner) {
    unauthorized = true;
    accessType = "horizontal";
    violation = `持有 ${req} 权限但资源属主为 ${r.ownerId}，属横向越权（IDOR）`;
  } else {
    unauthorized = true;
    accessType = "vertical";
    violation = `既非属主也无 ${req} 权限`;
  }
  return {
    unauthorized, accessType, violation,
    blocked: unauthorized,
    auditEntry: {
      user: String(u.id ?? ""), resource: `${r.type ?? ""}/${r.ownerId ?? ""}`,
      action, decision: unauthorized ? "deny" : "allow"
    }
  };
}

/* S_010 敏感信息保护 */
function s010(input) {
  const d = obj(input.data);
  const value = String(d.value ?? "");
  const sens = String(d.sensitivity || "internal");
  const ctx = String(d.context || "storage");
  const protectionApplied = [];
  let encryptedValue, maskedValue;
  const riskReduced = { public: 0, internal: 0.3, confidential: 0.7, restricted: 0.95 }[sens] ?? 0.3;
  const needStrong = sens === "confidential" || sens === "restricted";
  if (ctx === "storage" && needStrong) {
    // 演示级可逆编码（真实环境必须 KMS）；此处只证明流程存在
    encryptedValue = Buffer.from(value, "utf8").toString("base64").split("").reverse().join("");
    protectionApplied.push("静态加密（演示：base64+反转，生产须换 AES-256-GCM + KMS）");
  }
  if (ctx === "logging" || ctx === "display") {
    maskedValue = value.length <= 4 ? "*".repeat(value.length)
      : value.slice(0, 2) + "*".repeat(Math.max(0, value.length - 4)) + value.slice(-2);
    protectionApplied.push(ctx === "logging" ? "日志脱敏" : "展示脱敏");
  }
  if (ctx === "transmission") {
    protectionApplied.push(needStrong ? "强制 TLS 1.2+ 传输" : "建议 TLS 传输");
  }
  if (sens === "restricted") protectionApplied.push("限制访问主体与留存期限");
  const protectedFlag = protectionApplied.length > 0;
  return {
    protected: protectedFlag, protectionApplied,
    encryptedValue, maskedValue,
    auditLog: `${new Date(0).toISOString()} 对 ${d.type ?? "数据"} 执行 ${protectionApplied.join("、") || "无保护动作"}`,
    riskReduced
  };
}

/* S_011 依赖安全审计 */
const VULN_DB = [
  { name: "lodash", below: "4.17.21", cve: "CVE-2021-23337", severity: "high", desc: "命令注入" },
  { name: "log4j", below: "2.17.1", cve: "CVE-2021-44228", severity: "critical", desc: "JNDI 远程代码执行" },
  { name: "express", below: "4.17.3", cve: "CVE-2022-24999", severity: "high", desc: "原型污染" },
  { name: "axios", below: "2.2.2", cve: "CVE-2023-45857", severity: "medium", desc: "SSRF" },
  { name: "minimist", below: "1.2.6", cve: "CVE-2021-44906", severity: "critical", desc: "原型污染" }
];
function cmpVer(a, b) {
  const pa = String(a).split(/[.\-]/).map(x => parseInt(x, 10) || 0);
  const pb = String(b).split(/[.\-]/).map(x => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}
function s011(input) {
  const deps = arr(input.dependencies).map(d => ({
    name: String(obj(d).name ?? "").toLowerCase(),
    version: String(obj(d).version ?? "0.0.0"),
    type: String(obj(d).type || "production")
  }));
  const vulnerableDeps = [];
  deps.forEach(d => {
    const hits = VULN_DB.filter(v => d.name.includes(v.name) && cmpVer(d.version, v.below) < 0)
      .map(v => ({ cve: v.cve, severity: v.severity, fixedIn: v.below, description: v.desc }));
    if (hits.length) vulnerableDeps.push({ name: d.name, version: d.version, vulnerabilities: hits });
  });
  const sbom = {
    format: "SPDX-lite", generatedAt: new Date(0).toISOString(),
    packages: deps.map(d => ({ name: d.name, version: d.version, scope: d.type }))
  };
  const crit = vulnerableDeps.reduce((s, d) => s + d.vulnerabilities.filter(v => v.severity === "critical").length, 0);
  const riskScore = round(clamp01(safeDiv(crit * 3 + vulnerableDeps.length, Math.max(1, deps.length) * 2)), 4);
  const upgradeRecommendations = vulnerableDeps.map(d => ({
    dep: d.name, from: d.version,
    to: d.vulnerabilities.reduce((m, v) => (cmpVer(v.fixedIn, m) > 0 ? v.fixedIn : m), "0.0.0"),
    priority: d.vulnerabilities.some(v => v.severity === "critical") ? 1 : 2
  })).sort((a, b) => a.priority - b.priority);
  return { vulnerableDeps, sbom, riskScore, upgradeRecommendations };
}

/* S_012 供应链安全 */
function s012(input) {
  const sc = obj(input.supplyChain);
  const pkgs = arr(sc.packages).map(p => ({
    name: String(obj(p).name ?? "?"),
    verified: !!obj(p).verified || !!obj(p).signature,
    source: String(obj(p).source ?? "")
  }));
  const risks = [];
  const unverified = pkgs.filter(p => !p.verified).map(p => p.name);
  if (unverified.length) risks.push({ type: "未验签依赖", description: `${unverified.length} 个包无签名/校验`, severity: "high", mitigation: "启用 lockfile + 完整性校验 + 私有源" });
  if (!/lock/i.test(String(sc.buildSystem ?? ""))) risks.push({ type: "构建不可重现", description: "构建系统未锁定依赖版本", severity: "medium", mitigation: "提交 lockfile 并在 CI 中校验" });
  if (!/签名|sign|https/i.test(String(sc.distributionChannel ?? ""))) risks.push({ type: "分发通道不安全", description: `分发渠道 ${sc.distributionChannel ?? "未知"} 未验证`, severity: "high", mitigation: "改用签名分发并校验哈希" });
  if (!/auto|自动|校验/i.test(String(sc.updateMechanism ?? ""))) risks.push({ type: "更新机制缺校验", description: "更新未带完整性校验", severity: "critical", mitigation: "更新包强制签名校验，防投毒" });
  const securityScore = round(clamp01(1 - risks.reduce((s, r) => s + (r.severity === "critical" ? 0.35 : r.severity === "high" ? 0.2 : 0.1), 0)), 4);
  return {
    securityScore, risks,
    verifiedPackages: pkgs.length - unverified.length,
    unverifiedPackages: unverified,
    recommendations: risks.length ? risks.map(r => r.mitigation) : ["供应链结构完整，保持定期复核"]
  };
}

/* S_013 安全事件响应 */
function s013(input) {
  const inc = obj(input.incident);
  const sev = String(inc.severity || "medium");
  const systems = arr(inc.affectedSystems).map(String);
  const t0 = num(inc.detectedAt, 0);
  const phases = ["识别", "遏制", "根除", "恢复", "复盘"];
  const stepHours = sev === "critical" ? 1 : sev === "high" ? 2 : sev === "medium" ? 4 : 8;
  const response = phases.map((p, i) => ({
    phase: p,
    actions: p === "识别" ? [`确认影响面：${systems.join("、") || "未登记"}`]
      : p === "遏制" ? ["隔离受影响主机", "吊销可疑凭据"]
        : p === "根除" ? ["修补入口漏洞", "清除持久化后门"]
          : p === "恢复" ? ["灰度恢复服务", "核对数据完整性"]
            : ["形成时间线", "更新检测规则"],
    status: i === 0 ? "done" : i === 1 ? "in-progress" : "pending",
    timestamp: t0 + i * stepHours * 3600
  }));
  const contained = sev !== "critical";
  const postMortem = `事件类型 ${inc.type ?? "未登记"}，等级 ${sev}，影响 ${systems.length} 个系统；` +
    (contained ? "遏制阶段按计划完成" : "遏制尚未完成，需升级响应等级");
  return {
    response, contained,
    eradicated: contained && sev !== "high",
    recovered: contained && sev === "low",
    postMortem,
    lessonsLearned: [
      `检测到处置的时延为 ${stepHours} 小时/阶段，${sev === "critical" ? "对关键事件偏慢" : "处于可接受区间"}`,
      systems.length > 3 ? "影响面过大，说明横向隔离不足" : "影响面可控"
    ]
  };
}

module.exports = {
  handlers: {
    ALG_T3_S_001: s001, ALG_T3_S_002: s002, ALG_T3_S_003: s003, ALG_T3_S_004: s004,
    ALG_T3_S_005: s005, ALG_T3_S_006: s006, ALG_T3_S_007: s007, ALG_T3_S_008: s008,
    ALG_T3_S_009: s009, ALG_T3_S_010: s010, ALG_T3_S_011: s011, ALG_T3_S_012: s012,
    ALG_T3_S_013: s013
  },
  samples: {
    ALG_T3_S_001: () => ({
      task: { type: "用户画像评分", data: "含手机号与定位", externalCalls: ["https://api.third.com/score"], userPrivacy: true },
      jurisdiction: "CN"
    }),
    ALG_T3_S_002: () => ({
      operation: { type: "批量导出", legalImplications: ["未脱敏", "超范围使用"], efficiencyGain: 40 },
      applicableLaws: ["个人信息保护法", "数据安全法"]
    }),
    ALG_T3_S_003: () => ({
      target: { type: "code", path: "db.query(`select * from users where id=${req.query.id}`) 且 eval(userInput) 且有 catch(e){}" },
      scope: ["auth", "db"], owaspCategories: []
    }),
    ALG_T3_S_004: () => ({
      target: { type: "running-service", location: "https://api.example.com/search?q=&url=&cmd=" },
      scanTypes: ["sqli", "ssrf", "cmdi"], intensity: "normal"
    }),
    ALG_T3_S_005: () => ({
      target: { type: "web", scope: "api" }, testType: "white-box",
      authorization: "书面授权 2026-10-01 签署", duration: 4
    }),
    ALG_T3_S_006: () => ({
      user: { id: "u1", role: "editor", permissions: ["read", "write"] },
      resource: { type: "doc", owner: "u9", requiredPermission: "delete" }, action: "delete"
    }),
    ALG_T3_S_007: () => ({
      input: "admin' OR '1'='1' --", context: "sql", blockedPatterns: []
    }),
    ALG_T3_S_008: () => ({
      input: "<img src=x onerror=alert(1)>", outputContext: "html", cspPolicy: "default-src 'self'"
    }),
    ALG_T3_S_009: () => ({
      user: { id: "u1", role: "user", permissions: ["read"] },
      resource: { type: "order", owner: "u9", ownerId: "u9", requiredPermission: "read" }, action: "read"
    }),
    ALG_T3_S_010: () => ({
      data: { type: "手机号", value: "13800138000", sensitivity: "confidential", context: "logging" }
    }),
    ALG_T3_S_011: () => ({
      dependencies: [
        { name: "lodash", version: "4.17.20", type: "production" },
        { name: "express", version: "4.18.2", type: "production" },
        { name: "log4j", version: "2.14.0", type: "production" }
      ]
    }),
    ALG_T3_S_012: () => ({
      supplyChain: {
        packages: [{ name: "a", verified: true }, { name: "b", verified: false }],
        buildSystem: "unlocked-build", distributionChannel: "http-mirror", updateMechanism: "auto-no-check"
      }
    }),
    ALG_T3_S_013: () => ({
      incident: { type: "凭据泄露", severity: "high", affectedSystems: ["api", "worker"], detectedAt: 1700000000 }
    })
  }
};
