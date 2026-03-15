/**
 * Generate example sentences for ES and FR entries.
 *
 * Uses varied sentence templates per word type with NB translations.
 * Templates are designed for A1-B1 vocabulary learners.
 *
 * Usage:
 *   node scripts/generate-examples-es-fr.js [--dry-run] [es|fr]
 */

import fs from 'fs';
import path from 'path';

// ========== Load helpers ==========

function loadNbWords() {
  const words = {};
  const dir = 'vocabulary/lexicon/nb';
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('bank.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata') words[k] = v.word;
    }
  }
  return words;
}

function loadLinks(langFrom) {
  const links = {};
  const dir = `vocabulary/lexicon/links/${langFrom}-nb`;
  if (!fs.existsSync(dir)) return links;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const [k, v] of Object.entries(data)) {
      if (k !== '_metadata' && v.primary) links[k] = v.primary;
    }
  }
  return links;
}

// ========== SPANISH TEMPLATES ==========

function esVerbExamples(word, entry, nbWord) {
  const yo = entry.conjugations?.presens?.former?.yo || word;
  const el = entry.conjugations?.presens?.former?.['él/ella'] || word;
  const nosotros = entry.conjugations?.presens?.former?.nosotros || word;
  const nb = nbWord || word;
  // Pick first meaning if comma-separated
  const nbShort = nb.split(',')[0].trim();

  const templates = [
    [`Yo ${yo} todos los días.`, `Jeg ${nbShort}r hver dag.`],
    [`Ella ${el} mucho.`, `Hun ${nbShort}r mye.`],
    [`¿Tú ${entry.conjugations?.presens?.former?.tú || word} a menudo?`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)}r du ofte?`],
    [`Nosotros ${nosotros} juntos.`, `Vi ${nbShort}r sammen.`],
    [`Él ${el} en casa.`, `Han ${nbShort}r hjemme.`],
    [`Me gusta ${word}.`, `Jeg liker å ${nbShort}.`],
    [`Es importante ${word}.`, `Det er viktig å ${nbShort}.`],
    [`Quiero ${word} más.`, `Jeg vil ${nbShort} mer.`],
    [`¿Puedes ${word}?`, `Kan du ${nbShort}?`],
    [`Necesito ${word}.`, `Jeg trenger å ${nbShort}.`],
  ];
  return pickTwo(templates, word, 'es');
}

function esNounExamples(word, entry, nbWord) {
  const art = entry.genus === 'f' ? 'la' : 'el';
  const artIndef = entry.genus === 'f' ? 'una' : 'un';
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();

  const templates = [
    [`${art.charAt(0).toUpperCase() + art.slice(1)} ${word} es grande.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er stor.`],
    [`Tengo ${artIndef} ${word}.`, `Jeg har ${entry.genus === 'f' ? 'ei' : 'en'} ${nbShort}.`],
    [`¿Dónde está ${art} ${word}?`, `Hvor er ${nbShort}?`],
    [`Me gusta ${art} ${word}.`, `Jeg liker ${nbShort}.`],
    [`Necesito ${artIndef} ${word}.`, `Jeg trenger ${entry.genus === 'f' ? 'ei' : 'en'} ${nbShort}.`],
    [`${art.charAt(0).toUpperCase() + art.slice(1)} ${word} es muy bonito.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er veldig fin.`],
    [`No tengo ${artIndef} ${word}.`, `Jeg har ikke ${entry.genus === 'f' ? 'ei' : 'en'} ${nbShort}.`],
    [`Veo ${artIndef} ${word}.`, `Jeg ser ${entry.genus === 'f' ? 'ei' : 'en'} ${nbShort}.`],
    [`¿Tienes ${artIndef} ${word}?`, `Har du ${entry.genus === 'f' ? 'ei' : 'en'} ${nbShort}?`],
    [`${art.charAt(0).toUpperCase() + art.slice(1)} ${word} está aquí.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er her.`],
  ];
  return pickTwo(templates, word, 'es');
}

function esAdjExamples(word, entry, nbWord) {
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();

  const templates = [
    [`La casa es ${word}.`, `Huset er ${nbShort}.`],
    [`Es muy ${word}.`, `Det er veldig ${nbShort}.`],
    [`No es ${word}.`, `Det er ikke ${nbShort}.`],
    [`El libro es ${word}.`, `Boka er ${nbShort}.`],
    [`Me siento ${word}.`, `Jeg føler meg ${nbShort}.`],
    [`Es bastante ${word}.`, `Det er ganske ${nbShort}.`],
    [`Todo es ${word} aquí.`, `Alt er ${nbShort} her.`],
    [`La comida está ${word}.`, `Maten er ${nbShort}.`],
    [`Ella es muy ${word}.`, `Hun er veldig ${nbShort}.`],
    [`Es demasiado ${word}.`, `Det er for ${nbShort}.`],
  ];
  return pickTwo(templates, word, 'es');
}

function esGeneralExamples(word, entry, nbWord) {
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();

  if (entry.type === 'phrase' || entry.type === 'expr') {
    return [
      { sentence: `${word.charAt(0).toUpperCase() + word.slice(1)}.`, translation: `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)}.`, lang: 'es' },
      { sentence: `Ella dice: "${word}".`, translation: `Hun sier: «${nbShort}».`, lang: 'es' },
    ];
  }
  if (entry.type === 'adv') {
    return pickTwo([
      [`Ella canta ${word}.`, `Hun synger ${nbShort}.`],
      [`Voy ${word}.`, `Jeg går ${nbShort}.`],
      [`Él habla ${word}.`, `Han snakker ${nbShort}.`],
      [`Comemos ${word}.`, `Vi spiser ${nbShort}.`],
      [`Lo hago ${word}.`, `Jeg gjør det ${nbShort}.`],
    ], word, 'es');
  }
  if (entry.type === 'prep') {
    return pickTwo([
      [`El gato está ${word} la mesa.`, `Katten er ${nbShort} bordet.`],
      [`Voy ${word} la escuela.`, `Jeg går ${nbShort} skolen.`],
      [`Está ${word} la casa.`, `Det er ${nbShort} huset.`],
    ], word, 'es');
  }
  if (entry.type === 'num') {
    return [
      { sentence: `Tengo ${word} libros.`, translation: `Jeg har ${nbShort} bøker.`, lang: 'es' },
      { sentence: `Somos ${word} personas.`, translation: `Vi er ${nbShort} personer.`, lang: 'es' },
    ];
  }
  if (entry.type === 'pron') {
    return pickTwo([
      [`${word.charAt(0).toUpperCase() + word.slice(1)} es mi amigo.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er vennen min.`],
      [`¿${word.charAt(0).toUpperCase() + word.slice(1)} vienes?`, `Kommer ${nbShort}?`],
      [`${word.charAt(0).toUpperCase() + word.slice(1)} vive aquí.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} bor her.`],
    ], word, 'es');
  }
  // Fallback
  return [
    { sentence: `Uso "${word}" en español.`, translation: `Jeg bruker «${nbShort}» på spansk.`, lang: 'es' },
  ];
}

// ========== FRENCH TEMPLATES ==========

function frVerbExamples(word, entry, nbWord) {
  const je = entry.conjugations?.presens?.former?.je || word;
  const il = entry.conjugations?.presens?.former?.['il/elle'] || word;
  const nous = entry.conjugations?.presens?.former?.nous || word;
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();

  const templates = [
    [`${je.charAt(0).toUpperCase() + je.slice(1)} tous les jours.`, `Jeg ${nbShort}r hver dag.`],
    [`Elle ${il} beaucoup.`, `Hun ${nbShort}r mye.`],
    [`Est-ce que tu ${entry.conjugations?.presens?.former?.tu || word} souvent ?`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)}r du ofte?`],
    [`Nous ${nous} ensemble.`, `Vi ${nbShort}r sammen.`],
    [`Il ${il} à la maison.`, `Han ${nbShort}r hjemme.`],
    [`J'aime ${word}.`, `Jeg liker å ${nbShort}.`],
    [`Il est important de ${word}.`, `Det er viktig å ${nbShort}.`],
    [`Je veux ${word} plus.`, `Jeg vil ${nbShort} mer.`],
    [`Tu peux ${word} ?`, `Kan du ${nbShort}?`],
    [`Je dois ${word}.`, `Jeg må ${nbShort}.`],
  ];
  return pickTwo(templates, word, 'fr');
}

function frNounExamples(word, entry, nbWord) {
  const vowel = /^[aeéèêiîoôuûhœæ]/i.test(word);
  const artDef = vowel ? "l'" : (entry.genus === 'f' ? 'la ' : 'le ');
  const artIndef = entry.genus === 'f' ? 'une ' : 'un ';
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();
  const artDefCap = vowel ? "L'" : (entry.genus === 'f' ? 'La ' : 'Le ');

  const templates = [
    [`${artDefCap}${word} est grand${entry.genus === 'f' ? 'e' : ''}.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er stor.`],
    [`J'ai ${artIndef}${word}.`, `Jeg har ${entry.genus === 'f' ? 'ei' : 'en'} ${nbShort}.`],
    [`Où est ${artDef}${word} ?`, `Hvor er ${nbShort}?`],
    [`J'aime ${artDef}${word}.`, `Jeg liker ${nbShort}.`],
    [`Je cherche ${artIndef}${word}.`, `Jeg leter etter ${entry.genus === 'f' ? 'ei' : 'en'} ${nbShort}.`],
    [`${artDefCap}${word} est très joli${entry.genus === 'f' ? 'e' : ''}.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er veldig fin.`],
    [`Je n'ai pas de ${word}.`, `Jeg har ikke ${entry.genus === 'f' ? 'ei' : 'en'} ${nbShort}.`],
    [`Je vois ${artIndef}${word}.`, `Jeg ser ${entry.genus === 'f' ? 'ei' : 'en'} ${nbShort}.`],
    [`Tu as ${artIndef}${word} ?`, `Har du ${entry.genus === 'f' ? 'ei' : 'en'} ${nbShort}?`],
    [`${artDefCap}${word} est ici.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er her.`],
  ];
  return pickTwo(templates, word, 'fr');
}

function frAdjExamples(word, entry, nbWord) {
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();

  const templates = [
    [`La maison est ${word}.`, `Huset er ${nbShort}.`],
    [`C'est très ${word}.`, `Det er veldig ${nbShort}.`],
    [`Ce n'est pas ${word}.`, `Det er ikke ${nbShort}.`],
    [`Le livre est ${word}.`, `Boka er ${nbShort}.`],
    [`Je me sens ${word}.`, `Jeg føler meg ${nbShort}.`],
    [`C'est assez ${word}.`, `Det er ganske ${nbShort}.`],
    [`Tout est ${word} ici.`, `Alt er ${nbShort} her.`],
    [`Le repas est ${word}.`, `Måltidet er ${nbShort}.`],
    [`Elle est très ${word}.`, `Hun er veldig ${nbShort}.`],
    [`C'est trop ${word}.`, `Det er for ${nbShort}.`],
  ];
  return pickTwo(templates, word, 'fr');
}

function frGeneralExamples(word, entry, nbWord) {
  const nb = nbWord || word;
  const nbShort = nb.split(',')[0].trim();

  if (entry.type === 'phrase' || entry.type === 'expr') {
    return [
      { sentence: `${word.charAt(0).toUpperCase() + word.slice(1)}.`, translation: `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)}.`, lang: 'fr' },
      { sentence: `Elle dit : « ${word} ».`, translation: `Hun sier: «${nbShort}».`, lang: 'fr' },
    ];
  }
  if (entry.type === 'adv') {
    return pickTwo([
      [`Elle chante ${word}.`, `Hun synger ${nbShort}.`],
      [`Je vais ${word}.`, `Jeg går ${nbShort}.`],
      [`Il parle ${word}.`, `Han snakker ${nbShort}.`],
      [`Nous mangeons ${word}.`, `Vi spiser ${nbShort}.`],
      [`Je le fais ${word}.`, `Jeg gjør det ${nbShort}.`],
    ], word, 'fr');
  }
  if (entry.type === 'prep') {
    return pickTwo([
      [`Le chat est ${word} la table.`, `Katten er ${nbShort} bordet.`],
      [`Je vais ${word} l'école.`, `Jeg går ${nbShort} skolen.`],
      [`C'est ${word} la maison.`, `Det er ${nbShort} huset.`],
    ], word, 'fr');
  }
  if (entry.type === 'num' || entry.type === 'ordinal') {
    return [
      { sentence: `J'ai ${word} livres.`, translation: `Jeg har ${nbShort} bøker.`, lang: 'fr' },
      { sentence: `Nous sommes ${word} personnes.`, translation: `Vi er ${nbShort} personer.`, lang: 'fr' },
    ];
  }
  if (entry.type === 'pron') {
    return pickTwo([
      [`${word.charAt(0).toUpperCase() + word.slice(1)} est mon ami.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} er vennen min.`],
      [`${word.charAt(0).toUpperCase() + word.slice(1)} vient ?`, `Kommer ${nbShort}?`],
      [`${word.charAt(0).toUpperCase() + word.slice(1)} habite ici.`, `${nbShort.charAt(0).toUpperCase() + nbShort.slice(1)} bor her.`],
    ], word, 'fr');
  }
  // Fallback
  return [
    { sentence: `On utilise « ${word} » en français.`, translation: `Vi bruker «${nbShort}» på fransk.`, lang: 'fr' },
  ];
}

// ========== Utility ==========

// Deterministic pick based on word hash — ensures same word always gets same examples
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// lang must be passed explicitly
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

// ========== Main ==========

function processLanguage(lang, dryRun) {
  const lexiconDir = `vocabulary/lexicon/${lang}`;
  const nbWords = loadNbWords();
  const links = loadLinks(lang);

  const isEs = lang === 'es';
  let total = 0;
  let generated = 0;

  const bankFiles = fs.readdirSync(lexiconDir).filter(f => f.endsWith('bank.json'));

  for (const bankFile of bankFiles) {
    const bankPath = path.join(lexiconDir, bankFile);
    const data = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
    let modified = false;

    for (const [wordId, entry] of Object.entries(data)) {
      if (wordId === '_metadata') continue;
      total++;
      if (entry.examples) continue;

      const nbId = links[wordId];
      const nbWord = nbId ? nbWords[nbId] : null;

      let examples;
      const type = entry.type;

      if (type === 'verb' || type === 'verbe') {
        examples = isEs ? esVerbExamples(entry.word, entry, nbWord)
          : frVerbExamples(entry.word, entry, nbWord);
      } else if (type === 'noun') {
        examples = isEs ? esNounExamples(entry.word, entry, nbWord)
          : frNounExamples(entry.word, entry, nbWord);
      } else if (type === 'adj') {
        examples = isEs ? esAdjExamples(entry.word, entry, nbWord)
          : frAdjExamples(entry.word, entry, nbWord);
      } else {
        examples = isEs ? esGeneralExamples(entry.word, entry, nbWord)
          : frGeneralExamples(entry.word, entry, nbWord);
      }

      if (examples && examples.length > 0) {
        entry.examples = examples;
        generated++;
        modified = true;
      }
    }

    if (modified && !dryRun) {
      fs.writeFileSync(bankPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`  Updated ${bankFile}`);
    }
  }

  return { total, generated };
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const languages = args.filter(a => !a.startsWith('--'));

if (languages.length === 0) {
  console.log('Usage: node scripts/generate-examples-es-fr.js [--dry-run] <es|fr>');
  process.exit(0);
}

if (dryRun) console.log('[DRY RUN]\n');

for (const lang of languages) {
  console.log(`\n=== ${lang.toUpperCase()} ===`);
  const stats = processLanguage(lang, dryRun);
  console.log(`\n  Total: ${stats.total}, Examples generated: ${stats.generated}`);
}
