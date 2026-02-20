# Pitfalls Research

**Domain:** Adding German adjective declension to an existing vocabulary API
**Researched:** 2026-02-20
**Confidence:** HIGH — based on direct codebase analysis + German grammar expertise

---

## Critical Pitfalls

### Pitfall 1: Treating "hoch" Like a Normal Adjective

**What goes wrong:**
"hoch" changes its stem to "hoh-" before any inflectional ending. The positive base form is "hoch" (predicative only), but every attributed form drops the final -ch: "hoher", "hohe", "hohes", "hohem", "hohen". Scripts that build declension by appending endings to the base form will generate "hochem", "hochen", "hochem" — all wrong.

**Why it happens:**
Automated declension generation appends endings to the stored `word` field. "hoch" → "hoch" + "em" = "hochem" (wrong). Nothing in the current schema flags stem changes. Leksihjelp searches for "hohem" and finds nothing; students get no result.

**How to avoid:**
Store the attributive stem separately from the base form. For "hoch": base `word: "hoch"`, attributive stem `"attributiv_stem": "hoh"`. All declined forms are built from the attributive stem, not the base. This is the same architectural decision that was made correctly for separable verbs (storing "stand auf" not "aufstand") — apply the same principle here.

**Warning signs:**
- Any verification script that checks "does declined form contain the base form as substring" will pass for "hoher/hohe/hohes" but silently fail the Leksihjelp search
- Spot-check: search for "hohem" in computed forms — if result is "hochem" the stem-change was missed

**Phase to address:**
Schema definition phase — before any data entry. "hoch" must be the first test case for any declension generation approach.

---

### Pitfall 2: Indeclinable Adjectives Given Declension Endings

**What goes wrong:**
"lila", "rosa", "orange", and "cool" are already in the adjective bank and are indeclinable — they never take endings regardless of gender, case, or number. "ein lila Auto", "eine lila Blume", "einem lila Kleid" — the form is always "lila". Adding a declension table that generates "lilas", "lilem", "lilen" creates wrong forms that Leksihjelp would incorrectly index as search targets.

**Why it happens:**
All four words exist in the bank with no flags. A script iterating over all 108 adjectives to add declension will treat them identically unless they are explicitly flagged. There is currently no `indeclinable: true` or equivalent field in the schema.

**How to avoid:**
Add an `indeclinable: true` boolean to the adjective schema and to these four entries before running any declension generation. The declension generation script must skip entries with this flag. Verify by checking that none of "lilas", "lila", "lilem" etc. are generated as indexed forms.

**Warning signs:**
- Any declined search form ending in "-s", "-m", "-n", "-r" matching "lila", "rosa", "orange" or "cool" is a sign indeclinable handling is broken
- Leksihjelp returning "lila" for searches on "lilas" (grammatically impossible form) would be a false result

**Phase to address:**
Schema extension phase — add `indeclinable` flag to schema and mark these 4 entries before data population.

---

### Pitfall 3: Suppletive Comparatives Computed from Base Stem

**What goes wrong:**
Three adjectives in the bank have irregular (suppletive) comparatives that share no stem with the positive form:
- gut → **besser** → best- (not *guter, *gutst-)
- viel → **mehr** → meist- (not *vieler, *vielst-)
- gern → **lieber** → liebst- (not *gerner, *gernst-)

Any algorithmic approach to comparative formation (base + "-er", base + "-st") produces wrong forms for these three. Students searching "besser" find nothing, or "mehr" incorrectly maps to a wrong base.

**Why it happens:**
The v1.0 preteritum milestone successfully avoided this by looking up each verb individually. The same discipline is needed here. But for adjectives it's tempting to apply the simple "+er"/"+st" formula since it works for 95+ of 108 adjectives, and the three exceptions might be overlooked.

**How to avoid:**
The same strategy that worked for preteritum: process irregular adjectives first, verify suppletive forms individually. Maintain a required spot-check list that includes gut/besser, viel/mehr, and gern/lieber as mandatory validation cases (analogous to the v1.0 spot-check table for sein/war, gehen/ging).

**Warning signs:**
- Verification script shows "guter", "gutest" as comparative/superlative of "gut" — immediate fail
- "mehr" not resolving to "viel" in inflection search
- Structural check passes but linguistic spot-check fails for these three words

**Phase to address:**
Data entry phase — list gut, viel, and gern as "handle first, verify individually" before processing regular adjectives.

---

### Pitfall 4: Confusing Positive Masculine Strong with the Comparative Base

**What goes wrong:**
For regular adjectives, the comparative base form (uninflected) is identical to the positive Nominativ Masculine Strong form:
- klein: positive NomM strong = "kleiner", comparative base = "kleiner"
- schön: positive NomM strong = "schöner", comparative base = "schöner"

If Leksihjelp indexes all surface forms, a search for "kleiner" becomes ambiguous — it could mean "klein (Nom Masc)" or "kleiner (comparative base)". Both are correct German, but the system may return only one.

**Why it happens:**
German grammar intentionally creates this overlap. It is not a data error — both readings are valid. The problem is that the data storage format doesn't preserve which reading was intended, and Leksihjelp (which indexes surface forms to base entries) will have a collision.

**How to avoid:**
Store the comparative as a stem (e.g., `"komparativ": "kleiner"` meaning the stem, not the full inflected form). In the data, the comparative stem "kleiner" maps to the base "klein". The positive NomM strong form "kleiner" also maps to base "klein". The disambiguation is that both return the same base entry, so the collision is harmless — the user still gets "klein". Document this explicitly so future maintainers don't try to "fix" it.

**Warning signs:**
- Attempting to store comparative inflected forms that are identical to positive forms and then flagging collisions as errors
- Misidentifying "kleiner" as "only comparative" when it is also positive NomM strong

**Phase to address:**
Schema design phase — define whether comparative is stored as stem or as inflected form, and document the overlap explicitly.

---

### Pitfall 5: Extracting False Adjectives from the "Other" Bucket

**What goes wrong:**
The Goethe "other" bucket (1,191 entries) contains many word types mixed together: prepositions (an, auf, aus), conjunctions (aber, auch, dann), pronouns (er, es, euer), pure adverbs (manchmal, einmal, hoffentlich, bald, hier, geradeaus), phrases ("Alles Gute!", "Auf Wiedersehen."), prefixes/suffixes (all-, ein-, -her), and parser artifacts ("deindenn", "gern(e)", "(Kredit)-Karte, -n"). Incorrectly classifying any of these as adjectives would add wrong entries to the adjective bank.

**Why it happens:**
Many true adjectives share endings with adverbs and particles. German adjectives like "schnell", "langsam", "gut" can function as both adjectives and adverbs — but "manchmal", "einmal", "geradeaus", "bald" are adverbs-only and would be wrong to add as adjectives. Automated extraction by suffix matching alone would catch false positives.

**How to avoid:**
Human classification with a defined criterion: a word belongs in the adjective bank only if it can be used attributively (before a noun with agreement). Test: "ein ___er Mann" or "eine ___e Frau". Words that fail this test (allein, manchmal, einmal, geradeaus, bald) are not adjectives. Additionally, filter out entries with spaces, punctuation, trailing periods, and parentheses before classification. Words ending in "-" are prefixes, not adjectives.

**Warning signs:**
- The extracted adjective count exceeds ~80-100 genuinely new adjectives (the bucket contains ~150-200 likely real adjectives, not 400+)
- Entries like "manchmal", "immer", "bald", "auch", "aber" appearing in the adjective bank
- Any word with parentheses, spaces, or punctuation in the adjective bank

**Phase to address:**
Adjective extraction phase — apply the "ein ___er Mann" test for every candidate, with a manual review of all extracted entries before they are added to adjectivebank.json.

---

### Pitfall 6: "-el" and "-er" Adjectives with Incorrect Stem Elision

**What goes wrong:**
Five adjectives in the existing bank end in "-el" or "-er" and must drop the stem-final "-e" before adding inflectional endings:
- teuer → teure (not *teuere); teures (not *teueres); teurer (comparative, different from positive NomM)
- sauber → saubere, sauberes, sauberem... (actually regular — sauber doesn't elide)
- lecker → leckere, leckeres... (regular)
- sicher → sichere, sicheres... (regular)
- viel → (special case, see suppletive pitfall above)

The specific rule: adjectives ending in "-er" with the "-e" as part of a syllable (like "teuer" /teu-er/) drop that "-e" when an ending is added. "teuer" + "-e" → "teure" (not "teuere"). But "lecker", "sauber", "sicher" keep their vowel because the "-er" suffix is not the same pattern — they decline regularly.

**Why it happens:**
The rule applies only to adjectives where the syllable preceding "-er" has a diphthong or the "-e" is a schwa that would create an awkward cluster. "teuer" (diphthong eu + er) → drops the e. "sauber", "lecker", "sicher" decline regularly. Without knowing which "-er" adjectives elide and which don't, a script gets some wrong.

**How to avoid:**
Mark "teuer" with `"stem_elision": true` in the data. The declension for teuer must store "teure" (not "teuere") as the Nominativ Feminine Strong form. Verify by spot-checking: "ein teure_ Laptop" → "teurer" (NomM), "eine teure Uhr" (NomF), "ein teures Auto" (NomN) — the "-e-" elision is visible in comparison. For comparative: "teurer" (base comparative) — same form as NomM positive, which is intentional overlap (see Pitfall 4).

**Warning signs:**
- "teuere" appearing as any declined form of teuer
- Checking the NomF form of teuer: should be "teure", not "teuere"

**Phase to address:**
Data entry phase — teuer must be included in the irregular/special-case group processed before regular adjectives.

---

### Pitfall 7: Participial Adjectives Given Comparative Forms They Lack

**What goes wrong:**
Eight past-participial adjectives exist in the bank: überrascht, gespannt, erschöpft, gestresst, entspannt, aufgeregt, bewölkt, anstrengend (present participle). If the data entry adds a comparative/superlative to all 108 adjectives without exception, it will generate "überraschter" and "am überraschsten" — forms that exist marginally if at all in standard German, and that Leksihjelp might then incorrectly index as search targets.

**Why it happens:**
A blanket "add comparative/superlative to every adjective" approach ignores the grammatical category. Past participles used as adjectives typically do not form comparatives (you cannot be "more surprised" in German using "überraschter" in standard written German — you use "stärker überrascht"). The present participle "anstrengend" is different — it can form comparatives (anstrengender, am anstrengendsten).

**How to avoid:**
Add a `nicht_komparierbar: true` flag for adjectives where comparison is not standard. Apply to: überrascht, gespannt, bewölkt. Leave erschöpft, entspannt, aufgeregt, gestresst, anstrengend without the flag — their comparatives are accepted in modern German. The declension table for nicht_komparierbar entries covers positive degree only.

**Warning signs:**
- "überraschter" or "am gespannsten" appearing as indexed forms
- Verification accepting the positive-comparative-superlative structure for all 108 without checking the nicht_komparierbar flag

**Phase to address:**
Schema design phase — add `nicht_komparierbar` flag. Data entry phase — apply it to the 3 unambiguous cases before running the main comparative generation.

---

### Pitfall 8: "beste" as a Separate Entry Colliding with gut's Superlative

**What goes wrong:**
"beste" (the superlative of "gut") is stored as a separate entry in adjectivebank.json with `_id: "beste_adj"`. When declension data is added to "gut", its superlative stem is "best-", generating forms: beste, bester, bestes, bestem, besten. These forms will now appear twice in any index that Leksihjelp builds: once under "gut" (from its superlative), and once as a direct match to "beste_adj".

**Why it happens:**
"beste" was likely added as a standalone vocabulary entry ("best", as in "das Beste" = the best thing) before the adjective declension system was designed. At that time, there was no `comparison` field to express "gut's superlative is best-". Now that "gut" will have a full comparison field, the "beste_adj" entry is an orphan.

**How to avoid:**
Before adding declension data to "gut", decide whether "beste_adj" stays as a separate entry or is removed. If it stays, it needs a clear semantic justification (it may be referenced in curriculum manifests). Run a curriculum manifest check first: grep all curriculum JSON files for "beste_adj" — if it appears in lessons, it stays and the disambiguation is documented. If it doesn't appear, remove it to avoid search index duplication.

**Warning signs:**
- "beste_adj" appearing in curriculum JSON files (check before removing)
- Leksihjelp returning two different base entries for the word "beste"

**Phase to address:**
Pre-data-entry cleanup phase — audit "beste_adj" and curriculum references before writing any comparison data.

---

### Pitfall 9: Schema Validation Mismatch — "translations" Required but Missing on All 108 Entries

**What goes wrong:**
The adjective schema declares `"required": ["translations"]`, but all 108 existing adjective entries have no "translations" field. Schema validation would fail for every existing entry if it were actually enforced. Adding the new `declension` or `comparison` field while running schema validation would surface 108 errors immediately, blocking any automated pipeline that validates against the schema.

**Why it happens:**
The schema was defined aspirationally (what adjective entries should have), but the actual data was loaded before translations were populated. This gap has existed since before v1.0. It was not a blocker for v1.0 because noun/verb schemas were the focus. Now that adjective data is being actively extended, any CI/schema-validation step will fail on existing data.

**How to avoid:**
Either (a) remove `"translations"` from the schema's required array (making it optional), (b) add `"translations": {}` to all 108 entries as placeholder before validation runs, or (c) skip schema validation for the adjective bank until translations are populated. Decide the approach before writing a verification script that calls `ajv` or similar on adjectivebank.json. Do not let schema validation failures block data entry progress.

**Warning signs:**
- Any automated verification script using JSON Schema validation that flags 108 errors on adjective entries with no other issues
- Interpreting "schema validation fails" as "data is corrupt" when the schema is aspirational

**Phase to address:**
Schema definition phase — update the schema to match reality (translations as optional) before writing any verification scripts.

---

### Pitfall 10: Goethe "Other" Bucket Duplicates Adding Already-Present Adjectives

**What goes wrong:**
262 of the 1,191 "other" bucket entries appear across multiple CEFR levels (e.g., "alt" appears in A1, A2, and B1). Several adjectives already in the bank also appear in the "other" bucket: "alt", "groß", "gut", "schnell", "langsam", "warm", "kalt", "jung", "stark", and others. Extracting adjectives from the bucket without checking against the existing bank will attempt to add duplicate entries, causing either a collision (duplicate _id) or a silent overwrite.

**Why it happens:**
The extraction script treats the 1,191 entries as a fresh source without cross-referencing the 108 entries already in the bank. The Goethe wordlists were parsed without deduplication, so "alt" appears three times in the combined other bucket.

**How to avoid:**
The extraction script must first build a set of all existing adjective bank word values (case-insensitive), then filter every candidate: only add it if the lowercased word is NOT already in the bank. Also deduplicate within the extracted candidates themselves (262 duplicates cross-CEFR). This is a straightforward pre-filter but it must be explicit in the plan.

**Warning signs:**
- Extracted candidate count exceeds ~100 unique words (the bucket has duplicates)
- "alt", "gut", "warm" appearing in the list of "new" adjectives to add

**Phase to address:**
Adjective extraction phase — deduplication is step 1 before any classification.

---

### Pitfall 11: "gern" Cannot Be Declined Attributively — But Is in the Adjective Bank

**What goes wrong:**
"gern" (gladly/willingly) is stored in the adjective bank but is primarily an adverb. It cannot be used attributively: "ein gernes Buch" is ungrammatical. If the data entry adds a declension table to "gern", it will generate "ein gernes Buch", "einem gernen Kind" — all wrong. The suppletive comparative "lieber" and superlative "am liebsten" are adverbial forms only ("ich esse lieber Reis" not "*ein lieberes Essen").

**Why it happens:**
"gern" behaves like an adjective in the sense that it can appear predicatively ("das ist mir gern") and has suppletive comparison forms. It was classified as an adjective in the bank, which is defensible for pedagogical purposes. But adding a full declension table crosses into grammatically wrong territory.

**How to avoid:**
Mark "gern" with `indeclinable: true` (same flag as lila/rosa/orange) — this is the most conservative approach. Alternatively, give it only a comparison field (gern → lieber → liebst-) with a note that declension is not applicable. Do not generate any declined forms for "gern".

**Warning signs:**
- "gernem", "gerner", "gernes" appearing as indexed forms of "gern"
- Declension table generation script including "gern" in the full-table category

**Phase to address:**
Schema design phase — flag gern alongside lila/rosa/orange before any declension generation.

---

### Pitfall 12: "Lieblings-" Is a Prefix, Not an Adjective

**What goes wrong:**
"Lieblings-" (favorite-) is stored in adjectivebank.json but is a nominal prefix used to form compounds ("Lieblingsessen", "Lieblingsfarbe") — it is not an adjective. It cannot appear standalone, cannot be declined, and has no comparative or superlative. Adding any grammar data to it is wrong. Including it in declension generation produces meaningless forms.

**Why it happens:**
It was filed under adjectives pedagogically (it conveys a quality-like concept), but grammatically it is a derivational prefix, not an adjective. The adjectivebank.json currently holds it without a flag.

**How to avoid:**
The declension generation script must explicitly exclude "lieblings-_adj" by _id. Consider adding a `"type": "prefix"` field to this entry so future scripts can filter by type. Do not generate any comparison or declension data for it.

**Warning signs:**
- "Lieblings-er", "Lieblings-em" appearing in any generated form list
- Verification script treating _id "lieblings-_adj" as a normal adjective entry

**Phase to address:**
Pre-data-entry cleanup phase — identify non-adjective entries in the adjective bank and exclude them from all grammar data generation.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store only comparative/superlative stems, not full 144-cell table | Much less data to write (3 fields vs 144 per adjective) | Leksihjelp must implement declension algorithm client-side; if algorithm has bugs, all forms are wrong | Only if Leksihjelp team explicitly confirms they can compute forms from stems |
| Apply -er/-st endings algorithmically to all adjectives | Fast data entry | Wrong for gut/viel/gern/hoch; wrong for teuer (elision); wrong for indeclinable adjectives | Never as the sole approach — algorithmic results must always be verified against irregular list |
| Skip adjective extraction from "other" bucket and only add grammar data to existing 108 | Simpler milestone scope | Students still can't find B1 adjectives like "nützlich", "vorsichtig", "ärgerlich" | Acceptable as a phased approach if extraction is deferred to v1.2 |
| Add placeholder `"comparison": {}` to all 108 without real data | Schema validation passes | Leksihjelp indexes nothing useful; worse than no comparison field at all | Never — either add real data or don't add the field |
| Use the same CEFR level for all newly extracted adjectives | Simpler | Loses the A1/A2/B1 granularity that Leksihjelp might use for level-appropriate search results | Acceptable if intro level is stored from the source bucket metadata instead |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Leksihjelp inflection search | Assuming Leksihjelp will automatically index the new `comparison` field without code changes | Verify with the Leksihjelp codebase what fields it actually indexes — v1.0 confirmed "conjugations" and "plural" are indexed; adjective `comparison` or `declension` fields may need Leksihjelp-side changes |
| Vercel auto-deploy | Committing large adjectivebank.json with 15,000+ cells and assuming CDN cache clears | CDN cache-control is set to 24 hours (s-maxage=86400); purge Vercel CDN after pushing or wait 24h before testing Leksihjelp with new data |
| API response format | Adding a `declension` top-level field to adjectivebank.json entries and assuming it appears in `/api/vocab/v1/core/german` | The API handler reads `adjectivebank.json` and merges it into combined response — no code change needed; verify by calling the API after deploy |
| Schema validation CI | Running strict JSON Schema validation against adjective entries | Current schema requires `translations` which no existing entry has; schema must be updated before validation runs, not after |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Storing 144 cells × (108 + N new adjectives) inline in adjectivebank.json | File size grows from ~551 lines to 15,000+ lines; slow JSON parse on Vercel cold start | Evaluate whether Leksihjelp needs full cell table or just stems before committing to full-table approach | At current scale (~200 adjectives) this is tolerable; at 500+ adjectives it becomes problematic |
| No deduplication in the extracted adjective list | Script runs fine but adds 262 duplicate records when processing all three CEFR level files | Deduplicate by word string before insertion, then by existing bank word strings | Breaks immediately on first extraction run if not addressed |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Declension data added:** Verify that indeclinable adjectives (lila, rosa, orange, cool, gern, Lieblings-) have `indeclinable: true` or equivalent and are NOT in any generated declension table
- [ ] **Suppletive comparatives correct:** Verify gut=besser/best, viel=mehr/meist, gern=lieber/liebst are individually confirmed — not just that all 108 entries have a comparison field
- [ ] **hoch stem change correct:** Verify "hoher", "hohe", "hohes", "hohem", "hohen" appear as indexed forms — NOT "hochem", "hochen", "hoches", "hochem"
- [ ] **teuer elision correct:** Verify "teure" (NOT "teuere") appears as the NomF form of teuer
- [ ] **Extracted adjectives are truly adjectives:** Verify no adverbs (manchmal, einmal, bald, geradeaus), prepositions, conjunctions, or parse artifacts appear in extracted list
- [ ] **Duplicates removed:** Verify extracted list contains no words already in the 108-entry bank (alt, warm, kalt, schnell, etc.)
- [ ] **"beste_adj" resolved:** Verify curriculum manifests have been checked and a decision made on whether "beste_adj" stays or is removed before gut's superlative generates "beste" as an indexed form
- [ ] **Schema validation passes:** Verify the adjective schema has been updated so existing entries without translations don't fail validation
- [ ] **Leksihjelp field name confirmed:** Verify the field name chosen for adjective grammar data ("comparison" vs "declension" vs other) matches what Leksihjelp actually looks for when building its search index

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| hoch/trocken/teuer stem wrong | LOW | Fix 3 entries in adjectivebank.json, re-verify, push; no structural change |
| Indeclinable adj got declension table | LOW | Remove declension field from lila/rosa/orange/cool entries; re-push |
| Suppletive comparative wrong (gut got "guter") | LOW | Fix 3 entries, re-run spot-check script, push |
| Adverb-only words extracted as adjectives | MEDIUM | Audit all extracted entries against "ein ___er Mann" test; remove wrong ones; push; Leksihjelp search index rebuilds on next sync |
| Duplicate entries added (collision on _id) | MEDIUM | Identify duplicate _ids, remove the collision entries, verify curriculum manifests still reference correct _ids |
| Schema validation blocks the CI pipeline | LOW | Update schema required fields from `["translations"]` to `[]`; re-run validation |
| "beste_adj" creates duplicate index entries | LOW | Remove beste_adj if not in any curriculum manifest; if in curricula, document the intentional duplication |
| Leksihjelp doesn't index the new comparison field | HIGH | Requires Leksihjelp code change (out of scope for this repo); coordinate with Leksihjelp team before writing data in a format they don't yet consume |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| hoch stem change | Schema design — store attributive stem separately | Spot-check: "hohem" must resolve to "hoch"; "hochem" must not appear |
| Indeclinable adjectives get wrong forms | Schema design — add `indeclinable` flag before generation | Verify lila/rosa/orange/cool/gern have flag; verify no -s/-m/-n/-r forms generated for them |
| Suppletive comparatives wrong | Data entry — irregulars first, individually verified | Mandatory spot-check: gut=besser/best, viel=mehr/meist, gern=lieber/liebst |
| Positive NomM = comparative base collision | Schema design — document intentional overlap | No verification needed — both return same base entry (expected behavior) |
| False adjective extraction from "other" bucket | Extraction phase — apply "ein ___er Mann" test | Manual review of all extracted candidates; count should be ~80-130, not 200+ |
| -el/-er elision (teuer) | Data entry — include teuer in special-case group | Spot-check: teuer NomF = "teure" (not "teuere") |
| Participials without comparatives | Schema design — add `nicht_komparierbar` flag | Verify überrascht/gespannt/bewölkt have flag; no comparative forms generated |
| "beste_adj" collision with gut's superlative | Pre-data-entry cleanup | Check all curricula for "beste_adj" before touching gut's comparison field |
| Schema translations required but missing | Schema extension phase — fix schema before any validation | `ajv validate adjectivebank.json` passes with 0 errors |
| Goethe bucket duplicates | Extraction phase — deduplicate by word string first | Extracted list count after dedup is less than before dedup |
| "gern" treated as declinable | Schema design — flag gern alongside indeclinable colors | No "gernem", "gernes", "gerner" in generated forms |
| "Lieblings-" treated as adjective | Pre-data-entry cleanup | Explicitly excluded from all generation by _id check |
| Leksihjelp not indexing comparison field | Leksihjelp coordination before data design | Confirm field name and format with Leksihjelp before committing to schema shape |

---

## Sources

- `vocabulary/core/de/adjectivebank.json` — direct inspection of all 108 existing entries
- `vocabulary/schema/adjective.schema.json` — current schema (translations required but not present)
- `vocabulary/dictionary/sources/goethe-a1-words.json`, `goethe-a2-words.json`, `goethe-b1-words.json` — direct analysis of the 1,191 "other" bucket entries
- `vocabulary/curricula/vocab-manifest-tysk1-vg1.json` — curriculum cross-reference for _id integrity
- `api/vocab/v1/core/[language].js` — API handler (no code change needed for data additions)
- `.planning/milestones/v1.0-phases/02-add-german-preteritum-conjugations/02-VERIFICATION.md` — v1.0 verification approach (spot-check pattern)
- German grammar knowledge: Duden-level rules for hoch/hoh-, suppletive gut/besser/best-, indeclinable color adjectives, -er elision in teuer/dunkl-

---
*Pitfalls research for: Adding German adjective declension to Papertek Vocabulary API (v1.1 milestone)*
*Researched: 2026-02-20*
