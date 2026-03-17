/**
 * Standardize Nynorsk verb infinitive forms to e-infinitiv (2012 norm).
 *
 * Transforms -a infinitiv endings to -e endings in:
 *   1. The `word` field (the verb stem, i.e. the first word)
 *   2. The `conjugations.presens.former.infinitiv` field
 *   3. The entry key (e.g. "snakka_verb" → "snakke_verb")
 *   4. The `audio` field (matches key)
 *   5. All NN link files (nn-* outbound keys, *-nn inbound values)
 *
 * Handles multi-word entries correctly:
 *   - "anstrenga seg" → "anstrenge seg" (reflexive verbs)
 *   - "finna opp" → "finne opp" (verbs with particles)
 *   - "laga mat" → "lage mat" (verbs with objects)
 *   - "vera redd" → "vere redd" (copula + adjective)
 *
 * Does NOT change:
 *   - Monosyllabic verbs (gå, stå, slå, ha, dra, etc.)
 *   - Compound verbs with monosyllabic roots (delta, foreta, overta, oppdra, etc.)
 *   - Verbs already ending in -e
 *   - "bli + participle" constructions (bli forelska stays as-is)
 *   - Non-infinitive conjugated forms (presens, preteritum, etc.)
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const LEXICON = join(import.meta.dirname, "..", "vocabulary", "lexicon");
const VERBBANK = join(LEXICON, "nn", "verbbank.json");

// ── helpers ──────────────────────────────────────────────────────────

const VOWELS = /[aeiouyæøå]/gi;

/** Returns true when a single word is monosyllabic. */
function isMonosyllabic(word) {
  const matches = word.match(VOWELS);
  return !matches || matches.length <= 1;
}

/**
 * Compound verbs built from monosyllabic root verbs (ta, dra).
 * These follow the root verb's conjugation and should NOT change,
 * since monosyllabic verbs keep their form in e-infinitiv.
 *   delta = del + ta (participate), foreta = fore + ta (undertake), etc.
 */
const COMPOUND_EXCLUSIONS = new Set([
  "anta",
  "delta",
  "foreta",
  "gjenta",
  "innta",
  "motta",
  "overta",
  "oppdra",
]);

/**
 * Find the verb word to transform in a word field.
 * The verb is the first word, unless it's an auxiliary like "bli".
 * Returns the verb string if it should be transformed, null otherwise.
 */
function findTransformableVerb(wordField) {
  // Split on whitespace, commas, parentheses
  const parts = wordField.split(/[\s,(]+/).filter(Boolean);
  const firstWord = parts[0];

  // Skip if first word is an auxiliary (the -a after it is a participle, not infinitive)
  if (firstWord === "bli") return null;

  // Skip compound verbs with monosyllabic roots (delta, foreta, oppdra, etc.)
  if (COMPOUND_EXCLUSIONS.has(firstWord)) return null;

  if (
    firstWord.endsWith("a") &&
    firstWord.length > 2 &&
    !isMonosyllabic(firstWord)
  ) {
    return firstWord;
  }

  return null;
}

/**
 * Transform a verb from -a to -e infinitiv.
 */
function aToE(verb) {
  return verb.slice(0, -1) + "e";
}

// ── 1. Transform verbbank.json ───────────────────────────────────────

const verbbank = JSON.parse(readFileSync(VERBBANK, "utf-8"));
const keyMap = {}; // old key → new key
let changedCount = 0;

const newVerbbank = { _metadata: verbbank._metadata };

for (const [key, entry] of Object.entries(verbbank)) {
  if (key === "_metadata") continue;

  const word = entry.word;
  const oldVerb = word ? findTransformableVerb(word) : null;

  if (!oldVerb) {
    newVerbbank[key] = entry;
    continue;
  }

  const newVerb = aToE(oldVerb);
  changedCount++;

  // Update word field: replace the verb in the word string
  const newWord = word.replace(oldVerb, newVerb);

  // Derive new key: replace the verb in the key
  const newKey = key.replace(oldVerb, newVerb);
  keyMap[key] = newKey;

  // Clone entry with updated word
  const updated = { ...entry, word: newWord };

  // Update infinitiv inside conjugations
  if (updated.conjugations?.presens?.former?.infinitiv) {
    const inf = updated.conjugations.presens.former.infinitiv;
    // The infinitiv field contains the same verb word (e.g. "å anstrenga seg")
    if (inf.includes(oldVerb)) {
      updated.conjugations = {
        ...updated.conjugations,
        presens: {
          ...updated.conjugations.presens,
          former: {
            ...updated.conjugations.presens.former,
            infinitiv: inf.replace(oldVerb, newVerb),
          },
        },
      };
    }
  }

  // Update audio filename if it matches old key
  if (updated.audio && updated.audio === key + ".mp3") {
    updated.audio = newKey + ".mp3";
  }

  newVerbbank[newKey] = updated;
}

writeFileSync(VERBBANK, JSON.stringify(newVerbbank, null, 2) + "\n");
console.log(`verbbank.json: standardized ${changedCount} verbs to e-infinitiv`);

// ── 2. Transform outbound link files (nn-*) ─────────────────────────

const outboundPairs = ["nn-de", "nn-en", "nn-es", "nn-fr", "nn-nb"];

for (const pair of outboundPairs) {
  const filePath = join(LEXICON, "links", pair, "verbbank.json");
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    continue;
  }

  const newData = {};
  let linkChanges = 0;

  for (const [key, value] of Object.entries(data)) {
    if (key === "_metadata") {
      newData[key] = value;
      continue;
    }
    if (keyMap[key]) {
      newData[keyMap[key]] = value;
      linkChanges++;
    } else {
      newData[key] = value;
    }
  }

  writeFileSync(filePath, JSON.stringify(newData, null, 2) + "\n");
  console.log(`${pair}/verbbank.json: renamed ${linkChanges} outbound keys`);
}

// ── 3. Transform inbound link files (*-nn) ──────────────────────────

const inboundPairs = ["de-nn", "en-nn", "es-nn", "fr-nn", "nb-nn"];

for (const pair of inboundPairs) {
  const filePath = join(LEXICON, "links", pair, "verbbank.json");
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    continue;
  }

  let linkChanges = 0;

  for (const [, value] of Object.entries(data)) {
    if (value?.primary && keyMap[value.primary]) {
      value.primary = keyMap[value.primary];
      linkChanges++;
    }
    if (value?.alternatives) {
      value.alternatives = value.alternatives.map((alt) => {
        if (keyMap[alt]) {
          linkChanges++;
          return keyMap[alt];
        }
        return alt;
      });
    }
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log(`${pair}/verbbank.json: renamed ${linkChanges} inbound values`);
}

// ── Summary ─────────────────────────────────────────────────────────

console.log(`\nKey mapping (${Object.keys(keyMap).length} entries):`);
for (const [old, newK] of Object.entries(keyMap)) {
  console.log(`  ${old} → ${newK}`);
}
console.log(`\nDone. ${changedCount} verbs standardized to e-infinitiv.`);
