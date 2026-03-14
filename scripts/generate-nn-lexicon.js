/**
 * generate-nn-lexicon.js
 *
 * Phase 8 of the two-way dictionary: generates Norwegian Nynorsk (NN)
 * lexicon entries by transforming the existing Bokmål (NB) lexicon.
 *
 * Since there are no de-nn/es-nn translation files, the NN lexicon is
 * derived from NB using systematic linguistic transformation rules:
 *   - Lexical replacements (completely different words: noe→noko, ikke→ikkje)
 *   - Spelling rules (hv-→kv-, -lig→-leg, etc.)
 *   - Noun morphology (NN-specific declension: -ar/-ane plurals, -a neuter def pl)
 *   - Verb morphology (a-infinitive for weak verbs, -ar present tense)
 *   - Adjective morphology (similar to NB with minor differences)
 *
 * Produces a mapping file (nb-to-nn-map.json) for link generation.
 *
 * Usage:
 *   node scripts/generate-nn-lexicon.js
 *
 * Output:
 *   vocabulary/lexicon/nn/nounbank.json
 *   vocabulary/lexicon/nn/verbbank.json
 *   vocabulary/lexicon/nn/adjectivebank.json
 *   vocabulary/lexicon/nn/generalbank.json
 *   vocabulary/lexicon/nn/manifest.json
 *   vocabulary/lexicon/nn/nb-to-nn-map.json  (for link generation)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LEXICON_BASE = join('vocabulary', 'lexicon');
const NB_BASE = join(LEXICON_BASE, 'nb');
const NN_BASE = join(LEXICON_BASE, 'nn');

// ═══════════════════════════════════════════════════════════════════════════
// LEXICAL REPLACEMENTS — words that are completely different in NN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map of NB words → NN equivalents.
 * These are words where a systematic rule won't produce the right NN form.
 */
const LEXICAL_REPLACEMENTS = {
  // Pronouns & determiners
  'noe': 'noko',
  'noen': 'nokon',
  'annet': 'anna',
  'annen': 'annan',
  'andre': 'andre',
  'hennes': 'hennar',
  'deres': 'deira',
  'dem': 'dei',
  'de': 'dei',
  'hverandre': 'kvarandre',
  'seg': 'seg',

  // Question words — must be lexical, NOT hv→kv regex
  'hva': 'kva',
  'hvem': 'kven',
  'hvor': 'kvar',
  'hvordan': 'korleis',
  'hvorfor': 'kvifor',
  'hvilken': 'kva for ein',
  'hvilket': 'kva for eit',
  'hvilke': 'kva for',
  'hvis': 'viss',
  'hver': 'kvar',
  'hvert': 'kvart',

  // Adverbs
  'ikke': 'ikkje',
  'også': 'òg',
  'bare': 'berre',
  'mye': 'mykje',
  'nå': 'no',
  'allerede': 'allereie',
  'igjen': 'att',
  'fremdeles': 'framleis',
  'hjemme': 'heime',
  'hjemmefra': 'heimanfrå',
  'hjem': 'heim',
  'veldig': 'veldig',
  'alltid': 'alltid',
  'aldri': 'aldri',
  'ennå': 'enno',
  'kanskje': 'kanskje',
  'ganske': 'ganske',
  'plutselig': 'brått',
  'sammen': 'saman',
  'borte': 'borte',
  'enda': 'endå',
  'dessuten': 'dessutan',
  'iallfall': 'i alle fall',
  'selvfølgelig': 'sjølvsagt',
  'deretter': 'deretter',
  'nedenfor': 'nedanfor',
  'ovenfor': 'ovanfor',
  'utenfor': 'utanfor',
  'innenfor': 'innanfor',

  // Prepositions
  'etter': 'etter',
  'mellom': 'mellom',
  'gjennom': 'gjennom',

  // Conjunctions
  'eller': 'eller',
  'men': 'men',
  'fordi': 'fordi',

  // Common nouns with different NN forms
  'uke': 'veke',
  'språk': 'språk',
  'øvelse': 'øving',
  'størrelse': 'storleik',
  'forskjell': 'skilnad',
  'mulighet': 'moglegheit',
  'virkelighet': 'røyndom',
  'virkelig': 'verkeleg',
  'umulig': 'umogleg',
  'nødvendig': 'naudsynt',
  'selvfølge': 'sjølvsagt',
  'øyeblikk': 'augeblink',
  'søster': 'syster',
  'bror': 'bror',
  'selv': 'sjølv',
  'menneske': 'menneske',
  'sykkel': 'sykkel',
  'kirke': 'kyrkje',
  'rekke': 'rekkje',
  'elv': 'elv',
  'bygd': 'bygd',

  // Common verbs with different NN forms
  'synge': 'syngja',
  'bruke': 'bruka',
  'like': 'lika',
  'trenge': 'trenga',
  'spørre': 'spørja',
  'bety': 'tyda',
  'synes': 'synast',

  // Common adjectives with different NN forms
  'liten': 'liten',
  'stor': 'stor',
  'gammel': 'gamal',
  'høy': 'høg',
  'alene': 'åleine',
  'annerledes': 'annleis',
  'kun': 'berre',

  // selv- → sjølv-
  'selv': 'sjølv',
  'selvstendig': 'sjølvstendig',
};

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEMATIC SPELLING RULES — NB → NN transformations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply systematic NB→NN spelling transformations to a word.
 * Returns the NN spelling, or the original if no rule applies.
 */
function applySpellingRules(word) {
  let w = word;

  // 1. hv- → kv- at word start for adjectives/nouns only (hvit→kvit, hvass→kvass)
  //    NOT for question words — those are handled by LEXICAL_REPLACEMENTS
  //    (hvor→kvar not kvor, hvis→viss not kvis, hvem→kven not kvem)
  const HV_LEXICAL = ['hva','hvem','hvor','hvordan','hvorfor','hvilken','hvilket','hvilke','hvis','hver','hvert'];
  if (w.match(/^hv/) && !HV_LEXICAL.includes(w)) {
    w = w.replace(/^hv/, 'kv');
  }

  // 2. -lig → -leg (vanlig→vanleg, farlig→farleg, tydelig→tydeleg)
  if (w.endsWith('lig') && w.length > 4) {
    w = w.slice(0, -3) + 'leg';
  }

  // 3. -ighet → -igheit (mulighet→moglegheit handled by lexical)
  //    -het → -heit for some words
  //    Actually, -het stays as -heit only in some NN words, not systematic
  //    Skip this — handle via lexical replacements

  // 4. Some -else → -ing patterns exist but are word-specific
  //    Skip — handle via lexical replacements

  return w;
}

/**
 * Transform a single NB word to its NN equivalent.
 * Checks lexical replacements first, then applies spelling rules.
 */
function nbToNnWord(word) {
  const lower = word.toLowerCase();

  // Check lexical replacements first (exact match)
  if (LEXICAL_REPLACEMENTS[lower]) {
    return LEXICAL_REPLACEMENTS[lower];
  }

  // Strip trailing punctuation and check again (handles "hvor?" → "kvar?")
  const punctMatch = lower.match(/^(.+?)([?!.,;:]+)$/);
  if (punctMatch) {
    const [, base, punct] = punctMatch;
    if (LEXICAL_REPLACEMENTS[base]) {
      return LEXICAL_REPLACEMENTS[base] + punct;
    }
    return applySpellingRules(base) + punct;
  }

  // Apply systematic spelling rules
  return applySpellingRules(lower);
}

/**
 * Transform a multi-word NB phrase to NN by transforming each word individually.
 * This catches BM words embedded in phrases (e.g., "heller ikke" → "heller ikkje").
 */
function nbToNnPhrase(phrase) {
  // First check if the entire phrase has a lexical replacement
  const lower = phrase.toLowerCase();
  if (LEXICAL_REPLACEMENTS[lower]) {
    return LEXICAL_REPLACEMENTS[lower];
  }

  // Transform each word individually
  const words = lower.split(/(\s+|,\s*)/); // split preserving separators
  const transformed = words.map(part => {
    if (part.match(/^[\s,]+$/)) return part; // preserve whitespace/punctuation
    return nbToNnWord(part);
  });
  return transformed.join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// NN WORD ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function normalizeToId(word, type) {
  let normalized = word.toLowerCase().trim();
  if (normalized.startsWith('å ')) normalized = normalized.substring(2);
  normalized = normalized.replace(/\s+/g, '_');
  normalized = normalized.replace(/\s*\(.*?\)\s*/g, '');
  normalized = normalized.replace(/^_+|_+$/g, '');
  normalized = normalized.replace(/[^a-zæøå0-9_]/g, '');
  return `${normalized}_${type}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// NN NOUN MORPHOLOGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Irregular NN nouns: word → { genus, plural, forms }
 * Many overlap with NB but with different plural/definite patterns.
 */
const IRREGULAR_NOUNS_NN = {
  'barn': { genus: 'n', plural: 'born', bestEntall: 'barnet', bestFlertall: 'borna' },
  'mann': { genus: 'm', plural: 'menn', bestEntall: 'mannen', bestFlertall: 'mennene' },
  'bok': { genus: 'f', plural: 'bøker', bestEntall: 'boka', bestFlertall: 'bøkene' },
  'bror': { genus: 'm', plural: 'brør', bestEntall: 'broren', bestFlertall: 'brørne' },
  'syster': { genus: 'f', plural: 'systrer', bestEntall: 'systera', bestFlertall: 'systrene' },
  'søster': { genus: 'f', plural: 'søstrer', bestEntall: 'søstera', bestFlertall: 'søstrene' },
  'mor': { genus: 'f', plural: 'mødrer', bestEntall: 'mora', bestFlertall: 'mødrene' },
  'far': { genus: 'm', plural: 'fedrar', bestEntall: 'faren', bestFlertall: 'fedrane' },
  'dotter': { genus: 'f', plural: 'døtrer', bestEntall: 'dottera', bestFlertall: 'døtrene' },
  'datter': { genus: 'f', plural: 'døtrer', bestEntall: 'dottera', bestFlertall: 'døtrene' },
  'auge': { genus: 'n', plural: 'auge', bestEntall: 'auget', bestFlertall: 'auga' },
  'øye': { genus: 'n', plural: 'auge', bestEntall: 'auget', bestFlertall: 'auga' },
  'øre': { genus: 'n', plural: 'øyre', bestEntall: 'øyret', bestFlertall: 'øyra' },
  'tre': { genus: 'n', plural: 'tre', bestEntall: 'treet', bestFlertall: 'trea' },
  'kne': { genus: 'n', plural: 'kne', bestEntall: 'kneet', bestFlertall: 'knea' },
  'fot': { genus: 'm', plural: 'føter', bestEntall: 'foten', bestFlertall: 'føtene' },
  'hand': { genus: 'f', plural: 'hender', bestEntall: 'handa', bestFlertall: 'hendene' },
  'hånd': { genus: 'f', plural: 'hender', bestEntall: 'handa', bestFlertall: 'hendene' },
  'natt': { genus: 'f', plural: 'netter', bestEntall: 'natta', bestFlertall: 'nettene' },
  'tann': { genus: 'f', plural: 'tenner', bestEntall: 'tanna', bestFlertall: 'tennene' },
  'ku': { genus: 'f', plural: 'kyr', bestEntall: 'kua', bestFlertall: 'kyrne' },
  'mus': { genus: 'f', plural: 'mus', bestEntall: 'musa', bestFlertall: 'musene' },
  'and': { genus: 'f', plural: 'ender', bestEntall: 'anda', bestFlertall: 'endene' },
  'gås': { genus: 'f', plural: 'gåser', bestEntall: 'gåsa', bestFlertall: 'gåsene' },
  'tid': { genus: 'f', plural: 'tider', bestEntall: 'tida', bestFlertall: 'tidene' },
  'stad': { genus: 'm', plural: 'stader', bestEntall: 'staden', bestFlertall: 'stadene' },
  'sted': { genus: 'm', plural: 'stader', bestEntall: 'staden', bestFlertall: 'stadene' },
  'vatn': { genus: 'n', plural: 'vatn', bestEntall: 'vatnet', bestFlertall: 'vatna' },
  'vann': { genus: 'n', plural: 'vatn', bestEntall: 'vatnet', bestFlertall: 'vatna' },
  'land': { genus: 'n', plural: 'land', bestEntall: 'landet', bestFlertall: 'landa' },
  'hus': { genus: 'n', plural: 'hus', bestEntall: 'huset', bestFlertall: 'husa' },
  'år': { genus: 'n', plural: 'år', bestEntall: 'året', bestFlertall: 'åra' },
  'dag': { genus: 'm', plural: 'dagar', bestEntall: 'dagen', bestFlertall: 'dagane' },
  'ting': { genus: 'm', plural: 'ting', bestEntall: 'tingen', bestFlertall: 'tinga' },
  'veke': { genus: 'f', plural: 'veker', bestEntall: 'veka', bestFlertall: 'vekene' },
  'kyrkje': { genus: 'f', plural: 'kyrkjer', bestEntall: 'kyrkja', bestFlertall: 'kyrkjene' },
};

/**
 * Heuristic genus guessing for NN.
 * Same base rules as NB — NN uses the same 3-gender system.
 */
function guessGenusNN(word) {
  if (word.match(/(skap|verk|stykke|smål|ment|ium|um|eri)$/)) return 'n';
  if (word.match(/^(be|ge)/) && word.length > 4) return 'n';

  // NN preserves feminine more strictly than BM
  if (word.match(/(ing|ung|heit|nad)$/) && word.length > 4) return 'f';
  if (word.match(/(else|heit)$/)) return 'f';
  // -e ending nouns are often feminine in NN
  if (word.endsWith('e') && word.length > 3) return 'f';

  return 'm';
}

/**
 * Generate NN noun forms. Key differences from NB:
 * - Masculine plural: -ar (not -er), definite plural: -ane (not -ene)
 * - Neuter definite plural: -a (not -ene)
 * - Feminine: mostly same as NB
 */
function generateNounFormsNN(word, genus) {
  let plural, bestEntall, bestFlertall;

  if (genus === 'n') {
    // Neuter nouns in NN
    if (word.endsWith('e')) {
      // -e neuter: eit eple → eplet, eple, epla
      plural = word;
      bestEntall = word + 't';
      bestFlertall = word.slice(0, -1) + 'a';
    } else if (word.match(/(eri|ment|ium|um)$/)) {
      // Latin/long endings
      plural = word;
      bestEntall = word + 'et';
      bestFlertall = word + 'a';
    } else {
      // Monosyllabic/short neuter: eit hus → huset, hus, husa
      plural = word;
      bestEntall = word + 'et';
      bestFlertall = word + 'a';
    }
  } else if (genus === 'f') {
    // Feminine nouns in NN
    if (word.endsWith('e')) {
      // -e feminine: ei jente → jenta, jenter, jentene
      plural = word + 'r';
      bestEntall = word.slice(0, -1) + 'a';
      bestFlertall = word + 'ne';
    } else if (word.endsWith('ing') || word.endsWith('ung')) {
      // -ing/-ung: ei øving → øvinga, øvingar, øvingane
      plural = word + 'ar';
      bestEntall = word + 'a';
      bestFlertall = word + 'ane';
    } else if (word.endsWith('heit')) {
      // -heit: ei moglegheit → moglegheita, moglegheiter, moglegheitene
      plural = word + 'er';
      bestEntall = word + 'a';
      bestFlertall = word + 'ene';
    } else if (word.endsWith('else')) {
      // -else: same as NB mostly
      plural = word + 'r';
      bestEntall = word + 'n';
      bestFlertall = word + 'ne';
    } else {
      // Other feminine: ei bok → boka, bøker, bøkene (irregular handled above)
      plural = word + 'er';
      bestEntall = word + 'a';
      bestFlertall = word + 'ene';
    }
  } else {
    // Masculine nouns in NN — KEY DIFFERENCES from NB
    if (word.endsWith('e')) {
      // -e masculine: ein gut(e) → guten, gutar, gutane
      plural = word.slice(0, -1) + 'ar';
      bestEntall = word + 'n';
      bestFlertall = word.slice(0, -1) + 'ane';
    } else if (word.endsWith('ar')) {
      // -ar: ein lærar → læraren, lærarar, lærarane
      plural = word + 'ar';
      bestEntall = word + 'en';
      bestFlertall = word + 'ane';
    } else if (word.endsWith('er')) {
      // -er masculine: same word, NN-style plurals
      plural = word + 'ar';
      bestEntall = word + 'en';
      bestFlertall = word + 'ane';
    } else if (word.endsWith('el')) {
      // -el: ein onkel → onkelen, onklar, onklane
      plural = word.slice(0, -2) + 'lar';
      bestEntall = word + 'en';
      bestFlertall = word.slice(0, -2) + 'lane';
    } else {
      // Consonant-ending masculine: ein stol → stolen, stolar, stolane
      plural = word + 'ar';
      bestEntall = word + 'en';
      bestFlertall = word + 'ane';
    }
  }

  return { plural, bestEntall, bestFlertall };
}

function enrichNounNN(word, genus) {
  const w = word.toLowerCase();

  // Check NN irregulars
  if (IRREGULAR_NOUNS_NN[w]) {
    const irr = IRREGULAR_NOUNS_NN[w];
    return {
      genus: irr.genus,
      plural: irr.plural,
      forms: {
        ubestemt: { entall: w, flertall: irr.plural },
        bestemt: { entall: irr.bestEntall, flertall: irr.bestFlertall },
      },
    };
  }

  // Use provided genus or guess
  const g = genus || guessGenusNN(w);
  const { plural, bestEntall, bestFlertall } = generateNounFormsNN(w, g);

  return {
    genus: g,
    plural,
    forms: {
      ubestemt: { entall: w, flertall: plural },
      bestemt: { entall: bestEntall, flertall: bestFlertall },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NN VERB MORPHOLOGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Irregular NN verbs.
 * Many overlap with NB but with NN-specific forms.
 */
const IRREGULAR_VERBS_NN = {
  'vera': { cls: 'uregelmessig', presens: 'er', preteritum: 'var', partisipp: 'vore', imperativ: 'ver', aux: 'har' },
  'være': { cls: 'uregelmessig', presens: 'er', preteritum: 'var', partisipp: 'vore', imperativ: 'ver', aux: 'har' },
  'ha': { cls: 'uregelmessig', presens: 'har', preteritum: 'hadde', partisipp: 'hatt', imperativ: 'ha', aux: 'har' },
  'bli': { cls: 'sterk', presens: 'blir', preteritum: 'vart', partisipp: 'vorte', imperativ: 'bli', aux: 'er' },
  'gå': { cls: 'sterk', presens: 'går', preteritum: 'gjekk', partisipp: 'gått', imperativ: 'gå', aux: 'har' },
  'koma': { cls: 'sterk', presens: 'kjem', preteritum: 'kom', partisipp: 'kome', imperativ: 'kom', aux: 'har' },
  'komme': { cls: 'sterk', presens: 'kjem', preteritum: 'kom', partisipp: 'kome', imperativ: 'kom', aux: 'har' },
  'ta': { cls: 'sterk', presens: 'tek', preteritum: 'tok', partisipp: 'teke', imperativ: 'ta', aux: 'har' },
  'gje': { cls: 'sterk', presens: 'gjev', preteritum: 'gav', partisipp: 'gjeve', imperativ: 'gje', aux: 'har' },
  'gi': { cls: 'sterk', presens: 'gjev', preteritum: 'gav', partisipp: 'gjeve', imperativ: 'gje', aux: 'har' },
  'seia': { cls: 'sterk', presens: 'seier', preteritum: 'sa', partisipp: 'sagt', imperativ: 'sei', aux: 'har' },
  'si': { cls: 'sterk', presens: 'seier', preteritum: 'sa', partisipp: 'sagt', imperativ: 'sei', aux: 'har' },
  'sjå': { cls: 'sterk', presens: 'ser', preteritum: 'såg', partisipp: 'sett', imperativ: 'sjå', aux: 'har' },
  'se': { cls: 'sterk', presens: 'ser', preteritum: 'såg', partisipp: 'sett', imperativ: 'sjå', aux: 'har' },
  'gjera': { cls: 'uregelmessig', presens: 'gjer', preteritum: 'gjorde', partisipp: 'gjort', imperativ: 'gjer', aux: 'har' },
  'gjøre': { cls: 'uregelmessig', presens: 'gjer', preteritum: 'gjorde', partisipp: 'gjort', imperativ: 'gjer', aux: 'har' },
  'vita': { cls: 'uregelmessig', presens: 'veit', preteritum: 'visste', partisipp: 'visst', imperativ: 'vit', aux: 'har' },
  'vite': { cls: 'uregelmessig', presens: 'veit', preteritum: 'visste', partisipp: 'visst', imperativ: 'vit', aux: 'har' },
  'finna': { cls: 'sterk', presens: 'finn', preteritum: 'fann', partisipp: 'funne', imperativ: 'finn', aux: 'har' },
  'finne': { cls: 'sterk', presens: 'finn', preteritum: 'fann', partisipp: 'funne', imperativ: 'finn', aux: 'har' },
  'stå': { cls: 'sterk', presens: 'står', preteritum: 'stod', partisipp: 'stått', imperativ: 'stå', aux: 'har' },
  'liggja': { cls: 'sterk', presens: 'ligg', preteritum: 'låg', partisipp: 'lege', imperativ: 'ligg', aux: 'har' },
  'ligge': { cls: 'sterk', presens: 'ligg', preteritum: 'låg', partisipp: 'lege', imperativ: 'ligg', aux: 'har' },
  'sitja': { cls: 'sterk', presens: 'sit', preteritum: 'sat', partisipp: 'sete', imperativ: 'sit', aux: 'har' },
  'sitte': { cls: 'sterk', presens: 'sit', preteritum: 'sat', partisipp: 'sete', imperativ: 'sit', aux: 'har' },
  'dra': { cls: 'sterk', presens: 'dreg', preteritum: 'drog', partisipp: 'drege', imperativ: 'dra', aux: 'har' },
  'drikka': { cls: 'sterk', presens: 'drikk', preteritum: 'drakk', partisipp: 'drukke', imperativ: 'drikk', aux: 'har' },
  'drikke': { cls: 'sterk', presens: 'drikk', preteritum: 'drakk', partisipp: 'drukke', imperativ: 'drikk', aux: 'har' },
  'skriva': { cls: 'sterk', presens: 'skriv', preteritum: 'skreiv', partisipp: 'skrive', imperativ: 'skriv', aux: 'har' },
  'skrive': { cls: 'sterk', presens: 'skriv', preteritum: 'skreiv', partisipp: 'skrive', imperativ: 'skriv', aux: 'har' },
  'lesa': { cls: 'sterk', presens: 'les', preteritum: 'las', partisipp: 'lese', imperativ: 'les', aux: 'har' },
  'lese': { cls: 'sterk', presens: 'les', preteritum: 'las', partisipp: 'lese', imperativ: 'les', aux: 'har' },
  'forstå': { cls: 'sterk', presens: 'forstår', preteritum: 'forstod', partisipp: 'forstått', imperativ: 'forstå', aux: 'har' },
  'eta': { cls: 'sterk', presens: 'et', preteritum: 'åt', partisipp: 'ete', imperativ: 'et', aux: 'har' },
  'spise': { cls: 'sterk', presens: 'et', preteritum: 'åt', partisipp: 'ete', imperativ: 'et', aux: 'har' },
  'sova': { cls: 'sterk', presens: 'søv', preteritum: 'sov', partisipp: 'sove', imperativ: 'sov', aux: 'har' },
  'sove': { cls: 'sterk', presens: 'søv', preteritum: 'sov', partisipp: 'sove', imperativ: 'sov', aux: 'har' },
  'springa': { cls: 'sterk', presens: 'spring', preteritum: 'sprang', partisipp: 'sprunge', imperativ: 'spring', aux: 'har' },
  'løpe': { cls: 'sterk', presens: 'spring', preteritum: 'sprang', partisipp: 'sprunge', imperativ: 'spring', aux: 'har' },
  'syngja': { cls: 'sterk', presens: 'syng', preteritum: 'song', partisipp: 'sunge', imperativ: 'syng', aux: 'har' },
  'synge': { cls: 'sterk', presens: 'syng', preteritum: 'song', partisipp: 'sunge', imperativ: 'syng', aux: 'har' },
  'bera': { cls: 'sterk', presens: 'ber', preteritum: 'bar', partisipp: 'bore', imperativ: 'ber', aux: 'har' },
  'bære': { cls: 'sterk', presens: 'ber', preteritum: 'bar', partisipp: 'bore', imperativ: 'ber', aux: 'har' },
  'falla': { cls: 'sterk', presens: 'fell', preteritum: 'fall', partisipp: 'falle', imperativ: 'fall', aux: 'har' },
  'falle': { cls: 'sterk', presens: 'fell', preteritum: 'fall', partisipp: 'falle', imperativ: 'fall', aux: 'har' },
  'halda': { cls: 'sterk', presens: 'held', preteritum: 'heldt', partisipp: 'halde', imperativ: 'hald', aux: 'har' },
  'holde': { cls: 'sterk', presens: 'held', preteritum: 'heldt', partisipp: 'halde', imperativ: 'hald', aux: 'har' },
  'leggja': { cls: 'uregelmessig', presens: 'legg', preteritum: 'la', partisipp: 'lagt', imperativ: 'legg', aux: 'har' },
  'legge': { cls: 'uregelmessig', presens: 'legg', preteritum: 'la', partisipp: 'lagt', imperativ: 'legg', aux: 'har' },
  'setja': { cls: 'uregelmessig', presens: 'set', preteritum: 'sette', partisipp: 'sett', imperativ: 'set', aux: 'har' },
  'sette': { cls: 'uregelmessig', presens: 'set', preteritum: 'sette', partisipp: 'sett', imperativ: 'set', aux: 'har' },
  'selja': { cls: 'uregelmessig', presens: 'sel', preteritum: 'selde', partisipp: 'selt', imperativ: 'sel', aux: 'har' },
  'selge': { cls: 'uregelmessig', presens: 'sel', preteritum: 'selde', partisipp: 'selt', imperativ: 'sel', aux: 'har' },
  'fortelja': { cls: 'uregelmessig', presens: 'fortel', preteritum: 'fortalde', partisipp: 'fortalt', imperativ: 'fortel', aux: 'har' },
  'fortelle': { cls: 'uregelmessig', presens: 'fortel', preteritum: 'fortalde', partisipp: 'fortalt', imperativ: 'fortel', aux: 'har' },
  'le': { cls: 'sterk', presens: 'ler', preteritum: 'lo', partisipp: 'ledd', imperativ: 'le', aux: 'har' },
  'fly': { cls: 'sterk', presens: 'flyg', preteritum: 'flaug', partisipp: 'floge', imperativ: 'flyg', aux: 'har' },
  'flyga': { cls: 'sterk', presens: 'flyg', preteritum: 'flaug', partisipp: 'floge', imperativ: 'flyg', aux: 'har' },
  'hjelpa': { cls: 'sterk', presens: 'hjelp', preteritum: 'hjelpte', partisipp: 'hjelpt', imperativ: 'hjelp', aux: 'har' },
  'hjelpe': { cls: 'sterk', presens: 'hjelp', preteritum: 'hjelpte', partisipp: 'hjelpt', imperativ: 'hjelp', aux: 'har' },
  'høyra': { cls: 'svak', presens: 'høyrer', preteritum: 'høyrde', partisipp: 'høyrt', imperativ: 'høyr', aux: 'har' },
  'høre': { cls: 'svak', presens: 'høyrer', preteritum: 'høyrde', partisipp: 'høyrt', imperativ: 'høyr', aux: 'har' },
  'køyra': { cls: 'svak', presens: 'køyrer', preteritum: 'køyrde', partisipp: 'køyrt', imperativ: 'køyr', aux: 'har' },
  'kjøre': { cls: 'svak', presens: 'køyrer', preteritum: 'køyrde', partisipp: 'køyrt', imperativ: 'køyr', aux: 'har' },
  'læra': { cls: 'svak', presens: 'lærer', preteritum: 'lærte', partisipp: 'lært', imperativ: 'lær', aux: 'har' },
  'lære': { cls: 'svak', presens: 'lærer', preteritum: 'lærte', partisipp: 'lært', imperativ: 'lær', aux: 'har' },
  'heita': { cls: 'uregelmessig', presens: 'heiter', preteritum: 'heitte', partisipp: 'heitt', imperativ: 'heit', aux: 'har' },
  'hete': { cls: 'uregelmessig', presens: 'heiter', preteritum: 'heitte', partisipp: 'heitt', imperativ: 'heit', aux: 'har' },
  'synast': { cls: 'uregelmessig', presens: 'synest', preteritum: 'syntest', partisipp: 'synst', imperativ: '-', aux: 'har' },
  'synes': { cls: 'uregelmessig', presens: 'synest', preteritum: 'syntest', partisipp: 'synst', imperativ: '-', aux: 'har' },
  'kunna': { cls: 'uregelmessig', presens: 'kan', preteritum: 'kunne', partisipp: 'kunna', imperativ: '-', aux: 'har' },
  'kunne': { cls: 'uregelmessig', presens: 'kan', preteritum: 'kunne', partisipp: 'kunna', imperativ: '-', aux: 'har' },
  'vilja': { cls: 'uregelmessig', presens: 'vil', preteritum: 'ville', partisipp: 'vilja', imperativ: '-', aux: 'har' },
  'ville': { cls: 'uregelmessig', presens: 'vil', preteritum: 'ville', partisipp: 'vilja', imperativ: '-', aux: 'har' },
  'skulla': { cls: 'uregelmessig', presens: 'skal', preteritum: 'skulle', partisipp: 'skulla', imperativ: '-', aux: 'har' },
  'skulle': { cls: 'uregelmessig', presens: 'skal', preteritum: 'skulle', partisipp: 'skulla', imperativ: '-', aux: 'har' },
  'måtta': { cls: 'uregelmessig', presens: 'må', preteritum: 'måtte', partisipp: 'måtta', imperativ: '-', aux: 'har' },
  'måtte': { cls: 'uregelmessig', presens: 'må', preteritum: 'måtte', partisipp: 'måtta', imperativ: '-', aux: 'har' },
  'burda': { cls: 'uregelmessig', presens: 'bør', preteritum: 'burde', partisipp: 'burd', imperativ: '-', aux: 'har' },
  'burde': { cls: 'uregelmessig', presens: 'bør', preteritum: 'burde', partisipp: 'burd', imperativ: '-', aux: 'har' },
  'tora': { cls: 'uregelmessig', presens: 'tør', preteritum: 'torde', partisipp: 'tort', imperativ: '-', aux: 'har' },
  'tørre': { cls: 'uregelmessig', presens: 'tør', preteritum: 'torde', partisipp: 'tort', imperativ: '-', aux: 'har' },
  'trekkja': { cls: 'sterk', presens: 'trekk', preteritum: 'drog', partisipp: 'drege', imperativ: 'trekk', aux: 'har' },
  'trekke': { cls: 'sterk', presens: 'trekk', preteritum: 'drog', partisipp: 'drege', imperativ: 'trekk', aux: 'har' },
  'bryta': { cls: 'sterk', presens: 'bryt', preteritum: 'braut', partisipp: 'brote', imperativ: 'bryt', aux: 'har' },
  'bryte': { cls: 'sterk', presens: 'bryt', preteritum: 'braut', partisipp: 'brote', imperativ: 'bryt', aux: 'har' },
  'treffe': { cls: 'sterk', presens: 'treff', preteritum: 'traff', partisipp: 'truffe', imperativ: 'treff', aux: 'har' },
  'veksa': { cls: 'uregelmessig', presens: 'veks', preteritum: 'voks', partisipp: 'vakse', imperativ: 'veks', aux: 'har' },
  'vokse': { cls: 'uregelmessig', presens: 'veks', preteritum: 'voks', partisipp: 'vakse', imperativ: 'veks', aux: 'har' },
  'få': { cls: 'sterk', presens: 'får', preteritum: 'fekk', partisipp: 'fått', imperativ: 'få', aux: 'har' },
  'skje': { cls: 'sterk', presens: 'skjer', preteritum: 'skjedde', partisipp: 'skjedd', imperativ: '-', aux: 'har' },
  'la': { cls: 'sterk', presens: 'lèt', preteritum: 'let', partisipp: 'late', imperativ: 'lat', aux: 'har' },
  'slå': { cls: 'sterk', presens: 'slår', preteritum: 'slo', partisipp: 'slege', imperativ: 'slå', aux: 'har' },
  'oppleva': { cls: 'svak', presens: 'opplever', preteritum: 'opplevde', partisipp: 'opplevd', imperativ: 'opplev', aux: 'har' },
  'oppleve': { cls: 'svak', presens: 'opplever', preteritum: 'opplevde', partisipp: 'opplevd', imperativ: 'opplev', aux: 'har' },
  // Compound verbs of strong stems
  'unngå': { cls: 'sterk', presens: 'unngår', preteritum: 'unngjekk', partisipp: 'unngått', imperativ: 'unngå', aux: 'har' },
  'oppgi': { cls: 'sterk', presens: 'oppgjev', preteritum: 'oppgav', partisipp: 'oppgjeve', imperativ: 'oppgje', aux: 'har' },
  'forbli': { cls: 'sterk', presens: 'forblir', preteritum: 'forblei', partisipp: 'forblidd', imperativ: 'forbli', aux: 'er' },
  'innta': { cls: 'sterk', presens: 'inntek', preteritum: 'inntok', partisipp: 'innteke', imperativ: 'innta', aux: 'har' },
  'påstå': { cls: 'sterk', presens: 'påstår', preteritum: 'påstod', partisipp: 'påstått', imperativ: 'påstå', aux: 'har' },
};

/**
 * NB verb → NN verb word transformation.
 * Many weak NB -e verbs become -a in NN.
 */
const VERB_NB_TO_NN = {
  'være': 'vera',
  'komme': 'koma',
  'gjøre': 'gjera',
  'vite': 'vita',
  'finne': 'finna',
  'ligge': 'liggja',
  'sitte': 'sitja',
  'drikke': 'drikka',
  'skrive': 'skriva',
  'lese': 'lesa',
  'spise': 'eta',
  'sove': 'sova',
  'løpe': 'springa',
  'synge': 'syngja',
  'bære': 'bera',
  'falle': 'falla',
  'holde': 'halda',
  'legge': 'leggja',
  'sette': 'setja',
  'selge': 'selja',
  'fortelle': 'fortelja',
  'hjelpe': 'hjelpa',
  'hete': 'heita',
  'synes': 'synast',
  'bryte': 'bryta',
  'trekke': 'trekkja',
  'vokse': 'veksa',
  'spørre': 'spørja',
  'bruke': 'bruka',
  'like': 'lika',
  'trenge': 'trenga',
  'høre': 'høyra',
  'kjøre': 'køyra',
  'lære': 'læra',
  'fly': 'flyga',
  'kunne': 'kunna',
  'ville': 'vilja',
  'skulle': 'skulla',
  'måtte': 'måtta',
  'burde': 'burda',
  'tørre': 'tora',
};

/**
 * Determine if a regular NB weak verb should use -a infinitive in NN.
 * General rule: most weak type 1 verbs (double consonant stems) → -a in NN.
 */
function shouldUseAInfinitive(nbWord) {
  const w = nbWord.toLowerCase();
  if (!w.endsWith('e')) return false;
  const stem = w.slice(0, -1);

  // Double consonant stems → a-verb in NN
  if (stem.match(/(kk|pp|tt|ss|ll|nn|mm|gg|bb|dd|ff)$/)) return true;

  // -nk, -ng, -sk stems → a-verb
  if (stem.match(/(nk|ng|sk|rk|lp|mp|nt|nd|ft|kt|pt|st)$/)) return true;

  return false;
}

/**
 * Known strong verb stems — if a compound verb ends with one of these,
 * inherit the strong conjugation pattern.
 */
const STRONG_VERB_STEMS = {
  'gå': { cls: 'sterk', presens: 'går', preteritum: 'gjekk', partisipp: 'gått', imperativ: 'gå', aux: 'har' },
  'stå': { cls: 'sterk', presens: 'står', preteritum: 'stod', partisipp: 'stått', imperativ: 'stå', aux: 'har' },
  'slå': { cls: 'sterk', presens: 'slår', preteritum: 'slo', partisipp: 'slege', imperativ: 'slå', aux: 'har' },
  'ta': { cls: 'sterk', presens: 'tek', preteritum: 'tok', partisipp: 'teke', imperativ: 'ta', aux: 'har' },
  'gi': { cls: 'sterk', presens: 'gjev', preteritum: 'gav', partisipp: 'gjeve', imperativ: 'gje', aux: 'har' },
  'dra': { cls: 'sterk', presens: 'dreg', preteritum: 'drog', partisipp: 'drege', imperativ: 'dra', aux: 'har' },
  'bli': { cls: 'sterk', presens: 'blir', preteritum: 'vart', partisipp: 'vorte', imperativ: 'bli', aux: 'er' },
  'koma': { cls: 'sterk', presens: 'kjem', preteritum: 'kom', partisipp: 'kome', imperativ: 'kom', aux: 'har' },
  'finna': { cls: 'sterk', presens: 'finn', preteritum: 'fann', partisipp: 'funne', imperativ: 'finn', aux: 'har' },
  'halda': { cls: 'sterk', presens: 'held', preteritum: 'heldt', partisipp: 'halde', imperativ: 'hald', aux: 'har' },
  'setja': { cls: 'uregelmessig', presens: 'set', preteritum: 'sette', partisipp: 'sett', imperativ: 'set', aux: 'har' },
  'leggja': { cls: 'uregelmessig', presens: 'legg', preteritum: 'la', partisipp: 'lagt', imperativ: 'legg', aux: 'har' },
};

/**
 * Try to match a compound verb against known strong stems.
 * E.g., "oppstå" → prefix "opp" + stem "stå"
 * Excludes short stems (ta, gi, dra) from compound matching to avoid
 * false positives (kasta, flytta etc. ending in "ta" are NOT compounds).
 */
const COMPOUND_MIN_STEM_LENGTH = 3; // Only match stems >= 3 chars
function matchCompoundStrongVerb(word) {
  for (const [stem, forms] of Object.entries(STRONG_VERB_STEMS)) {
    if (stem.length < COMPOUND_MIN_STEM_LENGTH) continue;
    if (word.endsWith(stem) && word.length > stem.length) {
      const prefix = word.slice(0, -stem.length);
      // Prefix should be a known Norwegian prefix
      if (prefix.match(/^(an|av|be|for|fore|fra|gjen|inn|med|mis|ned|om|opp|over|på|sam|til|u|un|unn|under|ut|ved|å)$/)) {
        return { prefix, stem, forms };
      }
    }
  }
  return null;
}

/**
 * Extract the verb part from a multi-word verb phrase.
 * "kaste seg" → { verb: "kaste", particles: ["seg"] }
 * "gi opp" → { verb: "gi", particles: ["opp"] }
 * "ta med seg" → { verb: "ta", particles: ["med", "seg"] }
 */
function splitVerbPhrase(word) {
  const parts = word.split(' ');
  if (parts.length === 1) return { verb: word, particles: [] };
  return { verb: parts[0], particles: parts.slice(1) };
}

/**
 * Generate NN verb conjugation.
 */
function enrichVerbNN(nnWord) {
  const w = nnWord.toLowerCase();

  // Handle multi-word verbs: conjugate only the verb part
  const { verb, particles } = splitVerbPhrase(w);
  const particleSuffix = particles.length > 0 ? ' ' + particles.join(' ') : '';

  // If multi-word, conjugate the verb part only
  const conjugTarget = particles.length > 0 ? verb : w;

  // Check NN irregulars (try full phrase first, then verb part alone)
  const irrFull = IRREGULAR_VERBS_NN[w];
  const irrVerb = IRREGULAR_VERBS_NN[conjugTarget];
  const irr = irrFull || irrVerb;

  if (irr) {
    return {
      verbClass: irr.cls,
      auxiliary: irr.aux,
      conjugations: {
        presens: {
          former: {
            infinitiv: `å ${w}`,
            presens: irr.presens + particleSuffix,
            preteritum: irr.preteritum + particleSuffix,
            perfektum_partisipp: irr.partisipp,
            imperativ: irr.imperativ === '-' ? '-' : irr.imperativ + particleSuffix,
          },
          auxiliary: irr.aux,
          feature: 'grammar_nn_presens',
        },
      },
    };
  }

  // Check compound strong verbs (oppstå, unngå, anslå, etc.)
  const compound = matchCompoundStrongVerb(conjugTarget);
  if (compound) {
    const { prefix, forms } = compound;
    return {
      verbClass: forms.cls,
      auxiliary: forms.aux,
      conjugations: {
        presens: {
          former: {
            infinitiv: `å ${w}`,
            presens: prefix + forms.presens + particleSuffix,
            preteritum: prefix + forms.preteritum + particleSuffix,
            perfektum_partisipp: prefix + forms.partisipp,
            imperativ: prefix + forms.imperativ + particleSuffix,
          },
          auxiliary: forms.aux,
          feature: 'grammar_nn_presens',
        },
      },
    };
  }

  // Regular verb rules for NN
  let presens, preteritum, partisipp, imperativ, verbClass, aux;
  aux = 'har';
  const cj = conjugTarget; // the verb part to conjugate

  if (cj.endsWith('era')) {
    // -era verbs (Latin): akseptera → aksepterer, aksepterte, akseptert
    verbClass = 'svak';
    presens = cj.slice(0, -1) + 'er';
    preteritum = cj.slice(0, -1) + 'te';
    partisipp = cj.slice(0, -1) + 't';
    imperativ = cj.slice(0, -1) + 'r'; // akseptér → stem
  } else if (cj.endsWith('ere')) {
    // Some NN verbs keep -ere form: akseptere → aksepterer, aksepterte, akseptert
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = cj.slice(0, -1) + 'te';
    partisipp = cj.slice(0, -1) + 't';
    imperativ = cj.slice(0, -1); // strip final -e: akseptere → aksepter
  } else if (cj.endsWith('a') && !cj.endsWith('ja')) {
    // a-verbs (NN weak class 1): kasta → kastar, kasta, kasta
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = cj;
    partisipp = cj;
    imperativ = cj.slice(0, -1);
  } else if (cj.endsWith('ja')) {
    // -ja verbs (NN): spørja → spør, spurde, spurt
    // These are often irregular — handled above. Fallback:
    verbClass = 'svak';
    const stem = cj.slice(0, -2);
    presens = stem;
    preteritum = stem + 'de';
    partisipp = stem + 'd';
    imperativ = stem;
  } else if (cj.endsWith('ast') || cj.endsWith('st')) {
    // s-passive/reflexive: synast
    verbClass = 'uregelmessig';
    presens = cj.replace(/ast$/, 'est').replace(/st$/, 'st');
    preteritum = cj.replace(/ast$/, 'test').replace(/st$/, 'test');
    partisipp = cj.replace(/ast$/, 'st').replace(/st$/, 'st');
    imperativ = '-';
  } else if (cj.endsWith('le') || cj.endsWith('re') || cj.endsWith('ne')) {
    // -le/-re/-ne verbs: these are typically a-verbs in NN
    // behandle → behandlar, behandla, behandla
    // ordne → ordnar, ordna, ordna
    // lagre → lagrar, lagra, lagra
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = cj.slice(0, -1) + 'a';
    partisipp = cj.slice(0, -1) + 'a';
    imperativ = cj.slice(0, -1);
  } else if (cj.endsWith('e')) {
    // e-verbs (NN weak class 2): leve → lever, levde, levd
    const stem = cj.slice(0, -1);
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = stem + 'te';
    partisipp = stem + 't';
    imperativ = stem;
  } else {
    // Monosyllabic: bu → bur, budde, budd
    verbClass = 'svak';
    presens = cj + 'r';
    preteritum = cj + 'dde';
    partisipp = cj + 'dd';
    imperativ = cj;
  }

  return {
    verbClass,
    auxiliary: aux,
    conjugations: {
      presens: {
        former: {
          infinitiv: `å ${w}`,
          presens: presens + particleSuffix,
          preteritum: preteritum + particleSuffix,
          perfektum_partisipp: partisipp,
          imperativ: imperativ === '-' ? '-' : imperativ + particleSuffix,
        },
        auxiliary: aux,
        feature: 'grammar_nn_presens',
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NN ADJECTIVE MORPHOLOGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Irregular NN adjective declensions (full override).
 */
const IRREGULAR_ADJ_DECLENSION_NN = {
  'liten': {
    comparison: { positiv: 'liten', komparativ: 'mindre', superlativ: 'minst' },
    declension: {
      positiv: { maskulin: 'liten', feminin: 'lita', noytrum: 'lite', flertall: 'små', bestemt: 'vesle' },
      komparativ: { alle: 'mindre' },
      superlativ: { ubestemt: 'minst', bestemt: 'minste' },
    },
  },
  'annan': {
    comparison: { positiv: 'annan', komparativ: '-', superlativ: '-' },
    declension: {
      positiv: { maskulin: 'annan', feminin: 'anna', noytrum: 'anna', flertall: 'andre', bestemt: 'andre' },
      komparativ: { alle: '-' },
      superlativ: { ubestemt: '-', bestemt: '-' },
    },
  },
};

const IRREGULAR_ADJECTIVES_NN = {
  'god': { komparativ: 'betre', superlativ: 'best' },
  'stor': { komparativ: 'større', superlativ: 'størst' },
  'liten': { komparativ: 'mindre', superlativ: 'minst' },
  'ung': { komparativ: 'yngre', superlativ: 'yngst' },
  'gamal': { komparativ: 'eldre', superlativ: 'eldst' },
  'gammel': { komparativ: 'eldre', superlativ: 'eldst' },
  'lang': { komparativ: 'lengre', superlativ: 'lengst' },
  'tung': { komparativ: 'tyngre', superlativ: 'tyngst' },
  'mange': { komparativ: 'fleire', superlativ: 'flest' },
  'mykje': { komparativ: 'meir', superlativ: 'mest' },
  'mye': { komparativ: 'meir', superlativ: 'mest' },
  'dårleg': { komparativ: 'verre', superlativ: 'verst' },
  'dårlig': { komparativ: 'verre', superlativ: 'verst' },
  'få': { komparativ: 'færre', superlativ: 'færrast' },
  'nær': { komparativ: 'nærare', superlativ: 'nærast' },
};

function enrichAdjectiveNN(word) {
  const w = word.toLowerCase();

  // Check for fully irregular declension (liten, annan)
  if (IRREGULAR_ADJ_DECLENSION_NN[w]) {
    return IRREGULAR_ADJ_DECLENSION_NN[w];
  }

  // Comparison forms
  let komparativ, superlativ;
  if (IRREGULAR_ADJECTIVES_NN[w]) {
    komparativ = IRREGULAR_ADJECTIVES_NN[w].komparativ;
    superlativ = IRREGULAR_ADJECTIVES_NN[w].superlativ;
  } else if (w.endsWith('eg') || w.endsWith('leg') || w.endsWith('sam') || w.length > 7) {
    // Long adjectives use "meir/mest" in NN (not "mer/mest")
    komparativ = `meir ${w}`;
    superlativ = `mest ${w}`;
  } else if (w.endsWith('e')) {
    komparativ = w + 're';
    superlativ = w.slice(0, -1) + 'st';
  } else {
    komparativ = w + 'are';
    superlativ = w + 'ast';
  }

  // Superlativ bestemt: add -e, but not if already ends in -e
  const superBestemt = superlativ.endsWith('e') ? superlativ : superlativ + 'e';

  // Declension (same structure as NB, but with NN-specific rules)
  let noytrum, flertall, bestemt;

  if (w.endsWith('e')) {
    noytrum = w;
    flertall = w;
    bestemt = w;
  } else if (w.endsWith('ig') || w.endsWith('eg')) {
    // KEY NN DIFFERENCE: -ig/-eg adjectives do NOT add -t in neuter
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.endsWith('sk')) {
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.endsWith('t')) {
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.endsWith('d') && w.length <= 5) {
    // Short -d adjectives: glad → glad (no -t in neuter)
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else if (w.match(/(dd|tt|nn|mm|ll|ss|kk|pp)$/)) {
    noytrum = w;
    flertall = w + 'e';
    bestemt = w + 'e';
  } else {
    noytrum = w + 't';
    flertall = w + 'e';
    bestemt = w + 'e';
  }

  return {
    comparison: {
      positiv: w,
      komparativ,
      superlativ,
    },
    declension: {
      positiv: {
        maskulin: w,
        feminin: w,
        noytrum,
        flertall,
        bestemt,
      },
      komparativ: {
        alle: komparativ,
      },
      superlativ: {
        ubestemt: superlativ,
        bestemt: superBestemt,
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN — Transform NB → NN
// ═══════════════════════════════════════════════════════════════════════════

console.log('Generating Norwegian Nynorsk (NN) lexicon from Bokmål (NB)...\n');

mkdirSync(NN_BASE, { recursive: true });

const nbToNnMap = {}; // Maps NB word ID → NN word ID (for link generation)
const bankNames = ['nounbank', 'verbbank', 'adjectivebank', 'generalbank'];
const nnBanks = {};
const stats = { total: 0, enriched: 0, skipped: 0 };

for (const bankName of bankNames) {
  const nbPath = join(NB_BASE, `${bankName}.json`);
  if (!existsSync(nbPath)) {
    console.log(`  Skipping ${bankName} (not found)`);
    continue;
  }

  const nbData = JSON.parse(readFileSync(nbPath, 'utf8'));
  const { _metadata, ...nbEntries } = nbData;

  const nnEntries = {};
  let enrichedCount = 0;

  for (const [nbId, nbEntry] of Object.entries(nbEntries)) {
    stats.total++;

    const nbWord = nbEntry.word;
    const type = nbEntry.type;

    // Transform word NB → NN
    let nnWord;

    if (type === 'verb') {
      // Check verb-specific replacements first (full word)
      nnWord = VERB_NB_TO_NN[nbWord.toLowerCase()];

      if (!nnWord) {
        // For multi-word verbs, transform each part independently
        const parts = nbWord.toLowerCase().split(' ');
        const transformedParts = parts.map((part, i) => {
          // First part is the verb — check verb map and a-infinitive
          if (i === 0) {
            if (VERB_NB_TO_NN[part]) return VERB_NB_TO_NN[part];
            if (shouldUseAInfinitive(part)) return part.slice(0, -1) + 'a';
            return nbToNnWord(part);
          }
          // Other parts are particles/pronouns — apply general word rules
          return nbToNnWord(part);
        });
        nnWord = transformedParts.join(' ');
      }

      // For single-word regular weak verbs: check if -e → -a
      if (!nnWord.includes(' ') && nnWord === nbWord.toLowerCase() && shouldUseAInfinitive(nbWord)) {
        nnWord = nbWord.toLowerCase().slice(0, -1) + 'a';
      }
    } else {
      // For non-verbs: transform each word in multi-word phrases too
      nnWord = nbWord.includes(' ') ? nbToNnPhrase(nbWord) : nbToNnWord(nbWord);
    }

    // Generate NN word ID
    const nnId = normalizeToId(nnWord, type);

    // Track mapping
    nbToNnMap[nbId] = nnId;

    // Build NN entry
    const nnEntry = {
      word: nnWord,
      type,
    };

    // Apply NN-specific morphology
    let enriched = false;

    if (type === 'noun') {
      if (nnWord.includes(' ') && nnWord.split(' ').length > 2) {
        stats.skipped++;
      } else {
        try {
          // Carry genus from NB if available
          const genus = nbEntry.genus || null;
          const enrichment = enrichNounNN(nnWord, genus);
          nnEntry.genus = enrichment.genus;
          nnEntry.plural = enrichment.plural;
          nnEntry.forms = enrichment.forms;
          enriched = true;
        } catch (e) {
          stats.skipped++;
        }
      }
    } else if (type === 'verb') {
      if (nnWord.includes(' ') && nnWord.split(' ').length > 3) {
        stats.skipped++;
      } else {
        try {
          const enrichment = enrichVerbNN(nnWord);
          nnEntry.verbClass = enrichment.verbClass;
          nnEntry.auxiliary = enrichment.auxiliary;
          nnEntry.conjugations = enrichment.conjugations;
          enriched = true;
        } catch (e) {
          stats.skipped++;
        }
      }
    } else if (type === 'adj') {
      if (nnWord.includes(' ') && nnWord.split(' ').length > 2) {
        stats.skipped++;
      } else {
        try {
          const enrichment = enrichAdjectiveNN(nnWord);
          nnEntry.comparison = enrichment.comparison;
          nnEntry.declension = enrichment.declension;
          enriched = true;
        } catch (e) {
          stats.skipped++;
        }
      }
    }

    nnEntry._enriched = enriched;
    nnEntry._nnSource = 'auto-nb';
    nnEntry._nbEquivalent = nbId;

    if (enriched) {
      enrichedCount++;
      stats.enriched++;
    }

    // Carry over non-grammar fields from NB
    if (nbEntry.cefr) nnEntry.cefr = nbEntry.cefr;
    if (nbEntry.frequency) nnEntry.frequency = nbEntry.frequency;
    if (nbEntry.tags) nnEntry.tags = nbEntry.tags;
    if (nbEntry.usageNotes) nnEntry.usageNotes = nbEntry.usageNotes;
    if (nbEntry._generatedFrom) nnEntry._generatedFrom = nbEntry._generatedFrom;

    nnEntries[nnId] = nnEntry;
  }

  // Sort alphabetically
  const sorted = {};
  for (const key of Object.keys(nnEntries).sort()) {
    sorted[key] = nnEntries[key];
  }

  const count = Object.keys(sorted).length;
  nnBanks[bankName] = count;

  // Write bank file
  const output = {
    _metadata: {
      language: 'nn',
      languageName: 'Norsk nynorsk',
      bank: bankName,
      generatedAt: new Date().toISOString(),
      description: `Norwegian Nynorsk ${bankName} — generated from Bokmål via NB→NN transformation`,
      totalEntries: count,
      enrichedEntries: enrichedCount,
      skeletonEntries: count - enrichedCount,
    },
    ...sorted,
  };

  const outPath = join(NN_BASE, `${bankName}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(`  Wrote ${outPath} (${count} entries, ${enrichedCount} enriched)`);
}

// Write manifest
const totalWords = Object.values(nnBanks).reduce((a, b) => a + b, 0);
const manifest = {
  _metadata: {
    language: 'nn',
    languageName: 'Norsk nynorsk',
    generatedAt: new Date().toISOString(),
    description: 'Norwegian Nynorsk lexicon — Phase 8, derived from Bokmål via NB→NN transformation',
  },
  summary: {
    totalWords,
    enrichedWords: stats.enriched,
    skeletonWords: totalWords - stats.enriched,
  },
  banks: nnBanks,
  sources: ['nb (transformed)'],
};

writeFileSync(join(NN_BASE, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

// Write NB→NN mapping for link generation
writeFileSync(
  join(NN_BASE, 'nb-to-nn-map.json'),
  JSON.stringify(nbToNnMap, null, 2) + '\n'
);

// Summary
console.log('\n=== Summary ===');
console.log(`  Total NB entries processed: ${stats.total}`);
console.log(`  NN entries generated:       ${totalWords}`);
console.log(`  Enriched (with grammar):    ${stats.enriched}`);
console.log(`  Skeleton (no grammar):      ${totalWords - stats.enriched}`);
for (const [bank, count] of Object.entries(nnBanks)) {
  console.log(`    ${bank}: ${count}`);
}
console.log(`\n  Output: ${NN_BASE}/`);
console.log(`  NB→NN mapping: ${join(NN_BASE, 'nb-to-nn-map.json')}`);
