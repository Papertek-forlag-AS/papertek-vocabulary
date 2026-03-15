/**
 * Build audio ZIP packs for all languages with audio files.
 *
 * Creates ZIP archives in vocabulary/downloads/ for each language.
 * Updates vocabulary/downloads/manifest.json with file sizes and timestamps.
 *
 * Usage:
 *   node scripts/build-audio-zips.js [language...]
 *   node scripts/build-audio-zips.js          # all languages with audio
 *   node scripts/build-audio-zips.js de en    # specific languages
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const AUDIO_DIRS = {
  de: 'vocabulary/banks/de/audio',
  es: 'vocabulary/core/es/audio',
  fr: 'vocabulary/core/fr/audio',
  en: 'vocabulary/lexicon/en/audio',
  nb: 'vocabulary/lexicon/nb/audio',
  nn: 'vocabulary/lexicon/nn/audio',
};

const DOWNLOADS_DIR = 'vocabulary/downloads';

function buildZip(language, audioDir) {
  const zipName = `audio-${language}.zip`;
  const zipPath = path.join(DOWNLOADS_DIR, zipName);

  // Count MP3 files (exclude [todo] placeholders)
  const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3') && !f.includes('[todo'));

  if (files.length === 0) {
    console.log(`  ${language}: no audio files, skipping`);
    return null;
  }

  console.log(`  ${language}: zipping ${files.length} files from ${audioDir}...`);

  // Remove old ZIP if exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // Build ZIP using system zip command (exclude [todo] files)
  const absAudioDir = path.resolve(audioDir);
  const absZipPath = path.resolve(zipPath);

  execSync(
    `cd "${absAudioDir}" && zip -q "${absZipPath}" *.mp3 -x '*\\[todo*'`,
    { stdio: 'pipe' }
  );

  const stats = fs.statSync(zipPath);
  const sizeMB = (stats.size / 1048576).toFixed(2);
  console.log(`  ${language}: ${zipName} (${sizeMB} MB, ${files.length} files)`);

  return {
    language,
    filename: zipName,
    size: stats.size,
    sizeMB,
    fileCount: files.length,
    url: `/vocabulary/downloads/${zipName}`,
    updatedAt: new Date().toISOString(),
  };
}

// --- Main ---

const args = process.argv.slice(2);
const languages = args.length > 0
  ? args.filter(l => AUDIO_DIRS[l])
  : Object.keys(AUDIO_DIRS);

// Ensure downloads directory exists
fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

console.log('Building audio ZIP packs...\n');

const results = [];
for (const lang of languages) {
  const audioDir = AUDIO_DIRS[lang];
  if (!fs.existsSync(audioDir)) {
    console.log(`  ${lang}: audio directory not found (${audioDir}), skipping`);
    continue;
  }
  const result = buildZip(lang, audioDir);
  if (result) results.push(result);
}

// Update downloads manifest
const manifestPath = path.join(DOWNLOADS_DIR, 'manifest.json');
let manifest = { downloads: [] };
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

// Merge: update existing entries, add new ones
for (const result of results) {
  const idx = manifest.downloads.findIndex(d => d.language === result.language);
  if (idx >= 0) {
    manifest.downloads[idx] = result;
  } else {
    manifest.downloads.push(result);
  }
}

// Sort by language
manifest.downloads.sort((a, b) => a.language.localeCompare(b.language));
manifest.generatedAt = new Date().toISOString();

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log('\nDownloads manifest updated.');
console.log('\n=== Summary ===');
for (const r of results) {
  console.log(`  ${r.language}: ${r.filename} — ${r.sizeMB} MB (${r.fileCount} files)`);
}
