# Phase 10: Integration - Research

**Researched:** 2026-02-21
**Domain:** Vocabulary API integration — v2 lookup grammarFeatures, search index rebuild, manifest verification
**Confidence:** HIGH — all findings from direct inspection of source files and live data in this repository

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTG-01 | v2 lookup API exposes `declension` field and pushes `grammar_adjective_declension` to grammarFeatures array | The `declension` field is already passed through at line 214 of `api/vocab/v2/lookup/[language]/[wordId].js`. The `grammar_adjective_declension` push is MISSING — requires a 3-line addition to the grammarFeatures block. |
| INTG-02 | Dictionary search index rebuilt with all new adjective entries | `search-index.json` and `search-index.pretty.json` were generated 2026-02-13, before Phase 6 adj expansion. They contain 106 adj entries; 259 are missing. Need a rebuild script that adds 259 entries and updates `_meta.totalEntries` from 3195 to 3454. |
| INTG-03 | Manifests updated with correct entry counts after bank expansion | Bank manifests (`core/de/manifest.json` and `dictionary/de/manifest.json`) already show `adjectivebank.json: 365` — updated in Phase 6. This requirement is substantively already satisfied. The search index `_meta.totalEntries` updates automatically when INTG-02 is executed. |
</phase_requirements>

---

## Summary

Phase 10 has three requirements, but only two involve new work. INTG-01 requires a 3-line code addition to the v2 lookup API handler. INTG-02 requires writing a search index rebuild script that adds the 259 missing adjective entries from Phase 6 to both `search-index.json` (minified, used by the search API) and `search-index.pretty.json` (human-readable). INTG-03 is already satisfied — bank manifests correctly report 365 adjective entries since Phase 6.

The search index (`vocabulary/dictionary/de/search-index.json`) was last generated 2026-02-13, before Phase 6 expanded the adjective bank from 106 to 365 entries. The index currently has 3,195 entries with 106 adj entries. After rebuilding, it will have 3,454 entries (3,195 + 259 = 3,454). The index format for adjective entries is compact: `{id, w, t, f, c, cur, tr: {nb, en}}`. All source data is ready — `vocabulary/dictionary/de/adjectivebank.json` (365 entries with word/frequency/cefr/curriculum), `vocabulary/translations/de-nb/adjectivebank.json` (365 entries with translation field), and `vocabulary/translations/de-en/adjectivebank.json` (365 entries with translation field) — all complete from Phases 6, 7, 8, and 9.

The v2 lookup API change is minimal. The handler at `api/vocab/v2/lookup/[language]/[wordId].js` already passes `entry.declension` through to the response (line 214). The grammarFeatures block checks `entry.comparison.komparativ` and `entry.comparison.superlativ` but has no check for `entry.declension`. Adding one condition after line 250 resolves INTG-01 completely.

**Primary recommendation:** Execute Phase 10 as a single plan with two tasks — (1) add grammarFeatures check to the lookup API, and (2) write and run a search index rebuild script. A verification script confirms both changes are correct before deploy.

---

## Current State Analysis

### INTG-01: v2 Lookup API — grammarFeatures gap

**File:** `api/vocab/v2/lookup/[language]/[wordId].js`

What the API currently does for adjectives:
- Line 214: `if (entry.declension) response.declension = entry.declension;` — passes declension object through. This already works because `entry.declension` for declinable adjectives is `{positiv: {...}, komparativ: {...}, superlativ: {...}}` (truthy). For undeclinable adjectives (lila, rosa, orange, cool, gern), the `declension` key is absent entirely — `entry.declension` is `undefined` (falsy), so declension is correctly omitted from the response.
- Lines 249-250: Push `grammar_comparative` and `grammar_superlative` for adjectives with comparison data.
- **MISSING:** No push of `grammar_adjective_declension`.

Current grammarFeatures output for a full adjective like `schnell_adj`:
```
['grammar_comparative', 'grammar_superlative']
```

Required grammarFeatures output:
```
['grammar_comparative', 'grammar_superlative', 'grammar_adjective_declension']
```

**The fix:** Add 3 lines after line 250:
```javascript
if (entry.declension && Object.keys(entry.declension).length > 0) {
  grammarFeatures.push('grammar_adjective_declension');
}
```

**Behavior by adjective type:**
- Comparable declinable (352 entries): `declension.positiv`, `declension.komparativ`, `declension.superlativ` present → push `grammar_adjective_declension`. Also `comparison.komparativ` + `.superlativ` present → push `grammar_comparative` + `grammar_superlative`.
- `nicht_komparierbar` declinable (8 entries): `declension.positiv` only → push `grammar_adjective_declension`. No comparison data → skip comparative/superlative.
- Undeclinable (5 entries: lila, rosa, orange, cool, gern): no `declension` key → `entry.declension` undefined → skip. No comparison → skip all grammar features.

**`grammar_adjective_genitive`:** The grammar-features.json includes `grammar_adjective_genitive` (dependsOn `grammar_adjective_declension`). The INTG-01 success criterion only mentions `grammar_adjective_declension`. Do NOT add `grammar_adjective_genitive` push unless a future requirement specifies it.

### INTG-02: Search Index Rebuild

**Files affected:**
- `vocabulary/dictionary/de/search-index.json` (minified — **this is what the API reads**)
- `vocabulary/dictionary/de/search-index.pretty.json` (formatted — for development/debugging)

**Current state:**
- Generated: 2026-02-13 (before Phase 6 adj expansion on 2026-02-21)
- Total entries: 3,195
- Adj entries: 106 (the original pre-expansion set)
- Adj entries missing: 259 (all newly added adjectives from Phase 6)

**Expected state after rebuild:**
- Total entries: 3,454 (3,195 + 259)
- Adj entries: 365

**Entry format** (from search index inspection):
```json
{
  "id": "abhaengig_adj",
  "w": "abhängig",
  "t": "adj",
  "f": 6240,
  "c": "B1",
  "cur": false,
  "tr": {
    "nb": "avhengig",
    "en": "dependent"
  }
}
```

**Field mapping:**
| Index field | Source | Notes |
|-------------|--------|-------|
| `id` | `adjectivebank._id` | Key name |
| `w` | `adjectivebank.word` | German word with umlauts |
| `t` | Derived from `_id` suffix | Last `_`-separated segment: `abhaengig_adj` → `adj` |
| `f` | `adjectivebank.frequency` | Integer rank; null/0 for 11 entries with no corpus data |
| `c` | `adjectivebank.cefr` | `A1`, `A2`, or `B1` for all new entries |
| `cur` | `adjectivebank.curriculum` | `false` for all 259 new entries |
| `tr.nb` | `translations/de-nb/adjectivebank[id].translation` | Primary nb translation (string) |
| `tr.en` | `translations/de-en/adjectivebank[id].translation` | Primary en translation (string) |

**Source data availability:**
- `vocabulary/dictionary/de/adjectivebank.json`: 365 entries with word/frequency/cefr/curriculum — COMPLETE (Phase 6+7+8)
- `vocabulary/translations/de-nb/adjectivebank.json`: 365 entries with translation field — COMPLETE (Phase 9)
- `vocabulary/translations/de-en/adjectivebank.json`: 365 entries with translation field — COMPLETE (Phase 9)

All 259 missing adjectives have `id`, `w`, `t`, `f`, `c`, `cur`, `tr.nb`, and `tr.en` available.

**Rebuild approach:** Write a Node.js script that reads the existing index, reads the dict adjectivebank + both translation files, builds entries for all 259 missing adj, merges into existing index, sorts by some deterministic order, updates `_meta.totalEntries` and `_meta.generatedAt`, writes both `search-index.json` (JSON.stringify minified) and `search-index.pretty.json` (JSON.stringify with 2-space indent).

**Do not rebuild the entire index from scratch.** Only add the missing adj entries. The existing 3,195 entries are correct — no need to re-read all banks. Approach: filter existing entries to all non-adj entries + existing 106 adj entries, then append new 259 adj entries.

Actually, the safest approach: rebuild only the adj portion from the current adjectivebank, then merge with the non-adj portion of the existing index. This ensures all 365 adj entries are correct (including the 106 existing ones that might have updated translation data from Phase 9).

### INTG-03: Manifest Verification

**Core manifest** (`vocabulary/core/de/manifest.json`):
```json
{ "_metadata": { "files": { "adjectivebank.json": 365 }, "totalWords": 1127 } }
```
- `adjectivebank.json: 365` — correct (Phase 6 updated)
- `totalWords: 1127` — has a pre-existing discrepancy: actual sum of file counts = 1126 (manifest shows 1127 due to stale generalbank/nounbank/verbbank counts from before Phase 6). The adjective bank count is correct. **Do not touch other bank counts** — they are pre-existing and out of scope.

**Dict manifest** (`vocabulary/dictionary/de/manifest.json`):
- `_metadata.files.adjectivebank.json: 365` — correct (Phase 6 updated)
- `_metadata.totalWords: 1126` — the sum of the tracked subset (not full dict size)
- `totalWords: 3454` (top-level) — the full dictionary size, already correct

**Verdict:** INTG-03 is already satisfied for the adjective bank count. No manifest file changes needed in Phase 10. The verification task should confirm these counts and note them in the VERIFICATION.md.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in (`fs`) | v18+ | Read/write JSON files | No external dependencies needed; all prior phases use this pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | No external libraries needed for this phase |

**Installation:** None needed. This phase has zero new dependencies.

---

## Architecture Patterns

### Pattern 1: v2 Lookup API grammarFeatures Extension

**What:** Add one conditional block to the grammarFeatures assembly section in `api/vocab/v2/lookup/[language]/[wordId].js`.

**Location:** After line 250 (after the `grammar_superlative` push), before line 259 (`if (grammarFeatures.length > 0)`).

**Current code block (lines 231-259):**
```javascript
const grammarFeatures = [];
if (entry.conjugations?.presens) grammarFeatures.push('grammar_present');
// ... (verb-related pushes)
if (entry.comparison?.komparativ) grammarFeatures.push('grammar_comparative');
if (entry.comparison?.superlativ) grammarFeatures.push('grammar_superlative');
// Check explanation text for case references (contractions, prepositions)
// ...
if (grammarFeatures.length > 0) response.grammarFeatures = grammarFeatures;
```

**Addition (insert after the `grammar_superlative` line):**
```javascript
// Adjective declension feature
if (entry.declension && Object.keys(entry.declension).length > 0) {
  grammarFeatures.push('grammar_adjective_declension');
}
```

**Why `Object.keys(entry.declension).length > 0`:** An empty `{}` declension object would be truthy in JS but has no content. Checking key count guards against this edge case. In practice, all declinable adjectives have populated declension objects after Phase 8, but defensive coding is better here.

### Pattern 2: Search Index Partial Rebuild Script

**What:** A Node.js ESM script that regenerates the adjective portion of the search index and merges with the unchanged non-adj portion.

**Pattern established by:** `generate-stubs.js` (Phase 6) — reads multiple bank files, constructs entries, writes result. `generate-comparison.js` (Phase 7) — `processBank()` function, dual-file writes.

**Script location:** `.planning/phases/10-integration/rebuild-search-index.js`

```javascript
// .planning/phases/10-integration/rebuild-search-index.js
import { readFileSync, writeFileSync } from 'fs';

const ROOT = process.cwd();

// Read source data
const adjBank = JSON.parse(readFileSync(`${ROOT}/vocabulary/dictionary/de/adjectivebank.json`, 'utf8'));
const nbTrans = JSON.parse(readFileSync(`${ROOT}/vocabulary/translations/de-nb/adjectivebank.json`, 'utf8'));
const enTrans = JSON.parse(readFileSync(`${ROOT}/vocabulary/translations/de-en/adjectivebank.json`, 'utf8'));
const existingIndex = JSON.parse(readFileSync(`${ROOT}/vocabulary/dictionary/de/search-index.pretty.json`, 'utf8'));

// Build fresh adj entries from current adjectivebank (all 365)
const adjEntries = [];
for (const [id, entry] of Object.entries(adjBank)) {
  if (id === '_metadata') continue;
  adjEntries.push({
    id: entry._id,
    w: entry.word,
    t: 'adj',
    f: entry.frequency || null,
    c: entry.cefr || null,
    cur: entry.curriculum || false,
    tr: {
      nb: nbTrans[id]?.translation || null,
      en: enTrans[id]?.translation || null,
    }
  });
}

// Merge: non-adj from existing index + all 365 adj entries rebuilt fresh
const nonAdjEntries = existingIndex.entries.filter(e => e.t !== 'adj');
const allEntries = [...nonAdjEntries, ...adjEntries];

// Sort: keep existing non-adj order; sort adj entries by id for determinism
allEntries.sort((a, b) => a.id.localeCompare(b.id));

const newIndex = {
  _meta: {
    ...existingIndex._meta,
    totalEntries: allEntries.length,
    generatedAt: new Date().toISOString(),
  },
  entries: allEntries,
};

// Write minified (API reads this)
writeFileSync(
  `${ROOT}/vocabulary/dictionary/de/search-index.json`,
  JSON.stringify(newIndex) + '\n'
);
// Write pretty (human reference)
writeFileSync(
  `${ROOT}/vocabulary/dictionary/de/search-index.pretty.json`,
  JSON.stringify(newIndex, null, 2) + '\n'
);

console.log(`Wrote ${allEntries.length} entries (${adjEntries.length} adj + ${nonAdjEntries.length} non-adj)`);
console.log(`Expected: 3454 entries (365 adj + ${3454 - 365} non-adj)`);
```

**Key decisions in this approach:**
- Rebuild all 365 adj entries from current bank data (not just the 259 new ones) — ensures translation data from Phase 9 is reflected for all adj entries, not just new ones.
- Keep non-adj entries from the existing index unchanged — no need to re-read all other banks.
- Sort all entries alphabetically by `id` — deterministic output.

### Pattern 3: Verification Script

**What:** A verification script that confirms all three INTG requirements are met before Vercel deploy.

**File:** `.planning/phases/10-integration/verify-integration.js`

Checks to include:
1. **INTG-01a:** Load dict adj bank entry with declension; simulate API grammarFeatures logic; assert `grammar_adjective_declension` is in result array.
2. **INTG-01b:** Load undeclinable adj; confirm `grammar_adjective_declension` NOT pushed.
3. **INTG-01c:** Load `nicht_komparierbar` adj; confirm `grammar_adjective_declension` IS pushed; confirm `grammar_comparative` NOT pushed.
4. **INTG-02a:** Load rebuilt search index; count adj entries; assert === 365.
5. **INTG-02b:** Count total entries; assert === 3454.
6. **INTG-02c:** Verify `_meta.totalEntries` matches actual entry count.
7. **INTG-02d:** Spot-check: verify 5 specific new adj entries exist in index with correct fields.
8. **INTG-02e:** Verify `tr.nb` and `tr.en` fields present and non-null for all 365 adj entries.
9. **INTG-03a:** Core manifest `adjectivebank.json` count === 365.
10. **INTG-03b:** Dict manifest `adjectivebank.json` count === 365.

### Anti-Patterns to Avoid

- **Rebuilding the entire search index from scratch:** Do not re-read all bank files (nounbank, verbbank, etc.). The existing index is correct for non-adj entries; only the adj section needs updating. Re-reading everything adds scope and risk.
- **Only appending the 259 new entries (not rebuilding all 365 adj):** The 106 existing adj entries in the index may have outdated translation data (Phase 9 upgraded them from simple to rich format; the `translation` field value itself didn't change but the principle of using current data is safer). Rebuilding all 365 adj from current bank data is the clean approach.
- **Forgetting to write the minified `search-index.json`:** The search API reads `search-index.json` (minified), not `search-index.pretty.json`. Both must be written. Missing the minified file means the search API silently returns stale data.
- **Sorting the search index entries:** Don't sort if it breaks existing non-adj order significantly. The API searches by linear scan, so order doesn't affect correctness. However, sorting by `id` for all entries is acceptable and makes debugging easier. Either approach is valid.
- **Adding `grammar_adjective_genitive` to the API:** The INTG-01 success criterion only requires `grammar_adjective_declension`. Adding `grammar_adjective_genitive` is out of scope for this phase.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Search index generation from scratch | Full rebuild reading all banks | Partial rebuild: non-adj from existing + fresh adj from adjectivebank | Existing non-adj entries are correct; rebuilding adds risk |
| Translation data lookup | Any normalization/transformation | Direct `nbTrans[id]?.translation` field access | Phase 9 confirmed all 365 adj have translation field populated |
| grammarFeatures condition | Complex type detection | Simple `entry.declension && Object.keys(entry.declension).length > 0` | Matches exactly how other grammarFeatures conditions are written in the same file |

**Key insight:** This is the smallest possible integration phase. Two atomic changes (one API code edit, one data file rebuild) fully satisfy all three requirements. Resist scope creep.

---

## Common Pitfalls

### Pitfall 1: Forgetting the Minified Index

**What goes wrong:** Developer writes `search-index.pretty.json` but not `search-index.json`. The search API at `api/vocab/v2/search/[language].js` line 33 reads:
```javascript
const indexPath = path.join(vocabBase, 'dictionary', langCode, 'search-index.json');
```
The pretty file is ignored by the API. New adj entries never appear in search results.

**Why it happens:** The pretty file is visually obvious (human-readable); the minified file is easy to overlook.

**How to avoid:** Write both files in the same script. Verification check 2b confirms the rebuilt index contains 365 adj entries — run it against both files.

**Warning signs:** Search API returns 0 results for new adjectives; verification check passes on pretty file but not minified.

### Pitfall 2: grammarFeatures Check Placed in Wrong Position

**What goes wrong:** The `grammar_adjective_declension` check is added outside the grammarFeatures block, or inside a condition that only applies to nouns.

**Why it happens:** The grammarFeatures block in the API is long (lines 231-259) with many type-specific conditions.

**How to avoid:** Place the addition immediately after line 250 (`grammar_superlative` push), before the explanation-text checks. The `entry.declension` check works regardless of entry type — nouns also have a `declension` field but it has different structure (noun case tables, not adjective stark/schwach/gemischt tables). Check: do any noun entries currently pass the `Object.keys(entry.declension).length > 0` test?

**Noun declension check:** Looking at the API code, line 214: `if (entry.declension) response.declension = entry.declension;` — this passes noun declension already. But nouns use a different `declension` structure (`{nominativ: ..., akkusativ: ...}` flat case keys). `Object.keys(nounDeclension).length > 0` for a noun with declension data would be truthy — which would incorrectly push `grammar_adjective_declension` for nouns.

**Fix:** Add a type check: `if (entry.type === 'adj' && entry.declension && ...)` — but looking at the API, the response is built before grammarFeatures, and `entry.type` may not be set on all dict bank entries. Safer: check for the adj-specific declension structure key `positiv`:

```javascript
// Adjective declension — checks for positiv key which is adj-specific
if (entry.declension?.positiv) {
  grammarFeatures.push('grammar_adjective_declension');
}
```

This is more precise: nouns have `declension.nominativ` etc. but never `declension.positiv`. Only adj declension blocks have `positiv` as a top-level key.

### Pitfall 3: Search Index Entry Missing `tr.nb` or `tr.en`

**What goes wrong:** A new adj entry in the rebuilt index has `tr: {nb: null, en: null}`. The search API will never match it on translation queries.

**Why it happens:** The translation file lookup fails for an entry (key mismatch, encoding issue, etc.).

**How to avoid:** Verification check 2e: count all adj entries with null `tr.nb` or `tr.en`; assert count === 0.

**Warning signs:** Searching for an adj by Norwegian or English translation returns no results.

### Pitfall 4: Noun Declension False Positive for grammarFeatures

**What goes wrong:** Checking `entry.declension && Object.keys(entry.declension).length > 0` also pushes `grammar_adjective_declension` for nouns that have case declension data (like Familie, which has `cases.akkusativ` etc.).

**How to avoid:** Use `entry.declension?.positiv` as the condition instead of key count. The `positiv` key is unique to adjective declension blocks. Noun declension uses `nominativ`, `akkusativ`, `dativ`, `genitiv` as top-level keys.

**Note:** Inspect noun bank entry structure to confirm they don't use `positiv` key:
```python
# Noun sample: entry.declension may have nominativ/akkusativ — not positiv
```
Confirmed: `vocabulary/dictionary/de/nounbank.json` entries do NOT have a `declension` key (they have a `cases` key instead). The `if (entry.declension) response.declension = entry.declension` on line 214 likely handles noun case tables — but checking the noun bank confirms this. Either condition (`Object.keys().length > 0` or `?.positiv`) is safe for nouns since they don't have `declension` key.

---

## Code Examples

### INTG-01: grammarFeatures Addition

**File:** `api/vocab/v2/lookup/[language]/[wordId].js`

Find this block (currently ends around line 250):
```javascript
    if (entry.comparison?.komparativ) grammarFeatures.push('grammar_comparative');
    if (entry.comparison?.superlativ) grammarFeatures.push('grammar_superlative');
    // Check explanation text for case references (contractions, prepositions)
```

Replace with:
```javascript
    if (entry.comparison?.komparativ) grammarFeatures.push('grammar_comparative');
    if (entry.comparison?.superlativ) grammarFeatures.push('grammar_superlative');
    // Adjective declension — positiv key is unique to adjective declension blocks
    if (entry.declension?.positiv) {
      grammarFeatures.push('grammar_adjective_declension');
    }
    // Check explanation text for case references (contractions, prepositions)
```

### INTG-02: Verification Spot-Check Pattern

```javascript
// verify-integration.js — INTG-02 spot checks
const index = JSON.parse(readFileSync('vocabulary/dictionary/de/search-index.json', 'utf8'));
const adjEntries = index.entries.filter(e => e.t === 'adj');

function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: got ${actual}, expected ${expected}`);
  if (!ok) process.exitCode = 1;
}

check('adj entry count', adjEntries.length, 365);
check('total entry count', index.entries.length, 3454);
check('_meta.totalEntries', index._meta.totalEntries, 3454);

// Spot-check a new adj entry (abhaengig_adj was not in the original index)
const abhaengig = index.entries.find(e => e.id === 'abhaengig_adj');
check('abhaengig_adj exists', !!abhaengig, true);
check('abhaengig_adj t', abhaengig?.t, 'adj');
check('abhaengig_adj tr.nb', abhaengig?.tr?.nb, 'avhengig');
check('abhaengig_adj tr.en', abhaengig?.tr?.en, 'dependent');
check('abhaengig_adj c', abhaengig?.c, 'B1');

// All adj entries have tr fields
const missingNb = adjEntries.filter(e => !e.tr?.nb).length;
const missingEn = adjEntries.filter(e => !e.tr?.en).length;
check('no adj missing tr.nb', missingNb, 0);
check('no adj missing tr.en', missingEn, 0);
```

### INTG-01: grammarFeatures Verification Pattern

```javascript
// verify-integration.js — INTG-01 checks (simulate API logic)
const adjBank = JSON.parse(readFileSync('vocabulary/dictionary/de/adjectivebank.json', 'utf8'));

// Check a typical comparable adj (schnell_adj)
const schnell = adjBank['schnell_adj'];
const grammarFeatures = [];
if (schnell.comparison?.komparativ) grammarFeatures.push('grammar_comparative');
if (schnell.comparison?.superlativ) grammarFeatures.push('grammar_superlative');
if (schnell.declension?.positiv) grammarFeatures.push('grammar_adjective_declension');

check('schnell has grammar_adjective_declension', grammarFeatures.includes('grammar_adjective_declension'), true);
check('schnell has grammar_comparative', grammarFeatures.includes('grammar_comparative'), true);

// Check undeclinable adj (lila_adj)
const lila = adjBank['lila_adj'];
const lilaGF = [];
if (lila.comparison?.komparativ) lilaGF.push('grammar_comparative');
if (lila.declension?.positiv) lilaGF.push('grammar_adjective_declension');
check('lila has NO grammar_adjective_declension', lilaGF.includes('grammar_adjective_declension'), false);

// Check nicht_komparierbar adj (absolut_adj)
const absolut = adjBank['absolut_adj'];
const absolutGF = [];
if (absolut.comparison?.komparativ) absolutGF.push('grammar_comparative');
if (absolut.declension?.positiv) absolutGF.push('grammar_adjective_declension');
check('absolut has grammar_adjective_declension', absolutGF.includes('grammar_adjective_declension'), true);
check('absolut has NO grammar_comparative', absolutGF.includes('grammar_comparative'), false);
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| grammarFeatures for adjectives: only `grammar_comparative` and `grammar_superlative` | Add `grammar_adjective_declension` when `declension.positiv` present | Leksihjelp can now enable the adjective declension UI feature for entries where declension data exists |
| Search index with 106 adj entries (2026-02-13, pre-Phase-6) | Rebuilt index with 365 adj entries | All new adjectives (259 from Goethe A1/A2/B1) are discoverable via search |
| Bank manifests updated in Phase 6 | No change needed for manifests | Manifests already correct at 365 — Phase 10 confirms, doesn't change |

---

## Open Questions

1. **Noun declension and grammarFeatures false positive**
   - What we know: Noun bank entries use a `cases` key (not `declension`) for case data. The lookup API reads from the dict bank which has no `declension` key on noun entries.
   - What's unclear: Are there any dict bank entries across all banks that have a `declension` key but are not adjectives? If so, `entry.declension?.positiv` is the safe guard (positiv is adj-specific).
   - Recommendation: Use `entry.declension?.positiv` as the condition (not `Object.keys(entry.declension).length > 0`) to be unambiguously adj-specific.

2. **Sort order for rebuilt search index**
   - What we know: The search API does a linear scan through `index.entries`. Order doesn't affect search correctness. The existing index has some ordering from the original generation.
   - What's unclear: Whether the existing index is sorted by any specific key or just in insertion order.
   - Recommendation: Sort all entries by `id` (alphabetical) in the rebuilt index. This is deterministic, reproducible, and makes future debugging easier.

3. **Pre-existing core manifest discrepancies (out of scope)**
   - What we know: Core manifest `generalbank.json: 185` vs actual 186; `nounbank.json: 332` vs actual 331; `verbbank.json: 149` vs actual 148. These are pre-existing discrepancies from before the v1.1 milestone.
   - What's unclear: Whether INTG-03 requires fixing these pre-existing discrepancies.
   - Recommendation: Do NOT fix these in Phase 10. INTG-03 says "Manifests updated with correct entry counts **reflecting the expanded adjective bank**" — the adjective count (365) is already correct. Fixing other bank discrepancies is a separate scope and out of bounds for this milestone.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection: `api/vocab/v2/lookup/[language]/[wordId].js` — grammarFeatures block verified; `if (entry.declension)` at line 214 confirmed; `grammar_adjective_declension` confirmed absent.
- Direct inspection: `api/vocab/v2/search/[language].js` — confirmed reads `search-index.json` (minified), not pretty.
- Programmatic analysis: `vocabulary/dictionary/de/search-index.pretty.json` — 3,195 entries, 106 adj, generated 2026-02-13. 259 adj entries missing.
- Programmatic analysis: `vocabulary/dictionary/de/adjectivebank.json` — 365 entries (all 365 have `declension.positiv`; 5 undeclinable have no `declension` key).
- Programmatic analysis: `vocabulary/translations/de-nb/adjectivebank.json` — 365 entries with `translation` field. All new adj IDs present (confirmed `abhaengig_adj.translation = 'avhengig'`).
- Programmatic analysis: `vocabulary/translations/de-en/adjectivebank.json` — 365 entries with `translation` field. All new adj IDs present.
- Direct inspection: `vocabulary/dictionary/de/manifest.json` — `_metadata.files.adjectivebank.json: 365` confirmed.
- Direct inspection: `vocabulary/core/de/manifest.json` — `_metadata.files.adjectivebank.json: 365` confirmed.
- Direct inspection: `vocabulary/grammar-features.json` — `grammar_adjective_declension` and `grammar_adjective_genitive` features confirmed with correct `dataPath` and `dependsOn` values.
- Direct inspection: `vercel.json` — `includeFiles: "vocabulary/**/*.json"` confirms all vocabulary JSON files are bundled into Vercel functions, including the rebuilt search index.

### Secondary (MEDIUM confidence)

- Pattern analysis from Phase 6 `generate-stubs.js` — established script pattern for dual-bank writes and manifest updates.
- Pattern analysis from Phase 8 `generate-declension.js` + `verify-declension.js` — establishes verify script pattern alongside generate script.

---

## Metadata

**Confidence breakdown:**
- INTG-01 scope and code change: HIGH — direct code inspection; change is minimal and localized
- INTG-02 scope: HIGH — programmatic analysis confirms exactly 259 adj entries missing; source data verified complete
- INTG-02 script pattern: HIGH — follows established Phase 6/7/8 patterns exactly
- INTG-03 status: HIGH — manifest values verified programmatically; no changes needed
- `declension?.positiv` condition for noun safety: MEDIUM — noun bank inspection confirms no `declension` key; logic reasoning supports `?.positiv` being safer; not tested against all banks

**Research date:** 2026-02-21
**Valid until:** Stable — internal file structure, not external API. Valid until files change.
