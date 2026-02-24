---
phase: 22-api-updates
plan: 02
subsystem: api
tags: [vocabulary, migration, banks, cleanup, validation]

requires:
  - phase: 22-01
    provides: API handlers updated to read from vocabulary/banks/de/; audio URL updated to /shared/vocabulary/banks/{lang}/audio
provides:
  - vocabulary/core/de/ deleted (3567 audio files moved to vocabulary/banks/de/audio/)
  - merge-banks.js and merge-translations.js deleted (one-time tools preserved in git history)
  - validate-nouns.js, validate-verbs.js, validate-adjectives.js read from vocabulary/banks/de/
  - verify-integration.js rewritten for single-bank structure (no more core vs dict comparison)
  - npm run validate:all passes (27 checks, 0 failures)
affects: [phase-23-deployment]

tech-stack:
  added: []
  patterns: [strip-metadata-before-schema-validation, single-bank-integration-checks]

key-files:
  created: []
  modified:
    - scripts/validate-nouns.js
    - scripts/validate-verbs.js
    - scripts/validate-adjectives.js
    - scripts/verify-integration.js
    - package.json

key-decisions:
  - "Strip _metadata from bank before AJV validation — schemas validate word entries only; merged banks have different _metadata structure than old core banks"
  - "verify-integration.js now validates single merged banks/de/ banks rather than comparing core vs dict — SYNC-01/02 verify coverage within merged bank"
  - "Audio files moved via git rename (cp + rm -rf) — git detected 3567 moves as renames with 100% similarity"

requirements-completed: [API-01, API-02, API-03, API-04, API-05]

duration: 4min
completed: 2026-02-24
---

# Phase 22 Plan 02: Directory Cleanup and Validator Updates Summary

**Deleted vocabulary/core/de/ (3567 audio files moved to banks/de/audio/), removed merge scripts, and updated all 4 validators to read from the consolidated vocabulary/banks/de/ — npm run validate:all passes 27/27 checks**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-24T04:42:10Z
- **Completed:** 2026-02-24T04:45:31Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Deleted vocabulary/core/de/ directory (10 data files + 3567 audio files) — audio moved to vocabulary/banks/de/audio/ via git rename
- Removed scripts/merge-banks.js and scripts/merge-translations.js; cleaned package.json (no more merge:banks, merge:translations)
- Updated validate-nouns.js, validate-verbs.js, validate-adjectives.js to read from vocabulary/banks/de/
- Rewrote verify-integration.js for single-bank structure: reads merged banks/de/ instead of separate core+dict banks; 24 checks all pass
- npm run validate:all passes end-to-end (0 failures)

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete old directories and migration scripts** - `69d666d` (feat)
2. **Task 2: Update active validators and verify-integration to use banks/de/** - `d226a5a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `scripts/validate-nouns.js` - Path changed to banks/de/nounbank.json; strips _metadata before AJV validation
- `scripts/validate-verbs.js` - Path changed to banks/de/verbbank.json; strips _metadata before AJV validation
- `scripts/validate-adjectives.js` - Path changed to banks/de/adjectivebank.json
- `scripts/verify-integration.js` - Rewritten for single-bank structure; reads merged banks/de/ files; SYNC-01/02 verify merged bank coverage; SYNC-05 validates merged banks
- `package.json` - Removed merge:banks and merge:translations scripts

## Decisions Made

1. **Strip _metadata before AJV validation** — the merged banks have a different `_metadata` structure (no `translations` field) compared to the old core banks (which had `translations: {}`). The schemas use `additionalProperties` which would apply the word entry schema to `_metadata`. Fix: destructure `_metadata` out before passing to validator. Applied to both validate-nouns.js and validate-verbs.js (validate-adjectives.js was already correct since adjective schema has `required: []`).

2. **verify-integration.js restructured for single-bank reality** — the original script compared core and dict banks entry-by-entry. Since they're now merged, the new script verifies coverage within the merged bank (SYNC-01: 144 verbs with perfektum, SYNC-02: 331 nouns with nominativ). Cross-bank comparison checks removed. SYNC-05 now validates the merged banks (not core+dict separately).

3. **Audio moves detected as git renames** — used cp + rm -rf approach. Git's rename detection (100% similarity for binary files) correctly identified all 3567 moves as renames.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed AJV schema validation failure on merged bank _metadata**
- **Found during:** Task 2 (validate-nouns.js and validate-verbs.js)
- **Issue:** Merged banks/de/ nounbank and verbbank have `_metadata` without a `translations` field. Old core banks had `translations: {}` in `_metadata`, making schema validation pass by coincidence. The schemas use `additionalProperties: { $ref: wordEntry }` which requires `translations` on every key — including `_metadata`.
- **Fix:** Strip `_metadata` via destructuring before passing bank to AJV validator: `const { _metadata, ...entries } = bank; validate(entries);`
- **Files modified:** scripts/validate-nouns.js, scripts/validate-verbs.js
- **Verification:** Both scripts now pass (1641 nouns, 679 verbs)
- **Committed in:** d226a5a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Auto-fix necessary for correctness. The old validators worked by coincidence; the fix makes the validation intent explicit. No scope creep.

## Issues Encountered

None — all issues resolved via deviation auto-fix above.

## Next Phase Readiness

- Phase 22 complete — repository has no stale vocabulary/core/de/ or vocabulary/dictionary/de/ references in active code
- All validators and verify-integration pass against the consolidated vocabulary/banks/de/ structure
- Audio files accessible at vocabulary/banks/de/audio/ (matches the URL path set in Plan 22-01)
- Phase 23 (deployment verification) can proceed: API handlers and validators all read from the correct paths

---
*Phase: 22-api-updates*
*Completed: 2026-02-24*

## Self-Check: PASSED

Files confirmed:
- FOUND: scripts/validate-nouns.js
- FOUND: scripts/validate-verbs.js
- FOUND: scripts/validate-adjectives.js
- FOUND: scripts/verify-integration.js
- FOUND: package.json
- FOUND: .planning/phases/22-api-updates/22-02-SUMMARY.md
- FOUND: vocabulary/core/de/ deleted (expected)
- FOUND: vocabulary/banks/de/audio/ (expected)

Commits:
- FOUND: 69d666d (feat(22-02): delete core/de/, move audio to banks/de/audio/, remove merge scripts)
- FOUND: d226a5a (feat(22-02): update validators and verify-integration to use vocabulary/banks/de/)
