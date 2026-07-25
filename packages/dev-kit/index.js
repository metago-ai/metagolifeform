#!/usr/bin/env node
/**
 * @metago-ai/dev-kit v1.1.0
 *
 * MetaGO Agent Harness — Dev Kit 入口
 * 开发者垂直场景包：4 个核心能力复用 + 4 个开发专用技能
 */

const fs = require('fs');
const path = require('path');

const DEV_SKILLS = [
  'metago-code-review-deep',
  'metago-architecture-design',
  'metago-refactor-suggest',
  'metago-security-audit',
];

const REUSED_SKILLS = [
  'metago-decision-lock',
  'metago-critique',
  'metago-fact-check',
  'metago-problem-trace',
];

function listSkills() {
  console.log('MetaGO Dev Kit v1.1.0 — Developer Vertical Skills\n');
  console.log('Added Skills (4):');
  DEV_SKILLS.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  console.log('\nReused Skills (4):');
  REUSED_SKILLS.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  console.log(`\nTotal: 8 skills`);
}

function verifySkills() {
  console.log('Verifying Dev Kit skills...\n');
  let allOk = true;
  for (const skill of DEV_SKILLS) {
    const skillPath = path.join(__dirname, 'skills', skill, 'SKILL.md');
    const exists = fs.existsSync(skillPath);
    console.log(`  ${exists ? '✓' : '✗'} ${skill}: ${exists ? 'SKILL.md found' : 'MISSING'}`);
    if (!exists) allOk = false;
  }
  console.log(`\n${allOk ? '✓ All Dev Kit skills verified' : '✗ Some skills missing'}`);
  process.exit(allOk ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--list') {
  listSkills();
} else if (arg === '--verify') {
  verifySkills();
} else {
  listSkills();
  console.log('\nUsage: node index.js [--list|--verify]');
}
