/**
 * Link existing audio files to lexicon entries.
 *
 * Audio files use Norwegian type prefixes (substantiv, verb, adjektiv, ord, ...),
 * while lexicon word IDs use English suffixes (noun, verb, adj, adv, ...).
 *
 * This script builds a mapping between them and sets the `audio` field on
 * lexicon entries that have a matching audio file on disk.
 *
 * Usage:
 *   node scripts/link-audio-to-lexicon.js [--dry-run] [language...]
 *   node scripts/link-audio-to-lexicon.js              # all languages with audio
 *   node scripts/link-audio-to-lexicon.js de            # German only
 *   node scripts/link-audio-to-lexicon.js --dry-run de  # preview without writing
 */

import fs from 'fs';
import path from 'path';

// Audio directories per language
const AUDIO_DIRS = {
  de: 'vocabulary/banks/de/audio',
  es: 'vocabulary/core/es/audio',
  fr: 'vocabulary/core/fr/audio',
};

// Map lexicon word ID suffix → possible audio filename prefixes (ordered by likelihood)
const SUFFIX_TO_PREFIXES = {
  noun:       ['substantiv', 'ord'],
  verb:       ['verb', 'ord'],
  adj:        ['adjektiv', 'ord'],
  adv:        ['ord', 'adjektiv'],
  prep:       ['ord'],
  conj:       ['ord'],
  interj:     ['ord'],
  interr:     ['ord'],
  general:    ['ord'],
  expr:       ['frase', 'ord'],
  contr:      ['artikkel', 'ord'],
  phrase:     ['frase', 'ord'],
  pron:       ['pronomen', 'ord'],
  possessiv:  ['pronomen'],
  dem_pron:   ['pronomen'],
  poss_pron:  ['pronomen'],
  dobj_pron:  ['pronomen'],
  iobj_pron:  ['pronomen'],
  refl_pron:  ['pronomen'],
  num:        ['tall'],
  art:        ['artikkel'],
  articulo:   ['artikkel'],
  article:    ['artikkel'],
  partitif:   ['artikkel'],
  propn:      ['land', 'ord'],
  land:       ['land'],
  modal:      ['verb'],
  verbphrase: ['ord', 'verb'],
  verbe:      ['verb'],  // FR uses 'verbe' suffix
  ord:        ['ord'],   // FR uses 'ord' suffix
};

function getWordIdParts(wordId) {
  const parts = wordId.split('_');
  // Try two-part suffix first (e.g., dem_pron, poss_pron)
  if (parts.length >= 3) {
    const twoPartSuffix = parts.slice(-2).join('_');
    if (SUFFIX_TO_PREFIXES[twoPartSuffix]) {
      return { wordPart: parts.slice(0, -2).join('_'), suffix: twoPartSuffix };
    }
  }
  // Single-part suffix
  if (parts.length >= 2) {
    const suffix = parts[parts.length - 1];
    return { wordPart: parts.slice(0, -1).join('_'), suffix };
  }
  return null;
}

function processLanguage(language, audioDir, dryRun) {
  const lexiconDir = path.join('vocabulary', 'lexicon', language);

  // Load all audio filenames into a Set
  const audioFiles = new Set(
    fs.readdirSync(audioDir)
      .filter(f => f.endsWith('.mp3') && !f.includes('[todo'))
  );

  console.log(`\n=== ${language.toUpperCase()} ===`);
  console.log(`Audio files on disk: ${audioFiles.size} (excluding [todo] placeholders)`);

  // Build reverse index: audio filename → true (for quick lookup)
  const stats = { total: 0, alreadySet: 0, matched: 0, unmatched: 0 };
  const unmatchedEntries = [];
  const bankUpdates = {}; // { bankFile: { wordId: audioFilename } }

  // Process each bank file
  const bankFiles = fs.readdirSync(lexiconDir).filter(f => f.endsWith('bank.json'));

  for (const bankFile of bankFiles) {
    const bankPath = path.join(lexiconDir, bankFile);
    const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));

    for (const [wordId, entry] of Object.entries(data)) {
      if (wordId === '_metadata') continue;
      stats.total++;

      if (entry.audio) {
        stats.alreadySet++;
        continue;
      }

      const parsed = getWordIdParts(wordId);
      if (!parsed) continue;

      const { wordPart, suffix } = parsed;
      const prefixes = SUFFIX_TO_PREFIXES[suffix] || ['ord'];

      // Try each possible audio prefix
      let matched = false;
      for (const prefix of prefixes) {
        const candidate = `${prefix}_${wordPart}.mp3`;
        if (audioFiles.has(candidate)) {
          if (!bankUpdates[bankFile]) bankUpdates[bankFile] = {};
          bankUpdates[bankFile][wordId] = candidate;
          stats.matched++;
          matched = true;
          break;
        }
      }

      if (!matched) {
        stats.unmatched++;
        unmatchedEntries.push(wordId);
      }
    }
  }

  console.log(`Total entries: ${stats.total}`);
  console.log(`Already had audio: ${stats.alreadySet}`);
  console.log(`Newly matched: ${stats.matched}`);
  console.log(`No audio file found: ${stats.unmatched}`);

  if (stats.matched === 0) {
    console.log('No new matches to write.');
    return stats;
  }

  // Write updates
  if (dryRun) {
    console.log(`\n[DRY RUN] Would update ${Object.keys(bankUpdates).length} bank files`);
    for (const [bankFile, updates] of Object.entries(bankUpdates)) {
      console.log(`  ${bankFile}: ${Object.keys(updates).length} entries`);
      Object.entries(updates).slice(0, 3).forEach(([wid, audio]) =>
        console.log(`    ${wid} → ${audio}`)
      );
      if (Object.keys(updates).length > 3) {
        console.log(`    ... +${Object.keys(updates).length - 3} more`);
      }
    }
  } else {
    for (const [bankFile, updates] of Object.entries(bankUpdates)) {
      const bankPath = path.join(lexiconDir, bankFile);
      const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));

      for (const [wordId, audioFilename] of Object.entries(updates)) {
        data[wordId].audio = audioFilename;
      }

      fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`  Updated ${bankFile}: ${Object.keys(updates).length} entries`);
    }
  }

  if (unmatchedEntries.length > 0 && unmatchedEntries.length <= 20) {
    console.log(`\nUnmatched entries: ${unmatchedEntries.join(', ')}`);
  } else if (unmatchedEntries.length > 20) {
    console.log(`\nUnmatched entries (first 20): ${unmatchedEntries.slice(0, 20).join(', ')} ... +${unmatchedEntries.length - 20} more`);
  }

  return stats;
}

// --- Main ---

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const languages = args.filter(a => a !== '--dry-run');
const targetLanguages = languages.length > 0
  ? languages.filter(l => AUDIO_DIRS[l])
  : Object.keys(AUDIO_DIRS);

if (targetLanguages.length === 0) {
  console.error('No valid languages. Available:', Object.keys(AUDIO_DIRS).join(', '));
  process.exit(1);
}

if (dryRun) console.log('[DRY RUN MODE — no files will be modified]\n');

const allStats = {};
for (const lang of targetLanguages) {
  allStats[lang] = processLanguage(lang, AUDIO_DIRS[lang], dryRun);
}

console.log('\n=== Summary ===');
for (const [lang, s] of Object.entries(allStats)) {
  const coverage = ((s.alreadySet + s.matched) / s.total * 100).toFixed(1);
  console.log(`${lang}: ${s.matched} newly linked, ${s.alreadySet} already set, ${s.unmatched} no file → ${coverage}% coverage`);
}
