/**
 * Add plural forms to EN nouns.
 *
 * English doesn't have grammatical gender or definite/indefinite article
 * variation, but plural forms are important for learners.
 *
 * Usage:
 *   node scripts/enrich-en-nouns.js [--dry-run]
 */

import fs from 'fs';

// Common irregular English plurals
const EN_IRREGULAR_PLURALS = {
  man: 'men', woman: 'women', child: 'children', person: 'people',
  foot: 'feet', tooth: 'teeth', goose: 'geese', mouse: 'mice',
  louse: 'lice', ox: 'oxen', sheep: 'sheep', fish: 'fish',
  deer: 'deer', moose: 'moose', series: 'series', species: 'species',
  aircraft: 'aircraft', salmon: 'salmon', trout: 'trout',
  knife: 'knives', wife: 'wives', life: 'lives', wolf: 'wolves',
  half: 'halves', leaf: 'leaves', loaf: 'loaves', shelf: 'shelves',
  thief: 'thieves', self: 'selves', calf: 'calves', elf: 'elves',
  crisis: 'crises', analysis: 'analyses', basis: 'bases',
  thesis: 'theses', hypothesis: 'hypotheses', diagnosis: 'diagnoses',
  phenomenon: 'phenomena', criterion: 'criteria', datum: 'data',
  medium: 'media', curriculum: 'curricula', stimulus: 'stimuli',
  fungus: 'fungi', cactus: 'cacti', focus: 'foci',
  appendix: 'appendices', index: 'indices',
  radius: 'radii', alumnus: 'alumni',
};

// Uncountable nouns (no plural)
const UNCOUNTABLE = new Set([
  'music', 'information', 'news', 'furniture', 'luggage', 'baggage',
  'homework', 'knowledge', 'advice', 'weather', 'traffic', 'equipment',
  'progress', 'research', 'evidence', 'health', 'wealth', 'happiness',
  'sadness', 'darkness', 'freedom', 'childhood', 'electricity',
  'water', 'milk', 'rice', 'bread', 'butter', 'cheese', 'meat',
  'sugar', 'salt', 'flour', 'money', 'cash', 'hair', 'air',
  'rain', 'snow', 'ice', 'grass', 'sand', 'dust', 'mud',
  'blood', 'sweat', 'work', 'art', 'love', 'hate', 'fun',
  'luck', 'energy', 'power', 'strength', 'courage', 'patience',
  'clothing', 'jewelry', 'machinery', 'poetry', 'scenery',
  'soccer', 'football', 'tennis', 'golf', 'chess', 'mathematics',
  'physics', 'economics', 'politics', 'gymnastics', 'athletics',
]);

function enPlural(word) {
  const lower = word.toLowerCase();

  // Check irregular
  if (EN_IRREGULAR_PLURALS[lower]) return EN_IRREGULAR_PLURALS[lower];

  // Check uncountable
  if (UNCOUNTABLE.has(lower)) return null;

  // Rules
  if (lower.endsWith('s') || lower.endsWith('sh') || lower.endsWith('ch') || lower.endsWith('x') || lower.endsWith('z')) {
    return word + 'es';
  }
  if (lower.endsWith('y') && !/[aeiou]y$/.test(lower)) {
    return word.slice(0, -1) + 'ies';
  }
  if (lower.endsWith('f')) {
    // Some -f → -ves, but not all (roof→roofs, chief→chiefs)
    // The common ones are in irregular list, default to -fs
    return word + 's';
  }
  if (lower.endsWith('fe')) {
    return word.slice(0, -2) + 'ves';
  }
  if (lower.endsWith('o')) {
    // Some -o → -oes (potato, tomato, hero), most → -os
    const oesToEndings = ['potato', 'tomato', 'hero', 'echo', 'torpedo', 'veto', 'volcano'];
    if (oesToEndings.includes(lower)) return word + 'es';
    return word + 's';
  }

  return word + 's';
}

// ========== MAIN ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
if (dryRun) console.log('[DRY RUN]\n');

const bankPath = 'vocabulary/lexicon/en/nounbank.json';
const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
let enriched = 0, uncountable = 0, skipped = 0;

for (const [wordId, entry] of Object.entries(data)) {
  if (wordId === '_metadata') continue;
  if (entry.forms) { skipped++; continue; }

  const word = entry.word?.split(/[;,]/)[0].trim();
  if (!word || word.includes(' ')) { skipped++; continue; }

  const plural = enPlural(word);

  if (plural) {
    entry.plural = plural;
    entry.forms = {
      singular: word,
      plural: plural,
    };
    enriched++;
  } else {
    // Uncountable
    entry.forms = {
      singular: word,
      plural: null,
      uncountable: true,
    };
    uncountable++;
  }
}

console.log(`Enriched: ${enriched} with plural`);
console.log(`Uncountable: ${uncountable}`);
console.log(`Skipped: ${skipped}`);

if (!dryRun && (enriched + uncountable) > 0) {
  fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Written to ' + bankPath);
}
