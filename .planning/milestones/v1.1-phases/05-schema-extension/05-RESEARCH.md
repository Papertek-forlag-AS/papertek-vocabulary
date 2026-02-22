# Phase 5: Schema Extension - Research

**Researched:** 2026-02-21
**Domain:** JSON Schema 2020-12 / AJV 8 — conditional validation, $defs/$ref structure
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Declension nesting structure**
- Nesting order: degree > article type > case > gender/number
- Path example: `declension.positiv.stark.nominativ.maskulin = "großer"`
- Superlativ contains only `schwach` (grammatically correct — superlative always uses weak declension)
- Positiv and komparativ contain all three: `stark`, `schwach`, `gemischt`
- Gender/number level: `maskulin`, `feminin`, `neutrum`, `plural` as peers (no separate singular/plural nesting)
- Leaf values are plain strings (the declined form), not objects

**Property naming convention**
- German terms only throughout the declension block
- Article types: `stark`, `schwach`, `gemischt`
- Cases: `nominativ`, `akkusativ`, `dativ`, `genitiv`
- Degrees: `positiv`, `komparativ`, `superlativ`
- Gender/number: `maskulin`, `feminin`, `neutrum`, `plural`
- Clean up the existing comparison block: remove English aliases (`positive`, `comparative`, `superlative`) — only keep German terms (`positiv`, `komparativ`, `superlativ`)

**Flag interaction rules**
- `undeclinable: true` — schema must forbid `declension` block. Validation catches mistakes (e.g., no declension data for lila)
- `nicht_komparierbar: true` — schema must forbid `comparison` block. No comparison data for absolute adjectives
- `nicht_komparierbar: true` — schema must enforce `declension` contains only `positiv` (no `komparativ`/`superlativ` degrees)
- Both flags are optional — omission means false. Normal adjectives carry neither flag

**Genitive toggle**
- Add `grammar_adjective_genitive` as a new feature in grammar-features.json
- Depends on `grammar_adjective_declension` (user must enable declension before genitive toggle appears)
- Norwegian description: "Adjektivendelser i genitiv"
- English description: "Adjective endings in genitive case"
- `grammar_adjective_declension` is already registered (confirmed present) — no changes needed to it

### Claude's Discretion
- Whether to add a `dependsOn` field broadly to the grammar features schema or just as a one-off for the genitive toggle
- JSON Schema `$ref` structure and validation keyword choices
- How to implement the conditional validation (if/then/else vs oneOf for flag interaction)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHEMA-01 | Adjective schema extended with `declension` block supporting 3 degrees (positiv/komparativ/superlativ) × 3 article types (stark/schwach/gemischt) × 4 cases × 4 gender/number | Declension $defs chain confirmed working in AJV 8 with JSON Schema 2020-12. superlativBlock $def with only `schwach` enforces the grammatical constraint. |
| SCHEMA-02 | `undeclinable` boolean flag added to adjective schema for adjectives that take no endings (lila, rosa, orange, cool) | if/then/else conditional (`undeclinable: true` → `declension: false`) verified working in AJV 8. All 4 existing entries currently have no extra fields — adding `undeclinable: true` is safe. |
| SCHEMA-03 | `nicht_komparierbar` boolean flag added to adjective schema for absolute/non-comparable adjectives | allOf with two if/then blocks verified working. `nicht_komparierbar: true` → forbid `comparison` AND forbid `declension.komparativ`/`declension.superlativ`. |
| SCHEMA-04 | Genitive adjective declension registered as a toggleable grammar feature in grammar-features.json so users can opt out of seeing genitive forms | `grammar_adjective_declension` already present (confirmed). `grammar_adjective_genitive` does not yet exist — must be added. `dependsOn` field not currently used in grammar-features.json — it is Claude's discretion to add it. |
</phase_requirements>

---

## Summary

This phase modifies two files: `vocabulary/schema/adjective.schema.json` and `vocabulary/grammar-features.json`. No adjective data files are touched. The schema work is a pure JSON Schema 2020-12 authoring task — no new libraries, no new scripts (the existing `validate-adjectives.js` using AJV 8.18 already handles the validation tooling).

The main schema challenges are (1) building the 4-level nested declension structure using `$defs`/`$ref` chains, (2) enforcing the superlativ-only-schwach constraint via a restricted `$def`, and (3) implementing flag interaction rules using `if`/`then`/`else` and `allOf`. All three patterns have been verified to work correctly with the project's exact AJV 8.18 / JSON Schema 2020-12 stack.

The grammar-features.json change is a single new object appended to `de.features`. The only design decision is whether to add a `dependsOn` field (there is no existing precedent in the file — the field would be novel).

**Primary recommendation:** Use `$defs`/`$ref` chains for the declension tree, a separate `superlativBlock` $def for the degree that only allows `schwach`, and `allOf` with two independent `if`/`then` blocks for the two flag rules. Use `false` schema (boolean false) to forbid forbidden properties — the most readable and AJV-native approach.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AJV | 8.18.0 | JSON Schema validation | Already in devDependencies; project uses `Ajv2020` from `ajv/dist/2020.js` |
| JSON Schema 2020-12 | — | Schema dialect | All project schemas use `"$schema": "https://json-schema.org/draft/2020-12/schema"` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ajv-formats | 3.0.1 | Format validators | Already installed; not needed for this phase (no format constraints on declension strings) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `false` schema to forbid properties | `not: {}` or `maxProperties: 0` | `false` is the 2020-12 canonical way; more readable; AJV generates clearer error messages |
| `allOf` with multiple `if`/`then` | single `if`/`then`/`else` with nested conditions | `allOf` keeps each flag rule independent and easier to read/maintain |
| `$defs`/`$ref` chain | Inline the full structure | `$defs`/`$ref` avoids 80+ lines of repeated case/gender structure; all other project schemas use this pattern |

**Installation:** No new packages needed. Stack is complete.

---

## Architecture Patterns

### Recommended Project Structure

No structural changes needed. Files affected:

```
vocabulary/
├── schema/
│   └── adjective.schema.json    # MODIFY: add declension $defs, flags, conditionals, remove English aliases
└── grammar-features.json        # MODIFY: add grammar_adjective_genitive to de.features
```

### Pattern 1: $defs Chain for Nested Structure

**What:** Define leaf-to-root `$def` types, each referencing the one below via `$ref`. The adjective entry references the top-level `$def`.

**When to use:** Any time the schema has 3+ nesting levels with repeated structure (all 4 cases have the same gender/number shape).

**Example (verified pattern — matches project style from noun.schema.json):**
```json
"$defs": {
  "genderNumber": {
    "type": "object",
    "properties": {
      "maskulin": { "type": "string" },
      "feminin":  { "type": "string" },
      "neutrum":  { "type": "string" },
      "plural":   { "type": "string" }
    },
    "additionalProperties": false
  },
  "caseBlock": {
    "type": "object",
    "properties": {
      "nominativ":  { "$ref": "#/$defs/genderNumber" },
      "akkusativ":  { "$ref": "#/$defs/genderNumber" },
      "dativ":      { "$ref": "#/$defs/genderNumber" },
      "genitiv":    { "$ref": "#/$defs/genderNumber" }
    },
    "additionalProperties": false
  },
  "articleBlock": {
    "type": "object",
    "properties": {
      "stark":    { "$ref": "#/$defs/caseBlock" },
      "schwach":  { "$ref": "#/$defs/caseBlock" },
      "gemischt": { "$ref": "#/$defs/caseBlock" }
    },
    "additionalProperties": false
  },
  "superlativBlock": {
    "type": "object",
    "properties": {
      "schwach": { "$ref": "#/$defs/caseBlock" }
    },
    "additionalProperties": false
  },
  "declension": {
    "type": "object",
    "properties": {
      "positiv":    { "$ref": "#/$defs/articleBlock" },
      "komparativ": { "$ref": "#/$defs/articleBlock" },
      "superlativ": { "$ref": "#/$defs/superlativBlock" }
    },
    "additionalProperties": false
  }
}
```

Then in `adjectiveEntry.properties`:
```json
"declension": { "$ref": "#/$defs/declension" }
```

**Verified:** `superlativBlock` with only `schwach` and `additionalProperties: false` correctly rejects `superlativ.stark` entries.

### Pattern 2: Flag Interaction with allOf + if/then

**What:** Use `allOf` containing two independent `if`/`then` objects — one per flag rule. This keeps each rule isolated.

**When to use:** Multiple independent conditional constraints where each condition forbids specific sibling properties.

**Example (verified against AJV 8.18):**
```json
"allOf": [
  {
    "if": {
      "properties": { "undeclinable": { "const": true } },
      "required": ["undeclinable"]
    },
    "then": {
      "properties": { "declension": false }
    }
  },
  {
    "if": {
      "properties": { "nicht_komparierbar": { "const": true } },
      "required": ["nicht_komparierbar"]
    },
    "then": {
      "properties": {
        "comparison": false,
        "declension": {
          "type": "object",
          "properties": {
            "komparativ": false,
            "superlativ": false
          }
        }
      }
    }
  }
]
```

**Verified:** Passes when `undeclinable: true` and no declension. Fails when `undeclinable: true` and declension present. Passes when `nicht_komparierbar: true` with only `positiv` declension and no comparison. Fails when `nicht_komparierbar: true` with `komparativ` in declension or any `comparison` block.

### Pattern 3: Boolean false Schema to Forbid a Property

**What:** Set a property's schema to `false` (JSON boolean, not string). AJV treats it as "this property must not be present".

**When to use:** Any time a property should be forbidden under a condition.

```json
"properties": {
  "declension": false
}
```

This is the canonical JSON Schema 2020-12 approach. AJV error message: `"boolean schema is false"`.

### Pattern 4: grammar-features.json Feature Object

**What:** All features follow a consistent shape. The new `grammar_adjective_genitive` must follow the same shape as `grammar_adjective_declension` (its neighbor).

**Example (modeled on existing adjective features):**
```json
{
  "id": "grammar_adjective_genitive",
  "name": "Adjektivbøyning genitiv",
  "nameEn": "Adjective Declension Genitive",
  "description": "Adjektivendelser i genitiv",
  "descriptionEn": "Adjective endings in genitive case",
  "category": "adjectives",
  "appliesTo": ["adjective"],
  "dataPath": "declension.positiv.stark.genitiv"
}
```

Note on `dependsOn`: This field does not currently exist in any feature object in grammar-features.json. It would be novel. If added, it is a metadata-only field — JSON Schema does not validate it, and the app reads it. The decision is Claude's.

### Anti-Patterns to Avoid

- **Inline repetition of caseBlock:** Writing out all 4 cases × 4 gender/number inline for each article type results in 200+ lines of repeated structure. Use `$defs`/`$ref`.
- **oneOf for flag interaction:** `oneOf` is harder to read and produces confusing AJV error messages when multiple conditions interact. `allOf` with independent `if`/`then` is clearer.
- **Removing English aliases without checking data:** The existing bank has 0 entries with `comparison` data (confirmed by inspection — Phase 7 adds comparison data). Removing `positive`/`comparative`/`superlative` from the comparison `$def` is safe now. Must not do it after Phase 7 adds data using those aliases.
- **Making declension required at entry level:** Phase 5 is schema-only; no data is populated yet. All fields must remain optional.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional property validation | Custom validator script | JSON Schema `if`/`then`/`else` in AJV | AJV handles this natively in 2020-12; already verified working |
| Recursive $ref resolution | Manual schema traversal | AJV's built-in `$ref` resolution | AJV resolves cross-schema `$ref` (e.g., `core-word.schema.json#/$defs/translations`) automatically when schemas are loaded with `addSchema` |
| Grammar feature dependency tracking | Custom dependency resolver | `dependsOn` metadata field (app-level concern) | Schema doesn't enforce feature ordering — the app reads grammar-features.json and handles UI dependency |

**Key insight:** This phase is pure schema authoring. The hard part is structure design, not code. All validation machinery already exists.

---

## Common Pitfalls

### Pitfall 1: `if` Without `required` Mismatches on Missing Property

**What goes wrong:** Writing `"if": { "properties": { "undeclinable": { "const": true } } }` without `"required": ["undeclinable"]` — AJV treats an entry with no `undeclinable` field as matching the `if` condition (because the property constraint vacuously passes when the property is absent).

**Why it happens:** JSON Schema property constraints only apply if the property is present. Without `required`, `{ "const": true }` is satisfied by absence.

**How to avoid:** Always pair `properties` constraint in `if` with `required`: `"required": ["undeclinable"]`.

**Warning signs:** `undeclinable` flag conditional seems to trigger for all entries, not just those with `undeclinable: true`.

**Verified:** This pattern is correct: `{ "properties": { "undeclinable": { "const": true } }, "required": ["undeclinable"] }`.

### Pitfall 2: additionalProperties Rejects Valid Entries Under allOf

**What goes wrong:** `additionalProperties: false` in an `if`/`then` schema interacts with the parent schema's properties in unexpected ways in some validators. In AJV 2020-12, `if`/`then` schemas are evaluated in the context of the full instance, not a subset.

**Why it happens:** `additionalProperties` in a `then` branch sees ALL properties of the object, not just the ones mentioned in the `then` schema itself.

**How to avoid:** In `then` branches, only use `properties` with `false` schemas to forbid specific properties. Do not use `additionalProperties: false` inside `if`/`then` blocks. Reserve `additionalProperties: false` for the main `$defs` structure definitions.

**Warning signs:** Valid entries with extra fields (word, audio, type) fail validation when a flag is set.

### Pitfall 3: Removing English Aliases Breaks Comparison Block References

**What goes wrong:** The comparison `$def` currently has `positive`, `comparative`, `superlative` properties (English aliases). Removing them could break downstream schemas that reference `#/$defs/comparison` if any were using English aliases.

**Why it happens:** The adjective schema `comparison` $def is shared — the `comparison` property in `adjectiveEntry` uses `$ref: "#/$defs/comparison"`.

**How to avoid:** Confirmed safe: the core adjective bank has 0 entries with any `comparison` data. The dictionary bank also has only structural fields. English alias removal is safe at this point.

### Pitfall 4: validate-adjectives.js Tests Core Bank Only

**What goes wrong:** `scripts/validate-adjectives.js` validates only `vocabulary/core/de/adjectivebank.json`. The dictionary bank (`vocabulary/dictionary/de/adjectivebank.json`) uses a different schema (`dictionary-word.schema.json`). The dictionary schema has `declension` as `type: object` with no further structure — it will not validate the new adjective declension shape.

**Why it happens:** The dictionary schema is intentionally looser (it covers all word types). Dictionary-level adjective validation is not part of Phase 5 scope.

**How to avoid:** Phase 5 validation target is the core bank + adjective schema only. The planner should not add dictionary schema validation tasks to this phase.

### Pitfall 5: Grammar Features File Has No Schema Enforcement

**What goes wrong:** `grammar-features.json` has no `$schema` reference and is not validated by any script. It is possible to add malformed feature objects that the app silently ignores.

**Why it happens:** The file is hand-maintained JSON with a `_metadata` block but no validation tooling.

**How to avoid:** Follow the exact shape of existing feature objects. The new `grammar_adjective_genitive` object should match the structure of `grammar_adjective_declension` field-for-field, adding only the optional `dependsOn` field if chosen.

---

## Code Examples

### Verified: Full declension $defs chain

```json
// Source: verified against AJV 8.18.0, JSON Schema 2020-12 in this project
"$defs": {
  "genderNumber": {
    "type": "object",
    "properties": {
      "maskulin": { "type": "string" },
      "feminin":  { "type": "string" },
      "neutrum":  { "type": "string" },
      "plural":   { "type": "string" }
    },
    "additionalProperties": false
  },
  "caseBlock": {
    "type": "object",
    "properties": {
      "nominativ":  { "$ref": "#/$defs/genderNumber" },
      "akkusativ":  { "$ref": "#/$defs/genderNumber" },
      "dativ":      { "$ref": "#/$defs/genderNumber" },
      "genitiv":    { "$ref": "#/$defs/genderNumber" }
    },
    "additionalProperties": false
  },
  "articleBlock": {
    "type": "object",
    "properties": {
      "stark":    { "$ref": "#/$defs/caseBlock" },
      "schwach":  { "$ref": "#/$defs/caseBlock" },
      "gemischt": { "$ref": "#/$defs/caseBlock" }
    },
    "additionalProperties": false
  },
  "superlativBlock": {
    "type": "object",
    "properties": {
      "schwach": { "$ref": "#/$defs/caseBlock" }
    },
    "additionalProperties": false
  },
  "declension": {
    "type": "object",
    "properties": {
      "positiv":    { "$ref": "#/$defs/articleBlock" },
      "komparativ": { "$ref": "#/$defs/articleBlock" },
      "superlativ": { "$ref": "#/$defs/superlativBlock" }
    },
    "additionalProperties": false
  }
}
```

### Verified: Flag interaction conditionals

```json
// Source: verified against AJV 8.18.0, JSON Schema 2020-12 in this project
// Place at the adjectiveEntry level (alongside "properties" and "required")
"allOf": [
  {
    "if": {
      "properties": { "undeclinable": { "const": true } },
      "required": ["undeclinable"]
    },
    "then": {
      "properties": { "declension": false }
    }
  },
  {
    "if": {
      "properties": { "nicht_komparierbar": { "const": true } },
      "required": ["nicht_komparierbar"]
    },
    "then": {
      "properties": {
        "comparison": false,
        "declension": {
          "type": "object",
          "properties": {
            "komparativ": false,
            "superlativ": false
          }
        }
      }
    }
  }
]
```

### Verified: Run existing validation script

```bash
# From project root — must run from project root (relative paths in validate-adjectives.js)
node scripts/validate-adjectives.js
```

Expected output after Phase 5 changes: `PASS: All 106 adjective entries validate against schema`

### Grammar feature object shape (new entry)

```json
// Append to de.features array in vocabulary/grammar-features.json
// dependsOn is optional metadata field — Claude's discretion
{
  "id": "grammar_adjective_genitive",
  "name": "Adjektivbøyning genitiv",
  "nameEn": "Adjective Declension Genitive",
  "description": "Adjektivendelser i genitiv",
  "descriptionEn": "Adjective endings in genitive case",
  "category": "adjectives",
  "appliesTo": ["adjective"],
  "dataPath": "declension",
  "dependsOn": "grammar_adjective_declension"
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON Schema draft-07 `if`/`then` (not in draft-07) | JSON Schema 2020-12 `if`/`then`/`else` | 2019-09 draft | Project already uses 2020-12; this is the right approach |
| AJV v6 (draft-07) | AJV v8 with `Ajv2020` from `ajv/dist/2020.js` | AJV 8.0 release | Project already upgraded; use `Ajv2020`, not default `Ajv` class |

**Deprecated/outdated:**
- English alias properties (`positive`, `comparative`, `superlative`) in the comparison $def: Added in an earlier version, no entries currently use them, locked for removal in this phase.

---

## Open Questions

1. **Whether `dependsOn` field in grammar-features.json should be added broadly or only on the genitive entry**
   - What we know: No `dependsOn` field currently exists in grammar-features.json. The existing `grammar_adjective_declension` entry has no dependency metadata.
   - What's unclear: Whether Leksihjelp app reads/uses a `dependsOn` field — if it doesn't, the field is purely documentation.
   - Recommendation: Add `dependsOn` only to the new `grammar_adjective_genitive` entry (one-off). This is the minimal change. Retrofitting all features with `dependsOn: null` or similar would be scope creep with no confirmed app benefit.

2. **Leksihjelp field name confirmation for `declension`**
   - What we know: STATE.md flags this as a HIGH cost concern: "must verify Leksihjelp indexes `comparison` and `declension` by those exact names before Phase 5 schema is locked."
   - What's unclear: Whether the blocker was resolved or deferred. The context says Phase 5 is ready for planning, implying this was resolved.
   - Recommendation: Planner should add a verification step at the start of Phase 5 execution: confirm `grammar-features.json` entry uses `"dataPath": "declension"` (it does) and note the Leksihjelp concern is a Phase 10 (INTG-01) concern, not a schema-shape concern.

---

## Sources

### Primary (HIGH confidence)

- Verified by running `node` with AJV 8.18.0 (`ajv/dist/2020.js`) in the project directory:
  - `if`/`then`/`else` conditional validation
  - `allOf` with multiple independent `if`/`then` blocks
  - `false` schema to forbid properties
  - `$defs`/`$ref` chain for 4-level nested structure
  - `superlativBlock` with `additionalProperties: false` rejecting `stark`/`gemischt`
  - Required pairing of `properties` + `required` in `if` condition
- Direct file inspection of:
  - `/vocabulary/schema/adjective.schema.json` — current schema baseline
  - `/vocabulary/schema/noun.schema.json` — reference for `$defs`/`$ref` pattern used in project
  - `/vocabulary/grammar-features.json` — confirmed `grammar_adjective_declension` present; no `dependsOn` field exists
  - `/vocabulary/core/de/adjectivebank.json` — 106 entries, 0 with comparison data, 0 with English aliases, lila/rosa/orange/cool confirmed present
  - `/scripts/validate-adjectives.js` — AJV 8 Ajv2020, strict: false, allErrors: true; tests core bank only

### Secondary (MEDIUM confidence)

- JSON Schema 2020-12 specification behavior: `if` without `required` vacuously passes for missing properties — this is specified behavior, verified empirically.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — AJV 8.18 and JSON Schema 2020-12 are already in place; verified working
- Architecture: HIGH — all patterns verified with live AJV execution in the project
- Pitfalls: HIGH — empirically derived from AJV behavior testing; one (English alias) from data inspection

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable domain — JSON Schema spec and AJV 8.x are not fast-moving)
