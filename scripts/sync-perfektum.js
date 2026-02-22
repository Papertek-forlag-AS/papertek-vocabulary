/**
 * sync-perfektum.js
 *
 * Phase 15 SYNC-01: Sync perfektum conjugations from the core verbbank to
 * the dictionary verbbank.
 *
 * Source:  vocabulary/core/de/verbbank.json   (148 verbs, 144 with perfektum)
 * Target:  vocabulary/dictionary/de/verbbank.json  (679 verbs, 148 overlap with core)
 *
 * For each key in core verbbank (excluding _metadata):
 *   - If the key exists in the dict verbbank AND core entry has conjugations.perfektum:
 *     - Merge perfektum into dict entry's conjugations object (preserve all existing fields)
 *     - If core entry has inseparable: true, also re-set dict entry inseparable: true
 *       (was already synced in Phase 12, but re-asserting ensures full parity)
 *
 * Dict-only fields (cefr, frequency, curriculum, verbClass) are preserved — this script
 * only ADDS data, never replaces or removes existing dict fields.
 *
 * Note: Preteritum was already synced in Phase 12 — this script does NOT re-sync it.
 *
 * Expected output: Synced: 144, Skipped: 5 (1 _metadata + 4 verbphrases/others)
 */
import { readFileSync, writeFileSync } from 'fs';

const CORE_PATH = 'vocabulary/core/de/verbbank.json';
const DICT_PATH = 'vocabulary/dictionary/de/verbbank.json';

const core = JSON.parse(readFileSync(CORE_PATH, 'utf8'));
const dict = JSON.parse(readFileSync(DICT_PATH, 'utf8'));

let synced = 0;
let skipped = 0;

for (const key of Object.keys(core)) {
  if (key === '_metadata') continue;

  const coreEntry = core[key];
  const dictEntry = dict[key];

  // Skip if key not in dict verbbank (dict-only entries are not in scope)
  if (!dictEntry) {
    skipped++;
    continue;
  }

  const coreConjs = coreEntry.conjugations || {};

  // Skip if core entry has no perfektum data
  if (!coreConjs.perfektum) {
    skipped++;
    continue;
  }

  // Merge perfektum into dict entry's conjugations — preserve existing conj fields
  dict[key].conjugations = {
    ...dictEntry.conjugations,
    perfektum: coreConjs.perfektum,
  };

  // Re-sync inseparable flag if set in core (ensures full parity with Phase 12 sync)
  if (coreEntry.inseparable === true) {
    dict[key].inseparable = true;
  }

  synced++;
}

writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2));
console.log(`Synced: ${synced}, Skipped: ${skipped}`);
