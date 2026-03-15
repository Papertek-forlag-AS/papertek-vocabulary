/**
 * Comprehensive grammar enrichment for EN:
 *   1. Verb conjugations (present, past, perfect) + verb class
 *   2. Adjective comparison (comparative/superlative)
 *   3. Explanations (Norwegian grammar descriptions)
 *   4. Examples (sentence pairs EN↔NB)
 *
 * Usage:
 *   node scripts/enrich-en-grammar.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';

// ========== EN VERB CONJUGATIONS ==========

// Common irregular verbs: { infinitive: { past, participle, pres3? } }
const EN_IRREGULARS = {
  be: { past: 'was/were', part: 'been', pres: { I: 'am', you: 'are', 'he/she': 'is', we: 'are', they: 'are' }, cls: 'irregular' },
  have: { past: 'had', part: 'had', pres3: 'has', cls: 'irregular' },
  do: { past: 'did', part: 'done', pres3: 'does', cls: 'irregular' },
  go: { past: 'went', part: 'gone', pres3: 'goes', cls: 'irregular' },
  say: { past: 'said', part: 'said', cls: 'irregular' },
  get: { past: 'got', part: 'got', cls: 'irregular' },
  make: { past: 'made', part: 'made', cls: 'irregular' },
  know: { past: 'knew', part: 'known', cls: 'irregular' },
  think: { past: 'thought', part: 'thought', cls: 'irregular' },
  take: { past: 'took', part: 'taken', cls: 'irregular' },
  see: { past: 'saw', part: 'seen', cls: 'irregular' },
  come: { past: 'came', part: 'come', cls: 'irregular' },
  give: { past: 'gave', part: 'given', cls: 'irregular' },
  find: { past: 'found', part: 'found', cls: 'irregular' },
  tell: { past: 'told', part: 'told', cls: 'irregular' },
  become: { past: 'became', part: 'become', cls: 'irregular' },
  leave: { past: 'left', part: 'left', cls: 'irregular' },
  put: { past: 'put', part: 'put', cls: 'irregular' },
  mean: { past: 'meant', part: 'meant', cls: 'irregular' },
  keep: { past: 'kept', part: 'kept', cls: 'irregular' },
  let: { past: 'let', part: 'let', cls: 'irregular' },
  begin: { past: 'began', part: 'begun', cls: 'irregular' },
  show: { past: 'showed', part: 'shown', cls: 'irregular' },
  hear: { past: 'heard', part: 'heard', cls: 'irregular' },
  run: { past: 'ran', part: 'run', cls: 'irregular' },
  move: { past: 'moved', part: 'moved', cls: 'regular' },
  live: { past: 'lived', part: 'lived', cls: 'regular' },
  believe: { past: 'believed', part: 'believed', cls: 'regular' },
  bring: { past: 'brought', part: 'brought', cls: 'irregular' },
  happen: { past: 'happened', part: 'happened', cls: 'regular' },
  write: { past: 'wrote', part: 'written', cls: 'irregular' },
  sit: { past: 'sat', part: 'sat', cls: 'irregular' },
  stand: { past: 'stood', part: 'stood', cls: 'irregular' },
  lose: { past: 'lost', part: 'lost', cls: 'irregular' },
  pay: { past: 'paid', part: 'paid', cls: 'irregular' },
  meet: { past: 'met', part: 'met', cls: 'irregular' },
  include: { past: 'included', part: 'included', cls: 'regular' },
  continue: { past: 'continued', part: 'continued', cls: 'regular' },
  set: { past: 'set', part: 'set', cls: 'irregular' },
  learn: { past: 'learned', part: 'learned', cls: 'regular' },
  lead: { past: 'led', part: 'led', cls: 'irregular' },
  understand: { past: 'understood', part: 'understood', cls: 'irregular' },
  speak: { past: 'spoke', part: 'spoken', cls: 'irregular' },
  read: { past: 'read', part: 'read', cls: 'irregular' },
  spend: { past: 'spent', part: 'spent', cls: 'irregular' },
  grow: { past: 'grew', part: 'grown', cls: 'irregular' },
  win: { past: 'won', part: 'won', cls: 'irregular' },
  teach: { past: 'taught', part: 'taught', cls: 'irregular' },
  buy: { past: 'bought', part: 'bought', cls: 'irregular' },
  send: { past: 'sent', part: 'sent', cls: 'irregular' },
  fall: { past: 'fell', part: 'fallen', cls: 'irregular' },
  build: { past: 'built', part: 'built', cls: 'irregular' },
  cut: { past: 'cut', part: 'cut', cls: 'irregular' },
  drive: { past: 'drove', part: 'driven', cls: 'irregular' },
  eat: { past: 'ate', part: 'eaten', cls: 'irregular' },
  drink: { past: 'drank', part: 'drunk', cls: 'irregular' },
  sing: { past: 'sang', part: 'sung', cls: 'irregular' },
  swim: { past: 'swam', part: 'swum', cls: 'irregular' },
  fly: { past: 'flew', part: 'flown', pres3: 'flies', cls: 'irregular' },
  draw: { past: 'drew', part: 'drawn', cls: 'irregular' },
  break: { past: 'broke', part: 'broken', cls: 'irregular' },
  choose: { past: 'chose', part: 'chosen', cls: 'irregular' },
  sleep: { past: 'slept', part: 'slept', cls: 'irregular' },
  speak: { past: 'spoke', part: 'spoken', cls: 'irregular' },
  wear: { past: 'wore', part: 'worn', cls: 'irregular' },
  sell: { past: 'sold', part: 'sold', cls: 'irregular' },
  catch: { past: 'caught', part: 'caught', pres3: 'catches', cls: 'irregular' },
  throw: { past: 'threw', part: 'thrown', cls: 'irregular' },
  fight: { past: 'fought', part: 'fought', cls: 'irregular' },
  forget: { past: 'forgot', part: 'forgotten', cls: 'irregular' },
  hold: { past: 'held', part: 'held', cls: 'irregular' },
  hang: { past: 'hung', part: 'hung', cls: 'irregular' },
  hide: { past: 'hid', part: 'hidden', cls: 'irregular' },
  hit: { past: 'hit', part: 'hit', cls: 'irregular' },
  hurt: { past: 'hurt', part: 'hurt', cls: 'irregular' },
  shut: { past: 'shut', part: 'shut', cls: 'irregular' },
  steal: { past: 'stole', part: 'stolen', cls: 'irregular' },
  stick: { past: 'stuck', part: 'stuck', cls: 'irregular' },
  strike: { past: 'struck', part: 'struck', cls: 'irregular' },
  wake: { past: 'woke', part: 'woken', cls: 'irregular' },
  ride: { past: 'rode', part: 'ridden', cls: 'irregular' },
  rise: { past: 'rose', part: 'risen', cls: 'irregular' },
  shake: { past: 'shook', part: 'shaken', cls: 'irregular' },
  shine: { past: 'shone', part: 'shone', cls: 'irregular' },
  shoot: { past: 'shot', part: 'shot', cls: 'irregular' },
  blow: { past: 'blew', part: 'blown', cls: 'irregular' },
  dig: { past: 'dug', part: 'dug', cls: 'irregular' },
  lay: { past: 'laid', part: 'laid', cls: 'irregular' },
  lie: { past: 'lay', part: 'lain', cls: 'irregular' },
  seek: { past: 'sought', part: 'sought', cls: 'irregular' },
  slide: { past: 'slid', part: 'slid', cls: 'irregular' },
  spread: { past: 'spread', part: 'spread', cls: 'irregular' },
  tear: { past: 'tore', part: 'torn', cls: 'irregular' },
  feed: { past: 'fed', part: 'fed', cls: 'irregular' },
  feel: { past: 'felt', part: 'felt', cls: 'irregular' },
  freeze: { past: 'froze', part: 'frozen', cls: 'irregular' },
  light: { past: 'lit', part: 'lit', cls: 'irregular' },
  ring: { past: 'rang', part: 'rung', cls: 'irregular' },
  smell: { past: 'smelled', part: 'smelled', cls: 'regular' },
  bite: { past: 'bit', part: 'bitten', cls: 'irregular' },
  lend: { past: 'lent', part: 'lent', cls: 'irregular' },
  bend: { past: 'bent', part: 'bent', cls: 'irregular' },
};

function enPres3(word) {
  if (word.endsWith('y') && !word.endsWith('ay') && !word.endsWith('ey') && !word.endsWith('oy')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z') || word.endsWith('o')) {
    return word + 'es';
  }
  return word + 's';
}

function enPastRegular(word) {
  if (word.endsWith('e')) return word + 'd';
  if (word.endsWith('y') && !word.endsWith('ay') && !word.endsWith('ey') && !word.endsWith('oy')) {
    return word.slice(0, -1) + 'ied';
  }
  // Double final consonant for short verbs: stop→stopped, plan→planned
  if (word.match(/[aeiou][bdgmnprt]$/) && word.length <= 5) {
    return word + word[word.length - 1] + 'ed';
  }
  return word + 'ed';
}

function conjugateEnVerb(word) {
  const irr = EN_IRREGULARS[word];

  if (irr) {
    const presens = irr.pres || {
      I: word, you: word, 'he/she': irr.pres3 || enPres3(word), we: word, they: word,
    };
    return {
      conjugations: {
        present: {
          former: presens,
          feature: 'grammar_en_present',
        },
        past: {
          former: { simple: irr.past },
          feature: 'grammar_en_past',
        },
        perfect: {
          former: { participle: irr.part },
          feature: 'grammar_en_perfect',
        },
      },
      verbClass: irr.cls,
    };
  }

  // Regular verb
  const past = enPastRegular(word);
  return {
    conjugations: {
      present: {
        former: { I: word, you: word, 'he/she': enPres3(word), we: word, they: word },
        feature: 'grammar_en_present',
      },
      past: {
        former: { simple: past },
        feature: 'grammar_en_past',
      },
      perfect: {
        former: { participle: past },
        feature: 'grammar_en_perfect',
      },
    },
    verbClass: 'regular',
  };
}

// ========== EN ADJECTIVE COMPARISON ==========

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

  // Short adjectives (1 syllable, or 2 ending in -y): add -er/-est
  const isShort = !word.includes(' ') && (
    word.length <= 5 ||
    word.endsWith('y') ||
    word.endsWith('e') ||
    word.endsWith('ow') ||
    word.endsWith('er')
  );

  if (isShort) {
    let comp, sup;
    if (word.endsWith('e')) {
      comp = word + 'r';
      sup = word + 'st';
    } else if (word.endsWith('y')) {
      comp = word.slice(0, -1) + 'ier';
      sup = word.slice(0, -1) + 'iest';
    } else if (word.match(/[aeiou][bdgmnpt]$/)) {
      comp = word + word[word.length - 1] + 'er';
      sup = word + word[word.length - 1] + 'est';
    } else {
      comp = word + 'er';
      sup = word + 'est';
    }
    return { positive: word, comparative: comp, superlative: sup };
  }

  return { positive: word, comparative: 'more ' + word, superlative: 'most ' + word };
}

// ========== EXPLANATIONS & EXAMPLES ==========

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0;
  }
  return Math.abs(hash);
}

function pickTwo(templates, word) {
  const h = hashCode(word);
  const i1 = h % templates.length;
  let i2 = (h * 7 + 3) % templates.length;
  if (i2 === i1) i2 = (i1 + 1) % templates.length;
  return [
    { sentence: templates[i1][0], translation: templates[i1][1], lang: 'en' },
    { sentence: templates[i2][0], translation: templates[i2][1], lang: 'en' },
  ];
}

function enVerbExamples(word, entry, nbWord) {
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();
  const pres3 = entry.conjugations?.present?.former?.['he/she'] || enPres3(word);
  return pickTwo([
    [`I ${word} every day.`, `Jeg ${nbShort}r hver dag.`],
    [`She ${pres3} a lot.`, `Hun ${nbShort}r mye.`],
    [`Do you ${word} often?`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)}r du ofte?`],
    [`We ${word} together.`, `Vi ${nbShort}r sammen.`],
    [`He ${pres3} at home.`, `Han ${nbShort}r hjemme.`],
    [`I want to ${word}.`, `Jeg vil ${nbShort}.`],
    [`Can you ${word}?`, `Kan du ${nbShort}?`],
    [`I need to ${word}.`, `Jeg trenger å ${nbShort}.`],
    [`They ${word} well.`, `De ${nbShort}r bra.`],
    [`It is important to ${word}.`, `Det er viktig å ${nbShort}.`],
  ], word);
}

function enNounExamples(word, entry, nbWord) {
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();
  return pickTwo([
    [`The ${word} is big.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er stor.`],
    [`I have a ${word}.`, `Jeg har en ${nbShort}.`],
    [`Where is the ${word}?`, `Hvor er ${nbShort}?`],
    [`I like the ${word}.`, `Jeg liker ${nbShort}.`],
    [`I need a ${word}.`, `Jeg trenger en ${nbShort}.`],
    [`The ${word} is very nice.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er veldig fin.`],
    [`I don't have a ${word}.`, `Jeg har ikke en ${nbShort}.`],
    [`I can see a ${word}.`, `Jeg ser en ${nbShort}.`],
    [`Do you have a ${word}?`, `Har du en ${nbShort}?`],
    [`The ${word} is here.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er her.`],
  ], word);
}

function enAdjExamples(word, entry, nbWord) {
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();
  return pickTwo([
    [`The house is ${word}.`, `Huset er ${nbShort}.`],
    [`It is very ${word}.`, `Det er veldig ${nbShort}.`],
    [`It is not ${word}.`, `Det er ikke ${nbShort}.`],
    [`She is very ${word}.`, `Hun er veldig ${nbShort}.`],
    [`The food is ${word}.`, `Maten er ${nbShort}.`],
    [`It is quite ${word}.`, `Det er ganske ${nbShort}.`],
    [`Everything is ${word} here.`, `Alt er ${nbShort} her.`],
    [`It is too ${word}.`, `Det er for ${nbShort}.`],
    [`I feel ${word}.`, `Jeg føler meg ${nbShort}.`],
    [`The book is ${word}.`, `Boka er ${nbShort}.`],
  ], word);
}

function enGeneralExamples(word, entry, nbWord) {
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();
  if (entry.type === 'phrase' || entry.type === 'expr') {
    return [
      { sentence: `${word.charAt(0).toUpperCase() + word.slice(1)}.`, translation: `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)}.`, lang: 'en' },
      { sentence: `She says: "${word}".`, translation: `Hun sier: «${nbShort}».`, lang: 'en' },
    ];
  }
  if (entry.type === 'adv') {
    return pickTwo([
      [`She sings ${word}.`, `Hun synger ${nbShort}.`],
      [`He speaks ${word}.`, `Han snakker ${nbShort}.`],
      [`We eat ${word}.`, `Vi spiser ${nbShort}.`],
      [`I do it ${word}.`, `Jeg gjør det ${nbShort}.`],
      [`They walk ${word}.`, `De går ${nbShort}.`],
    ], word);
  }
  return [
    { sentence: `We use "${word}" in English.`, translation: `Vi bruker «${nbShort}» på engelsk.`, lang: 'en' },
  ];
}

function enVerbExplanation(entry) {
  const vc = entry.verbClass === 'regular' ? 'Regelmessig verb.' : entry.verbClass === 'irregular' ? 'Uregelmessig verb.' : '';
  const past = entry.conjugations?.past?.former?.simple || '';
  const part = entry.conjugations?.perfect?.former?.participle || '';
  return { _description: `Engelsk ${vc} Past: ${past}. Participle: ${part}.`.replace(/\s+/g, ' ').trim() };
}

function enNounExplanation(entry) {
  return { _description: `Engelsk substantiv: ${entry.word}.` };
}

function enAdjExplanation(entry) {
  const comp = entry.comparison;
  if (!comp) return { _description: `Engelsk adjektiv: ${entry.word}.` };
  return { _description: `Engelsk adjektiv. Komparativ: ${comp.comparative}. Superlativ: ${comp.superlative}.` };
}

function enGeneralExplanation(entry) {
  const typeNames = {
    adv: 'adverb', prep: 'preposisjon', conj: 'konjunksjon', interj: 'interjeksjon',
    pron: 'pronomen', num: 'tallord', phrase: 'frase', expr: 'uttrykk',
  };
  return { _description: `Engelsk ${typeNames[entry.type] || entry.type}: ${entry.word}.` };
}

// ========== NB TRANSLATIONS ==========

function loadNbWords() {
  const words = {};
  for (const f of fs.readdirSync('vocabulary/lexicon/nb').filter(f => f.endsWith('bank.json'))) {
    const data = JSON.parse(fs.readFileSync('vocabulary/lexicon/nb/' + f, 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata') words[k] = v.word;
    }
  }
  return words;
}

function loadLinks(from, to) {
  const links = {};
  const dir = `vocabulary/lexicon/links/${from}-${to}`;
  if (!fs.existsSync(dir)) return links;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata' && v.primary) links[k] = v.primary;
    }
  }
  return links;
}

// ========== MAIN ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (dryRun) console.log('[DRY RUN]\n');

const nbWords = loadNbWords();
const enNbLinks = loadLinks('en', 'nb');

const stats = { conj: 0, verbClass: 0, comparison: 0, explanation: 0, examples: 0 };
const bankFiles = fs.readdirSync('vocabulary/lexicon/en').filter(f => f.endsWith('bank.json'));

for (const bankFile of bankFiles) {
  const bankPath = path.join('vocabulary/lexicon/en', bankFile);
  const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  let modified = false;

  for (const [wordId, entry] of Object.entries(data)) {
    if (wordId === '_metadata') continue;

    const nbId = enNbLinks[wordId];
    const nbWord = nbId ? nbWords[nbId] : null;

    // Verb conjugations
    if (entry.type === 'verb' && !entry.conjugations) {
      const word = entry.word?.split(',')[0].trim();
      if (word && word.match(/^[a-z]/i) && !word.includes(' ')) {
        const result = conjugateEnVerb(word);
        entry.conjugations = result.conjugations;
        if (!entry.verbClass) entry.verbClass = result.verbClass;
        stats.conj++;
        modified = true;
      }
    }
    if (entry.type === 'verb' && !entry.verbClass && entry.conjugations) {
      entry.verbClass = 'regular';
      stats.verbClass++;
      modified = true;
    }

    // Adjective comparison
    if (entry.type === 'adj' && !entry.comparison) {
      const word = entry.word?.split(',')[0].trim();
      if (word && !word.includes(' ')) {
        entry.comparison = enComparison(word);
        stats.comparison++;
        modified = true;
      }
    }

    // Explanation
    if (!entry.explanation) {
      if (entry.type === 'verb') entry.explanation = enVerbExplanation(entry);
      else if (entry.type === 'noun') entry.explanation = enNounExplanation(entry);
      else if (entry.type === 'adj') entry.explanation = enAdjExplanation(entry);
      else entry.explanation = enGeneralExplanation(entry);
      stats.explanation++;
      modified = true;
    }

    // Examples
    if (!entry.examples) {
      let examples;
      if (entry.type === 'verb') examples = enVerbExamples(entry.word?.split(',')[0].trim(), entry, nbWord);
      else if (entry.type === 'noun') examples = enNounExamples(entry.word?.split(',')[0].trim(), entry, nbWord);
      else if (entry.type === 'adj') examples = enAdjExamples(entry.word?.split(',')[0].trim(), entry, nbWord);
      else examples = enGeneralExamples(entry.word, entry, nbWord);
      if (examples?.length > 0) {
        entry.examples = examples;
        stats.examples++;
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
console.log(`  Conjugations: ${stats.conj}`);
console.log(`  Verb class: ${stats.verbClass}`);
console.log(`  Comparison: ${stats.comparison}`);
console.log(`  Explanations: ${stats.explanation}`);
console.log(`  Examples: ${stats.examples}`);
