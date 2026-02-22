# GSD State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.
**Current focus:** Phase 15 — Sync & Integration (COMPLETE — all dict banks bridged to core, v2 handler updated, search index rebuilt with pp, verify:integration script confirms all 5 SYNC requirements)

## Current Position

Phase: 15 of 15 in v1.2 (Sync & Integration)
Plan: 3 of 3 complete
Status: Phase 15 COMPLETE — all SYNC requirements fulfilled; search index rebuilt with pp, verify:integration exits 0
Last activity: 2026-02-22 — Phase 15 Plan 03 executed (rebuild search index with pp field, create verify:integration script)

Progress: [██████████] 100% (v1.2)

## Performance Metrics

**By Milestone:**

| Milestone | Phases | Plans | Timeline |
|-----------|--------|-------|----------|
| v1.0 | 2 | 1 (+1 pre-GSD) | 2026-02-20 |
| v1.1 | 8 | 8 | 2026-02-20 → 2026-02-22 (3 days) |
| v1.2 | 5 | TBD | In progress |
| Phase 13 Plan 01 | 3 min | 2 tasks | 2 files |
| Phase 14 Plan 01 | 1 min | 1 task | 3 files |
| Phase 14 P02 | 9 | 2 tasks | 2 files |
| Phase 15 P02 | 2 | 2 tasks | 5 files |
| Phase 15-sync-integration P03 | 3 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table.
Recent decisions affecting v1.2:

- Additive noun cases approach: add `singular`/`plural` sub-objects alongside existing flat `bestemt`/`ubestemt` — never replace flat fields (avoids migration of 223 entries)
- Preteritum dict-bank backfill included in v1.2 scope (AUDIT-03) — confirmed sync gap; cleaner than deferring
- Explicit storage for all participles and noun case forms — no rule engines (mirrors adjective declension precedent)
- Phase 11 (2026-02-22): All schema extensions additive-only; pre-existing AJV errors (356 noun, ~130 verb) are data quality debt not introduced by schema changes
- Phase 11 (2026-02-22): grammar_noun_declension positioned as parent before grammar_genitiv, mirroring grammar_adjective_declension/grammar_adjective_genitive pattern
- Phase 12 (2026-02-22): 17 confirmed inseparable prefix verbs (not 20 as estimated in roadmap); geben/gehen/gewinnen excluded — ge- is part of the stem, not a prefix
- Phase 12 (2026-02-22): sync-preteritum.js uses ESM import/export (project convention from package.json type:module); plan mentioned CommonJS but ESM is correct
- Phase 12 (2026-02-22): inseparable flag synced to dict verbbank in AUDIT-03 same pass as preteritum — efficient housekeeping aligned with dual-bank sync principle
- Phase 12 (2026-02-22): weak_masculine NOT synced to dict nounbank in phase 12; deferred to Phase 15 (Sync & Integration) as scoped
- [Phase 13-perfektum-data]: sich_vorbereiten participle: 'vorbereitet' (not 'vorgebereitet') — exception to separable ge-insertion rule; bereiten-base behaves like a root verb in Partizip II
- [Phase 13-perfektum-data]: moechten_modal participle: 'gemocht' from underlying mögen with modal_note — defective verb has no true Perfektum, mirrors preteritum treatment
- [Phase 14-noun-declension-data]: declension_type is optional (not in required array) — entries without it remain valid until Plan 02 injects data
- [Phase 14-noun-declension-data]: Pre-existing 356-error AJV baseline confirmed; Phase 14 Plan 01 introduces zero new errors
- [Phase 14]: Plan NDECL-07 spot-check compared full article+noun strings (den Autos vs die Autos) — always differ by article; corrected to compare noun stems; data was always correct
- [Phase 14]: Uncountable noun set is 28 (not 22 estimated): months 12 + holidays 4 + musikunterricht/sportunterricht + 6 substance/abstract — matched nounbank null-plural entries
- [Phase 15-01-validation-baseline]: core-word.schema.json translations minProperties:1 removed — empty stubs {} are valid placeholders for entries without translations yet
- [Phase 15-01-validation-baseline]: verb.schema.json enum extended with verbphrase — 4 existing verbphrase entries were valid data, schema was missing the type
- [Phase 15-01-validation-baseline]: validate-nouns/verbs accept NOUN_BANK/VERB_BANK env var — enables dict bank validation without duplicating scripts
- [Phase 15-01-validation-baseline]: Dict bank _metadata.type field removed — _metadata is metadata not a word entry; type:dictionary was never valid per noun/verb schemas
- [Phase 15-sync-integration]: koennen_modal does not exist in core verbbank — only moechten_modal exists as modal; spot-check adjusted accordingly, moechten_modal has modal_note and was synced correctly
- [Phase 15-sync-integration]: Sync scripts (sync-perfektum.js, sync-nouns.js) follow sync-preteritum.js canonical ESM pattern; scripts serve as permanent audit trail for data provenance
- [Phase 15-sync-integration]: build-search-index.js reads all 8 dict banks for complete 3454-entry rebuild including articlesbank/numbersbank/phrasesbank/pronounsbank
- [Phase 15-sync-integration]: verify-integration.js is permanent (28 checks across SYNC-01 to SYNC-05); uses AJV directly rather than child processes

### Blockers/Concerns

- CDN cache: Vercel s-maxage=86400 — after deploy, up to 24h before new data reaches Leksihjelp end users unless CDN is purged manually.
- Noun `cases` structural decision codified in Phase 11 schema (RESOLVED 2026-02-22).

### Pending Todos

- (none)

## Session Continuity

Last session: 2026-02-22
Stopped at: Phase 15 Plan 03 complete — search index rebuilt with pp field on 144 verbs; verify:integration script confirms all 5 SYNC requirements (28/28 checks pass)
Resume file: N/A — v1.2 milestone COMPLETE; all SYNC requirements fulfilled
