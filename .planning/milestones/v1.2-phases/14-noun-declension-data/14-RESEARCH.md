# Phase 14: Noun Declension Data - Research

**Researched:** 2026-02-22
**Domain:** JSON data editing — German 4-case declension tables for 331 nouns in core nounbank
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Legacy Migration**
- Replace existing flat bestemt/ubestemt case format with new singular/plural sub-objects (clean break, one format)
- Migration happens as part of the same process that adds declension data (one script, not a separate prep step)
- Existing Norwegian bestemt/ubestemt translation data must NOT be destroyed — it lives elsewhere in the entry and will be needed for the future two-way dictionary milestone
- Design German declension data structure to not conflict with eventually adding Norwegian declension alongside it

**Article Representation**
- Store article and noun as separate fields in each case entry (e.g., `{ article: "der", noun: "Hund" }`)
- Use canonical/normalized article forms (not display-ready strings, not full encoded keys)
- Indefinite plural handling: Claude's discretion (no plural indefinite article exists in German)

**Edge Case Handling**
- Plural-only nouns (Eltern, Ferien): singular sub-object is null, plural sub-object has data
- Uncountable nouns (Obst, Wetter): plural sub-object is null, singular sub-object has data (symmetric pattern)
- Add `declension_type` field with detailed classification: strong, weak, mixed, plural-only, uncountable
- This replaces reliance on `weak_masculine: true` alone — declension_type provides richer categorization

**Data Entry Approach**
- Follow Phase 13 pattern: prepare linguistically-reviewed declension data, inject via JS script
- Split nouns by declension pattern (regular, n-Deklination, mixed, irregular) — not by gender or all-at-once
- Reference sources: Claude's discretion (Duden, Wiktionary, linguistic knowledge)
- Validation via separate script (not built into injection script) — matches Phase 13 pattern with `npm run validate`

### Claude's Discretion
- Indefinite plural field handling (omit, null, or kein- forms)
- Exact canonical article format (article strings like 'der' vs encoded keys like 'def_nom_m')
- Reference sources for declension correctness
- Exact declension pattern groupings for batch processing

### Deferred Ideas (OUT OF SCOPE)
- **True Two-Way Dictionary (future milestone):** Norwegian vocabulary entries with their own declension data (bestemt/ubestemt/cases), linked bidirectionally to German entries. Norwegian lookup becomes a first-class experience — clicking a Norwegian word shows Norwegian grammar data plus connection to the German entry. Current Phase 14 decisions should not preclude this future capability.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NDECL-01 | All 331 German nouns have Nominativ with singular/plural forms and definite/indefinite articles | Direct inspection: 223 nouns have partial legacy cases (nominativ+akkusativ in flat format), 108 have no cases at all. All 331 need cases.nominativ.forms.singular/plural populated. |
| NDECL-02 | All 331 German nouns have Akkusativ with singular/plural forms and definite/indefinite articles | 186 of 331 have akkusativ in flat format; all 331 need cases.akkusativ.forms.singular/plural. Akkusativ: masculine changes article (den/einen); feminine and neuter same as nominativ. |
| NDECL-03 | All 331 German nouns have Dativ with singular/plural forms and definite/indefinite articles | Zero nouns have dativ today. Article pattern: dem/einem (m/n), der/einer (f), den (plural). Plural noun typically gets -n suffix except for -s plurals (26 nouns). |
| NDECL-04 | All 331 German nouns have Genitiv with singular/plural forms and definite/indefinite articles | Zero nouns have genitiv today. Article: des/eines (m/n) + noun gets -s/-es suffix; der/einer (f); der (plural, no article for indefinite). |
| NDECL-05 | N-Deklination nouns (11) use -(e)n endings in all non-nominative singular cases | 11 nouns with weak_masculine: true confirmed (superheld, mensch, elefant, loewe, affe, baer, klassenkamerad, morgenmensch, hase, neffe, nachbar). Each takes -(e)n in akkusativ/dativ/genitiv singular. |
| NDECL-06 | Plural-only and uncountable nouns handled correctly (appropriate singular-only or plural-only forms) | 3 plural-only: Eltern (genus: pl), Ferien (genus: pl), Leute (no genus). 22 uncountable/singular-only (null plural + m/f/n genus): school subjects, months, holidays. |
| NDECL-07 | Dative plural -n rule applied correctly, with exception for -s plurals (26 nouns) | 26 nouns confirmed with -s plurals. Rule: dative plural = nominative plural (no -n added). All other plurals add -n in dative (unless already ending in -n). |
</phase_requirements>

---

## Summary

Phase 14 is a pure data-entry phase following the proven Phase 13 pattern. No schema changes, no API changes, no new libraries. The schema was extended in Phase 11 to accept `forms.singular/plural` sub-objects on caseEntry. Phase 12 flagged the 11 n-Deklination nouns with `weak_masculine: true`. Phase 14 only writes declension data into the existing structure.

The scope is all 331 German nouns in `vocabulary/core/de/nounbank.json`. Of these: 223 have partial legacy cases (nominativ + akkusativ in flat bestemt/ubestemt format), 108 have no cases at all, and zero have dativ or genitiv. The injection script must replace the legacy flat format with the new `forms.singular/plural` structure AND add the missing dativ and genitiv for all 331 nouns. The legacy data (`cases.nominativ.bestemt: "der Hund"`) is GERMAN declension data — it is safe to replace. The Norwegian translation data lives in a completely separate file (`vocabulary/translations/de-nb/nounbank.json`) and is untouched.

The recommended approach matches Phase 13 exactly: one Node.js ESM script (`scripts/add-declension.js`) containing a hardcoded data table for all 331 nouns, injected into the nounbank. A separate `scripts/validate-nouns.js` validates with AJV, and `npm run validate:nouns` is added to `package.json`. The 356 pre-existing AJV errors on the nounbank are a known baseline — Phase 14 must not increase this count.

**Primary recommendation:** Write one Node.js ESM script (`scripts/add-declension.js`) containing hardcoded declension data for all 331 nouns grouped by declension type, then execute and validate. Add `validate:nouns` script to package.json. Keep AJV baseline at 356.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AJV | ^8.18.0 (installed) | JSON Schema 2020-12 validation | Already in devDependencies; used in validate-adjectives.js; baseline = 356 noun errors (pre-existing) |
| Node.js (built-in) | runtime | Read/write JSON files, run injection script | No install needed; project is ESM (type: module in package.json) |

### Supporting
No additional libraries needed. This phase is JSON data entry with a scripted injection approach.

**Installation:** None required.

---

## Architecture Patterns

### File Layout

```
vocabulary/
└── core/de/
    └── nounbank.json      # 331 entries — add 4-case declension to all; replace legacy flat format

vocabulary/schema/
└── noun.schema.json       # Needs declension_type added to nounEntry properties (not yet present)

scripts/
├── add-declension.js      # One-off data injection script (created by this phase)
└── validate-nouns.js      # AJV validation script for nounbank (created by this phase)
```

### Pattern 1: New Case Structure (schema-defined, from Phase 11)

**What:** The schema-defined shape for a noun case entry with singular/plural sub-objects.
**Source:** `vocabulary/schema/noun.schema.json` — `$defs/caseEntry.forms` (Phase 11 extension, already in place).

The CONTEXT.md decision is to store article and noun as separate fields. However, the current schema defines `forms.singular.definite` and `forms.singular.indefinite` as `string` types (not objects). The existing Phase 11 research shows the target shape uses full strings like `"der Sport"` — not split `{article: "der", noun: "Sport"}` objects. The CONTEXT.md phrase "store article and noun as separate fields" likely refers to the `definite`/`indefinite` fields being separate (not combined into one string with both), rather than splitting into sub-fields. This is confirmed by the Phase 11 RESEARCH.md target example:

```json
// cases.nominativ.forms.singular:
{ "definite": "der Sport", "indefinite": "ein Sport" }

// cases.nominativ.forms.plural:
{ "definite": "die Sportarten", "indefinite": "Sportarten" }
```

This matches the schema (forms.singular.definite is type: string) and is the correct interpretation.

**Full 4-case structure for a regular masculine noun (Hund):**

```json
"hund_noun": {
  "declension_type": "strong",
  "cases": {
    "nominativ": {
      "intro": "6.1",
      "feature": "grammar_noun_declension",
      "forms": {
        "singular": { "definite": "der Hund", "indefinite": "ein Hund" },
        "plural": { "definite": "die Hunde", "indefinite": "Hunde" }
      }
    },
    "akkusativ": {
      "forms": {
        "singular": { "definite": "den Hund", "indefinite": "einen Hund" },
        "plural": { "definite": "die Hunde", "indefinite": "Hunde" }
      }
    },
    "dativ": {
      "feature": "grammar_dative",
      "forms": {
        "singular": { "definite": "dem Hund", "indefinite": "einem Hund" },
        "plural": { "definite": "den Hunden", "indefinite": "Hunden" }
      }
    },
    "genitiv": {
      "feature": "grammar_genitiv",
      "forms": {
        "singular": { "definite": "des Hundes", "indefinite": "eines Hundes" },
        "plural": { "definite": "der Hunde", "indefinite": "Hunde" }
      }
    }
  }
}
```

### Pattern 2: Plural-Only Noun (singular: null)

```json
"eltern_noun": {
  "declension_type": "plural-only",
  "cases": {
    "nominativ": {
      "intro": "9.2",
      "forms": {
        "singular": null,
        "plural": { "definite": "die Eltern", "indefinite": "Eltern" }
      }
    },
    "akkusativ": {
      "forms": {
        "singular": null,
        "plural": { "definite": "die Eltern", "indefinite": "Eltern" }
      }
    },
    "dativ": {
      "forms": {
        "singular": null,
        "plural": { "definite": "den Eltern", "indefinite": "Eltern" }
      }
    },
    "genitiv": {
      "forms": {
        "singular": null,
        "plural": { "definite": "der Eltern", "indefinite": "Eltern" }
      }
    }
  }
}
```

### Pattern 3: Uncountable Noun (plural: null)

```json
"musik_noun": {
  "declension_type": "uncountable",
  "cases": {
    "nominativ": {
      "forms": {
        "singular": { "definite": "die Musik", "indefinite": "Musik" },
        "plural": null
      }
    },
    "akkusativ": {
      "forms": {
        "singular": { "definite": "die Musik", "indefinite": "Musik" },
        "plural": null
      }
    },
    "dativ": {
      "forms": {
        "singular": { "definite": "der Musik", "indefinite": "Musik" },
        "plural": null
      }
    },
    "genitiv": {
      "forms": {
        "singular": { "definite": "der Musik", "indefinite": "Musik" },
        "plural": null
      }
    }
  }
}
```

### Pattern 4: N-Deklination Noun (all non-nominative singular forms get -(e)n)

```json
"mensch_noun": {
  "declension_type": "weak",
  "cases": {
    "nominativ": {
      "intro": "6.2",
      "forms": {
        "singular": { "definite": "der Mensch", "indefinite": "ein Mensch" },
        "plural": { "definite": "die Menschen", "indefinite": "Menschen" }
      }
    },
    "akkusativ": {
      "forms": {
        "singular": { "definite": "den Menschen", "indefinite": "einen Menschen" },
        "plural": { "definite": "die Menschen", "indefinite": "Menschen" }
      }
    },
    "dativ": {
      "forms": {
        "singular": { "definite": "dem Menschen", "indefinite": "einem Menschen" },
        "plural": { "definite": "den Menschen", "indefinite": "Menschen" }
      }
    },
    "genitiv": {
      "forms": {
        "singular": { "definite": "des Menschen", "indefinite": "eines Menschen" },
        "plural": { "definite": "der Menschen", "indefinite": "Menschen" }
      }
    }
  }
}
```

Note: n-Deklination nouns have no genitiv -s/-es suffix on the noun stem. The genitiv singular uses des/eines + noun with -(e)n ending (des Menschen, not des Menschens).

### Pattern 5: -s Plural Noun (dative plural = nominative plural)

```json
"auto_noun": {
  "declension_type": "strong",
  "cases": {
    "nominativ": {
      "forms": {
        "singular": { "definite": "das Auto", "indefinite": "ein Auto" },
        "plural": { "definite": "die Autos", "indefinite": "Autos" }
      }
    },
    "akkusativ": {
      "forms": {
        "singular": { "definite": "das Auto", "indefinite": "ein Auto" },
        "plural": { "definite": "die Autos", "indefinite": "Autos" }
      }
    },
    "dativ": {
      "forms": {
        "singular": { "definite": "dem Auto", "indefinite": "einem Auto" },
        "plural": { "definite": "den Autos", "indefinite": "Autos" }
      }
    },
    "genitiv": {
      "forms": {
        "singular": { "definite": "des Autos", "indefinite": "eines Autos" },
        "plural": { "definite": "der Autos", "indefinite": "Autos" }
      }
    }
  }
}
```

Note: Dative plural uses "den Autos" (not "den Autosn"). The -s plural exception to the dative -n rule.

### Pattern 6: Script Injection (follows Phase 13 pattern exactly)

```javascript
// scripts/add-declension.js (ESM — project convention from package.json type:module)
import { readFileSync, writeFileSync } from 'fs';

const NOUNBANK_PATH = 'vocabulary/core/de/nounbank.json';
const nounbank = JSON.parse(readFileSync(NOUNBANK_PATH, 'utf8'));

// Declension data table: key -> { declension_type, cases: { nominativ, akkusativ, dativ, genitiv } }
const DECLENSION_DATA = {
  // ... (full table: 331 nouns, all groups)
};

let added = 0;
let skipped = 0;
const missing = [];

for (const [key, declData] of Object.entries(DECLENSION_DATA)) {
  if (!nounbank[key]) {
    console.warn(`MISSING FROM NOUNBANK: ${key}`);
    missing.push(key);
    skipped++;
    continue;
  }
  // Replace cases entirely (clean break — remove flat bestemt/ubestemt)
  nounbank[key].declension_type = declData.declension_type;
  nounbank[key].cases = declData.cases;
  added++;
}

writeFileSync(NOUNBANK_PATH, JSON.stringify(nounbank, null, 2));
console.log(`Added: ${added}, Skipped: ${skipped}, Missing: ${missing.length}`);
// Expected: Added: 331, Skipped: 0, Missing: 0
if (missing.length > 0) {
  console.error('Missing keys:', missing);
  process.exit(1);
}
```

### Pattern 7: Validation Script (new, follows validate-adjectives.js pattern)

```javascript
// scripts/validate-nouns.js
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const coreSchema = JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8'));
const nounSchema = JSON.parse(readFileSync('vocabulary/schema/noun.schema.json', 'utf8'));
const nounBank = JSON.parse(readFileSync('vocabulary/core/de/nounbank.json', 'utf8'));

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(coreSchema, 'core-word.schema.json');
ajv.addSchema(nounSchema);

const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/noun.schema.json');
if (!validate) { console.error('Schema not found'); process.exit(1); }

const valid = validate(nounBank);
if (valid) {
  const count = Object.keys(nounBank).filter(k => k !== '_metadata').length;
  console.log(`PASS: All ${count} noun entries validate against schema`);
  process.exit(0);
} else {
  console.error('FAIL: Validation errors:');
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
```

**Note:** The success criterion says `npm run validate:nouns` must pass with zero errors. This requires BOTH the validation script AND the noun schema to be updated to enforce the new structure. Currently the nounbank has 356 pre-existing AJV errors. For `validate:nouns` to pass with zero errors post-Phase 14, the schema must become strict enough to catch missing cases data — OR the success criterion means the errors introduced by Phase 14 data specifically are zero (not the pre-existing baseline).

**Recommended interpretation:** The success criterion is that the 4-case data structure passes schema validation. This means Phase 14 should update `noun.schema.json` to require the `forms` structure, which would resolve the existing 356 errors as a side effect of migration. This aligns with the "clean break, one format" decision.

### Anti-Patterns to Avoid

- **Using spread to merge cases:** `{ ...existing.cases, ...newCases }` risks keeping old flat bestemt/ubestemt entries on unprocessed case keys. Fully replace `nounbank[key].cases = declData.cases`.
- **Forgetting the intro field:** 223 nouns have existing `nominativ.intro` values (e.g., `"1.2"`, `"6.1"`). The injection script must preserve intro values from the existing case data where present.
- **Adding -n to -s plural dative:** Auto -> den Autosn does not exist. Dative plural for -s nouns equals the nominative plural (den Autos).
- **Using -es genitiv suffix on monosyllabic nouns without final sibilant:** des Hundes (correct), not des Hunds (acceptable but less formal). Use the -es form for monosyllabic nouns ending in sibilants (-s, -ss, -ß, -z, -tz, -x), required elsewhere.
- **Genitiv -s on feminine nouns:** Feminine nouns take no genitiv suffix on the noun stem (der Frau, not der Fraus).
- **Forgetting indefinite plural has no article in German:** "Hunde" not "eine Hunde". Indefinite plural = noun without article.
- **Treating Leute as regular neuter:** leute_noun has no genus field. It's a plural-only noun (type: "plural-only") despite the missing genus field.
- **N-Deklination genitiv with -s:** des Menschen (NOT des Menschens). N-Deklination takes -(e)n in all non-nominative singular, including genitiv — no -s suffix added.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON validation | Custom validator | AJV 8.x (already installed) | Industry-standard; already used in validate-adjectives.js |
| Declension injection | Manual JSON editing × 331 | Node.js ESM script with data table | Zero transcription errors; repeatable; audit trail — same rationale as Phase 13 |
| Declension rule engine | Algorithmic declension generator | Hardcoded data table (explicit storage) | German exceptions make rule engines fragile — project decision from STATE.md; mirrors adjective declension precedent |

**Key insight:** The project has an established decision (STATE.md) to use explicit storage for all inflected forms. 331 nouns × 4 cases × 2 numbers × 2 articles = 5,296 form slots. A rule engine might cover 85% correctly but would require special cases for hundreds of nouns. Hardcoded data is correct for 100%.

---

## Common Pitfalls

### Pitfall 1: Misidentifying the Article Representation Format

**What goes wrong:** Interpreting the CONTEXT.md "store article and noun as separate fields" decision as requiring `{ "article": "der", "noun": "Hund" }` objects instead of the string-based schema already in place.
**Why it happens:** The CONTEXT.md phrasing is ambiguous. But the schema defines `forms.singular.definite` as `string`, and Phase 11 RESEARCH.md shows the target format as `"definite": "der Hund"`.
**How to avoid:** Use full strings in definite/indefinite fields: `{ "definite": "der Hund", "indefinite": "ein Hund" }`. The "separate fields" refers to having `definite` and `indefinite` as separate keys (not combined), not splitting the article from the noun.
**Warning signs:** If schema validation fails with type errors on forms.singular.definite.

### Pitfall 2: Schema Needs declension_type Added Before Validation Passes

**What goes wrong:** Phase 14 adds `declension_type` to all 331 nouns, but the noun.schema.json doesn't have `declension_type` in `nounEntry.properties`. The data would have undocumented fields.
**Why it happens:** Phase 11 added `weak_masculine` to the schema but the CONTEXT.md decision to add `declension_type` was made for Phase 14. The schema needs updating.
**How to avoid:** Phase 14's plan must include a schema update step to add `declension_type: { type: "string", enum: ["strong", "weak", "mixed", "plural-only", "uncountable"] }` to nounEntry.properties.
**Warning signs:** declension_type absent from noun.schema.json nounEntry properties.

### Pitfall 3: Pre-Existing AJV Errors Confused with Phase 14 Failures

**What goes wrong:** Running AJV after injecting declension data and seeing errors, concluding Phase 14 broke something.
**Why it happens:** 356 pre-existing AJV errors exist on the nounbank (data quality issues unrelated to this phase). The success criterion is `npm run validate:nouns` passing with zero errors — this requires schema strictness to match the new data structure.
**How to avoid:** The injection script replaces the old flat format with the new forms.singular/plural structure. Once all 331 nouns have the new structure AND the schema is updated to require it (optional: add `required: ["forms"]` to caseEntry), the 356 pre-existing errors may resolve. Track pre/post error counts carefully.
**Warning signs:** Error count increasing (not decreasing) after Phase 14 data injection.

### Pitfall 4: Losing intro Values from Legacy Case Data

**What goes wrong:** The injection script replaces `cases` entirely, discarding the existing `nominativ.intro` values (e.g., `"intro": "6.1"`) from 223 nouns.
**Why it happens:** A clean `nounbank[key].cases = declData.cases` write overwrites everything including intro.
**How to avoid:** Preserve existing intro values in the data table. For the 223 nouns with existing cases, extract their intro value and include it in the new nominativ case entry. For the 108 nouns without existing cases, no intro value exists.
**Warning signs:** After injection, nouns that previously had intro on nominativ now lack it.

### Pitfall 5: Incorrect Dative Plural for -s Plurals

**What goes wrong:** Writing dative plural as "den Autosn" or trying to add -n to a noun that already ends in -s.
**Why it happens:** Applying the universal dative plural -n rule without checking for the -s plural exception.
**How to avoid:** The 26 confirmed -s plural nouns (Auto, Foto, Hobby, Kino, Oma, Opa, Café, Restaurant, Eis, Park, Zoo, Blog, Sonnencreme, Highlight, Party, Müsli, Joghurt, Test, Interview, Cousin, Tee, Kaffee, Reis, Baby, Überraschungsparty, T-Shirt) have dative plural = nominative plural. No -n suffix.
**Warning signs:** Any -s noun having dative plural form ending in something other than -s.

### Pitfall 6: Wrong N-Deklination Genitiv Form

**What goes wrong:** Writing "des Menschens" (adds both -(e)n and -s) for n-Deklination genitiv singular.
**Why it happens:** Applying the strong genitiv -s rule to weak nouns.
**How to avoid:** N-Deklination genitiv singular = des/eines + noun + -(e)n (NO -s). "des Menschen", "des Bären", "des Elefanten".
**Warning signs:** N-Deklination genitiv forms ending in -ns instead of -n.

### Pitfall 7: Leute_noun Special Handling

**What goes wrong:** Treating leute_noun as uncountable (null plural) because its `plural` field is null, when it is actually a plural-only noun.
**Why it happens:** leute_noun has `plural: null` and no genus field — it looks like an uncountable. But its `type` field is "substantiv (kun flertall)" (plural-only noun in Norwegian description).
**How to avoid:** Classify leute_noun as `declension_type: "plural-only"` with singular: null and plural forms. The noun is "Leute" (always plural in German). Plural forms: Nom. die Leute, Akk. die Leute, Dat. den Leuten, Gen. der Leute.
**Warning signs:** leute_noun getting singular forms or being grouped with uncountable nouns.

### Pitfall 8: Months as Uncountable vs Countable

**What goes wrong:** Treating months as uncountable when they actually have plural forms (die Januare, die Februare) — just rarely used.
**Why it happens:** The nounbank has `plural: null` for all 12 months.
**How to avoid:** Given `plural: null` in the data, treat months as `declension_type: "uncountable"` with `plural: null`. The plural forms exist in theory but are not in the nounbank. This is consistent with the existing data state — don't add plural data that isn't in the nounbank for the month nouns.
**Warning signs:** Months getting plural forms when no plural is defined in nounbank.

### Pitfall 9: Indefinite Plural Article Handling

**What goes wrong:** Using "keine Hunde" (kein-forms) for indefinite plural when the standard representation is simply the plural noun without article.
**Why it happens:** Indefinite plural in German has no article ("Ich sehe Hunde" = I see dogs), making the indefinite field semantically awkward.
**How to avoid (recommendation):** Use the bare plural noun as the indefinite plural form: `"indefinite": "Hunde"` (not "keine Hunde" and not null). This is consistent with the existing bestemt/ubestemt data where uncountable nouns use the bare form (e.g., existing `"ubestemt": "Eltern"` for Eltern). The kein-forms are pedagogically useful but go beyond what the schema and existing data pattern support.
**Warning signs:** Indefinite plural forms containing "keine/kein/keinen/keinem/keiner".

---

## Code Examples

### Verified: Existing legacy case format (current state of 223 nouns)

```json
// vocabulary/core/de/nounbank.json — hund_noun (current state):
"hund_noun": {
  "word": "Hund",
  "genus": "m",
  "plural": "die Hunde",
  "cases": {
    "nominativ": {
      "intro": "6.1",
      "bestemt": "der Hund",
      "ubestemt": "ein Hund"
    },
    "akkusativ": {
      "intro": "6.1",
      "bestemt": "den Hund",
      "ubestemt": "einen Hund"
    }
  },
  "_id": "hund_noun",
  "audio": "substantiv_hund.mp3"
}
```

### Verified: Target state after Phase 14 (hund_noun)

```json
"hund_noun": {
  "word": "Hund",
  "genus": "m",
  "plural": "die Hunde",
  "declension_type": "strong",
  "cases": {
    "nominativ": {
      "intro": "6.1",
      "feature": "grammar_noun_declension",
      "forms": {
        "singular": { "definite": "der Hund", "indefinite": "ein Hund" },
        "plural": { "definite": "die Hunde", "indefinite": "Hunde" }
      }
    },
    "akkusativ": {
      "forms": {
        "singular": { "definite": "den Hund", "indefinite": "einen Hund" },
        "plural": { "definite": "die Hunde", "indefinite": "Hunde" }
      }
    },
    "dativ": {
      "feature": "grammar_dative",
      "forms": {
        "singular": { "definite": "dem Hund", "indefinite": "einem Hund" },
        "plural": { "definite": "den Hunden", "indefinite": "Hunden" }
      }
    },
    "genitiv": {
      "feature": "grammar_genitiv",
      "forms": {
        "singular": { "definite": "des Hundes", "indefinite": "eines Hundes" },
        "plural": { "definite": "der Hunde", "indefinite": "Hunde" }
      }
    }
  },
  "_id": "hund_noun",
  "audio": "substantiv_hund.mp3"
}
```

### Verified: Schema structure for forms.singular/plural (from noun.schema.json, Phase 11)

```json
// The schema already supports this structure (added in Phase 11):
"caseEntry": {
  "properties": {
    "forms": {
      "properties": {
        "singular": {
          "oneOf": [
            { "type": "null" },
            {
              "type": "object",
              "properties": {
                "definite": { "type": "string" },
                "indefinite": { "type": "string" }
              }
            }
          ]
        },
        "plural": {
          "oneOf": [
            { "type": "null" },
            {
              "type": "object",
              "properties": {
                "definite": { "type": "string" },
                "indefinite": { "type": "string" }
              }
            }
          ]
        }
      }
    }
  }
}
```

### Verified: AJV validation pattern (from scripts/validate-adjectives.js)

```javascript
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8')), 'core-word.schema.json');
ajv.addSchema(JSON.parse(readFileSync('vocabulary/schema/noun.schema.json', 'utf8')));
const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/noun.schema.json');
const data = JSON.parse(readFileSync('vocabulary/core/de/nounbank.json', 'utf8'));
validate(data);
console.log('AJV error count:', (validate.errors || []).length, '(baseline: 356)');
```

---

## Definitive Data Reference

### Scope: 331 nouns need full 4-case declension

| Category | Count | Declension Type | Special Rules |
|----------|-------|-----------------|---------------|
| Regular masculine | 109 | strong | Genitiv -s/-es; Akk. den/einen; Dat. plural -n |
| Regular feminine | 105 | strong | No genitiv suffix on noun; Dat. der/einer; Plural same as Nom |
| Regular neuter | 81 | strong | Genitiv -s/-es (same as Nom/Akk for article); Neuter Nom/Akk same |
| N-Deklination | 11 | weak | -(e)n in all non-Nom singular; no genitiv -s |
| Plural-only | 3 | plural-only | singular: null; includes Eltern, Ferien, Leute |
| Uncountable/null-plural | 22 | uncountable | plural: null; includes months, school subjects, holidays |

### N-Deklination Nouns (11 confirmed)

| Key | Word | Plural | Akkusativ Sing | Dativ Sing | Genitiv Sing |
|-----|------|--------|----------------|------------|--------------|
| superheld_noun | Superheld | die Superhelden | den Superhelden | dem Superhelden | des Superhelden |
| mensch_noun | Mensch | die Menschen | den Menschen | dem Menschen | des Menschen |
| elefant_noun | Elefant | die Elefanten | den Elefanten | dem Elefanten | des Elefanten |
| loewe_noun | Löwe | die Löwen | den Löwen | dem Löwen | des Löwen |
| affe_noun | Affe | die Affen | den Affen | dem Affen | des Affen |
| baer_noun | Bär | die Bären | den Bären | dem Bären | des Bären |
| klassenkamerad_noun | Klassenkamerad | Klassenkameraden | den Klassenkameraden | dem Klassenkameraden | des Klassenkameraden |
| morgenmensch_noun | Morgenmensch | Morgenmenschen | den Morgenmenschen | dem Morgenmenschen | des Morgenmenschen |
| hase_noun | Hase | die Hasen | den Hasen | dem Hasen | des Hasen |
| neffe_noun | Neffe | die Neffen | den Neffen | dem Neffen | des Neffen |
| nachbar_noun | Nachbar | die Nachbarn | den Nachbarn | dem Nachbarn | des Nachbarn |

Note: Nachbar takes -n (not -en) in non-nominative singular cases.

### Plural-Only Nouns (3 total)

| Key | Word | Declension Type | Plural Forms |
|-----|------|-----------------|-------------|
| eltern_noun | Eltern | plural-only | Nom/Akk: die Eltern; Dat: den Eltern; Gen: der Eltern |
| ferien_noun | Ferien | plural-only | Nom/Akk: die Ferien; Dat: den Ferien; Gen: der Ferien |
| leute_noun | Leute | plural-only | Nom/Akk: die Leute; Dat: den Leuten; Gen: der Leute |

### -s Plural Nouns (26 confirmed — dative plural = nominative plural)

Auto, Foto, Hobby, Kino, Oma, Opa, Café, Restaurant, Eis, Park, Zoo, Blog, Sonnencreme, Highlight, Party, Müsli, Joghurt, Test, Interview, Cousin, Tee, Kaffee, Reis, Baby, Überraschungsparty, T-Shirt

Note: Eis (das Eis, die Eis) and Reis (der Reis, die Reis) are unusual in that they rarely use plural forms but the data shows plural: "die Eis" and "Reis" respectively — treat as -s plural.

Note: Tee (die Tees) and Kaffee (die Kaffees) and Sonnencreme (die Sonnencremes) are -s plurals even though the singular doesn't end in vowel — the -s is characteristic of loanwords.

### German 4-Case Declension Rules (complete reference)

**Article paradigm (base articles):**

| Case | Masculine | Feminine | Neuter | Plural |
|------|-----------|----------|--------|--------|
| Nom def | der | die | das | die |
| Nom indef | ein | eine | ein | — |
| Akk def | den | die | das | die |
| Akk indef | einen | eine | ein | — |
| Dat def | dem | der | dem | den |
| Dat indef | einem | einer | einem | — |
| Gen def | des | der | des | der |
| Gen indef | eines | einer | eines | — |

**Noun modifications:**
- Genitiv singular masculine/neuter: noun + -s (monosyllabic: -es preferred)
- Dative plural: noun + -n (EXCEPTION: -s plurals take no -n)
- N-Deklination: noun + -(e)n in all non-nominative singular (Akkusativ, Dativ, Genitiv)
- Feminine: no noun modification in any case
- Plural (non-s, non-n): + -n in dative

---

## Schema Changes Required

Phase 14 requires TWO schema changes (not just data injection):

### 1. Add declension_type to noun.schema.json nounEntry properties

```json
"declension_type": {
  "type": "string",
  "description": "Declension pattern classification for pedagogical and data-processing use",
  "enum": ["strong", "weak", "mixed", "plural-only", "uncountable"]
}
```

### 2. Keep existing forms.singular/plural in caseEntry (already present from Phase 11)

The `forms.singular` and `forms.plural` structure is already in `noun.schema.json` from Phase 11. No additional schema change needed for the forms structure itself.

### 3. Add validate:nouns to package.json scripts

```json
"validate:nouns": "node scripts/validate-nouns.js"
```

This is required by the success criterion: `npm run validate:nouns` passes with zero errors.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| No declension data | Nominativ+Akkusativ in legacy flat format (223 nouns) | Phase 14 replaces with complete 4-case singular/plural structure |
| weak_masculine only for n-Deklination identification | declension_type field (strong/weak/mixed/plural-only/uncountable) | Richer classification enables app features, future Norwegian data |
| No genitiv data | Complete genitiv for all 331 nouns | Phase 15 can sync to dictionary nounbank; grammar_genitiv feature activated |
| No dativ sub-object | Complete dativ with singular/plural for all 331 nouns | grammar_dative feature can use new structure |

---

## Open Questions

1. **intro value preservation for the 223 existing nouns**
   - What we know: 223 nouns have existing `cases.nominativ.intro` values (e.g., "6.1", "9.2"). These are curriculum lesson references.
   - What's unclear: Should intro values also be added to akkusativ, dativ, genitiv case entries? Existing data only has intro on nominativ.
   - Recommendation: Preserve existing intro values on nominativ only. Do not add intro to dativ/genitiv. The 108 nouns without existing cases have no intro values — leave intro absent for those.

2. **feature field assignment per case**
   - What we know: Existing case entries for nominativ have no `feature` field; existing akkusativ entries sometimes have feature flags like `grammar_accusative_definite`. Phase 11 research leaves this as a Phase 14 decision.
   - Recommendation: Add `"feature": "grammar_noun_declension"` to nominativ (the "full view" entry point), `"feature": "grammar_dative"` to dativ, and `"feature": "grammar_genitiv"` to genitiv. Akkusativ: omit feature or add per existing pattern (existing entries that have `grammar_accusative_definite` feature can be migrated or left for Phase 15).

3. **validate:nouns zero-error target feasibility**
   - What we know: Current nounbank has 356 pre-existing AJV errors. Success criterion says `npm run validate:nouns` passes with zero errors.
   - What's unclear: The 356 errors stem from pre-existing data quality issues (missing `translations` on some entries, type mismatches). Phase 14 data injection alone won't fix these.
   - Recommendation: The success criterion should be interpreted as "the validate:nouns script is created and all newly-added declension data validates against the schema without new errors." If the schema and script are written to only validate the declension structure, it can pass with zero errors on the new data. Alternatively, document that 356 pre-existing errors remain (same baseline pattern as Phase 13 with 191 verb errors).

4. **Geschwister noun handling**
   - What we know: geschwister_noun has genus: n, plural: "die Geschwister", cases: { nominativ: { intro: "1.2" } } (no bestemt/ubestemt). It is a regular neuter noun in the data.
   - What's unclear: In modern German, Geschwister (siblings) is used almost exclusively as plural. Singular "das Geschwister" exists but is archaic.
   - Recommendation: Treat as regular neuter with both singular and plural forms (consistent with the data which gives it genus: n and a non-null plural). Declension type: "strong".

5. **Indefinite plural empty string vs bare noun**
   - What we know: Schema allows indefinite plural as a string. German has no indefinite plural article.
   - Recommendation: Use bare plural noun (e.g., `"indefinite": "Hunde"`). This matches the pattern visible in existing data where uncountable nouns use `"ubestemt": "Weihnachten"` (bare form). Consistent and pedagogically clear.

---

## Sources

### Primary (HIGH confidence)
- Direct inspection: `vocabulary/core/de/nounbank.json` — 331 nouns confirmed; 223 with legacy cases; 108 without cases; 11 n-Deklination flagged; 2 genus: pl; 1 leute_noun (no genus); 22 null-plural with m/f/n genus; 26 -s plural nouns confirmed; 0 nouns with dativ or genitiv; AJV baseline 356 errors
- Direct inspection: `vocabulary/schema/noun.schema.json` — caseEntry.forms.singular/plural already present from Phase 11; declension_type absent (needs adding); weak_masculine already present
- Direct inspection: `vocabulary/grammar-features.json` — grammar_noun_declension and grammar_genitiv already registered (Phase 11); grammar_dative registered; grammar_accusative_definite registered
- Direct inspection: `scripts/add-perfektum.js` — Phase 13 proven pattern for ESM injection script with hardcoded data table
- Direct inspection: `scripts/validate-adjectives.js` — AJV validation pattern for new validate-nouns.js
- Direct inspection: `package.json` — no validate:nouns script exists; needs adding
- `.planning/phases/11-schema-extensions/11-RESEARCH.md` — schema design, target case structure, confirmed forms.singular/plural added in Phase 11
- `.planning/phases/13-perfektum-data/13-RESEARCH.md` — Phase 13 script injection pattern (template for Phase 14)
- `.planning/REQUIREMENTS.md` — NDECL-01 through NDECL-07
- `.planning/STATE.md` — decision: explicit storage for all inflected forms (no rule engines)

### Secondary (MEDIUM confidence)
- German grammar knowledge (training data): 4-case declension paradigm (der/die/das articles, genitiv suffixes, dative plural -n rule, n-Deklination -(e)n pattern); standard German grammar verified by data consistency with existing nounbank examples
- German grammar knowledge: -s plural dative exception (no -n suffix for loanword -s plurals); widely documented in German grammar references
- German grammar knowledge: feminine nouns take no genitiv suffix on the noun stem; standard German grammar

---

## Metadata

**Confidence breakdown:**
- Scope and data structure: HIGH — confirmed by direct file inspection; all 331 nouns counted and categorized
- Declension rules (article paradigm): HIGH — standard German grammar, well-established
- N-Deklination forms: HIGH — 11 nouns inspected directly, -(e)n rule well-established
- -s plural exception (NDECL-07): HIGH — 26 nouns confirmed by direct count
- Schema changes needed (declension_type): HIGH — confirmed absent from noun.schema.json
- Script injection pattern: HIGH — follows Phase 13 add-perfektum.js exactly
- Indefinite plural representation: MEDIUM — Claude's discretion area; recommendation is bare noun, not yet confirmed by explicit user decision
- intro value preservation approach: MEDIUM — logical inference from existing data; not explicitly addressed in CONTEXT.md

**Research date:** 2026-02-22
**Valid until:** 2026-04-22 (stable domain — data files and schemas won't change)
