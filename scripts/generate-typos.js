/**
 * generate-typos.js
 *
 * Phase 9: Populates typos and acceptedForms fields in lexicon entries.
 *
 * Generates common student spelling errors using linguistic rules:
 *   - German: ß/ss confusion, capitalization, umlauts, double consonants
 *   - Norwegian (NB/NN): common student errors, doubled/single consonants,
 *     silent letters, BM/NN confusion
 *   - Spanish: accent marks, ñ, b/v confusion
 *   - French: accent marks, silent letters
 *   - English: common misspellings
 *
 * Also generates acceptedForms for:
 *   - Case-insensitive variants
 *   - Simplified spellings (no accents/special chars)
 *   - Common alternative spellings
 *
 * Usage:
 *   node scripts/generate-typos.js           (all languages)
 *   node scripts/generate-typos.js de nb     (specific languages)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const LEXICON_BASE = join('vocabulary', 'lexicon');
const args = process.argv.slice(2);

// ═══════════════════════════════════════════════════════════════════════════
// GERMAN TYPO RULES
// ═══════════════════════════════════════════════════════════════════════════

function generateGermanTypos(word) {
  const typos = new Set();
  const accepted = new Set();
  const w = word;
  const lower = w.toLowerCase();

  // 1. ß ↔ ss confusion (most common German learner error)
  if (w.includes('ß')) {
    typos.add(w.replace(/ß/g, 'ss'));
    typos.add(lower.replace(/ß/g, 'ss'));
  }
  if (w.includes('ss')) {
    typos.add(w.replace(/ss/g, 'ß'));
  }

  // 2. Lowercase first letter (German nouns require capitals)
  if (w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase()) {
    typos.add(lower);
  }

  // 3. Umlaut confusion: ä↔ae, ö↔oe, ü↔ue
  if (w.includes('ä') || w.includes('Ä')) {
    const variant = w.replace(/ä/g, 'ae').replace(/Ä/g, 'Ae');
    accepted.add(variant);
    typos.add(w.replace(/ä/g, 'a').replace(/Ä/g, 'A')); // dropping dots
  }
  if (w.includes('ö') || w.includes('Ö')) {
    const variant = w.replace(/ö/g, 'oe').replace(/Ö/g, 'Oe');
    accepted.add(variant);
    typos.add(w.replace(/ö/g, 'o').replace(/Ö/g, 'O'));
  }
  if (w.includes('ü') || w.includes('Ü')) {
    const variant = w.replace(/ü/g, 'ue').replace(/Ü/g, 'Ue');
    accepted.add(variant);
    typos.add(w.replace(/ü/g, 'u').replace(/Ü/g, 'U'));
  }

  // 4. Common double consonant errors
  if (w.match(/([bdfgklmnprst])\1/)) {
    // Drop one consonant: Klasse → Klase
    typos.add(w.replace(/([bdfgklmnprst])\1/g, '$1'));
  }
  // Add double where single: Schule → Schuule (less common but happens)

  // 5. sch → sh (English influence)
  if (w.includes('sch')) {
    typos.add(w.replace(/sch/g, 'sh'));
  }

  // 6. ei ↔ ie confusion
  if (w.includes('ei') && !w.includes('ein')) {
    typos.add(w.replace(/ei/g, 'ie'));
  }
  if (w.includes('ie') && !w.includes('die') && !w.includes('sie')) {
    typos.add(w.replace(/ie/g, 'ei'));
  }

  // 7. v ↔ f confusion (Vater, vier)
  if (lower.startsWith('v')) {
    typos.add(w.replace(/^[Vv]/, m => m === 'V' ? 'F' : 'f'));
  }

  // 8. ch → ck, k confusion (only for -ch-, not sch/Sch)
  if (w.match(/[^sS]ch/) && !lower.includes('sch')) {
    typos.add(w.replace(/([^sS])ch/g, '$1ck'));
  }

  // Remove the original word from typos/accepted
  typos.delete(w);
  typos.delete(lower);
  accepted.delete(w);

  return {
    typos: [...typos].filter(t => t.length > 0),
    acceptedForms: [...accepted].filter(a => a.length > 0),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NORWEGIAN TYPO RULES (NB + NN)
// ═══════════════════════════════════════════════════════════════════════════

function generateNorwegianTypos(word, lang) {
  const typos = new Set();
  const accepted = new Set();
  const w = word;

  // 1. Double consonant errors (very common in Norwegian)
  // Missing double: "kjenner" → "kjener", "alle" → "ale"
  if (w.match(/([bdfgklmnprst])\1/)) {
    typos.add(w.replace(/([bdfgklmnprst])\1/g, '$1'));
  }
  // Extra double: "bake" → "bakke" (less common but happens)
  // Only for short-vowel words

  // 2. Silent d: "land" → "lan", "god" → "go"
  if (w.endsWith('d') && w.length > 3) {
    typos.add(w.slice(0, -1));
  }

  // 3. skj ↔ sk confusion (check BEFORE kj to avoid double-matching)
  if (w.includes('skj')) {
    typos.add(w.replace(/skj/g, 'sk'));
  } else if (w.includes('kj')) {
    // 4. kj ↔ k confusion (very common student error)
    // "kjøkken" → "kjøken" or "kjøkken" → "sjøkken"
    typos.add(w.replace(/kj/g, 'k'));
    typos.add(w.replace(/kj/g, 'sj'));
  }

  // 5. Norwegian special chars: æ, ø, å
  if (w.includes('æ')) {
    typos.add(w.replace(/æ/g, 'e'));
    accepted.add(w.replace(/æ/g, 'ae'));
  }
  if (w.includes('ø')) {
    typos.add(w.replace(/ø/g, 'o'));
    accepted.add(w.replace(/ø/g, 'oe'));
  }
  if (w.includes('å')) {
    typos.add(w.replace(/å/g, 'a'));
    accepted.add(w.replace(/å/g, 'aa'));
  }

  // 6. ng ↔ nk confusion
  if (w.includes('ng') && !w.includes('nge')) {
    typos.add(w.replace(/ng/g, 'nk'));
  }

  // 7. dt → t confusion in past tense
  if (w.endsWith('dt')) {
    typos.add(w.slice(0, -2) + 't');
  }

  // 8. hj-, gj- → j- (silent h/g)
  if (w.startsWith('hj')) {
    typos.add(w.replace(/^hj/, 'j'));
  }
  if (w.startsWith('gj') && !w.startsWith('gjø') && !w.startsWith('gje')) {
    typos.add(w.replace(/^gj/, 'j'));
  }

  // 9. BM ↔ NN confusion (for NN entries)
  if (lang === 'nn') {
    // Students might type BM forms
    if (w.includes('kv')) {
      typos.add(w.replace(/kv/g, 'hv')); // kvar → hvar
    }
    if (w.endsWith('leg')) {
      typos.add(w.replace(/leg$/, 'lig')); // vanleg → vanlig
    }
    if (w === 'ikkje') typos.add('ikke');
    if (w === 'noko') typos.add('noe');
    if (w === 'nokon') typos.add('noen');
    if (w === 'berre') typos.add('bare');
    if (w === 'eg') typos.add('jeg');
    if (w === 'ei') typos.add('en');
    if (w === 'eit') typos.add('et');
  }

  // 10. For NB entries, students might type NN forms
  if (lang === 'nb') {
    if (w === 'ikke') accepted.add('ikkje');
    if (w === 'noe') accepted.add('noko');
    if (w === 'bare') accepted.add('berre');
  }

  typos.delete(w);
  accepted.delete(w);

  return {
    typos: [...typos].filter(t => t.length > 1),
    acceptedForms: [...accepted].filter(a => a.length > 1),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SPANISH TYPO RULES
// ═══════════════════════════════════════════════════════════════════════════

function generateSpanishTypos(word) {
  const typos = new Set();
  const accepted = new Set();
  const w = word;

  // 1. Missing accent marks (most common)
  if (w.includes('á')) { typos.add(w.replace(/á/g, 'a')); accepted.add(w.replace(/á/g, 'a')); }
  if (w.includes('é')) { typos.add(w.replace(/é/g, 'e')); accepted.add(w.replace(/é/g, 'e')); }
  if (w.includes('í')) { typos.add(w.replace(/í/g, 'i')); accepted.add(w.replace(/í/g, 'i')); }
  if (w.includes('ó')) { typos.add(w.replace(/ó/g, 'o')); accepted.add(w.replace(/ó/g, 'o')); }
  if (w.includes('ú')) { typos.add(w.replace(/ú/g, 'u')); accepted.add(w.replace(/ú/g, 'u')); }

  // 2. ñ → n confusion
  if (w.includes('ñ')) {
    typos.add(w.replace(/ñ/g, 'n'));
    accepted.add(w.replace(/ñ/g, 'n'));
  }

  // 3. b ↔ v confusion (sound identical in Spanish)
  if (w.includes('b')) typos.add(w.replace(/b/g, 'v'));
  if (w.includes('v')) typos.add(w.replace(/v/g, 'b'));

  // 4. ll ↔ y confusion (yeísmo)
  if (w.includes('ll')) typos.add(w.replace(/ll/g, 'y'));

  // 5. h omission (silent in Spanish)
  if (w.includes('h')) {
    typos.add(w.replace(/h/g, ''));
  }

  // 6. ü → u (missing diaeresis)
  if (w.includes('ü')) {
    typos.add(w.replace(/ü/g, 'u'));
    accepted.add(w.replace(/ü/g, 'u'));
  }

  typos.delete(w);
  accepted.delete(w);

  return {
    typos: [...typos].filter(t => t.length > 1),
    acceptedForms: [...accepted].filter(a => a.length > 1),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FRENCH TYPO RULES
// ═══════════════════════════════════════════════════════════════════════════

function generateFrenchTypos(word) {
  const typos = new Set();
  const accepted = new Set();
  const w = word;

  // 1. Missing accents (most common)
  const accentMap = { 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'à': 'a', 'â': 'a', 'î': 'i', 'ï': 'i', 'ô': 'o', 'ù': 'u', 'û': 'u', 'ç': 'c' };
  let stripped = w;
  for (const [accented, plain] of Object.entries(accentMap)) {
    if (w.includes(accented)) {
      stripped = stripped.replace(new RegExp(accented, 'g'), plain);
    }
  }
  if (stripped !== w) {
    typos.add(stripped);
    accepted.add(stripped);
  }

  // 2. ç → c (missing cedilla)
  if (w.includes('ç')) {
    typos.add(w.replace(/ç/g, 'c'));
    accepted.add(w.replace(/ç/g, 'c'));
  }

  // 3. Silent final consonants: students might add pronunciation
  // (Less applicable for word prediction, skip)

  // 4. Double consonant confusion
  if (w.match(/([lnmrst])\1/)) {
    typos.add(w.replace(/([lnmrst])\1/g, '$1'));
  }

  typos.delete(w);
  accepted.delete(w);

  return {
    typos: [...typos].filter(t => t.length > 1),
    acceptedForms: [...accepted].filter(a => a.length > 1),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ENGLISH TYPO RULES
// ═══════════════════════════════════════════════════════════════════════════

function generateEnglishTypos(word) {
  const typos = new Set();
  const accepted = new Set();
  const w = word;

  // 1. Double consonant confusion
  if (w.match(/([bdfgklmnprst])\1/)) {
    typos.add(w.replace(/([bdfgklmnprst])\1/g, '$1'));
  }

  // 2. -tion/-sion confusion
  if (w.includes('tion')) typos.add(w.replace(/tion/g, 'sion'));
  if (w.includes('sion')) typos.add(w.replace(/sion/g, 'tion'));

  // 3. ie ↔ ei confusion
  if (w.includes('ie') && !w.includes('die')) typos.add(w.replace(/ie/g, 'ei'));
  if (w.includes('ei') && !w.includes('the')) typos.add(w.replace(/ei/g, 'ie'));

  // 4. -ence/-ance confusion
  if (w.endsWith('ence')) typos.add(w.replace(/ence$/, 'ance'));
  if (w.endsWith('ance')) typos.add(w.replace(/ance$/, 'ence'));

  typos.delete(w);
  accepted.delete(w);

  return {
    typos: [...typos].filter(t => t.length > 1),
    acceptedForms: [...accepted].filter(a => a.length > 1),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LANGUAGE DISPATCH
// ═══════════════════════════════════════════════════════════════════════════

function getGenerator(lang) {
  switch (lang) {
    case 'de': return generateGermanTypos;
    case 'nb': return (w) => generateNorwegianTypos(w, 'nb');
    case 'nn': return (w) => generateNorwegianTypos(w, 'nn');
    case 'es': return generateSpanishTypos;
    case 'fr': return generateFrenchTypos;
    case 'en': return generateEnglishTypos;
    default: return () => ({ typos: [], acceptedForms: [] });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

// Discover languages
let targetLangs;
if (args.length > 0) {
  targetLangs = args;
} else {
  targetLangs = readdirSync(LEXICON_BASE)
    .filter(f => {
      const p = join(LEXICON_BASE, f);
      return f !== 'links' && !f.endsWith('.json') && existsSync(p) &&
        statSync(p).isDirectory();
    });
}

console.log('Generating typos and accepted forms...\n');

let totalTypos = 0;
let totalAccepted = 0;
let totalEntries = 0;
let totalWithTypos = 0;

for (const lang of targetLangs) {
  const langPath = join(LEXICON_BASE, lang);
  if (!existsSync(langPath)) {
    console.log(`  Skipping ${lang} (not found)`);
    continue;
  }

  const generator = getGenerator(lang);
  const bankFiles = readdirSync(langPath).filter(f => f.endsWith('bank.json'));
  let langTypos = 0, langAccepted = 0, langEntries = 0, langWithTypos = 0;

  for (const bankFile of bankFiles) {
    const filePath = join(langPath, bankFile);
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    const { _metadata, ...entries } = data;
    let modified = false;

    for (const [id, entry] of Object.entries(entries)) {
      if (!entry.word) continue;
      langEntries++;

      // Clear previous typos/acceptedForms before regenerating
      delete entry.typos;
      delete entry.acceptedForms;

      const { typos, acceptedForms } = generator(entry.word);

      if (typos.length > 0) {
        entry.typos = typos;
        langTypos += typos.length;
        langWithTypos++;
      }

      if (acceptedForms.length > 0) {
        entry.acceptedForms = acceptedForms;
        langAccepted += acceptedForms.length;
      }

      modified = true; // Always write to clear stale data
    }

    if (modified) {
      writeFileSync(filePath, JSON.stringify({ _metadata, ...entries }, null, 2) + '\n');
    }
  }

  console.log(`  ${lang}: ${langEntries} entries, ${langWithTypos} with typos (${langTypos} typos, ${langAccepted} accepted forms)`);
  totalTypos += langTypos;
  totalAccepted += langAccepted;
  totalEntries += langEntries;
  totalWithTypos += langWithTypos;
}

console.log('\n=== Summary ===');
console.log(`  Total entries processed: ${totalEntries}`);
console.log(`  Entries with typos:      ${totalWithTypos}`);
console.log(`  Total typos generated:   ${totalTypos}`);
console.log(`  Total accepted forms:    ${totalAccepted}`);
console.log('\nRun `npm run build:lexicon-search-index` to rebuild search indices.');
