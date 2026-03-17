/**
 * Standardize Nynorsk verb infinitive forms to e-infinitiv.
 *
 * Transforms -a infinitiv endings to -e endings in:
 *   1. The `word` field
 *   2. The `conjugations.presens.former.infinitiv` field
 *   3. The entry key (e.g. "snakka_verb" → "snakke_verb")
 *   4. The `audio` field (matches key)
 *   5. All NN link files (nn-* outbound keys, *-nn inbound values)
 *
 * Does NOT change:
 *   - Monosyllabic verbs (gå, stå, slå, ha, etc.)
 *   - Verbs already ending in -e
 *   - Non-infinitive conjugated forms (presens, preteritum, etc.)
 *   - The translation field
 *   - Multi-word entries where the last word is monosyllabic
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
 * For a word field (which may be multi-word or contain commas),
 * determine the "last infinitive word" — the actual verb to check.
 * Returns null if it should not be transformed.
 */
function getLastVerbWord(wordField) {
  // Remove parenthetical notes
  const cleaned = wordField.replace(/\(.*?\)/g, "").trim();
  // Split on comma to get the last synonym/variant
  const parts = cleaned.split(",").map((s) => s.trim());
  const lastPart = parts[parts.length - 1];
  // Get the last actual word
  const words = lastPart.split(/\s+/);
  return words[words.length - 1];
}

/**
 * Transform a word field: only change the trailing -a of the last verb word.
 * For multi-word entries like "bli forelska", changes to "bli forelske".
 * For "gå, å dra" where "dra" is monosyllabic, returns null (no change).
 */
function transformWordField(wordField) {
  if (!wordField.endsWith("a")) return null;

  const lastWord = getLastVerbWord(wordField);
  if (!lastWord || !lastWord.endsWith("a") || isMonosyllabic(lastWord)) {
    return null;
  }

  // Change the final -a to -e
  return wordField.slice(0, -1) + "e";
}

/**
 * Transform an infinitiv string like "å snakka" or "å bli forelska".
 * Same logic: only change if the last word is multi-syllable and ends in -a.
 */
function transformInfinitiv(inf) {
  if (!inf || !inf.endsWith("a")) return null;
  const lastWord = getLastVerbWord(inf);
  if (!lastWord || !lastWord.endsWith("a") || isMonosyllabic(lastWord)) {
    return null;
  }
  return inf.slice(0, -1) + "e";
}

/**
 * Derive the new key from old key + word transformation.
 * Keys use underscores where words use spaces.
 */
function deriveNewKey(oldKey, oldWord, newWord) {
  const oldKeyPrefix = oldWord.replace(/ /g, "_");
  const newKeyPrefix = newWord.replace(/ /g, "_");
  if (oldKey.startsWith(oldKeyPrefix + "_")) {
    return newKeyPrefix + "_" + oldKey.slice(oldKeyPrefix.length + 1);
  }
  // Fallback: just replace in key
  return oldKey.replace(oldKeyPrefix, newKeyPrefix);
}

// ── 1. Transform verbbank.json ───────────────────────────────────────

const verbbank = JSON.parse(readFileSync(VERBBANK, "utf-8"));
const keyMap = {}; // old key → new key
let changedCount = 0;

const newVerbbank = { _metadata: verbbank._metadata };

for (const [key, entry] of Object.entries(verbbank)) {
  if (key === "_metadata") continue;

  const word = entry.word;
  const newWord = word ? transformWordField(word) : null;

  if (!newWord) {
    newVerbbank[key] = entry;
    continue;
  }

  const newKey = deriveNewKey(key, word, newWord);
  keyMap[key] = newKey;
  changedCount++;

  // Clone entry with updated word
  const updated = { ...entry, word: newWord };

  // Update infinitiv inside conjugations
  if (updated.conjugations?.presens?.former?.infinitiv) {
    const newInf = transformInfinitiv(
      updated.conjugations.presens.former.infinitiv
    );
    if (newInf) {
      updated.conjugations = {
        ...updated.conjugations,
        presens: {
          ...updated.conjugations.presens,
          former: {
            ...updated.conjugations.presens.former,
            infinitiv: newInf,
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
  console.log(`${pair}/verbbank.json: renamed ${linkChanges} link keys`);
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
  console.log(`${pair}/verbbank.json: renamed ${linkChanges} link values`);
}

// ── Summary ─────────────────────────────────────────────────────────

console.log("\nKey mapping (old → new):");
for (const [old, newK] of Object.entries(keyMap)) {
  console.log(`  ${old} → ${newK}`);
}
console.log(`\nDone. ${changedCount} verbs standardized.`);
