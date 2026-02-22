# Roadmap: Papertek Vocabulary API

## Milestones

- ✅ **v1.0 German Data Completeness** — Phases 1-2 (shipped 2026-02-20)
- ✅ **v1.1 German Adjective Declension** — Phases 3-10 (shipped 2026-02-22)
- 🚧 **v1.2 German Perfektum & Noun Declension** — Phases 11-15 (in progress)

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

### v1.2 German Perfektum & Noun Declension (In Progress)

**Milestone Goal:** Add Perfektum conjugations for all 148 German verbs and full 4-case declension for all 331 German nouns, both schema-validated and indexed for inflection search.

- [x] **Phase 11: Schema Extensions** — Extend verb and noun schemas; register grammar features (completed 2026-02-22)
- [x] **Phase 12: Pre-Entry Audit** — Flag inseparable verbs, n-Deklination nouns; backfill preteritum to dictionary bank (completed 2026-02-22)
- [x] **Phase 13: Perfektum Data** — Add Perfektum conjugations for all 148 verbs in the core verbbank (completed 2026-02-22)
- [x] **Phase 14: Noun Declension Data** — Add 4-case declension for all 331 nouns in the core nounbank (completed 2026-02-22)
- [ ] **Phase 15: Sync & Integration** — Mirror to dictionary banks, rebuild search index, update v2 handler, validate all

## Phase Details

### Phase 11: Schema Extensions
**Goal**: Verb and noun schemas accept new Perfektum and declension fields; grammar features are registered
**Depends on**: Nothing (first phase of milestone)
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05
**Success Criteria** (what must be TRUE):
  1. `verb.schema.json` accepts `auxiliary`, `participle`, and `auxiliary_note` as optional fields on tenseConjugation without validation errors on existing data
  2. `verb.schema.json` accepts entry-level `inseparable: true` without breaking existing entries
  3. `noun.schema.json` accepts `singular`/`plural` sub-objects on caseEntry alongside existing flat `bestemt`/`ubestemt` (additive, no migration)
  4. `noun.schema.json` accepts entry-level `weak_masculine: true` without breaking existing entries
  5. `grammar-features.json` contains `grammar_noun_declension` and `grammar_genitiv` feature entries
**Plans:** 1/1 plans complete
Plans:
- [ ] 11-01-PLAN.md — Extend verb/noun schemas and register grammar features

### Phase 12: Pre-Entry Audit
**Goal**: All 20 inseparable prefix verbs and 11 n-Deklination nouns are flagged; preteritum dictionary bank debt is resolved
**Depends on**: Phase 11
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03
**Success Criteria** (what must be TRUE):
  1. All 20 inseparable prefix verbs (be-, ver-, er-, ent-, ge- prefixed) have `inseparable: true` in the core verbbank and pass schema validation
  2. All 11 n-Deklination nouns have `weak_masculine: true` in the core nounbank and pass schema validation
  3. Preteritum conjugations are present for all 148 verbs in `vocabulary/dictionary/de/verbbank.json` (pre-existing sync gap resolved)
**Plans:** 1/1 plans complete
Plans:
- [ ] 12-01-PLAN.md — Flag inseparable verbs, n-Deklination nouns, and sync preteritum to dictionary bank

### Phase 13: Perfektum Data
**Goal**: Every German verb has a complete, linguistically correct Perfektum block in the core verbbank
**Depends on**: Phase 12
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, PERF-07
**Success Criteria** (what must be TRUE):
  1. All 148 verbs have `conjugations.perfektum.participle` (past participle), `conjugations.perfektum.auxiliary` (haben/sein/both), and `conjugations.perfektum.former` (6 pronoun forms) populated
  2. The ~6 dual-auxiliary verbs (ausziehen, fahren, fliegen, schwimmen, laufen, wegfahren) have `dual_auxiliary: true` and `auxiliary_note` explaining context-dependent auxiliary selection
  3. All 7 modal verbs have appropriate Perfektum forms with `modal_note` documenting Ersatzinfinitiv behavior
  4. All 19 separable verbs have ge- positioned between prefix and stem (e.g., aufgestanden, mitgenommen, eingekauft)
  5. All 20 inseparable prefix verbs have no ge- prefix in the past participle (e.g., besucht, vergessen, bekommen)
**Plans:** 1/1 plans complete
Plans:
- [ ] 13-01-PLAN.md — Add Perfektum conjugations for all 144 verbs via scripted data injection

### Phase 14: Noun Declension Data
**Goal**: Every German noun has a complete, linguistically correct 4-case declension table in the core nounbank
**Depends on**: Phase 12
**Requirements**: NDECL-01, NDECL-02, NDECL-03, NDECL-04, NDECL-05, NDECL-06, NDECL-07
**Success Criteria** (what must be TRUE):
  1. All 331 nouns have Nominativ, Akkusativ, Dativ, and Genitiv entries, each with singular and plural sub-objects containing definite and indefinite article forms
  2. All 11 n-Deklination nouns have -(e)n endings in all non-nominative singular cases (e.g., des Bären, dem Bären, den Bären)
  3. Plural-only nouns (e.g., Eltern, Ferien) have plural-form cases only; uncountable nouns have singular-form cases only
  4. All 26 nouns with -s plurals have dative plural equal to nominative plural (no -n suffix added)
  5. `npm run validate:nouns` introduces zero new errors beyond the pre-existing 356-error baseline (pre-existing debt: missing translations fields, legacy plural type errors)
**Plans:** 2/2 plans complete
Plans:
- [ ] 14-01-PLAN.md — Add declension_type to noun schema and create validate:nouns tooling
- [ ] 14-02-PLAN.md — Inject 4-case declension data for all 331 nouns via scripted data injection

### Phase 15: Sync & Integration
**Goal**: All new data is mirrored to dictionary banks, the search index is rebuilt, the v2 handler emits correct feature flags, and the full system validates end-to-end
**Depends on**: Phase 13, Phase 14
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05
**Success Criteria** (what must be TRUE):
  1. All 148 verbs in `vocabulary/dictionary/de/verbbank.json` have `conjugations.perfektum` matching the core bank
  2. All 331 nouns in `vocabulary/dictionary/de/nounbank.json` have full 4-case declension matching the core bank
  3. `vocabulary/dictionary/de/search-index.json` has a `pp` (past participle) field on all 148 verb entries, enabling past-participle inflection lookup
  4. The v2 lookup handler emits `grammar_noun_declension` and `grammar_genitiv` feature flags when a noun with declension data is requested
  5. Schema validation (`npm run validate:verbs` and `npm run validate:nouns`) passes on both core and dictionary banks with zero errors
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
| 11. Schema Extensions | 1/1 | Complete    | 2026-02-22 | - |
| 12. Pre-Entry Audit | 1/1 | Complete    | 2026-02-22 | - |
| 13. Perfektum Data | 1/1 | Complete    | 2026-02-22 | - |
| 14. Noun Declension Data | 2/2 | Complete    | 2026-02-22 | - |
| 15. Sync & Integration | v1.2 | 0/? | Not started | - |
