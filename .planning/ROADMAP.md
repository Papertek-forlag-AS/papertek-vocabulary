# Roadmap: Papertek Vocabulary API

## Milestones

- ✅ **v1.0 German Data Completeness** — Phases 1-2 (shipped 2026-02-20)
- ✅ **v1.1 German Adjective Declension** — Phases 3-10 (shipped 2026-02-22)
- ✅ **v1.2 German Perfektum & Noun Declension** — Phases 11-15 (shipped 2026-02-22)
- ✅ **v1.3 Tech Debt Cleanup** — Phases 16-19 (shipped 2026-02-23)
- 🚧 **v2.0 Single-Bank Architecture** — Phases 20-23 (in progress)

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

<details>
<summary>✅ v1.3 Tech Debt Cleanup (Phases 16-19) — SHIPPED 2026-02-23</summary>

- [x] Phase 16: Data Fixes (3/3 plans) — completed 2026-02-22
- [x] Phase 17: API Fixes (1/1 plans) — completed 2026-02-22
- [x] Phase 18: Tooling Fixes (1/1 plans) — completed 2026-02-23
- [x] Phase 19: Curriculum Manifest Fix (1/1 plans) — completed 2026-02-23

**Archive:** `.planning/milestones/v1.3-ROADMAP.md`

</details>

### 🚧 v2.0 Single-Bank Architecture (In Progress)

**Milestone Goal:** Eliminate the dual-bank pattern by merging core and dictionary banks into single banks per word class, with a core manifest for curriculum filtering. External API contracts remain unchanged.

- [x] **Phase 20: Bank & Manifest Consolidation** - Merge all 8 German bank pairs into single banks and create the core manifest (completed 2026-02-23)
- [ ] **Phase 21: Translation Consolidation** - Merge de-nb + de-en translation directories and remove old -dict/ directories
- [ ] **Phase 22: API Updates** - Update v1 and v2 handlers to read from the new single-bank structure
- [ ] **Phase 23: Validation & Cleanup** - Verify data and API correctness, remove old bank directories

## Phase Details

### Phase 20: Bank & Manifest Consolidation
**Goal**: All 8 German word-class banks exist as single files combining core and dictionary data, with a manifest identifying curriculum entries
**Depends on**: Phase 19 (v1.3 complete baseline)
**Requirements**: BANK-01, BANK-02, BANK-03, BANK-04, BANK-05, MNFST-01, MNFST-02
**Success Criteria** (what must be TRUE):
  1. Each of the 8 bank types (nounbank, verbbank, adjectivebank, generalbank, articlesbank, pronounsbank, numbersbank, phrasesbank) exists as a single merged file
  2. Every merged entry contains both grammar data fields and lexical metadata (curriculum, cefr, frequency, tags)
  3. Core-only entries that had no dictionary counterpart have default values for lexical metadata fields
  4. The core manifest file lists the IDs of all curriculum entries with per-bank count summaries
  5. The search index is rebuilt from the merged banks and covers all entries
**Plans**: 2 plans
Plans:
- [ ] 20-01-PLAN.md — Merge 8 bank pairs into single banks + create core manifest
- [ ] 20-02-PLAN.md — Rebuild search index from merged banks

### Phase 21: Translation Consolidation
**Goal**: Translation data for each word class lives in a single directory per language pair, with no duplicate -dict/ directories remaining
**Depends on**: Phase 20
**Requirements**: TRANS-01, TRANS-02, TRANS-03
**Success Criteria** (what must be TRUE):
  1. Each bank's Norwegian translations exist only under de-nb/ (no de-nb-dict/ directory)
  2. Each bank's English translations exist only under de-en/ (no de-en-dict/ directory)
  3. Every entry that had a translation in either the core or dict directory has its translation present in the merged directory
**Plans**: TBD

### Phase 22: API Updates
**Goal**: Both API versions read exclusively from the new single-bank structure and translation directories, with identical external response shapes
**Depends on**: Phase 21
**Requirements**: API-01, API-02, API-03, API-04, API-05
**Success Criteria** (what must be TRUE):
  1. The v1 core handler returns only curriculum entries (those listed in the core manifest) from the single bank
  2. The v1 response JSON shape is byte-for-byte identical to the pre-migration response for any curriculum entry
  3. The v2 lookup handler returns the full entry from the single bank for any queried ID
  4. The v2 search handler resolves lookups against the rebuilt search index
  5. Translation resolution in v2 reads from a single translation directory per language pair (no fallback to -dict/ path)
**Plans**: TBD

### Phase 23: Validation & Cleanup
**Goal**: The new architecture is verified correct against the pre-migration baseline and all old dual-bank directories are removed
**Depends on**: Phase 22
**Requirements**: VALID-01, VALID-02, VALID-03, BANK-06
**Success Criteria** (what must be TRUE):
  1. Schema validation runs 0 errors across all 8 merged bank files
  2. v1 API response for every curriculum entry is identical to its pre-migration snapshot
  3. v2 API response for every entry is identical to its pre-migration snapshot
  4. The old core/ and dictionary/ bank directories no longer exist in the repository
**Plans**: TBD

## Progress

**Execution Order:** 20 → 21 → 22 → 23

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Noun Plurals | v1.0 | 1/1 | Complete | 2026-02-20 |
| 2. Preteritum | v1.0 | 1/1 | Complete | 2026-02-20 |
| 3. Bank Cleanup | v1.1 | 1/1 | Complete | 2026-02-20 |
| 4. Goethe Extraction | v1.1 | 1/1 | Complete | 2026-02-20 |
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
| 16. Data Fixes | v1.3 | 3/3 | Complete | 2026-02-22 |
| 17. API Fixes | v1.3 | 1/1 | Complete | 2026-02-22 |
| 18. Tooling Fixes | v1.3 | 1/1 | Complete | 2026-02-23 |
| 19. Curriculum Manifest Fix | v1.3 | 1/1 | Complete | 2026-02-23 |
| 20. Bank & Manifest Consolidation | 2/2 | Complete   | 2026-02-23 | - |
| 21. Translation Consolidation | v2.0 | 0/TBD | Not started | - |
| 22. API Updates | v2.0 | 0/TBD | Not started | - |
| 23. Validation & Cleanup | v2.0 | 0/TBD | Not started | - |
