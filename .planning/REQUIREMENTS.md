# Requirements: Papertek Vocabulary API

**Defined:** 2026-02-22
**Core Value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.

## v1.2 Requirements

Requirements for milestone v1.2 — German Perfektum & Noun Declension. Each maps to roadmap phases.

### Schema

- [ ] **SCHEMA-01**: Verb schema extended with `auxiliary` (haben/sein/both), `participle` (string), and `auxiliary_note` (object) optional fields in tenseConjugation
- [ ] **SCHEMA-02**: Verb schema extended with entry-level `inseparable` boolean flag
- [ ] **SCHEMA-03**: Noun schema extended with `singular`/`plural` sub-objects on caseEntry (additive alongside existing flat bestemt/ubestemt)
- [ ] **SCHEMA-04**: Noun schema extended with entry-level `weak_masculine` boolean flag
- [ ] **SCHEMA-05**: `grammar_noun_declension` and `grammar_genitiv` features registered in grammar-features.json

### Audit

- [ ] **AUDIT-01**: All 20 inseparable prefix verbs flagged with `inseparable: true`
- [ ] **AUDIT-02**: All 11 n-Deklination nouns flagged with `weak_masculine: true`
- [ ] **AUDIT-03**: Preteritum data backfilled to dictionary verbbank for all 148 verbs

### Perfektum

- [ ] **PERF-01**: All 148 German verbs have past participle in `conjugations.perfektum.participle`
- [ ] **PERF-02**: All 148 German verbs have auxiliary selection (haben/sein/both) in `conjugations.perfektum.auxiliary`
- [ ] **PERF-03**: All 148 German verbs have full 6-pronoun Perfektum conjugation in `conjugations.perfektum.former`
- [ ] **PERF-04**: Dual-auxiliary verbs (~6) have `dual_auxiliary: true` and `auxiliary_note` explaining when each auxiliary applies
- [ ] **PERF-05**: Modal verbs have appropriate Perfektum forms with `modal_note` documenting Ersatzinfinitiv
- [ ] **PERF-06**: Separable verbs have correct ge- position (between prefix and stem: aufgestanden)
- [ ] **PERF-07**: Inseparable prefix verbs correctly omit ge- in past participle (besucht, not *gebesucht)

### Noun Declension

- [ ] **NDECL-01**: All 331 German nouns have Nominativ with singular/plural forms and definite/indefinite articles
- [ ] **NDECL-02**: All 331 German nouns have Akkusativ with singular/plural forms and definite/indefinite articles
- [ ] **NDECL-03**: All 331 German nouns have Dativ with singular/plural forms and definite/indefinite articles
- [ ] **NDECL-04**: All 331 German nouns have Genitiv with singular/plural forms and definite/indefinite articles
- [ ] **NDECL-05**: N-Deklination nouns (11) use -(e)n endings in all non-nominative singular cases
- [ ] **NDECL-06**: Plural-only and uncountable nouns handled correctly (appropriate singular-only or plural-only forms)
- [ ] **NDECL-07**: Dative plural -n rule applied correctly, with exception for -s plurals (26 nouns)

### Sync & Integration

- [ ] **SYNC-01**: Perfektum data synced to dictionary verbbank for all 148 verbs
- [ ] **SYNC-02**: Noun declension data synced to dictionary nounbank for all 331 nouns
- [ ] **SYNC-03**: Search index rebuilt with `pp` field for verb entries enabling past-participle lookup
- [ ] **SYNC-04**: v2 lookup handler emits `grammar_noun_declension` and `grammar_genitiv` feature flags
- [ ] **SYNC-05**: Schema validation passing for both core and dictionary banks (verbs and nouns)

## Future Requirements

### Verb Tenses

- **TENSE-01**: Futur I conjugations for German verbs
- **TENSE-02**: Konjunktiv II forms for German verbs

### Verbphrases

- **VPHRASE-01**: Perfektum forms for German verbphrases (Rad fahren, Gassi gehen)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Verbphrase Perfektum | Inflection search for phrases not supported; add only if users report confusion |
| Subjunctive II (Konjunktiv II) | Separate B1+ milestone |
| Futur I | Separate milestone |
| Spanish/French past tenses | Both languages covered for current Leksihjelp needs |
| Audio for declined/conjugated forms | Production content task, not data milestone |
| Programmatic declension generation (rule engine) | German exceptions make rule engines fragile; explicit forms stored |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 11 | Pending |
| SCHEMA-02 | Phase 11 | Pending |
| SCHEMA-03 | Phase 11 | Pending |
| SCHEMA-04 | Phase 11 | Pending |
| SCHEMA-05 | Phase 11 | Pending |
| AUDIT-01 | Phase 12 | Pending |
| AUDIT-02 | Phase 12 | Pending |
| AUDIT-03 | Phase 12 | Pending |
| PERF-01 | Phase 13 | Pending |
| PERF-02 | Phase 13 | Pending |
| PERF-03 | Phase 13 | Pending |
| PERF-04 | Phase 13 | Pending |
| PERF-05 | Phase 13 | Pending |
| PERF-06 | Phase 13 | Pending |
| PERF-07 | Phase 13 | Pending |
| NDECL-01 | Phase 14 | Pending |
| NDECL-02 | Phase 14 | Pending |
| NDECL-03 | Phase 14 | Pending |
| NDECL-04 | Phase 14 | Pending |
| NDECL-05 | Phase 14 | Pending |
| NDECL-06 | Phase 14 | Pending |
| NDECL-07 | Phase 14 | Pending |
| SYNC-01 | Phase 15 | Pending |
| SYNC-02 | Phase 15 | Pending |
| SYNC-03 | Phase 15 | Pending |
| SYNC-04 | Phase 15 | Pending |
| SYNC-05 | Phase 15 | Pending |

**Coverage:**
- v1.2 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 — traceability filled after roadmap creation*
