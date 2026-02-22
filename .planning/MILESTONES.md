# Milestones

## v1.0 — German Data Completeness (Shipped: 2026-02-20)

**Phases:** 2 | **Plans:** 1 (Phase 1 pre-GSD) | **Tasks:** 2
**Git range:** a3f2398 → 15aef56
**Data files:** 9,188 lines JSON (verbbank.json + nounbank.json)

**Key accomplishments:**
- All 29 German nouns with missing plurals patched (null for uncountable, correct forms for countable)
- All German noun entries have genus (m/f/n) and clean word fields (no article prefixes)
- All 148 German verbs now have preteritum conjugations with correct ablaut forms
- Modal verbs tagged with `verb_type: "modal"` and correct preteritum
- Separable prefix verbs store separated forms; reflexive verbs include pronouns
- Leksihjelp inflection search can now match German past-tense verb forms

**Requirements:** 5/5 satisfied (NOUN-01, NOUN-02, NOUN-03, VERB-01, VERB-02)

**Known tech debt:**
- 2 nouns with declension-based plural but no top-level `plural` field (product decision)
- 1 plural-only noun (leute_noun) without `genus` field (linguistically no gender)

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

**Last phase number:** 2

---

## v1.1 — German Adjective Declension (Shipped: 2026-02-22)

**Phases:** 8 (3-10) | **Plans:** 8 | **Commits:** 60
**Git range:** feat(03-bank-cleanup) → feat(10-01)
**Data files:** 158,712 lines JSON across 4 adjective bank files
**Lines changed:** +198,795 / -4,452 across 90 files
**Timeline:** 3 days (2026-02-20 → 2026-02-22)

**Key accomplishments:**
- Cleaned adjective bank: removed beste_adj collision, reclassified Lieblings- prefix, fixed schema validation (106 entries clean)
- Extracted 259 adjective candidates from Goethe A1/A2/B1 wordlists, expanding bank from 106 to 365 entries
- Extended adjective schema with full declension support (3 degrees x 3 article types x 4 cases x 4 gender/number)
- Generated comparison data (komparativ/superlativ) for all 352 comparable adjectives with irregular forms individually verified
- Produced ~39,800 declension cells for 360 declinable adjectives with correct irregular stems (hoh-, dunkl-, teur-, flexibl-)
- Added rich Norwegian and English translations for all 365 adjectives with false-friend warnings and alternative meanings

**Requirements:** 25/25 satisfied (CLEAN-01..03, BANK-01..05, SCHEMA-01..04, COMP-01..05, DECL-01..05, INTG-01..03)

**Known tech debt:**
- Core manifest generalbank.json count stale by 1 (185 vs 186) after Lieblings- reclassification
- Core manifest nounbank.json/verbbank.json counts pre-existing stale (not introduced by this milestone)
- declension_alternatives field (teuer_adj only) not surfaced by v2 API

**Archive:** `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`

**Last phase number:** 10

---


## v1.2 — German Perfektum & Noun Declension (Shipped: 2026-02-22)

**Phases:** 5 (11-15) | **Plans:** 8 | **Commits:** 40
**Git range:** feat(11-01) → docs(phase-15)
**Net change:** +95,504 / -7,125 across 54 files
**Vocabulary data:** 308,989 lines JSON (total across core + dict banks)
**Timeline:** 8 days (2026-02-14 → 2026-02-22)

**Key accomplishments:**
- Extended verb and noun JSON schemas with Perfektum and declension fields (additive, zero breakage on existing data)
- Flagged 17 inseparable prefix verbs and 11 n-Deklination nouns; resolved preteritum dict bank sync gap (148 verbs)
- Added Perfektum conjugations for all 144 non-verbphrase verbs (past participle, auxiliary selection, 6-pronoun forms, dual-auxiliary + modal annotations)
- Added complete 4-case declension for all 331 nouns (Nominativ/Akkusativ/Dativ/Genitiv x singular/plural x definite/indefinite articles)
- Synced all v1.2 data to dictionary banks, updated v2 handler with grammar_noun_declension and grammar_genitiv feature flags
- Rebuilt search index with pp (past participle) field on all 144 verb entries for inflection lookup
- Achieved 0-error AJV validation across all 4 banks (fixed 547 pre-existing errors); created permanent verify:integration script (28 checks)

**Requirements:** 27/27 satisfied (SCHEMA-01..05, AUDIT-01..03, PERF-01..07, NDECL-01..07, SYNC-01..05)

**Known tech debt (11 items, all non-critical):**
- AUDIT-01 verb count discrepancy (20 vs 17 confirmed) — documentation only
- morgenmensch_noun missing genus in dict nounbank — pre-existing
- 72/148 core verbbank entries missing `type` field — pre-existing
- grammar_present vs grammar_presens ID mismatch — pre-existing
- 12 non-verbphrase verbs lack presens conjugation — pre-existing
- CONTEXT.md format deviation for noun declension (combined strings) — intentional, documented
- Human linguistic spot-check recommended for case forms — advisory
- build-search-index.js not registered as npm script — discoverability
- validate:all doesn't include new validation scripts — discoverability
- grammar_adjective_genitive not emitted by v2 handler — pre-existing (v1.1)
- PERF/AUDIT verb count ambiguity in REQUIREMENTS.md (148 vs 144) — documentation only

**Archive:** `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.2-REQUIREMENTS.md`, `.planning/milestones/v1.2-MILESTONE-AUDIT.md`

**Last phase number:** 15

---

