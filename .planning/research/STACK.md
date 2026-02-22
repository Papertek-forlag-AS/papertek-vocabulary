# Stack Research

**Domain:** JSON vocabulary data repo — German Perfektum conjugations + Noun full case declension (v1.2)
**Researched:** 2026-02-22
**Confidence:** HIGH

## Context: This Is an Additive Milestone

The stack is fully deployed and working. v1.1 shipped. The question is only what additions or changes are needed to support Perfektum conjugations (148 verbs) and full 4-case noun declension tables (331 nouns).

**Existing stack (verified from codebase, do not re-research):**
- Node.js >=18.0.0, running v25.2.1 locally (ESM, `"type": "module"`)
- Vercel serverless functions, no framework, pure `export default async function handler(req, res)`
- JSON files as data layer (`vocabulary/core/de/`, `vocabulary/dictionary/de/`)
- JSON Schema 2020-12 via `ajv@8.18.0` + `ajv-formats@3.0.1` (devDependencies only)
- Zero npm runtime dependencies — API handlers use only Node.js `fs` and `path` built-ins
- Search index at `vocabulary/dictionary/de/search-index.json` with 3,454 entries

**What v1.2 adds:**
1. Verb Perfektum: `conjugations.perfektum` block with `former` (6 pronouns), `auxiliary` (haben/sein), `participle`, and optional `auxiliary_note` for dual-auxiliary verbs
2. Noun full declension: `cases` block expanded to all 4 cases (nominativ, akkusativ, dativ, genitiv) x singular/plural with bestemt/ubestemt forms
3. Search index expansion: past participles and declined noun forms as additional indexed entries pointing to base word IDs

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | >=18.0.0 (already required) | All data scripts and validation | Already the runtime; built-in `fs` and `JSON` cover all needs for data generation and schema validation |
| JSON Schema 2020-12 | (standard, no version) | Extended verb and noun schemas | Already the schema language for all three word type schemas; no new format needed |
| JSON (plain files) | (format, not a library) | Perfektum and noun case data storage | Existing data layer; the API reads JSON files directly via `fs.readFileSync` |

No new core technologies are required for v1.2. Language, runtime, and data format are all fixed by the existing system.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ajv | 8.18.0 (already installed) | Validate extended verb.schema.json and noun.schema.json after schema changes | Already in devDependencies; use to add `npm run validate:verbs` and `npm run validate:nouns` scripts analogous to the existing `validate-adjectives.js` |
| ajv-formats | 3.0.1 (already installed) | Enables `format` keywords in ajv (e.g., uri, date) | Required alongside ajv; already present |

**No new libraries are needed.** Both ajv and ajv-formats are already installed as devDependencies. The only work is writing new validation scripts that import them (same pattern as `scripts/validate-adjectives.js`).

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Node.js built-in `fs` + `JSON.parse/stringify` | Data generation scripts for perfektum and noun declension | No dependencies; ESM `import { readFileSync, writeFileSync } from 'fs'` — same pattern used by `scripts/validate-adjectives.js` |
| Node.js built-in `JSON.stringify(data, null, 2)` | Maintain readable JSON output in bank files | Use 2-space indent for all bank writes; matches existing file formatting |

---

## Installation

Nothing new to install. The required devDependencies are already present:

```bash
# Already in devDependencies — no install needed
# ajv@8.18.0
# ajv-formats@3.0.1
```

No runtime dependencies are added. Vercel functions continue to use only `fs` and `path`.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Plain `conjugations.perfektum` block alongside existing `presens`/`preteritum` | Separate `perfektum` top-level key on verb entry | Never — the `conjugations` wrapper is the existing convention; breaking it would require changes to the v2 lookup API's grammar feature detection logic |
| Extend existing `cases` key on nouns (add dativ/genitiv to existing nominativ/akkusativ) | New `declension` key with case data | Avoid — `declension` already has a specific meaning on nouns (Norwegian-style entall/flertall/bestemt/ubestemt from Norwegian nouns, currently used for 2 German nouns in error). Use `cases` which already contains nominativ/akkusativ for 223 German nouns |
| Explicit stored forms for all inflections | Programmatic declension rule engine | Rule engines break on German exceptions. Precedent set in v1.1: explicit storage for all 39,800 adjective cells. Same principle applies here. 331 nouns x 4 cases x 2 numbers x 2 definiteness = ~5,296 cells — manageable |
| Expand search index with inflected form entries pointing to base IDs | Full-text search across all JSON fields | Inflected form indexing is how adjective declension search works in v1.1; same pattern for participles and noun cases |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| New top-level `perfektum` key on verb entries | Breaks the established `conjugations` wrapper pattern; v2 lookup API already checks `entry.conjugations?.perfektum` for `grammar_perfektum` feature detection — this is already wired correctly | `conjugations.perfektum.former` with the 6-pronoun structure |
| `declension` key for German noun case data | Already defined in noun.schema.json for Norwegian-style bestemt/ubestemt by number (entall/flertall) — repurposing it for German cases creates confusion. Currently only 2 German nouns have this key, both in legacy format | `cases` key which already has nominativ/akkusativ for 223 German nouns |
| Dual search index entries (one per inflected form) for all 331 nouns | Search index would grow from 3,454 to ~8,750 entries (331 nouns x ~16 forms each) — manageable but larger than needed | Index only the distinctive forms: genitive singulars and dative plurals (the forms that differ from nominative); skip forms identical to the base word |
| npm libraries for German grammar conjugation | `mlconjug3` (Python), `wiktionary-de` (unmaintained) — unreliable for irregular verbs. Perfektum has 148 highly irregular past participles (gegangen, gewesen, gehabt, etc.) | Manual data entry per verb; a generation script can produce the 6 auxiliary+participle combinations once the auxiliary and participle are specified per verb |
| TypeScript | No build step exists; adding one breaks zero-config Vercel deploy; the schema is already in JSON Schema dialect | Plain ESM `.js` files |
| A separate database | All data is read-only JSON; no writes, no queries, no concurrent access patterns | JSON files served via Vercel CDN |

---

## Data Shape: What Changes

### Verb: `conjugations.perfektum` block

The `tenseConjugation` schema `$def` already supports this structure. No schema change is needed for the basic shape. Extensions needed:

```json
"perfektum": {
  "former": {
    "ich": "habe gegessen",
    "du": "hast gegessen",
    "er/sie/es": "hat gegessen",
    "wir": "haben gegessen",
    "ihr": "habt gegessen",
    "sie/Sie": "haben gegessen"
  },
  "auxiliary": "haben",
  "participle": "gegessen",
  "feature": "grammar_perfektum"
}
```

For dual-auxiliary verbs (e.g., `hängen` — transitive takes haben, intransitive takes sein):

```json
"perfektum": {
  "former": {
    "ich": "habe/bin gehangen",
    "du": "hast/bist gehangen",
    "er/sie/es": "hat/ist gehangen",
    "wir": "haben/sind gehangen",
    "ihr": "habt/seid gehangen",
    "sie/Sie": "haben/sind gehangen"
  },
  "auxiliary": "haben/sein",
  "participle": "gehangen",
  "auxiliary_note": "haben with transitive use (I hung the picture); sein with intransitive use (The picture hung there)",
  "feature": "grammar_perfektum"
}
```

**Schema extension required:** Add `auxiliary`, `participle`, and `auxiliary_note` as optional properties to the `tenseConjugation` `$def` in `verb.schema.json`.

### Noun: Extended `cases` block

The `caseEntry` schema `$def` in `noun.schema.json` already supports this. No schema change needed for the basic structure. A `cases` entry with all 4 cases:

```json
"cases": {
  "nominativ": {
    "feature": "grammar_noun_nominative",
    "singular": { "bestemt": "der Mann", "ubestemt": "ein Mann" },
    "plural":   { "bestemt": "die Männer", "ubestemt": "Männer" }
  },
  "akkusativ": {
    "feature": "grammar_noun_accusative",
    "singular": { "bestemt": "den Mann", "ubestemt": "einen Mann" },
    "plural":   { "bestemt": "die Männer", "ubestemt": "Männer" }
  },
  "dativ": {
    "feature": "grammar_noun_dative",
    "singular": { "bestemt": "dem Mann", "ubestemt": "einem Mann" },
    "plural":   { "bestemt": "den Männern", "ubestemt": "Männern" }
  },
  "genitiv": {
    "feature": "grammar_noun_genitive",
    "singular": { "bestemt": "des Mannes", "ubestemt": "eines Mannes" },
    "plural":   { "bestemt": "der Männer", "ubestemt": "Männer" }
  }
}
```

**Breaking change with existing data:** 223 nouns already have `cases` with nominativ/akkusativ in a different format (`intro`, `bestemt`, `ubestemt` directly on the case — not nested under `singular`/`plural`). The v1.2 data entry must decide: use the flat format (matches existing 223 entries) or migrate to the singular/plural-nested format. Recommendation: use the flat format for backwards compatibility, adding `plural` as a sibling to `bestemt`/`ubestemt`.

**Revised format matching existing 223 entries:**

```json
"cases": {
  "nominativ": {
    "bestemt": "der Mann",
    "ubestemt": "ein Mann",
    "plural_bestemt": "die Männer",
    "plural_ubestemt": "Männer"
  },
  "akkusativ": { ... },
  "dativ": {
    "bestemt": "dem Mann",
    "ubestemt": "einem Mann",
    "plural_bestemt": "den Männern",
    "plural_ubestemt": "Männern"
  },
  "genitiv": {
    "bestemt": "des Mannes",
    "ubestemt": "eines Mannes",
    "plural_bestemt": "der Männer",
    "plural_ubestemt": "Männer"
  }
}
```

**Schema extension required:** Add `plural_bestemt` and `plural_ubestemt` as optional string properties to the `caseEntry.forms` `$def` (or add them directly to `caseEntry` alongside the existing direct `bestemt`/`ubestemt` fields).

### Search Index: Inflected Form Entries

The current search index entry shape (verb example):
```json
{ "id": "essen_verb", "w": "essen", "t": "verb", "f": 302, "c": "A1", "cur": true, "vc": "strong", "tr": {"nb": "å spise", "en": "to eat"} }
```

For Perfektum, index past participles pointing back to the base verb:
```json
{ "id": "essen_verb", "w": "gegessen", "t": "verb", "f": 302, "c": "A1", "cur": true, "tr": {"nb": "å spise", "en": "to eat"} }
```

For nouns, index declined forms (focus on dative plural -n suffix and genitive -(e)s suffix which differ from nominative):
```json
{ "id": "mann_noun", "w": "Männern", "t": "noun", "g": "m", "f": 136, "cur": true, "tr": {"nb": "mann", "en": "man"} }
```

**Note:** Multiple search index entries can share the same `id` (points to the same dictionary entry). The search endpoint returns the `wordId` which the consumer uses for lookup. This is how the v1.1 adjective inflection search works.

### Grammar Features: No New Feature IDs Needed

`grammar_perfektum` is already defined in `vocabulary/grammar-features.json` with `dataPath: "conjugations.perfektum"`. The v2 lookup API already detects and emits this feature at line 234: `if (entry.conjugations?.perfektum) grammarFeatures.push('grammar_perfektum')`.

For noun cases, the existing feature IDs (`grammar_accusative_indefinite`, `grammar_accusative_definite`, `grammar_dative`) already exist. New feature IDs for nominative and genitive may need to be added if Leksihjelp needs to display them progressively.

---

## Stack Patterns by Variant

**For the Perfektum data entry work:**
- Write `scripts/generate-perfektum.js` — reads verbbank, for each verb computes the 6 perfektum forms from `auxiliary` + `participle` input, writes back to bank
- Input format per verb: `{ "participle": "gegessen", "auxiliary": "haben" }` — two fields, everything else is derived
- For dual-auxiliary: `{ "participle": "gehangen", "auxiliary": "haben/sein", "auxiliary_note": "..." }`
- Strong/irregular verbs need manual participle lookup (gegangen, gewesen, gehabt, gefahren etc.)
- Modal verbs: Ersatzinfinitiv (double infinitive) — `haben + infinitiv` — needs special handling (`"former": { "ich": "habe gehen wollen", ... }`)

**For the noun declension work:**
- Write `scripts/generate-noun-cases.js` — for each noun takes 4 case forms per number, writes `cases` block
- 223 nouns already have nominativ/akkusativ — migration script to add dativ/genitiv to existing entries
- 108 nouns have no case data at all — need full 4-case data entry

**For schema validation:**
- Add `npm run validate:verbs` — validates all 148 core verb entries (and 679 dict entries) against updated verb.schema.json
- Add `npm run validate:nouns` — validates all 331 core noun entries against updated noun.schema.json
- Both scripts follow the `scripts/validate-adjectives.js` pattern exactly

**For search index rebuild:**
- Write `scripts/build-search-index.js` to regenerate `vocabulary/dictionary/de/search-index.json`
- Add participle entries for verbs with perfektum data
- Add declined form entries for nouns with full case data (selective — dative plural and genitive singular are the highest-value forms)
- Run after data entry is complete; check in both `search-index.json` and `search-index.pretty.json`

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| ajv@8.18.0 | Node.js >=12.0.0 | Within project's >=18.0.0 requirement; verified installed |
| ajv-formats@3.0.1 | ajv@>=8.0.0 | Required for ajv v8; do NOT use ajv-formats@2.x with ajv@8 |
| JSON Schema 2020-12 | ajv@>=8.0.0 | ajv v8 supports draft-2020-12 natively; use `strict: false` for existing `additionalProperties` patterns |

---

## Integration Points: What the v2 API Already Handles

These integration points require NO API code changes — the API already handles them:

| Feature | Where Already Handled | Status |
|---------|----------------------|--------|
| `conjugations.perfektum` in response | `[wordId].js` line 218: `if (entry.conjugations) response.conjugations = entry.conjugations` | Already passes through all conjugation tenses |
| `grammar_perfektum` feature flag | `[wordId].js` line 234: `if (entry.conjugations?.perfektum) grammarFeatures.push('grammar_perfektum')` | Already wired |
| `cases` (all 4) in response | `[wordId].js` line 213: `if (entry.cases) response.cases = entry.cases` | Already passes through entire cases object |
| `grammar_dative` feature flag | `[wordId].js` line 247: `if (entry.cases?.dativ) grammarFeatures.push('grammar_dative')` | Already wired |
| v1 core API serving new data | `[language].js` reads entire bank files and passes all fields | No change needed |
| Dual-bank sync | Both `vocabulary/core/de/verbbank.json` and `vocabulary/dictionary/de/verbbank.json` must be updated | Data work, not API work |

**Only one API integration point needs attention:** `grammar_noun_nominative` and `grammar_noun_genitive` feature IDs do not exist yet in `grammar-features.json`. If Leksihjelp needs to progressively disclose these cases, add them. If not required in this milestone, skip — the cases data will still be served, just without a feature flag.

---

## Sources

- Direct codebase inspection: `package.json`, `package-lock.json`, all schema files, `api/vocab/v1/core/[language].js`, `api/vocab/v2/lookup/[language]/[wordId].js`, `api/vocab/v2/search/[language].js`, `vocabulary/grammar-features.json`, `vocabulary/core/de/verbbank.json`, `vocabulary/dictionary/de/verbbank.json`, `vocabulary/core/de/nounbank.json`, `vocabulary/dictionary/de/search-index.pretty.json` — HIGH confidence (verified 2026-02-22)
- `cat node_modules/ajv/package.json` — confirmed ajv@8.18.0 installed — HIGH confidence
- JSON Schema 2020-12 standard (well-established, no uncertainty) — HIGH confidence
- German Perfektum grammar (auxiliary haben/sein, past participle forms, modal Ersatzinfinitiv) — standard linguistic reference — HIGH confidence

---
*Stack research for: Papertek Vocabulary API — v1.2 German Perfektum & Noun Declension*
*Researched: 2026-02-22*
