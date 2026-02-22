---
phase: 11-schema-extensions
verified: 2026-02-22T07:30:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 11: Schema Extensions Verification Report

**Phase Goal:** Verb and noun schemas accept new Perfektum and declension fields; grammar features are registered
**Verified:** 2026-02-22T07:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `verb.schema.json` accepts `auxiliary`, `participle`, `auxiliary_note` as optional fields on tenseConjugation without validation errors on existing data | VERIFIED | All 5 Perfektum fields present in `$defs.tenseConjugation.properties`; `required` array unchanged (`["former"]`); pre/post error count identical (191) |
| 2 | `verb.schema.json` accepts entry-level `inseparable: true` without breaking existing entries | VERIFIED | `inseparable: boolean` present on `$defs.verbEntry.properties`; not in `required`; verb entry error count unchanged |
| 3 | `noun.schema.json` accepts `singular`/`plural` sub-objects on `caseEntry` alongside existing flat `bestemt`/`ubestemt` (additive, no migration) | VERIFIED | `forms.singular` and `forms.plural` added as `oneOf [{null}, {object}]`; legacy flat fields (`bestemt`, `ubestemt`, `definite`, `indefinite`) retained; no `additionalProperties: false` |
| 4 | `noun.schema.json` accepts entry-level `weak_masculine: true` without breaking existing entries | VERIFIED | `weak_masculine: boolean` on `$defs.nounEntry.properties`; not in `required`; noun entry error count unchanged (356) |
| 5 | `grammar-features.json` contains `grammar_noun_declension` and `grammar_genitiv` feature entries | VERIFIED | Both entries present in `de.features` (indices 11 and 12); `grammar_genitiv.dependsOn === "grammar_noun_declension"`; correct ordering confirmed |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vocabulary/schema/verb.schema.json` | Perfektum fields on tenseConjugation; `inseparable` flag on verbEntry | VERIFIED | 5 new Perfektum fields (`auxiliary`, `participle`, `auxiliary_note`, `dual_auxiliary`, `modal_note`) + `inseparable` boolean; file is substantive (105 lines, valid JSON) |
| `vocabulary/schema/noun.schema.json` | `singular`/`plural` sub-objects on caseEntry.forms; `bestemt`/`ubestemt` on caseEntry directly; `weak_masculine` on nounEntry | VERIFIED | All 3 additions confirmed; legacy flat fields preserved; file substantive (169 lines, valid JSON) |
| `vocabulary/grammar-features.json` | `grammar_noun_declension` and `grammar_genitiv` under `de.features` with `dependsOn` relationship | VERIFIED | Both entries present; `grammar_noun_declension` at index 11, `grammar_genitiv` at index 12; `dependsOn` wired correctly; `_metadata.updatedAt: "2026-02-22"` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `vocabulary/grammar-features.json` | `vocabulary/grammar-features.json` | `grammar_genitiv.dependsOn references grammar_noun_declension` | VERIFIED | `gn.dependsOn === "grammar_noun_declension"` confirmed programmatically |
| `vocabulary/schema/noun.schema.json` | `vocabulary/schema/noun.schema.json` | `caseEntry.forms has both legacy flat keys and new singular/plural sub-objects` | VERIFIED | `bestemt`, `ubestemt`, `definite`, `indefinite`, `singular`, `plural` all present in `forms.properties` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SCHEMA-01 | 11-01-PLAN.md | Verb schema: `auxiliary`, `participle`, `auxiliary_note` optional on tenseConjugation | SATISFIED | Fields present; not in `required`; zero new validation errors on 148 verb entries |
| SCHEMA-02 | 11-01-PLAN.md | Verb schema: entry-level `inseparable` boolean | SATISFIED | `inseparable: boolean` on verbEntry; not in `required` |
| SCHEMA-03 | 11-01-PLAN.md | Noun schema: `singular`/`plural` sub-objects on caseEntry (additive) | SATISFIED | `oneOf [{null}, {object}]` pattern on `caseEntry.forms.singular` and `.plural`; legacy fields preserved |
| SCHEMA-04 | 11-01-PLAN.md | Noun schema: entry-level `weak_masculine` boolean | SATISFIED | `weak_masculine: boolean` on nounEntry; not in `required` |
| SCHEMA-05 | 11-01-PLAN.md | `grammar_noun_declension` and `grammar_genitiv` registered in grammar-features.json | SATISFIED | Both entries confirmed with correct `dependsOn`, `category`, `appliesTo`, `dataPath` |

No orphaned requirements. All 5 SCHEMA-0x requirements are mapped to Phase 11 and satisfied.

### Anti-Patterns Found

None. No TODO, FIXME, placeholder comments, empty implementations, or `additionalProperties: false` introduced in any of the three modified files.

### AJV Validation Baseline Note

AJV reports 191 errors on verbbank and 356 errors on nounbank against the updated schemas. These are **identical** to the pre-phase-11 baseline (verified by validating current data against the pre-phase-11 schema versions at `HEAD~3`). These are pre-existing data quality issues (entries missing `translations` field, `_metadata` sentinel key failing entry schema, etc.) and were not introduced by this phase.

### Human Verification Required

None. All success criteria for this phase are structural (JSON schema field presence, ordering, wiring) and are fully verifiable programmatically. No UI behavior, real-time features, or external services involved.

### Commit Verification

All three task commits exist in git history:
- `35b9ec3` — feat(11-01): extend verb schema with Perfektum and inseparable fields
- `851a1e4` — feat(11-01): extend noun schema with case forms and weak_masculine fields
- `f75da3e` — feat(11-01): register grammar_noun_declension and grammar_genitiv features

### Implementation Notes

- The SUMMARY reports 17 total `de.features` (vs the PLAN's estimate of 16). This is because the pre-existing count was 15, not 14 as the plan estimated. The implementation correctly added 2 features — this is a plan estimation discrepancy, not an implementation gap.
- `dual_auxiliary` and `modal_note` fields were added to `tenseConjugation` beyond the minimum 3 required by SCHEMA-01. This is additive and fully within scope.
- `bestemt`/`ubestemt` were also documented directly on `caseEntry` (alongside their presence inside `forms`) to match the actual data structure found during research. This satisfies SCHEMA-03's "additive, no migration" intent.

---

_Verified: 2026-02-22T07:30:00Z_
_Verifier: Claude (gsd-verifier)_
