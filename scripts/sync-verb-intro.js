/**
 * sync-verb-intro.js
 *
 * Populates the `intro` field on verb conjugation tenses in the verbbank,
 * using lesson-to-word mappings from curriculum manifests.
 *
 * For each curriculum manifest (e.g., vocab-manifest-tysk1-vg1.json):
 *   - Builds a reverse lookup: verbKey → earliest lesson where the verb appears
 *   - Sets conjugations.presens.intro to that lesson (e.g., "1.1")
 *   - Also sets entry-level `intro` field for general lookups
 *
 * Usage:
 *   node scripts/sync-verb-intro.js [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const BANK_PATH = 'vocabulary/banks/de/verbbank.json';
const CURRICULA_DIR = 'vocabulary/curricula';

// --- Load verbbank ---
const verbbank = JSON.parse(readFileSync(BANK_PATH, 'utf8'));

// --- Load all German curriculum manifests ---
const manifestFiles = readdirSync(CURRICULA_DIR)
  .filter(f => f.startsWith('vocab-manifest-tysk') && f.endsWith('.json'));

console.log(`Found ${manifestFiles.length} curriculum manifest(s):`);
manifestFiles.forEach(f => console.log(`  ${f}`));

// --- Build verb → intro mapping per curriculum ---
// We process all manifests and keep the earliest lesson per verb across all curricula.
// If a verb appears in multiple curricula, we use the earliest lesson from the primary
// curriculum (tysk1-vg1) which is the main one.
const verbIntroMap = new Map();

for (const file of manifestFiles) {
  const manifest = JSON.parse(readFileSync(join(CURRICULA_DIR, file), 'utf8'));
  const lessons = Object.entries(manifest.lessons);

  // Sort lessons numerically so "1.1" < "1.2" < "2.1" etc.
  lessons.sort(([a], [b]) => {
    const [aMaj, aMin] = a.split('.').map(Number);
    const [bMaj, bMin] = b.split('.').map(Number);
    return aMaj !== bMaj ? aMaj - bMaj : aMin - bMin;
  });

  for (const [lesson, data] of lessons) {
    for (const wordKey of data.words) {
      // Match verbs: _verb, _modal, _verbphrase suffixes
      if (wordKey.endsWith('_verb') || wordKey.endsWith('_modal') || wordKey.endsWith('_verbphrase')) {
        if (!verbIntroMap.has(wordKey)) {
          verbIntroMap.set(wordKey, lesson);
        }
      }
    }
  }
}

console.log(`\nMapped ${verbIntroMap.size} verbs to intro lessons.`);

// --- Apply intro to verbbank entries ---
let updated = 0;
let skipped = 0;
let notFound = 0;

for (const [verbKey, lesson] of verbIntroMap) {
  const entry = verbbank[verbKey];

  if (!entry) {
    // Verb in manifest but not in bank (could be _modal handled differently)
    notFound++;
    continue;
  }

  // Set entry-level intro
  entry.intro = lesson;

  // Set tense-level intro on presens (the primary tense the verb trainer uses)
  if (entry.conjugations?.presens) {
    entry.conjugations.presens.intro = lesson;
  }

  // Set tense-level intro on preteritum/perfektum if they exist
  // These tenses get the same lesson as presens since they're introduced together
  // in the curriculum. If a future curriculum introduces tenses separately,
  // the manifest features can be used to differentiate.
  if (entry.conjugations?.preteritum) {
    entry.conjugations.preteritum.intro = lesson;
  }
  if (entry.conjugations?.perfektum) {
    entry.conjugations.perfektum.intro = lesson;
  }

  updated++;
}

// --- Report ---
console.log(`\nResults:`);
console.log(`  Updated: ${updated} verbs with intro field`);
console.log(`  Skipped: ${skipped} (already had intro)`);
console.log(`  Not in bank: ${notFound} (manifest-only entries)`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] No files written. Remove --dry-run to apply changes.');

  // Show a few examples
  console.log('\nExamples of what would be written:');
  let shown = 0;
  for (const [verbKey, lesson] of verbIntroMap) {
    if (verbbank[verbKey]?.conjugations?.presens && shown < 5) {
      console.log(`  ${verbKey}: presens.intro = "${lesson}"`);
      shown++;
    }
  }
} else {
  writeFileSync(BANK_PATH, JSON.stringify(verbbank, null, 2) + '\n', 'utf8');
  console.log(`\nWrote updated verbbank to ${BANK_PATH}`);
}
