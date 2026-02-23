# Papertek Vocabulary API

## What This Is

A vocabulary data repository and REST API serving German, Spanish, and French word data with Norwegian and English translations. Consumed primarily by Leksihjelp, a Chrome extension for Norwegian students learning foreign languages. The API exposes core vocabulary banks (nouns, verbs, adjectives, phrases), grammar features, translation packs, and audio files. German data includes full verb conjugations (presens, preteritum, Perfektum), adjective declension tables, and noun 4-case declension — enabling inflection search for any German word form. All data fields, grammar feature IDs, and tooling are consistent and validated.

## Core Value

Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form (conjugated verb, declined noun, or declined adjective) and return the base entry.

## Current Milestone: v2.0 Single-Bank Architecture

**Goal:** Eliminate the dual-bank pattern by merging core and dictionary banks into a single bank per word class, with a core manifest to filter curriculum entries.

**Target features:**
- Review current API handlers and data flow
- Merge core + dictionary bank files (nouns, verbs, adjectives) into single banks with all fields
- Create core manifest listing curriculum entry IDs
- Update API handlers (v1 filters by manifest, v2 reads full bank)
- Validation passes on new structure

## Current State

v1.3 shipped. All tech debt from v1.0-v1.2 resolved. Data, API, tooling, and documentation are consistent.

- **Data:** 331 German nouns (4-case declension + plural/genus), 148 German verbs (presens + preteritum + Perfektum, all typed), 365 German adjectives (full declension + comparison data)
- **Verb types:** All 148 verbs classified (53 regular, 40 irregular, 26 reflexive, 18 separable, 7 modal, 4 verbphrase)
- **Noun declension:** 331 nouns with Nominativ/Akkusativ/Dativ/Genitiv x singular/plural x definite/indefinite articles; n-Deklination, plural-only, and uncountable nouns handled
- **Adjective data:** 158,712 lines JSON across 4 adjective bank files; ~39,800 declension cells covering 360 declinable adjectives
- **Search index:** 3,454+ entries with pp (past participle) field on verb entries
- **Validation:** `npm run validate:all` chains 6 validators (nouns, verbs, adjectives, dict nouns, dict verbs, integration) — all 0-error; `npm run build:search-index` registered
- **API:** v1 (`GET /api/vocab/v1/core/german`) + v2 lookup with grammar_presens, grammar_preteritum, grammar_perfektum, grammar_noun_declension, grammar_genitiv, grammar_adjective_declension, grammar_adjective_genitive, declensionAlternatives
- **Grammar IDs:** Consistent `grammar_presens` across handler, grammar-features.json, curriculum manifest, and API README
- **Deployment:** Vercel, auto-deploys on push to `main`

## Requirements

### Validated

- ✓ REST API serving core vocabulary banks (nouns, verbs, adjectives, phrases) per language — v1.0
- ✓ German nouns all have `plural` field populated (null for uncountable, string for countable) — v1.0
- ✓ German noun entries all have `genus` field (m/f/n) — v1.0
- ✓ Noun `word` fields contain bare word only (no article prefix) — v1.0
- ✓ All 148 German verbs have `preteritum` conjugations with all 6 pronoun forms — v1.0
- ✓ Preteritum data linguistically correct (strong ablaut, modal, separable, reflexive patterns) — v1.0
- ✓ Adjective bank expanded from 106 to 365 entries (259 extracted from Goethe A1/A2/B1) — v1.1
- ✓ All comparable adjectives have comparative and superlative forms (irregular forms individually verified) — v1.1
- ✓ Full declension tables for all declinable adjectives (3 degrees x 3 article types x 4 cases x 4 gender/number) — v1.1
- ✓ Norwegian and English translations for all 365 adjective entries — v1.1
- ✓ Adjective schema extended with declension block, undeclinable/nicht_komparierbar flags — v1.1
- ✓ v2 API exposes declension field and grammar_adjective_declension feature — v1.1
- ✓ Search index rebuilt with all adjective entries (3,454 total) — v1.1
- ✓ Verb/noun schemas extended with Perfektum and declension fields (additive, zero breakage) — v1.2
- ✓ 17 inseparable prefix verbs flagged, 11 n-Deklination nouns flagged — v1.2
- ✓ All 144 verbs have Perfektum conjugations (participle, auxiliary, 6-pronoun forms) — v1.2
- ✓ Dual-auxiliary and modal verb annotations (auxiliary_note, modal_note) — v1.2
- ✓ All 331 nouns have 4-case declension with definite/indefinite articles — v1.2
- ✓ n-Deklination, plural-only, uncountable noun patterns handled correctly — v1.2
- ✓ Perfektum and noun declension synced to dictionary banks — v1.2
- ✓ Search index rebuilt with pp field for past-participle inflection lookup — v1.2
- ✓ v2 handler emits grammar_noun_declension and grammar_genitiv feature flags — v1.2
- ✓ Schema validation 0 errors across all 4 banks (547 pre-existing errors fixed) — v1.2
- ✓ All noun/verb data fields complete (genus, plural, type, presens conjugations, manifest counts) — v1.3
- ✓ v2 API uses consistent grammar_presens ID, emits grammar_adjective_genitive, surfaces declensionAlternatives — v1.3
- ✓ All scripts registered in package.json, validate:all covers full validation suite — v1.3
- ✓ Curriculum manifest and API README use consistent grammar_presens IDs — v1.3

### Active

- [ ] Merge core + dictionary banks into single bank per word class
- [ ] Create core manifest for curriculum entry filtering
- [ ] Update v1 API handler to read single bank + manifest filter
- [ ] Update v2 API handler to read single bank (all entries)
- [ ] Validation passes on new single-bank structure

### Out of Scope

- Spanish/French past tenses — both languages 100% covered for current Leksihjelp needs
- Programmatic declension generation (rule engine) — German exceptions make rule engines fragile; explicit forms stored
- Audio for declined/conjugated forms — production content task, not data milestone
- Verbphrase Perfektum — inflection search for phrases not supported; add only if users report confusion
- Konjunktiv II (Subjunctive II) — separate B1+ milestone
- Futur I — separate milestone

## Context

- **Consumer:** Leksihjelp Chrome extension. Pulls vocab via v1 API. Indexes `plural`, `conjugations`, `comparison`, `declension`, and `cases` fields for inflection search.
- **Data format:** German conjugations use object keys (`{ "ich": "war", "du": "warst", ... }`). Adjective declension uses nested structure: `declension.positiv.stark.nominativ.maskulin`. Noun declension uses `cases.nominativ.forms.singular.definite`. Spanish/French use arrays.
- **Dual-bank pattern:** Data stored in both core bank (v1 API / Leksihjelp) and dictionary bank (v2 API) — identical content, different metadata wrappers.
- **Deployment:** Vercel, auto-deploys on push to `main`. CDN s-maxage=86400 means up to 24h cache lag.
- **Validation tooling:** `npm run validate:all` chains 6 validators with fail-fast (&&). `npm run build:search-index` registered. `scripts/fix-manifest-counts.js` available as health check.

## Constraints

- **Data accuracy**: German grammar is the constraint — each declension/conjugation/plural must be linguistically correct
- **Format consistency**: Follow established bank structures — adjective declension follows `articleBlock` pattern, noun declension follows `cases.{case}.forms.{number}.{article}` pattern, comparison follows `comparison` object
- **Dual-bank sync**: All data changes must cascade to both core and dictionary banks plus translations and search index

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `plural: null` for uncountable nouns | Explicit null distinguishes "no plural" from "not yet filled" | ✓ Good |
| Bare plural forms (no "die" article prefix) | Consistent with majority of existing entries | ✓ Good |
| Preteritum only (not Perfektum) for v1.0 | Inflection search needs verb stem forms; preteritum covers most use cases | ✓ Good |
| Strong verbs individually looked up (not formulaic) | Ablaut patterns unreliable for automation | ✓ Good |
| `preteritum_rare: true` flag for weak verbs | Spoken German prefers Perfekt for most weak verbs; flag enables UI hints | ✓ Good |
| Store explicit declension forms (not rule engine) | German exceptions make rule engines fragile; mirrors preteritum precedent | ✓ Good — 39,800 adj cells + 331 noun entries |
| Dual-bank storage for declension data | Core bank for v1/Leksihjelp, dictionary bank for v2 API — same data, different wrappers | ✓ Good |
| Superlativ stores only `schwach` declension | Grammatically correct — superlatives require definite article | ✓ Good |
| `declension_alternatives` entry-level key for teuer_adj | Duden-accepted variant forms; `additionalProperties:false` on declension block prevents inline alternatives | ✓ Good |
| Sort bank entries by `_id` (ASCII) not `word` | Deterministic, locale-independent ordering | ✓ Good |
| Frequency-0 for 11 words missing from de_50k.txt | Placeholder; can be backfilled later | — Pending |
| Additive noun cases (singular/plural sub-objects) | Never replace existing flat bestemt/ubestemt — avoids migration of 223 entries | ✓ Good — v1.2 |
| Combined article+noun declension strings | `"der Hund"` instead of separate article/noun fields — matches display needs | ✓ Good — v1.2 |
| 17 inseparable verbs (not 20 as estimated) | geben/gehen/gewinnen have ge- as stem, not prefix — linguistically correct | ✓ Good — v1.2 |
| sich_vorbereiten participle: "vorbereitet" | Exception to separable ge-insertion; bereiten-base behaves as root in Partizip II | ✓ Good — v1.2 |
| Explicit Perfektum storage (no rule engine) | Mirrors preteritum and adjective declension precedent — 144 verbs fully stored | ✓ Good — v1.2 |
| `genus:"pl"` for leute_noun (plural-only) | Schema enum only allows string values; matches eltern_noun/ferien_noun convention | ✓ Good — v1.3 |
| Verb type priority: reflexive > separable > modal > irregular > regular | Single primary type, secondary traits in tags array | ✓ Good — v1.3 |
| German grammar_presens (not grammar_present) | Aligns with German-native naming (grammar_preteritum, grammar_perfektum) | ✓ Good — v1.3 |
| validate:all fail-fast with && chaining | Stop on first error; core banks before dict variants before integration | ✓ Good — v1.3 |

---
*Last updated: 2026-02-23 after v2.0 milestone started*
