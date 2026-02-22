---
phase: 14-noun-declension-data
plan: "02"
subsystem: database
tags: [german, declension, nounbank, json, node]

# Dependency graph
requires:
  - phase: 14-noun-declension-data/14-01
    provides: declension_type enum in noun.schema.json and validate:nouns AJV script (356-error baseline)
  - phase: 11-schema-extensions
    provides: caseEntry.forms.singular/plural structure already in noun.schema.json
  - phase: 12-verbbank-data
    provides: weak_masculine flag on 11 n-Deklination nouns (confirmed n-Deklination set)
provides:
  - Complete 4-case declension data for all 331 German nouns in core nounbank
  - scripts/add-declension.js (one-shot ESM injection script with hardcoded data for all 331 nouns)
  - grammar_noun_declension feature on all 331 nominativ entries
  - grammar_genitiv feature on all 331 genitiv entries
  - declension_type (strong/weak/plural-only/uncountable) on all 331 nouns
affects:
  - 15-sync-integration (dict nounbank sync — can now consume declension_type and 4-case data)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Phase 13 ESM injection pattern reused: hardcoded data map + inject + writeFileSync
    - Helper builder functions (m/f/n/weak/pluralOnly/uncountable/mS/fS/nS) for concise data entry

key-files:
  created:
    - scripts/add-declension.js
  modified:
    - vocabulary/core/de/nounbank.json

key-decisions:
  - "Plan's NDECL-07 spot-check compared full definite strings (den Autos vs die Autos) which will always differ by article — corrected to compare noun stems (Autos vs Autos); data is correct"
  - "Uncountable set expanded to 28 (months 12 + holidays 4 + school subjects 6 + substances/abstract 6) to match nounbank null-plural entries"
  - "musicunterricht_noun and sportunterricht_noun treated as uncountable (no plural in nounbank) rather than countable"

patterns-established:
  - "Pattern: helper builders (m/f/n/weak/pluralOnly/uncountable/mS/fS/nS) provide type-safe, concise noun declension entry — mirrors Phase 13 haben/sein/both pattern"
  - "Pattern: _datPl() utility computes dative plural (add -n unless already ends in -n or -s)"

requirements-completed: [NDECL-01, NDECL-02, NDECL-03, NDECL-04, NDECL-05, NDECL-06, NDECL-07]

# Metrics
duration: 9min
completed: 2026-02-22
---

# Phase 14 Plan 02: Noun Declension Data Summary

**Complete 4-case declension injected for all 331 German nouns: forms.singular/plural with definite/indefinite articles in all 4 cases, typed declension categories, and feature tags — via a 680-line ESM injection script**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-02-22T11:42:44Z
- **Completed:** 2026-02-22T11:51:59Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `scripts/add-declension.js` (680+ lines) with helper builders for all German noun declension patterns
- Injected complete 4-case declension (Nominativ, Akkusativ, Dativ, Genitiv) for all 331 nouns
- 11 n-Deklination nouns: correct -(e)n endings in all non-nominative singular, no -s genitiv suffix
- 3 plural-only nouns (Eltern, Ferien, Leute): singular: null in all 4 cases
- 28 uncountable nouns: plural: null in all 4 cases (months, school subjects, substances, holidays)
- 26 -s plural nouns: dative plural = nominative plural (no -n suffix added)
- All 331: grammar_noun_declension on nominativ, grammar_genitiv on genitiv
- All 331: declension_type set (strong/weak/plural-only/uncountable)
- 223 existing intro values preserved; legacy bestemt/ubestemt fully replaced
- AJV validation: 356 errors (exactly = Plan 01 baseline, zero new errors introduced)
- All 7 NDECL requirements verified by comprehensive spot-check (0 failures)

## Task Commits

1. **Task 1: Create and execute add-declension.js with complete data for all 331 nouns** - `b1b0bdb` (feat)
2. **Task 2: Validate with AJV and run comprehensive requirement spot-checks** - `7899dad` (chore)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `scripts/add-declension.js` - ESM injection script; helper builders m/f/n/weak/pluralOnly/uncountable/mS/fS/nS; complete DECLENSION_DATA map for all 331 nouns; preserves intro values; adds feature flags; 680+ lines
- `vocabulary/core/de/nounbank.json` - All 331 entries now have cases.nominativ/akkusativ/dativ/genitiv with forms.singular/plural structure; declension_type set; legacy flat format removed

## Decisions Made
- Plan spot-check script for NDECL-07 compared full definite strings (e.g., "den Autos" vs "die Autos") which always differ by article. Corrected check to compare noun stems only — the data was always correct, the check had a logic error.
- Uncountable set is 28 (not 22 as estimated in research): the 12 months + 4 holidays + musikunterricht + sportunterricht + 6 abstract/substance nouns all have null plural in nounbank.
- musicunterricht_noun and sportunterricht_noun treated as uncountable (matching nounbank plural: null field) rather than countable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed NDECL-07 spot-check logic comparing full article+noun strings**
- **Found during:** Task 2 (comprehensive spot-check)
- **Issue:** Plan's spot-check compared `datPl === nomPl` where datPl = "den Autos" and nomPl = "die Autos" — these will always differ by article even when the noun part is identical (which is correct behavior)
- **Fix:** Corrected spot-check to strip "die "/"den " prefix and compare noun stems: `datNoun === nomNoun`; also added explicit check that dative plural noun ends in -s confirming no -n was appended
- **Files modified:** (check script only, not committed as separate file — run in-place)
- **Verification:** 5/5 -s plural spot-checks now pass; auto_noun: "Autos" === "Autos" (correct)
- **Committed in:** 7899dad (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in verification script logic)
**Impact on plan:** Data was always correct; check logic error meant false FAIL. No data changes needed.

## Issues Encountered
None. The injection script ran cleanly on first corrected attempt (Added: 331, Skipped: 0, Missing: 0).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 331 nouns have complete 4-case declension data ready for Phase 15 sync to dict nounbank
- grammar_noun_declension feature (nominativ) and grammar_genitiv feature (genitiv) are now active on all entries
- AJV baseline remains at 356 (pre-existing data quality debt, not introduced by Phase 14)
- Phase 15 (Sync & Integration) can now sync declension_type and 4-case forms to the dict nounbank

## Self-Check: PASSED

- scripts/add-declension.js: FOUND
- vocabulary/core/de/nounbank.json: FOUND
- 14-02-SUMMARY.md: FOUND
- Commit b1b0bdb: FOUND
- Commit 7899dad: FOUND
- 331/331 nouns with new forms.singular/plural: CONFIRMED
- 331/331 nouns with valid declension_type: CONFIRMED

---
*Phase: 14-noun-declension-data*
*Completed: 2026-02-22*
