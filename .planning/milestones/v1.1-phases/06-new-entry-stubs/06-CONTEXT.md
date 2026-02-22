# Phase 6: New Entry Stubs - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Add bare-minimum stub entries for all 259 extracted adjectives (from Phase 4 candidate list) to both the core bank (`vocabulary/core/de/adjectivebank.json`) and dictionary bank (`vocabulary/dictionary/de/adjectivebank.json`). Stubs must have valid IDs that downstream phases (comparison, declension, translation) can reference. No translations, no comparison data, no declension data — just the structural entries.

</domain>

<decisions>
## Implementation Decisions

### Flagged candidates
- Include all 13 flagged candidates (borderline participials like "abwesend") — they passed the attributive test, that's sufficient
- Trust the Phase 4 candidate list as-is — no re-validation or deduplication check needed
- Include the `audio` field with expected filename pattern (`adjektiv_[stem].mp3`) even though audio files don't exist yet

### Entry ordering
- Re-sort the entire file alphabetically — both existing 106 entries and 259 new entries merged into one alphabetical order
- Both core and dictionary banks use the same sort order
- `_metadata` block placement and sort key (by JSON key vs word value) left to Claude's discretion

### Frequency sourcing
- Source real frequency data from a reputable German word frequency corpus (Leipzig Corpora or similar)
- Research existing frequency values first to determine what source/scale the current 106 entries use, then match or normalize new data to the same scale
- If frequency data proves hard to source programmatically, use placeholder value (0) to unblock stub creation — frequency can be backfilled later

### Stub shape — core bank
- Fields: `word`, `_id`, `audio`, plus empty placeholders `comparison: {}` and `declension: {}`
- No undeclinable/nicht_komparierbar flags — those are Phase 7's responsibility

### Stub shape — dictionary bank
- Mirror core bank shape (including empty comparison/declension placeholders)
- Additional fields: `curriculum: false`, `cefr` (from Phase 4 candidate data), `frequency` (sourced per frequency decision above)
- All new entries have `curriculum: false` — curriculum membership is determined externally, not embedded in vocabulary data

### Claude's Discretion
- Sort key choice (JSON key vs word value for alphabetical ordering)
- `_metadata` block placement (top vs bottom after re-sort)
- Exact script/approach for frequency data sourcing
- How to handle the `generatedAt` timestamp in `_metadata` after re-sort

</decisions>

<specifics>
## Specific Ideas

- User envisions a future architecture where curriculum membership is determined by manifest files (lesson-based lookup by word ID), not by a `curriculum` field in the vocabulary data itself. Setting `curriculum: false` for new entries aligns with this direction.
- Empty placeholders (`comparison: {}`, `declension: {}`) make the data structure visible upfront so downstream phases know exactly what to populate.

</specifics>

<deferred>
## Deferred Ideas

- **CEFR backfill for existing entries** — All 106 existing bank entries have `cefr: 'A1'` as a v1.0 artifact (not real CEFR data). Should be corrected in a future phase.
- **Curriculum/manifest architecture** — Decouple curriculum membership from vocabulary data entirely. Use manifest files that map word IDs to lessons, so vocabulary data stays lesson-agnostic. The `curriculum` field in the dictionary bank would eventually be replaced by manifest lookups.

</deferred>

---

*Phase: 06-new-entry-stubs*
*Context gathered: 2026-02-21*
