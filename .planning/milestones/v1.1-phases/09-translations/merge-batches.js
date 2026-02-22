#!/usr/bin/env node
// merge-batches.js
// Merges all nb-batch-*.json and en-batch-*.json files into nb-data.json and en-data.json
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function mergeFiles(prefix) {
  const files = readdirSync(__dirname)
    .filter(f => f.startsWith(prefix + '-batch-') && f.endsWith('.json'))
    .sort();

  console.log(`Merging ${files.length} files for ${prefix}:`);
  const merged = {};
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(__dirname, file), 'utf8'));
    const count = Object.keys(data).length;
    console.log(`  ${file}: ${count} entries`);
    Object.assign(merged, data);
  }

  const total = Object.keys(merged).length;
  console.log(`Total ${prefix} entries: ${total}`);
  writeFileSync(join(__dirname, prefix + '-data.json'), JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log(`Written to ${prefix}-data.json\n`);
  return total;
}

mergeFiles('nb');
mergeFiles('en');
