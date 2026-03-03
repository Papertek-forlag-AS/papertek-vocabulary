/**
 * Phase 12 AUDIT-01 + AUDIT-02: Add inseparable and weak_masculine flags
 * to core verbbank and nounbank respectively.
 *
 * This script is for development/audit purposes only — not for production use.
 */
import { readFileSync, writeFileSync } from 'fs';

// ── AUDIT-01: Inseparable verb flags ────────────────────────────────────────

const INSEPARABLE_VERB_KEYS = [
  'besuchen_verb',
  'beginnen_verb',
  'bekommen_verb',
  'sich_bewegen_verb',
  'entspannen_verb',
  'sich_entschuldigen_verb',
  'sich_entspannen_verb',
  'erklaeren_verb',
  'erzaehlen_verb',
  'sich_erholen_verb',
  'vergessen_verb',
  'verlieren_verb',
  'versprechen_verb',
  'verstehen_verb',
  'vertrauen_verb',
  'sich_verspaeten_verb',
  'sich_unterhalten_verb',
];

const verbbank = JSON.parse(readFileSync('vocabulary/core/de/verbbank.json', 'utf8'));

let verbsTagged = 0;
for (const key of INSEPARABLE_VERB_KEYS) {
  const entry = verbbank[key];
  if (!entry) {
    console.error('ERROR: Key not found in verbbank:', key);
    process.exit(1);
  }

  // Insert inseparable: true after "type" (or "word" if no type) before "conjugations"
  // Rebuild the object with correct field ordering
  const fields = Object.keys(entry);
  const insertAfter = fields.includes('type') ? 'type' : 'word';
  const insertIdx = fields.indexOf(insertAfter);

  const newEntry = {};
  for (let i = 0; i <= insertIdx; i++) {
    newEntry[fields[i]] = entry[fields[i]];
  }
  newEntry.inseparable = true;
  for (let i = insertIdx + 1; i < fields.length; i++) {
    newEntry[fields[i]] = entry[fields[i]];
  }

  verbbank[key] = newEntry;
  verbsTagged++;
}

writeFileSync('vocabulary/core/de/verbbank.json', JSON.stringify(verbbank, null, 2));
console.log(`AUDIT-01: Tagged ${verbsTagged} verbs with inseparable: true`);

// ── Verify count ─────────────────────────────────────────────────────────────
const verifiedVerb = JSON.parse(readFileSync('vocabulary/core/de/verbbank.json', 'utf8'));
const insepCount = Object.values(verifiedVerb).filter(v => v && v.inseparable === true).length;
const insepFalseCount = Object.values(verifiedVerb).filter(v => v && v.inseparable === false).length;
console.log('Inseparable: true count:', insepCount, '(expected: 17)');
console.log('Inseparable: false count:', insepFalseCount, '(expected: 0)');

// Check ge- stem verbs are not tagged
['geben_verb', 'gehen_verb', 'gewinnen_verb'].forEach(k => {
  if (verifiedVerb[k] && verifiedVerb[k].inseparable) {
    console.error('ERROR:', k, 'incorrectly has inseparable flag!');
    process.exit(1);
  }
});
console.log('ge- stem verbs (geben, gehen, gewinnen): correctly excluded');

if (insepCount !== 17 || insepFalseCount !== 0) {
  console.error('VERIFICATION FAILED');
  process.exit(1);
}

// ── AUDIT-02: n-Deklination noun flags ──────────────────────────────────────

const WEAK_MASCULINE_NOUN_KEYS = [
  'loewe_noun',
  'affe_noun',
  'hase_noun',
  'neffe_noun',
  'mensch_noun',
  'elefant_noun',
  'baer_noun',
  'nachbar_noun',
  'klassenkamerad_noun',
  'superheld_noun',
  'morgenmensch_noun',
];

const nounbank = JSON.parse(readFileSync('vocabulary/core/de/nounbank.json', 'utf8'));

let nounsTagged = 0;
for (const key of WEAK_MASCULINE_NOUN_KEYS) {
  const entry = nounbank[key];
  if (!entry) {
    console.error('ERROR: Key not found in nounbank:', key);
    process.exit(1);
  }

  // Insert weak_masculine: true after "genus" (or "word" if no genus) before "plural"
  const fields = Object.keys(entry);
  const insertAfter = fields.includes('genus') ? 'genus' : 'word';
  const insertIdx = fields.indexOf(insertAfter);

  const newEntry = {};
  for (let i = 0; i <= insertIdx; i++) {
    newEntry[fields[i]] = entry[fields[i]];
  }
  newEntry.weak_masculine = true;
  for (let i = insertIdx + 1; i < fields.length; i++) {
    newEntry[fields[i]] = entry[fields[i]];
  }

  nounbank[key] = newEntry;
  nounsTagged++;
}

writeFileSync('vocabulary/core/de/nounbank.json', JSON.stringify(nounbank, null, 2));
console.log(`AUDIT-02: Tagged ${nounsTagged} nouns with weak_masculine: true`);

// ── Verify count ─────────────────────────────────────────────────────────────
const verifiedNoun = JSON.parse(readFileSync('vocabulary/core/de/nounbank.json', 'utf8'));
const weakMascCount = Object.values(verifiedNoun).filter(v => v && v.weak_masculine === true).length;
console.log('weak_masculine: true count:', weakMascCount, '(expected: 11)');

if (weakMascCount !== 11) {
  console.error('VERIFICATION FAILED');
  process.exit(1);
}

console.log('\nAUDIT-01 + AUDIT-02 complete. All counts verified.');
