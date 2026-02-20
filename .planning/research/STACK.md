# Stack Research

**Domain:** JSON vocabulary data repo — German adjective declension extension + Goethe word classification
**Researched:** 2026-02-20
**Confidence:** HIGH

## Context: What Already Exists

This is an additive milestone on a working system. The entire stack is already deployed. The question is what, if anything, new is needed.

**Existing stack (do not re-research):**
- Node.js >=18.0.0 (ESM, `"type": "module"` in package.json)
- Vercel serverless functions (no framework — pure `export default async function handler(req, res)`)
- JSON files as the data layer (`vocabulary/**/*.json`)
- JSON Schema 2020-12 (`$schema: "https://json-schema.org/draft/2020-12/schema"`) for schema definitions
- **Zero npm runtime dependencies** — all existing scripts use Node.js built-ins only

**What v1.1 adds:**
1. Adjective declension data (JSON schema extension + data population)
2. Goethe "other" word classification script (identify adjectives in 1,191 mixed-POS entries)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | >=18.0.0 (already required) | All scripting for Goethe classification and data generation | Already the runtime; built-in `fs`, `JSON`, and ESM cover all needs |
| JSON Schema 2020-12 | (schema standard, no version) | Extended adjective schema with `declension` block | Already used for adjective.schema.json, noun.schema.json, verb.schema.json — stay consistent |
| JSON (plain files) | (format, not a library) | Declension data storage in adjectivebank.json | Existing data layer — no new format needed |

No new core technologies are required. The language (Node.js) and data format (JSON) are fixed by the existing system.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ajv | 8.18.0 | Validate adjective.schema.json against populated data during dev | Add as devDependency if writing a `npm run validate:adjectives` script; skip if validation is done manually or in CI |
| ajv-formats | 3.0.1 | Enables JSON Schema format keywords in ajv (e.g., uri, date) | Required alongside ajv if schema uses `format` keywords |

**Decision:** Add ajv + ajv-formats as devDependencies only if a validation script is written. The existing `package.json` scripts (`validate`, `validate:ids`, `validate:audio`) likely already use ajv or built-in validation — check before adding. If no existing validation script exists in the codebase, ajv adds genuine value for catching malformed declension tables before they reach production.

Verified: ajv 8.18.0 is the current latest as of 2026-02-20 (via `npm info ajv`). ajv-formats 3.0.1 is current and required for ajv v7+ (the v2 series is for ajv v6).

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Node.js built-in `fs` + `JSON.parse` | Goethe classification script — read source files, write output | No dependencies needed; ESM `import { readFileSync } from 'fs'` works |
| Node.js built-in `readline` or direct JSON | Manual review of classified adjectives | The 1,191 "other" words will require human review — tooling only flags candidates |

---

## Installation

If adding ajv for a validation script:

```bash
# Dev dependencies only
npm install -D ajv@8.18.0 ajv-formats@3.0.1
```

No runtime dependencies are needed. The Vercel functions read JSON with `fs.readFileSync` — this is unchanged.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Plain Node.js script for Goethe classification | Python + NLTK or spaCy | If the classification needed NLP/ML. It does not — the task is rule-based POS filtering on a fixed wordlist |
| JSON Schema 2020-12 (existing) | TypeScript interfaces | If the project had a TypeScript build step. It does not — adding TS now is scope creep |
| Manual declension data entry | Automated declension generator | If there were 1,000+ adjectives. At 108–200 adjectives, manual entry is more reliable for irregular forms (gut/besser/best-, hoch/höher/höchst-) |
| ajv for schema validation | Zod / Yup / Joi | ajv is the reference JSON Schema validator; the schemas are already written in JSON Schema dialect. Zod would require rewriting schemas in TS |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| A separate database (SQLite, Postgres) | Zero justification — all data is read-only JSON served via Vercel. Adding a DB adds operational overhead with no benefit | Continue with JSON files |
| TypeScript compilation | No build step exists; adding one breaks the current zero-config Vercel deploy pattern | Plain ESM `.js` files |
| LLM API calls at runtime | Declension data must be linguistically correct and version-controlled — generated at data-entry time, not at request time | Pre-compute all 144 cells per adjective; store in JSON |
| npm libraries for German grammar | `wiktionary-de`, `mlconjug3`, etc. are unreliable, unmaintained, or wrong for inflection edge cases | Manual data entry for irregular forms; rule-based computation for regular forms |
| Python for data scripts | The existing tooling is Node.js ESM — mixing runtimes for one-off scripts creates inconsistency | Node.js built-ins |

---

## Data Shape: Declension Schema Extension

The adjective.schema.json needs one new `$def`:

```json
"declensionTable": {
  "type": "object",
  "description": "Full declension for one degree (positiv/komparativ/superlativ)",
  "properties": {
    "stark": { "$ref": "#/$defs/caseBlock" },
    "schwach": { "$ref": "#/$defs/caseBlock" },
    "gemischt": { "$ref": "#/$defs/caseBlock" }
  }
},
"caseBlock": {
  "type": "object",
  "properties": {
    "nominativ": { "$ref": "#/$defs/genderForms" },
    "akkusativ": { "$ref": "#/$defs/genderForms" },
    "dativ":     { "$ref": "#/$defs/genderForms" },
    "genitiv":   { "$ref": "#/$defs/genderForms" }
  }
},
"genderForms": {
  "type": "object",
  "properties": {
    "maskulin": { "type": "string" },
    "feminin":  { "type": "string" },
    "neutrum":  { "type": "string" },
    "plural":   { "type": "string" }
  },
  "required": ["maskulin", "feminin", "neutrum", "plural"]
}
```

And `adjectiveEntry` gets:

```json
"declension": {
  "type": "object",
  "properties": {
    "positiv":    { "$ref": "#/$defs/declensionTable" },
    "komparativ": { "$ref": "#/$defs/declensionTable" },
    "superlativ": { "$ref": "#/$defs/declensionTable" }
  }
}
```

This produces 144 leaf values per adjective (3 degrees × 3 article types × 4 cases × 4 gender/number). For regular adjectives, many cells share stems with predictable endings — only the stem per degree varies. For irregular adjectives (gut/besser/best-, hoch/höher/höchst-), all three degree stems must be explicitly stored.

**Placement:** `declension` lives on the adjective entry in `vocabulary/core/de/adjectivebank.json`. The `adjective.schema.json` gets extended. No API code changes — the existing endpoint already passes through all fields.

---

## Goethe Classification Script Shape

The classification script is a one-off Node.js ESM script (no library dependencies):

```javascript
// scripts/classify-goethe-other.js
import { readFileSync, writeFileSync } from 'fs';

// Rule-based heuristics to flag likely adjectives in "other" bucket:
// 1. Word ends in: -lich, -isch, -ig, -sam, -bar, -los, -voll, -haft, -ell
// 2. Word ends in known adjective suffixes: -ern, -en (after vowel)
// 3. Word matches known German adjective forms (requires human list)
// Human review of flagged candidates required before adding to adjective bank
```

The script outputs a candidate list for human review — it cannot be fully automated because:
- "andere-" appears with trailing hyphen (paradigmatic form marker)
- Entries include phrases, interjections, particles that share surface forms with adjectives
- Irregular adjectives have no suffix patterns (gut, viel, wenig)

---

## Stack Patterns by Variant

**For the declension data entry work:**
- Use a Node.js helper script that generates all 144 cells from (stem_positiv, stem_komparativ, stem_superlativ) + standard ending tables
- Store the helper in `scripts/generate-adjective-declension.js`
- Regular adjectives: 3 inputs → 144 cells computed programmatically
- Irregular adjectives: manual override of the generated cells

**For schema validation:**
- Add `npm run validate:adjectives` script using ajv 8.18.0
- Validates that every adjective entry with `declension` has all required cells
- Run before every commit that touches adjectivebank.json

**For the Goethe extraction:**
- One-off `scripts/classify-goethe-other.js` — not a recurring tool
- Reads three source files, outputs markdown or JSON candidate list
- Human reviews output, manually adds confirmed adjectives to adjectivebank.json

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| ajv@8.18.0 | Node.js >=12.0.0 | Well within the project's >=18.0.0 requirement |
| ajv-formats@3.0.1 | ajv@>=8.0.0 | Required for ajv v8; do NOT use ajv-formats@2.x with ajv@8 |
| JSON Schema 2020-12 | ajv@>=8.0.0 | ajv v8 supports draft-2020-12 natively (set `allErrors: true, strict: false` for the existing schema patterns) |

---

## Sources

- `npm info ajv` → confirmed version 8.18.0 as of 2026-02-20 (HIGH confidence)
- `npm info ajv-formats` → confirmed version 3.0.1 as of 2026-02-20 (HIGH confidence)
- Direct codebase inspection: `package.json`, all schema files, `api/vocab/v1/core/[language].js`, all three Goethe source files — (HIGH confidence)
- German adjective declension paradigm (3 degrees × 3 article types × 4 cases × 4 gender/number) — standard linguistic reference, well-established (HIGH confidence)

---
*Stack research for: Papertek Vocabulary API — v1.1 German Adjective Declension*
*Researched: 2026-02-20*
