---
phase: 20-bank-manifest-consolidation
plan: 02
subsystem: data
tags: [vocabulary, search-index, banks, german, json, build-script]

# Dependency graph
requires:
  - phase: 20-bank-manifest-consolidation/20-01
    provides: 8 merged bank JSON files under vocabulary/banks/de/ with conjugations.perfektum.participle on verb entries

provides:
  - vocabulary/banks/de/search-index.json rebuilt from merged banks (3454 entries)
  - scripts/build-search-index.js updated to read from vocabulary/banks/de/

affects:
  - 20-03 (API handler reads search index from vocabulary/banks/de/)
  - Phase 21 (translation consolidation — search index builder still reads from vocabulary/translations/ for now)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Search index builder reads pp (past participle) directly from merged bank entry's conjugations.perfektum.participle — no separate core verbbank read needed"
    - "Search index output path: vocabulary/banks/de/search-index.json (was vocabulary/dictionary/de/search-index.json)"

key-files:
  created:
    - vocabulary/banks/de/search-index.json
  modified:
    - scripts/build-search-index.js

key-decisions:
  - "pp field is read directly from merged verbbank's conjugations.perfektum.participle, not from a separate coreVerbBank ppMap lookup"
  - "Translation paths unchanged (vocabulary/translations/de-nb etc.) — Phase 21 will consolidate translations"

patterns-established:
  - "Search index canonical location: vocabulary/banks/de/search-index.json"

requirements-completed: [BANK-05]

# Metrics
duration: 2min
completed: 2026-02-23
---

# Phase 20 Plan 02: Search Index Rebuild from Merged Banks Summary

**Search index builder migrated from vocabulary/dictionary/de/ to vocabulary/banks/de/, removing the separate core verbbank pp lookup; rebuilt index has 3454 entries, 144 verbs with pp, 867 curriculum entries — identical to old dict-based index**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-23T20:01:23Z
- **Completed:** 2026-02-23T20:02:58Z
- **Tasks:** 2
- **Files modified:** 2 (1 script updated, 1 search index rebuilt)

## Accomplishments

- Updated `scripts/build-search-index.js` to read from `vocabulary/banks/de/` instead of `vocabulary/dictionary/de/`
- Removed separate `coreVerbBank` read and `ppMap` construction — pp field now sourced from `entry.conjugations.perfektum.participle` directly on each merged verbbank entry
- Rebuilt `vocabulary/banks/de/search-index.json` with full integrity verification: 3454 entries, 144 verbs with pp, 867 curriculum, 2587 dict-only — all matching old index

## Task Commits

Each task was committed atomically:

1. **Task 1: Update search index builder for merged banks** - `96ede9f` (feat)
2. **Task 2: Verify rebuilt search index correctness** - `8b105b6` (chore)

## Files Created/Modified

- `scripts/build-search-index.js` — Updated BASE path to vocabulary/banks/de/, removed coreVerbBank/ppMap block, reads pp from merged bank directly
- `vocabulary/banks/de/search-index.json` — Search index rebuilt from merged banks (3454 entries)

## Decisions Made

- pp field is read from `entry.conjugations.perfektum.participle` on the merged verbbank entry, removing the need for a separate core verbbank load — this is cleaner since the merged banks already contain the perfektum data
- Translation file paths remain at `vocabulary/translations/de-nb/` etc. — Phase 21 will consolidate translations; no change needed here

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — script ran cleanly on first execution. All verification checks passed immediately (3454 entries, 144 verbs with pp, 867 curriculum entries, all old IDs present in new index, first 10 entries match field-for-field).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Search index at `vocabulary/banks/de/search-index.json` ready for API handler to consume
- `npm run build:search-index` regenerates the index from merged banks
- Phase 20 Plan 03: Update API handlers to read from `vocabulary/banks/de/` (search index + bank data)

---
*Phase: 20-bank-manifest-consolidation*
*Completed: 2026-02-23*
