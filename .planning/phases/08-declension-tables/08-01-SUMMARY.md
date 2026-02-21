---
phase: 08-declension-tables
plan: 01
subsystem: vocabulary-data
tags: [german, adjective, declension, stark, schwach, gemischt, positiv, komparativ, superlativ, json-data, rule-engine]

requires:
  - phase: 07-comparison-data
    provides: comparison.komparativ and comparison.superlativ populated for all 352 comparable adjectives in both banks
  - phase: 05-schema-extension
    provides: adjective.schema.json with declension $def (articleBlock/superlativBlock), additionalProperties constraints

provides:
  - declension.positiv (stark/schwach/gemischt x 4 cases x 4 gender/number) for all 360 declinable adjectives
  - declension.komparativ (full articleBlock) for all 352 comparable adjectives
  - declension.superlativ (schwach only) for all 352 comparable adjectives
  - Correct irregular stems: hoh- (hoch), dunkl- (dunkel), flexibl- (flexibel), teur- (teuer)
  - declension_alternatives entry-level key for teuer_adj with Duden-accepted teuer- forms
  - generate-declension.js script (one-shot generation with exception tables and dual-bank write)
  - verify-declension.js script (87-check spot-check suite, coverage counts, cross-bank consistency)
  - IRREGULAR-REVIEW.md report (27 irregular adjectives tabulated for human sanity-checking)

affects: [phases/09-translations, phases/10-integration, leksihjelp-inflection-search]

tech-stack:
  added: []
  patterns:
    - "POSITIV_STEM_EXCEPTIONS table: 4 entries override default stem (hoch/dunkel/flexibel/teuer)"
    - "KOMPARATIV_BLOCK_EXCEPTIONS table: hand-curated article blocks for grammatically irregular komparativ (viel/mehr)"
    - "DECLENSION_ALTERNATIVES entry-level key: sparse object for Duden-recognized variant forms, bypassing schema's additionalProperties restriction on declension $def"
    - "Full komparativ form as declension base: schneller (not schnell) → schnellerer/schnellere/schnelleres"
    - "Dual-bank processBank() write: identical declension treatment for core and dictionary banks"

key-files:
  created:
    - .planning/phases/08-declension-tables/generate-declension.js
    - .planning/phases/08-declension-tables/verify-declension.js
    - .planning/phases/08-declension-tables/IRREGULAR-REVIEW.md
  modified:
    - vocabulary/core/de/adjectivebank.json
    - vocabulary/dictionary/de/adjectivebank.json

key-decisions:
  - "viel_adj komparativ uses KOMPARATIV_BLOCK_EXCEPTIONS with hand-curated blocks — 'mehr' does not end in '-er' and the declining base is 'mehrere' (mehrerer/mehrere/mehreres etc.), which requires special handling"
  - "dunkel komparativ stark.dat.m is 'dunklerem' not 'dunklerer' — dativ maskulin ending is 'em', not 'er' (dativ feminin uses 'er')"
  - "declension_alternatives uses teuer- stem forms as alternatives to primary teur- stem — both are Duden-accepted; machine-distinguishable via separate entry-level key"
  - "Superlativ included (schwach only) — SC-2 roadmap criterion explicitly requires declension.superlativ blocks; schema already defines superlativBlock as schwach-only"

patterns-established:
  - "Verify script pattern: write verify-{phase}.js alongside generate-{phase}.js for audit trail (Phase 7 precedent)"
  - "Irregular review report pattern: generate IRREGULAR-REVIEW.md programmatically from bank data for human spot-checking"

requirements-completed: [DECL-01, DECL-02, DECL-03, DECL-04, DECL-05]

duration: 7min
completed: 2026-02-21
---

# Phase 8 Plan 01: Declension Tables Summary

**Rule-engine + 4-entry stem exception table generates ~39,800 declension cells for all 360 declinable adjectives across positiv/komparativ/superlativ degrees in both banks, 87-check verification suite PASS, IRREGULAR-REVIEW.md committed**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-21T14:59:46Z
- **Completed:** 2026-02-21T15:07:00Z
- **Tasks:** 2 of 2
- **Files modified:** 5

## Accomplishments

- Generated 39,800+ declension cells for all 360 declinable adjectives: stark/schwach/gemischt x 4 cases x 4 gender/number for positiv (all 360), komparativ (352 comparable), superlativ schwach-only (352 comparable)
- All 4 positiv stem exceptions correct: hoh- (hoch), dunkl- (dunkel), flexibl- (flexibel), teur- (teuer) — hohem not hochem, dunklem not dunkelem, teures not teueres
- viel_adj komparativ handled via KOMPARATIV_BLOCK_EXCEPTIONS (mehr → mehrerer/mehrere/mehreres etc.)
- Alternatives stored at entry level for teuer_adj: both teur- (primary) and teuer- (accepted) forms
- 87-check verification suite confirms 0 failures: all irregular stems, coverage counts, cross-bank consistency (0 mismatches)
- Schema validation passes on all 365 entries in both banks

## Task Commits

Each task was committed atomically:

1. **Task 1: Write and run declension generation script** - `e10a9fe` (feat)
2. **Task 2: Verification script, cross-bank consistency, and irregular review report** - `d496e4c` (feat)

**Plan metadata:** `(pending final commit)`

## Files Created/Modified

- `.planning/phases/08-declension-tables/generate-declension.js` - One-shot declension generation with ENDINGS tables, POSITIV_STEM_EXCEPTIONS (4 entries), KOMPARATIV_BLOCK_EXCEPTIONS (viel), DECLENSION_ALTERNATIVES (teuer), dual-bank processBank()
- `.planning/phases/08-declension-tables/verify-declension.js` - 87-check spot-check suite covering all irregular entries, coverage counts (DECL-01 to DECL-05), cross-bank consistency, alternative forms
- `.planning/phases/08-declension-tables/IRREGULAR-REVIEW.md` - 27 irregular adjectives tabulated with positiv stem, stark sample forms, komparativ base and forms, superlativ stem and form; SC-3 full positiv table for hoch
- `vocabulary/core/de/adjectivebank.json` - 360 entries with full declension data (was all empty/missing)
- `vocabulary/dictionary/de/adjectivebank.json` - Same as core; identical declension treatment (dual-storage pattern)

## Decisions Made

1. **viel_adj komparativ uses KOMPARATIV_BLOCK_EXCEPTIONS** — The comparison.komparativ for viel is `mehr`. Using `mehr` as a direct declension stem produces `mehrer` (mehr + er) which is wrong. The correct declined forms are based on `mehrere` but require special handling of the trailing `e`. Solution: hand-curated full article block in KOMPARATIV_BLOCK_EXCEPTIONS. Forms: stark nom.m=mehrerer, stark dat.m=mehrerem, schwach nom.m=mehrere, etc.

2. **dunkel komparativ stark.dat.m is 'dunklerem'** — Verification script initially had wrong expectation ('dunklerer'). Dativ maskulin stark ending is 'em'; dativ feminin stark ending is 'er'. `dunkler` + `em` = `dunklerem` (correct). Fixed check to 'dunklerem'. This is linguistically correct behavior, not a bug.

3. **declension_alternatives uses teuer- stem as alternatives** — Primary forms use teur- stem (Duden preferred). Duden also accepts teuer- forms in most cells. Stored as `declension_alternatives` at entry level because `declension` $def has `additionalProperties: false` — extras cannot go inside declension, but adjectiveEntry has no such restriction.

4. **Superlativ included (schwach only)** — SC-2 roadmap criterion explicitly states every comparable adjective must have `declension.superlativ` blocks. Schema's `superlativBlock` $def already restricts to `{ schwach: caseBlock }` — only 16 cells per adjective. Included as planned.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] viel_adj komparativ generates 'mehrer' instead of 'mehrerer'**
- **Found during:** Task 1 (generate-declension.js execution)
- **Issue:** The plan text says "mehr + er = mehrerer" but `mehr` + ending `er` = `mehrer` (7 characters). The correct declined base for `mehr` as a comparative is `mehrere`, not `mehr`.
- **Fix:** Added KOMPARATIV_BLOCK_EXCEPTIONS with hand-curated article block for viel_adj based on `mehrere` base forms (mehrerer/mehrere/mehreres/mehrerem etc.)
- **Files modified:** `.planning/phases/08-declension-tables/generate-declension.js`
- **Verification:** Check `viel komparativ stark.nom.maskulin === 'mehrerer'` PASS
- **Committed in:** `e10a9fe` (Task 1 commit)

**2. [Rule 1 - Bug] verify-declension.js check for dunkel komparativ stark.dat.m had wrong expectation**
- **Found during:** Task 2 (running verify-declension.js for first time)
- **Issue:** Test expected 'dunklerer' for stark.dativ.maskulin, but dativ maskulin ending is 'em' not 'er'. `dunkler` + `em` = `dunklerem`. The expectation was wrong, not the data.
- **Fix:** Corrected check to expect 'dunklerem' (correct dativ maskulin). Added additional check for stark.dativ.feminin = 'dunklerer' to cover the feminin dativ case.
- **Files modified:** `.planning/phases/08-declension-tables/verify-declension.js`
- **Verification:** Both corrected checks PASS
- **Committed in:** `d496e4c` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 x Rule 1 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

None beyond the deviations above.

## Next Phase Readiness

- Phase 9 (translations) can proceed: all 365 entries have correct comparison and declension treatment
- Leksihjelp's inflection search can now resolve any declined adjective form: 360 × 48 positiv cells + 352 × 48 komparativ cells + 352 × 16 superlativ cells = ~39,840 total cells
- Both core and dictionary banks are identical (0 mismatches confirmed by verify script)
- verify-declension.js is a permanent audit artifact — rerun after any future bank changes

---
*Phase: 08-declension-tables*
*Completed: 2026-02-21*

## Self-Check: PASSED

Files exist:
- .planning/phases/08-declension-tables/generate-declension.js: FOUND
- .planning/phases/08-declension-tables/verify-declension.js: FOUND
- .planning/phases/08-declension-tables/IRREGULAR-REVIEW.md: FOUND
- vocabulary/core/de/adjectivebank.json: FOUND (360 entries with declension data)
- vocabulary/dictionary/de/adjectivebank.json: FOUND (360 entries with declension data)
- .planning/phases/08-declension-tables/08-01-SUMMARY.md: FOUND (this file)

Commits exist:
- e10a9fe: FOUND (feat(08-01): generate full declension tables for all 360 declinable adjectives)
- d496e4c: FOUND (feat(08-01): add declension verification script and irregular review report)
