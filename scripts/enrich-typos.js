/**
 * Generate common misspelling variants for entries that don't have typos.
 *
 * Language-specific rules based on common student errors:
 * - DE: umlaut omission, ß→ss, ck→k, ie→i, ei→ai
 * - ES: b/v, ll/y, accent omission, h omission, gue/gui
 * - FR: accent omission, double→single consonants, silent letters
 * - EN: double consonant errors, ie/ei, common misspellings
 * - NB/NN: double consonant errors, kj/skj, æ/ø/å omission
 *
 * Usage:
 *   node scripts/enrich-typos.js [--dry-run] [language...]
 */

import fs from 'fs';
import path from 'path';

// ========== TYPO GENERATORS ==========

function deTypos(word) {
  const typos = new Set();
  const w = word;

  if (w.includes('ä')) typos.add(w.replace(/ä/g, 'a'));
  if (w.includes('ö')) typos.add(w.replace(/ö/g, 'o'));
  if (w.includes('ü')) typos.add(w.replace(/ü/g, 'u'));
  if (w.includes('Ä')) typos.add(w.replace(/Ä/g, 'A'));
  if (w.includes('Ö')) typos.add(w.replace(/Ö/g, 'O'));
  if (w.includes('Ü')) typos.add(w.replace(/Ü/g, 'U'));
  if (w.includes('ß')) typos.add(w.replace(/ß/g, 'ss'));
  if (w.includes('ss')) typos.add(w.replace(/ss/g, 'ß'));
  if (w.includes('sch')) typos.add(w.replace('sch', 'sh'));
  if (/ie(?!ren$)/.test(w)) typos.add(w.replace('ie', 'i'));
  if (w.includes('ei')) typos.add(w.replace('ei', 'ai'));
  if (w.includes('ck')) typos.add(w.replace('ck', 'k'));
  for (const c of ['ff', 'll', 'mm', 'nn', 'pp', 'rr', 'ss', 'tt']) {
    if (w.includes(c)) typos.add(w.replace(c, c[0]));
  }
  if (w.includes('v')) typos.add(w.replace('v', 'f'));

  typos.delete(w);
  return [...typos].slice(0, 3);
}

function esTypos(word) {
  const typos = new Set();
  const w = word;

  if (w.includes('b')) typos.add(w.replace(/b/, 'v'));
  if (w.includes('v')) typos.add(w.replace(/v/, 'b'));
  if (w.includes('á')) typos.add(w.replace(/á/g, 'a'));
  if (w.includes('é')) typos.add(w.replace(/é/g, 'e'));
  if (w.includes('í')) typos.add(w.replace(/í/g, 'i'));
  if (w.includes('ó')) typos.add(w.replace(/ó/g, 'o'));
  if (w.includes('ú')) typos.add(w.replace(/ú/g, 'u'));
  if (w.includes('ñ')) typos.add(w.replace(/ñ/g, 'n'));
  if (w.includes('ll')) typos.add(w.replace('ll', 'y'));
  if (/y(?!$)/.test(w) && w.length > 2) typos.add(w.replace('y', 'll'));
  if (w.startsWith('h')) typos.add(w.slice(1));
  if (w.includes('z')) typos.add(w.replace(/z/, 's'));
  if (w.includes('qu')) typos.add(w.replace('qu', 'cu'));
  if (w.includes('gue')) typos.add(w.replace('gue', 'ge'));
  if (w.includes('gui')) typos.add(w.replace('gui', 'gi'));
  if (w.includes('rr')) typos.add(w.replace('rr', 'r'));

  typos.delete(w);
  return [...typos].slice(0, 3);
}

function frTypos(word) {
  const typos = new Set();
  const w = word;

  if (w.includes('é')) typos.add(w.replace(/é/g, 'e'));
  if (w.includes('è')) typos.add(w.replace(/è/g, 'e'));
  if (w.includes('ê')) typos.add(w.replace(/ê/g, 'e'));
  if (w.includes('à')) typos.add(w.replace(/à/g, 'a'));
  if (w.includes('â')) typos.add(w.replace(/â/g, 'a'));
  if (w.includes('î')) typos.add(w.replace(/î/g, 'i'));
  if (w.includes('ô')) typos.add(w.replace(/ô/g, 'o'));
  if (w.includes('ù')) typos.add(w.replace(/ù/g, 'u'));
  if (w.includes('û')) typos.add(w.replace(/û/g, 'u'));
  if (w.includes('ç')) typos.add(w.replace(/ç/g, 'c'));
  if (w.includes('œ')) typos.add(w.replace(/œ/g, 'oe'));
  for (const c of ['cc', 'ff', 'll', 'mm', 'nn', 'pp', 'rr', 'ss', 'tt']) {
    if (w.includes(c)) typos.add(w.replace(c, c[0]));
  }
  if (w.includes('ph')) typos.add(w.replace('ph', 'f'));
  if (w.includes('eau')) typos.add(w.replace('eau', 'o'));
  if (w.includes('ou')) typos.add(w.replace('ou', 'u'));
  if (w.includes('ai')) typos.add(w.replace('ai', 'e'));

  typos.delete(w);
  return [...typos].slice(0, 3);
}

function enTypos(word) {
  const typos = new Set();
  const w = word;

  for (const c of ['bb', 'cc', 'dd', 'ff', 'gg', 'll', 'mm', 'nn', 'pp', 'rr', 'ss', 'tt']) {
    if (w.includes(c)) typos.add(w.replace(c, c[0]));
  }
  if (w.includes('ie')) typos.add(w.replace('ie', 'ei'));
  if (w.includes('ei')) typos.add(w.replace('ei', 'ie'));
  if (w.includes('tion')) typos.add(w.replace('tion', 'sion'));
  if (w.includes('sion')) typos.add(w.replace('sion', 'tion'));
  if (w.includes('ght')) typos.add(w.replace('ght', 't'));
  if (w.includes('ph')) typos.add(w.replace('ph', 'f'));
  if (w.endsWith('ous')) typos.add(w.replace(/ous$/, 'us'));
  if (w.endsWith('ible')) typos.add(w.replace(/ible$/, 'able'));
  if (w.endsWith('able')) typos.add(w.replace(/able$/, 'ible'));
  if (w.endsWith('ence')) typos.add(w.replace(/ence$/, 'ance'));
  if (w.endsWith('ance')) typos.add(w.replace(/ance$/, 'ence'));
  if (w.includes('kn')) typos.add(w.replace('kn', 'n'));
  if (w.includes('wr')) typos.add(w.replace('wr', 'r'));
  if (w.includes('ous')) typos.add(w.replace('ous', 'us'));

  typos.delete(w);
  return [...typos].slice(0, 3);
}

function nbTypos(word) {
  const typos = new Set();
  const w = word;

  if (w.includes('æ')) typos.add(w.replace(/æ/g, 'e'));
  if (w.includes('ø')) typos.add(w.replace(/ø/g, 'o'));
  if (w.includes('å')) typos.add(w.replace(/å/g, 'a'));
  for (const c of ['bb', 'dd', 'ff', 'gg', 'kk', 'll', 'mm', 'nn', 'pp', 'rr', 'ss', 'tt']) {
    if (w.includes(c)) typos.add(w.replace(c, c[0]));
  }
  if (w.includes('kj')) typos.add(w.replace('kj', 'tj'));
  if (w.includes('skj')) typos.add(w.replace('skj', 'sj'));
  if (w.includes('ei')) typos.add(w.replace('ei', 'ai'));
  if (w.includes('gj')) typos.add(w.replace('gj', 'j'));
  if (w.startsWith('hv')) typos.add(w.replace('hv', 'v'));
  if (w.endsWith('d') && w.length > 3) typos.add(w.slice(0, -1));

  typos.delete(w);
  return [...typos].slice(0, 3);
}

const GENERATORS = { de: deTypos, en: enTypos, es: esTypos, fr: frTypos, nb: nbTypos, nn: nbTypos };

// ========== MAIN ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const languages = args.filter(a => !a.startsWith('--'));
if (languages.length === 0) { console.log('Usage: node scripts/enrich-typos.js [--dry-run] <lang...>'); process.exit(0); }
if (dryRun) console.log('[DRY RUN]\n');

for (const lang of languages) {
  const gen = GENERATORS[lang];
  if (!gen) continue;

  const dir = 'vocabulary/lexicon/' + lang;
  let added = 0, already = 0, noMatch = 0;

  for (const bankFile of fs.readdirSync(dir).filter(f => f.endsWith('bank.json'))) {
    const bankPath = path.join(dir, bankFile);
    const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
    let modified = false;

    for (const [wordId, entry] of Object.entries(data)) {
      if (wordId === '_metadata') continue;
      if (entry.typos?.length > 0) { already++; continue; }

      const word = entry.word;
      if (!word || word.length < 3) { noMatch++; continue; }

      const typos = gen(word);
      if (typos.length > 0) {
        entry.typos = typos;
        added++;
        modified = true;
      } else {
        noMatch++;
      }
    }

    if (modified && !dryRun) {
      fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    }
  }

  console.log(`${lang.toUpperCase()}: +${added} entries (${already} already had, ${noMatch} no patterns)`);
}
