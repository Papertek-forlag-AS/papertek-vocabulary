/**
 * enrich-en-lexicon.js
 *
 * Enriches English lexicon entries with grammar data:
 *   - Verb conjugations (present, past, perfect)
 *   - Adjective comparison (comparative, superlative)
 *
 * Usage:
 *   node scripts/enrich-en-lexicon.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const EN_BASE = join('vocabulary', 'lexicon', 'en');

// ═══════════════════════════════════════════════════════════════════════════
// ENGLISH IRREGULAR VERBS
// ═══════════════════════════════════════════════════════════════════════════

const IRREGULAR_VERBS = {
  'be': { s: 'is', past: 'was', pp: 'been', pres: { 'I': 'am', 'you': 'are', 'he/she': 'is', 'we': 'are', 'they': 'are' } },
  'have': { s: 'has', past: 'had', pp: 'had' },
  'do': { s: 'does', past: 'did', pp: 'done' },
  'go': { s: 'goes', past: 'went', pp: 'gone' },
  'say': { past: 'said', pp: 'said' },
  'get': { past: 'got', pp: 'got' },
  'make': { past: 'made', pp: 'made' },
  'know': { past: 'knew', pp: 'known' },
  'think': { past: 'thought', pp: 'thought' },
  'take': { past: 'took', pp: 'taken' },
  'see': { past: 'saw', pp: 'seen' },
  'come': { past: 'came', pp: 'come' },
  'find': { past: 'found', pp: 'found' },
  'give': { past: 'gave', pp: 'given' },
  'tell': { past: 'told', pp: 'told' },
  'become': { past: 'became', pp: 'become' },
  'leave': { past: 'left', pp: 'left' },
  'put': { past: 'put', pp: 'put' },
  'mean': { past: 'meant', pp: 'meant' },
  'keep': { past: 'kept', pp: 'kept' },
  'let': { past: 'let', pp: 'let' },
  'begin': { past: 'began', pp: 'begun' },
  'show': { past: 'showed', pp: 'shown' },
  'hear': { past: 'heard', pp: 'heard' },
  'run': { past: 'ran', pp: 'run', pres_part: 'running' },
  'hold': { past: 'held', pp: 'held' },
  'bring': { past: 'brought', pp: 'brought' },
  'write': { past: 'wrote', pp: 'written' },
  'sit': { past: 'sat', pp: 'sat', pres_part: 'sitting' },
  'stand': { past: 'stood', pp: 'stood' },
  'lose': { past: 'lost', pp: 'lost' },
  'pay': { past: 'paid', pp: 'paid' },
  'meet': { past: 'met', pp: 'met' },
  'feel': { past: 'felt', pp: 'felt' },
  'send': { past: 'sent', pp: 'sent' },
  'fall': { past: 'fell', pp: 'fallen' },
  'read': { past: 'read', pp: 'read' },
  'spend': { past: 'spent', pp: 'spent' },
  'grow': { past: 'grew', pp: 'grown' },
  'win': { past: 'won', pp: 'won', pres_part: 'winning' },
  'teach': { past: 'taught', pp: 'taught' },
  'buy': { past: 'bought', pp: 'bought' },
  'lead': { past: 'led', pp: 'led' },
  'speak': { past: 'spoke', pp: 'spoken' },
  'understand': { past: 'understood', pp: 'understood' },
  'catch': { past: 'caught', pp: 'caught' },
  'set': { past: 'set', pp: 'set' },
  'choose': { past: 'chose', pp: 'chosen' },
  'draw': { past: 'drew', pp: 'drawn' },
  'break': { past: 'broke', pp: 'broken' },
  'build': { past: 'built', pp: 'built' },
  'drive': { past: 'drove', pp: 'driven' },
  'cut': { past: 'cut', pp: 'cut' },
  'eat': { past: 'ate', pp: 'eaten' },
  'sing': { past: 'sang', pp: 'sung', pres_part: 'singing' },
  'drink': { past: 'drank', pp: 'drunk' },
  'fly': { s: 'flies', past: 'flew', pp: 'flown' },
  'sleep': { past: 'slept', pp: 'slept' },
  'swim': { past: 'swam', pp: 'swum', pres_part: 'swimming' },
  'ride': { past: 'rode', pp: 'ridden' },
  'throw': { past: 'threw', pp: 'thrown' },
  'wear': { past: 'wore', pp: 'worn' },
  'hide': { past: 'hid', pp: 'hidden' },
  'fight': { past: 'fought', pp: 'fought' },
  'shoot': { past: 'shot', pp: 'shot' },
  'sell': { past: 'sold', pp: 'sold' },
  'beat': { past: 'beat', pp: 'beaten' },
  'blow': { past: 'blew', pp: 'blown' },
  'lie': { past: 'lay', pp: 'lain', pres_part: 'lying' },
  'steal': { past: 'stole', pp: 'stolen' },
  'hang': { past: 'hung', pp: 'hung' },
  'shake': { past: 'shook', pp: 'shaken' },
  'forget': { past: 'forgot', pp: 'forgotten', pres_part: 'forgetting' },
  'rise': { past: 'rose', pp: 'risen' },
  'bite': { past: 'bit', pp: 'bitten' },
  'tear': { past: 'tore', pp: 'torn' },
  'ring': { past: 'rang', pp: 'rung', pres_part: 'ringing' },
  'dig': { past: 'dug', pp: 'dug', pres_part: 'digging' },
  'freeze': { past: 'froze', pp: 'frozen' },
  'wake': { past: 'woke', pp: 'woken' },
  'bend': { past: 'bent', pp: 'bent' },
  'lend': { past: 'lent', pp: 'lent' },
  'shine': { past: 'shone', pp: 'shone' },
  'strike': { past: 'struck', pp: 'struck' },
  'spread': { past: 'spread', pp: 'spread' },
  'burst': { past: 'burst', pp: 'burst' },
  'hurt': { past: 'hurt', pp: 'hurt' },
  'shut': { past: 'shut', pp: 'shut' },
  'cost': { past: 'cost', pp: 'cost' },
  'quit': { past: 'quit', pp: 'quit' },
  'split': { past: 'split', pp: 'split' },
  'stick': { past: 'stuck', pp: 'stuck' },
  'swing': { past: 'swung', pp: 'swung' },
  'sink': { past: 'sank', pp: 'sunk' },
  'bet': { past: 'bet', pp: 'bet' },
  'seek': { past: 'sought', pp: 'sought' },
  'sweep': { past: 'swept', pp: 'swept' },
  'spin': { past: 'spun', pp: 'spun', pres_part: 'spinning' },
  'forgive': { past: 'forgave', pp: 'forgiven' },
  'slide': { past: 'slid', pp: 'slid' },
  'bleed': { past: 'bled', pp: 'bled' },
  'feed': { past: 'fed', pp: 'fed' },
  'swear': { past: 'swore', pp: 'sworn' },
  'weave': { past: 'wove', pp: 'woven' },
  'bind': { past: 'bound', pp: 'bound' },
  'creep': { past: 'crept', pp: 'crept' },
  'deal': { past: 'dealt', pp: 'dealt' },
  'dream': { past: 'dreamt', pp: 'dreamt' },
  'lean': { past: 'leant', pp: 'leant' },
  'leap': { past: 'leapt', pp: 'leapt' },
  'learn': { past: 'learnt', pp: 'learnt' },
  'smell': { past: 'smelt', pp: 'smelt' },
  'spell': { past: 'spelt', pp: 'spelt' },
  'spill': { past: 'spilt', pp: 'spilt' },
  'spoil': { past: 'spoilt', pp: 'spoilt' },
  'burn': { past: 'burnt', pp: 'burnt' },
  'kneel': { past: 'knelt', pp: 'knelt' },
  'sew': { past: 'sewed', pp: 'sewn' },
  'weigh': { past: 'weighed', pp: 'weighed' },
  'light': { past: 'lit', pp: 'lit' },
  'spring': { past: 'sprang', pp: 'sprung' },
  'stink': { past: 'stank', pp: 'stunk' },
  'cling': { past: 'clung', pp: 'clung' },
  'withdraw': { past: 'withdrew', pp: 'withdrawn' },
  'overcome': { past: 'overcame', pp: 'overcome' },
  'undergo': { past: 'underwent', pp: 'undergone' },
  'forbid': { past: 'forbade', pp: 'forbidden' },
  'arise': { past: 'arose', pp: 'arisen' },
  'awake': { past: 'awoke', pp: 'awoken' },
  'dare': { past: 'dared', pp: 'dared' },
  'lay': { past: 'laid', pp: 'laid' },
  'may': { past: 'might', pp: '-', s: 'may' },
  'can': { past: 'could', pp: '-', s: 'can' },
  'must': { past: 'must', pp: '-', s: 'must' },
  'shall': { past: 'should', pp: '-', s: 'shall' },
  'will': { past: 'would', pp: '-', s: 'will' },
};

function getThirdPerson(word, irr) {
  if (irr?.s) return irr.s;
  if (word.endsWith('sh') || word.endsWith('ch') || word.endsWith('ss') || word.endsWith('x') || word.endsWith('zz') || word.endsWith('o')) {
    return word + 'es';
  }
  if (word.endsWith('y') && !word.match(/[aeiou]y$/)) {
    return word.slice(0, -1) + 'ies';
  }
  return word + 's';
}

function getPresentParticiple(word, irr) {
  if (irr?.pres_part) return irr.pres_part;
  if (word.endsWith('ie')) return word.slice(0, -2) + 'ying';
  if (word.endsWith('e') && !word.endsWith('ee')) return word.slice(0, -1) + 'ing';
  // Double final consonant for short verbs
  if (word.match(/[^aeiou][aeiou][bcdfghlmnprst]$/) && word.length <= 4) {
    return word + word.slice(-1) + 'ing';
  }
  return word + 'ing';
}

function getRegularPast(word) {
  if (word.endsWith('e')) return word + 'd';
  if (word.endsWith('y') && !word.match(/[aeiou]y$/)) {
    return word.slice(0, -1) + 'ied';
  }
  // Double final consonant for short verbs
  if (word.match(/[^aeiou][aeiou][bcdfghlmnprst]$/) && word.length <= 4) {
    return word + word.slice(-1) + 'ed';
  }
  return word + 'ed';
}

function enrichVerb(word) {
  const w = word.toLowerCase();
  const irr = IRREGULAR_VERBS[w];

  const past = irr?.past || getRegularPast(w);
  const pp = irr?.pp || past;
  const thirdPerson = getThirdPerson(w, irr);
  const presPart = getPresentParticiple(w, irr);

  const isIrregular = !!irr && past !== getRegularPast(w);

  const conjugations = {
    present: {
      former: irr?.pres || {
        'I': w,
        'you': w,
        'he/she': thirdPerson,
        'we': w,
        'they': w,
      },
      feature: 'grammar_en_present',
    },
    past: {
      former: { simple: past },
      feature: 'grammar_en_past',
    },
    perfect: {
      participle: pp,
      present_participle: presPart,
      feature: 'grammar_en_perfect',
    },
  };

  return {
    conjugations,
    verbClass: isIrregular ? 'irregular' : 'regular',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ENGLISH IRREGULAR ADJECTIVE COMPARISON
// ═══════════════════════════════════════════════════════════════════════════

const IRREGULAR_ADJECTIVES = {
  'good': { comparative: 'better', superlative: 'best' },
  'bad': { comparative: 'worse', superlative: 'worst' },
  'far': { comparative: 'farther', superlative: 'farthest' },
  'little': { comparative: 'less', superlative: 'least' },
  'much': { comparative: 'more', superlative: 'most' },
  'many': { comparative: 'more', superlative: 'most' },
  'old': { comparative: 'older', superlative: 'oldest' },
  'late': { comparative: 'later', superlative: 'latest' },
};

function enrichAdjective(word) {
  const w = word.toLowerCase();

  if (IRREGULAR_ADJECTIVES[w]) {
    return { comparison: { positive: w, ...IRREGULAR_ADJECTIVES[w] } };
  }

  // Long adjectives (3+ syllables, or 2+ ending in specific suffixes) use more/most
  const usesMoreMost = w.length > 7 ||
    w.endsWith('ful') || w.endsWith('less') || w.endsWith('ous') ||
    w.endsWith('ive') || w.endsWith('ing') || w.endsWith('ed') ||
    w.endsWith('ent') || w.endsWith('ant') || w.endsWith('ible') ||
    w.endsWith('able') || w.endsWith('ical') || w.endsWith('ular');

  if (usesMoreMost) {
    return {
      comparison: { positive: w, comparative: `more ${w}`, superlative: `most ${w}` },
    };
  }

  // Short adjectives: -er/-est
  let comparative, superlative;
  if (w.endsWith('e')) {
    comparative = w + 'r';
    superlative = w + 'st';
  } else if (w.endsWith('y') && !w.match(/[aeiou]y$/)) {
    comparative = w.slice(0, -1) + 'ier';
    superlative = w.slice(0, -1) + 'iest';
  } else if (w.match(/[^aeiou][aeiou][bcdfghlmnprst]$/) && w.length <= 4) {
    comparative = w + w.slice(-1) + 'er';
    superlative = w + w.slice(-1) + 'est';
  } else {
    comparative = w + 'er';
    superlative = w + 'est';
  }

  return { comparison: { positive: w, comparative, superlative } };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('Enriching English lexicon with grammar data...\n');

// ─── Enrich verbs ────────────────────────────────────────────────────────

const verbPath = join(EN_BASE, 'verbbank.json');
const verbData = JSON.parse(readFileSync(verbPath, 'utf8'));
const { _metadata: verbMeta, ...verbs } = verbData;

let verbEnriched = 0, verbSkipped = 0;

for (const [id, entry] of Object.entries(verbs)) {
  const w = entry.word;

  // Skip multi-word phrases and non-verb entries
  if (w.includes(' ') || w.includes(';') || w.length < 2) {
    verbSkipped++;
    continue;
  }

  try {
    const enrichment = enrichVerb(w);
    entry.conjugations = enrichment.conjugations;
    entry.verbClass = enrichment.verbClass;
    entry._enriched = true;
    verbEnriched++;
  } catch (e) {
    verbSkipped++;
  }
}

writeFileSync(verbPath, JSON.stringify({ _metadata: verbMeta, ...verbs }, null, 2) + '\n');
console.log(`  Verbs: ${verbEnriched} enriched, ${verbSkipped} skipped`);

// ─── Enrich adjectives ──────────────────────────────────────────────────

const adjPath = join(EN_BASE, 'adjectivebank.json');
const adjData = JSON.parse(readFileSync(adjPath, 'utf8'));
const { _metadata: adjMeta, ...adjs } = adjData;

let adjEnriched = 0, adjSkipped = 0;

for (const [id, entry] of Object.entries(adjs)) {
  const w = entry.word;

  if (w.includes(' ') || w.includes(';') || w.length < 2) {
    adjSkipped++;
    continue;
  }

  try {
    const enrichment = enrichAdjective(w);
    entry.comparison = enrichment.comparison;
    entry._enriched = true;
    adjEnriched++;
  } catch (e) {
    adjSkipped++;
  }
}

writeFileSync(adjPath, JSON.stringify({ _metadata: adjMeta, ...adjs }, null, 2) + '\n');
console.log(`  Adjectives: ${adjEnriched} enriched, ${adjSkipped} skipped`);

// ─── Update manifest ────────────────────────────────────────────────────

const manifestPath = join(EN_BASE, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.summary.enrichedWords = verbEnriched + adjEnriched;
manifest._metadata.generatedAt = new Date().toISOString();
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`\n=== Summary ===`);
console.log(`  Total enriched: ${verbEnriched + adjEnriched}`);
console.log(`  Verbs: ${verbEnriched} (${Object.keys(IRREGULAR_VERBS).length} irregular patterns)`);
console.log(`  Adjectives: ${adjEnriched}`);
