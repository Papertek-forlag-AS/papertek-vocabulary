/**
 * sync-nouns.js
 *
 * Phase 15 SYNC-02: Sync noun declension data from the core nounbank to
 * the dictionary nounbank.
 *
 * Source:  vocabulary/core/de/nounbank.json   (331 nouns, all with 4-case declension)
 * Target:  vocabulary/dictionary/de/nounbank.json  (331 nouns, 331 overlap with core)
 *
 * For each key in core nounbank (excluding _metadata):
 *   - If the key exists in the dict nounbank:
 *     - Sync cases — full 4-case declension object (core wins, overwrite entirely)
 *     - Sync declension_type — string value (strong/weak/plural-only/uncountable)
 *     - Sync weak_masculine — boolean (only if true in core; was deferred from Phase 12)
 *
 * Dict-only fields (cefr, frequency, curriculum) are preserved — this script
 * only ADDS/UPDATES declension data, never removes existing dict fields.
 *
 * Expected output: Synced: 331, Skipped: 1 (_metadata only)
 */
import { readFileSync, writeFileSync } from 'fs';

const CORE_PATH = 'vocabulary/core/de/nounbank.json';
const DICT_PATH = 'vocabulary/dictionary/de/nounbank.json';

const core = JSON.parse(readFileSync(CORE_PATH, 'utf8'));
const dict = JSON.parse(readFileSync(DICT_PATH, 'utf8'));

let synced = 0;
let skipped = 0;

for (const key of Object.keys(core)) {
  if (key === '_metadata') continue;

  const coreEntry = core[key];
  const dictEntry = dict[key];

  // Skip if key not in dict nounbank
  if (!dictEntry) {
    skipped++;
    continue;
  }

  // Sync cases — core wins, overwrite entirely
  if (coreEntry.cases) {
    dict[key].cases = coreEntry.cases;
  }

  // Sync declension_type
  if (coreEntry.declension_type) {
    dict[key].declension_type = coreEntry.declension_type;
  }

  // Sync weak_masculine — only if true in core (deferred from Phase 12)
  if (coreEntry.weak_masculine === true) {
    dict[key].weak_masculine = true;
  }

  synced++;
}

writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2));
console.log(`Synced: ${synced}, Skipped: ${skipped}`);
