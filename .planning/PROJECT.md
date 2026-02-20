# Papertek Vocabulary API

## What This Is

A vocabulary data repository and REST API serving German, Spanish, and French word data with Norwegian and English translations. Consumed primarily by Leksihjelp, a Chrome extension for Norwegian students learning foreign languages. The API exposes core vocabulary banks (nouns, verbs, adjectives, phrases), grammar features, translation packs, and audio files.

## Core Value

Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form (conjugated verb or declined noun) and return the base entry.

## Current Milestone: v1.1 German Adjective Declension

**Goal:** Expand the German adjective bank and add full declension data so Leksihjelp's inflection search can resolve any declined adjective form to its base entry.

**Target features:**
- Extract adjectives from Goethe "other" wordlist bucket into the adjective bank
- Comparative and superlative stems for all adjectives (including irregular forms)
- Full declension tables: 3 degrees (positive/comparative/superlative) × 3 article types (strong/weak/mixed) × 4 cases × 4 gender/number
- Norwegian and English translations for newly extracted adjectives

## Current State

v1.0 shipped. German noun and verb data complete for inflection search.

- **Data:** 331 German nouns (all with plural/genus), 148 German verbs (all with presens + preteritum), 108 German adjectives (base forms only, no grammar data)
- **Data size:** 9,188 lines JSON across verbbank.json + nounbank.json
- **Adjective gap:** Goethe A1/A2/B1 "other" bucket has ~1,191 words with adjectives not yet extracted
- **API:** `GET /api/vocab/v1/core/german` serves all banks, no code changes needed
- **Deployment:** Vercel, auto-deploys on push to `main`

## Requirements

### Validated

- ✓ REST API serving core vocabulary banks (nouns, verbs, adjectives, phrases) per language — v1.0
- ✓ German nouns all have `plural` field populated (null for uncountable, string for countable) — v1.0 Phase 1
- ✓ German noun entries all have `genus` field (m/f/n) — v1.0 Phase 1
- ✓ Noun `word` fields contain bare word only (no article prefix) — v1.0 Phase 1
- ✓ All 148 German verbs have `preteritum` conjugations with all 6 pronoun forms — v1.0 Phase 2
- ✓ Preteritum data linguistically correct (strong ablaut, modal, separable, reflexive patterns) — v1.0 Phase 2

### Active

- [ ] Adjective bank expanded with entries extracted from Goethe "other" wordlists
- [ ] All German adjectives have comparative and superlative forms (irregular forms correct)
- [ ] Full declension tables for all 3 degrees × 3 article types × 4 cases × 4 gender/number
- [ ] Norwegian and English translations for all new adjective entries
- [ ] Adjective schema updated to support declension data

### Out of Scope

- Perfektum conjugations — preteritum sufficient for inflection search MVP; Perfektum complex (haben/sein auxiliary)
- Spanish/French past tenses — both languages 100% covered for current Leksihjelp needs
- New API endpoints — existing `/api/vocab/v1/core/german` serves all data
- German noun full declension tables (4 cases) — deferred to future milestone

## Context

- **Consumer:** Leksihjelp Chrome extension. Pulls vocab via `GET /api/vocab/v1/core/german`. Indexes `plural` and `conjugations` fields for inflection search. No Leksihjelp code changes needed when data is added.
- **Data format:** German conjugations use object keys (`{ "ich": "war", "du": "warst", ... }`). Spanish/French use arrays.
- **Preteritum patterns:** Strong verbs use ablaut (war, ging, kam), modals tagged `verb_type: "modal"`, separable verbs store separated forms (stand auf), reflexive verbs include pronouns (wusch mich), weak verbs use -te pattern. `preteritum_rare: true` flag marks verbs where Perfekt dominates spoken German.
- **Deployment:** Vercel, auto-deploys on push to `main`.

## Constraints

- **Data accuracy**: German grammar is the constraint — each plural/conjugation must be linguistically correct
- **Format consistency**: Follow existing `verbbank.json` structure exactly (`conjugations.preteritum.former` object with pronoun keys)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------| --------|
| `plural: null` for uncountable nouns | Explicit null distinguishes "no plural" from "not yet filled" | ✓ Good |
| Bare plural forms (no "die" article prefix) | Consistent with majority of existing entries | ✓ Good |
| Preteritum only (not Perfektum) for v1.0 | Inflection search needs verb stem forms; preteritum covers most use cases | ✓ Good — shipped successfully |
| Strong verbs individually looked up (not formulaic) | Ablaut patterns unreliable for automation | ✓ Good — 20 spot-checks pass |
| `preteritum_rare: true` flag for weak verbs | Spoken German prefers Perfekt for most weak verbs; flag enables UI hints | ✓ Good |
| möchten uses wollte forms with note | möchten is Konjunktiv II of mögen, has no independent preteritum | ✓ Good |

---
*Last updated: 2026-02-20 after v1.1 milestone start*
