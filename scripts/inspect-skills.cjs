// inspect-skills.cjs — 从 skills/*/SKILL.md frontmatter 统计族分布（权威口径）
// 36.9.4-fix: ① 目录按脚本自身位置解析（不再硬编码作者机路径 D:/DH工作区/...）
//             ② frontmatter 无 family 时回退读取 category（本包 100 技能均用 category）
const fs = require('fs');
const path = require('path');
const dir = path.resolve(__dirname, '..', 'skills');
const unquote = (v) => v.trim().replace(/^["']|["']$/g, '');
const counts = {};
const catCounts = {};
const noFam = [];
let scanned = 0;
for (const d of fs.readdirSync(dir)) {
  const sk = path.join(dir, d, 'SKILL.md');
  if (!fs.existsSync(sk)) continue;
  scanned += 1;
  const c = fs.readFileSync(sk, 'utf8');
  const fam = /^family:\s*(.+)$/m.exec(c);
  const cat = /^category:\s*(.+)$/m.exec(c);
  if (cat) {
    const cv = unquote(cat[1]);
    catCounts[cv] = (catCounts[cv] || 0) + 1;
  }
  const val = fam ? unquote(fam[1]) : cat ? unquote(cat[1]) : '';
  if (!val) {
    noFam.push(d);
    continue;
  }
  counts[val] = (counts[val] || 0) + 1;
}
console.log('dir:', dir);
console.log('scanned:', scanned);
console.log('families:', JSON.stringify(counts, null, 0));
console.log('total:', Object.values(counts).reduce((a, b) => a + b, 0));
console.log('categories:', JSON.stringify(catCounts, null, 0));
console.log('noFamily:', noFam.join(', ') || '无');
