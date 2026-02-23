# Requirements: Papertek Vocabulary API

**Defined:** 2026-02-23
**Core Value:** Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form and return the base entry.

## v2.0 Requirements

Requirements for the Single-Bank Architecture milestone. Eliminates the dual-bank pattern by merging core and dictionary banks into single banks with a core manifest for curriculum filtering.

### Bank Consolidation

- [ ] **BANK-01**: All 8 German core + dictionary bank pairs merged into single bank files under one directory
- [ ] **BANK-02**: Each merged entry contains all fields (grammar data + lexical metadata: curriculum, cefr, frequency, tags)
- [ ] **BANK-03**: Core-only entries that lack dictionary counterparts get default lexical metadata fields
- [ ] **BANK-04**: Dictionary-only entries retain their existing data unchanged
- [ ] **BANK-05**: Search index rebuilt from merged banks
- [ ] **BANK-06**: Old separate core/ and dictionary/ bank directories removed after migration

### Manifest

- [ ] **MNFST-01**: Core manifest file lists entry IDs that are curriculum (replaces implicit "in core bank = curriculum")
- [ ] **MNFST-02**: Manifest includes word count summaries (total, curriculum, dictionary-only) per bank type

### Translation Consolidation

- [ ] **TRANS-01**: de-nb/ and de-nb-dict/ translation files merged into single de-nb/ per bank
- [ ] **TRANS-02**: de-en/ and de-en-dict/ translation files merged into single de-en/ per bank
- [ ] **TRANS-03**: Old -dict/ translation directories removed

### API

- [ ] **API-01**: v1 core handler reads from single bank, filtered by core manifest
- [ ] **API-02**: v1 returns identical response shape (no breaking change for Leksihjelp)
- [ ] **API-03**: v2 search handler reads from rebuilt search index
- [ ] **API-04**: v2 lookup handler reads from single bank
- [ ] **API-05**: v2 lookup translation fallback simplified (single translation dir per pair)

### Validation

- [ ] **VALID-01**: Merged banks pass schema validation (0 errors)
- [ ] **VALID-02**: v1 API returns identical data for curriculum entries before and after migration
- [ ] **VALID-03**: v2 API returns identical data for all entries before and after migration

## Future Requirements

### Bidirectional Dictionaries

- **DICT-01**: German-Norwegian dictionary (de→nb) with full lookup
- **DICT-02**: Norwegian-German dictionary (nb→de) with full lookup
- **DICT-03**: Translation data structured for bidirectional access

### Tooling Updates

- **TOOL-01**: Validators updated to work with single-bank structure
- **TOOL-02**: Build scripts updated for new directory layout

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bidirectional dictionaries (de↔nb) | Future milestone — data structure needs to be stable first |
| Spanish/French bank consolidation | German first; extend pattern to other languages later |
| New vocabulary words | Separate milestone after architecture is settled |
| Validator/tooling updates | Deferred — focus on data + API correctness first |
| New German tenses (Konjunktiv II, Futur I) | Separate milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BANK-01 | Phase 20 | Pending |
| BANK-02 | Phase 20 | Pending |
| BANK-03 | Phase 20 | Pending |
| BANK-04 | Phase 20 | Pending |
| BANK-05 | Phase 20 | Pending |
| BANK-06 | Phase 23 | Pending |
| MNFST-01 | Phase 20 | Pending |
| MNFST-02 | Phase 20 | Pending |
| TRANS-01 | Phase 21 | Pending |
| TRANS-02 | Phase 21 | Pending |
| TRANS-03 | Phase 21 | Pending |
| API-01 | Phase 22 | Pending |
| API-02 | Phase 22 | Pending |
| API-03 | Phase 22 | Pending |
| API-04 | Phase 22 | Pending |
| API-05 | Phase 22 | Pending |
| VALID-01 | Phase 23 | Pending |
| VALID-02 | Phase 23 | Pending |
| VALID-03 | Phase 23 | Pending |

**Coverage:**
- v2.0 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 after roadmap creation (phases 20-23)*
