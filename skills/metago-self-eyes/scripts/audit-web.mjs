#!/usr/bin/env node
/**
 * audit-web.mjs — 把网页/软件界面渲染成"用户会看到的像素"，并做客观体检。
 *
 * 用法:
 *   node audit-web.mjs --url http://127.0.0.1:3000 --out D:\审计\my-site
 *   node audit-web.mjs --html D:\path\page.html --out D:\审计\my-page
 *   可选: --wait 1500 (毫秒)  --widths 1440,768,390  --full (整页截图，默认 true)
 *
 * 产出:
 *   <out>/shots/<viewport>-viewport.png   首屏
 *   <out>/shots/<viewport>-full.png       整页
 *   <out>/report.json                     客观问题清单
 *
 * 注意: 本脚本只做"机器能量化"的部分；真正的"看"必须由 Agent 用 read_image 打开 shots/*.png。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}

const url = arg('url', null);
const html = arg('html', null);
const out = arg('out', path.resolve('audit-web-' + Date.now()));
const waitMs = Number(arg('wait', 1200));
const widths = String(arg('widths', '1440,768,390')).split(',').map(Number);
const wantFull = arg('full', true) !== false;

if (!url && !html) {
  console.error('用法: node audit-web.mjs --url <http://...> | --html <file> --out <dir>');
  process.exit(2);
}

// ── 定位 playwright-core 与 chromium ────────────────────────────────────────
function firstExisting(paths) {
  for (const p of paths) if (p && fs.existsSync(p)) return p;
  return null;
}
const pwPath = firstExisting([
  '$METAGO_PLAYWRIGHT_MCP_HOME/server/node_modules/playwright-core',
  '$METAGO_PLAYWRIGHT_MCP_HOME/node_modules/playwright-core',
]);
if (!pwPath) {
  console.error('找不到 playwright-core（请检查 $METAGO_PLAYWRIGHT_MCP_HOME\\server\\node_modules\\playwright-core）');
  process.exit(2);
}
const chromePath = (() => {
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    '$DSH_HOME/localappdata/ms-playwright',
    '~/AppData/Local/ms-playwright',
  ].filter(Boolean);
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const dir of fs.readdirSync(root)) {
      if (!dir.startsWith('chromium-')) continue;
      for (const sub of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe']) {
        const p = path.join(root, dir, sub);
        if (fs.existsSync(p)) return p;
      }
    }
  }
  return null;
})();

const { chromium } = require(pwPath);

// ── 页面内体检脚本（序列化后注入） ─────────────────────────────────────────
function pageAudit() {
  const issues = [];
  const add = (level, type, detail, el) => {
    let rect = null;
    try { if (el && el.getBoundingClientRect) { const r = el.getBoundingClientRect(); rect = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; } } catch {}
    issues.push({ level, type, detail, rect, text: el && el.textContent ? el.textContent.trim().slice(0, 60) : '' });
  };
  const vw = window.innerWidth, vh = window.innerHeight;

  // 1) 横向溢出
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) {
    add('P0', 'horizontal-overflow', `文档横向溢出：scrollWidth=${de.scrollWidth} > clientWidth=${de.clientWidth}`, null);
  }

  // 2) 文字被裁 / 溢出容器
  const all = Array.from(document.querySelectorAll('body *'));
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;

    // 文字撑破
    if (el.scrollWidth > el.clientWidth + 2 && (cs.overflowX === 'hidden' || cs.overflowX === 'clip')) {
      if ((el.textContent || '').trim().length > 0) {
        add('P0', 'text-clipped', `文字横向被裁：scrollWidth=${el.scrollWidth} > clientWidth=${el.clientWidth}`, el);
      }
    }
    if (el.scrollHeight > el.clientHeight + 2 && (cs.overflowY === 'hidden' || cs.overflowY === 'clip')) {
      if ((el.textContent || '').trim().length > 20) {
        add('P1', 'text-vert-clipped', `文字纵向被裁：scrollHeight=${el.scrollHeight} > clientHeight=${el.clientHeight}`, el);
      }
    }
    // 超出视口右侧
    if (r.right > vw + 2) add('P0', 'outside-viewport', `元素超出视口右侧 ${Math.round(r.right - vw)}px`, el);

    // 可点击元素过小
    if (['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
      if (r.width < 16 || r.height < 16) add('P1', 'tiny-target', `可点击元素过小 ${Math.round(r.width)}x${Math.round(r.height)}`, el);
    }
  }

  // 3) 破图
  for (const img of Array.from(document.images)) {
    if (!img.complete || img.naturalWidth === 0) add('P0', 'broken-image', `图片加载失败：${img.currentSrc || img.src}`, img);
  }

  // 4) 对比度（文本 vs 最近的非透明背景）
  const lum = (c) => {
    const m = c.match(/[\d.]+/g); if (!m) return null;
    const [r, g, b, a] = m.map(Number);
    if (a !== undefined && a < 0.5) return null;
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = getComputedStyle(n).backgroundColor;
      const m = c.match(/[\d.]+/g);
      if (m && (m.length < 4 || Number(m[3]) > 0.5)) return c;
      n = n.parentElement;
    }
    return 'rgb(255,255,255)';
  };
  let contrastChecked = 0;
  for (const el of all) {
    if (!el.childNodes || el.childNodes.length === 0) continue;
    const direct = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!direct) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const size = parseFloat(cs.fontSize) || 16;
    const l1 = lum(cs.color), l2 = lum(bgOf(el));
    if (l1 === null || l2 === null) continue;
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const need = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700) ? 3.0 : 4.5;
    contrastChecked++;
    if (ratio < need) add('P1', 'low-contrast', `对比度 ${ratio.toFixed(2)} < ${need}（字号 ${Math.round(size)}px）`, el);
  }

  // 5) 占位/示例内容
  const bodyText = document.body.innerText || '';
  const placeholders = ['lorem ipsum', 'todo', '此处', '示例文本', 'xxxx', 'placeholder', '待补充'];
  for (const p of placeholders) {
    if (bodyText.toLowerCase().includes(p)) { add('P1', 'placeholder-content', `页面残留占位内容："${p}"`, null); break; }
  }

  // 6) 内容量（近乎空白）
  const visibleText = bodyText.replace(/\s+/g, '');
  if (visibleText.length < 20) add('P0', 'near-empty', `首屏可见文字仅 ${visibleText.length} 字，疑似空白页/渲染失败`, null);

  return {
    viewport: { w: vw, h: vh, dpr: window.devicePixelRatio },
    title: document.title,
    bodyTextLength: visibleText.length,
    contrastChecked,
    issues,
  };
}

// ── 主流程 ────────────────────────────────────────────────────────────────
const shotsDir = path.join(out, 'shots');
fs.mkdirSync(shotsDir, { recursive: true });

const target = url || pathToFileURL(path.resolve(html)).href;
const report = { target, generatedAt: new Date().toISOString(), chromium: chromePath, views: [], consoleErrors: [], pageErrors: [], issues: [] };

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath || undefined,
  args: ['--hide-scrollbars', '--force-device-scale-factor=1'],
});

try {
  for (const width of widths) {
    const height = width >= 1200 ? 900 : width >= 700 ? 1024 : 844;
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') report.consoleErrors.push({ width, text: m.text().slice(0, 300) }); });
    page.on('pageerror', (e) => report.pageErrors.push({ width, text: String(e).slice(0, 300) }));

    await page.goto(target, { waitUntil: 'load', timeout: 45000 }).catch((e) => report.issues.push({ level: 'P0', type: 'load-failed', detail: String(e).slice(0, 200) }));
    await page.waitForTimeout(waitMs);

    const viewportShot = path.join(shotsDir, `${width}-viewport.png`);
    await page.screenshot({ path: viewportShot });
    let fullShot = null;
    if (wantFull) { fullShot = path.join(shotsDir, `${width}-full.png`); await page.screenshot({ path: fullShot, fullPage: true }); }

    const res = await page.evaluate(pageAudit);
    report.views.push({ width, height, title: res.title, bodyTextLength: res.bodyTextLength, contrastChecked: res.contrastChecked, viewportShot, fullShot });
    for (const i of res.issues) report.issues.push({ ...i, viewport: width });
    await ctx.close();
  }
} finally {
  await browser.close();
}

const P0 = report.issues.filter((i) => i.level === 'P0').length;
const P1 = report.issues.filter((i) => i.level === 'P1').length;
report.summary = { P0, P1, consoleErrors: report.consoleErrors.length, pageErrors: report.pageErrors.length };
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

console.log(`审计目标: ${target}`);
console.log(`截图目录: ${shotsDir}`);
for (const v of report.views) console.log(`  ${v.width}px 视口 → ${v.viewportShot}${v.fullShot ? ' / ' + v.fullShot : ''}  (可见文字 ${v.bodyTextLength} 字, 对比度检查 ${v.contrastChecked} 处)`);
console.log(`客观问题: P0=${P0} P1=${P1}  控制台错误=${report.consoleErrors.length}  页面异常=${report.pageErrors.length}`);
for (const i of report.issues.slice(0, 20)) {
  const pos = i.rect ? ` @(${i.rect.x},${i.rect.y}) ${i.rect.w}x${i.rect.h}` : '';
  console.log(`  [${i.level}] ${i.type}: ${i.detail}${pos}${i.text ? '  «' + i.text + '»' : ''}`);
}
if (report.consoleErrors.length) for (const e of report.consoleErrors.slice(0, 5)) console.log(`  [console] ${e.text}`);
console.log(`报告: ${path.join(out, 'report.json')}`);
console.log('提醒: 客观体检不等于看过。必须用 read_image 打开上面的 PNG 逐张看。');
process.exit(P0 > 0 ? 1 : 0);
