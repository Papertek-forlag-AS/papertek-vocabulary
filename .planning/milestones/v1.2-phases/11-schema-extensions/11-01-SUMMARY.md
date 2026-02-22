---
phase: 11-schema-extensions
plan: "01"
subsystem: database
tags: [json-schema, ajv, vocabulary, verb, noun, grammar-features]

# Dependency graph
requires: []
provides:
  - "verb.schema.json accepts Perfektum fields (auxiliary, participle, auxiliary_note, dual_auxiliary, modal_note) on tenseConjugation"
  - "verb.schema.json accepts inseparable boolean on verbEntry"
  - "noun.schema.json accepts singular/plural nullable sub-objects inside caseEntry.forms"
  - "noun.schema.json documents bestemt/ubestemt directly on caseEntry"
  - "noun.schema.json accepts weak_masculine boolean on nounEntry"
  - "grammar-features.json has grammar_noun_declension and grammar_genitiv features under de.features"
affects:
  - 12-audit-flags
  - 13-perfektum-data
  - 14-noun-declension-data

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive schema extension: add optional fields without required array changes to avoid breaking existing data"
    - "Schema documents actual data structure: bestemt/ubestemt documented on caseEntry to match real nounbank entries"
    - "dependsOn pattern for grammar feature progressive disclosure: child features reference parent via dependsOn field"

key-files:
  created: []
  modified:
    - vocabulary/schema/verb.schema.json
    - vocabulary/schema/noun.schema.json
    - vocabulary/grammar-features.json

key-decisions:
  - "Additive extension only: all 6 new schema fields are optional, no required arrays changed"
  - "Pre-existing AJV validation errors (356 noun, ~130 verb) are data quality debt from prior phases, not introduced by schema changes"
  - "grammar_noun_declension positioned as parent feature before grammar_genitiv (mirrors grammar_adjective_declension/grammar_adjective_genitive pattern)"
  - "Norwegian oe character used in feature names (Kasusboeyning, Genitivboeyning) consistent with existing Adjektivboeyning"
  - "Total de features after plan: 17 (plan estimated 16 due to miscounting existing 15 features as 14)"

patterns-established:
  - "Schema extensions go under $defs to be shared across the schema via $ref"
  - "nullable sub-objects use oneOf: [{type: null}, {type: object}] pattern"

requirements-completed:
  - SCHEMA-01
  - SCHEMA-02
  - SCHEMA-03
  - SCHEMA-04
  - SCHEMA-05

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 11 Plan 01: Schema Extensions Summary

**JSON Schema additions enabling Perfektum conjugation (5 fields), inseparable verb flag, 4-case noun declension sub-objects, weak masculine flag, and two progressive-disclosure grammar features — zero new validation errors on existing data**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T06:05:34Z
- **Completed:** 2026-02-22T06:08:36Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Extended verb.schema.json with 5 Perfektum-related fields on tenseConjugation and 1 inseparable flag on verbEntry
- Extended noun.schema.json with singular/plural sub-objects on caseEntry.forms, bestemt/ubestemt documented directly on caseEntry, and weak_masculine on nounEntry
- Added grammar_noun_declension and grammar_genitiv entries to grammar-features.json with correct dependsOn relationship

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend verb schema with Perfektum and inseparable fields** - `35b9ec3` (feat)
2. **Task 2: Extend noun schema with case forms and weak_masculine fields** - `851a1e4` (feat)
3. **Task 3: Register grammar_noun_declension and grammar_genitiv features** - `f75da3e` (feat)

## Files Created/Modified
- `vocabulary/schema/verb.schema.json` - Added auxiliary, participle, auxiliary_note, dual_auxiliary, modal_note to tenseConjugation; inseparable to verbEntry
- `vocabulary/schema/noun.schema.json` - Added singular/plural nullable sub-objects to caseEntry.forms; bestemt/ubestemt directly on caseEntry; weak_masculine to nounEntry
- `vocabulary/grammar-features.json` - Added grammar_noun_declension and grammar_genitiv features to de.features array; updated _metadata.updatedAt

## Decisions Made
- Used additive schema extension only — all new fields are optional, no required arrays changed. Preserves all existing data validity.
- Pre-existing AJV errors (356 on nounbank, ~130 on verbbank) are data quality debt from before this phase. All errors existed before schema changes; none introduced by this plan.
- grammar_noun_declension placed as parent before grammar_genitiv, following the grammar_adjective_declension/grammar_adjective_genitive precedent.
- Final de features count is 17 (not 16 as the plan estimated); the plan miscounted existing features as 14 when there were actually 15.

## Deviations from Plan

None - plan executed exactly as written. The feature count discrepancy (17 vs 16 expected) is a plan estimation error, not a deviation in implementation.

## Issues Encountered

- AJV validation verification showed "new errors" due to overly narrow filter logic; closer inspection confirmed total error counts were identical (356 before and after noun schema changes, same pre-existing errors).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 12 (audit flags) can now write `inseparable` and `weak_masculine` boolean audit fields to verbbank and nounbank — schemas accept these
- Phase 13 (Perfektum data) can write auxiliary, participle, auxiliary_note, dual_auxiliary, modal_note to verb conjugation entries — schemas accept these
- Phase 14 (noun declension data) can write singular/plural sub-objects to noun cases — schemas accept these
- grammar_noun_declension and grammar_genitiv are registered and ready for the app to use for progressive disclosure

---
*Phase: 11-schema-extensions*
*Completed: 2026-02-22*
