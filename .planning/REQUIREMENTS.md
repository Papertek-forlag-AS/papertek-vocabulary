# Requirements: Papertek Vocabulary API

**Defined:** 2026-02-22
**Core Value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.

## v1.3 Requirements

Requirements for tech debt cleanup. Each maps to roadmap phases.

### Data Fixes

- [ ] **DATA-01**: morgenmensch_noun has correct `genus` field in dict nounbank
- [ ] **DATA-02**: All 148 core verbbank entries have `type` field (regular/irregular/modal/separable/reflexive)
- [ ] **DATA-03**: All 144 non-verbphrase verbs have presens conjugation (fix 12 missing)
- [ ] **DATA-04**: Core manifest counts (generalbank, nounbank, verbbank) match actual bank entry counts
- [ ] **DATA-05**: 2 nouns with declension-based plural have top-level `plural` field populated
- [ ] **DATA-06**: leute_noun has `genus` field (or documented null for plural-only)

### API Fixes

- [ ] **API-01**: v2 handler uses consistent grammar feature ID (`grammar_presens` not `grammar_present`)
- [ ] **API-02**: v2 handler emits `grammar_adjective_genitive` feature flag for adjective Genitiv data
- [ ] **API-03**: v2 handler surfaces `declension_alternatives` field for entries that have it (teuer_adj)

### Tooling

- [ ] **TOOL-01**: `build-search-index.js` registered as npm script (`npm run build:search-index`)
- [ ] **TOOL-02**: `validate:all` npm script includes all validation scripts (nouns, verbs, dict variants, integration)

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Grammar Expansion

- **GRAM-01**: Konjunktiv II (Subjunctive II) for German verbs
- **GRAM-02**: Futur I for German verbs

### Language Expansion

- **LANG-01**: Spanish past tenses
- **LANG-02**: French past tenses

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Documentation-only fixes (verb count discrepancies, format deviation notes) | No user-facing impact; documentation artifacts only |
| Human linguistic spot-check of all case forms | Advisory; would require native speaker review, not automatable |
| Programmatic declension generation (rule engine) | German exceptions make rule engines fragile; explicit forms stored |
| Audio for declined/conjugated forms | Production content task, not data milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| DATA-04 | — | Pending |
| DATA-05 | — | Pending |
| DATA-06 | — | Pending |
| API-01 | — | Pending |
| API-02 | — | Pending |
| API-03 | — | Pending |
| TOOL-01 | — | Pending |
| TOOL-02 | — | Pending |

**Coverage:**
- v1.3 requirements: 11 total
- Mapped to phases: 0
- Unmapped: 11 ⚠️

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after initial definition*
