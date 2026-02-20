# Feature Research

**Domain:** German adjective declension data for vocabulary API (inflection search)
**Researched:** 2026-02-20
**Confidence:** HIGH (German grammar is stable and well-documented; codebase verified directly)

---

## Feature Landscape

### Table Stakes (Users Expect These)

These features are required for the milestone goal: any declined adjective form resolves to its base entry via Leksihjelp inflection search.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full strong-declension table per adjective | Without an article, the adjective carries all gender/case information. Inflection search needs these 16 endings (4 cases × 4 gender/number) to reverse-map e.g. "großem" → "groß" | HIGH | 16 cells per adjective × 108 adjectives = 1,728 cells. Strong endings closely mirror definite article endings: -er (m.nom), -e (f.nom/n.nom), -es (n/m gen), -em (m/n dat), -en (f gen + all acc except f + pl gen/dat) |
| Full weak-declension table per adjective | After definite articles (der/die/das/die) the adjective uses the "weak" set — only -e and -en endings. Required for "der große Mann" → "groß" | MEDIUM | Only two endings: -e (nom.sg all genders + acc.f + acc.n) and -en (everything else). 16 cells but only 2 distinct values. Lower data entry burden. |
| Full mixed-declension table per adjective | After indefinite articles (ein/eine/ein, kein, possessives) — hybrid of strong and weak. Required for "einem großen Mann" → "groß" | MEDIUM | Nominative sg m and n, and accusative sg n, carry strong endings (to supply the gender information the article omits). All others use -en. 16 cells, 3 distinct values. |
| Comparative stem for all adjectives | Inflection search needs komparativ forms: "schöner", "größer", "besser". The stem (schön-, größ-, bess-) plus declension endings must be searchable. | MEDIUM | 108 existing adjectives need comparative added. Irregular forms (gut→besser, viel→mehr, hoch→höher) must be hand-verified. Most regular adjectives follow stem + -er + declension endings. |
| Superlative stem for all adjectives | Superlative inflected forms: "am schönsten", "schönste", "schönsten". The stem (schönst-) must be stored to enable inflection search. | MEDIUM | Superlative always uses weak or strong declension endings; stem = positiv stem + -(e)st. Irregular: gut→best, viel→meist, hoch→höchst. |
| Adjective extraction from generalbank "other" wordlist | ~487 untyped entries in generalbank contain adjectives mixed with adverbs, prepositions, phrases. Adjectives must be identified and moved to adjectivebank with correct type tag. | MEDIUM | Cannot be automated reliably — adj/adv boundary is porous in German (e.g., "schnell" is both). Manual classification required. Estimated 80–150 genuine adjectives in the untyped pool. |
| Norwegian (nb) and English (en) translations for new adjectives | Leksihjelp shows translations. Every new adjective added to adjectivebank needs both de-nb and de-en translation entries. | MEDIUM | Existing pattern: translation string + optional synonyms + optional examples array. 108 existing adjectives already covered. New ones need new entries. |
| Schema update: `declension` block on adjectiveEntry | The current adjective schema has `comparison` but no `declension` field. The schema must be extended before data can validate. | LOW | Modeled on noun.schema.json `cases` block. Keyed by article type (stark/schwach/gemischt), then case, then gender. grammar-features.json already references `dataPath: "declension"` for `grammar_adjective_declension`. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `undeclinable: true` flag on adjectives that don't decline | Loanword color adjectives (lila, rosa, orange) and a handful of others (prima, klasse, super as adj) take no endings in attributive use. Flagging them prevents the inflection index from expecting declined forms that don't exist. | LOW | Already in bank: lila, rosa, orange. These are genuinely non-declinable as attributive adjectives in standard German. Marking them avoids generating 48 phantom forms. |
| Umlaut flag or stem field for comparative | Several adjectives require umlaut in comparative/superlative: alt→älter, jung→jünger, warm→wärmer, kalt→kälter, groß→größer, kurz→kürzer, lang→länger, stark→stärker, schwach→schwächer, hart→härter, klug→klüger. Storing the modified stem explicitly (rather than deriving it programmatically) prevents silent errors. | LOW | Matches preteritum precedent: strong verb ablaut forms were hand-verified rather than derived. Consistent approach: store explicit forms, not derivation rules. |
| `comparison_note` field for defective adjectives | Some adjectives are not comparable: "tot", "schwanger", "lila" (and similar absolutes). Marking these prevents comparison data being treated as missing rather than absent by design. | LOW | Small set. Similar to `preteritum_rare: true` precedent for verbs. Flag + optional note string. |
| `intro` field on declension block | Progressive disclosure: the Leksihjelp UI shows grammar features by lesson. Storing intro version on the declension block lets adjective endings be unlocked lesson-by-lesson, consistent with how verb tenses are gated. | LOW | grammar-features.json already has `grammar_adjective_declension` feature. Pattern is already established in verbbank (`conjugations.preteritum.intro`). |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Programmatic declension generation (derive all 48 forms from a rule engine) | Seems to save data entry; 108 adjectives × 48 forms = 5,184 cells | German declension has enough exceptions (undeclinable adjectives, adjectives ending in -el/-er losing the e, adjectives ending in a vowel like "prima") that a rule engine requires significant exception handling and testing. Errors are silent and hard to catch. Matches the preteritum precedent: strong verb ablaut was hand-verified rather than derived. | Store explicit forms. Rule engines are fine for documentation; they're fragile for production data quality. |
| Full inflected forms stored (e.g. "großen", "großem") rather than stems + endings | Seems simpler for the consumer; no post-processing needed | A regular adjective × 3 degrees × 3 declension types × 16 cells = 144 full forms. For 108 adjectives that is 15,552 strings. Data balloons 6× with significant redundancy. Maintenance nightmare if a stem needs correction. | Store the stem per degree (positiv, komparativ, superlativ) and the 48-cell ending table per declension type — these are shared across all adjectives and can be a separate reference table. Then the data per adjective is 3 stems (or 1 for non-irregular) + flags. |
| Automated adjective extraction from generalbank via NLP or POS tagging | Seems fast for the ~487 untyped entries | Adj/adv distinction in German is linguistically ambiguous: "schnell", "leicht", "schwer", "tief", etc. function as both. POS tagging without sentence context gives wrong classifications. Also: some entries are clearly not adjectives (phrases, separable verb particles, CEFR-tagged function words) and require case-by-case judgment. | Manual classification with a checklist. 487 entries is a bounded, completable task. Already done for verbs and nouns. |
| Genitive declension data | Completeness | Genitive case is rare in A1/A2 speech and writing. Leksihjelp users are Goethe A1–B1 learners. Genitive declined adjective forms ("des großen Mannes", "eines guten Weines") almost never appear as search inputs at this level. Adding genitive doubles data entry with near-zero search benefit. | Omit genitive for now. The existing noun cases schema also defers genitive (only `akkusativ` and `dativ` features exist in grammar-features.json). Flag for v1.2 if user research shows need. |
| Audio for every declined form | Seems good for pronunciation | Audio files exist only for base adjective forms (e.g., `adjektiv_schoen.mp3`). Recording 144 declined forms per adjective is a production content task completely out of scope for a data milestone. | Keep existing base-form audio. Declined forms inherit the audio of their base entry. |

---

## Feature Dependencies

```
[Adjective schema extension]
    └──required by──> [Declension table data (strong/weak/mixed)]
    └──required by──> [Comparative/superlative stems]

[Adjective extraction from generalbank]
    └──precedes──> [Translations for new adjectives (nb + en)]
    └──precedes──> [Declension data for new adjectives]

[Comparative stem per adjective]
    └──required by──> [Comparative declension table]
        └──derived from──> [Positiv strong-declension table] (same endings, different stem)

[Superlative stem per adjective]
    └──required by──> [Superlative declension table]
        └──derived from──> [Positiv strong-declension table] (same endings, different stem)

[Positiv declension table]
    └──parallel to──> [Comparative declension table]
    └──parallel to──> [Superlative declension table]
    (same 48 endings; only stem differs — enables shared reference table approach)
```

### Dependency Notes

- **Schema extension required first:** No declension or updated comparison data can be committed until `adjective.schema.json` is extended to include the `declension` block. This is a gate for all data work.
- **Extraction precedes translation:** New adjectives cannot get translations until their IDs exist in the adjectivebank. Extraction (identification + ID assignment) must happen before translation authoring.
- **Declension endings are adjective-agnostic:** The 48 endings (3 declension types × 4 cases × 4 gender/number) are the same for every adjective. Only the stem differs. This means a shared `declensionEndingTable` reference (stored once, e.g. in grammar-features.json or a separate reference file) reduces per-adjective data to just 3 stems (positiv, komparativ, superlativ) + special flags. The Leksihjelp consumer can reconstruct full forms by combining stem + ending. This is the recommended approach.
- **Comparison data can ship before full declension:** The `comparison.komparativ` and `comparison.superlativ` fields already exist in the schema. These can be populated (and grammar features unlocked) independently of the declension table work. Separating these allows an incremental delivery.

---

## MVP Definition

### Launch With (v1.1 — this milestone)

- [x] Adjective extraction: classify the ~487 untyped generalbank entries, move genuine adjectives to adjectivebank — **required to expand the bank**
- [x] nb + en translations for all newly extracted adjectives — **required for Leksihjelp display**
- [x] Comparative and superlative forms (stems) for all 108 + new adjectives — **unlocks grammar_comparative and grammar_superlative features**
- [x] Adjective schema extension with `declension` block — **required gate for declension data**
- [x] Declension data: positiv × 3 types (stark/schwach/gemischt) × 4 cases × 4 gender/number for all adjectives — **core milestone goal: inflection search for declined adjective forms**

### Add After Validation (v1.x)

- [ ] Comparative/superlative declension tables — only needed if Leksihjelp inflection search reports user confusion on comparatives. The comparative/superlative stems + regular endings cover most cases. Add full comparative/superlative declined forms if inflection search needs it.
- [ ] `undeclinable: true` flag implementation in Leksihjelp — data flag can be added to schema now, but requires Leksihjelp code change to act on it.
- [ ] Genitive case declension — add when A2/B1 curriculum reaches genitive instruction.

### Future Consideration (v2+)

- [ ] Noun full case declension tables (4 cases for German nouns) — noted as deferred in PROJECT.md; the noun schema already has the `cases` structure.
- [ ] German Perfektum conjugations — noted as out of scope in PROJECT.md.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Adjective extraction from generalbank | HIGH — expands searchable bank | MEDIUM — manual classification of ~487 entries | P1 |
| nb + en translations for new adjectives | HIGH — required for display | MEDIUM — one translation string per adjective | P1 |
| Comparative/superlative stems for all adjectives | HIGH — unlocks comparison search | MEDIUM — 108+N adjectives, ~20 irregular hand-verified | P1 |
| Adjective schema extension (declension block) | HIGH — gate for all declension data | LOW — JSON Schema edit, modeled on noun.schema.json | P1 |
| Positiv declension tables (strong/weak/mixed) | HIGH — core inflection search goal | HIGH — 48 cells per adjective, all adjectives | P1 |
| `undeclinable: true` flag | MEDIUM — prevents phantom index entries | LOW — flag + list of ~5 adjectives | P2 |
| `comparison_note` for defective adjectives | LOW — edge case documentation | LOW — string field | P2 |
| `intro` field on declension block | LOW — enables progressive disclosure | LOW — copy from existing comparison/conjugation pattern | P2 |
| Comparative/superlative declension tables | MEDIUM — full comparative inflection search | HIGH — same cost as positiv declension × 2 | P3 |
| Genitive case declension | LOW — A1/A2 learners rarely encounter genitive adjective forms | HIGH — doubles declension cell count | P3 |

**Priority key:**
- P1: Must have for v1.1 launch
- P2: Should have, add when possible within v1.1
- P3: Nice to have, future milestone

---

## German Adjective Declension: Reference Data

This section documents the actual grammar that the data must implement. Confidence: HIGH — standard German grammar, verified against established teaching materials in training data (Duden, Dreyer-Schmitt, Hammer's German Grammar).

### The 48-Ending Table (shared across all adjectives)

**Strong declension** (no article, or after numerals/indefinite pronouns):

|       | Masc   | Fem    | Neut   | Plural |
|-------|--------|--------|--------|--------|
| Nom   | -er    | -e     | -es    | -e     |
| Acc   | -en    | -e     | -es    | -e     |
| Dat   | -em    | -er    | -em    | -en    |
| Gen   | -en    | -er    | -en    | -er    |

**Weak declension** (after der/die/das/die and all forms of dieser/jener/jeder/welcher):

|       | Masc   | Fem    | Neut   | Plural |
|-------|--------|--------|--------|--------|
| Nom   | -e     | -e     | -e     | -en    |
| Acc   | -en    | -e     | -e     | -en    |
| Dat   | -en    | -en    | -en    | -en    |
| Gen   | -en    | -en    | -en    | -en    |

**Mixed declension** (after ein/eine/ein, kein/keine/kein, possessives mein/dein/sein etc.):

|       | Masc   | Fem    | Neut   | Plural |
|-------|--------|--------|--------|--------|
| Nom   | -er    | -e     | -es    | -en    |
| Acc   | -en    | -e     | -es    | -en    |
| Dat   | -en    | -en    | -en    | -en    |
| Gen   | -en    | -en    | -en    | -en    |

Note: Mixed takes strong endings exactly where the article itself has no ending (ein-, kein- nominative m, nominative n, accusative n). All other cells are weak -en.

### Key Irregular Comparatives/Superlatives in Existing Bank

| Adjective | Komparativ stem | Superlativ stem | Notes |
|-----------|-----------------|-----------------|-------|
| gut | bess- | best- | Completely irregular |
| viel | mehr | meist- | "mehr" is invariable (no endings); "meist-" takes endings |
| hoch | höher- | höchst- | Stem change: hoch→höh- |
| groß | größ- | größt- | Umlaut |
| alt | ält- | ältest- | Umlaut |
| jung | jüng- | jüngst- | Umlaut |
| lang | läng- | längst- | Umlaut |
| kurz | kürz- | kürzest- | Umlaut |
| warm | wärm- | wärmst- | Umlaut |
| kalt | kält- | kältest- | Umlaut |
| stark | stärk- | stärkst- | Umlaut |
| hart | härt- | härtest- | Umlaut |
| nah | näher- | nächst- | Irregular superlative |
| gern | lieber- | liebst- | Comparative/superlative of adverb, not adj ending |

### Adjectives Requiring Special Handling

**Indeclinable (no endings in attributive use):**
- lila, rosa, orange, prima, klasse, super (as adjective)
- These exist in the bank. Flag `"undeclinable": true` — no declension table needed.

**Stem modification before endings:**
- Adjectives ending in -el: dunkel → dunkl- (drops the e before endings: dunkles, dunkler, etc.)
- Adjectives ending in -er after a diphthong: teuer → teuer- (keeps e: teueres → teures in practice, but teurer/teure/teures are all found). Standard practice: store explicit forms.
- Adjectives ending in -e (seltsame pattern): no adjectives in bank currently end in bare -e in their positive form.

**Non-comparable (defective comparison):**
- tot, schwanger, lila, rosa, orange (semantically absolute)
- Adjectives like "ideal", "perfekt" are theoretically non-comparable but comparative forms exist colloquially.

### Generalbank Adjective Extraction: Decision Rules

From the 487 untyped entries, the following decision criteria apply:

1. **Keep in generalbank as-is** (not adjectives): prepositions functioning only as preps (bis, per, pro, trotz, während), separable verb particles (ab, an, auf, aus, ein when written with hyphen like "an-", "ein-"), phrases (phrase entries with spaces that are sentence fragments), proper nouns, interjections (tschüss, hallo).

2. **Move to adjectivebank** (are adjectives): words that function attributively and take declension endings. Indicators: Goethe wordlist labels them as adjective in source material, they can precede a noun with an ending (e.g., "ein billiges Auto"), they appear in standard German adjective lists.

3. **Leave untyped or tag as adv** (pure adverbs): words like "geradeaus", "hinten", "links", "rechts", "vorwärts", "rückwärts", "zusammen" — these are adverbs only and do not take adjectival endings.

4. **Ambiguous adj/adv**: Words like "schnell", "leicht", "schwer", "laut", "lang" function as both. Decision rule: if the word is already in adjectivebank (it is — schnell, lang, leicht etc.), do not duplicate; if it is not in adjectivebank but is a genuine adj, add it.

Rough estimate of genuine new adjectives in the generalbank untyped pool: **60–100** (conservative estimate after excluding particles, phrases, pure adverbs, and words already in adjectivebank).

---

## Competitor Feature Analysis

This is a JSON data API, not a user-facing product. "Competitors" here means existing German grammar data sources that inform what completeness looks like.

| Feature | Wiktionary (German) | dict.cc / PONS | Our Approach |
|---------|---------------------|----------------|--------------|
| Declension tables | Full strong/weak/mixed, all 4 cases, per adjective | Display-only, no API | Store as structured JSON per adjective, keyed by declension type → case → gender |
| Comparative/superlative | Listed on entry page | Listed in search results | Store as `comparison.komparativ` and `comparison.superlativ` per existing schema |
| Irregular forms | Noted explicitly | Noted in search results | Hand-verified for the ~15 irregular adjectives in bank; no rule engine |
| Indeclinable flag | Noted in grammar block | Noted in entry | `undeclinable: true` flag on entry |

---

## Sources

- Codebase verified directly: `vocabulary/core/de/adjectivebank.json` (108 adjectives, 0 with comparison or declension data), `vocabulary/schema/adjective.schema.json`, `vocabulary/grammar-features.json` (`grammar_adjective_declension` feature already registered at `dataPath: "declension"`), `vocabulary/dictionary/de/generalbank.json` (487 untyped entries containing mixed adjectives, adverbs, particles, phrases)
- German adjective declension tables: HIGH confidence — standard descriptive grammar (Duden Grammatik, Dreyer/Schmitt "Lehr- und Übungsbuch der deutschen Grammatik", Hammer's German Grammar). Declension endings have not changed in modern standard German.
- Irregular comparatives/superlatives: HIGH confidence — the set of suppletive/irregular forms in German is small and closed (gut/besser/best, viel/mehr/meist, hoch/höher/höchst, nah/näher/nächst). All others are regular or umlaut-only patterns.
- Indeclinable adjectives list: HIGH confidence — lila/rosa/orange/prima are universally listed as indeclinable in standard references. "klasse" and "super" as predicative adjectives are informal but established.
- `undeclinable` flag and `comparison_note` field: MEDIUM confidence — design decision based on analogy with existing `preteritum_rare: true` pattern, not externally sourced.

---

*Feature research for: German adjective declension (Papertek Vocabulary API v1.1)*
*Researched: 2026-02-20*
