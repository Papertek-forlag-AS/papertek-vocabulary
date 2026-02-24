# GSD State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.
**Current focus:** Phase 23 — Validation Cleanup

## Current Position

Phase: 23 of 23 (Validation Cleanup)
Plan: 1 of 1 in current phase (23-01 complete — Phase 23 DONE)
Status: Phase 23 complete — v2.0 milestone fully verified
Last activity: 2026-02-24 — 23-01 created validate-migration.js; confirmed 8/8 banks schema-valid, 3454 dict entries + 1126 core entries match pre-migration baseline, old directories absent

Progress: [███████████████████████████████] 100% (23/23 phases complete across all milestones)

## Performance Metrics

**By Milestone:**

| Milestone | Phases | Plans | Timeline |
|-----------|--------|-------|----------|
| v1.0 | 2 | 1 (+1 pre-GSD) | 2026-02-20 |
| v1.1 | 8 | 8 | 2026-02-20 → 2026-02-22 (3 days) |
| v1.2 | 5 | 8 | 2026-02-14 → 2026-02-22 (8 days) |
| v1.3 | 4 | 6 | 2026-02-22 → 2026-02-23 (2 days) |
| v2.0 | 4 (planned) | TBD | Started 2026-02-23 |

## Accumulated Context

### Decisions

Decisions logged in PROJECT.md Key Decisions table (20 decisions).
Key decisions relevant to v2.0:
- Dual-bank storage (v1.3) was the resolved pattern — v2.0 eliminates it
- Core manifest replaces implicit "in core bank = curriculum" pattern
- External API contracts (Leksihjelp) must not break — v1 response shape frozen
- Dict bank is the authoritative merge base (superset); core-exclusive fields are additive-only (20-01)
- adjectivebank has 106 curriculum entries, not 365 — dict bank already had 259 adjectives with curriculum:false (20-01)
- pp field read from merged verbbank's conjugations.perfektum.participle directly — no separate core verbbank load needed (20-02)
- Search index canonical location is vocabulary/banks/de/search-index.json (20-02)
- [Phase 21-translation-consolidation]: Phase 21-01: Translation merge uses simple union (zero overlaps confirmed across all 6 bank/pair combos); core version wins defensively on any overlap
- [Phase 21-translation-consolidation]: Phase 21-01: build-search-index.js simplified to single-map translation lookup — no more curr vs dict distinction
- [Phase 21-translation-consolidation]: Phase 21-02: Delete proceeded only after 6/6 merge verification checks passed (0 missing, 0 mismatches); translation directories now clean (de-nb, de-en, es-en, es-nb, fr-nb only)
- [Phase 22-api-updates]: Phase 22-01: v1 manifest totalWords reports curriculumWords (867) not total bank count (3454) — accurate for curriculum-only endpoint
- [Phase 22-api-updates]: Phase 22-01: Audio URL updated proactively to /shared/vocabulary/banks/{lang}/audio ahead of Plan 22-02 core/ deletion
- [Phase 22-api-updates]: Phase 22-01: v1 core uses Set-based curriculum filtering from manifest.banks[bank].ids for O(1) per-entry lookup
- [Phase 22-api-updates]: Strip _metadata from bank before AJV validation — merged banks have different _metadata structure without translations field
- [Phase 22-api-updates]: verify-integration.js restructured for single-bank: reads merged banks/de/ instead of comparing core vs dict; SYNC-01/02 verify coverage within merged bank
- [Phase 23-validation-cleanup]: 5 banks without dedicated schemas (general/articles/pronouns/numbers/phrases) use structural integrity check — translations are in external files, not embedded; core-word schema required:translations would be a false negative
- [Phase 23-validation-cleanup]: execSync maxBuffer must be 20MB for adjectivebank git show — bank is ~2MB, exceeds default 1MB limit causing ENOBUFS
- [Phase 23-validation-cleanup]: das_haustier_noun.word difference (core: "Haustier" vs merged: "das Haustier") is a known acceptable exception — dict bank was authoritative merge base and had article-included form

### Pending Todos

- (none)

### Blockers/Concerns

- CDN cache: Vercel s-maxage=86400 — after deploy, up to 24h before new data reaches Leksihjelp end users.

## Session Continuity

Last session: 2026-02-24
Stopped at: 23-01 complete — Phase 23 fully done. v2.0 milestone verified: all 8 banks schema-valid, 3454 dict + 1126 core entries match pre-migration baseline, old directories absent.
Resume with: v2.0 milestone complete — deploy to Vercel
