# Requirements: Papertek Vocabulary API

**Defined:** 2026-02-20
**Core Value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.

## v1.0 Requirements

Requirements for the German Data Completeness milestone.

### Noun Data

- [x] **NOUN-01**: All German nouns in `nounbank.json` have a `plural` field (string for countable, null for uncountable/plural-only)
- [x] **NOUN-02**: All German noun entries have a `genus` field (m/f/n)
- [x] **NOUN-03**: `word` fields contain only the bare word (no article prefix like "das Haustier")

### Verb Data

- [ ] **VERB-01**: All 148 German verbs in `verbbank.json` have `conjugations.preteritum.former` with all 6 pronoun forms (ich/du/er-sie-es/wir/ihr/sie-Sie)
- [ ] **VERB-02**: Preteritum data is linguistically correct German (strong/weak/irregular verbs handled correctly)

## v2 Requirements

Deferred to future milestone.

### Verb Data (Extended)

- **VERB-03**: German verbs have `conjugations.perfektum` (Perfektum tense)
- **VERB-04**: Spanish verbs have `preterito` conjugations
- **VERB-05**: French verbs have passé composé conjugations

### Noun Data (Extended)

- **NOUN-04**: German nouns have full declension tables (all 4 cases)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Perfektum conjugations | Preteritum sufficient for inflection search MVP; Perfektum is complex (haben/sein auxiliary depends on verb class) |
| New API endpoints | Existing `/api/vocab/v1/core/german` already serves all data Leksihjelp needs |
| Spanish/French past tenses | Both languages 100% covered for current Leksihjelp requirements |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NOUN-01 | Phase 1 | Complete |
| NOUN-02 | Phase 1 | Complete |
| NOUN-03 | Phase 1 | Complete |
| VERB-01 | Phase 2 | Pending |
| VERB-02 | Phase 2 | Pending |

**Coverage:**
- v1.0 requirements: 5 total
- Mapped to phases: 5
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-20*
*Last updated: 2026-02-20 after Phase 1 completion*
