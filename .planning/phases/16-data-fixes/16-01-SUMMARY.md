---
phase: 16-data-fixes
plan: 01
subsystem: database
tags: [nounbank, data-quality, validation, german-nouns]

# Dependency graph
requires:
  - phase: 15-declension-sync
    provides: declension data synced to dict nounbank; noun schema with plural:null support
provides:
  - morgenmensch_noun with genus:"m" in dict nounbank
  - zusammenfassung_noun with top-level plural field in both banks
  - hilfe_noun with top-level plural field in both banks
  - leute_noun with genus:"pl" in both banks (plural-only pattern)
  - scripts/fix-noun-fields.js audit-trail script
affects: [any consumer reading genus or plural fields from nounbank, Leksihjelp inflection search]

# Tech tracking
tech-stack:
  added: []
  patterns: [idempotent audit-trail fix scripts with per-fix skip logging]

key-files:
  created:
    - scripts/fix-noun-fields.js
  modified:
    - vocabulary/core/de/nounbank.json
    - vocabulary/dictionary/de/nounbank.json

key-decisions:
  - "Use genus:'pl' for leute_noun (plural-only noun) rather than genus:null — schema only allows string enum values; 'pl' matches eltern_noun and ferien_noun convention already in use"
  - "Plural fields use bare noun without article (e.g. 'Zusammenfassungen' not 'die Zusammenfassungen') — matches existing nounbank convention"

patterns-established:
  - "Plural-only nouns use genus:'pl' — aligns leute_noun with eltern_noun and ferien_noun"
  - "Fix scripts are idempotent: each fix checks if already applied and SKIPs with log message"

requirements-completed: [DATA-01, DATA-05, DATA-06]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 16 Plan 01: Noun Field Fixes Summary

**Added genus, plural, and plural-only genus fields to 4 noun entries across core and dict nounbanks, satisfying DATA-01/05/06 requirements**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-22T20:56:58Z
- **Completed:** 2026-02-22T20:58:56Z
- **Tasks:** 1
- **Files modified:** 3 (script + 2 nounbanks)

## Accomplishments
- Added `genus: "m"` to `morgenmensch_noun` in dict nounbank (was missing, core already correct)
- Added `plural: "Zusammenfassungen"` to `zusammenfassung_noun` in both core and dict nounbanks
- Added `plural: "Hilfen"` to `hilfe_noun` in both core and dict nounbanks
- Added `genus: "pl"` to `leute_noun` in both core and dict nounbanks (plural-only noun pattern)
- Created `scripts/fix-noun-fields.js` as idempotent audit-trail script
- Both `npm run validate:nouns` and `npm run validate:nouns:dict` pass (331 and 1641 entries)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create noun field fix script and apply fixes** - `cfac89d` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `scripts/fix-noun-fields.js` - ESM audit-trail script: reads both nounbanks, applies 3 fixes idempotently, writes with 2-space indent + trailing newline
- `vocabulary/core/de/nounbank.json` - zusammenfassung_noun + plural, hilfe_noun + plural, leute_noun + genus
- `vocabulary/dictionary/de/nounbank.json` - morgenmensch_noun + genus, zusammenfassung_noun + plural, hilfe_noun + plural, leute_noun + genus

## Decisions Made
- Used `genus: "pl"` for leute_noun instead of `genus: null` — the noun schema enum only allows string values (`["m","f","n","c","pl"]`), and `"pl"` is the established convention already used by eltern_noun and ferien_noun. Using null would fail AJV validation.
- Plural fields stored as bare nouns without article (e.g., `"Zusammenfassungen"` not `"die Zusammenfassungen"`) — consistent with existing entries in both banks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Changed leute_noun genus from null to "pl" to pass schema validation**
- **Found during:** Task 1 (after running npm run validate:nouns)
- **Issue:** Plan specified `genus: null` for leute_noun, but the noun schema only allows string enum values for genus (`["m","f","n","c","pl"]`). Validation failed with 2 errors: "must be string" and "must be equal to one of the allowed values".
- **Fix:** Changed `genus: null` to `genus: "pl"` — the value already used by eltern_noun and ferien_noun (both plural-only nouns). Updated the script comment to document the rationale.
- **Files modified:** vocabulary/core/de/nounbank.json, vocabulary/dictionary/de/nounbank.json, scripts/fix-noun-fields.js
- **Verification:** npm run validate:nouns and npm run validate:nouns:dict both pass
- **Committed in:** cfac89d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug, schema compatibility)
**Impact on plan:** Semantically equivalent — `"pl"` clearly communicates plural-only status, matches existing convention, and passes validation. No scope creep.

## Issues Encountered
- Initial application of `genus: null` failed schema validation because the `genus` enum in noun.schema.json only permits `["m","f","n","c","pl"]`. Resolved by using `"pl"` which is the project's established convention for plural-only nouns.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- DATA-01, DATA-05, DATA-06 requirements satisfied
- Both nounbanks pass AJV validation
- Ready for remaining Phase 16 plans (verb data fixes, etc.)
- No blockers

---
*Phase: 16-data-fixes*
*Completed: 2026-02-22*
