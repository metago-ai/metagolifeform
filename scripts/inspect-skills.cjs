// inspect-skills.cjs — 从 skills/*/SKILL.md frontmatter 统计族分布（权威口径）
const fs = require('fs'); const path = require('path');
const dir = 'D:/DH工作区/metagolifeform/skills';
const famMap = { cognition:'cognition', assurance:'assurance', governance:'governance', evolution:'evolution', execution:'execution', traceability:'traceability', value:'value', consciousness:'consciousness', methodology:'methodology', architecture:'architecture', engineering_quality:'engineering_quality', meta_thoughts:'meta_thoughts', meta_capability:'meta_capability', expert_team:'expert_team', expert_extension:'expert_extension', dev_kit:'dev_kit' };
const counts = {}; const noFam = [];
for (const d of fs.readdirSync(dir)) {
  const sk = path.join(dir, d, 'SKILL.md');
  if (!fs.existsSync(sk)) continue;
  const c = fs.readFileSync(sk, 'utf8');
  const m = /^family:\s*(.+)$/m.exec(c);
  if (!m) { noFam.push(d); continue; }
  const f = m[1].trim();
  counts[f] = (counts[f] || 0) + 1;
}
console.log('families:', JSON.stringify(counts, null, 0));
console.log('total:', Object.values(counts).reduce((a,b)=>a+b,0));
console.log('noFamily:', noFam.join(', ') || '无');
