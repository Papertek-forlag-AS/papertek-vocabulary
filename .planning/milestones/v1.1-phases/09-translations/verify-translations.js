#!/usr/bin/env node
// verify-translations.js
// Phase 9: Translation verification script
// Checks entry counts, format compliance, sentence parity, false friends, and generates TRANSLATION-REVIEW.md
//
// Usage: node .planning/phases/09-translations/verify-translations.js

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../../..');

// Load files
const nb = JSON.parse(readFileSync(join(ROOT, 'vocabulary/translations/de-nb/adjectivebank.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(ROOT, 'vocabulary/translations/de-en/adjectivebank.json'), 'utf8'));
const core = JSON.parse(readFileSync(join(ROOT, 'vocabulary/core/de/adjectivebank.json'), 'utf8'));
const nbManifest = JSON.parse(readFileSync(join(ROOT, 'vocabulary/translations/de-nb/manifest.json'), 'utf8'));
const enManifest = JSON.parse(readFileSync(join(ROOT, 'vocabulary/translations/de-en/manifest.json'), 'utf8'));

const nbKeys = Object.keys(nb).filter(k => !k.startsWith('_')).sort();
const enKeys = Object.keys(en).filter(k => !k.startsWith('_')).sort();
const coreKeys = Object.keys(core).filter(k => !k.startsWith('_')).sort();

let checks = 0;
let passes = 0;
const failures = [];

function check(name, passed, details = '') {
  checks++;
  if (passed) {
    passes++;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push({ name, details });
    console.log(`  FAIL  ${name}${details ? ': ' + details : ''}`);
  }
}

// ─── CHECK 1: Entry count parity ────────────────────────────────────────────
console.log('\nCheck 1: Entry count parity');
check('nb has 365 entries', nbKeys.length === 365, `got ${nbKeys.length}`);
check('en has 365 entries', enKeys.length === 365, `got ${enKeys.length}`);
check('core has 365 entries', coreKeys.length === 365, `got ${coreKeys.length}`);

const nbSet = new Set(nbKeys);
const enSet = new Set(enKeys);
const coreSet = new Set(coreKeys);

const inCoreNotNb = coreKeys.filter(k => !nbSet.has(k));
const inNbNotCore = nbKeys.filter(k => !coreSet.has(k));
const inCoreNotEn = coreKeys.filter(k => !enSet.has(k));
const nbEnSame = JSON.stringify(nbKeys) === JSON.stringify(enKeys);

check('nb keys match core keys', inCoreNotNb.length === 0 && inNbNotCore.length === 0,
  inCoreNotNb.length ? `missing: ${inCoreNotNb.slice(0,5).join(', ')}` : '');
check('en keys match core keys', inCoreNotEn.length === 0,
  inCoreNotEn.length ? `missing: ${inCoreNotEn.slice(0,5).join(', ')}` : '');
check('nb and en have identical key sets', nbEnSame);

// ─── CHECK 2: Rich format compliance ────────────────────────────────────────
console.log('\nCheck 2: Rich format compliance');

const nbMissingTranslation = nbKeys.filter(k => typeof nb[k].translation !== 'string' || !nb[k].translation.trim());
const nbMissingExplanation = nbKeys.filter(k => !nb[k].explanation || typeof nb[k].explanation._description !== 'string');
const nbMissingSynonyms = nbKeys.filter(k => !Array.isArray(nb[k].synonyms));
const nbMissingExamples = nbKeys.filter(k => !Array.isArray(nb[k].examples) || nb[k].examples.length === 0);
const nbBadExamples = nbKeys.filter(k =>
  Array.isArray(nb[k].examples) && nb[k].examples.some(ex => !ex.sentence || !ex.translation)
);

check('nb: all have translation string', nbMissingTranslation.length === 0,
  nbMissingTranslation.slice(0,3).join(', '));
check('nb: all have explanation._description', nbMissingExplanation.length === 0,
  nbMissingExplanation.slice(0,3).join(', '));
check('nb: all have synonyms array', nbMissingSynonyms.length === 0,
  nbMissingSynonyms.slice(0,3).join(', '));
check('nb: all have examples array (>=1)', nbMissingExamples.length === 0,
  nbMissingExamples.slice(0,3).join(', '));
check('nb: all examples have sentence+translation', nbBadExamples.length === 0,
  nbBadExamples.slice(0,3).join(', '));

const enMissingTranslation = enKeys.filter(k => typeof en[k].translation !== 'string' || !en[k].translation.trim());
const enMissingExplanation = enKeys.filter(k => !en[k].explanation || typeof en[k].explanation._description !== 'string');
const enMissingSynonyms = enKeys.filter(k => !Array.isArray(en[k].synonyms));
const enMissingExamples = enKeys.filter(k => !Array.isArray(en[k].examples) || en[k].examples.length === 0);
const enBadExamples = enKeys.filter(k =>
  Array.isArray(en[k].examples) && en[k].examples.some(ex => !ex.sentence || !ex.translation)
);

check('en: all have translation string', enMissingTranslation.length === 0,
  enMissingTranslation.slice(0,3).join(', '));
check('en: all have explanation._description', enMissingExplanation.length === 0,
  enMissingExplanation.slice(0,3).join(', '));
check('en: all have synonyms array', enMissingSynonyms.length === 0,
  enMissingSynonyms.slice(0,3).join(', '));
check('en: all have examples array (>=1)', enMissingExamples.length === 0,
  enMissingExamples.slice(0,3).join(', '));
check('en: all examples have sentence+translation', enBadExamples.length === 0,
  enBadExamples.slice(0,3).join(', '));

// ─── CHECK 3: No slash translations ─────────────────────────────────────────
console.log('\nCheck 3: No slash-separated translations');
const nbSlash = nbKeys.filter(k => nb[k].translation.includes('/'));
const enSlash = enKeys.filter(k => en[k].translation.includes('/'));
check('nb: 0 slash translations', nbSlash.length === 0, nbSlash.join(', '));
check('en: 0 slash translations', enSlash.length === 0, enSlash.join(', '));

// ─── CHECK 4: Sentence parity ───────────────────────────────────────────────
console.log('\nCheck 4: Sentence parity (identical German sentences in nb and en)');
const sentenceMismatches = [];
for (const key of nbKeys) {
  if (!en[key]) continue;
  const nbExamples = nb[key].examples || [];
  const enExamples = en[key].examples || [];
  const minLen = Math.min(nbExamples.length, enExamples.length);
  for (let i = 0; i < minLen; i++) {
    if (nbExamples[i].sentence !== enExamples[i].sentence) {
      sentenceMismatches.push(`${key}[${i}]: nb="${nbExamples[i].sentence}" vs en="${enExamples[i].sentence}"`);
    }
  }
}
check('German sentences identical in nb and en examples', sentenceMismatches.length === 0,
  sentenceMismatches.length ? `${sentenceMismatches.length} mismatches: ${sentenceMismatches.slice(0,2).join('; ')}` : '');

// ─── CHECK 5: alternativeMeanings format ────────────────────────────────────
console.log('\nCheck 5: alternativeMeanings format');
const altMeaningsFormatErrors = [];
for (const key of nbKeys) {
  if (!nb[key].alternativeMeanings) continue;
  if (!Array.isArray(nb[key].alternativeMeanings)) {
    altMeaningsFormatErrors.push(`${key}: not an array`);
    continue;
  }
  for (const item of nb[key].alternativeMeanings) {
    if (typeof item !== 'object' || typeof item.meaning !== 'string' || typeof item.context !== 'string') {
      altMeaningsFormatErrors.push(`${key}: item missing meaning/context strings`);
    }
  }
}
for (const key of enKeys) {
  if (!en[key].alternativeMeanings) continue;
  if (!Array.isArray(en[key].alternativeMeanings)) {
    altMeaningsFormatErrors.push(`en:${key}: not an array`);
    continue;
  }
  for (const item of en[key].alternativeMeanings) {
    if (typeof item !== 'object' || typeof item.meaning !== 'string' || typeof item.context !== 'string') {
      altMeaningsFormatErrors.push(`en:${key}: item missing meaning/context strings`);
    }
  }
}
check('alternativeMeanings format valid (meaning+context strings)', altMeaningsFormatErrors.length === 0,
  altMeaningsFormatErrors.slice(0,3).join(', '));

// ─── CHECK 6: Manifest accuracy ─────────────────────────────────────────────
console.log('\nCheck 6: Manifest accuracy');
check('nb manifest adjectivebank count = 365',
  nbManifest._metadata.files['adjectivebank.json'] === 365,
  `got ${nbManifest._metadata.files['adjectivebank.json']}`);
check('en manifest adjectivebank count = 365',
  enManifest._metadata.files['adjectivebank.json'] === 365,
  `got ${enManifest._metadata.files['adjectivebank.json']}`);
check('nb manifest totalWords = 1129',
  nbManifest._metadata.totalWords === 1129,
  `got ${nbManifest._metadata.totalWords}`);
check('en manifest totalWords = 1129',
  enManifest._metadata.totalWords === 1129,
  `got ${enManifest._metadata.totalWords}`);

// ─── CHECK 7: False friend spot-checks ──────────────────────────────────────
console.log('\nCheck 7: False friend spot-checks');
const falseFriendChecks = [
  { id: 'arm_adj', forbidden: ['arm'], expected: 'fattig', desc: 'arm (poor) != arm (body part)' },
  { id: 'fest_adj', forbidden: ['fest'], expected: 'fast', desc: 'fest (solid/fixed) != fest (party)' },
  { id: 'brav_adj', forbidden: ['modig', 'tapper'], expected: 'snill', desc: 'brav (well-behaved) != modig/tapper (brave)' },
  { id: 'rein_adj', forbidden: ['rein'], expected: 'ren', desc: 'rein (pure/clean) != rein (reindeer)' },
  { id: 'eventuell_adj', forbidden: ['eventuelt'], expected: 'muligens', desc: 'eventuell (possibly) != eventuelt (in that case)' },
];

for (const ff of falseFriendChecks) {
  const entry = nb[ff.id];
  if (!entry) {
    check(`False friend: ${ff.id} exists`, false, 'missing from nb');
    continue;
  }
  const translation = entry.translation.toLowerCase();
  const hasForbidden = ff.forbidden.some(f => translation === f || translation.startsWith(f + ' '));
  check(`False friend: ${ff.id} not translated as ${ff.forbidden.join('/')} (${ff.desc})`,
    !hasForbidden, `got "${entry.translation}"`);
}

// ─── CHECK 8: Summary ────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────');
console.log(`RESULT: ${passes}/${checks} checks passed, ${failures.length} failures`);

if (failures.length > 0) {
  console.log('\nFailed checks:');
  failures.forEach(f => console.log(`  - ${f.name}${f.details ? ': ' + f.details : ''}`));
}

// ─── Generate TRANSLATION-REVIEW.md ─────────────────────────────────────────
console.log('\nGenerating TRANSLATION-REVIEW.md...');

const withAltMeanings = nbKeys.filter(k => nb[k].alternativeMeanings && nb[k].alternativeMeanings.length > 0);
const exampleCounts = { '1': 0, '2': 0, '3+': 0 };
nbKeys.forEach(k => {
  const n = (nb[k].examples || []).length;
  if (n >= 3) exampleCounts['3+']++;
  else if (n === 2) exampleCounts['2']++;
  else exampleCounts['1']++;
});

// False friends table data
const falseFriendsTable = [
  { id: 'arm_adj', german: 'arm', germanMeaning: 'poor, destitute', norwegianFalseFriend: 'arm (body part)', correctNb: nb['arm_adj']?.translation || 'N/A', riskLevel: 'High' },
  { id: 'fest_adj', german: 'fest', germanMeaning: 'firm, solid, fixed', norwegianFalseFriend: 'fest (party)', correctNb: nb['fest_adj']?.translation || 'N/A', riskLevel: 'High' },
  { id: 'brav_adj', german: 'brav', germanMeaning: 'well-behaved, obedient', norwegianFalseFriend: 'modig/tapper (brave/courageous)', correctNb: nb['brav_adj']?.translation || 'N/A', riskLevel: 'High' },
  { id: 'rein_adj', german: 'rein', germanMeaning: 'pure, clean', norwegianFalseFriend: 'rein (reindeer)', correctNb: nb['rein_adj']?.translation || 'N/A', riskLevel: 'High' },
  { id: 'eventuell_adj', german: 'eventuell', germanMeaning: 'possibly, perhaps', norwegianFalseFriend: 'eventuelt (in that case/if so)', correctNb: nb['eventuell_adj']?.translation || 'N/A', riskLevel: 'High' },
  { id: 'aktuell_adj', german: 'aktuell', germanMeaning: 'current, topical', norwegianFalseFriend: 'aktuell (relevant)', correctNb: nb['aktuell_adj']?.translation || 'N/A', riskLevel: 'Medium' },
  { id: 'genial_adj', german: 'genial', germanMeaning: 'brilliant, inspired', norwegianFalseFriend: 'genial (genial/good-natured)', correctNb: nb['genial_adj']?.translation || 'N/A', riskLevel: 'Medium' },
  { id: 'simpel_adj', german: 'simpel', germanMeaning: 'simple, plain', norwegianFalseFriend: 'simpel (mean/vulgar in nb)', correctNb: nb['simpel_adj']?.translation || 'N/A', riskLevel: 'Medium' },
];

// Nuanced entries (subjective choices worth human review)
const nuancedEntries = [
  { id: 'spaet_adj', nbTrans: nb['spaet_adj']?.translation, enTrans: en['spaet_adj']?.translation, reason: 'Time-relative adverb often used as adjective; context-dependent' },
  { id: 'frueh_adj', nbTrans: nb['frueh_adj']?.translation, enTrans: en['frueh_adj']?.translation, reason: 'Time-relative; "tidlig" is correct but "for tidlig" is also common' },
  { id: 'streng_adj', nbTrans: nb['streng_adj']?.translation, enTrans: en['streng_adj']?.translation, reason: 'Connotation varies: strict teacher vs strict diet vs strict rules' },
  { id: 'krank_adj', nbTrans: nb['krank_adj']?.translation, enTrans: en['krank_adj']?.translation, reason: 'False partial cognate: Norwegian "krank" is archaic; "syk" is correct' },
  { id: 'wild_adj', nbTrans: nb['wild_adj']?.translation, enTrans: en['wild_adj']?.translation, reason: 'Multiple senses: wild animal, wild party, wild enthusiasm — context matters' },
  { id: 'scharf_adj', nbTrans: nb['scharf_adj']?.translation, enTrans: en['scharf_adj']?.translation, reason: 'Very polysemous: sharp knife, spicy food, sharp-looking (attractive)' },
  { id: 'faul_adj', nbTrans: nb['faul_adj']?.translation, enTrans: en['faul_adj']?.translation, reason: 'Two senses: lazy (person) and rotten (food) — very different contexts' },
  { id: 'schwer_adj', nbTrans: nb['schwer_adj']?.translation, enTrans: en['schwer_adj']?.translation, reason: 'Heavy (physical) vs difficult (metaphorical) — both common' },
  { id: 'leicht_adj', nbTrans: nb['leicht_adj']?.translation, enTrans: en['leicht_adj']?.translation, reason: 'Light (physical) vs easy (metaphorical) — mirror of schwer' },
  { id: 'hart_adj', nbTrans: nb['hart_adj']?.translation, enTrans: en['hart_adj']?.translation, reason: 'Hard (physical), hard (difficult), harsh (person) — context-dependent' },
];

const reviewDate = new Date().toISOString().split('T')[0];

const reviewContent = `# Translation Review Report — Phase 9 (German Adjectives)

**Generated:** ${reviewDate}
**Scope:** de-nb and de-en adjectivebank.json (365 entries each)
**Purpose:** Human spot-check guide for translation quality, false friend accuracy, and polysemy handling

---

## How to Use This Report

1. **False Friends table** — highest priority. Verify these manually in the final JSON files.
2. **Multi-meaning entries** — review \`alternativeMeanings\` for accuracy and completeness.
3. **Nuanced entries** — spot-check these translations for register and context appropriateness.
4. **Run verify-translations.js** to confirm all automated checks still pass after any edits.

---

## 1. False Friends (German-Norwegian)

German-Norwegian false friends where the German adjective looks identical or similar to a Norwegian word but has a different meaning. These are the highest-risk entries for incorrect translations.

| _id | German Word | German Meaning | Norwegian False Friend | Correct nb Translation | Risk |
|-----|-------------|----------------|------------------------|------------------------|------|
${falseFriendsTable.map(ff =>
  `| \`${ff.id}\` | ${ff.german} | ${ff.germanMeaning} | ${ff.norwegianFalseFriend} | ${ff.correctNb} | ${ff.riskLevel} |`
).join('\n')}

### Verification Commands

Check each false friend in the actual file:
\`\`\`bash
node -e "
const nb = JSON.parse(require('fs').readFileSync('vocabulary/translations/de-nb/adjectivebank.json','utf8'));
['arm_adj','fest_adj','brav_adj','rein_adj','eventuell_adj','aktuell_adj','genial_adj','simpel_adj'].forEach(k => {
  console.log(k + ':', nb[k] ? nb[k].translation : 'MISSING');
});
"
\`\`\`

---

## 2. Multi-Meaning Entries (alternativeMeanings)

Entries where the German adjective has genuinely distinct secondary senses beyond the primary translation. All ${withAltMeanings.length} entries listed below use the \`alternativeMeanings\` field.

| _id | Primary nb | Primary en | Secondary Meanings (from alternativeMeanings) | Count |
|-----|-----------|------------|----------------------------------------------|-------|
${withAltMeanings.map(k => {
  const altMeanings = nb[k].alternativeMeanings || [];
  const altSummary = altMeanings.map(m => `"${m.meaning}" (${m.context})`).join('; ');
  return `| \`${k}\` | ${nb[k].translation} | ${en[k]?.translation || 'N/A'} | ${altSummary} | ${altMeanings.length} |`;
}).join('\n')}

### Review Notes for alternativeMeanings

- Each entry should have a clear usage context that distinguishes it from the primary meaning
- The \`context\` field should be short (2-5 words): "cooking", "figurative use", "technical", etc.
- If a secondary meaning is just a synonym, remove it from alternativeMeanings (it belongs in synonyms)

---

## 3. Nuanced/Review-Recommended Entries

Entries where the translation choice is context-dependent, has register implications, or reflects a judgment call that a native speaker should verify.

| _id | nb Translation | en Translation | Review Reason |
|-----|---------------|----------------|---------------|
${nuancedEntries.map(e =>
  `| \`${e.id}\` | ${e.nbTrans || 'N/A'} | ${e.enTrans || 'N/A'} | ${e.reason} |`
).join('\n')}

---

## 4. Statistics

| Metric | Count |
|--------|-------|
| Total entries (nb) | ${nbKeys.length} |
| Total entries (en) | ${enKeys.length} |
| Entries with alternativeMeanings | ${withAltMeanings.length} |
| Entries with 1 example | ${exampleCounts['1']} |
| Entries with 2 examples | ${exampleCounts['2']} |
| Entries with 3+ examples | ${exampleCounts['3+']} |
| False friends documented | ${falseFriendsTable.length} |
| Nuanced entries flagged | ${nuancedEntries.length} |
| Slash translations remaining | ${nbSlash.length} |
| Automated check failures | ${failures.length} |

---

## 5. Automated Verification Summary

Run: \`node .planning/phases/09-translations/verify-translations.js\`

**Status at generation time:** ${failures.length === 0 ? 'ALL CHECKS PASSED' : failures.length + ' FAILURES'}
${failures.length > 0 ? '\nFailed checks:\n' + failures.map(f => `- ${f.name}: ${f.details}`).join('\n') : ''}

---

*Report generated by verify-translations.js on ${reviewDate}*
`;

writeFileSync(join(__dirname, 'TRANSLATION-REVIEW.md'), reviewContent, 'utf8');
console.log('Generated TRANSLATION-REVIEW.md');

if (failures.length > 0) {
  console.log('\nERROR: Verification failed. Fix issues before proceeding.');
  process.exit(1);
} else {
  console.log('\nAll checks passed. Translation files are ready for production.');
}
