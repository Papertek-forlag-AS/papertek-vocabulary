/**
 * Enrich DE verb conjugations and verb class.
 *
 * Handles:
 *   - Regular (weak) verbs with standard endings
 *   - Separable verbs (ab-, an-, auf-, aus-, ein-, mit-, vor-, zu-, etc.)
 *   - Inseparable verbs (be-, emp-, ent-, er-, ge-, ver-, zer-, etc.)
 *   - Strong/irregular verbs via lookup table
 *   - Mixed verbs (weak endings + stem change)
 *   - Special phonetic rules (-t/-d stems, -s/-ß/-z stems)
 *
 * Usage:
 *   node scripts/enrich-de-verbs.js [--dry-run]
 */

import fs from 'fs';

// ========== Strong/irregular verb stems ==========
// { infinitive (without separable prefix): { preteritumStem, participle, auxiliary, presensChange?, class } }
const STRONG_VERBS = {
  // a → u/ie
  fahren:   { pret: 'fuhr', part: 'gefahren', aux: 'sein', pres3: 'fährt', cls: 'strong' },
  tragen:   { pret: 'trug', part: 'getragen', aux: 'haben', pres3: 'trägt', cls: 'strong' },
  graben:   { pret: 'grub', part: 'gegraben', aux: 'haben', pres3: 'gräbt', cls: 'strong' },
  laden:    { pret: 'lud', part: 'geladen', aux: 'haben', pres3: 'lädt', cls: 'strong' },
  schlagen: { pret: 'schlug', part: 'geschlagen', aux: 'haben', pres3: 'schlägt', cls: 'strong' },
  wachsen:  { pret: 'wuchs', part: 'gewachsen', aux: 'sein', pres3: 'wächst', cls: 'strong' },
  waschen:  { pret: 'wusch', part: 'gewaschen', aux: 'haben', pres3: 'wäscht', cls: 'strong' },
  fallen:   { pret: 'fiel', part: 'gefallen', aux: 'sein', pres3: 'fällt', cls: 'strong' },
  halten:   { pret: 'hielt', part: 'gehalten', aux: 'haben', pres3: 'hält', cls: 'strong' },
  lassen:   { pret: 'ließ', part: 'gelassen', aux: 'haben', pres3: 'lässt', cls: 'strong' },
  schlafen: { pret: 'schlief', part: 'geschlafen', aux: 'haben', pres3: 'schläft', cls: 'strong' },
  laufen:   { pret: 'lief', part: 'gelaufen', aux: 'sein', pres3: 'läuft', cls: 'strong' },
  fangen:   { pret: 'fing', part: 'gefangen', aux: 'haben', pres3: 'fängt', cls: 'strong' },
  raten:    { pret: 'riet', part: 'geraten', aux: 'haben', pres3: 'rät', cls: 'strong' },
  braten:   { pret: 'briet', part: 'gebraten', aux: 'haben', pres3: 'brät', cls: 'strong' },
  backen:   { pret: 'backte', part: 'gebacken', aux: 'haben', cls: 'mixed' },

  // e → a/o
  geben:    { pret: 'gab', part: 'gegeben', aux: 'haben', pres3: 'gibt', cls: 'strong' },
  nehmen:   { pret: 'nahm', part: 'genommen', aux: 'haben', pres3: 'nimmt', cls: 'strong' },
  sprechen: { pret: 'sprach', part: 'gesprochen', aux: 'haben', pres3: 'spricht', cls: 'strong' },
  treffen:  { pret: 'traf', part: 'getroffen', aux: 'haben', pres3: 'trifft', cls: 'strong' },
  helfen:   { pret: 'half', part: 'geholfen', aux: 'haben', pres3: 'hilft', cls: 'strong' },
  sterben:  { pret: 'starb', part: 'gestorben', aux: 'sein', pres3: 'stirbt', cls: 'strong' },
  werfen:   { pret: 'warf', part: 'geworfen', aux: 'haben', pres3: 'wirft', cls: 'strong' },
  brechen:  { pret: 'brach', part: 'gebrochen', aux: 'haben', pres3: 'bricht', cls: 'strong' },
  lesen:    { pret: 'las', part: 'gelesen', aux: 'haben', pres3: 'liest', cls: 'strong' },
  sehen:    { pret: 'sah', part: 'gesehen', aux: 'haben', pres3: 'sieht', cls: 'strong' },
  essen:    { pret: 'aß', part: 'gegessen', aux: 'haben', pres3: 'isst', cls: 'strong' },
  vergessen:{ pret: 'vergaß', part: 'vergessen', aux: 'haben', pres3: 'vergisst', cls: 'strong' },
  messen:   { pret: 'maß', part: 'gemessen', aux: 'haben', pres3: 'misst', cls: 'strong' },
  treten:   { pret: 'trat', part: 'getreten', aux: 'sein', pres3: 'tritt', cls: 'strong' },
  stehlen:  { pret: 'stahl', part: 'gestohlen', aux: 'haben', pres3: 'stiehlt', cls: 'strong' },
  empfehlen:{ pret: 'empfahl', part: 'empfohlen', aux: 'haben', pres3: 'empfiehlt', cls: 'strong' },

  // ei → ie/i
  schreiben:{ pret: 'schrieb', part: 'geschrieben', aux: 'haben', cls: 'strong' },
  bleiben:  { pret: 'blieb', part: 'geblieben', aux: 'sein', cls: 'strong' },
  treiben:  { pret: 'trieb', part: 'getrieben', aux: 'haben', cls: 'strong' },
  steigen:  { pret: 'stieg', part: 'gestiegen', aux: 'sein', cls: 'strong' },
  reiten:   { pret: 'ritt', part: 'geritten', aux: 'sein', cls: 'strong' },
  streiten: { pret: 'stritt', part: 'gestritten', aux: 'haben', cls: 'strong' },
  schneiden:{ pret: 'schnitt', part: 'geschnitten', aux: 'haben', cls: 'strong' },
  greifen:  { pret: 'griff', part: 'gegriffen', aux: 'haben', cls: 'strong' },
  leiden:   { pret: 'litt', part: 'gelitten', aux: 'haben', cls: 'strong' },
  beißen:   { pret: 'biss', part: 'gebissen', aux: 'haben', cls: 'strong' },
  scheinen: { pret: 'schien', part: 'geschienen', aux: 'haben', cls: 'strong' },
  entscheiden: { pret: 'entschied', part: 'entschieden', aux: 'haben', cls: 'strong' },
  vergleichen: { pret: 'verglich', part: 'verglichen', aux: 'haben', cls: 'strong' },

  // ie → o
  biegen:   { pret: 'bog', part: 'gebogen', aux: 'haben', cls: 'strong' },
  bieten:   { pret: 'bot', part: 'geboten', aux: 'haben', cls: 'strong' },
  fliegen:  { pret: 'flog', part: 'geflogen', aux: 'sein', cls: 'strong' },
  fließen:  { pret: 'floss', part: 'geflossen', aux: 'sein', cls: 'strong' },
  gießen:   { pret: 'goss', part: 'gegossen', aux: 'haben', cls: 'strong' },
  schießen: { pret: 'schoss', part: 'geschossen', aux: 'haben', cls: 'strong' },
  schließen:{ pret: 'schloss', part: 'geschlossen', aux: 'haben', cls: 'strong' },
  ziehen:   { pret: 'zog', part: 'gezogen', aux: 'haben', cls: 'strong' },
  verlieren:{ pret: 'verlor', part: 'verloren', aux: 'haben', cls: 'strong' },
  frieren:  { pret: 'fror', part: 'gefroren', aux: 'haben', cls: 'strong' },
  riechen:  { pret: 'roch', part: 'gerochen', aux: 'haben', cls: 'strong' },
  genießen: { pret: 'genoss', part: 'genossen', aux: 'haben', cls: 'strong' },

  // i → a/u
  finden:   { pret: 'fand', part: 'gefunden', aux: 'haben', cls: 'strong' },
  singen:   { pret: 'sang', part: 'gesungen', aux: 'haben', cls: 'strong' },
  trinken:  { pret: 'trank', part: 'getrunken', aux: 'haben', cls: 'strong' },
  schwimmen:{ pret: 'schwamm', part: 'geschwommen', aux: 'sein', cls: 'strong' },
  gewinnen: { pret: 'gewann', part: 'gewonnen', aux: 'haben', cls: 'strong' },
  beginnen: { pret: 'begann', part: 'begonnen', aux: 'haben', cls: 'strong' },
  spinnen:  { pret: 'spann', part: 'gesponnen', aux: 'haben', cls: 'strong' },
  binden:   { pret: 'band', part: 'gebunden', aux: 'haben', cls: 'strong' },
  klingen:  { pret: 'klang', part: 'geklungen', aux: 'haben', cls: 'strong' },
  springen: { pret: 'sprang', part: 'gesprungen', aux: 'sein', cls: 'strong' },
  zwingen:  { pret: 'zwang', part: 'gezwungen', aux: 'haben', cls: 'strong' },
  sitzen:   { pret: 'saß', part: 'gesessen', aux: 'haben', cls: 'strong' },
  bitten:   { pret: 'bat', part: 'gebeten', aux: 'haben', cls: 'strong' },

  // Misc strong
  stehen:   { pret: 'stand', part: 'gestanden', aux: 'haben', cls: 'strong' },
  gehen:    { pret: 'ging', part: 'gegangen', aux: 'sein', cls: 'strong' },
  kommen:   { pret: 'kam', part: 'gekommen', aux: 'sein', cls: 'strong' },
  rufen:    { pret: 'rief', part: 'gerufen', aux: 'haben', cls: 'strong' },
  liegen:   { pret: 'lag', part: 'gelegen', aux: 'haben', cls: 'strong' },
  tun:      { pret: 'tat', part: 'getan', aux: 'haben', cls: 'strong' },
  hängen:   { pret: 'hing', part: 'gehangen', aux: 'haben', cls: 'strong' },
  heißen:   { pret: 'hieß', part: 'geheißen', aux: 'haben', cls: 'strong' },
  stoßen:   { pret: 'stieß', part: 'gestoßen', aux: 'haben', pres3: 'stößt', cls: 'strong' },
  laden:    { pret: 'lud', part: 'geladen', aux: 'haben', pres3: 'lädt', cls: 'strong' },
  schaffen: { pret: 'schuf', part: 'geschaffen', aux: 'haben', cls: 'strong' },
  wissen:   { pret: 'wusste', part: 'gewusst', aux: 'haben', pres3: 'weiß', cls: 'mixed' },

  // Mixed verbs (weak endings + stem change)
  bringen:  { pret: 'brachte', part: 'gebracht', aux: 'haben', cls: 'mixed' },
  denken:   { pret: 'dachte', part: 'gedacht', aux: 'haben', cls: 'mixed' },
  kennen:   { pret: 'kannte', part: 'gekannt', aux: 'haben', cls: 'mixed' },
  nennen:   { pret: 'nannte', part: 'genannt', aux: 'haben', cls: 'mixed' },
  rennen:   { pret: 'rannte', part: 'gerannt', aux: 'sein', cls: 'mixed' },
  senden:   { pret: 'sandte', part: 'gesandt', aux: 'haben', cls: 'mixed' },
  wenden:   { pret: 'wandte', part: 'gewandt', aux: 'haben', cls: 'mixed' },
  brennen:  { pret: 'brannte', part: 'gebrannt', aux: 'haben', cls: 'mixed' },

  // Irregular
  sein:     { pret: 'war', part: 'gewesen', aux: 'sein', pres: { ich: 'bin', du: 'bist', 'er/sie/es': 'ist', wir: 'sind', ihr: 'seid', 'sie/Sie': 'sind' }, cls: 'irregular' },
  haben:    { pret: 'hatte', part: 'gehabt', aux: 'haben', pres: { ich: 'habe', du: 'hast', 'er/sie/es': 'hat', wir: 'haben', ihr: 'habt', 'sie/Sie': 'haben' }, cls: 'irregular' },
  werden:   { pret: 'wurde', part: 'geworden', aux: 'sein', pres: { ich: 'werde', du: 'wirst', 'er/sie/es': 'wird', wir: 'werden', ihr: 'werdet', 'sie/Sie': 'werden' }, cls: 'irregular' },

  // Modals
  können:   { pret: 'konnte', part: 'gekonnt', aux: 'haben', pres: { ich: 'kann', du: 'kannst', 'er/sie/es': 'kann', wir: 'können', ihr: 'könnt', 'sie/Sie': 'können' }, cls: 'modal' },
  müssen:   { pret: 'musste', part: 'gemusst', aux: 'haben', pres: { ich: 'muss', du: 'musst', 'er/sie/es': 'muss', wir: 'müssen', ihr: 'müsst', 'sie/Sie': 'müssen' }, cls: 'modal' },
  dürfen:   { pret: 'durfte', part: 'gedurft', aux: 'haben', pres: { ich: 'darf', du: 'darfst', 'er/sie/es': 'darf', wir: 'dürfen', ihr: 'dürft', 'sie/Sie': 'dürfen' }, cls: 'modal' },
  sollen:   { pret: 'sollte', part: 'gesollt', aux: 'haben', pres: { ich: 'soll', du: 'sollst', 'er/sie/es': 'soll', wir: 'sollen', ihr: 'sollt', 'sie/Sie': 'sollen' }, cls: 'modal' },
  wollen:   { pret: 'wollte', part: 'gewollt', aux: 'haben', pres: { ich: 'will', du: 'willst', 'er/sie/es': 'will', wir: 'wollen', ihr: 'wollt', 'sie/Sie': 'wollen' }, cls: 'modal' },
  mögen:    { pret: 'mochte', part: 'gemocht', aux: 'haben', pres: { ich: 'mag', du: 'magst', 'er/sie/es': 'mag', wir: 'mögen', ihr: 'mögt', 'sie/Sie': 'mögen' }, cls: 'modal' },
};

// Verbs that use "sein" as auxiliary (motion/state change)
const SEIN_VERBS = new Set([
  'fahren', 'fliegen', 'gehen', 'kommen', 'laufen', 'reisen', 'reiten', 'schwimmen',
  'steigen', 'fallen', 'sinken', 'springen', 'treten', 'wachsen', 'sterben',
  'bleiben', 'sein', 'werden', 'passieren', 'geschehen', 'gelingen', 'rennen',
  'wandern', 'joggen', 'segeln', 'umziehen', 'einziehen', 'ausziehen',
]);

// Separable prefixes
const SEP_PREFIXES = ['ab','an','auf','aus','bei','da','ein','empor','fest','fort','frei',
  'her','hin','los','mit','nach','nieder','statt','um','vor','vorbei','weg','weiter',
  'zu','zurück','zusammen'];

// Inseparable prefixes (no ge- in participle)
const INSEP_PREFIXES = ['be','emp','ent','er','ge','hinter','miss','ver','zer'];

function detectPrefix(word) {
  // Check separable first (longer matches first)
  const sorted = [...SEP_PREFIXES].sort((a, b) => b.length - a.length);
  for (const p of sorted) {
    if (word.startsWith(p) && word.length > p.length + 2) {
      const base = word.slice(p.length);
      // Verify the base looks like a verb (ends in -en, -ern, -eln, -n)
      if (base.match(/[eaiou].*(?:en|ern|eln|n)$/)) {
        return { prefix: p, base, separable: true };
      }
    }
  }
  for (const p of INSEP_PREFIXES) {
    if (word.startsWith(p) && word.length > p.length + 2) {
      return { prefix: p, base: word.slice(p.length), separable: false };
    }
  }
  return { prefix: '', base: word, separable: false };
}

function getStem(infinitive) {
  if (infinitive.endsWith('eln')) return infinitive.slice(0, -3);
  if (infinitive.endsWith('ern')) return infinitive.slice(0, -3);
  if (infinitive.endsWith('en')) return infinitive.slice(0, -2);
  if (infinitive.endsWith('n')) return infinitive.slice(0, -1);
  return infinitive;
}

function needsEInsertion(stem) {
  // Stems ending in -t, -d, -chn, -ffn, -tm, -dm need -e- before endings starting with -st, -t
  return /[td]$/.test(stem) || /[ckf]n$/.test(stem) || /[td]m$/.test(stem);
}

function weakPresens(stem, suffix) {
  const e = needsEInsertion(stem) ? 'e' : '';
  const s = suffix ? ' ' + suffix : '';
  return {
    ich: stem + 'e' + s,
    du: stem + e + 'st' + s,
    'er/sie/es': stem + e + 't' + s,
    wir: stem + 'en' + s,
    ihr: stem + e + 't' + s,
    'sie/Sie': stem + 'en' + s,
  };
}

function weakPreteritum(stem, suffix) {
  const e = needsEInsertion(stem) ? 'e' : '';
  const s = suffix ? ' ' + suffix : '';
  return {
    ich: stem + e + 'te' + s,
    du: stem + e + 'test' + s,
    'er/sie/es': stem + e + 'te' + s,
    wir: stem + e + 'ten' + s,
    ihr: stem + e + 'tet' + s,
    'sie/Sie': stem + e + 'ten' + s,
  };
}

function strongPreteritum(pretStem, suffix) {
  const e = needsEInsertion(pretStem) ? 'e' : '';
  const s = suffix ? ' ' + suffix : '';
  return {
    ich: pretStem + s,
    du: pretStem + e + 'st' + s,
    'er/sie/es': pretStem + s,
    wir: pretStem + 'en' + s,
    ihr: pretStem + e + 't' + s,
    'sie/Sie': pretStem + 'en' + s,
  };
}

function perfektum(participle, aux) {
  const auxForms = aux === 'sein'
    ? { ich: 'bin', du: 'bist', 'er/sie/es': 'ist', wir: 'sind', ihr: 'seid', 'sie/Sie': 'sind' }
    : { ich: 'habe', du: 'hast', 'er/sie/es': 'hat', wir: 'haben', ihr: 'habt', 'sie/Sie': 'haben' };
  const former = {};
  for (const [p, a] of Object.entries(auxForms)) {
    former[p] = a + ' ' + participle;
  }
  return { participle, auxiliary: aux, former };
}

function conjugateVerb(word) {
  const { prefix, base, separable } = detectPrefix(word);
  const suffix = separable ? prefix : '';

  // Check if the base verb (or full word for inseparable) is in the lookup table
  const lookupKey = separable ? base : word;
  const strong = STRONG_VERBS[lookupKey] || STRONG_VERBS[base];

  if (strong) {
    // Strong/irregular/modal verb
    const cls = strong.cls;
    const aux = strong.aux || (SEIN_VERBS.has(base) || SEIN_VERBS.has(word) ? 'sein' : 'haben');

    // Presens
    let presens;
    if (strong.pres) {
      // Full custom presens (sein, haben, werden, modals)
      if (separable) {
        presens = {};
        for (const [p, f] of Object.entries(strong.pres)) {
          presens[p] = f + ' ' + prefix;
        }
      } else {
        presens = { ...strong.pres };
      }
    } else {
      // Generate presens with possible vowel change in du/er
      const stem = getStem(base);
      presens = weakPresens(stem, suffix);
      if (strong.pres3) {
        // Apply vowel change to du and er/sie/es
        presens['er/sie/es'] = strong.pres3 + (suffix ? ' ' + suffix : '');
        // du form: extract changed stem from er-form (strip -t ending), add -st
        const changedStem = strong.pres3.endsWith('t') ? strong.pres3.slice(0, -1) : strong.pres3;
        const duEnding = changedStem.endsWith('s') || changedStem.endsWith('ß') || changedStem.endsWith('z') ? 't' : 'st';
        presens['du'] = changedStem + duEnding + (suffix ? ' ' + suffix : '');
      }
    }

    // Preteritum
    let preteritum;
    if (cls === 'mixed' || cls === 'modal') {
      preteritum = weakPreteritum(strong.pret.replace(/e$/, ''), suffix);
      // Fix: mixed verbs use the pret stem directly
      const pretStem = strong.pret.endsWith('te') ? strong.pret.slice(0, -2) : strong.pret;
      preteritum = weakPreteritum(pretStem, suffix);
    } else {
      preteritum = strongPreteritum(strong.pret, suffix);
    }

    // Participle
    let part = strong.part;
    if (separable && !part.includes(prefix)) {
      // Insert prefix: geschrieben → aufgeschrieben, but check if it starts with ge
      if (part.startsWith('ge')) {
        part = prefix + part;
      } else {
        part = prefix + 'ge' + part.replace(/^ge/, '');
      }
    }

    return {
      conjugations: {
        presens: { former: presens, feature: 'grammar_de_presens' },
        preteritum: { former: preteritum, feature: 'grammar_de_preteritum' },
        perfektum: { ...perfektum(part, aux), feature: 'grammar_de_perfektum' },
      },
      verbClass: cls,
    };
  }

  // Regular (weak) verb
  const stem = getStem(base);
  const aux = SEIN_VERBS.has(base) || SEIN_VERBS.has(word) ? 'sein' : 'haben';

  // Participle: ge- + stem + -t (with separable: prefix + ge + stem + t)
  // Inseparable: no ge-
  let participle;
  const partStem = stem + (needsEInsertion(stem) ? 'e' : '') + 't';
  if (separable) {
    participle = prefix + 'ge' + partStem;
  } else if (INSEP_PREFIXES.some(p => word.startsWith(p))) {
    participle = getStem(word) + (needsEInsertion(getStem(word)) ? 'e' : '') + 't';
  } else if (word.endsWith('ieren')) {
    // -ieren verbs don't get ge-
    participle = getStem(word) + 't';
  } else {
    participle = 'ge' + partStem;
  }

  return {
    conjugations: {
      presens: { former: weakPresens(stem, suffix), feature: 'grammar_de_presens' },
      preteritum: { former: weakPreteritum(stem, suffix), feature: 'grammar_de_preteritum' },
      perfektum: { ...perfektum(participle, aux), feature: 'grammar_de_perfektum' },
    },
    verbClass: 'weak',
  };
}

// ========== Main ==========

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (dryRun) console.log('[DRY RUN]\n');

const bankPath = 'vocabulary/lexicon/de/verbbank.json';
const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
let enriched = 0, skipped = 0;

for (const [wordId, entry] of Object.entries(data)) {
  if (wordId === '_metadata') continue;
  if (entry.conjugations && entry.verbClass) { skipped++; continue; }

  const word = entry.word;
  if (!word || !word.match(/[a-zäöüß]/i)) { skipped++; continue; }

  try {
    const result = conjugateVerb(word);
    if (!entry.conjugations) data[wordId].conjugations = result.conjugations;
    if (!entry.verbClass) data[wordId].verbClass = result.verbClass;
    enriched++;
  } catch (e) {
    console.error(`  Error conjugating ${word}: ${e.message}`);
    skipped++;
  }
}

console.log(`Enriched: ${enriched} verbs`);
console.log(`Skipped: ${skipped} (already had both or not a verb)`);

// Show class distribution
const classDist = {};
for (const [k, v] of Object.entries(data)) {
  if (k === '_metadata') continue;
  const vc = typeof v.verbClass === 'object' ? v.verbClass.default : v.verbClass;
  classDist[vc || 'unknown'] = (classDist[vc || 'unknown'] || 0) + 1;
}
console.log('Verb class distribution:', classDist);

if (!dryRun && enriched > 0) {
  fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Written to ${bankPath}`);
}

// Show samples
if (enriched > 0) {
  const samples = ['machen_verb', 'aufstehen_verb', 'verstehen_verb', 'studieren_verb', 'arbeiten_verb'];
  for (const s of samples) {
    if (data[s]?.conjugations) {
      const c = data[s].conjugations;
      const p = c.presens?.former;
      const pr = c.preteritum?.former;
      const pf = c.perfektum;
      console.log(`\n${s} (${data[s].verbClass}): ${p?.ich} / ${pr?.ich} / ${pf?.participle}`);
    }
  }
}
