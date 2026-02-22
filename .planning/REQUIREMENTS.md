# Requirements: Papertek Vocabulary API

**Defined:** 2026-02-22
**Core Value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.

## v1.2 Requirements

Requirements for milestone v1.2 — German Perfektum & Noun Declension. Each maps to roadmap phases.

### Schema

- [x] **SCHEMA-01**: Verb schema extended with `auxiliary` (haben/sein/both), `participle` (string), and `auxiliary_note` (object) optional fields in tenseConjugation
- [x] **SCHEMA-02**: Verb schema extended with entry-level `inseparable` boolean flag
- [x] **SCHEMA-03**: Noun schema extended with `singular`/`plural` sub-objects on caseEntry (additive alongside existing flat bestemt/ubestemt)
- [x] **SCHEMA-04**: Noun schema extended with entry-level `weak_masculine` boolean flag
- [x] **SCHEMA-05**: `grammar_noun_declension` and `grammar_genitiv` features registered in grammar-features.json

### Audit

- [x] **AUDIT-01**: All 20 inseparable prefix verbs flagged with `inseparable: true`
- [x] **AUDIT-02**: All 11 n-Deklination nouns flagged with `weak_masculine: true`
- [x] **AUDIT-03**: Preteritum data backfilled to dictionary verbbank for all 148 verbs

### Perfektum

- [x] **PERF-01**: All 148 German verbs have past participle in `conjugations.perfektum.participle`
- [x] **PERF-02**: All 148 German verbs have auxiliary selection (haben/sein/both) in `conjugations.perfektum.auxiliary`
- [x] **PERF-03**: All 148 German verbs have full 6-pronoun Perfektum conjugation in `conjugations.perfektum.former`
- [x] **PERF-04**: Dual-auxiliary verbs (~6) have `dual_auxiliary: true` and `auxiliary_note` explaining when each auxiliary applies
- [x] **PERF-05**: Modal verbs have appropriate Perfektum forms with `modal_note` documenting Ersatzinfinitiv
- [x] **PERF-06**: Separable verbs have correct ge- position (between prefix and stem: aufgestanden)
- [x] **PERF-07**: Inseparable prefix verbs correctly omit ge- in past participle (besucht, not *gebesucht)

### Noun Declension

- [x] **NDECL-01**: All 331 German nouns have Nominativ with singular/plural forms and definite/indefinite articles
- [x] **NDECL-02**: All 331 German nouns have Akkusativ with singular/plural forms and definite/indefinite articles
- [x] **NDECL-03**: All 331 German nouns have Dativ with singular/plural forms and definite/indefinite articles
- [x] **NDECL-04**: All 331 German nouns have Genitiv with singular/plural forms and definite/indefinite articles
- [x] **NDECL-05**: N-Deklination nouns (11) use -(e)n endings in all non-nominative singular cases
- [x] **NDECL-06**: Plural-only and uncountable nouns handled correctly (appropriate singular-only or plural-only forms)
- [x] **NDECL-07**: Dative plural -n rule applied correctly, with exception for -s plurals (26 nouns)

### Sync & Integration

- [x] **SYNC-01**: Perfektum data synced to dictionary verbbank for all 148 verbs
- [x] **SYNC-02**: Noun declension data synced to dictionary nounbank for all 331 nouns
- [x] **SYNC-03**: Search index rebuilt with `pp` field for verb entries enabling past-participle lookup
- [x] **SYNC-04**: v2 lookup handler emits `grammar_noun_declension` and `grammar_genitiv` feature flags
- [x] **SYNC-05**: Schema validation passing for both core and dictionary banks (verbs and nouns)

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
| SCHEMA-01 | Phase 11 | Complete |
| SCHEMA-02 | Phase 11 | Complete |
| SCHEMA-03 | Phase 11 | Complete |
| SCHEMA-04 | Phase 11 | Complete |
| SCHEMA-05 | Phase 11 | Complete |
| AUDIT-01 | Phase 12 | Complete |
| AUDIT-02 | Phase 12 | Complete |
| AUDIT-03 | Phase 12 | Complete |
| PERF-01 | Phase 13 | Complete |
| PERF-02 | Phase 13 | Complete |
| PERF-03 | Phase 13 | Complete |
| PERF-04 | Phase 13 | Complete |
| PERF-05 | Phase 13 | Complete |
| PERF-06 | Phase 13 | Complete |
| PERF-07 | Phase 13 | Complete |
| NDECL-01 | Phase 14 | Complete |
| NDECL-02 | Phase 14 | Complete |
| NDECL-03 | Phase 14 | Complete |
| NDECL-04 | Phase 14 | Complete |
| NDECL-05 | Phase 14 | Complete |
| NDECL-06 | Phase 14 | Complete |
| NDECL-07 | Phase 14 | Complete |
| SYNC-01 | Phase 15 | Complete |
| SYNC-02 | Phase 15 | Complete |
| SYNC-03 | Phase 15 | Complete |
| SYNC-04 | Phase 15 | Complete |
| SYNC-05 | Phase 15 | Complete |

**Coverage:**
- v1.2 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 — traceability filled after roadmap creation*
