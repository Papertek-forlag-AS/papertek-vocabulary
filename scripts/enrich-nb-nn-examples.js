/**
 * Add examples to NB and NN entries that don't have them.
 * Uses DE translations for sentence pairs since DE↔NB links are the richest.
 *
 * Usage:
 *   node scripts/enrich-nb-nn-examples.js [--dry-run] [nb|nn]
 */

import fs from 'fs';
import path from 'path';

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0;
  }
  return Math.abs(hash);
}

function pickTwo(templates, word, lang) {
  const h = hashCode(word);
  const i1 = h % templates.length;
  let i2 = (h * 7 + 3) % templates.length;
  if (i2 === i1) i2 = (i1 + 1) % templates.length;
  return [
    { sentence: templates[i1][0], translation: templates[i1][1], lang },
    { sentence: templates[i2][0], translation: templates[i2][1], lang },
  ];
}

function loadLinks(from, to) {
  const links = {};
  const dir = `vocabulary/lexicon/links/${from}-${to}`;
  if (!fs.existsSync(dir)) return links;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata') links[k] = v;
    }
  }
  return links;
}

function loadWords(lang) {
  const words = {};
  const dir = `vocabulary/lexicon/${lang}`;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('bank.json'))) {
    const data = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata') words[k] = v.word;
    }
  }
  return words;
}

// NB/NN example templates
function nbVerbExamples(word, nbWord, deWord) {
  const nb = nbWord || word;
  const de = deWord || word;
  return pickTwo([
    [`Jeg ${nb}r hver dag.`, `Ich ${de} jeden Tag.`],
    [`Hun ${nb}r mye.`, `Sie ${de} viel.`],
    [`Vi ${nb}r sammen.`, `Wir ${de} zusammen.`],
    [`Han ${nb}r hjemme.`, `Er ${de} zu Hause.`],
    [`Jeg liker å ${nb}.`, `Ich möchte ${de}.`],
    [`Det er viktig å ${nb}.`, `Es ist wichtig zu ${de}.`],
    [`Kan du ${nb}?`, `Kannst du ${de}?`],
    [`Jeg må ${nb}.`, `Ich muss ${de}.`],
    [`De ${nb}r bra.`, `Sie ${de} gut.`],
    [`Vi vil ${nb}.`, `Wir wollen ${de}.`],
  ], word, 'de');
}

function nbNounExamples(word, nbWord, deWord, genus) {
  const nb = nbWord || word;
  const de = deWord || word;
  const nbArt = genus === 'f' ? 'ei' : genus === 'n' ? 'et' : 'en';
  return pickTwo([
    [`${nb.charAt(0).toUpperCase() + nb.slice(1)} er stor.`, `${de} ist groß.`],
    [`Jeg har ${nbArt} ${nb}.`, `Ich habe ein${genus === 'f' ? 'e' : ''} ${de}.`],
    [`Hvor er ${nb}?`, `Wo ist ${de}?`],
    [`Jeg liker ${nb}.`, `Ich mag ${de}.`],
    [`Jeg trenger ${nbArt} ${nb}.`, `Ich brauche ein${genus === 'f' ? 'e' : ''} ${de}.`],
    [`${nb.charAt(0).toUpperCase() + nb.slice(1)} er her.`, `${de} ist hier.`],
    [`Jeg ser ${nbArt} ${nb}.`, `Ich sehe ein${genus === 'f' ? 'e' : ''} ${de}.`],
    [`Har du ${nbArt} ${nb}?`, `Hast du ein${genus === 'f' ? 'e' : ''} ${de}?`],
  ], word, 'de');
}

function nbAdjExamples(word, nbWord, deWord) {
  const nb = nbWord || word;
  const de = deWord || word;
  return pickTwo([
    [`Huset er ${nb}.`, `Das Haus ist ${de}.`],
    [`Det er veldig ${nb}.`, `Es ist sehr ${de}.`],
    [`Det er ikke ${nb}.`, `Es ist nicht ${de}.`],
    [`Hun er veldig ${nb}.`, `Sie ist sehr ${de}.`],
    [`Maten er ${nb}.`, `Das Essen ist ${de}.`],
    [`Det er ganske ${nb}.`, `Es ist ziemlich ${de}.`],
    [`Det er for ${nb}.`, `Es ist zu ${de}.`],
    [`Boka er ${nb}.`, `Das Buch ist ${de}.`],
  ], word, 'de');
}

function nbGeneralExamples(word, nbWord, deWord, type) {
  const nb = nbWord || word;
  const de = deWord || word;
  if (type === 'phrase' || type === 'expr') {
    return [
      { sentence: `${nb.charAt(0).toUpperCase() + nb.slice(1)}.`, translation: `${de.charAt(0).toUpperCase() + de.slice(1)}.`, lang: 'de' },
      { sentence: `Hun sier: «${nb}».`, translation: `Sie sagt: „${de}".`, lang: 'de' },
    ];
  }
  if (type === 'adv') {
    return pickTwo([
      [`Hun synger ${nb}.`, `Sie singt ${de}.`],
      [`Han snakker ${nb}.`, `Er spricht ${de}.`],
      [`Vi spiser ${nb}.`, `Wir essen ${de}.`],
      [`Jeg gjør det ${nb}.`, `Ich mache das ${de}.`],
    ], word, 'de');
  }
  return [
    { sentence: `Vi bruker «${nb}» på norsk.`, translation: `Man sagt „${de}" auf Deutsch.`, lang: 'de' },
  ];
}

// ========== MAIN ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const languages = args.filter(a => !a.startsWith('--'));

if (languages.length === 0) {
  console.log('Usage: node scripts/enrich-nb-nn-examples.js [--dry-run] <nb|nn>');
  process.exit(0);
}

if (dryRun) console.log('[DRY RUN]\n');

const deWords = loadWords('de');

for (const lang of languages) {
  console.log(`\n=== ${lang.toUpperCase()} ===`);

  // Load links to DE for translation pairs
  const langDeLinks = loadLinks(lang, 'de');
  // Also load link examples (DE→NB has the richest examples)
  const deLangLinks = loadLinks('de', lang);

  const lexiconDir = `vocabulary/lexicon/${lang}`;
  let generated = 0, fromLinks = 0;
  const bankFiles = fs.readdirSync(lexiconDir).filter(f => f.endsWith('bank.json'));

  for (const bankFile of bankFiles) {
    const bankPath = path.join(lexiconDir, bankFile);
    const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
    let modified = false;

    for (const [wordId, entry] of Object.entries(data)) {
      if (wordId === '_metadata') continue;
      if (entry.examples) continue;

      // Try to get DE translation for the pair
      const deLink = langDeLinks[wordId];
      const deId = deLink?.primary;
      const deWord = deId ? deWords[deId] : null;

      // Check if DE→lang link has examples
      if (deId && deLangLinks[deId]?.examples?.length > 0) {
        const linkExamples = deLangLinks[deId].examples;
        entry.examples = linkExamples.map(ex => ({
          sentence: ex.target || ex.source,
          translation: ex.source || ex.target,
          lang: 'de',
        }));
        fromLinks++;
        modified = true;
        continue;
      }

      // Generate template examples
      let examples;
      if (entry.type === 'verb') {
        examples = nbVerbExamples(entry.word, entry.word, deWord);
      } else if (entry.type === 'noun') {
        examples = nbNounExamples(entry.word, entry.word, deWord, entry.genus);
      } else if (entry.type === 'adj') {
        examples = nbAdjExamples(entry.word, entry.word, deWord);
      } else {
        examples = nbGeneralExamples(entry.word, entry.word, deWord, entry.type);
      }

      if (examples?.length > 0) {
        entry.examples = examples;
        generated++;
        modified = true;
      }
    }

    if (modified && !dryRun) {
      fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    }
  }

  console.log(`  From link examples: ${fromLinks}`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Total new: ${fromLinks + generated}`);
}
