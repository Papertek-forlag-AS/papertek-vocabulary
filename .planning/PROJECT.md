# Papertek Vocabulary API

## What This Is

A vocabulary data repository and REST API serving German, Spanish, and French word data with Norwegian and English translations. Consumed primarily by Leksihjelp, a Chrome extension for Norwegian students learning foreign languages. The API exposes core vocabulary banks (nouns, verbs, adjectives, phrases), grammar features, translation packs, and audio files. German adjectives include full declension tables enabling inflection search for any declined form.

## Core Value

Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form (conjugated verb, declined noun, or declined adjective) and return the base entry.

## Current State

v1.1 shipped. German noun, verb, and adjective data complete for inflection search.

- **Data:** 331 German nouns (all with plural/genus), 148 German verbs (presens + preteritum), 365 German adjectives (full declension + comparison data)
- **Adjective data:** 158,712 lines JSON across 4 adjective bank files; ~39,800 declension cells covering 360 declinable adjectives
- **Translations:** Norwegian and English translations for all 365 adjectives with rich format (explanation, synonyms, examples, false-friend warnings)
- **Search index:** 3,454 total entries (rebuilt with all adjective data)
- **API:** v1 (`GET /api/vocab/v1/core/german`) + v2 lookup with `declension` field and `grammar_adjective_declension` feature
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

### Active

(None — define with `/gsd:new-milestone`)

### Out of Scope

- Perfektum conjugations — preteritum sufficient for inflection search; Perfektum complex (haben/sein auxiliary)
- Spanish/French past tenses — both languages 100% covered for current Leksihjelp needs
- German noun full declension tables (4 cases) — deferred to future milestone
- Programmatic declension generation (rule engine) — German exceptions make rule engines fragile; explicit forms stored
- Audio for declined forms — recording ~144 forms per adjective is a production content task

## Context

- **Consumer:** Leksihjelp Chrome extension. Pulls vocab via v1 API. Indexes `plural`, `conjugations`, `comparison`, and `declension` fields for inflection search.
- **Data format:** German conjugations use object keys (`{ "ich": "war", "du": "warst", ... }`). Declension uses nested structure: `declension.positiv.stark.nominativ.maskulin`. Spanish/French use arrays.
- **Dual-bank pattern:** Data stored in both core bank (v1 API / Leksihjelp) and dictionary bank (v2 API) — identical content, different metadata wrappers.
- **Deployment:** Vercel, auto-deploys on push to `main`. CDN s-maxage=86400 means up to 24h cache lag.

## Constraints

- **Data accuracy**: German grammar is the constraint — each declension/conjugation/plural must be linguistically correct
- **Format consistency**: Follow established bank structures — adjective declension follows `articleBlock` pattern, comparison follows `comparison` object
- **Dual-bank sync**: All data changes must cascade to both core and dictionary banks plus translations and search index

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `plural: null` for uncountable nouns | Explicit null distinguishes "no plural" from "not yet filled" | ✓ Good |
| Bare plural forms (no "die" article prefix) | Consistent with majority of existing entries | ✓ Good |
| Preteritum only (not Perfektum) for v1.0 | Inflection search needs verb stem forms; preteritum covers most use cases | ✓ Good |
| Strong verbs individually looked up (not formulaic) | Ablaut patterns unreliable for automation | ✓ Good |
| `preteritum_rare: true` flag for weak verbs | Spoken German prefers Perfekt for most weak verbs; flag enables UI hints | ✓ Good |
| Store explicit declension forms (not rule engine) | German exceptions make rule engines fragile; mirrors preteritum precedent | ✓ Good — 39,800 cells generated, all verified |
| Dual-bank storage for declension data | Core bank for v1/Leksihjelp, dictionary bank for v2 API — same data, different wrappers | ✓ Good |
| Superlativ stores only `schwach` declension | Grammatically correct — superlatives require definite article | ✓ Good |
| `declension_alternatives` entry-level key for teuer_adj | Duden-accepted variant forms; `additionalProperties:false` on declension block prevents inline alternatives | ✓ Good |
| Sort bank entries by `_id` (ASCII) not `word` | Deterministic, locale-independent ordering | ✓ Good |
| Frequency-0 for 11 words missing from de_50k.txt | Placeholder; can be backfilled later | — Pending |

---
*Last updated: 2026-02-22 after v1.1 milestone completion*
