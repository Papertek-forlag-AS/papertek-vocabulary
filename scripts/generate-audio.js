/**
 * Generate audio pronunciations for lexicon entries using ElevenLabs TTS.
 *
 * Generates MP3 files for entries that don't have an `audio` field set,
 * then updates the lexicon entries with the filename.
 *
 * Usage:
 *   node scripts/generate-audio.js [--dry-run] [--concurrency=5] [language...]
 *   node scripts/generate-audio.js de es fr en nb nn    # all languages
 *   node scripts/generate-audio.js de                    # German gaps only
 *   node scripts/generate-audio.js --dry-run en          # preview EN count
 *
 * Requires ELEVENLABS_API_KEY in .env.local
 */

import fs from 'fs';
import path from 'path';
import { setTimeout as sleep } from 'timers/promises';

// --- Configuration ---

const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // Alice — Clear, Engaging Educator
const MODEL_ID = 'eleven_flash_v2_5';

const LANGUAGE_CODES = {
  de: 'de',
  es: 'es',
  fr: 'fr',
  en: 'en',
  nb: 'no',
  nn: 'no',
};

// Where to store generated audio per language
const AUDIO_DIRS = {
  de: 'vocabulary/banks/de/audio',
  es: 'vocabulary/core/es/audio',
  fr: 'vocabulary/core/fr/audio',
  en: 'vocabulary/lexicon/en/audio',
  nb: 'vocabulary/lexicon/nb/audio',
  nn: 'vocabulary/lexicon/nn/audio',
};

const VOICE_SETTINGS = {
  stability: 0.75,
  similarity_boost: 0.75,
};

// --- Helpers ---

function loadApiKey() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Missing .env.local with ELEVENLABS_API_KEY');
    process.exit(1);
  }
  const env = fs.readFileSync(envPath, 'utf8');
  const match = env.match(/ELEVENLABS_API_KEY=(.+)/);
  if (!match) {
    console.error('ELEVENLABS_API_KEY not found in .env.local');
    process.exit(1);
  }
  return match[1].trim();
}

function getEntriesWithoutAudio(language) {
  const lexiconDir = path.join('vocabulary', 'lexicon', language);
  const entries = [];

  const bankFiles = fs.readdirSync(lexiconDir).filter(f => f.endsWith('bank.json'));
  for (const bankFile of bankFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(lexiconDir, bankFile), 'utf8'));
    for (const [wordId, entry] of Object.entries(data)) {
      if (wordId === '_metadata') continue;
      if (entry.audio) continue; // already has audio
      entries.push({ wordId, word: entry.word, bankFile });
    }
  }

  return entries;
}

function audioFilename(wordId) {
  return `${wordId}.mp3`;
}

async function generateAudio(apiKey, text, languageCode) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      language_code: languageCode,
      voice_settings: VOICE_SETTINGS,
    }),
  });

  if (response.status === 429) {
    return { retry: true };
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${body}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer };
}

async function processEntry(apiKey, entry, languageCode, audioDir, dryRun) {
  const filename = audioFilename(entry.wordId);
  const filePath = path.join(audioDir, filename);

  // Skip if file already exists on disk (from a previous run)
  if (fs.existsSync(filePath)) {
    return { status: 'exists', filename };
  }

  if (dryRun) {
    return { status: 'would_generate', filename };
  }

  // Retry loop
  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await generateAudio(apiKey, entry.word, languageCode);

    if (result.retry) {
      const wait = Math.min(2000 * Math.pow(2, attempt), 30000);
      process.stdout.write(`[rate limited, waiting ${wait / 1000}s] `);
      await sleep(wait);
      continue;
    }

    fs.writeFileSync(filePath, result.buffer);
    return { status: 'generated', filename, size: result.buffer.length };
  }

  throw new Error(`Failed after 5 retries: ${entry.wordId}`);
}

async function processLanguage(apiKey, language, concurrency, dryRun) {
  const languageCode = LANGUAGE_CODES[language];
  const audioDir = AUDIO_DIRS[language];

  if (!languageCode) {
    console.error(`Unknown language: ${language}`);
    return;
  }

  // Ensure audio directory exists
  if (!dryRun) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const entries = getEntriesWithoutAudio(language);
  console.log(`\n=== ${language.toUpperCase()} ===`);
  console.log(`Entries without audio: ${entries.length}`);
  console.log(`Audio directory: ${audioDir}`);
  console.log(`Language code: ${languageCode}`);

  if (entries.length === 0) {
    console.log('Nothing to generate.');
    return { generated: 0, skipped: 0, total: 0 };
  }

  if (dryRun) {
    console.log(`[DRY RUN] Would generate ${entries.length} audio files`);
    entries.slice(0, 5).forEach(e => console.log(`  ${e.wordId} → "${e.word}" → ${audioFilename(e.wordId)}`));
    if (entries.length > 5) console.log(`  ... +${entries.length - 5} more`);
    return { generated: 0, skipped: 0, total: entries.length };
  }

  // Process entries with limited concurrency
  let generated = 0;
  let skipped = 0;
  let errors = 0;
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(entry => processEntry(apiKey, entry, languageCode, audioDir, false))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.status === 'generated') generated++;
        else if (result.value.status === 'exists') skipped++;
      } else {
        errors++;
        console.error(`  Error: ${result.reason.message}`);
      }
    }

    // Progress
    const done = Math.min(i + concurrency, entries.length);
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = done / elapsed;
    const remaining = ((entries.length - done) / rate).toFixed(0);
    process.stdout.write(`\r  ${done}/${entries.length} (${generated} new, ${skipped} existed, ${errors} errors) ~${remaining}s remaining`);
  }

  console.log(`\n  Done: ${generated} generated, ${skipped} already existed, ${errors} errors (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);

  // Update lexicon entries with audio filenames
  if (generated > 0 || skipped > 0) {
    const lexiconDir = path.join('vocabulary', 'lexicon', language);
    const bankFiles = fs.readdirSync(lexiconDir).filter(f => f.endsWith('bank.json'));
    let updated = 0;

    for (const bankFile of bankFiles) {
      const bankPath = path.join(lexiconDir, bankFile);
      const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
      let bankUpdated = false;

      for (const [wordId, entry] of Object.entries(data)) {
        if (wordId === '_metadata') continue;
        if (entry.audio) continue;

        const filename = audioFilename(wordId);
        const filePath = path.join(audioDir, filename);
        if (fs.existsSync(filePath)) {
          data[wordId].audio = filename;
          bankUpdated = true;
          updated++;
        }
      }

      if (bankUpdated) {
        fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      }
    }

    console.log(`  Updated ${updated} lexicon entries with audio field`);
  }

  return { generated, skipped, errors, total: entries.length };
}

// --- Progress state (save/resume) ---

function loadProgress(language) {
  const statePath = path.join('vocabulary', 'lexicon', language, '.audio-progress.json');
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }
  return { completed: [] };
}

function saveProgress(language, progress) {
  const statePath = path.join('vocabulary', 'lexicon', language, '.audio-progress.json');
  fs.writeFileSync(statePath, JSON.stringify(progress, null, 2), 'utf8');
}

// --- Main ---

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const concurrencyArg = args.find(a => a.startsWith('--concurrency='));
const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1]) : 5;
const languages = args.filter(a => !a.startsWith('--'));

if (languages.length === 0) {
  console.log('Usage: node scripts/generate-audio.js [--dry-run] [--concurrency=N] <language...>');
  console.log('Languages: de, es, fr, en, nb, nn');
  process.exit(0);
}

const apiKey = loadApiKey();

if (dryRun) console.log('[DRY RUN MODE]\n');
console.log(`Model: ${MODEL_ID}`);
console.log(`Voice: Alice (${VOICE_ID})`);
console.log(`Concurrency: ${concurrency}`);

const allStats = {};
for (const lang of languages) {
  allStats[lang] = await processLanguage(apiKey, lang, concurrency, dryRun);
}

console.log('\n=== Summary ===');
for (const [lang, s] of Object.entries(allStats)) {
  if (s) {
    console.log(`${lang}: ${s.generated || 0} generated, ${s.skipped || 0} skipped, ${s.total} total needed`);
  }
}
