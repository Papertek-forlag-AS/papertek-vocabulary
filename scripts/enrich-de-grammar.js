/**
 * Comprehensive grammar enrichment for DE:
 *   1. Noun forms (article + word for all 4 forms)
 *   2. Adjective comparison (fill gaps)
 *   3. Explanations (Norwegian grammar descriptions)
 *   4. Examples (sentence pairs DE↔NB)
 *
 * Usage:
 *   node scripts/enrich-de-grammar.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';

// ========== GERMAN ARTICLES ==========

const DE_ARTICLES = {
  m: { def: 'der', indef: 'ein' },
  f: { def: 'die', indef: 'eine' },
  n: { def: 'das', indef: 'ein' },
};

function deNounForms(word, genus, plural) {
  const art = DE_ARTICLES[genus];
  if (!art) return null;
  // Some plurals already include "die" (e.g., "die Abende"), some don't (e.g., "Abbildungen")
  const pluralWithArt = plural
    ? (plural.startsWith('die ') ? plural : 'die ' + plural)
    : null;
  return {
    ubestemt: {
      entall: art.indef + ' ' + word,
      flertall: pluralWithArt,
    },
    bestemt: {
      entall: art.def + ' ' + word,
      flertall: pluralWithArt,
    },
  };
}

// ========== ADJECTIVE COMPARISON ==========

const DE_IRREGULAR_COMP = {
  gut: { komparativ: 'besser', superlativ: 'am besten' },
  viel: { komparativ: 'mehr', superlativ: 'am meisten' },
  gern: { komparativ: 'lieber', superlativ: 'am liebsten' },
  hoch: { komparativ: 'höher', superlativ: 'am höchsten' },
  nah: { komparativ: 'näher', superlativ: 'am nächsten' },
  groß: { komparativ: 'größer', superlativ: 'am größten' },
  gross: { komparativ: 'größer', superlativ: 'am größten' },
};

function deComparison(word) {
  const lower = word.toLowerCase();
  const irr = DE_IRREGULAR_COMP[lower];
  if (irr) return { positiv: word, komparativ: irr.komparativ, superlativ: irr.superlativ };

  // Regular: add -er for comparative, am -sten for superlative
  // Umlautable stems: a→ä, o→ö, u→ü for common short adjectives
  let komparativ = word + 'er';
  let superlativ = 'am ' + word + 'sten';

  // Adjectives ending in -e: drop e before -er/-sten
  if (word.endsWith('e')) {
    komparativ = word.slice(0, -1) + 'er';
    superlativ = 'am ' + word.slice(0, -1) + 'sten';
  }
  // Adjectives ending in -el: drop e in comparative
  if (word.endsWith('el')) {
    komparativ = word.slice(0, -2) + 'ler';
  }
  // Adjectives ending in -er: drop e in comparative
  if (word.endsWith('er') && word.length > 3) {
    komparativ = word.slice(0, -2) + 'rer';
  }
  // Adjectives ending in -d, -t, -s, -z, -ß, -sch: add -esten
  if (/[dtszß]$/.test(word) || word.endsWith('sch')) {
    superlativ = 'am ' + word + 'esten';
  }

  return { positiv: word, komparativ, superlativ };
}

// ========== EXPLANATIONS ==========

const GENUS_NAME = { m: 'maskulint (der)', f: 'feminint (die)', n: 'nøytralt (das)' };

function deNounExplanation(entry) {
  const g = GENUS_NAME[entry.genus] || '';
  const pl = entry.plural ? `Flertall: ${entry.plural}.` : 'Ingen flertallsform.';
  return { _description: `Tysk ${g} substantiv. ${pl}` };
}

function deVerbExplanation(entry) {
  const vc = entry.verbClass;
  let classDesc = '';
  if (typeof vc === 'object') {
    classDesc = vc.default === 'strong' ? 'Sterkt verb.' : vc.default === 'weak' ? 'Svakt verb.' : 'Uregelmessig verb.';
  } else if (typeof vc === 'string') {
    classDesc = vc === 'strong' ? 'Sterkt verb.' : vc === 'weak' ? 'Svakt verb.' : vc;
  }
  const pres = entry.conjugations?.presens?.former;
  let forms = '';
  if (pres) {
    const ich = pres.ich || pres['ich'] || '';
    const er = pres['er/sie/es'] || '';
    if (ich && er) forms = `Presens: ${ich} – ${er}.`;
  }
  const perf = entry.conjugations?.perfektum;
  let perfDesc = '';
  if (perf?.participle) {
    perfDesc = `Perfektum: ${perf.auxiliary || 'hat'} ${perf.participle}.`;
  }
  return { _description: `${classDesc} ${forms} ${perfDesc}`.replace(/\s+/g, ' ').trim() };
}

function deAdjExplanation(entry) {
  const comp = entry.comparison;
  if (!comp) return { _description: `Tysk adjektiv: ${entry.word}.` };
  return { _description: `Tysk adjektiv. Komparativ: ${comp.komparativ}. Superlativ: ${comp.superlativ}.` };
}

function deGeneralExplanation(entry) {
  const typeNames = {
    adv: 'adverb', prep: 'preposisjon', conj: 'konjunksjon', interj: 'interjeksjon',
    pron: 'pronomen', num: 'tallord', art: 'artikkel', phrase: 'frase',
    expr: 'uttrykk', propn: 'egennavn', interr: 'spørreord', contr: 'sammentrekning',
    possessiv: 'eiendomsord', general: 'ord',
  };
  // Get type from entry or from wordId suffix
  const typeName = typeNames[entry.type] || entry.type || 'ord';
  return { _description: `Tysk ${typeName}: ${entry.word}.` };
}

// ========== EXAMPLES ==========

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickTwo(templates, word) {
  const h = hashCode(word);
  const i1 = h % templates.length;
  let i2 = (h * 7 + 3) % templates.length;
  if (i2 === i1) i2 = (i1 + 1) % templates.length;
  return [
    { sentence: templates[i1][0], translation: templates[i1][1], lang: 'de' },
    { sentence: templates[i2][0], translation: templates[i2][1], lang: 'de' },
  ];
}

function deVerbExamples(word, entry, nbWord) {
  const pres = entry.conjugations?.presens?.former;
  const ich = pres?.ich || word;
  const er = pres?.['er/sie/es'] || word;
  const wir = pres?.wir || word;
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();

  return pickTwo([
    [`Ich ${ich} jeden Tag.`, `Jeg ${nbShort}r hver dag.`],
    [`Sie ${er} viel.`, `Hun ${nbShort}r mye.`],
    [`${er.charAt(0).toUpperCase() + er.slice(1)} du oft?`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)}r du ofte?`],
    [`Wir ${wir} zusammen.`, `Vi ${nbShort}r sammen.`],
    [`Er ${er} zu Hause.`, `Han ${nbShort}r hjemme.`],
    [`Ich möchte ${word}.`, `Jeg vil gjerne ${nbShort}.`],
    [`Es ist wichtig zu ${word}.`, `Det er viktig å ${nbShort}.`],
    [`Kannst du ${word}?`, `Kan du ${nbShort}?`],
    [`Ich muss ${word}.`, `Jeg må ${nbShort}.`],
    [`Wir wollen ${word}.`, `Vi vil ${nbShort}.`],
  ], word);
}

function deNounExamples(word, entry, nbWord) {
  const art = DE_ARTICLES[entry.genus];
  const def = art?.def || 'der';
  const indef = art?.indef || 'ein';
  const indefE = entry.genus === 'f' ? 'eine' : indef;
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();
  const nbArt = entry.genus === 'f' ? 'ei' : entry.genus === 'n' ? 'et' : 'en';

  return pickTwo([
    [`${def.charAt(0).toUpperCase() + def.slice(1)} ${word} ist groß.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er stor.`],
    [`Ich habe ${indefE} ${word}.`, `Jeg har ${nbArt} ${nbShort}.`],
    [`Wo ist ${def} ${word}?`, `Hvor er ${nbShort}?`],
    [`Ich mag ${def} ${word}.`, `Jeg liker ${nbShort}.`],
    [`Ich brauche ${indefE} ${word}.`, `Jeg trenger ${nbArt} ${nbShort}.`],
    [`${def.charAt(0).toUpperCase() + def.slice(1)} ${word} ist sehr schön.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er veldig fin.`],
    [`Ich habe kein${entry.genus === 'f' ? 'e' : ''} ${word}.`, `Jeg har ikke ${nbArt} ${nbShort}.`],
    [`Ich sehe ${indefE} ${word}.`, `Jeg ser ${nbArt} ${nbShort}.`],
    [`Hast du ${indefE} ${word}?`, `Har du ${nbArt} ${nbShort}?`],
    [`${def.charAt(0).toUpperCase() + def.slice(1)} ${word} ist hier.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er her.`],
  ], word);
}

function deAdjExamples(word, entry, nbWord) {
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();

  return pickTwo([
    [`Das Haus ist ${word}.`, `Huset er ${nbShort}.`],
    [`Es ist sehr ${word}.`, `Det er veldig ${nbShort}.`],
    [`Es ist nicht ${word}.`, `Det er ikke ${nbShort}.`],
    [`Das Buch ist ${word}.`, `Boka er ${nbShort}.`],
    [`Ich fühle mich ${word}.`, `Jeg føler meg ${nbShort}.`],
    [`Es ist ziemlich ${word}.`, `Det er ganske ${nbShort}.`],
    [`Alles ist ${word} hier.`, `Alt er ${nbShort} her.`],
    [`Das Essen ist ${word}.`, `Maten er ${nbShort}.`],
    [`Sie ist sehr ${word}.`, `Hun er veldig ${nbShort}.`],
    [`Es ist zu ${word}.`, `Det er for ${nbShort}.`],
  ], word);
}

function deGeneralExamples(word, entry, nbWord) {
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();

  if (entry.type === 'phrase' || entry.type === 'expr') {
    return [
      { sentence: `${word.charAt(0).toUpperCase() + word.slice(1)}.`, translation: `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)}.`, lang: 'de' },
      { sentence: `Sie sagt: „${word}".`, translation: `Hun sier: «${nbShort}».`, lang: 'de' },
    ];
  }
  if (entry.type === 'adv') {
    return pickTwo([
      [`Sie singt ${word}.`, `Hun synger ${nbShort}.`],
      [`Ich gehe ${word}.`, `Jeg går ${nbShort}.`],
      [`Er spricht ${word}.`, `Han snakker ${nbShort}.`],
      [`Wir essen ${word}.`, `Vi spiser ${nbShort}.`],
      [`Ich mache das ${word}.`, `Jeg gjør det ${nbShort}.`],
    ], word);
  }
  if (entry.type === 'prep') {
    return pickTwo([
      [`Die Katze ist ${word} dem Tisch.`, `Katten er ${nbShort} bordet.`],
      [`Ich gehe ${word} die Schule.`, `Jeg går ${nbShort} skolen.`],
      [`Es ist ${word} dem Haus.`, `Det er ${nbShort} huset.`],
    ], word);
  }
  if (entry.type === 'num') {
    return [
      { sentence: `Ich habe ${word} Bücher.`, translation: `Jeg har ${nbShort} bøker.`, lang: 'de' },
      { sentence: `Wir sind ${word} Personen.`, translation: `Vi er ${nbShort} personer.`, lang: 'de' },
    ];
  }
  if (entry.type === 'pron' || entry.type === 'possessiv') {
    return pickTwo([
      [`${word.charAt(0).toUpperCase() + word.slice(1)} ist mein Freund.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er vennen min.`],
      [`Kommst ${word}?`, `Kommer ${nbShort}?`],
      [`${word.charAt(0).toUpperCase() + word.slice(1)} wohnt hier.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} bor her.`],
    ], word);
  }
  // Fallback
  return [
    { sentence: `Man sagt „${word}" auf Deutsch.`, translation: `Man sier «${nbShort}» på tysk.`, lang: 'de' },
  ];
}

// ========== MAIN ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (dryRun) console.log('[DRY RUN]\n');

const nbWords = {};
for (const f of fs.readdirSync('vocabulary/lexicon/nb').filter(f => f.endsWith('bank.json'))) {
  const data = JSON.parse(fs.readFileSync('vocabulary/lexicon/nb/' + f, 'utf8'));
  for (const [k, v] of Object.entries(data)) {
    if (k !== '_metadata') nbWords[k] = v.word;
  }
}

const deNbLinks = {};
for (const f of fs.readdirSync('vocabulary/lexicon/links/de-nb').filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync('vocabulary/lexicon/links/de-nb/' + f, 'utf8'));
  for (const [k, v] of Object.entries(data)) {
    if (k !== '_metadata' && v.primary) deNbLinks[k] = v.primary;
  }
}

const stats = { nounForms: 0, comparison: 0, explanation: 0, examples: 0 };

const bankFiles = fs.readdirSync('vocabulary/lexicon/de').filter(f => f.endsWith('bank.json'));

for (const bankFile of bankFiles) {
  const bankPath = path.join('vocabulary/lexicon/de', bankFile);
  const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  let modified = false;

  for (const [wordId, entry] of Object.entries(data)) {
    if (wordId === '_metadata') continue;

    const nbId = deNbLinks[wordId];
    const nbWord = nbId ? nbWords[nbId] : null;
    const suffix = wordId.split('_').pop();

    // --- Noun forms ---
    if (entry.type === 'noun' && entry.genus && !entry.forms) {
      const forms = deNounForms(entry.word, entry.genus, entry.plural);
      if (forms) {
        entry.forms = forms;
        stats.nounForms++;
        modified = true;
      }
    }

    // --- Adjective comparison (fill gaps) ---
    if ((entry.type === 'adj' || suffix === 'adj') && !entry.comparison) {
      entry.comparison = deComparison(entry.word);
      stats.comparison++;
      modified = true;
    }

    // --- Explanation ---
    if (!entry.explanation) {
      if (entry.type === 'noun') {
        entry.explanation = deNounExplanation(entry);
      } else if (entry.type === 'verb' || entry.type === 'irregular' || entry.type === 'modal' || suffix === 'verb') {
        entry.explanation = deVerbExplanation(entry);
      } else if (entry.type === 'adj' || suffix === 'adj') {
        entry.explanation = deAdjExplanation(entry);
      } else {
        entry.explanation = deGeneralExplanation(entry);
      }
      stats.explanation++;
      modified = true;
    }

    // --- Examples ---
    if (!entry.examples) {
      let examples;
      if (entry.type === 'verb' || entry.type === 'irregular' || entry.type === 'modal' || suffix === 'verb') {
        examples = deVerbExamples(entry.word, entry, nbWord);
      } else if (entry.type === 'noun') {
        examples = deNounExamples(entry.word, entry, nbWord);
      } else if (entry.type === 'adj' || suffix === 'adj') {
        examples = deAdjExamples(entry.word, entry, nbWord);
      } else {
        examples = deGeneralExamples(entry.word, entry, nbWord);
      }
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

console.log(`\n=== DE Results (${stats.explanation} entries) ===`);
console.log(`  Noun forms: ${stats.nounForms}`);
console.log(`  Adj comparison (gaps filled): ${stats.comparison}`);
console.log(`  Explanations: ${stats.explanation}`);
console.log(`  Examples: ${stats.examples}`);
