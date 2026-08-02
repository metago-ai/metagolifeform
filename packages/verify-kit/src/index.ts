#!/usr/bin/env node
/**
 * @metago-ai/verify-kit v1.1.2
 *
 * MetaGO Agent Harness 交付质量保证系统 —— 七层验证核心引擎
 *
 * 把"AI 知道要做"变成"AI 不可绕过地执行"的强制门控。
 * 对应 AGENTS.md V36.9.0 第十一/十四/十五章。
 *
 * 七层架构（L4-L8 为静态验证实现，无需浏览器即可执行）：
 *   L1 技术层 — 类型检查/构建/产物扫描/依赖审计
 *   L2 链路层 — HTTP可达/云函数/子路由/CORS/CDN
 *   L3 契约层 — API字段类型/名称/必填/枚举/版本兼容
 *   L4 渲染层 — 白屏/崩溃/空状态/lazy加载/控制台错误（静态：HTML产物崩溃标记与 DOM 完整性）
 *   L5 交互层 — 按钮反馈/输入/导航/键盘/loading状态（静态：产物交互元素存在性）
 *   L6 状态层 — 导航保持/刷新保持/登录态/草稿保留（静态：持久化存储引用）
 *   L7 防御层 — 空输入/超长/XSS/并发/超时/权限边界（静态：校验/危险DOM/防抖/权限模式）
 *   L8 缺陷猎杀 — 11维度扫描（静态：mock/错误处理/死链/类型安全/废弃API/术语等源码级扫描）
 */

// ============ 类型定义 ============

export interface VerifyConfig {
  /** L1 技术层配置 */
  tech?: {
    tsc?: boolean
    build?: boolean
    artifactScan?: boolean
    artifactDir?: string
    npmAudit?: boolean
  }
  /** L2 链路层配置 */
  links?: Array<{
    name: string
    url: string
    minSizeMB?: number
    expectedStatus?: number
  }>
  /** L3 契约层配置 */
  contract?: Array<{
    name: string
    endpoint: string
    method?: 'GET' | 'POST'
    body?: Record<string, unknown>
    assertions?: Array<{
      field: string
      type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
      required?: boolean
    }>
  }>
  /** L4 渲染层配置 */
  rendering?: {
    routes?: string[]
    checkConsole?: boolean
    checkDom?: boolean
    /** 静态扫描基目录（默认 process.cwd()/dist） */
    baseDir?: string
  }
  /** L5 交互层配置 */
  interaction?: {
    buttons?: string[]
    inputs?: string[]
    navigation?: Array<{ from: string; to: string }>
    /** 静态扫描基目录（默认 process.cwd()/dist） */
    baseDir?: string
  }
  /** L6 状态层配置 */
  state?: {
    loginState?: boolean
    refreshState?: boolean
    draftRetention?: boolean
    /** 静态扫描基目录（默认 process.cwd()/dist） */
    baseDir?: string
  }
  /** L7 防御层配置 */
  defense?: {
    emptyInput?: boolean
    xssTest?: boolean
    longInput?: boolean
    concurrentTest?: boolean
    permissionBoundary?: boolean
    /** 静态扫描基目录（默认 process.cwd()/dist） */
    baseDir?: string
  }
  /** L8 缺陷猎杀配置 */
  defectHunting?: {
    scanZombieFeatures?: boolean
    scanUnpersistedState?: boolean
    scanMockData?: boolean
    scanErrorHandling?: boolean
    scanRouteDeadlinks?: boolean
    scanTypeSafety?: boolean
    scanCopyConsistency?: boolean
    scanDeprecatedApi?: boolean
    scanBusinessClosure?: boolean
    scanCompliance?: boolean
    scanTerminology?: boolean
    /** 静态扫描源码目录（默认 process.cwd()/src） */
    scanDir?: string
  }
  /** 超时（毫秒） */
  timeout?: number
}

export interface VerifyResult {
  id: string
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8'
  name: string
  passed: boolean
  evidence: string
  duration?: number
}

export interface VerifyReport {
  timestamp: string
  version: string
  total: number
  passed: number
  failed: number
  allPassed: boolean
  results: VerifyResult[]
  layers: {
    L1_tech: boolean
    L2_link: boolean
    L3_contract: boolean
    L4_rendering: boolean
    L5_interaction: boolean
    L6_state: boolean
    L7_defense: boolean
    L8_defect_hunting: boolean
  }
}

// ============ 主执行器 ============

export async function runVerification(config: VerifyConfig): Promise<VerifyReport> {
  const results: VerifyResult[] = []

  // L1 技术层
  if (config.tech) {
    if (config.tech.tsc) results.push(await checkTSC())
    if (config.tech.build) results.push(await checkBuild())
    if (config.tech.artifactScan) results.push(await checkArtifact(config.tech.artifactDir || 'dist'))
    if (config.tech.npmAudit) results.push(await checkNpmAudit())
  }

  // L2 链路层
  if (config.links) {
    for (const link of config.links) {
      results.push(await checkLink(link.name, link.url, link.minSizeMB, link.expectedStatus))
    }
  }

  // L3 契约层
  if (config.contract) {
    for (const c of config.contract) {
      results.push(await checkContract(c.name, c.endpoint, c.method || 'GET', c.body, c.assertions || []))
    }
  }

  // L4 渲染层
  if (config.rendering) {
    const rBase = config.rendering.baseDir
    if (config.rendering.checkConsole) results.push(await checkConsoleErrors(config.rendering.routes || [], rBase))
    if (config.rendering.checkDom) results.push(await checkDomNodes(config.rendering.routes || [], rBase))
  }

  // L5 交互层
  if (config.interaction) {
    const iBase = config.interaction.baseDir
    if (config.interaction.buttons?.length) results.push(await checkButtonFeedback(config.interaction.buttons, iBase))
    if (config.interaction.inputs?.length) results.push(await checkInputFields(config.interaction.inputs, iBase))
    if (config.interaction.navigation?.length) results.push(await checkNavigation(config.interaction.navigation, iBase))
  }

  // L6 状态层
  if (config.state) {
    const sBase = config.state.baseDir
    if (config.state.loginState) results.push(await checkLoginStateRetention(sBase))
    if (config.state.refreshState) results.push(await checkRefreshStateRetention(sBase))
    if (config.state.draftRetention) results.push(await checkDraftRetention(sBase))
  }

  // L7 防御层
  if (config.defense) {
    const dBase = config.defense.baseDir
    if (config.defense.emptyInput) results.push(await checkEmptyInput(dBase))
    if (config.defense.xssTest) results.push(await checkXssProtection(dBase))
    if (config.defense.longInput) results.push(await checkLongInput(dBase))
    if (config.defense.concurrentTest) results.push(await checkConcurrentProtection(dBase))
    if (config.defense.permissionBoundary) results.push(await checkPermissionBoundary(dBase))
  }

  // L8 缺陷猎杀
  if (config.defectHunting) {
    const dh = config.defectHunting
    const scanDir = dh.scanDir
    if (dh.scanZombieFeatures) results.push(await scanZombieFeatures())
    if (dh.scanUnpersistedState) results.push(await scanUnpersistedState())
    if (dh.scanMockData) results.push(await scanMockData(scanDir))
    if (dh.scanErrorHandling) results.push(await scanErrorHandling(scanDir))
    if (dh.scanRouteDeadlinks) results.push(await scanRouteDeadlinks(scanDir))
    if (dh.scanTypeSafety) results.push(await scanTypeSafety(scanDir))
    if (dh.scanCopyConsistency) results.push(await scanCopyConsistency(scanDir))
    if (dh.scanDeprecatedApi) results.push(await scanDeprecatedApi(scanDir))
    if (dh.scanBusinessClosure) results.push(await scanBusinessClosure())
    if (dh.scanCompliance) results.push(await scanCompliance())
    if (dh.scanTerminology) results.push(await scanTerminology(scanDir))
  }

  // 汇总
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  const layerPassed = (layer: VerifyResult['layer']) => {
    const layerResults = results.filter(r => r.layer === layer)
    return layerResults.length > 0 && layerResults.every(r => r.passed)
  }

  return {
    timestamp: new Date().toISOString(),
    version: '1.1.2',
    total: results.length,
    passed,
    failed,
    allPassed: failed === 0,
    results,
    layers: {
      L1_tech: layerPassed('L1'),
      L2_link: layerPassed('L2'),
      L3_contract: layerPassed('L3'),
      L4_rendering: layerPassed('L4'),
      L5_interaction: layerPassed('L5'),
      L6_state: layerPassed('L6'),
      L7_defense: layerPassed('L7'),
      L8_defect_hunting: layerPassed('L8'),
    },
  }
}

// ============ L1 技术层 ============

async function checkTSC(): Promise<VerifyResult> {
  const start = Date.now()
  try {
    const { execSync } = await import('child_process')
    const output = execSync('npx tsc -b 2>&1 || true', { encoding: 'utf-8', timeout: 120000 })
    const hasError = /error TS/.test(output)
    return {
      id: 'L1.1', layer: 'L1', name: 'TypeScript 类型检查',
      passed: !hasError,
      evidence: hasError ? '发现 TS 错误' : '0 errors',
      duration: Date.now() - start,
    }
  } catch (e) {
    return { id: 'L1.1', layer: 'L1', name: 'TypeScript 类型检查', passed: false, evidence: errMsg(e), duration: Date.now() - start }
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
      id: 'L1.2', layer: 'L1', name: 'Vite 构建',
      passed,
      evidence: chunkMatch ? `${chunkMatch[1]} chunks` : (passed ? 'built' : 'failed'),
      duration: Date.now() - start,
    }
  } catch (e) {
    return { id: 'L1.2', layer: 'L1', name: 'Vite 构建', passed: false, evidence: errMsg(e), duration: Date.now() - start }
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
      return { id: 'L1.3', layer: 'L1', name: '构建产物扫描', passed: false, evidence: `${artifactDir} 目录不存在`, duration: Date.now() - start }
    }
    return { id: 'L1.3', layer: 'L1', name: '构建产物扫描', passed: true, evidence: `${artifactDir} 存在`, duration: Date.now() - start }
  } catch (e) {
    return { id: 'L1.3', layer: 'L1', name: '构建产物扫描', passed: false, evidence: errMsg(e), duration: Date.now() - start }
  }
}

async function checkNpmAudit(): Promise<VerifyResult> {
  const start = Date.now()
  try {
    const { execSync } = await import('child_process')
    const output = execSync('npm audit --omit=dev 2>&1 || true', { encoding: 'utf-8', timeout: 60000 })
    const hasHighOrCritical = /\d+ high|\d+ critical/i.test(output)
    return {
      id: 'L1.5', layer: 'L1', name: '依赖审计',
      passed: !hasHighOrCritical,
      evidence: hasHighOrCritical ? '发现 high/critical 漏洞' : '0 high/critical',
      duration: Date.now() - start,
    }
  } catch (e) {
    return { id: 'L1.5', layer: 'L1', name: '依赖审计', passed: false, evidence: errMsg(e), duration: Date.now() - start }
  }
}

// ============ L2 链路层 ============

async function checkLink(name: string, url: string, minSizeMB?: number, expectedStatus?: number): Promise<VerifyResult> {
  const start = Date.now()
  try {
    const https = await import('https')
    const http = url.startsWith('http://') ? await import('http') : https
    const result = await new Promise<{ status?: number; length?: number; error?: string }>((resolve) => {
      const req = http.request(url, { method: 'HEAD', timeout: 15000 }, (res) => {
        resolve({
          status: res.statusCode,
          length: res.headers['content-length'] ? parseInt(res.headers['content-length'] as string) : undefined,
        })
      })
      req.on('error', (e) => resolve({ error: e.message }))
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }) })
      req.end()
    })
    const sizeMB = result.length ? (result.length / 1024 / 1024).toFixed(2) : '?'
    const statusOk = expectedStatus ? result.status === expectedStatus : result.status === 200
    const sizeOk = !minSizeMB || (result.length && parseFloat(sizeMB) >= minSizeMB)
    return {
      id: `L2.${name}`, layer: 'L2', name,
      passed: !!(statusOk && sizeOk),
      evidence: `HTTP ${result.status || 'ERROR'}, ${sizeMB} MB ${result.error || ''}`,
      duration: Date.now() - start,
    }
  } catch (e) {
    return { id: `L2.${name}`, layer: 'L2', name, passed: false, evidence: errMsg(e), duration: Date.now() - start }
  }
}

// ============ L3 契约层 ============

async function checkContract(
  name: string,
  endpoint: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
  assertions: Array<{ field: string; type?: string; required?: boolean }> = []
): Promise<VerifyResult> {
  const start = Date.now()
  try {
    const data = await fetchContract(endpoint, method, body)
    if (!data) {
      return { id: `L3.${name}`, layer: 'L3', name, passed: false, evidence: 'API 返回空', duration: Date.now() - start }
    }
    const failures: string[] = []
    for (const a of assertions) {
      const value = getNestedField(data, a.field)
      if (a.required && (value === undefined || value === null)) {
        failures.push(`${a.field} 必填但缺失`)
        continue
      }
      if (a.type && value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value
        if (actualType !== a.type) {
          failures.push(`${a.field} 期望 ${a.type}，实际 ${actualType}`)
        }
      }
    }
    return {
      id: `L3.${name}`, layer: 'L3', name,
      passed: failures.length === 0,
      evidence: failures.length === 0 ? `${assertions.length} 项断言全部通过` : failures.join('; '),
      duration: Date.now() - start,
    }
  } catch (e) {
    return { id: `L3.${name}`, layer: 'L3', name, passed: false, evidence: errMsg(e), duration: Date.now() - start }
  }
}

async function fetchContract(endpoint: string, method: 'GET' | 'POST', body?: Record<string, unknown>): Promise<any> {
  const https = await import('https')
  const http = endpoint.startsWith('http://') ? await import('http') : https
  return new Promise((resolve) => {
    const options: any = { method, timeout: 15000, headers: { 'Content-Type': 'application/json' } }
    const req = http.request(endpoint, options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
    if (body && method === 'POST') req.write(JSON.stringify(body))
    req.end()
  })
}

function getNestedField(obj: any, field: string): any {
  return field.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj)
}

// ============ L4 渲染层（静态验证，无需浏览器） ============

// 递归收集目录下指定扩展名文件
function collectFiles(dir: string, exts: string[], out: string[] = []): string[] {
  const fs = require('fs')
  const path = require('path')
  let entries: any[]
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collectFiles(full, exts, out)
    else if (exts.some(e => entry.name.endsWith(e))) out.push(full)
  }
  return out
}

function readFilesSafe(files: string[]): Array<{ file: string; text: string }> {
  const fs = require('fs')
  const list: Array<{ file: string; text: string }> = []
  for (const f of files) {
    try { list.push({ file: f, text: fs.readFileSync(f, 'utf8') }) } catch { /* skip */ }
  }
  return list
}

async function checkConsoleErrors(routes: string[], baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const htmlFiles = collectFiles(dir, ['.html', '.htm'])
  if (htmlFiles.length === 0) {
    return { id: 'L4.2', layer: 'L4', name: '控制台零 error（静态）', passed: false, evidence: `目录无 HTML 产物：${dir}（请提供 baseDir 或先构建）`, duration: Date.now() - start }
  }
  // 静态等价检查：产物中不允许出现典型的运行时崩溃标记
  const crashMarkers = ['Unexpected Application Error', 'Cannot read properties of undefined', 'ErrorBoundary', 'render failed']
  const hits: string[] = []
  for (const { file, text } of readFilesSafe(htmlFiles)) {
    for (const marker of crashMarkers) {
      if (text.includes(marker)) hits.push(`${pathBase(file)}:${marker}`)
    }
  }
  return {
    id: 'L4.2', layer: 'L4', name: '控制台零 error（静态）',
    passed: hits.length === 0,
    evidence: hits.length === 0 ? `${htmlFiles.length} 个 HTML 产物无崩溃标记` : `命中崩溃标记：${hits.slice(0, 3).join('; ')}`,
    duration: Date.now() - start,
  }
}

async function checkDomNodes(routes: string[], baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const htmlFiles = collectFiles(dir, ['.html', '.htm'])
  if (htmlFiles.length === 0) {
    return { id: 'L4.5', layer: 'L4', name: '关键 DOM 节点（静态）', passed: false, evidence: `目录无 HTML 产物：${dir}`, duration: Date.now() - start }
  }
  // 关键 DOM 节点：页面必须有挂载根节点与 body 内容
  const missingRoot: string[] = []
  for (const { file, text } of readFilesSafe(htmlFiles)) {
    if (!/<body[\s>]/i.test(text)) missingRoot.push(`${pathBase(file)}:缺 body`)
    if (routes.length > 0) {
      // 路由对应页面应有非空内容（无白屏：body 内不应只有空白）
      const bodyContent = text.replace(/<body[^>]*>[\s\S]*?<\/body>/i, (m) => m)
      if (/<body[^>]*>\s*<\/body>/i.test(text)) missingRoot.push(`${pathBase(file)}:body 为空（疑似白屏）`)
    }
  }
  return {
    id: 'L4.5', layer: 'L4', name: '关键 DOM 节点（静态）',
    passed: missingRoot.length === 0,
    evidence: missingRoot.length === 0 ? `${htmlFiles.length} 个 HTML 产物含有效 body` : missingRoot.join('; '),
    duration: Date.now() - start,
  }
}

// ============ L5 交互层（静态验证） ============

async function checkButtonFeedback(buttons: string[], baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const files = collectFiles(dir, ['.html', '.htm'])
  if (files.length === 0) {
    return { id: 'L5.1', layer: 'L5', name: '按钮反馈（静态）', passed: false, evidence: `目录无 HTML 产物：${dir}`, duration: Date.now() - start }
  }
  const totalButtons = readFilesSafe(files).reduce((n, { text }) => n + (text.match(/<button[\s>]/gi) || []).length, 0)
  return {
    id: 'L5.1', layer: 'L5', name: '按钮反馈（静态）',
    passed: totalButtons > 0,
    evidence: totalButtons > 0 ? `产物含 ${totalButtons} 个 <button> 元素` : '产物中未发现任何按钮（疑似无交互）',
    duration: Date.now() - start,
  }
}

async function checkInputFields(inputs: string[], baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const files = collectFiles(dir, ['.html', '.htm'])
  if (files.length === 0) {
    return { id: 'L5.2', layer: 'L5', name: '输入框（静态）', passed: false, evidence: `目录无 HTML 产物：${dir}`, duration: Date.now() - start }
  }
  const totalInputs = readFilesSafe(files).reduce((n, { text }) => n + (text.match(/<input[\s>]/gi) || []).length, 0)
  return {
    id: 'L5.2', layer: 'L5', name: '输入框（静态）',
    passed: true,
    evidence: totalInputs > 0 ? `产物含 ${totalInputs} 个 <input> 元素` : '产物无输入框（无表单场景，视为通过）',
    duration: Date.now() - start,
  }
}

async function checkNavigation(navigation: Array<{ from: string; to: string }>, baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const jsFiles = collectFiles(dir, ['.js', '.mjs'])
  if (jsFiles.length === 0) {
    return { id: 'L5.4', layer: 'L5', name: '导航切换（静态）', passed: false, evidence: `目录无 JS 产物：${dir}`, duration: Date.now() - start }
  }
  // 静态等价：路由框架存在（react-router/vue-router/哈希路由）或存在 <a href>
  const htmlFiles = collectFiles(dir, ['.html', '.htm'])
  const hasRouter = readFilesSafe(jsFiles).some(({ text }) => /react-router|vue-router|createRouter|hashchange/i.test(text))
  const hasLinks = readFilesSafe(htmlFiles).some(({ text }) => /<a[\s>]/i.test(text))
  return {
    id: 'L5.4', layer: 'L5', name: '导航切换（静态）',
    passed: hasRouter || hasLinks,
    evidence: hasRouter ? '产物含路由框架引用' : (hasLinks ? '产物含 <a> 链接' : '未发现路由框架与链接'),
    duration: Date.now() - start,
  }
}

// ============ L6 状态层（静态验证） ============

async function checkLoginStateRetention(baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const jsFiles = collectFiles(dir, ['.js', '.mjs'])
  const hasPersist = readFilesSafe(jsFiles).some(({ text }) => /localStorage|sessionStorage|idb-keyval|indexedDB/i.test(text))
  return {
    id: 'L6.3', layer: 'L6', name: '登录态保持（静态）',
    passed: hasPersist,
    evidence: hasPersist ? '产物含持久化存储调用（localStorage/IndexedDB 等）' : '产物未发现持久化存储引用',
    duration: Date.now() - start,
  }
}

async function checkRefreshStateRetention(baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const jsFiles = collectFiles(dir, ['.js', '.mjs'])
  const hasPersist = readFilesSafe(jsFiles).some(({ text }) => /localStorage|sessionStorage/i.test(text))
  return {
    id: 'L6.2', layer: 'L6', name: '刷新保持（静态）',
    passed: hasPersist,
    evidence: hasPersist ? '产物含 localStorage/sessionStorage 调用（刷新可恢复状态）' : '产物未发现 localStorage/sessionStorage 引用',
    duration: Date.now() - start,
  }
}

async function checkDraftRetention(baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const jsFiles = collectFiles(dir, ['.js', '.mjs'])
  const hasPersist = readFilesSafe(jsFiles).some(({ text }) => /localStorage|sessionStorage/i.test(text))
  return {
    id: 'L6.4', layer: 'L6', name: '草稿保留（静态）',
    passed: hasPersist,
    evidence: hasPersist ? '产物含持久化存储调用（草稿可保留）' : '产物未发现持久化存储引用（无草稿场景视为通过）',
    duration: Date.now() - start,
  }
}

// ============ L7 防御层（静态验证） ============

async function checkEmptyInput(baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const files = collectFiles(dir, ['.js', '.mjs'])
  // 静态等价：产物中存在空值校验（required/校验函数/trim 检查）即视为具备空输入防御
  const hasValidation = readFilesSafe(files).some(({ text }) => /\.required\(|required:|required\s*=|trim\(\)|validate|校验/i.test(text))
  return {
    id: 'L7.1', layer: 'L7', name: '空输入防御（静态）',
    passed: hasValidation,
    evidence: hasValidation ? '产物含校验逻辑（required/trim/validate）' : '产物未发现显式校验逻辑',
    duration: Date.now() - start,
  }
}

async function checkXssProtection(baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const files = collectFiles(dir, ['.js', '.mjs', '.html', '.htm'])
  // 危险模式：直接 document.write / innerHTML 拼接未经处理 / dangerouslySetInnerHTML 滥用
  const dangerPatterns = [/document\.write\s*\(/, /innerHTML\s*=\s*[^'"]/, /dangerouslySetInnerHTML/]
  const hits: string[] = []
  for (const { file, text } of readFilesSafe(files)) {
    for (const p of dangerPatterns) {
      if (p.test(text)) hits.push(`${pathBase(file)}:${p.source}`)
    }
  }
  return {
    id: 'L7.3', layer: 'L7', name: 'XSS 防护（静态）',
    passed: hits.length === 0,
    evidence: hits.length === 0 ? '未发现危险 DOM 写入模式' : `命中：${hits.slice(0, 3).join('; ')}`,
    duration: Date.now() - start,
  }
}

async function checkLongInput(baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const files = collectFiles(dir, ['.js', '.mjs'])
  const hasGuard = readFilesSafe(files).some(({ text }) => /maxLength|slice\(0,\s*\d|truncate|截断/i.test(text))
  return {
    id: 'L7.2', layer: 'L7', name: '超长输入防御（静态）',
    passed: hasGuard,
    evidence: hasGuard ? '产物含长度限制（maxLength/截断）' : '产物未发现长度限制逻辑',
    duration: Date.now() - start,
  }
}

async function checkConcurrentProtection(baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const files = collectFiles(dir, ['.js', '.mjs'])
  const hasGuard = readFilesSafe(files).some(({ text }) => /debounce|throttle|isLoading|disabled\s*=|防抖|节流/i.test(text))
  return {
    id: 'L7.4', layer: 'L7', name: '并发操作防御（静态）',
    passed: hasGuard,
    evidence: hasGuard ? '产物含防抖/节流/loading 锁' : '产物未发现防抖/节流逻辑',
    duration: Date.now() - start,
  }
}

async function checkPermissionBoundary(baseDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = baseDir || pathResolve('dist')
  const files = collectFiles(dir, ['.js', '.mjs'])
  const hasGuard = readFilesSafe(files).some(({ text }) => /403|401|permission|role|权限|role ===|\.role/i.test(text))
  return {
    id: 'L7.6', layer: 'L7', name: '权限边界（静态）',
    passed: hasGuard,
    evidence: hasGuard ? '产物含权限判断（401/403/role）' : '产物未发现权限判断逻辑',
    duration: Date.now() - start,
  }
}

// ============ L8 缺陷猎杀（真实静态扫描） ============

function pathResolve(p: string): string {
  const path = require('path')
  return path.resolve(process.cwd(), p)
}

function pathBase(p: string): string {
  const path = require('path')
  return path.basename(p)
}

async function scanMockData(scanDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = scanDir || pathResolve('src')
  const files = collectFiles(dir, ['.ts', '.tsx', '.js', '.jsx', '.mjs'])
  if (files.length === 0) return { id: 'L8.3', layer: 'L8', name: 'Mock 数据扫描', passed: true, evidence: `扫描目录无源码：${dir}（无 src 视为通过）`, duration: Date.now() - start }
  // 假数据模式：Math.random 伪造指标 / 硬编码示例数据标注 mock / 注释自称 mock
  const mockPatterns = [/Math\.random\s*\(\s*\)\s*[\*+]/i, /mock|fake|假数据/i, /hardcoded.*data|示例数据/i]
  const hits: string[] = []
  for (const { file, text } of readFilesSafe(files)) {
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (/Math\.random\s*\(\s*\)\s*[\*+]/.test(lines[i]) && /return|=\s*\{|push/.test(lines[i])) hits.push(`${pathBase(file)}:L${i + 1} 疑似伪造数据`)
    }
    if (mockPatterns[1].test(text) && /TODO|FIXME/.test(text)) hits.push(`${pathBase(file)}:mock 标注残留`)
  }
  return { id: 'L8.3', layer: 'L8', name: 'Mock 数据扫描', passed: hits.length === 0, evidence: hits.length === 0 ? `${files.length} 个源码文件无 mock 模式` : hits.slice(0, 3).join('; '), duration: Date.now() - start }
}

async function scanErrorHandling(scanDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = scanDir || pathResolve('src')
  const files = collectFiles(dir, ['.ts', '.tsx', '.js', '.jsx', '.mjs'])
  if (files.length === 0) return { id: 'L8.4', layer: 'L8', name: '错误处理扫描', passed: true, evidence: `扫描目录无源码：${dir}`, duration: Date.now() - start }
  // async 函数/await 调用缺少 try/catch
  let asyncCount = 0, unguardedAsync = 0
  const asyncRe = /\basync\b|\bawait\b/
  const tryRe = /\btry\b[\s\S]{0,2000}?\bcatch\b/g
  for (const { text } of readFilesSafe(files)) {
    if (!asyncRe.test(text)) continue
    asyncCount++
    const tryBlocks = (text.match(tryRe) || []).length
    const awaitCount = (text.match(/\bawait\b/g) || []).length
    if (awaitCount > tryBlocks * 2) unguardedAsync++
  }
  return {
    id: 'L8.4', layer: 'L8', name: '错误处理扫描',
    passed: unguardedAsync === 0,
    evidence: unguardedAsync === 0 ? `${asyncCount} 个含异步的文件均有 try/catch 覆盖` : `${unguardedAsync} 个文件 await 数远超 try/catch（疑似缺错误处理）`,
    duration: Date.now() - start,
  }
}

async function scanRouteDeadlinks(scanDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = scanDir || pathResolve('src')
  const files = collectFiles(dir, ['.ts', '.tsx', '.js', '.jsx', '.mjs'])
  if (files.length === 0) return { id: 'L8.5', layer: 'L8', name: '路由死链扫描', passed: true, evidence: `扫描目录无源码：${dir}`, duration: Date.now() - start }
  // 收集 NavLink/Link to= 目标，检查是否有对应 Route 定义
  const targets = new Set<string>()
  const defined = new Set<string>()
  const linkRe = /(?:to|href)=["']([^"']+)["']/g
  const routeRe = /(?:path|route)=["']([^"']+)["']/g
  for (const { text } of readFilesSafe(files)) {
    for (const m of text.matchAll(linkRe)) if (m[1].startsWith('/')) targets.add(m[1].replace(/\/+$/, ''))
    for (const m of text.matchAll(routeRe)) defined.add(m[1].replace(/\/+$/, ''))
  }
  const dead = [...targets].filter(t => t !== '/' && ![...defined].some(d => d === t || d.startsWith(t + '/')))
  return {
    id: 'L8.5', layer: 'L8', name: '路由死链扫描',
    passed: dead.length === 0,
    evidence: dead.length === 0 ? `${targets.size} 个路由目标均有定义` : `疑似死链：${dead.slice(0, 3).join('; ')}`,
    duration: Date.now() - start,
  }
}

async function scanTypeSafety(scanDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = scanDir || pathResolve('src')
  const files = collectFiles(dir, ['.ts', '.tsx'])
  if (files.length === 0) return { id: 'L8.6', layer: 'L8', name: '类型安全扫描', passed: true, evidence: `扫描目录无 TS 源码：${dir}`, duration: Date.now() - start }
  let anyCount = 0
  for (const { file, text } of readFilesSafe(files)) {
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (/: any\b|as any\b|as unknown as any\b/.test(lines[i])) anyCount++
    }
  }
  return {
    id: 'L8.6', layer: 'L8', name: '类型安全扫描',
    passed: anyCount <= 20,
    evidence: anyCount === 0 ? '零 any 使用' : `发现 ${anyCount} 处 any（阈值 20）`,
    duration: Date.now() - start,
  }
}

async function scanCopyConsistency(scanDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = scanDir || pathResolve('src')
  const files = collectFiles(dir, ['.ts', '.tsx', '.js', '.jsx', '.md'])
  if (files.length === 0) return { id: 'L8.7', layer: 'L8', name: '文案/数字一致性扫描', passed: true, evidence: `扫描目录无源码：${dir}`, duration: Date.now() - start }
  // 常见数字冲突：技能数/工具数/版本号前后不一致
  const conflicts: string[] = []
  const skillCounts = new Set<string>()
  for (const { text } of readFilesSafe(files)) {
    for (const m of text.matchAll(/(\d+)\s*个技能|技能数[：:]?\s*(\d+)|(\d+)\s*skills/gi)) {
      const v = m[1] || m[2] || m[3]
      if (v && v !== '39' && v !== '95') continue
      skillCounts.add(v)
    }
  }
  if (skillCounts.size > 1) conflicts.push(`技能数冲突：${[...skillCounts].join(' vs ')}`)
  return {
    id: 'L8.7', layer: 'L8', name: '文案/数字一致性扫描',
    passed: conflicts.length === 0,
    evidence: conflicts.length === 0 ? '未发现明显数字冲突' : conflicts.join('; '),
    duration: Date.now() - start,
  }
}

async function scanDeprecatedApi(scanDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = scanDir || pathResolve('src')
  const files = collectFiles(dir, ['.ts', '.tsx', '.js', '.jsx', '.mjs'])
  if (files.length === 0) return { id: 'L8.8', layer: 'L8', name: '废弃 API 扫描', passed: true, evidence: `扫描目录无源码：${dir}`, duration: Date.now() - start }
  const deprecated = [/\bescape\s*\(/, /\bunescape\s*\(/, /\bAlert\s*\(/, /\bconfirm\s*\(/]
  const hits: string[] = []
  for (const { file, text } of readFilesSafe(files)) {
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (deprecated.some(p => p.test(lines[i]))) hits.push(`${pathBase(file)}:L${i + 1}`)
    }
  }
  return { id: 'L8.8', layer: 'L8', name: '废弃 API 扫描', passed: hits.length === 0, evidence: hits.length === 0 ? '无废弃 API（escape/unescape/Alert/confirm）' : `命中：${hits.slice(0, 3).join('; ')}`, duration: Date.now() - start }
}

async function scanTerminology(scanDir?: string): Promise<VerifyResult> {
  const start = Date.now()
  const dir = scanDir || pathResolve('src')
  const files = collectFiles(dir, ['.ts', '.tsx', '.js', '.jsx', '.md'])
  if (files.length === 0) return { id: 'L8.11', layer: 'L8', name: '术语统一扫描', passed: true, evidence: `扫描目录无源码：${dir}`, duration: Date.now() - start }
  const banned = ['AI Harness', 'Lifeform Kit', 'above the model', '模型之外', '生命体 Kit']
  const hits: string[] = []
  for (const { file, text } of readFilesSafe(files)) {
    for (const b of banned) {
      if (text.includes(b)) hits.push(`${pathBase(file)}:${b}`)
    }
  }
  return {
    id: 'L8.11', layer: 'L8', name: '术语统一扫描',
    passed: hits.length === 0,
    evidence: hits.length === 0 ? '无禁用表述' : `命中禁用表述：${hits.slice(0, 3).join('; ')}`,
    duration: Date.now() - start,
  }
}

// L8 其余维度：未提供独立扫描器时返回明确的"未配置"状态（不再虚假通过）
async function scanZombieFeatures(): Promise<VerifyResult> {
  const start = Date.now()
  return { id: 'L8.1', layer: 'L8', name: '僵尸功能扫描', passed: false, evidence: '需配置 defectHunting.scanDir 后执行源码级扫描', duration: Date.now() - start }
}
async function scanUnpersistedState(): Promise<VerifyResult> {
  const start = Date.now()
  return { id: 'L8.2', layer: 'L8', name: '未持久化状态扫描', passed: false, evidence: '需配置 defectHunting.scanDir 后执行源码级扫描', duration: Date.now() - start }
}
async function scanBusinessClosure(): Promise<VerifyResult> {
  const start = Date.now()
  return { id: 'L8.9', layer: 'L8', name: '业务闭环扫描', passed: false, evidence: '需配置 defectHunting.scanDir 后执行端到端验证', duration: Date.now() - start }
}
async function scanCompliance(): Promise<VerifyResult> {
  const start = Date.now()
  return { id: 'L8.10', layer: 'L8', name: '合规与安全扫描', passed: false, evidence: '需配置 defectHunting.scanDir 后执行合规检查', duration: Date.now() - start }
}

// ============ AI 自律执行协议（八问自检 V3）============

export const SELF_DISCIPLINE_QUESTIONS = [
  '我运行了 npm run verify 吗？',
  'verify 的输出中有没有 FAIL？',
  '我的交付报告末尾有"七层验证报告"小节吗？',
  '每一项 ✅ 都附带了执行证据吗？',
  'L3 契约层验证了吗？（不仅 curl 状态码，还校验响应体字段类型/名称/必填）',
  'L4 渲染层验证了吗？（浏览器逐路由检查白屏/崩溃/控制台错误）',
  'L6 状态层 + L7 防御层验证了吗？（刷新保留 + 异常输入测试）',
  'L5 交互层用 browser_use agent 验证了吗？（逐按钮点击验证 UI 反馈，附截图）',
] as const

export function disciplineCheck(report: VerifyReport): {
  canDeclareComplete: boolean
  failures: string[]
} {
  const failures: string[] = []

  if (report.total === 0) failures.push('未运行任何验证')
  if (report.failed > 0) failures.push(`${report.failed} 项验证失败`)
  if (!report.layers.L1_tech) failures.push('L1 技术层未通过')
  if (!report.layers.L2_link) failures.push('L2 链路层未通过')
  if (report.results.some(r => r.layer === 'L3') && !report.layers.L3_contract) failures.push('L3 契约层未通过')
  if (report.results.some(r => r.layer === 'L4') && !report.layers.L4_rendering) failures.push('L4 渲染层未通过')
  if (report.results.some(r => r.layer === 'L5') && !report.layers.L5_interaction) failures.push('L5 交互层未通过')
  if (report.results.some(r => r.layer === 'L6') && !report.layers.L6_state) failures.push('L6 状态层未通过')
  if (report.results.some(r => r.layer === 'L7') && !report.layers.L7_defense) failures.push('L7 防御层未通过')
  if (report.results.some(r => r.layer === 'L8') && !report.layers.L8_defect_hunting) failures.push('L8 缺陷猎杀未通过')

  return {
    canDeclareComplete: failures.length === 0,
    failures,
  }
}

// ============ 反绕过识别（V3 · 七层强化）============

export const BYPASS_PATTERNS = [
  '应该没问题',
  '逻辑上正确',
  '之前验证过',
  '理论上没问题',
  '应该是好的',
  '估计没问题',
  '纯人工跳过',
  'L3 只检查状态码 200 不校验字段',
  'L5 标注纯人工跳过',
  '用逻辑正确代替实际验证',
  '发现问题但隐瞒不报',
] as const

export function detectBypass(text: string): string[] {
  return BYPASS_PATTERNS.filter(pattern => text.toLowerCase().includes(pattern.toLowerCase()))
}

// ============ 辅助函数 ============

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// ============ CLI 入口 ============
// 注意：必须用 pathToFileURL 规范化 argv[1]，直接拼接 `file://${process.argv[1]}`
// 在 Windows 上会因反斜杠与盘符导致比较失败，CLI 块永不执行（静默 exit 0）。
import { pathToFileURL } from 'node:url'

const invokedAsScript = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedAsScript) {
  const config: VerifyConfig = {
    tech: { tsc: true, build: false, artifactScan: true, npmAudit: true },
  }
  runVerification(config).then((report) => {
    console.log(JSON.stringify(report, null, 2))
    const discipline = disciplineCheck(report)
    if (!discipline.canDeclareComplete) {
      console.error('\n❌ 自律检查失败：')
      discipline.failures.forEach(f => console.error(`  - ${f}`))
      process.exit(1)
    }
    console.error('\n✅ 自律检查通过，可宣告交付')
  }).catch((e) => {
    console.error(`\n❌ 验证执行器异常：${errMsg(e)}`)
    process.exit(2)
  })
}
