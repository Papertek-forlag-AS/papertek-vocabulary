# Roadmap: Papertek Vocabulary API

## Milestones

- ✅ **v1.0 German Data Completeness** — Phases 1-2 (shipped 2026-02-20)
- 🚧 **v1.1 German Adjective Declension** — Phases 3-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 German Data Completeness (Phases 1-2) — SHIPPED 2026-02-20</summary>

- [x] Phase 1: Fix German Noun Plurals (pre-GSD) — completed 2026-02-20
- [x] Phase 2: Add German Preteritum Conjugations (1/1 plans) — completed 2026-02-20

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 German Adjective Declension (In Progress)

**Milestone Goal:** Expand the German adjective bank and add full declension data so Leksihjelp's inflection search can resolve any declined adjective form to its base entry.

- [x] **Phase 3: Bank Cleanup** - Resolve data quality issues in the existing adjective bank before any grammar data is written (completed 2026-02-20)
- [x] **Phase 4: Goethe Adjective Extraction** - Extract genuine adjectives from the Goethe "other" wordlists and produce a curated candidate list (completed 2026-02-20)
- [x] **Phase 5: Schema Extension** - Extend adjective.schema.json with declension block, flags, and grammar feature registration (completed 2026-02-21)
- [ ] **Phase 6: New Entry Stubs** - Add bare-minimum stub entries for all extracted adjectives to both core and dictionary banks
- [x] **Phase 7: Comparison Data** - Populate comparative and superlative forms for all adjectives, irregular forms individually verified (completed 2026-02-21)
- [ ] **Phase 8: Declension Tables** - Enter full declension data for all declinable adjectives in both banks (largest data task)
- [ ] **Phase 9: Translations** - Add Norwegian and English translations for all newly extracted adjectives (runs parallel with Phase 8)
- [ ] **Phase 10: Integration** - Rebuild search index and update v2 lookup API to expose declension data

## Phase Details

### Phase 3: Bank Cleanup
**Goal**: The existing adjective bank is free of corrupt entries and schema validation passes on all 108 existing entries
**Depends on**: Nothing (first v1.1 phase)
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03
**Success Criteria** (what must be TRUE):
  1. Running ajv validation against adjective.schema.json with translations optional produces zero errors on all 108 existing entries
  2. The `beste_adj` entry is either removed from the bank or its presence documented with a clear rationale in PROJECT.md
  3. The `Lieblings-` entry is either removed from the adjective bank or reclassified to the correct word type
**Plans**: 1 plan
- [ ] 03-01-PLAN.md — Fix schema validation, remove beste_adj, reclassify Lieblings- to generalbank

### Phase 4: Goethe Adjective Extraction
**Goal**: A definitive curated list of new adjectives exists, deduplicated against the existing 106-entry bank, verified with the attributive test
**Depends on**: Phase 3
**Requirements**: BANK-01
**Success Criteria** (what must be TRUE):
  1. Each candidate word passes the "ein ___er Mann" attributive test confirming it is a genuine adjective
  2. No candidate word already exists in the current 106-entry adjective bank (deduplication complete)
  3. The curated candidate list includes the source CEFR level (A1/A2/B1) for each entry, ready for stub creation
**Plans**: 1 plan
- [ ] 04-01-PLAN.md — Extract, deduplicate, and classify adjectives from Goethe A1/A2/B1 wordlists

### Phase 5: Schema Extension
**Goal**: The adjective schema supports declension data, exception flags, and the genitive grammar feature toggle — schema is a validated gate for all downstream data entry
**Depends on**: Phase 3
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04
**Success Criteria** (what must be TRUE):
  1. adjective.schema.json accepts a `declension` object with the full 3 degrees × 3 article types × 4 cases × 4 gender/number structure without validation errors
  2. The `undeclinable` boolean flag is defined in the schema and the existing bank entries for lila, rosa, orange, cool can carry it without errors
  3. The `nicht_komparierbar` boolean flag is defined in the schema and validates correctly on test entries
  4. `grammar_adjective_declension` is registered and togglable in grammar-features.json (or confirmed already present from v1.0)
**Plans**: 1 plan
Plans:
- [ ] 05-01-PLAN.md — Add declension $defs chain, exception flags with conditionals, and register grammar_adjective_genitive

### Phase 6: New Entry Stubs
**Goal**: All newly extracted adjectives exist as stub entries in both the core bank and the dictionary bank, with valid IDs that translation and declension phases can reference
**Depends on**: Phase 4, Phase 5
**Requirements**: BANK-02, BANK-03
**Success Criteria** (what must be TRUE):
  1. Every adjective from the Phase 4 candidate list has an entry in `vocabulary/core/de/adjectivebank.json` with at minimum `word`, `_id`, and `audio` fields
  2. Every new entry is mirrored in `vocabulary/dictionary/de/adjectivebank.json` with `curriculum`, `cefr`, and `frequency` metadata populated
  3. The IDs in both bank files are identical for each entry, enabling safe cross-reference by translation and declension phases
**Plans**: 1 plan
Plans:
- [ ] 06-01-PLAN.md — Generate 259 adjective stubs in both core and dictionary banks, merge with existing entries, sort, update manifests, validate

### Phase 7: Comparison Data
**Goal**: All comparable adjectives have verified comparative and superlative forms; all irregular and non-comparable forms are correctly flagged
**Depends on**: Phase 6
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. Every comparable adjective in the core bank has `comparison.komparativ` and `comparison.superlativ` fields populated with the correct form
  2. The suppletive irregulars (gut/besser/best, viel/mehr/meist, hoch/höher/höchst, nah/näher/nächst) and all umlaut forms have been individually spot-checked and confirmed correct
  3. Indeclinable adjectives (lila, rosa, orange, cool, gern) carry `undeclinable: true` and have no comparison data
  4. Non-comparable adjectives carry `nicht_komparierbar: true` and have no comparison data
**Plans**: 1 plan
Plans:
- [ ] 07-01-PLAN.md — Generate comparison data for all 365 entries via rule engine + exception table, flag undeclinable and nicht_komparierbar, validate

### Phase 8: Declension Tables
**Goal**: Every declinable adjective has full declension data written to both core and dictionary banks — the primary deliverable of the v1.1 milestone
**Depends on**: Phase 7
**Requirements**: DECL-01, DECL-02, DECL-03, DECL-04, DECL-05
**Success Criteria** (what must be TRUE):
  1. Every declinable adjective in the core bank has a `declension.positiv` block covering stark/schwach/gemischt × 4 cases × 4 gender/number
  2. Every comparable adjective in the core bank has `declension.komparativ` and `declension.superlativ` blocks (superlativ uses schwach only, as grammatically correct)
  3. Irregular stems (hoch→hoh-, dunkel→dunkl-, teuer→teur-) produce correct declined forms — spot-check confirms "hohem" appears and "hochem" does not
  4. All declension data is present in both `vocabulary/core/de/adjectivebank.json` and `vocabulary/dictionary/de/adjectivebank.json`
**Plans**: TBD

### Phase 9: Translations
**Goal**: Norwegian and English translations exist for every newly extracted adjective so Leksihjelp can display them
**Depends on**: Phase 6
**Requirements**: BANK-04, BANK-05
**Success Criteria** (what must be TRUE):
  1. Every new adjective entry has a corresponding Norwegian (nb) translation entry in `vocabulary/translations/de-nb/adjectivebank.json`
  2. Every new adjective entry has a corresponding English (en) translation entry in `vocabulary/translations/de-en/adjectivebank.json`
**Plans**: TBD

### Phase 10: Integration
**Goal**: The complete adjective dataset is discoverable via search and exposed through the v2 API with declension data and grammar feature tagging
**Depends on**: Phase 8, Phase 9
**Requirements**: INTG-01, INTG-02, INTG-03
**Success Criteria** (what must be TRUE):
  1. The v2 lookup API response for a German adjective includes the `declension` field and lists `grammar_adjective_declension` in the `grammarFeatures` array
  2. The dictionary search index includes all newly extracted adjectives — searching for a new adjective word returns its entry
  3. Bank manifests report correct entry counts reflecting the expanded adjective bank
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in order 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10.
Phases 4 and 5 can begin in parallel after Phase 3. Phases 8 and 9 can run in parallel after Phase 6.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Fix German Noun Plurals | v1.0 | pre-GSD | Complete | 2026-02-20 |
| 2. Add German Preteritum Conjugations | v1.0 | 1/1 | Complete | 2026-02-20 |
| 3. Bank Cleanup | v1.1 | Complete    | 2026-02-20 | - |
| 4. Goethe Adjective Extraction | v1.1 | Complete    | 2026-02-20 | - |
| 5. Schema Extension | 1/1 | Complete   | 2026-02-21 | - |
| 6. New Entry Stubs | v1.1 | 0/1 | Not started | - |
| 7. Comparison Data | 1/1 | Complete   | 2026-02-21 | - |
| 8. Declension Tables | v1.1 | 0/TBD | Not started | - |
| 9. Translations | v1.1 | 0/TBD | Not started | - |
| 10. Integration | v1.1 | 0/TBD | Not started | - |
