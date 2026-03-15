/**
 * Complete EN enrichment:
 *   1. CEFR levels (via EN→NB→DE chain + frequency fallback)
 *   2. Remaining verb conjugations (extract base verb from multi-word entries)
 *   3. Remaining adjective comparison gaps
 *
 * Usage:
 *   node scripts/enrich-en-complete.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';

// ========== CEFR ==========

function loadLinkIndex(dir) {
  const index = {};
  if (!fs.existsSync(dir)) return index;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata' && v.primary) index[k] = v.primary;
    }
  }
  return index;
}

function loadCefrMap() {
  const map = {};
  for (const f of fs.readdirSync('vocabulary/lexicon/de').filter(f => f.endsWith('bank.json'))) {
    const data = JSON.parse(fs.readFileSync('vocabulary/lexicon/de/' + f, 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata' && v.cefr) map[k] = v.cefr;
    }
  }
  return map;
}

function loadFreqMap() {
  const filePath = 'vocabulary/dictionary/frequency/en_50k.txt';
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
  const map = {};
  lines.forEach((line, i) => {
    const spaceIdx = line.lastIndexOf(' ');
    map[line.substring(0, spaceIdx).toLowerCase()] = i + 1;
  });
  return map;
}

function cefrFromFrequency(rank) {
  if (!rank) return 'B1';
  if (rank <= 2000) return 'A1';
  if (rank <= 6000) return 'A2';
  return 'B1';
}

// ========== VERB CONJUGATION ==========

const EN_IRREGULARS = {
  be: { past: 'was/were', part: 'been', pres: { I: 'am', you: 'are', 'he/she': 'is', we: 'are', they: 'are' }, cls: 'irregular' },
  have: { past: 'had', part: 'had', pres3: 'has', cls: 'irregular' },
  do: { past: 'did', part: 'done', pres3: 'does', cls: 'irregular' },
  go: { past: 'went', part: 'gone', pres3: 'goes', cls: 'irregular' },
  say: { past: 'said', part: 'said' }, get: { past: 'got', part: 'got' },
  make: { past: 'made', part: 'made' }, know: { past: 'knew', part: 'known' },
  think: { past: 'thought', part: 'thought' }, take: { past: 'took', part: 'taken' },
  see: { past: 'saw', part: 'seen' }, come: { past: 'came', part: 'come' },
  give: { past: 'gave', part: 'given' }, find: { past: 'found', part: 'found' },
  tell: { past: 'told', part: 'told' }, become: { past: 'became', part: 'become' },
  leave: { past: 'left', part: 'left' }, put: { past: 'put', part: 'put' },
  mean: { past: 'meant', part: 'meant' }, keep: { past: 'kept', part: 'kept' },
  let: { past: 'let', part: 'let' }, begin: { past: 'began', part: 'begun' },
  show: { past: 'showed', part: 'shown' }, hear: { past: 'heard', part: 'heard' },
  run: { past: 'ran', part: 'run' }, bring: { past: 'brought', part: 'brought' },
  write: { past: 'wrote', part: 'written' }, sit: { past: 'sat', part: 'sat' },
  stand: { past: 'stood', part: 'stood' }, lose: { past: 'lost', part: 'lost' },
  pay: { past: 'paid', part: 'paid' }, meet: { past: 'met', part: 'met' },
  set: { past: 'set', part: 'set' }, lead: { past: 'led', part: 'led' },
  understand: { past: 'understood', part: 'understood' },
  speak: { past: 'spoke', part: 'spoken' }, read: { past: 'read', part: 'read' },
  spend: { past: 'spent', part: 'spent' }, grow: { past: 'grew', part: 'grown' },
  win: { past: 'won', part: 'won' }, teach: { past: 'taught', part: 'taught' },
  buy: { past: 'bought', part: 'bought' }, send: { past: 'sent', part: 'sent' },
  fall: { past: 'fell', part: 'fallen' }, build: { past: 'built', part: 'built' },
  cut: { past: 'cut', part: 'cut' }, drive: { past: 'drove', part: 'driven' },
  eat: { past: 'ate', part: 'eaten' }, drink: { past: 'drank', part: 'drunk' },
  sing: { past: 'sang', part: 'sung' }, swim: { past: 'swam', part: 'swum' },
  fly: { past: 'flew', part: 'flown', pres3: 'flies' },
  draw: { past: 'drew', part: 'drawn' }, break: { past: 'broke', part: 'broken' },
  choose: { past: 'chose', part: 'chosen' }, sleep: { past: 'slept', part: 'slept' },
  wear: { past: 'wore', part: 'worn' }, sell: { past: 'sold', part: 'sold' },
  catch: { past: 'caught', part: 'caught', pres3: 'catches' },
  throw: { past: 'threw', part: 'thrown' }, fight: { past: 'fought', part: 'fought' },
  forget: { past: 'forgot', part: 'forgotten' }, hold: { past: 'held', part: 'held' },
  hang: { past: 'hung', part: 'hung' }, hide: { past: 'hid', part: 'hidden' },
  hit: { past: 'hit', part: 'hit' }, hurt: { past: 'hurt', part: 'hurt' },
  shut: { past: 'shut', part: 'shut' }, steal: { past: 'stole', part: 'stolen' },
  stick: { past: 'stuck', part: 'stuck' }, wake: { past: 'woke', part: 'woken' },
  ride: { past: 'rode', part: 'ridden' }, rise: { past: 'rose', part: 'risen' },
  shake: { past: 'shook', part: 'shaken' }, shoot: { past: 'shot', part: 'shot' },
  blow: { past: 'blew', part: 'blown' }, dig: { past: 'dug', part: 'dug' },
  lay: { past: 'laid', part: 'laid' }, lie: { past: 'lay', part: 'lain' },
  spread: { past: 'spread', part: 'spread' }, tear: { past: 'tore', part: 'torn' },
  feed: { past: 'fed', part: 'fed' }, feel: { past: 'felt', part: 'felt' },
  freeze: { past: 'froze', part: 'frozen' }, ring: { past: 'rang', part: 'rung' },
  bite: { past: 'bit', part: 'bitten' }, lend: { past: 'lent', part: 'lent' },
  bend: { past: 'bent', part: 'bent' }, seek: { past: 'sought', part: 'sought' },
  slide: { past: 'slid', part: 'slid' }, light: { past: 'lit', part: 'lit' },
  strike: { past: 'struck', part: 'struck' }, shine: { past: 'shone', part: 'shone' },
  swear: { past: 'swore', part: 'sworn' }, forgive: { past: 'forgave', part: 'forgiven' },
  sting: { past: 'stung', part: 'stung' }, sweep: { past: 'swept', part: 'swept' },
  sew: { past: 'sewed', part: 'sewn' }, weave: { past: 'wove', part: 'woven' },
  spin: { past: 'spun', part: 'spun' }, cling: { past: 'clung', part: 'clung' },
  creep: { past: 'crept', part: 'crept' }, deal: { past: 'dealt', part: 'dealt' },
  dream: { past: 'dreamed', part: 'dreamed' }, dwell: { past: 'dwelt', part: 'dwelt' },
  grind: { past: 'ground', part: 'ground' }, kneel: { past: 'knelt', part: 'knelt' },
  lean: { past: 'leaned', part: 'leaned' }, leap: { past: 'leaped', part: 'leaped' },
  mean: { past: 'meant', part: 'meant' }, mistake: { past: 'mistook', part: 'mistaken' },
  overcome: { past: 'overcame', part: 'overcome' },
  overtake: { past: 'overtook', part: 'overtaken' },
  prove: { past: 'proved', part: 'proven' },
  quit: { past: 'quit', part: 'quit' }, spit: { past: 'spat', part: 'spat' },
  split: { past: 'split', part: 'split' }, spring: { past: 'sprang', part: 'sprung' },
  sink: { past: 'sank', part: 'sunk' }, shrink: { past: 'shrank', part: 'shrunk' },
  stink: { past: 'stank', part: 'stunk' }, swing: { past: 'swung', part: 'swung' },
  wind: { past: 'wound', part: 'wound' }, withdraw: { past: 'withdrew', part: 'withdrawn' },
  withstand: { past: 'withstood', part: 'withstood' },
  wring: { past: 'wrung', part: 'wrung' },
};

function enPres3(word) {
  if (word.endsWith('y') && !/[aeiou]y$/.test(word)) return word.slice(0, -1) + 'ies';
  if (/(?:s|sh|ch|x|z|o)$/.test(word)) return word + 'es';
  return word + 's';
}

function enPastRegular(word) {
  if (word.endsWith('e')) return word + 'd';
  if (word.endsWith('y') && !/[aeiou]y$/.test(word)) return word.slice(0, -1) + 'ied';
  if (word.match(/[aeiou][bdgmnprt]$/) && word.length <= 5) return word + word[word.length - 1] + 'ed';
  return word + 'ed';
}

function extractBaseVerb(wordField) {
  // "accept; to agree" → "accept"
  // "agree on" → "agree"
  // "to address" → "address"
  // "above; upstairs" → null (not a verb)
  let w = wordField.split(';')[0].trim();
  w = w.replace(/^to\s+/, '');
  // Take first word
  const first = w.split(/\s+/)[0].toLowerCase();
  // Must look like a verb (not a noun/adj/etc)
  if (first.length < 2) return null;
  if (/^[a-z]+$/.test(first)) return first;
  return null;
}

function conjugateEnVerb(word) {
  const irr = EN_IRREGULARS[word];
  if (irr) {
    const presens = irr.pres || {
      I: word, you: word, 'he/she': irr.pres3 || enPres3(word), we: word, they: word,
    };
    return {
      conjugations: {
        present: { former: presens, feature: 'grammar_en_present' },
        past: { former: { simple: irr.past }, feature: 'grammar_en_past' },
        perfect: { former: { participle: irr.part }, feature: 'grammar_en_perfect' },
      },
      verbClass: 'irregular',
    };
  }
  const past = enPastRegular(word);
  return {
    conjugations: {
      present: { former: { I: word, you: word, 'he/she': enPres3(word), we: word, they: word }, feature: 'grammar_en_present' },
      past: { former: { simple: past }, feature: 'grammar_en_past' },
      perfect: { former: { participle: past }, feature: 'grammar_en_perfect' },
    },
    verbClass: 'regular',
  };
}

// ========== ADJECTIVE COMPARISON ==========

const EN_IRREGULAR_COMP = {
  good: { comparative: 'better', superlative: 'best' },
  bad: { comparative: 'worse', superlative: 'worst' },
  far: { comparative: 'farther', superlative: 'farthest' },
  little: { comparative: 'less', superlative: 'least' },
  much: { comparative: 'more', superlative: 'most' },
  many: { comparative: 'more', superlative: 'most' },
};

function enComparison(word) {
  const irr = EN_IRREGULAR_COMP[word];
  if (irr) return { positive: word, comparative: irr.comparative, superlative: irr.superlative };
  const isShort = !word.includes(' ') && (word.length <= 5 || word.endsWith('y') || word.endsWith('e') || word.endsWith('ow') || word.endsWith('er'));
  if (isShort) {
    let comp, sup;
    if (word.endsWith('e')) { comp = word + 'r'; sup = word + 'st'; }
    else if (word.endsWith('y')) { comp = word.slice(0, -1) + 'ier'; sup = word.slice(0, -1) + 'iest'; }
    else if (word.match(/[aeiou][bdgmnpt]$/)) { comp = word + word[word.length - 1] + 'er'; sup = word + word[word.length - 1] + 'est'; }
    else { comp = word + 'er'; sup = word + 'est'; }
    return { positive: word, comparative: comp, superlative: sup };
  }
  return { positive: word, comparative: 'more ' + word, superlative: 'most ' + word };
}

// ========== MAIN ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
if (dryRun) console.log('[DRY RUN]\n');

// Load chain data for CEFR
const enNbLinks = loadLinkIndex('vocabulary/lexicon/links/en-nb');
const nbDeLinks = loadLinkIndex('vocabulary/lexicon/links/nb-de');
const deCefr = loadCefrMap();
const freqMap = loadFreqMap();

const stats = { cefr: 0, cefrChain: 0, cefrFreq: 0, conj: 0, comparison: 0 };

const bankFiles = fs.readdirSync('vocabulary/lexicon/en').filter(f => f.endsWith('bank.json'));

for (const bankFile of bankFiles) {
  const bankPath = path.join('vocabulary/lexicon/en', bankFile);
  const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  let modified = false;

  for (const [wordId, entry] of Object.entries(data)) {
    if (wordId === '_metadata') continue;

    // --- CEFR ---
    if (!entry.cefr) {
      const nbId = enNbLinks[wordId];
      const deId = nbId ? nbDeLinks[nbId] : null;
      const linkedCefr = deId ? deCefr[deId] : null;

      if (linkedCefr) {
        entry.cefr = linkedCefr;
        stats.cefrChain++;
      } else {
        const word = entry.word?.toLowerCase();
        const rank = entry.frequency || (word ? freqMap[word] || freqMap[word?.split(/[;,]/)[0].trim()] : null);
        entry.cefr = cefrFromFrequency(rank);
        stats.cefrFreq++;
      }
      stats.cefr++;
      modified = true;
    }

    // --- Verb conjugations ---
    if (entry.type === 'verb' && !entry.conjugations) {
      const baseVerb = extractBaseVerb(entry.word);
      if (baseVerb) {
        const result = conjugateEnVerb(baseVerb);
        entry.conjugations = result.conjugations;
        if (!entry.verbClass) entry.verbClass = result.verbClass;
        stats.conj++;
        modified = true;
      }
    }

    // --- Adjective comparison ---
    if (entry.type === 'adj' && !entry.comparison) {
      const word = entry.word?.split(/[;,]/)[0].trim();
      if (word && !word.includes(' ')) {
        entry.comparison = enComparison(word);
        stats.comparison++;
        modified = true;
      }
    }
  }

  if (modified && !dryRun) {
    fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`  Updated ${bankFile}`);
  }
}

console.log('\n=== EN Results ===');
console.log(`  CEFR: ${stats.cefr} (${stats.cefrChain} from chain, ${stats.cefrFreq} from frequency)`);
console.log(`  Conjugations: ${stats.conj}`);
console.log(`  Comparison: ${stats.comparison}`);
