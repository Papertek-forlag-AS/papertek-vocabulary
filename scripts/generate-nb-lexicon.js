/**
 * generate-nb-lexicon.js
 *
 * Phase 1 of the two-way dictionary: generates Norwegian Bokmål (NB)
 * lexicon entries from existing translation data.
 *
 * Reads all translations/{lang}-nb/*.json files, extracts unique
 * Norwegian words, deduplicates, splits slash-alternatives, and
 * produces vocabulary/lexicon/nb/*.json bank files.
 *
 * Usage:
 *   node scripts/generate-nb-lexicon.js
 *
 * Output:
 *   vocabulary/lexicon/nb/nounbank.json
 *   vocabulary/lexicon/nb/verbbank.json
 *   vocabulary/lexicon/nb/adjectivebank.json
 *   vocabulary/lexicon/nb/generalbank.json
 *   vocabulary/lexicon/nb/manifest.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const VOCAB_BASE = 'vocabulary';
const TRANS_BASE = join(VOCAB_BASE, 'translations');
const LEXICON_BASE = join(VOCAB_BASE, 'lexicon');
const NB_BASE = join(LEXICON_BASE, 'nb');

// Source language pairs that translate TO Norwegian
const NB_PAIRS = ['de-nb', 'es-nb', 'fr-nb'];

// Map source bank file names to the NB bank they should go into
const BANK_FILES = [
  'nounbank.json',
  'verbbank.json',
  'adjectivebank.json',
  'generalbank.json',
  'articlesbank.json',
  'numbersbank.json',
  'phrasesbank.json',
  'pronounsbank.json',
];

// Map source word ID suffix to NB word type
const SUFFIX_TO_TYPE = {
  noun: 'noun',
  verb: 'verb',
  adj: 'adj',
  adv: 'adv',
  prep: 'prep',
  conj: 'conj',
  interj: 'interj',
  pron: 'pron',
  art: 'art',
  num: 'num',
  phrase: 'phrase',
  interr: 'interr',
  propn: 'propn',
  contr: 'contr',
  expr: 'expr',
  dem_pron: 'pron',
  poss_pron: 'pron',
  dobj_pron: 'pron',
  iobj_pron: 'pron',
  refl_pron: 'pron',
  possessiv: 'pron',
  modal: 'verb',
  verbphrase: 'phrase',
  general: 'adv', // default for untyped generalbank entries
  land: 'propn',
};

// Which NB bank each type goes into
const TYPE_TO_NB_BANK = {
  noun: 'nounbank',
  verb: 'verbbank',
  adj: 'adjectivebank',
  adv: 'generalbank',
  prep: 'generalbank',
  conj: 'generalbank',
  interj: 'generalbank',
  pron: 'generalbank',
  art: 'generalbank',
  num: 'generalbank',
  phrase: 'generalbank',
  interr: 'generalbank',
  propn: 'generalbank',
  contr: 'generalbank',
  expr: 'generalbank',
};

/**
 * Normalize a Norwegian word into a word ID.
 * Convention: lowercase, strip "å " prefix for verbs, replace special chars.
 */
function normalizeToId(word, type) {
  let normalized = word.toLowerCase().trim();

  // Strip "å " prefix for verbs
  if (normalized.startsWith('å ')) {
    normalized = normalized.substring(2);
  }

  // Norwegian-specific character handling
  // Keep æ, ø, å as-is in IDs (they're standard Norwegian letters, not special chars)
  // Replace spaces with underscores
  normalized = normalized.replace(/\s+/g, '_');

  // Remove parenthetical context notes for the ID (but keep for the entry)
  normalized = normalized.replace(/\s*\(.*?\)\s*/g, '');

  // Remove trailing/leading underscores
  normalized = normalized.replace(/^_+|_+$/g, '');

  // Remove any remaining non-alphanumeric chars except underscore, æ, ø, å
  normalized = normalized.replace(/[^a-zæøå0-9_]/g, '');

  return `${normalized}_${type}`;
}

/**
 * Extract the clean word form from a translation string.
 * Removes parenthetical notes but keeps them as context.
 */
function parseTranslation(translation) {
  const contextMatch = translation.match(/\(([^)]+)\)/);
  const context = contextMatch ? contextMatch[1] : null;
  const cleanWord = translation.replace(/\s*\(.*?\)\s*/g, '').trim();
  return { word: cleanWord, context };
}

/**
 * Determine the word type from a source word ID.
 */
function getTypeFromSourceId(sourceId) {
  const parts = sourceId.split('_');

  // Try two-part suffix (dem_pron, poss_pron, etc.)
  if (parts.length >= 3) {
    const twoPartSuffix = parts.slice(-2).join('_');
    if (SUFFIX_TO_TYPE[twoPartSuffix]) {
      return SUFFIX_TO_TYPE[twoPartSuffix];
    }
  }

  // Try single-part suffix
  if (parts.length >= 2) {
    const suffix = parts[parts.length - 1];
    if (SUFFIX_TO_TYPE[suffix]) {
      return SUFFIX_TO_TYPE[suffix];
    }
  }

  return 'adv'; // fallback for untyped entries
}

/**
 * Split slash-separated translations into individual words.
 * "middag / kveldsmat" → ["middag", "kveldsmat"]
 * "å begynne / å starte" → ["å begynne", "å starte"]
 */
function splitAlternatives(translation) {
  // Split on " / " (with spaces) or "/" (without spaces for compound words like "bad/baderom")
  return translation
    .split(/\s*\/\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Build an NB lexicon entry from extracted translation data.
 */
function buildEntry(word, type, sources, definiteForm, context) {
  const entry = {
    word,
    type,
  };

  // For nouns: add genus placeholder and definite form if available
  if (type === 'noun') {
    // We don't know the genus from translations — mark as needing enrichment
    if (definiteForm) {
      // Try to infer genus from definite form ending
      // -en → masculine, -a → feminine, -et → neuter (rough heuristic)
      const defLower = definiteForm.toLowerCase();
      if (defLower.endsWith('et') || defLower.endsWith('a')) {
        // Could be neuter (-et) or feminine (-a), but we can't be sure
        // Leave for enrichment
      }
      entry.forms = {
        bestemt: {
          entall: definiteForm,
        },
      };
    }
  }

  // For verbs: set up the infinitive form
  if (type === 'verb') {
    const infinitive = word.startsWith('å ') ? word : `å ${word}`;
    entry.conjugations = {
      presens: {
        former: {
          infinitiv: infinitive,
        },
        feature: 'grammar_nb_presens',
      },
    };
    // Store the bare form as the word (without "å")
    entry.word = word.startsWith('å ') ? word.substring(2) : word;
  }

  // Add context note if present
  if (context) {
    entry.usageNotes = context;
  }

  // Track which source words generated this entry
  entry._generatedFrom = sources.join(', ');
  entry._enriched = false;

  return entry;
}

// ─── Main ────────────────────────────────────────────────────────────────

console.log('Generating Norwegian Bokmål (NB) lexicon...\n');

// Collect all Norwegian words from translation packs
// Key: NB word ID → { word, type, sources[], definiteForm, context }
const nbWords = new Map();

// Track stats
let totalTranslationEntries = 0;
let totalSlashSplits = 0;
let totalDuplicatesMerged = 0;

for (const pair of NB_PAIRS) {
  const pairDir = join(TRANS_BASE, pair);
  if (!existsSync(pairDir)) {
    console.log(`  Skipping ${pair} (directory not found)`);
    continue;
  }

  const sourceLang = pair.split('-')[0];

  // Also load source bank data to get accurate types for generalbank entries
  let sourceBanks = {};
  const sourceBankDir = existsSync(join(VOCAB_BASE, 'banks', sourceLang))
    ? join(VOCAB_BASE, 'banks', sourceLang)
    : existsSync(join(VOCAB_BASE, 'core', sourceLang))
      ? join(VOCAB_BASE, 'core', sourceLang)
      : null;

  if (sourceBankDir) {
    for (const bankFile of BANK_FILES) {
      const bankPath = join(sourceBankDir, bankFile);
      if (existsSync(bankPath)) {
        const data = JSON.parse(readFileSync(bankPath, 'utf8'));
        const { _metadata, ...entries } = data;
        sourceBanks = { ...sourceBanks, ...entries };
      }
    }
  }

  for (const bankFile of BANK_FILES) {
    const filePath = join(pairDir, bankFile);
    if (!existsSync(filePath)) continue;

    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    const { _metadata, ...entries } = data;

    for (const [sourceId, transEntry] of Object.entries(entries)) {
      if (!transEntry.translation) continue;
      totalTranslationEntries++;

      // Determine the type from the source word
      // First check if the source bank has a type field
      let type;
      if (sourceBanks[sourceId] && sourceBanks[sourceId].type) {
        type = SUFFIX_TO_TYPE[sourceBanks[sourceId].type] || getTypeFromSourceId(sourceId);
      } else {
        type = getTypeFromSourceId(sourceId);
      }

      // Split slash alternatives
      const alternatives = splitAlternatives(transEntry.translation);
      if (alternatives.length > 1) totalSlashSplits++;

      // Also split definite forms if they have slashes
      const definiteAlternatives = transEntry.definite
        ? splitAlternatives(transEntry.definite)
        : [];

      for (let i = 0; i < alternatives.length; i++) {
        const alt = alternatives[i];
        const { word, context } = parseTranslation(alt);

        if (!word || word.length === 0) continue;

        const nbId = normalizeToId(word, type);
        const definiteForm = definiteAlternatives[i] || null;

        const sourceRef = `${pair}/${bankFile}:${sourceId}`;

        if (nbWords.has(nbId)) {
          // Merge: add this source reference
          const existing = nbWords.get(nbId);
          existing.sources.push(sourceRef);
          // Keep definite form if we don't have one yet
          if (!existing.definiteForm && definiteForm) {
            existing.definiteForm = definiteForm;
          }
          totalDuplicatesMerged++;
        } else {
          nbWords.set(nbId, {
            word,
            type,
            sources: [sourceRef],
            definiteForm,
            context,
          });
        }
      }
    }
  }

  console.log(`  Processed ${pair}`);
}

// ─── Organize into banks ──────────────────────────────────────────────────

const banks = {
  nounbank: {},
  verbbank: {},
  adjectivebank: {},
  generalbank: {},
};

for (const [nbId, data] of nbWords) {
  const bankName = TYPE_TO_NB_BANK[data.type] || 'generalbank';
  const entry = buildEntry(data.word, data.type, data.sources, data.definiteForm, data.context);
  banks[bankName][nbId] = entry;
}

// ─── Sort entries alphabetically by ID ────────────────────────────────────

for (const bankName of Object.keys(banks)) {
  const sorted = {};
  const keys = Object.keys(banks[bankName]).sort();
  for (const key of keys) {
    sorted[key] = banks[bankName][key];
  }
  banks[bankName] = sorted;
}

// ─── Write output ─────────────────────────────────────────────────────────

// Ensure output directories exist
mkdirSync(NB_BASE, { recursive: true });

const bankCounts = {};
for (const [bankName, entries] of Object.entries(banks)) {
  const count = Object.keys(entries).length;
  if (count === 0) continue;

  bankCounts[bankName] = count;

  const output = {
    _metadata: {
      language: 'nb',
      languageName: 'Norsk bokmål',
      bank: bankName,
      generatedAt: new Date().toISOString(),
      description: `Norwegian Bokmål ${bankName} — generated from translation packs`,
      totalEntries: count,
      enrichedEntries: 0,
      skeletonEntries: count,
    },
    ...entries,
  };

  const outPath = join(NB_BASE, `${bankName}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(`  Wrote ${outPath} (${count} entries)`);
}

// ─── Write manifest ───────────────────────────────────────────────────────

const totalWords = Object.values(bankCounts).reduce((a, b) => a + b, 0);
const manifest = {
  _metadata: {
    language: 'nb',
    languageName: 'Norsk bokmål',
    generatedAt: new Date().toISOString(),
    description: 'Norwegian Bokmål lexicon — Phase 1 skeleton entries',
  },
  summary: {
    totalWords,
    enrichedWords: 0,
    skeletonWords: totalWords,
  },
  banks: bankCounts,
  sources: NB_PAIRS.filter(p => existsSync(join(TRANS_BASE, p))),
};

const manifestPath = join(NB_BASE, 'manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// ─── Summary ──────────────────────────────────────────────────────────────

console.log('\n=== Summary ===');
console.log(`  Translation entries processed: ${totalTranslationEntries}`);
console.log(`  Slash alternatives split:      ${totalSlashSplits}`);
console.log(`  Duplicates merged:             ${totalDuplicatesMerged}`);
console.log(`  Unique NB words generated:     ${totalWords}`);
for (const [bank, count] of Object.entries(bankCounts)) {
  console.log(`    ${bank}: ${count}`);
}
console.log(`\n  Output: ${NB_BASE}/`);
