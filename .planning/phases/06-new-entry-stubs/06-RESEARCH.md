# Phase 6: New Entry Stubs - Research

**Researched:** 2026-02-21
**Domain:** JSON data manipulation, German vocabulary bank structure, frequency data sourcing
**Confidence:** HIGH — all findings from direct inspection of source files in this repository

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Flagged candidates
- Include all 13 flagged candidates (borderline participials like "abwesend") — they passed the attributive test, that's sufficient
- Trust the Phase 4 candidate list as-is — no re-validation or deduplication check needed
- Include the `audio` field with expected filename pattern (`adjektiv_[stem].mp3`) even though audio files don't exist yet

#### Entry ordering
- Re-sort the entire file alphabetically — both existing 106 entries and 259 new entries merged into one alphabetical order
- Both core and dictionary banks use the same sort order
- `_metadata` block placement and sort key (by JSON key vs word value) left to Claude's discretion

#### Frequency sourcing
- Source real frequency data from a reputable German word frequency corpus (Leipzig Corpora or similar)
- Research existing frequency values first to determine what source/scale the current 106 entries use, then match or normalize new data to the same scale
- If frequency data proves hard to source programmatically, use placeholder value (0) to unblock stub creation — frequency can be backfilled later

#### Stub shape — core bank
- Fields: `word`, `_id`, `audio`, plus empty placeholders `comparison: {}` and `declension: {}`
- No undeclinable/nicht_komparierbar flags — those are Phase 7's responsibility

#### Stub shape — dictionary bank
- Mirror core bank shape (including empty comparison/declension placeholders)
- Additional fields: `curriculum: false`, `cefr` (from Phase 4 candidate data), `frequency` (sourced per frequency decision above)
- All new entries have `curriculum: false` — curriculum membership is determined externally, not embedded in vocabulary data

### Claude's Discretion
- Sort key choice (JSON key vs word value for alphabetical ordering)
- `_metadata` block placement (top vs bottom after re-sort)
- Exact script/approach for frequency data sourcing
- How to handle the `generatedAt` timestamp in `_metadata` after re-sort

### Deferred Ideas (OUT OF SCOPE)
- **CEFR backfill for existing entries** — All 106 existing bank entries have `cefr: 'A1'` as a v1.0 artifact (not real CEFR data). Should be corrected in a future phase.
- **Curriculum/manifest architecture** — Decouple curriculum membership from vocabulary data entirely. Use manifest files that map word IDs to lessons, so vocabulary data stays lesson-agnostic. The `curriculum` field in the dictionary bank would eventually be replaced by manifest lookups.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BANK-02 | New adjective entries added to core bank (`vocabulary/core/de/adjectivebank.json`) with word, _id, audio fields | 259 candidates in `04-candidates.json` all have pre-generated `_id` values. Core stub shape: `{ word, _id, audio, comparison: {}, declension: {} }`. Empty `{}` for comparison and declension is schema-valid (no required sub-fields). File needs re-sort by `_id` key after merge. |
| BANK-03 | New adjective entries mirrored to dictionary bank (`vocabulary/dictionary/de/adjectivebank.json`) with curriculum, cefr, frequency metadata | Dictionary stub adds `curriculum: false`, `cefr` (from candidate data), `frequency` (rank from `vocabulary/dictionary/frequency/de_50k.txt`). 248/259 candidates have frequency data in the corpus file; 11 missing words get placeholder `0`. |
</phase_requirements>

---

## Summary

Phase 6 is a pure data-manipulation task. The candidate list already exists (`04-candidates.json`) with all 259 entries fully specified — each has `word`, `_id`, `cefr`, and `source` fields. No linguistic judgment is required. The work is: read the candidate list, construct the correct stub shape for each entry, merge with the existing 106 entries, re-sort, and write both bank files plus update both manifest counts.

The frequency data source is already present in the repository at `vocabulary/dictionary/frequency/de_50k.txt`. Inspection confirms that the existing bank stores frequency as a **1-based rank** from this file (line 1 = most common word). The 50k file lists word-count pairs sorted descending; line number equals the rank stored in the bank. Of the 259 candidates, 248 appear in the file and get real ranks; 11 do not appear and get placeholder `0`.

The schema (`vocabulary/schema/adjective.schema.json`) already supports empty `comparison: {}` and `declension: {}` — both are defined as objects with no required sub-fields and `additionalProperties: false`, so `{}` is valid. Schema validation can be run using `scripts/validate-adjectives.js` to confirm the result.

**Primary recommendation:** Write a single Node.js script that reads candidates + both banks, merges and sorts, writes both output files, and updates both manifests. Run schema validation afterwards to confirm correctness.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js (built-in) | v25 (project runtime) | Read/write JSON, lookup frequency | No external dependencies needed — this is pure JSON manipulation |
| `ajv` | `^8.18.0` (devDep) | JSON Schema validation post-write | Already installed; `validate-adjectives.js` uses it |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `fs` (built-in) | — | Read `de_50k.txt` line by line, write JSON files | Always — no streaming needed, file is 50k lines (~500KB) |

**Installation:** None needed. All dependencies already present.

---

## Architecture Patterns

### Recommended Approach: Single merge script

Write a one-shot Node.js script (`.planning/phases/06-new-entry-stubs/generate-stubs.js` or inline) that:

1. Reads `04-candidates.json` (259 entries, pre-validated)
2. Builds a frequency rank map from `vocabulary/dictionary/frequency/de_50k.txt`
3. Reads `vocabulary/core/de/adjectivebank.json` (106 existing entries + `_metadata`)
4. Reads `vocabulary/dictionary/de/adjectivebank.json` (106 existing entries + `_metadata`)
5. Constructs stub objects for each candidate
6. Merges new + existing, re-sorts by JSON key (`_id`), inserts `_metadata` at top
7. Writes both bank files
8. Updates both manifest files with correct counts

### Pattern 1: Frequency Rank Lookup

**What:** The file `vocabulary/dictionary/frequency/de_50k.txt` is tab/space-separated, one word per line, sorted by frequency descending. Line number (1-based) = frequency rank stored in the bank.

**Confirmed by inspection:** `gut` is on line 52; `gut_adj` has `frequency: 52`. `weiß` is on line 70; `weiss_adj` has `frequency: 70`. `neblig` is on line 40259; `neblig_adj` has `frequency: 40259`.

```javascript
// Source: direct file inspection
const lines = fs.readFileSync('vocabulary/dictionary/frequency/de_50k.txt', 'utf8').split('\n');
const rankMap = {};
lines.forEach((line, i) => {
  const word = line.split(/\s+/)[0];
  if (word) rankMap[word] = i + 1;  // 1-based rank
});
// Lookup: rankMap['abhängig'] -> rank or undefined
const freq = rankMap[candidate.word] ?? 0;  // 0 for missing words
```

**Coverage:** 248 of 259 candidates found in corpus. 11 missing words that get `frequency: 0`:
`alternativ`, `ausländisch`, `berufstätig`, `eckig`, `einheitlich`, `haltbar`, `interkulturell`, `pauschal`, `städtisch`, `stilistisch`, `virtuell`

### Pattern 2: Core Bank Stub Shape

```javascript
// Core bank stub — confirmed valid against adjective.schema.json
{
  "word": candidate.word,         // e.g. "abhängig"
  "_id": candidate._id,           // e.g. "abhaengig_adj"
  "audio": "adjektiv_" + candidate._id.replace('_adj', '') + ".mp3",
  "comparison": {},
  "declension": {}
}
```

**Schema validation:** `comparison: {}` and `declension: {}` both pass the schema — no sub-fields are required, and `additionalProperties: false` on an empty object is valid.

### Pattern 3: Dictionary Bank Stub Shape

```javascript
// Dictionary bank stub
{
  "word": candidate.word,
  "_id": candidate._id,
  "audio": "adjektiv_" + candidate._id.replace('_adj', '') + ".mp3",
  "curriculum": false,
  "cefr": candidate.cefr,          // "A1", "A2", or "B1"
  "frequency": rankMap[candidate.word] ?? 0,
  "comparison": {},
  "declension": {}
}
```

### Pattern 4: Sort Order — By JSON Key

**Recommendation:** Sort by `_id` (JSON key), not by `word` value.

**Rationale:**
- `_id` values are ASCII-only (umlauts transliterated: ä→ae, ö→oe, ü→ue, ß→ss)
- Sort is deterministic across all environments — no locale dependency
- Developers can predict position from word: `abhängig` → `abhaengig_adj` → sorts before `absolut_adj`
- By contrast, sorting by word value (`localeCompare('de')`) produces different positions depending on Node.js ICU data and collation version

```javascript
// Sort all non-_metadata keys by _id (the key itself, since key === _id)
const sorted = Object.entries(merged)
  .filter(([k]) => k !== '_metadata')
  .sort(([a], [b]) => a.localeCompare(b));

const output = { _metadata: updatedMetadata };
for (const [k, v] of sorted) output[k] = v;
```

### Pattern 5: Metadata Placement

**Recommendation:** Keep `_metadata` at the top (first key in the object).

Node.js `JSON.parse` preserves insertion order. By constructing the output object with `_metadata` first, then adding sorted entries, `JSON.stringify` will emit `_metadata` before all word entries. This matches the current file structure.

Update `generatedAt` to the current ISO timestamp when writing the new file.

### Pattern 6: Manifest Update

Both manifest files track `adjectivebank.json` entry count and `totalWords`. After Phase 6:

- Core manifest: `adjectivebank.json` count goes from `108` (stale — actual is 106 post-Phase-3) to `365`
- Core manifest: `totalWords` goes from `870` to `870 - 2 + 259 = 1127` (correcting Phase 3 stale count)
- Dictionary manifest: `adjectivebank.json` count goes from `106` to `365`
- Dictionary manifest: `totalWords`, `curriculumWords`, `dictionaryOnlyWords` need recalculation

Note: The core manifest currently says `108` but the actual post-Phase-3 count is `106`. Phase 6 should correct this to `365` (not `108 + 259 = 367`).

### Anti-Patterns to Avoid

- **Generating IDs from scratch:** The `_id` values are already in `04-candidates.json`. Do not re-derive them — use the pre-validated values directly.
- **Sorting by word value:** German umlaut sort order is locale-dependent. Sort by `_id` (ASCII key) for determinism.
- **Updating search index in Phase 6:** Search index rebuild is Phase 10 (INTG-02). Phase 6 does not touch `search-index.json` or `search-index.pretty.json`.
- **Adding translation files:** Translations are Phase 9 (BANK-04/05). Phase 6 stubs have no translation data.
- **Including `type: "adj"` field:** Only 3 of 106 existing entries have a `type` field (legacy). New stubs should not include it — the bank file type is implicit from the filename.
- **Forgetting the `_metadata` block:** Both bank files have a `_metadata` block that must survive the rewrite with an updated `generatedAt`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frequency lookup | Custom corpus download script | Read `vocabulary/dictionary/frequency/de_50k.txt` already in repo | File already present, format confirmed, 248/259 coverage |
| ID generation | Umlaut replacement logic | Use `_id` values from `04-candidates.json` directly | Already validated in Phase 4; re-deriving risks divergence |
| Schema validation | Custom field checks | `scripts/validate-adjectives.js` with ajv | Schema already covers the adjective entry structure |

**Key insight:** All the hard work (ID generation, candidate validation, CEFR assignment, umlaut transliteration) was done in Phase 4. Phase 6 only needs to reshape and merge the pre-validated data.

---

## Common Pitfalls

### Pitfall 1: Manifest Count Stale from Phase 3

**What goes wrong:** Core manifest shows `adjectivebank.json: 108` but Phase 3 removed 2 entries (beste_adj and lieblings-_adj). The actual current count is 106. If Phase 6 adds 259 to 108, the new total would be 367 — incorrect. Correct new total is 106 + 259 = 365.

**Why it happens:** Phase 3 bank cleanup updated the bank files but the manifest was not updated (verified by inspection: manifest says 108, actual file has 106 entries).

**How to avoid:** Count actual entries from the JSON file, not from the manifest, when computing the new total.

**Warning signs:** `Object.keys(coreBank).filter(k => k !== '_metadata').length` returns 106 while manifest says 108.

### Pitfall 2: Overwriting `_metadata` During Sort/Merge

**What goes wrong:** If the output is built by spreading all bank entries and then sorting, `_metadata` may be sorted alphabetically among word entries (it sorts before `a` as `_`). The resulting file would have `_metadata` in the middle of word entries.

**How to avoid:** Explicitly separate `_metadata` from the entries before sorting, then prepend it when building the output object.

### Pitfall 3: `frequency: null` vs `frequency: 0`

**What goes wrong:** The existing bank has one entry (`regnerisch_adj`) with `frequency: null`. New missing-corpus words should use `0`, not `null`, per the user decision. Using `null` is inconsistent with the decision and may affect sort behavior in the v2 API (which ranks by frequency).

**How to avoid:** Use `rankMap[candidate.word] ?? 0` — the nullish coalescing ensures `0` when not found.

### Pitfall 4: Audio Pattern Inconsistency for Legacy Entries

**What goes wrong:** Two existing entries (`geheim_adj`, `recht_adj`) use the pattern `ord_[word].mp3` instead of `adjektiv_[stem].mp3`. These are legacy entries. New stubs should use `adjektiv_[stem].mp3`, which is the established modern pattern.

**How to avoid:** Generate audio for NEW entries as `adjektiv_[id-stem].mp3`. Do not attempt to normalize legacy entries' audio filenames in this phase.

### Pitfall 5: Duplicate Key When Merging

**What goes wrong:** If a candidate `_id` accidentally matches an existing bank entry, the merge would produce a duplicate that silently overwrites the existing entry (JavaScript object spread behavior).

**How to avoid:** The Phase 4 candidate file already deduplicated against the bank. Verify at the start of the script: `assert(candidates.every(c => !existingIds.has(c._id)))`. The overlap check during research confirms zero duplicates.

---

## Code Examples

### Complete Stub Generation (Core Bank)

```javascript
// All inputs confirmed through research

const candidateData = JSON.parse(fs.readFileSync('.planning/phases/04-goethe-adjective-extraction/04-candidates.json', 'utf8'));
const candidates = candidateData.candidates; // 259 entries

// Build frequency rank map (1-based line number = rank)
const freqLines = fs.readFileSync('vocabulary/dictionary/frequency/de_50k.txt', 'utf8').split('\n');
const rankMap = {};
freqLines.forEach((line, i) => {
  const word = line.split(/\s+/)[0];
  if (word) rankMap[word] = i + 1;
});

// Read existing core bank
const coreBank = JSON.parse(fs.readFileSync('vocabulary/core/de/adjectivebank.json', 'utf8'));

// Construct new stubs
for (const c of candidates) {
  const stem = c._id.replace('_adj', '');
  coreBank[c._id] = {
    word: c.word,
    _id: c._id,
    audio: `adjektiv_${stem}.mp3`,
    comparison: {},
    declension: {}
  };
}

// Sort: extract _metadata, sort entries by key, reassemble
const { _metadata, ...entries } = coreBank;
const sorted = Object.fromEntries(
  Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))
);
const output = {
  _metadata: { ..._metadata, generatedAt: new Date().toISOString() },
  ...sorted
};

fs.writeFileSync('vocabulary/core/de/adjectivebank.json', JSON.stringify(output, null, 2) + '\n');
```

### Dictionary Bank Extension

```javascript
// Same pattern but with additional fields
coreBank[c._id] = {
  word: c.word,
  _id: c._id,
  audio: `adjektiv_${stem}.mp3`,
  curriculum: false,
  cefr: c.cefr,                    // "A1", "A2", or "B1" from candidates
  frequency: rankMap[c.word] ?? 0, // rank or 0 for 11 missing words
  comparison: {},
  declension: {}
};
```

### Manifest Update

```javascript
const manifest = JSON.parse(fs.readFileSync('vocabulary/core/de/manifest.json', 'utf8'));
const newAdjectiveCount = 365; // 106 actual + 259 new
manifest._metadata.files['adjectivebank.json'] = newAdjectiveCount;
// totalWords: subtract old count (106), add new count (365)
manifest._metadata.totalWords = manifest._metadata.totalWords - 106 + newAdjectiveCount;
manifest._metadata.generatedAt = new Date().toISOString();
fs.writeFileSync('vocabulary/core/de/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
```

### Schema Validation

```bash
# Run after writing both bank files
node scripts/validate-adjectives.js
# Expected output: "PASS: All 365 adjective entries validate against schema"
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Frequency stored as count | Frequency stored as rank (1-based line in de_50k.txt) | Lower = more common; consistent with existing 106 entries; lookup is O(1) from pre-built map |
| No comparison/declension fields in stubs | Empty placeholder `{}` fields in stubs | Downstream phases (7, 8) know exactly which fields to populate; schema validates empty objects |

---

## Open Questions

1. **Should the dictionary manifest's `totalWords` / `curriculumWords` / `dictionaryOnlyWords` change?**
   - What we know: Phase 6 adds 259 new entries, all with `curriculum: false`, so they are "dictionary-only" words, not curriculum words.
   - What's unclear: The dictionary manifest tracks these separately. Adding 259 `curriculum: false` entries means `dictionaryOnlyWords` increases by 259, but `curriculumWords` stays the same. The top-level `totalWords` in the dictionary manifest (currently 3195, covering all entry types) also needs updating.
   - Recommendation: Update all three counts during Phase 6 to keep the manifest accurate. The planner should specify the exact arithmetic.

2. **Does Phase 6 need to create translation stubs?**
   - What we know: BANK-04/05 (translations) are Phase 9. Phase 6 adds NO translation data.
   - What's unclear: The v2 search index requires translations for search to work on new entries. But search index rebuild is Phase 10.
   - Recommendation: Confirmed out of scope for Phase 6. No translation files touched.

---

## Sources

### Primary (HIGH confidence)
- Direct inspection: `vocabulary/core/de/adjectivebank.json` — confirmed 106 entries, field shapes, audio pattern, `_metadata` structure
- Direct inspection: `vocabulary/dictionary/de/adjectivebank.json` — confirmed 106 entries, `frequency` as rank, one `null` frequency (regnerisch_adj)
- Direct inspection: `vocabulary/dictionary/frequency/de_50k.txt` — confirmed format (word count per line, 50k lines), rank lookup verified against gut_adj (rank 52) and neblig_adj (rank 40259)
- Direct inspection: `.planning/phases/04-goethe-adjective-extraction/04-candidates.json` — confirmed 259 candidates, all fields present, 13 flagged, 0 overlap with existing bank
- Schema validation: `vocabulary/schema/adjective.schema.json` — confirmed `comparison: {}` and `declension: {}` are valid (no required sub-fields, `additionalProperties: false`)
- Runtime validation: `scripts/validate-adjectives.js` against current 106-entry bank — PASS confirmed
- Frequency coverage analysis: 248 of 259 candidates in `de_50k.txt`; 11 missing words identified

### Secondary (MEDIUM confidence)
- None needed — all claims verified directly from repository files.

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Stub shapes: HIGH — verified by field inspection and schema validation
- Frequency source and scale: HIGH — rank confirmed by spot-checking multiple entries against de_50k.txt line numbers
- Merge/sort approach: HIGH — based on direct inspection of current unsorted file and discretion from CONTEXT.md
- Manifest counts: HIGH — counted actual entries vs manifest values directly
- Files in scope: HIGH — REQUIREMENTS.md maps BANK-02/03 to Phase 6; INTG-02/03 (search index, manifests) is Phase 10, but manifests should be updated in Phase 6 as they track bank entry counts

**Research date:** 2026-02-21
**Valid until:** 2026-08-21 (stable — this is internal file structure, not external API)
