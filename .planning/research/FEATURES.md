# Feature Research

**Domain:** German Perfektum conjugations and noun case declension for vocabulary API (inflection search)
**Researched:** 2026-02-22
**Confidence:** HIGH (German grammar is stable and well-documented; codebase structure verified directly)

---

## Feature Landscape

### Table Stakes (Users Expect These)

These features are required for the milestone goal: Leksihjelp inflection search can resolve any German Perfektum verb form or any declined noun form to its base entry.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Past participle (Partizip II) per verb | The Perfektum tense is formed as [aux] + Partizip II. "hat gemacht", "ist gegangen" — the participle is the lexically searchable form. Without it, inflection search cannot match Perfektum occurrences. | MEDIUM | 148 verbs. Strong verbs: ge- + ablaut stem + -en (geschrieben, gefahren). Weak verbs: ge- + stem + -t (gemacht, gelernt). Mixed: ge- + ablaut stem + -t (gebracht, gewusst). Separable: prefix + ge- + stem (aufgemacht, angekommen). Inseparable prefix (be-, ver-, ent-, er-, ge-, zer-): no ge- added (besucht, verstanden, erklärt). |
| Auxiliary selection (haben vs sein) per verb | Every Perfektum conjugation requires the correct auxiliary. Wrong auxiliary is a grammatical error, not a style choice. Must be stored explicitly per verb — cannot be derived reliably from verb type alone. | MEDIUM | Most verbs take haben. Sein verbs: motion from A to B (gehen, kommen, fahren, fliegen, laufen, schwimmen, reisen, wandern, springen, laufen), change of state (aufwachen, einschlafen, aufstehen, werden), and sein/bleiben/werden themselves. A definitive per-verb flag is needed. |
| Full Perfektum conjugation table (6 pronouns) | "ich habe gemacht, du hast gemacht, er/sie/es hat gemacht, wir haben gemacht, ihr habt gemacht, sie/Sie haben gemacht". All 6 forms must be stored to match any first- or second-person inflected Perfektum form in a text. | MEDIUM | The 6 conjugated forms are [aux_conjugated] + [Partizip II]. The auxiliary (haben/sein) is already fully conjugated in the bank. The participle is the only new piece per verb. The 6-pronoun table can be stored as: `{ "ich": "habe gemacht", "du": "hast gemacht", ... }` — same structure as presens/preteritum. |
| Noun case declension: Nominativ (4 article forms) | Nom is the base form but article variation matters for search. "der Mann / ein Mann / die Frau / eine Frau" — all 4 gender/article combinations are expected for a complete Nominativ block. This is the starting case and must come first. | LOW | Already partially covered: 223 nouns have `cases.nominativ` with `bestemt` and `ubestemt`. Extension needed: add to the remaining 108 nouns, and confirm singular/plural coverage. |
| Noun case declension: Akkusativ (definite + indefinite, singular + plural) | Direct object form. "den Mann / einen Mann / die Männer". Required for inflection search of accusative nouns. 186 nouns already have partial akkusativ data. | LOW-MEDIUM | Extension task: 145 nouns missing akkusativ. Masculine changes article: der→den, ein→einen. Feminine and neuter: no article change in accusative. Plural: no change from nominative. |
| Noun case declension: Dativ (definite + indefinite, singular + plural) | Indirect object form. "dem Mann / einem Mann / den Männern". Dative plural adds -n to all plurals not ending in -n or -s. grammar-features.json already has `grammar_dative` registered. | MEDIUM | No dative data exists yet (grammar_dative feature registered but no data in bank). Dative singular: dem/einem (m/n), der/einer (f). Dative plural: always den + plural-form-with-n-suffix. N-declension masculine nouns (der Elefant, der Löwe, der Hase, der Affe, der Neffe) take -(e)n ending on the noun in all non-nominative cases. |
| Noun case declension: Genitiv (definite + indefinite, singular + plural) | Possessive/relational form. "des Mannes / eines Mannes / der Männer". Required for complete case coverage. No grammar feature registered yet — requires feature registration. | HIGH | Genitive is the most irregular case. Masculine and neuter: des + noun + -(e)s (des Mannes, des Kindes). Feminine: der/einer (no noun ending). Plural: der (no noun ending). N-declension nouns: des Elefanten (not des Elefantes). A few nouns have genitive -(e)ns: der Name → des Namens. Data entry burden is highest of all cases. |
| Search index expansion: past participles indexed | The search index (3,454 entries) enables inflection search. Past participles (gemacht, gegangen, gefahren) must be added as index entries pointing to the base verb entry. Without this, Perfektum inflection search fails even if the data exists in the verbbank. | MEDIUM | Currently 679 verb entries in the index (base forms only). Each verb adds 1 participle form. Separable participles (aufgemacht, angekommen) are the only distinct-looking forms — inseparable participles often look like the preteritum stem. |
| Search index expansion: declined noun forms indexed | Declined noun forms (dem Mann, den Männern) must be indexed to resolve to the base noun entry. Without index entries, the case data exists in the bank but search cannot find it. | HIGH | Currently 1,641 noun entries in the index (base forms). Full declension adds up to 16 forms per noun (4 cases × 2 numbers × definite/indefinite — stripped of articles since search index stores bare word). In practice, many case forms are identical to base form. Only genuinely distinct forms need index entries. Estimate: 2–6 new index entries per noun, totaling ~600–1,800 new entries. |
| Dual-bank sync: verbbank + nounbank in both core and dictionary | All data changes must cascade to both `vocabulary/core/de/` and `vocabulary/dictionary/de/` banks. This is the established pattern from all prior milestones. Breaking this breaks the v2 API. | LOW | Mechanical copy task. Risk: forgetting one bank. Mitigation: commit both banks atomically. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dual-auxiliary flag (`dual_auxiliary: true`) per verb | Some verbs take either haben or sein depending on transitivity and meaning: fahren (hat das Auto gefahren / ist nach Berlin gefahren), schwimmen (hat geschwommen / ist ans Ufer geschwommen), fliegen, laufen, springen. Flagging these explicitly lets Leksihjelp show an explanation rather than presenting one auxiliary as definitive. | LOW | Approximately 5 verbs in the bank qualify: fahren, schwimmen, fliegen, laufen, springen. The flag plus a brief `auxiliary_note` string (e.g., "transitive: haben; motion direction: sein") is sufficient. Matches the `preteritum_rare: true` precedent for optional explanatory flags. |
| `auxiliary_note` field for dual-auxiliary verbs | Explains when each auxiliary applies. Enables Leksihjelp to surface a grammatical hint when displaying dual-auxiliary verbs in exercises. | LOW | Free-text string. Small set (5 verbs). Does not affect search index. |
| Participle in search index with back-reference to base verb | The search index entry for a participle (e.g., `"w": "gemacht"`) should point back to the base verb (_id: machen_verb). Enables Leksihjelp to display the full entry when a user looks up a Perfektum form. | LOW | Already the established pattern: the index `id` field references the source bank entry. The participle entry would be a new index entry with a type annotation so Leksihjelp knows it is an inflected form, not a lemma. |
| N-declension flag per noun (`n_declension: true`) | Marks the ~10 nouns in the bank that follow weak masculine declension (der Elefant → den Elefanten, dem Elefanten, des Elefanten). Without this flag, the consumer cannot know the noun takes -(e)n instead of standard accusative/dative/genitive endings. | LOW | Bank contains: Elefant, Löwe, Affe, Hase, Neffe, and possibly Mensch (check individually). Flag prevents incorrect accusative/dative derivation. |
| Grammar feature registration for `grammar_perfektum` | Already registered in grammar-features.json with `dataPath: "conjugations.perfektum"`. No new registration needed — the feature exists and is ready for data to populate it. | NONE | Verify feature is in correct state. No schema or feature file changes required. |
| Grammar feature registration for `grammar_noun_declension` | A unified feature flag for full 4-case noun declension (beyond the individual case flags already in grammar-features.json). Lets Leksihjelp unlock full case paradigm view when the data is complete. | LOW | grammar-features.json has individual case features (grammar_accusative_indefinite, grammar_accusative_definite, grammar_dative) but no unified `grammar_noun_declension` feature. Register one with `dataPath: "cases"`. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Programmatic participle generation (rule engine) | Seems to save data entry — most weak verbs follow ge- + stem + -t | German has enough exceptions that a rule engine produces silent errors. Inseparable prefixes (be-, ver-, ge-, ent-, er-, zer-, miss-) suppress ge-. Separable prefixes insert ge- between prefix and stem. Mixed verbs (bringen→gebracht, wissen→gewusst, kennen→gekannt) are irregular. Strong verbs have unpredictable ablaut (sehen→gesehen, gehen→gegangen, stehen→gestanden). The rule engine passes for 80% of verbs and silently fails on 20%. | Store explicit participles per verb. Matches the preteritum precedent: strong verb ablaut was hand-verified. 148 participles is a bounded, completable task. |
| Programmatic case declension generation | Seems to save data entry for nouns | German noun declension has multiple irregular patterns: N-declension masculines (add -(e)n in all non-nominative forms), nouns with genitive -es vs -s (des Mannes vs des Autos), nouns where dative plural cannot be derived from the stored plural form (plural "Männer" → dative plural "Männern", but plural "Autos" → dative plural "Autos"), uncountable nouns (no plural forms). A rule engine requires exception tables as large as the data itself. | Store explicit forms. 331 nouns × reduced cell count (only distinct forms, not redundant ones) is manageable. Matches adjective precedent. |
| Storing full article + noun in every cell | "den Mann", "dem Mann", "des Mannes" — storing the full string seems consumer-friendly | Doubles storage. Articles are derivable from genus + case, which the bank already has. The noun form (whether it changes) is the only new information. Storing "den Mann" when "der Mann" is already stored and the article change is rule-based wastes space and makes corrections require touching multiple cells. | Store the bare noun form per case (with or without the -(e)n/-(e)s suffix). Articles are computed from genus + case. Same pattern used in the existing `cases.nominativ.bestemt: "der Vater"` — actually the existing data does store full strings. Maintain this pattern for consistency with existing 223 nominativ entries. |
| Perfektum for verb phrases ("Rad fahren", "Gassi gehen") | Seems like completeness | Verb phrases are pedagogical constructs. Their Perfektum ("ist Rad gefahren", "ist Gassi gegangen") is rarely the focus of inflection search. The constituent verb (fahren, gehen) already covers the search need. Adding Perfektum to 4 verbphrase entries creates data that won't be searched. | Exclude verbphrases from Perfektum. If Leksihjelp needs it for display, add as a v1.2+ enhancement after verifying user need. |
| Perfektum for modal verbs | Modals do have Perfektum (hat gekonnt, hat gemüsst) | Modal Perfektum with a dependent infinitive uses the "double infinitive" construction (hätte kommen können, nicht hat gekonnt — this is the Ersatzinfinitiv rule). The simple modal Perfektum (hat gekonnt, hat gewollt) exists but is rare and contextually specific. Leksihjelp A1/A2 learners won't search for modal participles. | Exclude modals from Perfektum unless there is specific evidence of user need. |
| Genitive without nominative + accusative + dative | Completeness argument | Genitive is taught last and is least common in A1/A2 speech. Building all 4 cases simultaneously is the highest data-entry cost item. If genitive is built but nominative/accusative/dative are incomplete, the feature is unusable. Parallelism is false economy. | Build cases incrementally: nominative (partially done) → accusative → dative → genitive. Each case unlocks its own grammar feature. Users get value from each step. |
| Search index storing full article + noun form ("den Mann") | Seems to improve search matching | Search query from Leksihjelp is the word the user clicked on in text. It will be the bare noun form without article ("Mann"), or at most the article + noun as it appears in running text. The index stores bare word forms (field `w`). Articles are not searchable units because they are shared across all nouns. Storing "den Mann" as an index entry provides zero additional matching power. | Index stores bare declined noun form ("Mannes" for genitive, "Männern" for dative plural) when the form differs from nominative. The base nominativ singular form is already in the index. |

---

## Feature Dependencies

```
[Perfektum data in verbbank]
    └──requires──> [Participle per verb (new field)]
    └──requires──> [Auxiliary selection per verb (haben/sein flag)]
    └──requires──> [Dual-auxiliary flag (optional differentiator)]
    └──enables──> [Search index: participle entries]
                      └──enables──> [Leksihjelp inflection search for Perfektum]

[Noun case data in nounbank]
    └──extends──> [Existing cases.nominativ (223 nouns partial)]
    └──extends──> [Existing cases.akkusativ (186 nouns partial)]
    └──adds──> [cases.dativ (0 nouns currently)]
    └──adds──> [cases.genitiv (0 nouns currently)]
    └──enables──> [Search index: declined noun form entries]
                      └──enables──> [Leksihjelp inflection search for declined nouns]

[Grammar feature: grammar_perfektum]
    └──already registered in grammar-features.json]
    └──requires──> [Perfektum data populated in verbbank]

[Grammar feature: grammar_dative]
    └──already registered in grammar-features.json]
    └──requires──> [cases.dativ data populated in nounbank]

[Grammar feature: grammar_noun_declension (unified)]
    └──needs registration in grammar-features.json]
    └──requires──> [All 4 cases populated for all nouns]

[Dual-bank sync]
    └──required by──> All data changes (verbbank + nounbank)
    └──affects──> [core/de/verbbank.json] + [dictionary/de/verbbank.json]
    └──affects──> [core/de/nounbank.json] + [dictionary/de/nounbank.json]

[Search index rebuild]
    └──requires──> [All verbbank perfektum data final]
    └──requires──> [All nounbank case data final]
    └──produces──> [dictionary/de/search-index.json]
```

### Dependency Notes

- **Participle before conjugation table:** The Perfektum table is mechanically [aux_conjugated] + [participle]. The participle must be stored first. The 6-pronoun conjugation table can be derived (and verified) once the participle and auxiliary are known, but storing explicit forms in the `former` object is the established pattern.
- **Auxiliary flag before index:** The search index entry for a participle must know whether to point to a haben-aux or sein-aux Perfektum. This is for display, not search — but the auxiliary should be determined before finalizing index entries.
- **Verb Perfektum is independent of noun declension:** The two feature tracks (verb Perfektum and noun declension) share no data dependencies. They can be built in parallel phases or sequentially in any order.
- **Nominativ extension before other cases:** The nominativ block structure is already established (223 nouns). Extending nominativ to all 331 nouns is the natural first case step and validates the data pattern before moving to the harder cases.
- **Dative plural rule requires stored plural form:** Dative plural is the stored plural with -n appended (if it doesn't already end in -n or -s). The plural field already exists for 306 of 331 nouns. The 25 uncountable nouns (plural: null) have no dative plural — they only have singular dative.
- **Schema changes:** The existing `noun.schema.json` already has `cases` and `caseEntry` definitions. The existing `verb.schema.json` supports additional tenses in `conjugations` via `additionalProperties`. No schema changes are required — both structures are already valid schema-wise.

---

## MVP Definition

### This Milestone (v1.2)

**Verb Perfektum:**
- [ ] Past participle (Partizip II) for all 148 verbs — stored in `conjugations.perfektum.former` alongside the 6-pronoun conjugation table
- [ ] Auxiliary selection (haben/sein) per verb — stored as a flag on the perfektum conjugation block, e.g. `"auxiliary": "haben"` or `"auxiliary": "sein"`
- [ ] Dual-auxiliary flag for ~5 verbs (fahren, schwimmen, fliegen, laufen, springen) — stored as `"dual_auxiliary": true` with `"auxiliary_note"` string
- [ ] Search index expansion: past participle forms added as index entries
- [ ] Dual-bank sync: both core and dictionary verbbanks updated

**Noun Declension:**
- [ ] Nominativ: complete for all 331 nouns (223 already have partial data; extend to remaining 108)
- [ ] Akkusativ: complete for all 331 nouns (186 already have partial data; extend to remaining 145)
- [ ] Dativ: all 331 nouns (0 currently; new data for all)
- [ ] Genitiv: all 331 nouns (0 currently; new data for all)
- [ ] Singular and plural forms for each case (where applicable; uncountable nouns: singular only)
- [ ] Definite (bestemt) and indefinite (ubestemt) article forms per case
- [ ] Search index expansion: distinct declined noun forms added as index entries
- [ ] Dual-bank sync: both core and dictionary nounbanks updated

### Add After Validation (v1.2+)

- [ ] Verb Perfektum for verbphrases — add if Leksihjelp reports user confusion when Perfektum form of "Rad fahren" is not found in search
- [ ] Modal Perfektum — add if curriculum reaches modal Perfektum instruction
- [ ] `grammar_noun_declension` unified feature registration — register after all 4 cases are confirmed complete

### Future Consideration (v2+)

- [ ] Additional noun forms: comparative/superlative for adjective-derived nouns, Deklination after prepositions (requires preposition data)
- [ ] Subjunctive II (Konjunktiv II) for verbs — hätte, wäre, könnte forms; high learner value but separate milestone
- [ ] Futur I verb forms (wird machen) — required for B1+ learners

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Perfektum participle per verb | HIGH — enables Perfektum inflection search | MEDIUM — 148 verbs, ~20 strong verbs need careful lookup | P1 |
| Auxiliary selection per verb | HIGH — required for correct Perfektum display | LOW — flag per verb, ~30 sein-verbs, rest haben | P1 |
| Noun nominativ (complete all 331) | HIGH — gate for full case paradigm | LOW — 108 nouns missing, pattern is established | P1 |
| Noun akkusativ (complete all 331) | HIGH — most common non-nominative case in A1/A2 | LOW-MEDIUM — 145 nouns missing, rules are simple | P1 |
| Noun dativ (all 331) | HIGH — required for `grammar_dative` feature | MEDIUM — new data for all nouns; dative plural requires care | P1 |
| Search index: participles | HIGH — without this, Perfektum data is unfindable | MEDIUM — new index entries for 148 participle forms | P1 |
| Search index: declined noun forms | HIGH — without this, case data is unfindable | HIGH — potentially 600–1,800 new entries; deduplication needed | P1 |
| Dual-bank sync | HIGH — breaking this breaks v2 API | LOW — mechanical copy; well-established pattern | P1 |
| Noun genitiv (all 331) | MEDIUM — genitive is A2/B1 content | HIGH — most irregular case, highest data entry burden | P2 |
| Dual-auxiliary flag (fahren etc.) | MEDIUM — prevents ambiguity for 5 verbs | LOW — flag + note string for ~5 verbs | P2 |
| N-declension flag per noun | MEDIUM — prevents incorrect inflection for 10 nouns | LOW — flag only | P2 |
| `grammar_noun_declension` feature registration | LOW — display feature | LOW — JSON edit to grammar-features.json | P3 |
| Verbphrase Perfektum | LOW — rarely searched | LOW-MEDIUM — 4 entries | P3 |
| Modal Perfektum | LOW — advanced grammar | LOW — 7 entries | P3 |

**Priority key:**
- P1: Must have for v1.2 to deliver its stated goal
- P2: Should have; significantly improves data quality
- P3: Nice to have; future consideration

---

## German Grammar Reference: Perfektum

This section documents the grammar that drives the data requirements. Confidence: HIGH.

### Past Participle Formation

**Weak verbs** (regular): ge- + stem + -t
- machen → gemacht, lernen → gelernt, spielen → gespielt
- Exception: verbs ending in -ieren get no ge-: interessieren → interessiert, dekorieren → dekoriert

**Strong verbs** (irregular): ge- + (often changed) stem + -en
- fahren → gefahren, schreiben → geschrieben, sehen → gesehen, gehen → gegangen
- Ablaut must be hand-looked-up per verb — no reliable rule

**Mixed verbs** (weak endings + ablaut): ge- + changed stem + -t
- bringen → gebracht, wissen → gewusst, kennen → gekannt

**Separable prefix verbs**: prefix + ge- + stem + ending
- aufstehen → aufgestanden, einschlafen → eingeschlafen, anrufen → angerufen, mitnehmen → mitgenommen

**Inseparable prefix verbs** (be-, ver-, ge-, ent-, er-, zer-, miss-): NO ge- added
- besuchen → besucht, verstehen → verstanden, erklären → erklärt, vergessen → vergessen

**Verbs ending in -ieren**: NO ge- added (regardless of prefix)
- interessieren → interessiert, rasieren → rasiert, dekorieren → dekoriert

### Auxiliary Selection Rules

**Haben (most verbs):**
- All transitive verbs (those that can take an accusative object)
- All reflexive verbs: sich freuen → hat sich gefreut, sich duschen → hat sich geduscht
- Most verbs of activity: arbeiten, spielen, lernen, schlafen, sitzen, stehen, liegen (standard German)

**Sein (verbs of motion/change):**
- Clear change of location (motion from A to B): gehen, kommen, fahren, fliegen, laufen, schwimmen (when directional), reisen, wandern, springen (when directional)
- Change of state: werden, aufwachen, einschlafen, aufstehen
- The verbs sein and bleiben themselves

**Dual auxiliary (haben or sein depending on usage):**
- fahren: ist nach Berlin gefahren (motion) / hat das Auto gefahren (transitive)
- schwimmen: ist ans Ufer geschwommen (directional) / hat zwei Stunden geschwommen (activity)
- fliegen: ist nach Oslo geflogen (motion) / hat das Flugzeug geflogen (transitive)
- laufen: ist zum Bahnhof gelaufen (directional) / hat eine Stunde gelaufen (activity)
- springen: ist über den Zaun gesprungen (motion) / hat gesungen (activity, rare)

### Perfektum Conjugation Pattern

Structure: [present tense of aux] + [Partizip II (invariable)]

With haben:
- ich habe gemacht, du hast gemacht, er/sie/es hat gemacht
- wir haben gemacht, ihr habt gemacht, sie/Sie haben gemacht

With sein:
- ich bin gegangen, du bist gegangen, er/sie/es ist gegangen
- wir sind gegangen, ihr seid gegangen, sie/Sie sind gegangen

The participle never changes form (it is invariable in the Perfektum construction).

---

## German Grammar Reference: Noun Case Declension

Confidence: HIGH.

### Article Changes by Case and Gender

**Definite article (bestimmer Artikel):**

|            | Maskulin | Feminin | Neutrum | Plural |
|------------|----------|---------|---------|--------|
| Nominativ  | der      | die     | das     | die    |
| Akkusativ  | den      | die     | das     | die    |
| Dativ      | dem      | der     | dem     | den    |
| Genitiv    | des      | der     | des     | der    |

**Indefinite article (unbestimmter Artikel):**

|            | Maskulin | Feminin | Neutrum | Plural  |
|------------|----------|---------|---------|---------|
| Nominativ  | ein      | eine    | ein     | —       |
| Akkusativ  | einen    | eine    | ein     | —       |
| Dativ      | einem    | einer   | einem   | —       |
| Genitiv    | eines    | einer   | eines   | —       |

Note: No indefinite article in plural. The "ubestemt" plural form stores the bare noun plural (e.g., "Männer", "Kinder").

### Noun Ending Changes by Case

**Standard declension:**
- Nominativ: bare word form (der Mann, die Frau, das Kind)
- Akkusativ: masculine changes only (den Mann); feminine and neuter unchanged (die Frau, das Kind)
- Dativ singular: no noun ending change (exceptions: a handful of old-style -e endings: dem Manne, dem Hause — archaic, not needed)
- Dativ plural: add -n to the plural form (den Männern, den Kindern) — UNLESS the plural already ends in -n (den Frauen stays den Frauen) or -s (den Autos stays den Autos)
- Genitiv masculine/neuter: add -(e)s to singular (des Mannes, des Kindes, des Autos)
- Genitiv feminine: no ending change (der Frau, der Mutter)
- Genitiv plural: no ending change (der Männer, der Frauen)

**N-declension (weak masculine nouns):**
Nouns in this group: der Elefant, der Löwe, der Affe, der Hase, der Neffe (all in bank). These take -(e)n in all non-nominative cases, singular AND plural.
- Nominativ sg: der Elefant — all other cases: den/dem/des Elefanten
- Plural: die Elefanten — all cases: den/dem/der Elefanten

**Special genitiv -ns forms (mixed declension):**
Only for: der Name → des Namens, der Buchstabe → des Buchstabens, etc. None of these specific nouns appear to be in the current nounbank — verify during data entry.

### Edge Cases in the Current Noun Bank

- **25 uncountable nouns (plural: null):** Only singular declension applies. No plural nominativ, akkusativ, dativ, genitiv.
- **2 plural-only nouns (genus: pl):** leute_noun and eltern_noun. Only plural forms apply. Nominativ already handled. These nouns have no singular forms.
- **1 noun with genus: none:** Likely a data issue to resolve during declension work.
- **N-declension candidates in bank:** Elefant (m), Löwe (m), Affe (m), Hase (m), Neffe (m) — all masculine. Käse (m) does NOT take N-declension (des Käses, not des Käsens). Verify each candidate individually.
- **Monat (m):** des Monats — standard strong declension, not N-declension despite -at ending.

---

## Competitor Feature Analysis

This is a JSON data API. "Competitors" are existing German grammar data sources.

| Feature | Wiktionary (German) | PONS / dict.cc | Our Approach |
|---------|---------------------|----------------|--------------|
| Perfektum conjugation | Full 6-pronoun table with auxiliary | Listed per verb entry | Store 6-pronoun table in `conjugations.perfektum.former` per established pattern |
| Auxiliary selection | Listed explicitly per verb | Listed per entry | Store `"auxiliary": "haben"/"sein"` on the perfektum conjugation block |
| Past participle | Listed explicitly per verb | Listed in search results | Store as one of the 6 conjugation forms (e.g. "er/sie/es": "hat gemacht") — participle is implicit |
| Noun case tables | Full 4-case table per noun | Display-only | Store in `cases` object per established schema: nominativ/akkusativ/dativ/genitiv with bestemt/ubestemt sub-keys |
| N-declension marking | Grammar category listed | Grammar note | `n_declension: true` flag per noun entry |

---

## Sources

- Codebase verified directly (2026-02-22): `vocabulary/core/de/verbbank.json` (148 verbs, 0 with perfektum), `vocabulary/core/de/nounbank.json` (331 nouns: 223 nominativ, 186 akkusativ, 0 dativ, 0 genitiv), `vocabulary/schema/verb.schema.json` (tenseConjugation supports additionalProperties), `vocabulary/schema/noun.schema.json` (cases/caseEntry structure already defined), `vocabulary/grammar-features.json` (grammar_perfektum, grammar_dative, grammar_accusative_* already registered), `vocabulary/dictionary/verb-classification-de.json` (auxiliary patterns implicit in existing classification)
- German Perfektum auxiliary rules: HIGH confidence — standard descriptive grammar. haben/sein selection is a closed set of rules. Dual-auxiliary verbs are a well-documented small group.
- Participle formation rules: HIGH confidence — standard German grammar. The ge- suppression for inseparable prefixes and -ieren verbs, and the ge- insertion for separable verbs, are universal rules with no exceptions.
- N-declension noun list: HIGH confidence — the category is well-defined; identification of specific nouns in the bank requires per-noun verification.
- Noun case article tables: HIGH confidence — German article declension has been stable for over a century and is universally agreed upon across all grammar references.
- Dative plural -n rule: HIGH confidence — stated consistently across all German grammar references: "Wunderbla" (gymglish.com), deutsch.lingolia.com, wisc.pb.unizin.org.
- Dual-auxiliary verbs (fahren, schwimmen, etc.): HIGH confidence — consistently documented across multiple sources including deutsch.lingolia.com and e-sprachlingua.com.

---

*Feature research for: German Perfektum conjugations and noun case declension (Papertek Vocabulary API v1.2)*
*Researched: 2026-02-22*
