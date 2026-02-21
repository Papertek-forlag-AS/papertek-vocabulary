# Requirements: Papertek Vocabulary API

**Defined:** 2026-02-20
**Core Value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.

## v1.1 Requirements

Requirements for German Adjective Declension milestone. Each maps to roadmap phases.

### Cleanup

- [ ] **CLEAN-01**: beste_adj collision with gut's superlative resolved (removed or documented as intentional)
- [ ] **CLEAN-02**: Lieblings- prefix entry correctly handled (removed from adjective bank or re-typed)
- [ ] **CLEAN-03**: Schema `translations` field changed from required to optional (fixes validation for all 108 existing entries)

### Bank Expansion

- [ ] **BANK-01**: Adjectives extracted from Goethe A1/A2/B1 "other" wordlists using attributive test ("ein ___er Mann"), deduplicated against existing 108 entries
- [x] **BANK-02**: New adjective entries added to core bank (`vocabulary/core/de/adjectivebank.json`) with word, _id, audio fields
- [x] **BANK-03**: New adjective entries mirrored to dictionary bank (`vocabulary/dictionary/de/adjectivebank.json`) with curriculum, cefr, frequency metadata
- [x] **BANK-04**: Norwegian (nb) translations provided for all new adjective entries
- [x] **BANK-05**: English (en) translations provided for all new adjective entries

### Schema

- [x] **SCHEMA-01**: Adjective schema extended with `declension` block supporting 3 degrees (positiv/komparativ/superlativ) × 3 article types (stark/schwach/gemischt) × 4 cases × 4 gender/number
- [x] **SCHEMA-02**: `undeclinable` boolean flag added to adjective schema for adjectives that take no endings (lila, rosa, orange, cool)
- [x] **SCHEMA-03**: `nicht_komparierbar` boolean flag added to adjective schema for absolute/non-comparable adjectives
- [x] **SCHEMA-04**: Genitive adjective declension registered as a toggleable grammar feature in grammar-features.json so users can opt out of seeing genitive forms

### Comparison

- [x] **COMP-01**: All comparable adjectives have `comparison.komparativ` populated with correct comparative form/stem
- [x] **COMP-02**: All comparable adjectives have `comparison.superlativ` populated with correct superlative form/stem
- [x] **COMP-03**: Irregular comparatives individually verified (gut/besser/best, viel/mehr/meist, hoch/höher/höchst, nah/näher/nächst, plus all umlaut forms)
- [x] **COMP-04**: Indeclinable adjectives (lila, rosa, orange, cool, gern) flagged with `undeclinable: true`
- [x] **COMP-05**: Non-comparable adjectives flagged with `nicht_komparierbar: true`

### Declension

- [x] **DECL-01**: Positive degree declension tables (stark/schwach/gemischt × 4 cases × 4 gender/number) for all declinable adjectives
- [x] **DECL-02**: Comparative degree declension tables (stark/schwach/gemischt × 4 cases × 4 gender/number) for all comparable adjectives
- [x] **DECL-03**: Superlative degree declension tables for all comparable adjectives
- [x] **DECL-04**: All declension data linguistically correct — irregular stems (hoch→hoh-, dunkel→dunkl-, teuer→teur-) individually verified
- [x] **DECL-05**: Declension data present in both core and dictionary banks (dual-storage pattern)

### Integration

- [x] **INTG-01**: v2 lookup API exposes `declension` field and pushes `grammar_adjective_declension` to grammarFeatures array
- [x] **INTG-02**: Dictionary search index rebuilt with all new adjective entries
- [x] **INTG-03**: Manifests updated with correct entry counts after bank expansion

## v1.x Requirements

Deferred to future release. Tracked but not in current roadmap.

### Declension Extensions

- **DECL-06**: Helper script for bulk declension generation (stem + ending table → full forms)
- **DECL-07**: ajv validation script (`npm run validate:adjectives`) to catch missing/malformed declension cells pre-commit

## Out of Scope

| Feature | Reason |
|---------|--------|
| Programmatic declension generation (rule engine) | German exceptions make rule engines fragile; store explicit forms per v1.0 preteritum precedent |
| Audio for declined forms | Recording ~144 forms per adjective is a production content task, not a data milestone |
| German Perfektum conjugations | Separate feature, out of scope for adjective milestone |
| Spanish/French adjective declension | Not needed for current Leksihjelp use case |
| Noun full case declension tables | Deferred to future milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLEAN-01 | Phase 3 | Pending |
| CLEAN-02 | Phase 3 | Pending |
| CLEAN-03 | Phase 3 | Pending |
| BANK-01 | Phase 4 | Pending |
| BANK-02 | Phase 6 | Complete |
| BANK-03 | Phase 6 | Complete |
| BANK-04 | Phase 9 | Complete |
| BANK-05 | Phase 9 | Complete |
| SCHEMA-01 | Phase 5 | Complete |
| SCHEMA-02 | Phase 5 | Complete |
| SCHEMA-03 | Phase 5 | Complete |
| SCHEMA-04 | Phase 5 | Complete |
| COMP-01 | Phase 7 | Complete |
| COMP-02 | Phase 7 | Complete |
| COMP-03 | Phase 7 | Complete |
| COMP-04 | Phase 7 | Complete |
| COMP-05 | Phase 7 | Complete |
| DECL-01 | Phase 8 | Complete |
| DECL-02 | Phase 8 | Complete |
| DECL-03 | Phase 8 | Complete |
| DECL-04 | Phase 8 | Complete |
| DECL-05 | Phase 8 | Complete |
| INTG-01 | Phase 10 | Complete |
| INTG-02 | Phase 10 | Complete |
| INTG-03 | Phase 10 | Complete |

**Coverage:**
- v1.1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-02-20*
*Last updated: 2026-02-20 — traceability populated after roadmap creation*
