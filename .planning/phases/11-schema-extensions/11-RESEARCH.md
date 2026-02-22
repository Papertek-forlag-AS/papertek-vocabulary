# Phase 11: Schema Extensions - Research

**Researched:** 2026-02-22
**Domain:** JSON Schema 2020-12 extension (AJV 8.x, local vocabulary data files)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Perfektum data shape**
- `former` holds full compound forms: `"ich": "habe gemacht"` (not just the conjugated auxiliary)
- `participle` stored separately as a string (e.g., `"participle": "gemacht"`)
- `auxiliary` stored as string: `"haben"`, `"sein"`, or `"both"`
- Dual-auxiliary verbs (~6): single `former` block using the more common auxiliary, with `dual_auxiliary: true` flag
- `auxiliary_note` is an **object** keyed by auxiliary: `{ "haben": "transitive use (...)", "sein": "intransitive movement (...)" }`
- `modal_note` is a **string** explaining Ersatzinfinitiv behavior (only on modal verbs)
- `former` for modals contains the standard participle form (e.g., `"habe gekonnt"`), with `modal_note` explaining the alternative

**Case entry structure**
- **Replace** existing flat `bestemt`/`ubestemt` with new `forms` wrapper — no additive coexistence
- `forms` contains `singular` and `plural` sub-objects, each with `definite`/`indefinite` string values
- Plural-only nouns: `singular: null`, plural populated
- Uncountable nouns: `plural: null`, singular populated
- Both `singular` and `plural` always present (null when inapplicable)
- `forms` sits inside the case entry alongside `intro` and `feature`
- Existing nominativ-only case data will be migrated to the new structure in Phase 14

**Grammar feature naming**
- `grammar_noun_declension`: name "Kasusboyning", nameEn "Noun Declension", description "Kasusboyning av substantiv (nominativ, akkusativ, dativ, genitiv)"
- `grammar_genitiv`: name "Genitiv", nameEn "Genitive Case", description "Genitivboyning av substantiv (des/der/des)", **dependsOn** `grammar_noun_declension`
- Progressive disclosure works: existing per-case features (grammar_accusative_indefinite, grammar_dative, etc.) continue to control individual case visibility; grammar_noun_declension is the "full view" toggle

**Field naming language**
- New case sub-objects use **English naming**: `singular`/`plural` and `definite`/`indefinite`
- Existing `declension` field (Norwegian-style number forms) will also be migrated from `entall`/`flertall`/`bestemt`/`ubestemt` to `singular`/`plural`/`definite`/`indefinite` — migration happens in Phase 14
- Schema should support both naming conventions during transition (already does)

### Claude's Discretion
- `dataPath` values for the two new grammar features
- `appliesTo` and `category` for the two new grammar features
- Whether to remove Norwegian-named schema aliases after migration or keep both permanently

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHEMA-01 | Verb schema extended with `auxiliary` (haben/sein/both), `participle` (string), and `auxiliary_note` (object) optional fields in tenseConjugation | Confirmed: tenseConjugation in verb.schema.json has no additionalProperties constraint; adding optional properties is non-breaking. Also need `dual_auxiliary` (boolean) and `modal_note` (string) per CONTEXT.md decisions. |
| SCHEMA-02 | Verb schema extended with entry-level `inseparable` boolean flag | Confirmed: verbEntry has no additionalProperties constraint; adding optional boolean is non-breaking. No existing verbs have this field. |
| SCHEMA-03 | Noun schema extended with `singular`/`plural` sub-objects on caseEntry | Confirmed: Phase 11 adds these to caseEntry.forms as optional sub-objects. Existing data uses flat `bestemt`/`ubestemt` directly on caseEntry (NOT inside forms). Because caseEntry has no additionalProperties constraint, both patterns coexist without validation failure. Migration to new structure is Phase 14. The current `forms` wrapper in schema has only flat string keys (bestemt, ubestemt, definite, indefinite) — Phase 11 adds `singular` and `plural` as nullable object sub-keys. |
| SCHEMA-04 | Noun schema extended with entry-level `weak_masculine` boolean flag | Confirmed: nounEntry has no additionalProperties constraint; adding optional boolean is non-breaking. No existing nouns have this field. |
| SCHEMA-05 | `grammar_noun_declension` and `grammar_genitiv` features registered in grammar-features.json | Confirmed: grammar-features.json has 14 de-language features; these 2 new noun features follow the exact pattern of `grammar_adjective_declension` / `grammar_adjective_genitive` (parent+dependsOn pair). |
</phase_requirements>

---

## Summary

Phase 11 is a pure schema and configuration change phase — no data files are touched. All five requirements are JSON file edits: two schema files (`verb.schema.json`, `noun.schema.json`) and one config file (`grammar-features.json`).

The core technical challenge is that existing noun case data uses a legacy flat format (`bestemt`/`ubestemt` directly on caseEntry) while the new target format uses nested `forms.{singular,plural}.{definite,indefinite}`. Because neither schema has `additionalProperties: false` on these objects, both formats coexist without validation conflicts during the Phase 11→14 transition window. Phase 11 only needs to add schema documentation for the new fields; it does not need to remove support for the old fields.

A secondary complexity: the CONTEXT.md decision document says "replace" the flat fields (implying eventual removal), while REQUIREMENTS.md and the phase success criteria say "additive, no migration" for Phase 11. These are consistent: Phase 11 adds new field definitions without removing old ones; Phase 14 does the actual data migration which would then allow removing the old field aliases from the schema.

**Primary recommendation:** Edit three files (verb.schema.json, noun.schema.json, grammar-features.json). No new files needed. No code changes. No validation script changes needed for this phase since the current validate-adjectives.js pattern only covers adjectives, and the verbbank/nounbank schemas currently fail on pre-existing issues unrelated to this phase.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AJV | ^8.18.0 (installed) | JSON Schema 2020-12 validation | Already in project devDependencies; used in validate-adjectives.js |
| JSON Schema 2020-12 | spec | Schema format | Already used in all existing schema files (`$schema` header confirms) |

### Supporting

No additional libraries needed. This phase is pure JSON file editing.

**Installation:** None required — all dependencies already installed.

---

## Architecture Patterns

### Existing Schema File Layout

```
vocabulary/schema/
├── verb.schema.json          # verbEntry + conjugations + tenseConjugation
├── noun.schema.json          # nounEntry + declension + numberForms + formEntry + cases + caseEntry
├── adjective.schema.json     # adjectiveEntry + comparison + declension (most complete, use as pattern)
├── core-word.schema.json     # shared defs: translations, synonyms, explanations
├── dictionary-word.schema.json  # extended entry for dict words
├── curriculum-manifest.schema.json
└── language-pack.schema.json
```

### Pattern 1: Adding Optional Fields to Existing Schema Object

**What:** Add new optional properties to a `$defs` block without breaking existing data.
**When to use:** Existing data omits the new field; schema must not require it.

```json
// verb.schema.json — adding to tenseConjugation:
"tenseConjugation": {
  "type": "object",
  "properties": {
    "intro": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+$" },
    "feature": { "type": "string" },
    "former": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    },
    "auxiliary": {
      "type": "string",
      "description": "Auxiliary verb for Perfektum: haben, sein, or both",
      "enum": ["haben", "sein", "both"]
    },
    "participle": {
      "type": "string",
      "description": "Past participle form (e.g., gemacht, gegangen)"
    },
    "auxiliary_note": {
      "type": "object",
      "description": "Object keyed by auxiliary explaining when each is used (dual-auxiliary verbs)",
      "additionalProperties": { "type": "string" }
    },
    "dual_auxiliary": {
      "type": "boolean",
      "description": "True for verbs that use both haben and sein depending on usage"
    },
    "modal_note": {
      "type": "string",
      "description": "Explains Ersatzinfinitiv behavior (modal verbs only)"
    }
  },
  "required": ["former"]
}
```

### Pattern 2: Adding Nested Sub-Objects to Forms Wrapper

**What:** Add `singular`/`plural` as optional object-or-null sub-properties inside `caseEntry.forms`.
**When to use:** New 4-case declension data uses nested structure; old nominativ data uses flat structure.

```json
// noun.schema.json — caseEntry forms update:
"caseEntry": {
  "type": "object",
  "properties": {
    "intro": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+$" },
    "feature": { "type": "string" },
    "bestemt": { "type": "string", "description": "Legacy flat definite form (pre-migration)" },
    "ubestemt": { "type": "string", "description": "Legacy flat indefinite form (pre-migration)" },
    "forms": {
      "type": "object",
      "description": "Case forms with singular/plural breakdown",
      "properties": {
        "bestemt": { "type": "string" },
        "ubestemt": { "type": "string" },
        "definite": { "type": "string" },
        "indefinite": { "type": "string" },
        "singular": {
          "description": "Singular forms (null for plural-only nouns)",
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
          "description": "Plural forms (null for uncountable nouns)",
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

**Key insight:** Because neither `caseEntry` nor `caseEntry.forms` has `additionalProperties: false`, existing data that puts `bestemt`/`ubestemt` directly on `caseEntry` (not inside `forms`) continues to pass validation unchanged. The schema simply adds documented support for the new nested shape.

### Pattern 3: Adding Boolean Flag to Entry-Level Object

**What:** Add `inseparable` to verbEntry, `weak_masculine` to nounEntry.
**When to use:** Simple entry-level classification flags.

```json
// verbEntry — add after existing properties:
"inseparable": {
  "type": "boolean",
  "description": "True for verbs with inseparable prefixes (be-, er-, ge-, miss-, ver-, zer-, etc.) that never add ge- in participle"
}

// nounEntry — add after existing properties:
"weak_masculine": {
  "type": "boolean",
  "description": "True for n-Deklination masculine nouns that take -(e)n in all non-nominative cases"
}
```

### Pattern 4: Grammar Feature Registration

**What:** Add new feature objects to `grammar-features.json` under `de.features` array.
**When to use:** New grammar concepts that need progressive disclosure support.

```json
// Follows exact pattern of grammar_adjective_declension / grammar_adjective_genitive pair:
{
  "id": "grammar_noun_declension",
  "name": "Kasusbøyning",
  "nameEn": "Noun Declension",
  "description": "Kasusbøyning av substantiv (nominativ, akkusativ, dativ, genitiv)",
  "descriptionEn": "Noun case declension (nominative, accusative, dative, genitive)",
  "category": "nouns",
  "appliesTo": ["noun"],
  "dataPath": "cases"
},
{
  "id": "grammar_genitiv",
  "name": "Genitiv",
  "nameEn": "Genitive Case",
  "description": "Genitivbøyning av substantiv (des/der/des)",
  "descriptionEn": "Genitive case declension of nouns",
  "category": "nouns",
  "appliesTo": ["noun"],
  "dataPath": "cases.genitiv",
  "dependsOn": "grammar_noun_declension"
}
```

**Placement:** Insert after the existing `grammar_dative` feature entry. The `grammar_genitiv` feature uses `dependsOn: "grammar_noun_declension"` — identical pattern to `grammar_adjective_genitive` which `dependsOn: "grammar_adjective_declension"`.

### Anti-Patterns to Avoid

- **Adding `additionalProperties: false` to caseEntry or tenseConjugation:** Would immediately break existing data that has undocumented fields. Never add `additionalProperties: false` to any schema object in this phase.
- **Making new fields required:** All new fields (auxiliary, participle, inseparable, weak_masculine, etc.) must remain optional. No `required` array additions.
- **Changing `"required": ["former"]` on tenseConjugation:** The `former` field is required for all existing conjugations. Do not change this.
- **Removing `bestemt`/`ubestemt` from caseEntry.forms:** These existing properties in the schema's forms object must be kept — they document the legacy flat string format still used by 223 nouns until Phase 14 migration.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Custom validator | AJV 8.x (already installed) | AJV is the reference JSON Schema 2020-12 validator |
| Schema structure | Custom DSL | Standard JSON Schema `$defs` and `$ref` | All existing schemas use this pattern consistently |
| Null-or-object typing | Custom workaround | `oneOf: [ {type: "null"}, {type: "object", ...} ]` | JSON Schema 2020-12 standard pattern |

**Key insight:** This phase is entirely data/config file editing — no code to write.

---

## Common Pitfalls

### Pitfall 1: Breaking Existing Data With Schema Tightening
**What goes wrong:** Adding `additionalProperties: false` to any schema object invalidates existing data.
**Why it happens:** Schemas are written to be "complete" but existing data has undocumented fields.
**How to avoid:** Never add `additionalProperties: false` in this phase. Check that all existing data still validates after schema changes.
**Warning signs:** AJV errors of type `additionalProperties` after the change.

### Pitfall 2: Misidentifying Where `bestemt`/`ubestemt` Live
**What goes wrong:** The schema documents `caseEntry.forms.{bestemt, ubestemt}` but the actual data has `caseEntry.bestemt` and `caseEntry.ubestemt` DIRECTLY on the caseEntry object (not inside `forms`).
**Why it happens:** The schema was updated earlier to use a `forms` wrapper, but data was never migrated.
**How to avoid:** Add `bestemt` and `ubestemt` as documented properties on `caseEntry` directly (not only inside forms), so the schema matches reality during the transition period.
**Warning signs:** Running validation and finding no errors — but data having fields that aren't in the schema means the schema isn't enforcing the documented shape.

### Pitfall 3: Wrong `name` Spelling in grammar-features.json
**What goes wrong:** Using "Kasusboyning" without the Norwegian ø character.
**Why it happens:** ASCII fallback in typing.
**How to avoid:** Use correct Norwegian character: `"Kasusbøyning"` (ø not o). The CONTEXT.md shows "Kasusboyning" but this appears to be a transcription artifact — all other Norwegian feature names use correct characters (e.g., "Flertall", "Adjektivbøyning"). Use ø.
**Warning signs:** Inconsistency with other Norwegian feature names in the same file.

### Pitfall 4: Feature Insertion Position in grammar-features.json
**What goes wrong:** Adding grammar_genitiv before grammar_noun_declension — the parent feature must appear first.
**Why it happens:** Copy-paste ordering.
**How to avoid:** Insert grammar_noun_declension first, then grammar_genitiv immediately after, following the pattern of grammar_adjective_declension → grammar_adjective_genitive.
**Warning signs:** grammar_genitiv.dependsOn references a feature that doesn't exist yet in the array.

### Pitfall 5: Forgetting `dual_auxiliary` and `modal_note` in SCHEMA-01
**What goes wrong:** REQUIREMENTS.md SCHEMA-01 lists `auxiliary`, `participle`, `auxiliary_note` — but CONTEXT.md decisions also specify `dual_auxiliary: true` (boolean flag) and `modal_note` (string). If only the three listed in SCHEMA-01 are added, data in Phase 13 will have undocumented fields.
**Why it happens:** REQUIREMENTS.md was written before CONTEXT.md discussion.
**How to avoid:** Add all five Perfektum-related fields to tenseConjugation: `auxiliary`, `participle`, `auxiliary_note`, `dual_auxiliary`, `modal_note`.

---

## Code Examples

### Verified: Current verbbank data shape (no perfektum yet)
```json
// vocabulary/core/de/verbbank.json — sein_verb entry
{
  "sein_verb": {
    "word": "sein",
    "type": "strong",
    "conjugations": {
      "presens": {
        "former": { "ich": "bin", "du": "bist", "er/sie/es": "ist", "wir": "sind", "ihr": "seid", "sie/Sie": "sind" },
        "feature": "grammar_presens"
      },
      "preteritum": {
        "former": { "ich": "war", "du": "warst", "er/sie/es": "war", "wir": "waren", "ihr": "wart", "sie/Sie": "waren" },
        "feature": "grammar_preteritum"
      }
    },
    "_id": "sein_verb",
    "audio": "verb_sein.mp3"
  }
}
```

### Verified: Target perfektum shape after Phase 13 (what schema must accept in Phase 11)
```json
// What a perfektum tenseConjugation entry will look like post-Phase 13:
{
  "perfektum": {
    "feature": "grammar_perfektum",
    "auxiliary": "sein",
    "participle": "gewesen",
    "former": {
      "ich": "bin gewesen",
      "du": "bist gewesen",
      "er/sie/es": "ist gewesen",
      "wir": "sind gewesen",
      "ihr": "seid gewesen",
      "sie/Sie": "sind gewesen"
    }
  }
}
```

### Verified: Current nounbank caseEntry shape (flat, pre-migration)
```json
// vocabulary/core/de/nounbank.json — sport_noun entry
{
  "sport_noun": {
    "word": "Sport",
    "genus": "m",
    "plural": "die Sportarten",
    "cases": {
      "nominativ": {
        "intro": "9.3",
        "bestemt": "der Sport",
        "ubestemt": "Sport"
      },
      "akkusativ": {
        "intro": "9.3",
        "bestemt": "den Sport",
        "ubestemt": "Sport"
      }
    }
  }
}
```

### Verified: Target case shape after Phase 14 (what schema must accept in Phase 11)
```json
// What 4-case declension data will look like post-Phase 14:
{
  "sport_noun": {
    "cases": {
      "nominativ": {
        "intro": "9.3",
        "feature": "grammar_nominativ",
        "forms": {
          "singular": { "definite": "der Sport", "indefinite": "ein Sport" },
          "plural": { "definite": "die Sportarten", "indefinite": "Sportarten" }
        }
      },
      "akkusativ": {
        "forms": {
          "singular": { "definite": "den Sport", "indefinite": "einen Sport" },
          "plural": { "definite": "die Sportarten", "indefinite": "Sportarten" }
        }
      },
      "dativ": {
        "forms": {
          "singular": { "definite": "dem Sport", "indefinite": "einem Sport" },
          "plural": { "definite": "den Sportarten", "indefinite": "Sportarten" }
        }
      },
      "genitiv": {
        "forms": {
          "singular": { "definite": "des Sports", "indefinite": "eines Sports" },
          "plural": { "definite": "der Sportarten", "indefinite": "Sportarten" }
        }
      }
    }
  }
}
```

### Verified: Plural-only noun (Eltern) — null singular
```json
// After Phase 14 migration:
{
  "eltern_noun": {
    "genus": "pl",
    "cases": {
      "nominativ": {
        "forms": {
          "singular": null,
          "plural": { "definite": "die Eltern", "indefinite": "Eltern" }
        }
      }
    }
  }
}
```

### Verified: AJV validation pattern (from scripts/validate-adjectives.js)
```javascript
// Source: /scripts/validate-adjectives.js (the existing validation script pattern)
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const coreSchema = JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8'));
const nounSchema = JSON.parse(readFileSync('vocabulary/schema/noun.schema.json', 'utf8'));
const nounbank = JSON.parse(readFileSync('vocabulary/core/de/nounbank.json', 'utf8'));

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(coreSchema, 'core-word.schema.json');
ajv.addSchema(nounSchema);

const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/noun.schema.json');
const valid = validate(nounbank);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat `bestemt`/`ubestemt` on caseEntry | New: `forms.{singular,plural}.{definite,indefinite}` | Decided Phase 11 discussion (2026-02-22) | Enables 4-case declension with singular/plural breakdown; migration in Phase 14 |
| No Perfektum data | New: `tenseConjugation.auxiliary`, `.participle`, `.former` with full compound forms | Phase 11 schema, Phase 13 data | Full Perfektum support |

---

## Open Questions

1. **Norwegian ø in grammar feature name**
   - What we know: CONTEXT.md writes "Kasusboyning" (ASCII o) but all existing Norwegian feature names use correct characters
   - What's unclear: Was "Kasusboyning" intentional (user preference) or a typo in the discussion doc?
   - Recommendation: Use `"Kasusbøyning"` with ø to match the pattern of all other Norwegian names in the file (e.g., "Adjektivbøyning"). If user intended ASCII, they can confirm.

2. **`bestemt`/`ubestemt` placement in caseEntry schema**
   - What we know: Real data has these directly on caseEntry, but current schema only documents them inside `caseEntry.forms`
   - What's unclear: Should Phase 11 add `bestemt`/`ubestemt` as direct properties of `caseEntry` for schema accuracy?
   - Recommendation: Yes, add them as optional documented properties on `caseEntry` directly. This documents reality and removes the invisible mismatch between schema and data that exists today.

3. **`feature` field pattern for noun cases**
   - What we know: Existing noun case data (223 nouns) has zero entries with a `feature` field on caseEntry
   - What's unclear: When Phase 14 populates 4-case data, will each case use a `feature` field? (e.g., `"feature": "grammar_dative"`)
   - Recommendation: Ensure `feature` remains optional on caseEntry (it already is). Phase 14 planner should decide per-case feature assignment.

---

## Sources

### Primary (HIGH confidence)
- Direct file inspection: `/vocabulary/schema/verb.schema.json` — confirmed current tenseConjugation structure
- Direct file inspection: `/vocabulary/schema/noun.schema.json` — confirmed current caseEntry and forms structure
- Direct file inspection: `/vocabulary/grammar-features.json` — confirmed feature registration format and dependsOn pattern
- Direct data inspection: `/vocabulary/core/de/nounbank.json` (331 nouns) — confirmed all existing cases use flat `bestemt`/`ubestemt` directly on caseEntry (not inside forms), 0 nouns use forms.singular/plural
- Direct data inspection: `/vocabulary/core/de/verbbank.json` (148 verbs) — confirmed 0 verbs have perfektum, inseparable, or auxiliary fields
- Direct data inspection: `/vocabulary/dictionary/de/nounbank.json` (1641 nouns) — confirmed same flat case pattern, 0 weak_masculine fields
- Direct data inspection: `/vocabulary/dictionary/de/verbbank.json` (679 verbs) — confirmed 0 inseparable fields, verbClass already has perfektum key (enum only)
- Script inspection: `/scripts/validate-adjectives.js` — confirmed AJV 2020 validation pattern used by project

### Secondary (MEDIUM confidence)
- AJV 8.x `oneOf` null pattern for nullable objects in JSON Schema 2020-12 — standard spec behavior, consistent with AJV docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — AJV already installed and in use; no new dependencies
- Architecture: HIGH — all schemas inspected directly; data shapes confirmed against actual files
- Pitfalls: HIGH — identified by direct data inspection (bestemt/ubestemt placement mismatch), data counts verified
- Grammar features: HIGH — existing feature patterns inspected and understood

**Research date:** 2026-02-22
**Valid until:** 2026-04-22 (stable domain — JSON Schema spec and file structure won't change)
