# Phase 3: Bank Cleanup - Research

**Researched:** 2026-02-20
**Domain:** JSON data cleanup, JSON Schema validation (ajv / JSON Schema Draft 2020-12)
**Confidence:** HIGH — all findings come from direct code and data inspection of the actual repository

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- `beste_adj`: Remove entirely from the adjective bank. It's a superlative form of "gut" — the correct place for this data is the comparison block on "gut" in Phase 7.
- `Lieblings-`: Reclassify to another bank (not an adjective — it's a prefix). Claude determines the best destination bank based on existing bank structure.
- Any other non-adjectives discovered during cleanup: same treatment — reclassify to appropriate bank, don't just delete.
- Run both schema validation AND semantic checks (duplicates, misspelled German words, incorrect word forms).
- Schema failures: auto-fix and log every change in commit messages.
- Semantic issues (misspellings): auto-correct obvious cases and log every correction in commit messages.
- Unfixable entries (missing core data, completely garbled): remove them.
- Git history is the archive — no separate archive files for removed/changed entries.
- All changes logged in commit messages (no separate changelog file).
- Final commit states the new entry count and summarizes what was removed/reclassified.
- Removals cascade across all banks: core bank, dictionary bank, AND translation files stay in sync.

### Claude's Discretion

- Destination bank for `Lieblings-` and any other reclassified entries
- Which fields count as "required" vs "optional" for this validation pass (guided by schema + translations-optional rule from success criteria)
- Order of operations for cleanup steps
- How to structure validation tooling (script vs manual)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLEAN-01 | `beste_adj` collision with gut's superlative resolved (removed or documented as intentional) | Confirmed: `beste_adj` is in core bank, dictionary bank, both translation files, search index, AND two curriculum manifests. All 6 locations must be updated. |
| CLEAN-02 | `Lieblings-` prefix entry correctly handled (removed from adjective bank or re-typed) | Confirmed: `lieblings-_adj` must move to generalbank. New `_id` must end with a generalbank-routing suffix. Recommended: `lieblings-_adv`. Affects 5 files (core, dict, 2 translation files, search index). |
| CLEAN-03 | Schema `translations` field changed from required to optional (fixes validation for all 108 existing entries) | Confirmed: 108/108 entries fail with "must have required property 'translations'". Single one-line schema change fixes all. |
</phase_requirements>

---

## Summary

The adjective bank has exactly three classes of problem, all confirmed by direct inspection. The bank has 108 entries; all 108 fail schema validation for the same reason: the `adjective.schema.json` schema declares `translations` as a required field, but this project stores translations in separate translation files (`vocabulary/translations/de-nb/` and `vocabulary/translations/de-en/`), not inline in the core bank. This is by design. Removing `"translations"` from the `required` array in `adjective.schema.json` fixes all 108 errors in one edit.

The two misclassified entries (`beste_adj` and `lieblings-_adj`) require cascading changes across multiple files. Removing `beste_adj` must also remove it from two curriculum manifest files where it is currently referenced. Moving `Lieblings-` requires creating a new entry in generalbank with a new `_id` ending in `_adv` or `_expr`, so the v2 API's bank-routing logic correctly routes lookups to `generalbank.json`. The old `lieblings-_adj` key disappears and there is no need for an alias since nothing in the curricula references it.

Beyond these three classes, a semantic audit of the full bank found zero corrupt entries, zero duplicate words, zero `_id`/key mismatches, and no unexpected fields. The bank is clean apart from the three known issues. Total work scope for this phase is small: one schema edit, a handful of JSON edits across 6-7 files, and manifest count updates.

**Primary recommendation:** Fix CLEAN-03 first (schema edit), verify validation passes for all 106 remaining entries, then commit. Then handle CLEAN-01 and CLEAN-02 as separate commits with clear commit messages documenting what was removed/moved.

---

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| ajv | 8.x (npm) | JSON Schema Draft 2020-12 validation | Already used transitively via firebase-tools globally; standard JSON Schema validator |
| Node.js ESM | v25 (project) | Run validation scripts | Project already uses `"type": "module"` |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| ajv (npm, local) | 8.17.x | Validation script dependency | Install as dev dependency for the validation script |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ajv npm package | ajv CLI (`ajv-cli`) | ajv-cli is a wrapper around the same library; the npm package gives more control for multi-schema setups with cross-references |
| Custom Node.js script | jq + manual checks | jq handles JSON queries but cannot validate against JSON Schema |

**Installation:**
```bash
npm install --save-dev ajv ajv-formats
```

Note: The schemas use `"$schema": "https://json-schema.org/draft/2020-12/schema"`. This requires `ajv/dist/2020.js` (the 2020-12 build), NOT the default `ajv` export (which targets Draft-07).

---

## Architecture Patterns

### Recommended Project Structure

No new directories needed. Validation tooling goes in `scripts/`:

```
vocabulary/
├── core/de/adjectivebank.json          # Core bank (edit)
├── dictionary/de/adjectivebank.json    # Dictionary bank (edit)
├── dictionary/de/search-index.json     # Search index (edit)
├── dictionary/de/search-index.pretty.json  # (edit)
├── translations/de-nb/adjectivebank.json   # NB translations (edit)
├── translations/de-en/adjectivebank.json   # EN translations (edit)
├── core/de/generalbank.json            # Lieblings- destination (edit)
├── dictionary/de/generalbank.json      # Lieblings- destination (edit)
├── curricula/vocab-manifest-us-9.json  # Remove beste_adj (edit)
├── curricula/vocab-manifest-tysk1-vg1.json  # Remove beste_adj (edit)
├── schema/adjective.schema.json        # Remove translations from required (edit)
└── core/de/manifest.json               # Update counts (edit)
    dictionary/de/manifest.json         # Update counts (edit)

scripts/
└── validate-adjectives.js              # New validation script (if built)
```

### Pattern 1: Two-Schema Ajv Setup (for validation script)

The `adjective.schema.json` cross-references `core-word.schema.json` using a relative path. Ajv must have both schemas loaded to resolve the `$ref`.

**What:** Load both schemas, add `core-word.schema.json` with its relative name as key, compile the top-level adjective schema, validate the bank object (minus `_metadata`).

**Example:**
```javascript
// Source: direct analysis of vocabulary/schema/adjective.schema.json
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const adjSchema = JSON.parse(readFileSync('./vocabulary/schema/adjective.schema.json', 'utf8'));
const coreSchema = JSON.parse(readFileSync('./vocabulary/schema/core-word.schema.json', 'utf8'));
const bank = JSON.parse(readFileSync('./vocabulary/core/de/adjectivebank.json', 'utf8'));
const { _metadata, ...entries } = bank;

const ajv = new Ajv2020({ strict: false, allErrors: true });
// Key must match the $ref: "core-word.schema.json#/$defs/translations"
ajv.addSchema(coreSchema, 'core-word.schema.json');
ajv.addSchema(adjSchema);

const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/adjective.schema.json');
const valid = validate(entries);
if (!valid) {
  console.log('Errors:', validate.errors.length);
  validate.errors.forEach(e => console.log(e.instancePath, e.message));
}
```

**Critical:** Use `Ajv2020` (from `ajv/dist/2020.js`), not `Ajv` (from `ajv`). The schemas declare `"$schema": "https://json-schema.org/draft/2020-12/schema"`. The default `Ajv` targets Draft-07 and throws on the `$schema` meta-ref.

### Pattern 2: Manual JSON Edit with count verification

Given the small number of changes (2 entries to remove/move), manual JSON editing is appropriate. The validation script is the verification step, not the cleanup step itself.

**Order of operations (recommended):**

1. Edit `adjective.schema.json` — remove `"translations"` from `required`
2. Run validation → confirm 0 errors on 108 entries
3. Commit: `fix(schema): make translations optional in adjective schema (CLEAN-03)`
4. Remove `beste_adj` from: core bank, dictionary bank, both translation files, search index (both), both curriculum manifests, both manifests (count: 108→107)
5. Commit: `fix(data): remove beste_adj superlative entry (CLEAN-01) — 107 adjectives remain`
6. Move `Lieblings-` from adjectivebank to generalbank: remove from 4 adjective files/index, add to 2 general bank files
7. Update manifests (adjectivebank 107→106, generalbank 185→186)
8. Commit: `fix(data): reclassify Lieblings- prefix to generalbank as lieblings-_adv (CLEAN-02) — 106 adjectives remain`
9. Run final validation → confirm 0 errors on 106 entries

### Anti-Patterns to Avoid

- **Validating the translation files as adjectives:** The adjective schema validates `vocabulary/core/de/adjectivebank.json` only, not the translation files. Do not run `adjective.schema.json` against `translations/de-nb/adjectivebank.json`.
- **Forgetting search-index.pretty.json:** The dictionary directory has both `search-index.json` and `search-index.pretty.json`. Both must be updated.
- **Leaving beste_adj in curricula:** Removing from banks but not curricula creates dangling IDs. The curricula API serves raw JSON — it doesn't validate IDs against banks, but the consuming app (Leksihjelp) may try to look up `beste_adj` and get a 404.
- **Keeping the old `lieblings-_adj` key in compat/word-id-aliases.json:** Not needed since `lieblings-_adj` is not referenced in any curriculum manifest or consumer. Adding an alias would create unnecessary cruft.
- **Using `allErrors: false` (default) in ajv:** Without `allErrors: true`, ajv stops at first error per entry — you only see 1 error instead of all 108.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema validation | Custom field-presence checker | ajv with the actual schema | Schema captures all rules; custom checker would miss schema evolution |
| Cross-schema `$ref` resolution | Manual schema merging | ajv's `addSchema()` API | ajv handles multi-schema environments natively |

**Key insight:** The validation problem here is straightforward — one required field change fixes 108 errors. The risk is in the cascade (forgetting files). Use a checklist, not complex tooling.

---

## Common Pitfalls

### Pitfall 1: Wrong Ajv Version for Draft 2020-12

**What goes wrong:** Importing `Ajv` from the default `ajv` entrypoint throws: `Error: no schema with key or ref "https://json-schema.org/draft/2020-12/schema"`.

**Why it happens:** The default ajv build targets JSON Schema Draft-07. The vocabulary schemas declare `"$schema": "https://json-schema.org/draft/2020-12/schema"`.

**How to avoid:** Import from `ajv/dist/2020.js` (the 2020-12 build):
```javascript
import Ajv2020 from 'ajv/dist/2020.js';
```

**Warning signs:** Error message mentioning the `$schema` URL as an unresolvable ref.

---

### Pitfall 2: Missing `core-word.schema.json` Reference in Validation

**What goes wrong:** Compilation fails with: `MissingRefError: can't resolve reference core-word.schema.json#/$defs/translations from id #`.

**Why it happens:** `adjective.schema.json` uses `"$ref": "core-word.schema.json#/$defs/translations"` — a relative `$ref`. Ajv does not auto-load referenced schemas.

**How to avoid:** `ajv.addSchema(coreSchema, 'core-word.schema.json')` — the second argument must exactly match the `$ref` string (the relative filename, not the `$id` URL).

**Warning signs:** `MissingRefError` during schema compilation.

---

### Pitfall 3: Curricula Dangling Reference After Removing `beste_adj`

**What goes wrong:** Removing `beste_adj` from all banks but leaving it in curriculum manifests. The v1 curricula API serves the raw manifest JSON including the stale ID. If Leksihjelp or another consumer resolves the curriculum word list and looks up `beste_adj`, it gets a 404 from the v2 lookup API.

**Why it happens:** The cascade decision lists "core bank, dictionary bank, AND translation files" but curricula are a separate location. Easy to forget.

**How to avoid:** Before committing CLEAN-01, grep the curricula directory for `beste_adj`:
```bash
grep -r "beste_adj" vocabulary/curricula/
```
Result: found in `vocab-manifest-us-9.json` (lesson 1.1 and 9.1) and `vocab-manifest-tysk1-vg1.json`.

**Warning signs:** `beste_adj` remaining in any `.json` file under `vocabulary/curricula/`.

---

### Pitfall 4: `_id` Suffix Determines Bank Routing for v2 API

**What goes wrong:** Moving `Lieblings-` to generalbank but keeping `_id: "lieblings-_adj"`. The v2 lookup API (`/api/vocab/v2/lookup/[language]/[wordId].js`) splits the word ID by `_` and routes by the last segment. `lieblings-_adj` routes to `adjectivebank`, not `generalbank`.

**Why it happens:** The routing logic is `TYPE_TO_BANK[lastSegment]` where `adj -> adjectivebank`. Changing the bank file without changing the `_id` means v2 lookups for this word will search the wrong bank and return 404.

**How to avoid:** Assign a new `_id` ending with a generalbank-routing suffix:
- `lieblings-_adv` (routes via `adv -> generalbank`) — recommended
- `lieblings-_expr` (routes via `expr -> generalbank`) — acceptable

Update the JSON key, the `_id` field inside the entry, and the `id` field in `search-index.json`.

**Warning signs:** `lieblings-_adj` appearing in `core/de/generalbank.json` or `dictionary/de/generalbank.json`.

---

### Pitfall 5: Search Index Has Two Files

**What goes wrong:** Updating `search-index.json` but forgetting `search-index.pretty.json`. Both files coexist in `vocabulary/dictionary/de/`.

**Why it happens:** Both files exist for human readability during development. They must stay in sync.

**How to avoid:** After editing `search-index.json`, regenerate or manually sync `search-index.pretty.json`.

**Warning signs:** `beste_adj` or `lieblings-_adj` remaining in `search-index.pretty.json` after cleanup.

---

### Pitfall 6: Manifest Counts Must Reflect Reality

**What goes wrong:** After removing 2 entries and moving 1, manifests still show 108 for adjectivebank.

**Locations:**
- `vocabulary/core/de/manifest.json`: `"adjectivebank.json": 108` → update to 106
- `vocabulary/dictionary/de/manifest.json`: `"adjectivebank.json": 108` → update to 106, `"generalbank.json": 185` → update to 186
- The top-level `totalWords` counts in both manifests must also be recalculated.

**How to avoid:** Verify counts programmatically before committing:
```bash
node -e "const b = require('./vocabulary/core/de/adjectivebank.json'); console.log(Object.keys(b).filter(k=>k!=='_metadata').length)"
```

---

## Code Examples

### CLEAN-03: Schema Edit (one line)

**File:** `vocabulary/schema/adjective.schema.json`

Before:
```json
"adjectiveEntry": {
  "type": "object",
  "properties": { ... },
  "required": ["translations"]
}
```

After:
```json
"adjectiveEntry": {
  "type": "object",
  "properties": { ... }
}
```

Remove the entire `"required": ["translations"]` line. The `translations` property definition stays — it just stops being mandatory.

---

### CLEAN-01: Remove `beste_adj` from core bank

**File:** `vocabulary/core/de/adjectivebank.json` — delete this key:
```json
"beste_adj": {
  "word": "beste",
  "type": "adj",
  "audio": "ord_beste.mp3",
  "_id": "beste_adj"
}
```

Repeat removal from: `vocabulary/dictionary/de/adjectivebank.json`, `vocabulary/translations/de-nb/adjectivebank.json`, `vocabulary/translations/de-en/adjectivebank.json`, `vocabulary/dictionary/de/search-index.json`, `vocabulary/dictionary/de/search-index.pretty.json`.

Also remove from curricula:
- `vocabulary/curricula/vocab-manifest-us-9.json` (appears in lessons 1.1 and 9.1 `words` arrays)
- `vocabulary/curricula/vocab-manifest-tysk1-vg1.json`

---

### CLEAN-02: Move `Lieblings-` to generalbank

**Remove from** `vocabulary/core/de/adjectivebank.json`:
```json
"lieblings-_adj": {
  "word": "Lieblings-",
  "_id": "lieblings-_adj"
}
```

**Add to** `vocabulary/core/de/generalbank.json`:
```json
"lieblings-_adv": {
  "word": "Lieblings-",
  "_id": "lieblings-_adv"
}
```

**Remove from** `vocabulary/dictionary/de/adjectivebank.json`:
```json
"lieblings-_adj": {
  "word": "Lieblings-",
  "_id": "lieblings-_adj",
  "curriculum": true,
  "cefr": "A1",
  "frequency": 25599
}
```

**Add to** `vocabulary/dictionary/de/generalbank.json`:
```json
"lieblings-_adv": {
  "word": "Lieblings-",
  "_id": "lieblings-_adv",
  "curriculum": true,
  "cefr": "A1",
  "frequency": 25599
}
```

**Translation files** (`translations/de-nb/adjectivebank.json` and `translations/de-en/adjectivebank.json`): remove the `lieblings-_adj` key. Move translation content to the corresponding `generalbank.json` translation files:

de-nb generalbank.json — add:
```json
"lieblings-_adv": {
  "translation": "favoritt-",
  "explanation": {
    "_description": "Prefiks som betyr favoritt. F.eks. Lieblingsfarbe (favorittfarge)."
  }
}
```

de-en generalbank.json — add:
```json
"lieblings-_adv": {
  "translation": "favorite-"
}
```

**Search index:** In both `search-index.json` and `search-index.pretty.json`, find the entry with `"id": "lieblings-_adj"` and update:
- `"id"` → `"lieblings-_adv"`
- `"t"` → `"general"` (not `"adj"`)

---

### Validation Script (minimal)

```javascript
// scripts/validate-adjectives.js
// Usage: node scripts/validate-adjectives.js
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const adjSchema = JSON.parse(readFileSync(path.join(root, 'vocabulary/schema/adjective.schema.json'), 'utf8'));
const coreSchema = JSON.parse(readFileSync(path.join(root, 'vocabulary/schema/core-word.schema.json'), 'utf8'));
const bank = JSON.parse(readFileSync(path.join(root, 'vocabulary/core/de/adjectivebank.json'), 'utf8'));
const { _metadata, ...entries } = bank;

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(coreSchema, 'core-word.schema.json');
ajv.addSchema(adjSchema);

const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/adjective.schema.json');
const valid = validate(entries);

if (valid) {
  console.log(`OK: all ${Object.keys(entries).length} adjective entries pass schema validation`);
  process.exit(0);
} else {
  console.error(`FAIL: ${validate.errors.length} schema errors`);
  validate.errors.forEach(e => console.error(`  ${e.instancePath} ${e.message}`));
  process.exit(1);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline translations in core bank | Separate translation files per language pair | v1.0 design | The `required: ["translations"]` in the schema is a legacy artifact — it was correct when translations were inline but wrong for the current split-file architecture |
| `ord_*` audio prefix (older entries) | `adjektiv_*` audio prefix | Sometime in v1.0 | beste_adj, geheim_adj, recht_adj use old naming — they are v1.0-era imports |

**Deprecated/outdated:**
- `"required": ["translations"]` in `adjective.schema.json`: was added when translations were stored inline; now translations live in separate files, so this constraint is wrong and must be removed.

---

## Open Questions

1. **Should `beste_adj` be removed from curricula or left as a dangling reference?**
   - What we know: `beste_adj` is in `vocab-manifest-us-9.json` (lessons 1.1, 9.1) and `vocab-manifest-tysk1-vg1.json`. The curricula API serves raw JSON — it doesn't enforce that IDs exist in banks. Leksihjelp may or may not validate curriculum word IDs against the bank.
   - What's unclear: Whether leaving `beste_adj` in curricula causes a runtime error in Leksihjelp, or whether it's silently ignored.
   - Recommendation: Remove it from curricula to be safe. The cascade rule says "core bank, dictionary bank, AND translation files" — curricula are an additional location not mentioned, but consistency demands it. Log it in the commit message.

2. **What type should `Lieblings-` get in generalbank?**
   - What we know: The `core-word.schema.json` enum has no `prefix` type. Available generalbank-routing types: `adv`, `prep`, `conj`, `interj`, `interr`, `propn`, `expr`. Productive prefix morphemes appear in no established category.
   - What's unclear: Whether the search API or Leksihjelp inspects the `type` field for adjectives vs generalbank words in any way that matters for this entry.
   - Recommendation: Use `adv` (adverb). It is the most neutral "modifier-class" type and is a common classification for word-formation elements in learner dictionaries. Yields new `_id`: `lieblings-_adv`. Alternative `expr` is also acceptable but `expr` currently means "fixed phrases" in this codebase.

3. **Do `geheim_adj`, `recht_adj`, and `ueberrascht_adj` need cleanup?**
   - What we know: These three entries have `"type": "adj"` and `ord_*` or `adjektiv_*` audio prefix — signs of being imported from an older system. All three are legitimate German adjectives. They have no structural errors.
   - What's unclear: Nothing — these are valid and can stay as-is.
   - Recommendation: Leave them. The `type: "adj"` field is optional in the schema and does not cause any validation errors. They are semantically correct.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection of `vocabulary/core/de/adjectivebank.json` — 108 entries, full content read
- Direct inspection of `vocabulary/schema/adjective.schema.json` — confirmed `"required": ["translations"]`
- Direct inspection of `vocabulary/schema/core-word.schema.json` — confirmed translation field structure
- ajv 2020-12 validation run with `allErrors: true` — confirmed 108 errors, all identical ("must have required property 'translations'")
- Direct inspection of `api/vocab/v2/lookup/[language]/[wordId].js` — confirmed `TYPE_TO_BANK` routing logic
- Direct inspection of all translation files, dictionary banks, search index, curricula — confirmed cascade scope

### Secondary (MEDIUM confidence)

- None required — all findings verified from source code and data.

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — ajv is the only reasonable choice for JSON Schema Draft 2020-12; confirmed it works with this schema structure via direct test
- Architecture: HIGH — all patterns verified by reading actual API code and data
- Pitfalls: HIGH — all pitfalls discovered through actual test runs and code inspection, not assumptions

**Research date:** 2026-02-20
**Valid until:** 2026-04-20 (stable schema format; no external dependencies that change rapidly)
