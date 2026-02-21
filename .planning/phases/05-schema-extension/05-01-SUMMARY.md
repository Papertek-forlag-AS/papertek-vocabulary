---
phase: 05-schema-extension
plan: 01
subsystem: schema
tags: [json-schema, adjective, declension, validation, grammar-features]
dependency_graph:
  requires: []
  provides: [adjective-declension-schema, exception-flags, grammar-adjective-genitive]
  affects: [phases/06-stubs, phases/07-comparison, phases/08-declension]
tech_stack:
  added: []
  patterns: [json-schema-2020-12-defs-ref-chain, allOf-if-then-conditionals, boolean-false-schema]
key_files:
  created: []
  modified:
    - vocabulary/schema/adjective.schema.json
    - vocabulary/grammar-features.json
decisions:
  - "Implemented dependsOn as a one-off metadata field on grammar_adjective_genitive only — no retrofitting existing features (minimal change, scope-contained)"
  - "Used allOf with two independent if/then blocks (not oneOf) for flag conditionals — cleaner error messages and isolated rule reasoning"
  - "Used boolean false schema (not not: {} or maxProperties: 0) to forbid forbidden properties — canonical JSON Schema 2020-12 approach"
metrics:
  duration: "~2 min"
  completed: "2026-02-21"
  tasks_completed: 3
  files_modified: 2
---

# Phase 5 Plan 01: Schema Extension Summary

**One-liner:** adjective.schema.json extended with 5-level $defs chain (genderNumber/caseBlock/articleBlock/superlativBlock/declension), undeclinable and nicht_komparierbar flag conditionals via allOf/if/then, English alias removal from comparison $def, and grammar_adjective_genitive registered in grammar-features.json

## What Was Built

Extended `vocabulary/schema/adjective.schema.json` to become the validated gate for all downstream adjective declension data entry. Added full 4-level nested declension structure, exception flags with conditional enforcement, and registered a new grammar feature.

## Tasks Completed

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Add declension $defs chain and entry-level declension property | d7550a6 | 5 new $defs (genderNumber, caseBlock, articleBlock, superlativBlock, declension); declension property on adjectiveEntry; removed English aliases from comparison; added additionalProperties: false to comparison |
| 2 | Add exception flags and conditional validation rules | 15f5187 | undeclinable and nicht_komparierbar boolean flags; allOf with 2 if/then blocks; 5-test AJV suite all pass |
| 3 | Register grammar_adjective_genitive feature | a59bae9 | grammar_adjective_genitive appended to de.features with dependsOn: grammar_adjective_declension; total de features: 14 -> 15 |

## Verification Results

All 8 verification checks passed:

1. `node scripts/validate-adjectives.js` — PASS: All 106 adjective entries validate against schema
2. Schema JSON valid — PASS
3. Grammar-features JSON valid — PASS
4. All 5 declension $defs exist (genderNumber, caseBlock, articleBlock, superlativBlock, declension) — PASS
5. superlativBlock has only `schwach` (not stark or gemischt) — PASS
6. comparison $def has no English aliases (positive, comparative, superlative removed) — PASS
7. allOf has 2 if/then blocks for the two flag rules — PASS
8. All 5 AJV conditional tests pass (undeclinable+declension rejects, undeclinable alone passes, nicht_komparierbar+comparison rejects, nicht_komparierbar+positiv-only passes, nicht_komparierbar+komparativ rejects) — PASS

## Decisions Made

1. **dependsOn field added as one-off on grammar_adjective_genitive only** — No existing feature object uses dependsOn. Adding it only to the new entry keeps the change minimal. Retrofitting all 14 existing features with dependsOn: null or similar would be scope creep with no confirmed app benefit.

2. **allOf with independent if/then blocks** — Chosen over single if/then/else with nested conditions. Each flag rule is isolated and independently readable. AJV error messages identify exactly which rule triggered.

3. **Boolean false schema to forbid properties** — `"declension": false` is the canonical JSON Schema 2020-12 approach. Clearer than `not: {}` or `maxProperties: 0`. AJV produces clear error message: "boolean schema is false".

## Deviations from Plan

**Minor: Feature count discrepancy in plan**

The plan's verify step expected "Total de features: 14 (was 13)" but the original grammar-features.json had 14 features (grammar_present through grammar_adjective_declension), making the new total 15. This is correct behavior — the original count in the plan was wrong. No action needed.

Classification: Plan documentation error, not an execution deviation. Schema change is correct.

## Schema Structure After Phase 5

```
adjectiveEntry
  word, audio, type, intro, translations, synonyms,
  translation_synonyms, explanations,
  comparison (positiv, komparativ, superlativ) [additionalProperties: false]
  declension -> $defs/declension
    positiv    -> $defs/articleBlock (stark, schwach, gemischt)
    komparativ -> $defs/articleBlock
    superlativ -> $defs/superlativBlock (schwach only)
      each articleBlock -> $defs/caseBlock (nominativ, akkusativ, dativ, genitiv)
        each caseBlock  -> $defs/genderNumber (maskulin, feminin, neutrum, plural)
  undeclinable: boolean
  nicht_komparierbar: boolean
  allOf:
    if undeclinable=true then declension: false
    if nicht_komparierbar=true then comparison: false, declension.komparativ: false, declension.superlativ: false
```

## Self-Check: PASSED

Files exist:
- vocabulary/schema/adjective.schema.json: FOUND
- vocabulary/grammar-features.json: FOUND
- .planning/phases/05-schema-extension/05-01-SUMMARY.md: FOUND (this file)

Commits exist:
- d7550a6: FOUND
- 15f5187: FOUND
- a59bae9: FOUND
