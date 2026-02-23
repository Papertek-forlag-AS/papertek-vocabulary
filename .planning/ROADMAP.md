# Roadmap: Papertek Vocabulary API

## Milestones

- ✅ **v1.0 German Data Completeness** — Phases 1-2 (shipped 2026-02-20)
- ✅ **v1.1 German Adjective Declension** — Phases 3-10 (shipped 2026-02-22)
- ✅ **v1.2 German Perfektum & Noun Declension** — Phases 11-15 (shipped 2026-02-22)
- **v1.3 Tech Debt Cleanup** — Phases 16-19 (in progress)

## Phases

<details>
<summary>✅ v1.0 German Data Completeness (Phases 1-2) — SHIPPED 2026-02-20</summary>

- [x] Phase 1: Fix German Noun Plurals (pre-GSD) — completed 2026-02-20
- [x] Phase 2: Add German Preteritum Conjugations (1/1 plans) — completed 2026-02-20

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 German Adjective Declension (Phases 3-10) — SHIPPED 2026-02-22</summary>

- [x] Phase 3: Bank Cleanup (1/1 plans) — completed 2026-02-20
- [x] Phase 4: Goethe Adjective Extraction (1/1 plans) — completed 2026-02-20
- [x] Phase 5: Schema Extension (1/1 plans) — completed 2026-02-21
- [x] Phase 6: New Entry Stubs (1/1 plans) — completed 2026-02-21
- [x] Phase 7: Comparison Data (1/1 plans) — completed 2026-02-21
- [x] Phase 8: Declension Tables (1/1 plans) — completed 2026-02-21
- [x] Phase 9: Translations (1/1 plans) — completed 2026-02-21
- [x] Phase 10: Integration (1/1 plans) — completed 2026-02-21

**Archive:** `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 German Perfektum & Noun Declension (Phases 11-15) — SHIPPED 2026-02-22</summary>

- [x] Phase 11: Schema Extensions (1/1 plans) — completed 2026-02-22
- [x] Phase 12: Pre-Entry Audit (1/1 plans) — completed 2026-02-22
- [x] Phase 13: Perfektum Data (1/1 plans) — completed 2026-02-22
- [x] Phase 14: Noun Declension Data (2/2 plans) — completed 2026-02-22
- [x] Phase 15: Sync & Integration (3/3 plans) — completed 2026-02-22

**Archive:** `.planning/milestones/v1.2-ROADMAP.md`

</details>

**v1.3 Tech Debt Cleanup (Phases 16-19)**

- [x] **Phase 16: Data Fixes** - Correct missing/wrong fields across noun and verb data banks (completed 2026-02-22)
- [x] **Phase 17: API Fixes** - Fix v2 handler grammar ID, missing feature flags, and hidden fields (completed 2026-02-22)
- [ ] **Phase 18: Tooling Fixes** - Register all scripts in package.json and unify validate:all
- [ ] **Phase 19: Curriculum Manifest Fix** - Update stale grammar_present IDs in curriculum manifest and fix README

## Phase Details

### Phase 16: Data Fixes
**Goal**: All noun and verb data banks are complete and correct — no missing required fields, no stale counts
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. `morgenmensch_noun` has a `genus` field in the dict nounbank
  2. All 148 core verbbank entries have a `type` field (regular/irregular/modal/separable/reflexive)
  3. All 144 non-verbphrase verbs have presens conjugation objects with all 6 pronoun forms
  4. Core manifest counts (generalbank, nounbank, verbbank) match actual entry counts in each bank
  5. The 2 nouns with declension-based plurals have their top-level `plural` field populated, and `leute_noun` has a `genus` field (or an explicitly documented null)
**Plans**: 3 plans
Plans:
- [ ] 16-01-PLAN.md — Noun field fixes (genus, plural, plural-only genus)
- [ ] 16-02-PLAN.md — Verb type classification + presens conjugations
- [ ] 16-03-PLAN.md — Manifest count corrections

### Phase 17: API Fixes
**Goal**: The v2 API handler exposes complete, consistently-named grammar features and all entry-level fields
**Depends on**: Phase 16
**Requirements**: API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. A v2 API response for a verb entry uses the ID `grammar_presens` (not `grammar_present`) in its feature flags
  2. A v2 API response for an adjective entry emits the `grammar_adjective_genitive` feature flag when Genitiv data is present
  3. A v2 API response for `teuer_adj` includes the `declension_alternatives` field
**Plans**: 1 plan
Plans:
- [ ] 17-01-PLAN.md — Fix grammar presens ID, add adjective genitive flag, surface declension_alternatives

### Phase 18: Tooling Fixes
**Goal**: All project scripts are discoverable and runnable via npm, and a single `validate:all` command covers the full validation suite
**Depends on**: Phase 16
**Requirements**: TOOL-01, TOOL-02
**Success Criteria** (what must be TRUE):
  1. Running `npm run build:search-index` executes `build-search-index.js` without error
  2. Running `npm run validate:all` executes nouns, verbs, dict variants, and integration checks — all passing — in a single command
**Plans**: 1 plan
Plans:
- [ ] 18-01-PLAN.md — Register build:search-index, clean up phantom scripts, unify validate:all

### Phase 19: Curriculum Manifest Fix
**Goal**: All grammar feature IDs in curriculum manifests match grammar-features.json, and API documentation reflects current naming
**Depends on**: Phase 17
**Requirements**: INTEG-01, INTEG-02
**Gap Closure:** Closes integration gap and broken flow from v1.3 audit
**Success Criteria** (what must be TRUE):
  1. `vocab-manifest-tysk1-vg1.json` contains zero instances of `grammar_present` in German lesson feature arrays (all replaced with `grammar_presens`)
  2. `api/vocab/README.md` German grammar features example uses `grammar_presens` (not `grammar_present`)
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Fix German Noun Plurals | v1.0 | pre-GSD | Complete | 2026-02-20 |
| 2. Add German Preteritum Conjugations | v1.0 | 1/1 | Complete | 2026-02-20 |
| 3. Bank Cleanup | v1.1 | 1/1 | Complete | 2026-02-20 |
| 4. Goethe Adjective Extraction | v1.1 | 1/1 | Complete | 2026-02-20 |
| 5. Schema Extension | v1.1 | 1/1 | Complete | 2026-02-21 |
| 6. New Entry Stubs | v1.1 | 1/1 | Complete | 2026-02-21 |
| 7. Comparison Data | v1.1 | 1/1 | Complete | 2026-02-21 |
| 8. Declension Tables | v1.1 | 1/1 | Complete | 2026-02-21 |
| 9. Translations | v1.1 | 1/1 | Complete | 2026-02-21 |
| 10. Integration | v1.1 | 1/1 | Complete | 2026-02-21 |
| 11. Schema Extensions | v1.2 | 1/1 | Complete | 2026-02-22 |
| 12. Pre-Entry Audit | v1.2 | 1/1 | Complete | 2026-02-22 |
| 13. Perfektum Data | v1.2 | 1/1 | Complete | 2026-02-22 |
| 14. Noun Declension Data | v1.2 | 2/2 | Complete | 2026-02-22 |
| 15. Sync & Integration | v1.2 | 3/3 | Complete | 2026-02-22 |
| 16. Data Fixes | 3/3 | Complete    | 2026-02-22 | - |
| 17. API Fixes | 1/1 | Complete    | 2026-02-22 | - |
| 18. Tooling Fixes | v1.3 | 0/1 | Not started | - |
| 19. Curriculum Manifest Fix | v1.3 | 0/TBD | Not started | - |
