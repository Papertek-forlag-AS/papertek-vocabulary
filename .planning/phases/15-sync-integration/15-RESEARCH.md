# Phase 15: Sync & Integration - Research

**Researched:** 2026-02-22
**Domain:** Data sync scripts, JSON bank manipulation, search index rebuild, Vercel API handler modification, AJV schema validation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Past participle search**
- Add `pp` field to verb entries in `search-index.json` for client-side consumption only
- Do NOT modify the v2 search handler to match on past participles — clients download the index and handle search locally
- The v2 search/lookup API is treated as a temporary convenience; future milestone will replace it with a frontend for word lookup and community suggestions

**Sync field scope**
- Sync ALL new fields from Phases 12-14, not just the 5 SYNC requirements — full parity between core and dictionary banks
- This includes: `conjugations.perfektum`, `cases` (4-case declension), `inseparable`, `weak_masculine`, `declension_type`, `auxiliary` flags
- Core bank is source of truth; dictionary bank fields get overwritten on mismatch (Claude's discretion on conflict handling — core wins)
- Full rebuild of search index (all 3454+ entries from scratch), not partial — guarantees no stale data

**Validation & error handling**
- Fix the 356 pre-existing validation errors (missing translation fields, legacy plural type issues) — milestone exits with zero errors
- Add empty translation stubs and fix legacy plural types as needed to achieve clean validation
- Create a permanent `npm run verify:integration` script in `scripts/` — reusable system health check, not a throwaway phase artifact
- Sync scripts should log mismatches and continue (Claude's discretion on fail-fast vs. log-and-continue)

**Feature flag behavior**
- `grammar_noun_declension` emitted for ALL nouns that have cases data — simple rule: data present = flag emitted
- `grammar_genitiv` kept as a SEPARATE flag from `grammar_noun_declension` — allows apps to unlock genitiv exercises independently
- `grammar_perfektum` — Claude checks if handler emits this already and adds it if missing
- Expose `inseparable`, `weak_masculine`, `auxiliary`, `declension_type` in the v2 lookup response body — clients get full visibility, not just internal grammarFeatures logic

### Claude's Discretion
- Search index noun fields — whether to add abbreviated case hints to noun entries in the search index (vs. keeping them in full nounbank download only)
- Past participle format — bare participle ("gewandert") vs. with auxiliary ("ist gewandert") in search index `pp` field
- Sync script architecture — reusable npm scripts vs. one-shot phase scripts (decide based on reusability)
- Conflict handling detail — core always wins, but how to log/report mismatches

### Deferred Ideas (OUT OF SCOPE)
- Replace v2 search/lookup API with a word-lookup frontend with community suggestion features — future milestone
- Merge core + dictionary banks into single vocabulary with manifest-driven word selection — future milestone
- Periodic sync schedule (e.g. midnight) instead of live API calls — architectural decision for future milestone
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNC-01 | Perfektum data synced to dictionary verbbank for all 148 verbs | 144 verbs in core have perfektum data; all 144 exist in dict verbbank. sync-preteritum.js provides the exact pattern to follow. |
| SYNC-02 | Noun declension data synced to dictionary nounbank for all 331 nouns | All 331 core nouns have full 4-case data. 331 overlap with dict nounbank. The other 1310 dict-only nouns are not in scope. |
| SYNC-03 | Search index rebuilt with `pp` field on verb entries enabling past-participle lookup | 144 of 679 verb entries in index have core perfektum data. Full rebuild from all dict banks + translation files. |
| SYNC-04 | v2 lookup handler emits `grammar_noun_declension` and `grammar_genitiv` feature flags | Handler already emits `grammar_perfektum`. Cases logic exists but uses legacy `cases.akkusativ` path. Must add declension feature flags using `entry.cases?.nominativ?.feature` pattern. |
| SYNC-05 | Schema validation passing for both core and dictionary banks with zero errors | Currently: 356 noun errors + 191 verb errors (baseline). Fixes: translation stubs, plural null schema fix, verb type enum fix, leute_noun type fix. |
</phase_requirements>

---

## Summary

Phase 15 is a pure data wiring and API surfacing phase. All source data exists in the core banks (Phases 11-14 complete). The work divides into four distinct tracks: (1) sync scripts that copy fields from core to dictionary banks, (2) full rebuild of the search index with the new `pp` field on verb entries, (3) v2 lookup handler updates to emit new grammar feature flags and expose new response fields, and (4) validation cleanup to reach zero AJV errors on both core and dictionary verbbanks and nounbanks.

The project uses ESM (`"type": "module"` in package.json), AJV 8.x for validation, and Vercel serverless functions. All existing sync and validation scripts (sync-preteritum.js, validate-nouns.js) are ESM. The sync pattern is well-established: read core, iterate keys, merge specific fields into dict entry while preserving dict-only fields (cefr, frequency, curriculum, verbClass, etc.). The preteritum sync script is the canonical template.

The validation picture is more complex than a simple "add translations". The 356 noun errors break down as: 332 missing-translations + 23 plural:null type violations + 1 leute_noun legacy type. The 191 verb errors (not yet surfaced by any script) break down as: 149 missing-translations + 42 Norwegian-language type values in the `type` field. The fix strategy is: (a) add `{}` translation stubs to all entries missing them, (b) update the noun schema to allow `null` for the `plural` field, (c) fix `leute_noun.type` to `"noun"`, (d) write a new `validate:verbs` script and fix verb type enum values.

**Primary recommendation:** Implement in four ordered scripts — sync-perfektum.js, sync-nouns.js, build-search-index.js, then handler patch — followed by a validation sweep. Reuse the sync-preteritum.js architecture exactly. Create verify:integration as the permanent end-to-end health check.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ajv | ^8.18.0 | JSON Schema validation (draft 2020-12) | Already installed, used by validate-nouns.js and add-declension.js |
| ajv-formats | ^3.0.1 | Format validators for AJV | Already installed |
| Node.js built-ins | fs, path | File I/O for bank manipulation | No extra deps needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js (ESM) | >=18 | Script runtime | All scripts must be ESM (package.json `"type": "module"`) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-writing full search index rebuild | Modifying existing index in-place | Full rebuild is simpler, guaranteed stale-free, and the index is only 3454 entries (~small) |
| ajv/dist/2020.js import | Standard ajv import | The project uses the 2020 import path — must match exactly |

**Installation:**
No new packages needed. AJV already installed.

---

## Architecture Patterns

### Recommended Script Structure

```
scripts/
├── sync-perfektum.js        # NEW: core verbbank -> dict verbbank (perfektum + auxiliary fields)
├── sync-nouns.js            # NEW: core nounbank -> dict nounbank (cases + declension_type + weak_masculine)
├── build-search-index.js    # NEW: full rebuild of dict/de/search-index.json (+ pp field)
├── validate-verbs.js        # NEW: AJV validate core verbbank (mirrors validate-nouns.js)
├── verify-integration.js    # NEW: permanent end-to-end health check
├── sync-preteritum.js       # EXISTING: preteritum + inseparable sync (Phase 12, do not modify)
├── validate-nouns.js        # EXISTING: AJV validate core nounbank
└── validate-adjectives.js   # EXISTING
```

### Pattern 1: Core-to-Dict Sync Script (from sync-preteritum.js)

**What:** Read core bank, iterate keys, merge specific fields into dict entry.
**When to use:** All sync tasks (SYNC-01, SYNC-02)
**Key rules:**
- Skip `_metadata` key
- Skip if key not in dict bank (dict-only entries are not in scope)
- Use spread to preserve dict-only fields: `dict[key] = { ...dictEntry, newField: coreEntry.newField }`
- Core always wins on conflict — no conditional check needed
- Log synced/skipped count at end

```javascript
// Source: /scripts/sync-preteritum.js (project canonical pattern)
import { readFileSync, writeFileSync } from 'fs';

const CORE_PATH = 'vocabulary/core/de/verbbank.json';
const DICT_PATH = 'vocabulary/dictionary/de/verbbank.json';

const core = JSON.parse(readFileSync(CORE_PATH, 'utf8'));
const dict = JSON.parse(readFileSync(DICT_PATH, 'utf8'));

let synced = 0, skipped = 0;

for (const key of Object.keys(core)) {
  if (key === '_metadata') continue;
  const coreEntry = core[key];
  const dictEntry = dict[key];
  if (!dictEntry) { skipped++; continue; }

  // Merge specific fields — preserve all existing dict fields
  dict[key].conjugations = {
    ...dictEntry.conjugations,
    perfektum: coreEntry.conjugations.perfektum,  // core wins
  };
  if (coreEntry.inseparable === true) dict[key].inseparable = true;
  synced++;
}

writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2));
console.log(`Synced: ${synced}, Skipped: ${skipped}`);
```

### Pattern 2: Search Index Entry Format

The search index at `vocabulary/dictionary/de/search-index.json` uses compact field names:

```javascript
// Verb entry (current):
{ "id": "anfangen_verb", "w": "anfangen", "t": "verb", "f": 933, "c": "A1",
  "cur": true, "vc": "strong", "sep": "an",
  "tr": { "nb": "å begynne / å starte", "en": "to begin / to start" } }

// Verb entry (with new pp field):
{ "id": "anfangen_verb", "w": "anfangen", "t": "verb", "f": 933, "c": "A1",
  "cur": true, "vc": "strong", "sep": "an",
  "pp": "angefangen",    // NEW: bare past participle from core verbbank
  "tr": { "nb": "å begynne / å starte", "en": "to begin / to start" } }

// Noun entry (current — no case fields, those stay in nounbank only):
{ "id": "abend_noun", "w": "Abend", "t": "noun", "f": 254, "c": "A2",
  "cur": true, "g": "m",
  "tr": { "nb": "kveld", "en": "evening" } }
```

**pp field decision (Claude's discretion):** Use bare participle ("angefangen"), not auxiliary form ("ist/habe angefangen"). Rationale: the client uses the pp field for inflection lookup (finding "angefangen" in text → base verb). The auxiliary is available in the full nounbank download and via the lookup API.

**Noun case hints in index (Claude's discretion):** Do NOT add case hints to noun entries in the search index. The index serves autocomplete/search, not grammar display. Case data is available via the lookup API (which reads from the dict nounbank) and via the full nounbank download. This keeps the index compact.

### Pattern 3: AJV Validation Script (from validate-nouns.js)

```javascript
// Source: /scripts/validate-nouns.js
import Ajv2020 from 'ajv/dist/2020.js';  // Must use this specific import path
import { readFileSync } from 'fs';

const coreSchema = JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8'));
const verbSchema = JSON.parse(readFileSync('vocabulary/schema/verb.schema.json', 'utf8'));
const verbBank = JSON.parse(readFileSync('vocabulary/core/de/verbbank.json', 'utf8'));

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(coreSchema, 'core-word.schema.json');
ajv.addSchema(verbSchema);

const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/verb.schema.json');
const valid = validate(verbBank);
if (valid) {
  const count = Object.keys(verbBank).filter(k => k !== '_metadata').length;
  console.log(`PASS: All ${count} verb entries validate against schema`);
  process.exit(0);
} else {
  console.error(`FAIL: ${(validate.errors || []).length} validation error(s) found`);
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
```

### Pattern 4: v2 Lookup Handler Feature Flag Pattern

The handler in `api/vocab/v2/lookup/[language]/[wordId].js` already emits `grammar_perfektum` correctly:

```javascript
// Existing (line 234):
if (entry.conjugations?.perfektum) grammarFeatures.push('grammar_perfektum');

// Missing — must ADD for SYNC-04:
if (entry.cases?.nominativ?.feature === 'grammar_noun_declension') {
  grammarFeatures.push('grammar_noun_declension');
}
if (entry.cases?.genitiv?.feature === 'grammar_genitiv') {
  grammarFeatures.push('grammar_genitiv');
}

// Also expose new fields in response body:
if (entry.inseparable) response.inseparable = true;
if (entry.weak_masculine) response.weakMasculine = true;
if (entry.declension_type) response.declensionType = entry.declension_type;
// auxiliary is already inside conjugations.perfektum.auxiliary, exposed via response.conjugations
```

**Note:** The handler already exposes `entry.cases` at line 213 (`if (entry.cases) response.cases = entry.cases;`). So once the dict nounbank is synced (SYNC-02), the cases data will automatically appear in the lookup response. The only missing piece is the grammarFeatures flags.

### Anti-Patterns to Avoid

- **Modifying dict-only entries:** Never touch dict entries that have no core counterpart. The 1310 dict-only nouns and 531 dict-only verbs are out of scope for sync.
- **Using sync scripts with relative paths at wrong cwd:** All existing scripts use relative paths (e.g., `'vocabulary/core/de/verbbank.json'`). They must be run from the project root. Add a cwd check or document clearly.
- **Partial index update:** The index has no update mechanism — always rebuild fully. This is intentional (stale-free guarantee).
- **CommonJS require() in scripts:** The project uses `"type": "module"` — all scripts must use ESM `import`/`export`. The sync-preteritum.js Phase 12 decision confirmed ESM is required.
- **Using `ajv` default import path:** Must use `import Ajv2020 from 'ajv/dist/2020.js'` for draft-2020-12 support.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema validation | Custom field checks | AJV already installed | AJV handles $ref, allErrors, cross-schema refs |
| Translation lookups for index rebuild | Inline parsing logic | Mirror existing index entry structure from dict bank + translation files | The index format is already established — just rebuild it |
| Feature flag logic | New config/registry | Read from grammar-features.json | Source of truth for flag IDs already in vocabulary/grammar-features.json |

---

## Common Pitfalls

### Pitfall 1: Confusing Core vs Dict Bank Structures

**What goes wrong:** Core verbbank has 149 entries (148 verbs + 1 _metadata). Dict verbbank has 680 entries (679 verbs + 1 _metadata). Sync scope is the 148 overlap (not 149, as verbphrases have no perfektum and are in core but not in the dict-format bank check).

**Why it happens:** The _metadata key plus verbphrases (rad_fahren_verbphrase, etc.) are in core but don't need syncing.

**How to avoid:** Filter with `if (key === '_metadata') continue;` and the existing `if (!dictEntry) { skipped++; continue; }` guard handles verbphrases automatically.

**Expected output:** sync-perfektum.js → Synced: 144, Skipped: 5 (1 _metadata + 4 verbphrases)

### Pitfall 2: Validation Error Baseline Miscount

**What goes wrong:** The 356 pre-existing noun errors are NOT all the same type. Breaking down:
- 332 × "must have required property 'translations'" — includes `_metadata` entry (which triggers it too)
- 23 × "must be string" (plural: null in uncountable/months/holidays nouns)
- 1 × "must be equal to constant" (leute_noun.type = "substantiv (kun flertall)")

The verb baseline (discovered by new validate:verbs script) is 191 errors:
- 149 × "must have required property 'translations'" — includes _metadata + 4 verbphrases
- 42 × "must be equal to one of the allowed values" — Norwegian type values: "sterkt", "svakt", "vanlig", "refleksiv", "verb", "verbphrase"

**How to avoid:** Fix each category independently; verify error count drops to zero after each fix.

### Pitfall 3: Null Plural Schema Fix

**What goes wrong:** `vocabulary/schema/noun.schema.json` defines `plural: { type: "string" }` but uncountable nouns (months, school subjects, holidays) store `plural: null`. This causes 23 AJV type errors.

**Why it happens:** The schema predates the uncountable noun data. The data is correct (null is the right value for no plural); the schema needs to be updated.

**How to avoid:** Update the noun schema to `plural: { oneOf: [{ type: "string" }, { type: "null" }] }` or equivalently `{ type: ["string", "null"] }` in JSON Schema draft 2020-12.

**Warning signs:** If validate-nouns.js still shows "must be string" errors after adding translations stubs, the schema fix hasn't been applied.

### Pitfall 4: Search Index Translation Source

**What goes wrong:** The search index `tr.nb` and `tr.en` values come from translation files, NOT from the dict bank entries. Dict bank verbbank entries have zero `translations` fields.

**How to build the index:** For each dict bank entry:
1. Get base fields from dict bank: id, word, type, frequency, cefr, curriculum, genus (nouns), verbClass/separablePrefix (verbs)
2. Look up translation in `vocabulary/translations/de-nb/` (curriculum) or `vocabulary/translations/de-nb-dict/` (dict-only) — use curriculum first, dict as fallback
3. Extract `translation.translation` as the `tr.nb` value
4. Same for `en` from `de-en` / `de-en-dict`

**Warning signs:** Any index entry with `tr: {}` or missing `tr.nb` indicates a translation lookup failure.

### Pitfall 5: Feature Flag Detection in v2 Handler — Legacy Cases Format

**What goes wrong:** The handler already has:
```javascript
if (entry.cases?.akkusativ) {
  grammarFeatures.push('grammar_accusative_indefinite');
  grammarFeatures.push('grammar_accusative_definite');
}
if (entry.cases?.dativ) grammarFeatures.push('grammar_dative');
```
These check for any `akkusativ`/`dativ` key (old flat format). After sync, the new cases structure has `cases.akkusativ.forms.singular.definite` etc. The old checks will still fire (because `entry.cases.akkusativ` is truthy), which is fine — BUT the new `grammar_noun_declension` and `grammar_genitiv` flags must be added explicitly, as they are not currently emitted.

**How to avoid:** Add the two new flag conditions AFTER the existing ones. The safest detection:
```javascript
if (entry.cases?.nominativ?.feature === 'grammar_noun_declension') {
  grammarFeatures.push('grammar_noun_declension');
}
if (entry.cases?.genitiv?.feature === 'grammar_genitiv') {
  grammarFeatures.push('grammar_genitiv');
}
```
This reads the `feature` field embedded in the case objects by the data injection script — exact values match grammar-features.json IDs.

### Pitfall 6: Verb Type Enum Mismatch (Norwegian Legacy Values)

**What goes wrong:** Core verbbank entries use Norwegian type values ("sterkt", "svakt", "vanlig", "refleksiv", "verb", "verbphrase") that don't match the schema enum: ["strong", "weak", "modal", "reflexive", "separable", "auxiliary", "regular", "irregular"].

**Mapping:**
- "sterkt" → "strong"
- "svakt" → "weak"
- "vanlig" → "weak" (common/regular weak verbs)
- "refleksiv" → "reflexive"
- "verb" → "weak" (generic verb label → default to weak)
- "verbphrase" → remove type field or keep as-is (verbphrases are out of scope for schema enforcement)

**How to avoid:** Fix in a one-pass script over core verbbank before adding translation stubs. Verify 42 → 0 enum errors.

---

## Code Examples

Verified patterns from existing codebase:

### Search Index Entry Construction (inferred from existing index + dict bank structure)

```javascript
// Source: reverse-engineered from vocabulary/dictionary/de/search-index.json entries
// For a verb entry with pp field:
function buildVerbEntry(id, dictEntry, nbTranslation, enTranslation, coreEntry) {
  const entry = {
    id,
    w: dictEntry.word,
    t: 'verb',
  };
  if (dictEntry.frequency) entry.f = dictEntry.frequency;
  if (dictEntry.cefr) entry.c = dictEntry.cefr;
  if (dictEntry.curriculum) entry.cur = true;
  // verbClass fields
  if (dictEntry.verbClass?.default) entry.vc = dictEntry.verbClass.default;
  if (dictEntry.verbClass?.separable) entry.sep = dictEntry.verbClass.separable;
  // NEW: past participle from core verbbank
  const pp = coreEntry?.conjugations?.perfektum?.participle;
  if (pp) entry.pp = pp;
  // translations
  entry.tr = {};
  if (nbTranslation) entry.tr.nb = nbTranslation;
  if (enTranslation) entry.tr.en = enTranslation;
  return entry;
}
```

### Noun Sync Script (inferred from sync-preteritum.js pattern)

```javascript
// Source: pattern from /scripts/sync-preteritum.js
import { readFileSync, writeFileSync } from 'fs';

const CORE_PATH = 'vocabulary/core/de/nounbank.json';
const DICT_PATH = 'vocabulary/dictionary/de/nounbank.json';

const core = JSON.parse(readFileSync(CORE_PATH, 'utf8'));
const dict = JSON.parse(readFileSync(DICT_PATH, 'utf8'));

let synced = 0, skipped = 0;

for (const key of Object.keys(core)) {
  if (key === '_metadata') continue;
  const coreEntry = core[key];
  const dictEntry = dict[key];
  if (!dictEntry) { skipped++; continue; }

  // Sync cases (4-case declension) — core wins
  if (coreEntry.cases) dict[key].cases = coreEntry.cases;
  // Sync declension_type
  if (coreEntry.declension_type) dict[key].declension_type = coreEntry.declension_type;
  // Sync weak_masculine flag
  if (coreEntry.weak_masculine === true) dict[key].weak_masculine = true;
  synced++;
}

writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2));
console.log(`Synced: ${synced}, Skipped: ${skipped}`);
// Expected: Synced: 331, Skipped: 1 (_metadata only)
```

### Translation Stub Addition (for validation fix)

```javascript
// Pattern for fixing missing-translations errors on core banks
// Add minimal empty stub that satisfies schema requirement
// The schema requires: translations (object, no further required sub-fields)
for (const key of Object.keys(coreVerb)) {
  if (key === '_metadata') continue;
  if (!coreVerb[key].translations) {
    coreVerb[key].translations = {};  // empty stub satisfies required: ["translations"]
  }
}
```

### Verb Type Enum Fix

```javascript
// Fix Norwegian legacy type values in core verbbank
const TYPE_MAP = {
  'sterkt': 'strong',
  'svakt': 'weak',
  'vanlig': 'weak',
  'refleksiv': 'reflexive',
  'verb': 'weak',  // generic label -> default weak
  // 'verbphrase': omit or handle separately
};
for (const key of Object.keys(coreVerb)) {
  if (key === '_metadata') continue;
  const entry = coreVerb[key];
  if (entry.type && TYPE_MAP[entry.type]) {
    entry.type = TYPE_MAP[entry.type];
  }
}
```

### v2 Handler Additions (SYNC-04)

```javascript
// Add to api/vocab/v2/lookup/[language]/[wordId].js after existing grammarFeatures logic

// New fields in response body:
if (entry.inseparable) response.inseparable = true;
if (entry.weak_masculine) response.weakMasculine = true;
if (entry.declension_type) response.declensionType = entry.declension_type;

// New grammarFeatures flags (add after existing cases checks):
if (entry.cases?.nominativ?.feature === 'grammar_noun_declension') {
  grammarFeatures.push('grammar_noun_declension');
}
if (entry.cases?.genitiv?.feature === 'grammar_genitiv') {
  grammarFeatures.push('grammar_genitiv');
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat `bestemt`/`ubestemt` on case entries | `forms.singular.{definite,indefinite}` + `forms.plural.{definite,indefinite}` | Phase 11 schema, Phase 14 data | Dict nounbank still has 186 old-format entries (dict-only), core bank has new format |
| Norwegian verb type strings ("sterkt", "vanlig") | English enum values ("strong", "weak") | Pre-GSD state; fix in Phase 15 | 42 verb entries in core need type field correction |
| No perfektum in dict verbbank | `conjugations.perfektum` synced from core | Phase 15 (this phase) | Enables grammar_perfektum feature flag from lookup API for curriculum verbs |

**Deprecated/outdated:**
- Flat `cases.akkusativ.bestemt` format: Legacy dict-only entries still use this. Do not remove — the lookup handler checks for it and emits accusative feature flags. New core entries use `forms.singular.definite` structure.

---

## Data Inventory (Confirmed)

| Bank | Core entries | Dict entries | Overlap | Sync scope |
|------|-------------|-------------|---------|------------|
| verbbank | 148 verbs + 4 verbphrases | 679 | 148 | 144 verbs with perfektum |
| nounbank | 331 nouns | 1641 | 331 | 331 nouns (all have cases) |
| search-index | n/a | 3454 total | n/a | Full rebuild |

**Validation baseline (before fixes):**
- Core nounbank: 356 errors (332 missing-translations + 23 plural:null + 1 leute type)
- Core verbbank: 191 errors (149 missing-translations + 42 Norwegian type values)
- Total to eliminate: 547 errors across both banks

**Fixes required:**
1. Add `translations: {}` stub to all 331 core nouns without translations (fixes 331 of 332 missing-trans errors; the 1 from _metadata is either excluded by validate script or needs _metadata exclusion in script)
2. Update noun schema: `plural` → allow `null` (fixes 23 errors)
3. Fix `leute_noun.type` → `"noun"` (fixes 1 error)
4. Add `translations: {}` stub to all 148 core verbs + 4 verbphrases without translations (fixes 148-149 missing-trans errors)
5. Fix 42 Norwegian type values in core verbbank (fixes 42 errors)
6. Create `validate:verbs` npm script

---

## Open Questions

1. **Handling of `_metadata` in AJV validation**
   - What we know: `validate-nouns.js` applies `additionalProperties: { $ref: nounEntry }` to ALL keys including `_metadata`, causing 1 spurious "missing translations" error. The script filters count with `filter(k => k !== '_metadata')` but does NOT exclude it from validation.
   - What's unclear: Is the 1 _metadata error included in the "332 missing-translations" count, making it 331 real noun entries + 1 metadata = 332? Or is it 332 noun entries with the issue?
   - Recommendation: Check if adding `translations: {}` to `_metadata` (or adding `if (!entry.word) continue` guard) resolves all 332, or if only 331 are real.
   - **Best approach:** Add the translations stub only to entries with a `word` field (real entries), then verify count drops to 0.

2. **verbphrase entries in core verbbank — do they need translation stubs?**
   - What we know: 4 verbphrase entries (rad_fahren_verbphrase etc.) are in core verbbank, they have `type: "verbphrase"` which is not in the schema enum.
   - What's unclear: Should verbphrases be excluded from validate:verbs altogether (they're a different data class)?
   - Recommendation: Exclude verbphrase entries from the validate:verbs scope (add `if (entry.type === 'verbphrase') continue` or use a separate schema for them). This keeps the validation focused on the 148 proper verbs.

3. **Search index rebuild — translation fallback for dict-only verbs without nb translation**
   - What we know: 0 of 679 dict verb entries have `translations` in the bank. All translations come from the translation files. All 679 currently have `tr.nb` in the index.
   - What's unclear: The exact logic that built the current index (no build script found in `/scripts/`). The index was presumably generated by an external tool or earlier script not in the repo.
   - Recommendation: Reverse-engineer the mapping from the current index entries. The pattern is: `tr.nb = translations/de-nb/verbbank.json[id].translation || translations/de-nb-dict/verbbank.json[id].translation`. Verify against 5-10 known entries before full rebuild.

---

## Sources

### Primary (HIGH confidence)
- Project codebase: `/scripts/sync-preteritum.js` — canonical sync pattern
- Project codebase: `/scripts/validate-nouns.js` — canonical validation pattern
- Project codebase: `/api/vocab/v2/lookup/[language]/[wordId].js` — full handler source, feature flag logic lines 232-263
- Project codebase: `/vocabulary/schema/noun.schema.json`, `/vocabulary/schema/verb.schema.json` — AJV schema definitions
- Project codebase: `/vocabulary/grammar-features.json` — feature flag IDs and descriptions
- Direct AJV run: noun validation = 356 errors (verified breakdown above)
- Direct AJV run: verb validation = 191 errors (verified breakdown above)
- Direct data inspection: core verbbank 144 verbs with perfektum, all 144 in dict verbbank

### Secondary (MEDIUM confidence)
- Inferred: search index build process — reverse-engineered from current index entries and dict bank structure; no build script found in `/scripts/`

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools already installed and used
- Architecture: HIGH — sync pattern from existing scripts, handler from direct source read
- Pitfalls: HIGH — all discovered by direct data inspection and AJV execution
- Search index rebuild: MEDIUM — build script not found; process inferred from data inspection

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable data format; 30-day window)
