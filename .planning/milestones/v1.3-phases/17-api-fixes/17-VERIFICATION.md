---
phase: 17-api-fixes
verified: 2026-02-22T22:10:00Z
status: passed
score: 3/3 must-haves verified
re_verification: false
---

# Phase 17: API Fixes Verification Report

**Phase Goal:** The v2 API handler exposes complete, consistently-named grammar features and all entry-level fields
**Verified:** 2026-02-22T22:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A v2 lookup for a German verb returns grammar feature ID 'grammar_presens' (not 'grammar_present') | VERIFIED | Line 238 of handler: `grammarFeatures.push('grammar_presens')`. No occurrence of `grammar_present` remains in the handler (0 matches). German entry in grammar-features.json uses `"id": "grammar_presens"` at line 12. |
| 2 | A v2 lookup for an adjective with genitiv declension data returns 'grammar_adjective_genitive' in grammarFeatures | VERIFIED | Lines 268-272 of handler check all three declension types (stark/schwach/gemischt). 360 of 365 adjectives in adjectivebank have genitiv data; the detection logic is substantive and general, not a stub. Logic trace confirms correct emission. |
| 3 | A v2 lookup for teuer_adj returns a 'declensionAlternatives' field containing the alternative declension forms | VERIFIED | Line 230 of handler: `if (entry.declension_alternatives) response.declensionAlternatives = entry.declension_alternatives;`. teuer_adj in adjectivebank.json has the `declension_alternatives` field at line 59383. Logic trace confirms field is surfaced in response. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `api/vocab/v2/lookup/[language]/[wordId].js` | v2 lookup handler with corrected grammar feature IDs and new field surfacing | VERIFIED | File exists, 291 lines. Contains `grammar_presens` (line 238), `grammar_adjective_genitive` (line 271), `declensionAlternatives` (line 230). No placeholder patterns. |
| `vocabulary/grammar-features.json` | Grammar features metadata with consistent German presens ID | VERIFIED | File exists, 332 lines. German section has `"id": "grammar_presens"` at line 12. Spanish (line 195) and French (line 266) correctly retain `"id": "grammar_present"`. `grammar_adjective_genitive` defined at line 173. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `api/vocab/v2/lookup/[language]/[wordId].js` | `vocabulary/grammar-features.json` | grammar feature ID consistency (grammar_presens) | VERIFIED | Handler pushes `grammar_presens`; grammar-features.json German entry ID is `grammar_presens`. IDs match. Spanish and French use `grammar_present` in both places — consistent. |
| `api/vocab/v2/lookup/[language]/[wordId].js` | `vocabulary/dictionary/de/adjectivebank.json` | declension genitiv detection and declension_alternatives surfacing | VERIFIED | Handler reads `entry.declension?.positiv?.stark?.genitiv` (and schwach/gemischt); adjectivebank teuer_adj has all three genitiv tables. Handler reads `entry.declension_alternatives`; teuer_adj has the field. End-to-end data path verified. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| API-01 | 17-01-PLAN.md | v2 handler uses consistent grammar feature ID (grammar_presens not grammar_present) | SATISFIED | `grammar_present` has 0 occurrences in handler. `grammar_presens` pushed at line 238. German entry in grammar-features.json uses `grammar_presens`. |
| API-02 | 17-01-PLAN.md | v2 handler emits grammar_adjective_genitive feature flag for adjective Genitiv data | SATISFIED | Conditional push at lines 268-272 covers all three declension types. 360 adjectives have genitiv data in real banks. |
| API-03 | 17-01-PLAN.md | v2 handler surfaces declension_alternatives field for entries that have it (teuer_adj) | SATISFIED | Conditional assignment at line 230. teuer_adj has the field. Only 1 adjective currently has it — field is correctly optional. |

All 3 requirements declared in plan are accounted for. REQUIREMENTS.md traceability table maps API-01/02/03 to Phase 17 with status "Complete". No orphaned requirements found for this phase.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | — | — | — |

No TODOs, FIXMEs, placeholder strings, empty implementations, or stub returns found in either modified file.

### Human Verification Required

No items require human verification. All three changes are deterministic data-driven checks whose inputs (bank entry fields) and outputs (grammarFeatures array, response field) can be verified programmatically. The Chrome extension integration (Leksihjelp) consuming these feature IDs is a downstream client concern outside this phase's scope.

### Commits Verified

Both commits documented in SUMMARY exist in the repository:
- `f474b7d` — fix(17-01): rename grammar_present to grammar_presens and add adjective genitive feature flag
- `126918b` — feat(17-01): surface declension_alternatives as declensionAlternatives in v2 lookup response

### Summary

All three API fixes are fully implemented, substantive, and wired to real data. The v2 handler:

1. Pushes `grammar_presens` (not `grammar_present`) for German verbs with presens conjugations. The legacy ID is completely absent from the handler. grammar-features.json German section is consistent.
2. Detects genitiv data across all three adjective declension types and emits `grammar_adjective_genitive`. This is a real check against live bank data; 360 of 365 adjectives qualify.
3. Surfaces `declensionAlternatives` for any adjective entry that carries `declension_alternatives` in the bank. Currently only teuer_adj has this field.

Spanish and French grammar-features.json entries correctly retain `grammar_present` — the rename was German-only, as specified.

Phase 17 goal achieved: the v2 API handler exposes complete, consistently-named grammar features and all entry-level fields.

---

_Verified: 2026-02-22T22:10:00Z_
_Verifier: Claude (gsd-verifier)_
