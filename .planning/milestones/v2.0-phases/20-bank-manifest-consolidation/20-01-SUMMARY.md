---
phase: 20-bank-manifest-consolidation
plan: 01
subsystem: data
tags: [vocabulary, banks, manifest, german, merge, json]

# Dependency graph
requires:
  - phase: 19-tech-debt-cleanup
    provides: Validated dual-bank data (core + dictionary) ready for merge
provides:
  - 8 merged bank JSON files under vocabulary/banks/de/ (core + dict, single file per word class)
  - vocabulary/banks/de/manifest.json with curriculum entry IDs and per-bank/summary counts
  - scripts/merge-banks.js reusable ESM merge script
affects:
  - 20-02 (API handler update — reads merged banks)
  - 20-03 (Validation update for new structure)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Merged bank pattern: single file per word class, curriculum flag distinguishes core vs dict-only"
    - "Core manifest: manifest.json lists curriculum IDs per bank with count summaries"
    - "Deep-merge: core-exclusive fields (plural, genus, preteritum_rare, verb_type, preteritum_note) filled into shared entries from core bank; existing dict fields not overwritten"
    - "Sort by _id (ASCII) for deterministic output"

key-files:
  created:
    - scripts/merge-banks.js
    - vocabulary/banks/de/nounbank.json
    - vocabulary/banks/de/verbbank.json
    - vocabulary/banks/de/adjectivebank.json
    - vocabulary/banks/de/generalbank.json
    - vocabulary/banks/de/articlesbank.json
    - vocabulary/banks/de/numbersbank.json
    - vocabulary/banks/de/phrasesbank.json
    - vocabulary/banks/de/pronounsbank.json
    - vocabulary/banks/de/manifest.json
  modified:
    - package.json

key-decisions:
  - "Dict bank is the authoritative base for merged output (superset of all entries)"
  - "Core-exclusive fields are additive-only (fill gaps in dict entries, never overwrite)"
  - "adjectivebank curriculum count is 106 (not 365 as plan stated) — plan description was wrong; dict bank has 259 dict-only adjective entries with curriculum:false"

patterns-established:
  - "Merged bank _metadata: source=merged, packId=german, totalEntries/curriculumEntries/dictionaryOnlyEntries counts"
  - "Core manifest banks structure: {bankName: {total, curriculum, dictionaryOnly, ids[]}}"

requirements-completed: [BANK-01, BANK-02, BANK-03, BANK-04, MNFST-01, MNFST-02]

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 20 Plan 01: Bank Merge and Manifest Generation Summary

**ESM merge script producing 8 single merged German bank files (3454 entries) and a core manifest with curriculum IDs, deep-merging core-exclusive fields (plural/genus on nouns, preteritum_rare/verb_type on verbs)**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-23T19:57:34Z
- **Completed:** 2026-02-23T19:58:59Z
- **Tasks:** 2
- **Files modified:** 11 (1 script, 9 JSON outputs, 1 package.json)

## Accomplishments

- Created `scripts/merge-banks.js` (ESM, 96 lines) — reads core+dict pairs for all 8 German banks, deep-merges core-exclusive fields, writes merged banks with `_metadata` blocks
- Generated 9 output files under `vocabulary/banks/de/`: 8 merged bank JSONs + `manifest.json`
- Verified all data integrity: entry counts match dict totals, core-exclusive fields present on shared entries, dict-only entries unchanged, manifest IDs accurate
- Registered `npm run merge:banks` in package.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Create bank merge script** - `6a01120` (feat)
2. **Task 2: Verify merged bank data integrity** - `ee54b57` (chore — package.json npm script registration)

## Files Created/Modified

- `scripts/merge-banks.js` — ESM merge script for all 8 German bank pairs
- `vocabulary/banks/de/nounbank.json` — 1641 entries (331 curriculum, 1310 dict-only), plural/genus merged from core
- `vocabulary/banks/de/verbbank.json` — 679 entries (148 curriculum, 531 dict-only), preteritum_rare/verb_type/preteritum_note merged from core
- `vocabulary/banks/de/adjectivebank.json` — 365 entries (106 curriculum, 259 dict-only)
- `vocabulary/banks/de/generalbank.json` — 673 entries (186 curriculum, 487 dict-only)
- `vocabulary/banks/de/articlesbank.json` — 16 entries (all curriculum)
- `vocabulary/banks/de/numbersbank.json` — 34 entries (all curriculum)
- `vocabulary/banks/de/phrasesbank.json` — 8 entries (all curriculum)
- `vocabulary/banks/de/pronounsbank.json` — 38 entries (all curriculum)
- `vocabulary/banks/de/manifest.json` — core manifest with curriculum IDs, per-bank counts, and summary (3454 total, 867 curriculum, 2587 dict-only)
- `package.json` — added `"merge:banks": "node scripts/merge-banks.js"`

## Decisions Made

- Dict bank is the authoritative base for merged output — it's the superset (all core entries exist in dict plus dict-only entries)
- Core-exclusive fields are additive-only: fill gaps in dict entries, never overwrite any existing dict fields
- `adjectivebank` curriculum count is 106, not 365: the plan description "(all curriculum)" was inaccurate; the dict adjectivebank already had 259 entries with `curriculum:false` — the merge correctly reflects this

## Deviations from Plan

None - plan executed exactly as written. The plan note "adjectivebank: 365 entries, all curriculum" was a pre-existing inaccuracy in the plan description (the dict bank already had 259 non-curriculum adjectives). The merge script correctly uses the dict bank's `curriculum` flag as the source of truth.

## Issues Encountered

None — script ran cleanly on first execution. All 25 data integrity checks passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Merged banks ready for API handler update (Phase 20 Plan 02 — update v1/v2 handlers to read from `vocabulary/banks/de/` instead of separate core/dict paths)
- `npm run merge:banks` registered for regenerating merged banks after future data updates
- Manifest JSON structure ready for v1 API handler to use for curriculum filtering

---
*Phase: 20-bank-manifest-consolidation*
*Completed: 2026-02-23*
