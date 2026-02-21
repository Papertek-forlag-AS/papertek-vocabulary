---
phase: 07-comparison-data
plan: 01
subsystem: vocabulary-data
tags: [german, adjective, comparison, komparativ, superlativ, json-data, rule-engine]

requires:
  - phase: 06-new-entry-stubs
    provides: 365 adjective stub entries with comparison: {} placeholders in both banks
  - phase: 05-schema-extension
    provides: adjective.schema.json with comparison $def, undeclinable/nicht_komparierbar flag conditionals

provides:
  - comparison.komparativ and comparison.superlativ fields populated for all 352 comparable adjectives
  - undeclinable: true flag on 5 adjectives (lila, rosa, orange, cool, gern) with comparison/declension removed
  - nicht_komparierbar: true flag on 8 adjectives (absolut, ideal, maximal, minimal, perfekt, rein, tot, total) with comparison removed
  - generate-comparison.js script as audit trail for comparison data generation
  - verify-comparison.js with 90-check comprehensive spot-check suite (COMP-03)

affects: [phases/08-declension, phases/09-translations, phases/10-integration]

tech-stack:
  added: []
  patterns:
    - "Exception table + rule engine: ~35 curated exceptions override ~330 rule-generated entries"
    - "Dual-bank write: identical comparison treatment applied to core and dictionary banks"
    - "ESM Node.js generation scripts with processBank(filePath) function"

key-files:
  created:
    - .planning/phases/07-comparison-data/generate-comparison.js
    - .planning/phases/07-comparison-data/verify-comparison.js
  modified:
    - vocabulary/core/de/adjectivebank.json
    - vocabulary/dictionary/de/adjectivebank.json

key-decisions:
  - "schwach_adj added to EXCEPTIONS table with umlaut form (schwächer/schwächst) — Duden primary form preferred over optional non-umlaut variant"
  - "blind, rund, mild, wild, fremd added to exceptions for consonant-cluster superlative (-est suffix instead of -st) — rule engine only handles sibilants; consonant+d cluster is a separate rule"
  - "nah_adj not in bank — suppletive entry is informational only per COMP-03 plan text; no action needed"
  - "verify-comparison.js kept as permanent audit artifact alongside generate-comparison.js — same pattern as Phase 6"

patterns-established:
  - "Verification script pattern: write verify-{phase}.js alongside generate-{phase}.js for audit trail"
  - "Coverage equation: comparable + undeclinable + nicht_komparierbar = 365 (total entries)"

requirements-completed: [COMP-01, COMP-02, COMP-03, COMP-04, COMP-05]

duration: ~2min
completed: 2026-02-21
---

# Phase 7 Plan 01: Comparison Data Summary

**Rule-engine + 35-entry exception table populates komparativ/superlativ for all 352 comparable adjectives in both banks, flags 5 undeclinable and 8 nicht_komparierbar adjectives, all 365 entries schema-valid (90-check verification suite PASS)**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-21T12:17:57Z
- **Completed:** 2026-02-21T12:20:00Z
- **Tasks:** 2 of 2
- **Files modified:** 4

## Accomplishments

- Generated comparison forms for all 352 comparable adjectives: 325 rule-generated, 27 from curated exception table (3 suppletive + 17 umlaut/schwach + 5 consonant-cluster + 2 e-drop)
- Flagged 5 undeclinable adjectives (lila, rosa, orange, cool, gern) with `undeclinable: true` and removed comparison/declension fields per schema constraints
- Flagged 8 nicht_komparierbar adjectives (absolut, ideal, maximal, minimal, perfekt, rein, tot, total) with `nicht_komparierbar: true` and removed comparison fields
- Schema validation passes on all 365 entries in both core and dictionary banks
- 90-check verification suite confirms 0 mismatches between core and dictionary banks

## Task Commits

Each task was committed atomically:

1. **Task 1: Write and run comparison generation script** - `8574b96` (feat)
2. **Task 2: Full exception entry spot-check and data integrity verification** - `fb7f48f` (feat)

**Plan metadata:** `(pending final commit)` (docs: complete plan)

## Files Created/Modified

- `.planning/phases/07-comparison-data/generate-comparison.js` - One-shot comparison data generation script (exception table + rule engine + dual-bank processBank function)
- `.planning/phases/07-comparison-data/verify-comparison.js` - 90-check verification script for all exception entries plus cross-bank consistency and coverage
- `vocabulary/core/de/adjectivebank.json` - 365 entries with comparison data populated (was 259 empty + 106 missing)
- `vocabulary/dictionary/de/adjectivebank.json` - Same as core; identical comparison treatment (dual-storage pattern)

## Decisions Made

1. **schwach_adj uses umlaut form (schwächer/schwächst)** — German allows both schwächer and schwacher. Duden primary form is the umlaut variant, which is the expected teaching form for Goethe B1 learners. Added to EXCEPTIONS table.

2. **Consonant-cluster exceptions handled via EXCEPTIONS table, not rule engine** — blind, rund, mild, wild, fremd need -est superlative (blindest, not blindst). The rule engine already handles sibilant-ending -est; adding a consonant+d rule to the engine would be complex and risk false positives. Explicit exception table entries are safer and more auditable.

3. **nah_adj not in bank** — The plan mentions nah/näher/nächst as a suppletive irregular to verify, but nah_adj is not an entry in our bank. Confirmed this is correct — nah was listed in COMP-03 as informational context, not an action item.

4. **verify-comparison.js kept as permanent audit artifact** — Runs in ~100ms, provides 90 specific checks with expected values, documents linguistic decisions. Consistent with Phase 6's generate-stubs.js/verify pattern.

## Deviations from Plan

None — plan executed exactly as written. The EXCEPTIONS table from the plan and research file was applied verbatim with one addition (schwach_adj) and the consonant-cluster exceptions (blind, rund, mild, wild, fremd) that were explicitly listed in the plan's Task 1 action.

## Issues Encountered

None.

## Next Phase Readiness

- Phase 8 (declension tables) can proceed immediately: all 365 entries now have correct comparison treatment
- 352 comparable adjectives have non-empty komparativ/superlativ stems for declension table generation
- 5 undeclinable adjectives are correctly excluded from declension generation (undeclinable: true, no declension field)
- 8 nicht_komparierbar adjectives will receive only positiv declension (declension.komparativ/superlativ forbidden by schema)
- No blockers for Phase 8

---
*Phase: 07-comparison-data*
*Completed: 2026-02-21*

## Self-Check: PASSED

Files exist:
- .planning/phases/07-comparison-data/generate-comparison.js: FOUND
- .planning/phases/07-comparison-data/verify-comparison.js: FOUND
- vocabulary/core/de/adjectivebank.json: FOUND (365 entries, comparison populated)
- vocabulary/dictionary/de/adjectivebank.json: FOUND (365 entries, comparison populated)
- .planning/phases/07-comparison-data/07-01-SUMMARY.md: FOUND (this file)

Commits exist:
- 8574b96: FOUND (feat(07-01): generate comparison data for all 365 adjective entries)
- fb7f48f: FOUND (feat(07-01): add comprehensive verification script for comparison data)
