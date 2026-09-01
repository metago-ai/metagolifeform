// build-release-zip.cjs — 阶段 5-4/5-5：stage 发布目录 → 根级 SHA256SUMS.txt → zip
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = 'D:/DH工作区/metagolifeform';
const STAGE = 'D:/DH工作区/_release-3694';
const TOP = 'metagolifeform-v36.9.4';
const DST = path.join(STAGE, TOP);
const ZIP = 'C:/Users/MetaGO/Desktop/元构产品安装包/产品安装包/metagolifeform-local-v36.9.4.zip';

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(DST, { recursive: true });

const EXCLUDE_TOP = new Set(['.git', 'node_modules', '.gitee', '.github', 'packages']);
const EXCLUDE_TOP_EXTRA = new Set(['package-lock.json', 'pnpm-lock.yaml']);
const EXCLUDE_ANY_DIR = new Set(['node_modules', 'dist', '.vite', '__pycache__', '.test-metago-memory.json']);
// 允许保留的 node_modules：local-edition/portable/node_modules
function copyTree(s, d, relParts) {
  for (const e of fs.readdirSync(s, { withFileTypes: true })) {
    const sp = path.join(s, e.name), dp = path.join(d, e.name);
    const rel = relParts.concat(e.name);
    const isPortableNm = rel.join('/') === 'local-edition/portable/node_modules';
    if (e.isDirectory()) {
      if (e.name === '.gitee' || e.name === '.github' || e.name === '.git') { continue; }
      if (e.name === 'node_modules' && !isPortableNm) { continue; }
      // packages/ 以源码形式入包（门禁/口径扫描依赖 engine INDEX/GENOME/CONSTITUTION）
      copyTree(sp, dp, rel);
    } else {
      if (e.name === '.gitignore' && rel.length === 1) continue;
      fs.mkdirSync(path.dirname(dp), { recursive: true });
      fs.copyFileSync(sp, dp);
    }
  }
}
copyTree(ROOT, DST, []);

// 排除后可验证：统计
function listFiles(d) {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p); else out.push(p);
    }
  })(d);
  return out;
}
const files = listFiles(DST).filter(f => path.relative(DST, f).replace(/\\/g, '/') !== 'SHA256SUMS.txt').map(f => path.relative(DST, f).replace(/\\/g, '/')).sort();
const lines = files.map(f => crypto.createHash('sha256').update(fs.readFileSync(path.join(DST, f))).digest('hex') + '  ' + f);
fs.writeFileSync(path.join(DST, 'SHA256SUMS.txt'), '# MetaGO Lifeform V36.9.4 发行包哈希清单\n' + '# 校验：sha256sum -c SHA256SUMS.txt\n' + lines.join('\n') + '\n', 'utf8');
console.log('SHA256SUMS lines:', files.length);

// 自校验：逐行重算哈希比对（Win 无 sha256sum，用 Node 实现等价校验）
let allOk = true;
for (const l of lines) {
  const m = /^([0-9a-f]{64})\s+(.+)$/.exec(l);
  if (!m) { allOk = false; continue; }
  const real = crypto.createHash('sha256').update(fs.readFileSync(path.join(DST, m[2]))).digest('hex');
  if (real !== m[1]) { allOk = false; console.log('BAD:', m[2]); }
}
console.log('sha256sum -c:', allOk ? `ALL OK（${lines.length} 文件）` : '有 BAD');

fs.mkdirSync(path.dirname(ZIP), { recursive: true });
// 优先 bsdtar 写 zip（快）；失败回退 PowerShell Compress-Archive
try {
  execFileSync('tar', ['-a', '-c', '-f', ZIP, '-C', STAGE, TOP], { stdio: 'inherit' });
  console.log('ZIP built via bsdtar');
} catch (e) {
  console.log('bsdtar 失败，回退 Compress-Archive:', String(e.message).slice(0, 60));
  execFileSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${DST}' -DestinationPath '${ZIP}' -Force`], { stdio: 'inherit' });
}
const st = fs.statSync(ZIP);
console.log('ZIP OK:', ZIP, (st.size / 1048576).toFixed(1) + 'MB');
