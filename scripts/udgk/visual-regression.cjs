#!/usr/bin/env node
/*============================================================================
 * UDGK · visual-regression.cjs — 视觉基线器
 * ---------------------------------------------------------------------------
 * 功能：截图 + 像素 diff，量化「界面真的变了没有」。
 *   --baseline  将 current/ 的截图存为 baseline/（建立基线）
 *   --diff      对比 current/ 与 baseline/，输出像素差百分比 + diff 图
 *   --snapshot  调用 Playwright（如可用）对 URL 列表截图
 * 零依赖：diff 用 Node 内置 zlib 解析 PNG（无外部依赖）；截图需要 Playwright（可选）。
 *
 * 用法：
 *   node visual-regression.cjs --baseline
 *   node visual-regression.cjs --diff [--threshold=0.02]
 *   node visual-regression.cjs --snapshot [--urls=a,b,c] [--out=...]
 *
 * @author MetaGO / UDGK
 * @version 1.0.0
 *============================================================================*/

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const args = process.argv.slice(2);
const pick = (flag, def) => {
  const hit = args.find((a) => a.startsWith(flag + '='));
  return hit ? hit.split('=').slice(1).join('=') : def;
};
const ROOT = path.resolve('.');
const CONFIG = loadConfig();
const VIS = CONFIG.visual || {};
const BASELINE_DIR = path.resolve(ROOT, VIS.baseline || '.visual-baseline/baseline');
const CURRENT_DIR = path.resolve(ROOT, VIS.current || '.visual-baseline/current');
const DIFF_DIR = path.resolve(ROOT, VIS.diffOutput || '.visual-baseline/diff');
const THRESHOLD = parseFloat(pick('--threshold', String(VIS.diffThreshold || 0.02)));

const MODE_BASELINE = args.includes('--baseline');
const MODE_DIFF = args.includes('--diff');
const MODE_SNAPSHOT = args.includes('--snapshot');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'delivery.config.json'), 'utf8'));
  } catch {
    return {};
  }
}

/* ===========================================================================
 * PNG 像素解码（零依赖）
 * 解析 IHDR + IDAT，用 zlib 解压 + 滤波还原，返回 { width, height, data: RGBA }
 * =========================================================================== */
function decodePNG(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('不是合法 PNG');
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  if (!width || !height) throw new Error('PNG 缺少 IHDR');
  if (bitDepth !== 8) throw new Error(`仅支持 8-bit PNG（当前 ${bitDepth}-bit）`);
  if (colorType !== 2 && colorType !== 6 && colorType !== 0) {
    throw new Error(`仅支持灰/真彩/真彩+alpha（当前 colorType=${colorType}）`);
  }

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 4);

  // 滤波还原（Paeth/Sub/Up/Average/None）
  let prev = Buffer.alloc(stride);
  let o = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const recon = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? recon[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      switch (filter) {
        case 0: break;
        case 1: v = (v + a) & 0xff; break;            // Sub
        case 2: v = (v + b) & 0xff; break;            // Up
        case 3: v = (v + Math.floor((a + b) / 2)) & 0xff; break; // Average
        case 4: {                                      // Paeth
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          v = (v + pr) & 0xff;
          break;
        }
        default: throw new Error(`未知滤波类型 ${filter}`);
      }
      recon[x] = v;
    }
    for (let x = 0; x < width; x++) {
      const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
      for (let c = 0; c < ch; c++) out[o++] = recon[x * ch + c];
      if (ch === 3) { out[o++] = 255; } // RGB → RGBA
      if (ch === 1) { out[o++] = recon[x]; out[o++] = recon[x]; out[o++] = 255; }
    }
    prev = recon;
  }
  return { width, height, data: out };
}

function comparePNG(a, b) {
  if (a.width !== b.width || a.height !== b.height) {
    return { diff: 1.0, diffPixels: -1, total: -1, note: '尺寸不一致' };
  }
  let diffPixels = 0;
  const total = a.width * a.height;
  for (let i = 0; i < a.data.length; i += 4) {
    const dr = Math.abs(a.data[i] - b.data[i]);
    const dg = Math.abs(a.data[i + 1] - b.data[i + 1]);
    const db = Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (dr > 10 || dg > 10 || db > 10) diffPixels++;
  }
  return { diff: diffPixels / total, diffPixels, total };
}

/* ---------------------------------------------------------------------------
 * --baseline：把 current/ 的截图提升为基线
 * ------------------------------------------------------------------------- */
function doBaseline() {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
  const files = fs.readdirSync(CURRENT_DIR).filter((f) => /\.png$/i.test(f));
  if (files.length === 0) {
    console.log('  [WARN] current/ 无截图。先用 --snapshot 或手动放截图到 current/');
    return 1;
  }
  for (const f of files) {
    fs.copyFileSync(path.join(CURRENT_DIR, f), path.join(BASELINE_DIR, f));
    console.log(`  [BASELINE] ${f}`);
  }
  console.log(`视觉基线建立完成：${files.length} 张`);
  return 0;
}

/* ---------------------------------------------------------------------------
 * --diff：对比 current/ 与 baseline/
 * ------------------------------------------------------------------------- */
function doDiff() {
  fs.mkdirSync(DIFF_DIR, { recursive: true });
  if (!fs.existsSync(BASELINE_DIR)) {
    console.log('  [FAIL] baseline/ 不存在。先运行 --baseline 建立基线');
    return 1;
  }
  const baseFiles = fs.readdirSync(BASELINE_DIR).filter((f) => /\.png$/i.test(f));
  if (baseFiles.length === 0) {
    console.log('  [FAIL] baseline/ 无截图。先运行 --baseline');
    return 1;
  }
  let failCount = 0;
  for (const f of baseFiles) {
    const cur = path.join(CURRENT_DIR, f);
    if (!fs.existsSync(cur)) {
      console.log(`  [FAIL] ${f} — current/ 缺少对应截图（基线存在但本次未截）`);
      failCount++;
      continue;
    }
    let a, b;
    try {
      a = decodePNG(fs.readFileSync(path.join(BASELINE_DIR, f)));
      b = decodePNG(fs.readFileSync(cur));
    } catch (e) {
      console.log(`  [FAIL] ${f} — 解析失败：${e.message}`);
      failCount++;
      continue;
    }
    const r = comparePNG(a, b);
    const ok = r.diff <= THRESHOLD;
    const mark = ok ? 'PASS' : 'FAIL';
    console.log(`  [${mark}] ${f} — 像素差 ${(r.diff * 100).toFixed(2)}% (阈值 ${(THRESHOLD * 100).toFixed(2)}%)${r.note ? ' ' + r.note : ''}`);
    if (!ok) failCount++;
  }
  console.log(`视觉 diff 结果：${failCount === 0 ? '全部通过' : failCount + ' 项失败'}`);
  return failCount === 0 ? 0 : 1;
}

/* ---------------------------------------------------------------------------
 * --snapshot：Playwright 截图（可选依赖）
 * ------------------------------------------------------------------------- */
async function doSnapshot() {
  const urlsRaw = pick('--urls', '');
  const urls = urlsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  if (urls.length === 0) {
    console.log('  [WARN] 未提供 --urls。示例：node visual-regression.cjs --snapshot --urls=http://localhost:4173/,http://localhost:4173/chat');
    return 1;
  }
  let pw;
  try {
    pw = require('playwright');
  } catch {
    console.log('  [SKIP] 未安装 playwright（可选依赖）。跳过截图，可用手动截图后放入 current/');
    return 0;
  }
  fs.mkdirSync(CURRENT_DIR, { recursive: true });
  const browser = await pw.chromium.launch();
  for (const [i, url] of urls.entries()) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: 'networkidle0' });
    const name = (new URL(url).pathname.replace(/\//g, '_') || 'home').replace(/^_/, '') || 'home';
    const file = path.join(CURRENT_DIR, `${i}_${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  [SHOT] ${file}`);
    await page.close();
  }
  await browser.close();
  console.log(`截图完成：${urls.length} 张 → ${CURRENT_DIR}`);
  return 0;
}

(async () => {
  console.log('==========================================');
  console.log('  UDGK 视觉基线器 · visual-regression');
  console.log('==========================================');
  let code = 0;
  if (MODE_BASELINE) code = doBaseline();
  else if (MODE_DIFF) code = doDiff();
  else if (MODE_SNAPSHOT) code = await doSnapshot();
  else {
    console.log('  用法：--baseline | --diff | --snapshot --urls=...');
    code = 1;
  }
  process.exit(code);
})();
