---
phase: 16-data-fixes
plan: "03"
subsystem: data
tags: [manifest, vocabulary, data-integrity, counts]

# Dependency graph
requires:
  - phase: 16-01
    provides: noun data corrections used as baseline for counts
  - phase: 16-02
    provides: verb data corrections used as baseline for counts
provides:
  - Corrected core manifest with accurate generalbank (186), nounbank (331), verbbank (148) counts
  - Corrected dict manifest with accurate generalbank (673), nounbank (1641), verbbank (679) counts
  - Reusable audit-trail script scripts/fix-manifest-counts.js for ongoing health checks
affects:
  - any system that reads manifest.json for bank sizes

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manifest health check: scripts/fix-manifest-counts.js dynamically counts entries and updates manifests — idempotent, safe to re-run"

key-files:
  created:
    - scripts/fix-manifest-counts.js
  modified:
    - vocabulary/core/de/manifest.json
    - vocabulary/dictionary/de/manifest.json

key-decisions:
  - "Script counts entries dynamically (no hardcoded expected values) so it serves as a reusable health check"
  - "curriculumWords recalculated by counting curriculum:true entries across all dict banks (867 confirmed correct)"
  - "dictionaryOnlyWords = totalWords - curriculumWords (corrected from 259 to 2587 in _metadata)"

patterns-established:
  - "Manifest count correction: count entries with Object.keys(data).filter(k => k !== '_metadata').length"

requirements-completed: [DATA-04]

# Metrics
duration: 10min
completed: 2026-02-22
---

# Phase 16 Plan 03: Manifest Count Fixes Summary

**Corrected stale manifest counts in both core and dict manifests — dict manifest was using core bank sizes instead of its own, causing totalWords to be 3454 vs declared 1126**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-02-22T21:00:00Z
- **Completed:** 2026-02-22T21:03:04Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments

- Created `scripts/fix-manifest-counts.js` — idempotent ESM script that counts actual bank entries and updates both manifests
- Fixed core manifest: generalbank 185->186, nounbank 332->331, verbbank 149->148, totalWords 1127->1126
- Fixed dict manifest: generalbank 186->673, nounbank 331->1641, verbbank 148->679, _metadata.totalWords 1126->3454, _metadata.dictionaryOnlyWords 259->2587
- All validation scripts pass: nouns (331 core, 1641 dict), verbs (148 core, 679 dict), full integration (ALL CHECKS PASSED)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create manifest count fix script and apply fixes** - `6780df0` (fix)

**Plan metadata:** (to be added below)

## Files Created/Modified

- `scripts/fix-manifest-counts.js` - ESM audit-trail script: reads every bank file, counts entries, compares to manifest, updates mismatches and recalculates totalWords/curriculumWords/dictionaryOnlyWords
- `vocabulary/core/de/manifest.json` - Corrected file counts and totalWords; generatedAt updated
- `vocabulary/dictionary/de/manifest.json` - Corrected _metadata.files counts, _metadata.totalWords, _metadata.curriculumWords, _metadata.dictionaryOnlyWords, top-level totalWords/curriculumWords/dictionaryOnlyWords, updatedAt

## Decisions Made

- Script counts entries dynamically rather than hardcoding expected values — makes it safe to re-run as a health check at any time
- curriculumWords confirmed correct at 867 (counted curriculum:true across all dict banks)
- dictionaryOnlyWords in _metadata corrected from 259 (wrong — was a leftover from an earlier calculation) to 2587

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `npm run validate:all` fails due to missing scripts (validate.js, check-ids.js, check-audio.js) — pre-existing issue unrelated to this plan. All noun/verb/integration validations pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- DATA-04 satisfied: manifests are now a reliable source of truth for bank sizes
- Phase 16 complete — all three data fix plans executed
- Manifests can be re-validated at any time by running `node scripts/fix-manifest-counts.js`

## Self-Check: PASSED

- scripts/fix-manifest-counts.js: FOUND
- vocabulary/core/de/manifest.json: FOUND
- vocabulary/dictionary/de/manifest.json: FOUND
- 16-03-SUMMARY.md: FOUND
- Commit 6780df0: FOUND

---
*Phase: 16-data-fixes*
*Completed: 2026-02-22*
