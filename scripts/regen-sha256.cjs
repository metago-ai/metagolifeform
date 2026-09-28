#!/usr/bin/env node
/**
 * regen-sha256.cjs - Regenerate SHA256 manifest for local-edition files
 * Usage: node scripts/regen-sha256.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOCAL_EDITION_DIR = path.resolve(__dirname, '..', 'local-edition');
const PKG_VERSION = (() => { try { return require(path.resolve(__dirname, '..', 'package.json')).version; } catch { return 'unknown'; } })(); // 36.9.6: 版本戳动态化（旧字面量 V36.9.6 会随版本漂移）
const MANIFEST_PATH = path.join(LOCAL_EDITION_DIR, 'MANIFEST.sha256');

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function walkDir(dir, baseDir, results = []) {
  // 36.9.6：portable/node_modules 为生成物（由 npm install 保证），不纳入逐文件清单
  if (path.basename(dir) === "node_modules") return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walkDir(fullPath, baseDir, results);
    } else if (entry.isFile() && entry.name !== 'MANIFEST.sha256') {
      results.push({ relPath, fullPath });
    }
  }
  return results;
}

function main() {
  const files = walkDir(LOCAL_EDITION_DIR, LOCAL_EDITION_DIR);
  
  let manifest = `# MetaGO Lifeform V${PKG_VERSION} Local Edition - SHA256 Manifest\n`;
  manifest += `# Generated: ${new Date().toISOString()}\n`;
  manifest += `# Total files: ${files.length}\n\n`;

  for (const file of files.sort((a, b) => a.relPath.localeCompare(b.relPath))) {
    const hash = sha256File(file.fullPath);
    const size = fs.statSync(file.fullPath).size;
// 36.9.3 修复：去掉 "(N bytes)" 后缀，保持 `sha256sum -c` 机器可校验格式
  manifest += `${hash}  ${file.relPath}\n`;
  }

  fs.writeFileSync(MANIFEST_PATH, manifest, 'utf8');
  console.log(`Manifest written to ${MANIFEST_PATH}`);
  console.log(`Total files: ${files.length}`);
}

main();
