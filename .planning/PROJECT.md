# Papertek Vocabulary API

## What This Is

A vocabulary data repository and REST API serving German, Spanish, and French word data with Norwegian and English translations. Consumed primarily by Leksihjelp, a Chrome extension for Norwegian students learning foreign languages. The API exposes core vocabulary banks (nouns, verbs, adjectives, phrases), grammar features, translation packs, and audio files.

## Core Value

Complete, correct vocabulary data so Leksihjelp's inflection search can find any German word form (conjugated verb or declined noun) and return the base entry.

## Current Milestone: v1.0 — German Data Completeness

**Goal:** Fill all German data gaps (noun plurals, verb preteritum) that block Leksihjelp's inflection search feature.

**Target features:**
- All German nouns have `plural` field (null for uncountable, string for countable)
- All German verbs have `preteritum` conjugations alongside existing `presens`

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ REST API serving core vocabulary banks (nouns, verbs, adjectives, phrases) per language — v1.0 Phase 1
- ✓ German nouns all have `plural` field populated — v1.0 Phase 1

### Active

- [ ] All 148 German verbs have `preteritum` conjugations in `verbbank.json`

### Out of Scope

- Perfektum conjugations — deferred to future milestone (preteritum sufficient for inflection search MVP)
- Spanish/French past tenses — these languages are 100% covered for current Leksihjelp needs
- New API endpoints — existing `/api/vocab/v1/core/german` already serves the data

## Context

- **Consumer:** Leksihjelp Chrome extension. Pulls vocab via `GET /api/vocab/v1/core/german`. Indexes `plural` and `conjugations` fields for inflection search. No Leksihjelp code changes needed when data is added.
- **Data format:** German conjugations use object keys (`{ "ich": "war", "du": "warst", ... }`). Spanish/French use arrays.
- **Deployment:** Vercel, auto-deploys on push to `main`.
- **Gap audit:** `papertek-vocab-gaps.md` documents the full gap analysis.

## Constraints

- **Data accuracy**: German grammar is the constraint — each plural/conjugation must be linguistically correct
- **Format consistency**: Follow existing `verbbank.json` structure exactly (`conjugations.preteritum.former` object with pronoun keys)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------| --------|
| `plural: null` for uncountable nouns | Explicit null distinguishes "no plural" from "not yet filled" | ✓ Good |
| Bare plural forms (no "die" article prefix) | Consistent with majority of existing entries | ✓ Good |
| Preteritum only (not Perfektum) for v1.0 | Inflection search needs verb stem forms; preteritum covers most use cases | — Pending |

---
*Last updated: 2026-02-20 after v1.0 milestone start*
