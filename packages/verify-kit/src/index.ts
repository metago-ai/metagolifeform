/**
 * @metago-ai/verify-kit
 *
 * AI 交付质量保证系统 —— 核心验证引擎
 *
 * 把"AI 知道要做"变成"AI 不可绕过地执行"的强制门控。
 */

// ============ 类型定义 ============

export interface VerifyConfig {
  /** 技术层配置 */
  tech?: {
    tsc?: boolean
    build?: boolean
    artifactScan?: boolean
    artifactDir?: string
  }
  /** 业务层配置 */
  business?: {
    webUrl?: string
    healthEndpoint?: string
    pingMessage?: Record<string, unknown>
    expectedPingResponse?: string
  }
  /** 链路层配置 */
  links?: Array<{
    name: string
    url: string
    minSizeMB?: number
  }>
  /** 超时（毫秒） */
  timeout?: number
}

export interface VerifyResult {
  id: string
  name: string
  passed: boolean
  evidence: string
  duration?: number
}

export interface VerifyReport {
  timestamp: string
  total: number
  passed: number
  failed: number
  allPassed: boolean
  results: VerifyResult[]
  layers: {
    tech: boolean
    business: boolean
    links: boolean
  }
}

// ============ 执行器 ============

export async function runVerification(config: VerifyConfig): Promise<VerifyReport> {
  const results: VerifyResult[] = []
  const start = Date.now()

  // L1 技术层
  if (config.tech) {
    if (config.tech.tsc) {
      results.push(await checkTSC())
    }
    if (config.tech.build) {
      results.push(await checkBuild())
    }
    if (config.tech.artifactScan) {
      results.push(await checkArtifact(config.tech.artifactDir || 'dist'))
    }
  }

  // L2 业务层
  if (config.business) {
    if (config.business.webUrl) {
      results.push(await checkHttpReachable('V2.1', 'Web 端可达', config.business.webUrl))
    }
    if (config.business.healthEndpoint) {
      results.push(await checkHttpReachable('V2.2', '健康检查', config.business.healthEndpoint))
    }
  }

  // L3 链路层
  if (config.links) {
    for (const link of config.links) {
      results.push(await checkLink(link.name, link.url, link.minSizeMB))
    }
  }

  // 汇总
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const allPassed = failed === 0

  const report: VerifyReport = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    allPassed,
    results,
    layers: {
      tech: results.filter(r => r.id.startsWith('V1')).every(r => r.passed),
      business: results.filter(r => r.id.startsWith('V2')).every(r => r.passed),
      links: results.filter(r => r.id.startsWith('V3')).every(r => r.passed),
    },
  }

  return report
}

// ============ 默认检查实现 ============

async function checkTSC(): Promise<VerifyResult> {
  const start = Date.now()
  try {
    const { execSync } = await import('child_process')
    const output = execSync('npx tsc -b 2>&1 || true', { encoding: 'utf-8', timeout: 120000 })
    const hasError = /error TS/.test(output)
    return {
      id: 'V1.1',
      name: 'TypeScript 类型检查',
      passed: !hasError,
      evidence: hasError ? '发现 TS 错误' : '0 errors',
      duration: Date.now() - start,
    }
  } catch (e) {
    return {
      id: 'V1.1',
      name: 'TypeScript 类型检查',
      passed: false,
      evidence: e instanceof Error ? e.message : String(e),
      duration: Date.now() - start,
    }
  }
}

async function checkBuild(): Promise<VerifyResult> {
  const start = Date.now()
  try {
    const { execSync } = await import('child_process')
    const output = execSync('npx vite build 2>&1 || true', { encoding: 'utf-8', timeout: 180000 })
    const passed = output.includes('built in')
    const chunkMatch = output.match(/(\d+) chunks/)
    return {
      id: 'V1.2',
      name: 'Vite 构建',
      passed,
      evidence: chunkMatch ? `${chunkMatch[1]} chunks` : (passed ? 'built' : 'failed'),
      duration: Date.now() - start,
    }
  } catch (e) {
    return {
      id: 'V1.2',
      name: 'Vite 构建',
      passed: false,
      evidence: e instanceof Error ? e.message : String(e),
      duration: Date.now() - start,
    }
  }
}

async function checkArtifact(artifactDir: string): Promise<VerifyResult> {
  const start = Date.now()
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const distPath = path.resolve(process.cwd(), artifactDir)
    try {
      await fs.access(distPath)
    } catch {
      return {
        id: 'V1.3',
        name: '构建产物扫描',
        passed: false,
        evidence: `${artifactDir} 目录不存在`,
        duration: Date.now() - start,
      }
    }
    return {
      id: 'V1.3',
      name: '构建产物扫描',
      passed: true,
      evidence: `${artifactDir} 存在`,
      duration: Date.now() - start,
    }
  } catch (e) {
    return {
      id: 'V1.3',
      name: '构建产物扫描',
      passed: false,
      evidence: e instanceof Error ? e.message : String(e),
      duration: Date.now() - start,
    }
  }
}

async function checkHttpReachable(id: string, name: string, url: string): Promise<VerifyResult> {
  const start = Date.now()
  try {
    const https = await import('https')
    const http = url.startsWith('http://') ? await import('http') : https
    const result = await new Promise<{ status?: number; error?: string }>((resolve) => {
      const req = http.request(url, { method: 'HEAD', timeout: 15000 }, (res) => {
        resolve({ status: res.statusCode })
      })
      req.on('error', (e) => resolve({ error: e.message }))
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }) })
      req.end()
    })
    return {
      id,
      name,
      passed: result.status === 200,
      evidence: `HTTP ${result.status || 'ERROR'} ${result.error || ''}`,
      duration: Date.now() - start,
    }
  } catch (e) {
    return {
      id,
      name,
      passed: false,
      evidence: e instanceof Error ? e.message : String(e),
      duration: Date.now() - start,
    }
  }
}

async function checkLink(name: string, url: string, minSizeMB?: number): Promise<VerifyResult> {
  const start = Date.now()
  try {
    const https = await import('https')
    const result = await new Promise<{ status?: number; length?: number; error?: string }>((resolve) => {
      const req = https.request(url, { method: 'HEAD', timeout: 15000 }, (res) => {
        resolve({
          status: res.statusCode,
          length: res.headers['content-length'] ? parseInt(res.headers['content-length']) : undefined,
        })
      })
      req.on('error', (e) => resolve({ error: e.message }))
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }) })
      req.end()
    })
    const sizeMB = result.length ? (result.length / 1024 / 1024).toFixed(2) : '?'
    const sizeOk = !minSizeMB || (result.length && parseFloat(sizeMB) >= minSizeMB)
    return {
      id: `V3.${name}`,
      name,
      passed: !!(result.status === 200 && sizeOk),
      evidence: `HTTP ${result.status || 'ERROR'}, ${sizeMB} MB ${result.error || ''}`,
      duration: Date.now() - start,
    }
  } catch (e) {
    return {
      id: `V3.${name}`,
      name,
      passed: false,
      evidence: e instanceof Error ? e.message : String(e),
      duration: Date.now() - start,
    }
  }
}

// ============ AI 自律执行协议（配套） ============

export const SELF_DISCIPLINE_QUESTIONS = [
  '我运行了 verify 吗？',
  'verify 有 FAIL 吗？',
  '报告含验证小节吗？',
  '每项 ✅ 都有证据吗？',
  '我做业务层验证了吗？',
] as const

export function disciplineCheck(report: VerifyReport): {
  canDeclareComplete: boolean
  failures: string[]
} {
  const failures: string[] = []

  if (report.total === 0) failures.push('未运行任何验证')
  if (report.failed > 0) failures.push(`${report.failed} 项验证失败`)
  if (!report.layers.tech) failures.push('技术层未通过')
  if (!report.layers.business) failures.push('业务层未通过')

  return {
    canDeclareComplete: failures.length === 0,
    failures,
  }
}

// ============ 反绕过识别 ============

export const BYPASS_PATTERNS = [
  '应该没问题',
  '逻辑上正确',
  '之前验证过',
  '理论上没问题',
  '应该是好的',
  '估计没问题',
] as const

export function detectBypass(text: string): string[] {
  return BYPASS_PATTERNS.filter(pattern => text.toLowerCase().includes(pattern))
}
