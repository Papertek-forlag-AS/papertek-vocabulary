# Pitfalls Research

**Domain:** Adding German Perfektum conjugations and full noun declension to an existing vocabulary API
**Researched:** 2026-02-22
**Confidence:** HIGH — based on direct codebase inspection + German grammar expertise

---

## Critical Pitfalls

### Pitfall 1: Haben/Sein Assignment Error for Dual-Auxiliary Verbs

**What goes wrong:**
Six verbs in the bank can take either haben or sein depending on usage context:

- `ausziehen` — sein when "to move out" (ich bin ausgezogen), haben when "to take off / undress" (ich habe mich ausgezogen)
- `fahren` — sein for intransitive travel (ich bin gefahren), haben if transitive object is present (ich habe das Auto gefahren)
- `fliegen` — sein as passenger/intransitive (ich bin geflogen), haben when piloting (ich habe das Flugzeug geflogen)
- `schwimmen` — sein for directed motion (ich bin geschwommen — regional, especially South German), haben for activity (ich habe geschwommen — North German standard)
- `laufen` — sein for directed movement (ich bin gelaufen), haben for activity/sport (ich habe gelaufen — less standard but attested)
- `wegfahren` — sein as intransitive departure (ich bin weggefahren)

Additionally, two verbs show regional variation:
- `sitzen` — haben (standard North German), sein (South German/Austrian)
- `stehen` — haben (standard), sein (South German/Austrian)

Assigning a single auxiliary to any of these verbs and then conjugating all six pronoun forms with that auxiliary will produce correct forms for one reading and wrong forms for another.

**Why it happens:**
The preteritum milestone stored one set of conjugated forms per verb (correct, since preteritum uses no auxiliary). For Perfektum, the assumption that "each verb has exactly one auxiliary" carries over from the preteritum pattern. The data structure `conjugations.perfektum.former` with six pronoun forms implicitly assumes a single auxiliary.

**How to avoid:**
Introduce a `auxiliary` field at the Perfektum level. For dual-auxiliary verbs, store both auxiliaries with a `dual_auxiliary: true` flag and a brief explanation (`auxiliary_note`) of when each is used. For the six standard dual verbs: store the primary/most-common auxiliary as the default (e.g., sein for ausziehen when "moving out"), and document the alternate reading in the note. Do not attempt to store two full conjugation tables per verb — the inflected forms are trivially derived from knowing whether the auxiliary is haben or sein; the participle is the same either way.

Structure example:
```json
"perfektum": {
  "particip": "ausgezogen",
  "auxiliary": "sein",
  "dual_auxiliary": true,
  "auxiliary_note": "sein when 'to move out'; haben when 'to take off/undress'",
  "former": {
    "ich": "bin ausgezogen",
    "du": "bist ausgezogen",
    "er/sie/es": "ist ausgezogen",
    "wir": "sind ausgezogen",
    "ihr": "seid ausgezogen",
    "sie/Sie": "sind ausgezogen"
  },
  "feature": "grammar_perfektum"
}
```

**Warning signs:**
- `schwimmen_verb` perfektum shows only "ich habe geschwommen" without noting "ich bin geschwommen" — data is incomplete
- `ausziehen_verb` perfektum shows only the "move out" reading without noting the "undress" reading
- Any conjugated form file containing "ich habe weggefahren" — this is wrong (wegfahren takes sein)

**Phase to address:**
Schema definition phase — establish the `dual_auxiliary` flag, `auxiliary_note` field, and `auxiliary` field in the verb schema before data entry. This decision cannot be revisited mid-entry without migrating all verb entries.

---

### Pitfall 2: Separable Prefix Verbs Given Wrong Past Participle (ge- Position Error)

**What goes wrong:**
19 verbs in the bank are separable (have `separable: true`). Their past participles insert `ge-` between the prefix and the stem, not before the prefix:

- aufstehen → aufgestanden (NOT *geaufgestanden, NOT *geaufstanden)
- mitnehmen → mitgenommen (NOT *gemitgenommen)
- einladen → eingeladen (NOT *geeingeladen)
- anrufen → angerufen (NOT *geangerufen)
- aufwachen → aufgewacht
- einschlafen → eingeschlafen
- sich anziehen → sich angezogen
- aufräumen → aufgeräumt
- fernsehen → ferngesehen
- wegfahren → weggefahren
- mitkommen → mitgekommen
- ausziehen → ausgezogen
- einkaufen → eingekauft
- einpacken → eingepackt
- anfangen → angefangen
- mitbringen → mitgebracht
- sich aufregen → sich aufgeregt
- sich ausruhen → sich ausgeruht
- sich vorbereiten → sich vorbereitet

A generation script that naively prepends `ge-` to the infinitive will produce "geaufgestanden", "gemitgenommen" — all grammatically impossible forms that will pollute the search index.

**Why it happens:**
The preteritum data for separable verbs was entered correctly (the preteritum also uses the split pattern: "stand auf", "nahm mit"). But the past participle is a single word (not split), and the ge- insertion rule is non-obvious. A script parsing the `separable: true` flag and the presens conjugation to extract the prefix could correctly reconstruct the form — but it must know the rule is "ge- goes after the prefix, before the stem", not "ge- prepends to the infinitive".

**How to avoid:**
Store the past participle explicitly for every separable verb rather than computing it. Add a `particip` field at the Perfektum level holding the full unsplit form ("aufgestanden", "mitgenommen"). This mirrors the decision to store explicit strong verb preteritum forms rather than computing them algorithmically. The `particip` field is then used as the base for conjugating `conjugations.perfektum.former`.

**Warning signs:**
- Any participle form beginning with "ge" for a separable verb with a two-syllable prefix — these are all wrong ("geeingeschlafen", "gemitgenommen")
- Spot check: `mitbringen_verb` participle should be "mitgebracht" — if the script produces "gemitgebracht", the ge- position rule is wrong

**Phase to address:**
Data entry phase — all 19 separable verbs must be individually looked up and the participle stored explicitly. The separable verb list is already in the bank (filter by `separable: true`).

---

### Pitfall 3: Inseparable Prefix Verbs Given Spurious ge- Prefix

**What goes wrong:**
20 verbs in the bank have inseparable prefixes (be-, er-, ver-, ent-, unter-, ge- as prefix). Their past participles do NOT take ge-:

- besuchen → besucht (NOT *gebesucht)
- erklären → erklärt (NOT *geerklärt)
- erzählen → erzählt (NOT *geerzählt)
- beginnen → begonnen (NOT *gebegonnen)
- verstehen → verstanden (NOT *geverstanden)
- vergessen → vergessen (NOT *gevergessen)
- verlieren → verloren (NOT *geverloren)
- versprechen → versprochen (NOT *geversprochen)
- vertrauen → vertraut (NOT *gevertraut)
- bekommen → bekommen (NOT *gebekommen)
- gewinnen → gewonnen (NOT *gegewonnen)
- sich entschuldigen → sich entschuldigt
- sich erholen → sich erholt
- sich unterhalten → sich unterhalten
- sich bewegen → sich bewegt
- sich verspäten → sich verspätet
- entspannen → entspannt

Note: `gehen` and `geben` start with "g" but are NOT inseparable-prefix verbs — they are base verbs and do take ge-: gegangen, gegeben.

**Why it happens:**
A generation script that mechanically prepends ge- to all verbs not flagged as separable will produce wrong forms for inseparable-prefix verbs. There is currently no `inseparable: true` flag in the verb schema — the only flag is `separable: true`. Inseparable verbs look like regular verbs to the schema.

**How to avoid:**
Add an `inseparable: true` flag to the verb schema. Set it on the 17+ inseparable-prefix verbs in the bank before running any participle generation script. The generation script must skip ge- prepending for any verb with `inseparable: true`. Alternatively — and safer given the small verb count — store the participle explicitly for every verb rather than computing it algorithmically for any category.

**Warning signs:**
- `besuchen_verb` participle shows "gebesucht" — immediate fail
- `vergessen_verb` participle shows "gevergessen" — immediate fail
- The strong verb `bekommen` — participle is "bekommen" (identical to infinitive, no ge- and irregular strong ablaut is already "come")

**Phase to address:**
Schema definition phase — add `inseparable: true` flag. Data entry phase — explicitly mark all 17+ inseparable-prefix verbs and store participles individually.

---

### Pitfall 4: Modal Verbs Given Standard Perfektum Structure

**What goes wrong:**
The 7 modal verbs (mögen, können, müssen, wollen, dürfen, sollen, möchten) behave differently in Perfektum depending on whether they appear alone or with a dependent infinitive:

- Alone: ich habe gemocht, ich habe gekonnt, ich habe gemusst — modal participle used
- With dependent infinitive: ich habe kommen müssen, ich habe schwimmen können — double infinitive construction (participle of modal is NOT used; instead the infinitive form replaces it)

A vocabulary API that stores Perfektum forms for modals will store the modal-alone version (gemocht, gekonnt, gemusst, etc.), which is correct for the standalone usage but incomplete for the far more common dependent-infinitive usage. Worse, `möchten` has no participle — it uses `gemocht` (from mögen) even in Perfektum.

**Why it happens:**
Modals are a special-case grammatical category. The v1.1 milestone correctly flagged modals as `type: modal`. But the Perfektum milestone will likely attempt to apply the same conjugation structure to modals as to regular verbs, since the data shape is the same.

**How to avoid:**
Add a `modal_note` field to the Perfektum block for modal verbs. Store the standalone Perfektum (ich habe gekonnt) as `former` data, and document the double-infinitive construction in the note. For `möchten` specifically: it has no standalone Perfektum in practice — document this explicitly and do not store a participle form "gemöcht" (not standard). The `möchten_modal` entry should have a note explaining that its Perfektum uses `gemocht` (from mögen).

**Warning signs:**
- `möchten_modal` entry showing "gemöcht" as participle — wrong
- Any modal entry missing a note about the double-infinitive construction
- Modals stored with identical structure to regular verbs with no special flags

**Phase to address:**
Schema definition phase — plan the modal handling before data entry begins. Data entry phase — process modals as a separate group, verify each individually.

---

### Pitfall 5: Reflexive Verb Perfektum Shows Wrong Reflexive Pronoun Agreement

**What goes wrong:**
26 verbs in the bank are reflexive (contain "sich" in the word field). Their Perfektum conjugations must track the reflexive pronoun through all 6 person/number forms:

- ich habe mich gewaschen (not "ich habe sich gewaschen")
- du hast dich gewaschen
- er/sie/es hat sich gewaschen
- wir haben uns gewaschen
- ihr habt euch gewaschen
- sie/Sie haben sich gewaschen

A generation script that stores the infinitive form "sich waschen" and then conjugates the auxiliary without updating the reflexive pronoun will produce "ich habe sich gewaschen" for every person — which is grammatically wrong for all but the third person singular.

**Why it happens:**
The preteritum data for reflexive verbs was entered correctly (e.g., sich waschen: "ich wusch mich", "du wuschst dich", etc.). But the Perfektum data involves two moving parts: the auxiliary conjugation AND the reflexive pronoun. A script that takes the preteritum `former` structure and adapts it for Perfektum by prepending the auxiliary might forget that the reflexive pronoun also changes by person.

**How to avoid:**
For all 26 reflexive verbs, store all 6 Perfektum conjugated forms explicitly with the correct reflexive pronoun for each person. The preteritum data in `conjugations.preteritum.former` already demonstrates the correct pronoun-agreement pattern — use it as the verification template. Spot-check: verify that "ich", "du", "er/sie/es", "wir", "ihr", "sie/Sie" each have a different reflexive pronoun where required.

**Warning signs:**
- Any reflexive verb Perfektum form showing "sich" for the "ich" or "du" person ("ich habe sich angezogen" is wrong)
- All 6 pronoun forms showing the same reflexive pronoun (a sign the pronoun was not varied)

**Phase to address:**
Data entry phase — reflexive verbs are a named category. Process them as a group, verify at least 3 sample verbs (ich/du/wir) for correct reflexive pronoun assignment before generating all 26.

---

### Pitfall 6: Verb Phrase Entries Treated as Regular Verbs in Perfektum

**What goes wrong:**
4 entries in the bank are verb phrases (contain spaces and are multi-word):
- `rad_fahren_verbphrase` ("Rad fahren") — sein auxiliary; participle is "Rad gefahren" (prefix-of-sort behavior)
- `musik_hoeren_verbphrase` ("Musik hören") — haben auxiliary; participle is "Musik gehört"
- `gassi_gehen_verbphrase` ("Gassi gehen") — sein auxiliary; participle is "Gassi gegangen"
- `fertig_werden_verbphrase` ("fertig werden") — sein auxiliary; participle is "fertig geworden"

These entries pose two risks:
1. The past participle of "Rad fahren" is "Rad gefahren" — with ge- correctly placed on the verb stem "fahren", not on the full phrase
2. Leksihjelp's inflection search cannot meaningfully index a past participle phrase like "Rad gefahren" as a single token — it would need to decompose it

**Why it happens:**
Verb phrase entries were added to the bank for pedagogical reasons (students learn these phrases as units). But their Perfektum structure does not map cleanly onto the single-word participle model used for regular verbs.

**How to avoid:**
Process verb phrase entries separately from the 144 single-word verbs. For each phrase, confirm: (a) which component verb carries the ge- prefix, (b) which auxiliary is used. Store the complete Perfektum forms explicitly. Document in a `perfektum_note` that inflection search for verb phrases is not supported — searching for "Rad gefahren" will not resolve to the base entry in Leksihjelp.

**Warning signs:**
- "Rad gefahren" appearing as an indexed form in the search index — Leksihjelp cannot parse this correctly
- Phrase entries receiving the same automated treatment as single-word verbs

**Phase to address:**
Data entry phase — identify all 4 verbphrase entries (filter by `_id` ending in `_verbphrase`) and process them manually outside the main generation loop.

---

### Pitfall 7: N-Deklination Nouns Declined as Strong Masculine

**What goes wrong:**
At least 11 nouns in the bank are weak masculine (n-Deklination), meaning their Genitiv, Dativ, and Akkusativ singular forms all end in -(e)n — unlike strong masculine nouns which take -(e)s in the Genitiv. Treating these as strong masculine will produce wrong Genitiv/Dativ/Akkusativ forms:

Known n-Deklination nouns in the bank:
- Affe → des Affen, dem Affen, den Affen (NOT *des Affes)
- Hase → des Hasen, dem Hasen, den Hasen (NOT *des Hases)
- Löwe → des Löwen, dem Löwen, den Löwen
- Neffe → des Neffen, dem Neffen, den Neffen
- Bär → des Bären, dem Bären, den Bären (NOT *des Bärs)
- Elefant → des Elefanten, dem Elefanten, den Elefanten (NOT *des Elefants)
- Mensch → des Menschen, dem Menschen, den Menschen (NOT *des Mensches)
- Morgenmensch → des Morgenmenschen (inherits from Mensch)
- Klassenkamerad → des Klassenkameraden
- Superheld → des Superhelden
- Nachbar → des Nachbarn, dem Nachbarn, den Nachbarn

False positives to watch for — masculine nouns ending in -e or -ee that are NOT n-Deklination:
- Käse → des Käses (strong! NOT *des Käsen)
- See → des Sees (strong! NOT *des Seen)

**Why it happens:**
An automated declension generator for masculine nouns would apply the standard strong pattern: Nominativ der X, Genitiv des X(e)s, Dativ dem X, Akkusativ den X. This is correct for most masculine nouns but wrong for n-Deklination. There is currently no field in the noun schema to flag n-Deklination membership. The generator has no signal to treat these differently.

**How to avoid:**
Add a `noun_class` field (or a `weak_masculine: true` flag) to the noun schema before data entry begins. Apply it to all 11 identified n-Deklination nouns. The declension generation script must produce the -(e)n endings for all non-Nominativ cases when this flag is present. Verify by spot-checking Bär (des Bären not *des Bärs) and Elefant (des Elefanten not *des Elefants) before generating all 331 nouns.

**Warning signs:**
- `baer_noun` Genitiv showing "des Bärs" — immediate fail
- `elefant_noun` Dativ showing "dem Elefant" — should be "dem Elefanten"
- Checking Käse: if Genitiv shows "des Käsen" — false positive applied

**Phase to address:**
Schema definition phase — add weak masculine flag before any data entry. Pre-data-entry audit — identify all n-Deklination nouns in the 331-noun bank before generating any forms.

---

### Pitfall 8: Noun Declension Schema Conflict with Existing `cases` Data

**What goes wrong:**
223 nouns in the core bank already have partial case data in a `cases` field with this structure:
```json
"cases": {
  "nominativ": { "intro": "9.1", "bestemt": "der Freund", "ubestemt": "ein Freund" },
  "akkusativ": { "intro": "9.1", "bestemt": "den Freund", "ubestemt": "einen Freund" }
}
```

This structure stores only singular forms (no plural dimension), and only Nominativ/Akkusativ (no Dativ/Genitiv). The v1.2 milestone needs all 4 cases × singular/plural × definite/indefinite = 16 data points per noun.

If the new data is added by extending the existing `cases` key with new sub-keys, the existing structure `cases.nominativ.bestemt` (a string) will conflict with a new structure `cases.nominativ.singular.bestemt` (an object). Both cannot coexist under `cases.nominativ` without a breaking schema change.

Additionally, 2 nouns have a `declension` key using Norwegian terminology (entall/flertall with bestemt/ubestemt), which is a third incompatible structure.

The v2 lookup API already reads both `cases` and `declension` fields and returns them separately. Grammar-features.json has `dataPath: "cases.akkusativ.ubestemt"` for the accusative feature — if the structure of `cases` changes, this path breaks.

**Why it happens:**
The existing `cases` data was added incrementally in v1.0 for pedagogical progressive disclosure (teaching nominative and accusative separately). It was not designed as the foundation for a full 4-case declension system. The v1.2 milestone is the first time all 4 cases and both numbers are needed simultaneously.

**How to avoid:**
Decide the structural approach BEFORE writing any data. Three options with trade-offs:

Option A (Recommended): Use a new top-level key `full_declension` for the complete 4×2×2 table, keep existing `cases` data untouched for backward compatibility. Grammar-features.json `dataPath` references continue to work. The v2 API may need a new response field. Downside: two sources for Nominativ/Akkusativ singular data.

Option B: Extend `cases` with a parallel sub-structure that adds the `plural` dimension without breaking the existing singular paths — not cleanly achievable in JSON without nesting changes.

Option C: Migrate the 223 existing `cases` entries to the new structure and update all `dataPath` references in grammar-features.json. Clean, but requires migrating 223 entries before any new data entry.

Document the decision in PROJECT.md before Phase 1 of v1.2 begins.

**Warning signs:**
- Any script that appends `cases.dativ` or `cases.genitiv` alongside the existing `cases.nominativ` using the existing flat structure — Dativ singular of "der Freund" is "dem Freund" but Dativ plural is "den Freunden"; the existing structure cannot express both without a new nesting level
- The grammar-features.json path `cases.akkusativ.ubestemt` breaking after any structural migration

**Phase to address:**
Schema definition phase — the structural decision must be made and written into the schema before any noun data entry begins. This is the single highest-risk decision for the noun declension work.

---

### Pitfall 9: Dative Plural -n Rule Applied to -s Plural Nouns

**What goes wrong:**
German Dative plural requires -n to be added to the plural form for all nouns — EXCEPT nouns whose plural already ends in -s or -n. 26 nouns in the bank have -s plurals (foreign/borrowed words):
- die Fotos, die Hobbys, die Kinos, die Omas, die Opas, die Cafés, die Restaurants, die Parks, die Zoos, die Blogs, die Autos, die Partys, die Tests, die T-Shirts, die Joghurts, die Cousins, die Tees, die Kaffees, die Babys, die Highlights, die Müslis, die Interviews, die Überraschungspartys, die Sonnencremes, die Reis, die Eis

The Dative plural of these nouns stays the same as the Nominativ plural: "den Fotos" (not "den Fotosn"). A rule-engine that mechanically adds -n to every plural form will produce "den Fotosn", "den Hobbysen", "den Restaurantsn" — all wrong.

**Why it happens:**
The -n rule is a standard German grammar rule that is almost always taught without the -s exception. Scripts applying it will miss the exception unless specifically coded to check for it.

**How to avoid:**
Before writing the declension generation script, identify all nouns with -s plural endings (query the bank for `plural` values ending in "s"). Add a check in the generation script: if `plural.endsWith("s")`, Dative plural = Nominativ plural (no -n added). Alternatively, since plurals are already stored, compute Dative plural from the stored plural string rather than from a rule.

**Warning signs:**
- Any Dative plural form for Foto/Kino/Auto/Restaurant ending in "-n" — immediately wrong
- Spot check: `auto_noun` Dative plural should be "den Autos", not "den Autosn"

**Phase to address:**
Data generation phase — include the -s plural exception as an explicit rule in the generation script. Add a verification check: count nouns with -s plural endings; all must show Dative plural = Nominativ plural (no suffix change).

---

### Pitfall 10: Plural-Only and Uncountable Nouns Given Full Singular/Plural Declension

**What goes wrong:**
Two categories of nouns require special handling:

**Plural-only (genus = "pl"):** Eltern and Ferien have no singular forms. A declension generator that creates singular Nominativ, Genitiv, Dativ, Akkusativ forms for these nouns will produce "der Elter", "dem Elter" — forms that do not exist in German. These nouns decline only in plural forms.

**Uncountable (plural = null):** 25 nouns have no plural, including Mathematik, Deutsch, Biologie, Musik, Unterricht, Wetter, Hunger. A declension generator that creates plural forms for these will produce "die Mathematiken", "die Weibläufe" — all wrong.

Additionally, several nouns use informal markers instead of proper plural forms: "Hunger" has `plural: "(ingen flertall)"`, "Stress" has `plural: "(usually uncountable)"`, "Milch" has `plural: " (ingen flertall) "`. These are legacy data quality issues — these entries have non-null plural values that are not actual German plural forms.

**Why it happens:**
The generation script iterates all 331 nouns without filtering. The `genus = "pl"` and `plural = null` signals exist in the data but must be explicitly checked in the generator.

**How to avoid:**
The generation script must check three conditions before generating any form:
1. If `genus === "pl"`: generate plural forms only, mark singular forms as null or omit them
2. If `plural === null`: generate singular forms only, mark plural forms as null or omit them
3. If `plural` contains parenthetical text (starts with "(" or contains "ingen flertall"): treat as uncountable, generate singular only

Before running generation, clean the legacy entries: normalize "(ingen flertall)" to `plural: null` for Hunger, Milch, Aussehen, Wetter. Fix "Stress" similarly.

**Warning signs:**
- "der Elter" or "dem Eltern" (wrong singular of Eltern) appearing in any output
- "die Mathematiken" as a plural form
- Any generated form for a noun whose `plural` value contains parentheses

**Phase to address:**
Pre-data-entry cleanup phase — normalize plural markers to `null` for uncountable nouns. Schema definition phase — document how plural-only and singular-only nouns are represented in the full declension block.

---

### Pitfall 11: Verb Preteritum Sync Discrepancy — Dictionary Bank Does Not Have Preteritum

**What goes wrong:**
A critical pre-existing sync failure will compound for Perfektum data: the `vocabulary/dictionary/de/verbbank.json` contains 0 of the 148 verbs' preteritum conjugations, even though `vocabulary/core/de/verbbank.json` has all 148. Direct inspection confirms: `sein_verb` in the dictionary bank has only `conjugations.presens` — the `preteritum` conjugation block is absent. This is true for all 148 verbs.

If the Perfektum milestone follows the same incomplete sync pattern, Perfektum data will be in the core bank but absent from the dictionary bank, making the v2 lookup API unable to return Perfektum data even after the feature is built.

**Why it happens:**
The v1.0 preteritum milestone appears to have written data to the core bank (which serves Leksihjelp via the v1 API) but did not propagate the conjugation data to the dictionary bank. The dual-bank sync requirement was either forgotten or deferred. Since v1.0 shipped and Leksihjelp works (it reads the v1/core API), the discrepancy went unnoticed.

**How to avoid:**
Before writing any Perfektum data, decide whether to also backfill the preteritum data to the dictionary bank — or explicitly document why the dictionary bank does not carry conjugation data. Then ensure the Perfektum milestone writes data to BOTH banks from the start. Add a verification step to the Perfektum integration phase: confirm that `dictionary/de/verbbank.json` contains `conjugations.perfektum` for at least one verb before marking the phase complete.

**Warning signs:**
- The v2 lookup API response for any verb not containing `conjugations.preteritum` — signals the dictionary sync was never done
- Any phase plan that writes only to `core/de/verbbank.json` without a matching write to `dictionary/de/verbbank.json`

**Phase to address:**
Integration phase (first step) — audit the dictionary verbbank and decide on the backfill strategy. Perfektum data entry phase — write to both banks simultaneously.

---

### Pitfall 12: Perfektum Conjugation of "sein" Uses Wrong Form ("hat gewesen" vs. "ist gewesen")

**What goes wrong:**
`sein` (to be) takes sein as its auxiliary in Perfektum: "ich bin gewesen", not "ich habe gewesen". This is correct and well-known. However, the past participle "gewesen" is irregular — it has the ge- prefix on a suppletive stem (not from the infinitive "sein" via any rule). A script computing the participle from the infinitive stem will produce "geseint" or similar nonsense.

Similarly, `werden` in its standard Perfektum uses: "ich bin geworden" — again a suppletive participle. And `haben` itself: "ich habe gehabt" (regular, but must be verified).

These three auxiliary-capable verbs are all in the bank and all need individual treatment.

**Why it happens:**
The same pattern that caused problems for strong verb preteritum (which v1.0 correctly solved by individual lookup) applies here. Sein, werden, and haben are the most irregular German verbs and must be processed first, individually, as the test cases for any generation approach.

**How to avoid:**
Maintain a "process first" list for Perfektum as was done for preteritum. Mandatory first entries to enter and verify: sein (bin gewesen), haben (habe gehabt), werden (bin geworden). After these three are confirmed correct, the regular verb generation can proceed.

**Warning signs:**
- Any generated form "geseint", "gewerdet", "gehabet" — all wrong
- `sein_verb` participle showing anything other than "gewesen"
- `werden_verb` participle showing anything other than "geworden"

**Phase to address:**
Data entry phase — list sein, haben, werden as the mandatory first three Perfektum entries, verified before processing any other verb.

---

### Pitfall 13: Search Index Bloat from Indexing All Declined Noun Forms as Separate Entries

**What goes wrong:**
The current search index has 3,454 entries and is 420 KB. If all 4 cases × 2 numbers × 2 article-definiteness variants × 331 nouns = ~5,296 noun forms are added as separate search index entries, the index would grow by ~12x for nouns alone (from ~1,641 noun entries to ~6,937+ noun entries). At 420 KB currently, this would push the search index well past 1 MB, increasing cold-start parse time on Vercel serverless functions and slowing all search requests.

The current search index approach stores only base forms (1 entry per word). Inflection search works through the v2 lookup API reading the bank data directly, not through index entries for each inflected form.

**Why it happens:**
The v1.1 milestone's ARCHITECTURE.md explicitly warned against adding declension cells to the search index. But for noun declension it is tempting to add declined forms as search entries so users can type "dem Freund" and find "Freund" in the results.

**How to avoid:**
Do NOT add declined noun forms as separate search index entries. The search index continues to hold 1 entry per base noun form. The v2 lookup API, which reads the full noun bank data, handles declension-aware lookup. Document this decision in the noun declension phase plan so future developers do not reopen the question.

**Warning signs:**
- Search index entry count approaching 10,000+ entries (current: 3,454)
- Any search index entry where the `w` field is a declined form ("dem Freund", "den Hunden") rather than the base noun

**Phase to address:**
Integration phase — explicitly state in the phase plan that the search index receives only one new entry per noun (the base form), and that declined forms are resolved through the bank data directly.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip dual-bank sync for Perfektum (write to core only) | Saves time; Leksihjelp v1 works immediately | v2 lookup API cannot serve Perfektum data; mirrors existing preteritum debt in dictionary bank | Never — each milestone should write to both banks |
| Assign a single auxiliary to all dual-auxiliary verbs (pick the "most common" one) | Simpler data entry; no need for `dual_auxiliary` flag | Students who encounter the alternate auxiliary usage get no explanation; schwimmen/fahren are genuinely ambiguous | Only acceptable if the `auxiliary_note` field is added to document the alternate usage |
| Store only the past participle, not full Perfektum conjugations for all 6 pronouns | Much less data (1 field vs 6 per verb) | Leksihjelp cannot display a full Perfektum conjugation table; inflection search for "ist gegangen" requires the full forms to be indexed | Acceptable if Leksihjelp only needs the participle for its search (confirm before deciding) |
| Use a single flat `cases` structure for full noun declension (extend existing `cases` key) | No new key needed; schema change is additive | Breaks existing `dataPath` references in grammar-features.json; breaks Leksihjelp clients reading `cases.akkusativ.bestemt` as a string | Never — the structural conflict is real and must be resolved with a new key or a migration |
| Generate noun declension algorithmically without marking n-Deklination nouns | Fast; works for 320/331 nouns | 11 n-Deklination nouns get wrong Genitiv/Dativ/Akkusativ forms indexed; students cannot find "des Löwen" | Never — the exceptions are known and small enough to handle explicitly |
| Skip backfilling preteritum to dictionary bank while adding Perfektum | Reduces scope of v1.2 | The dictionary verbbank stays inconsistent (has presens but not preteritum or Perfektum); v2 API users always see incomplete conjugation data | Acceptable if backfill is explicitly deferred to v1.3 and documented in PROJECT.md |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vercel CDN cache | Deploying Perfektum data and immediately testing via Leksihjelp, seeing no change | CDN `s-maxage=86400` means up to 24h until clients see new data; purge the Vercel CDN after deploying or wait before testing end-to-end |
| v2 lookup API (`[wordId].js`) | Assuming Perfektum data appears in the response automatically once added to verbbank | The lookup handler at line 218 passes `entry.conjugations` through directly; Perfektum will appear automatically — but only if data was written to `vocabulary/dictionary/de/verbbank.json` (not just core bank) |
| Grammar-features.json | Adding a new Perfektum grammar feature without registering it | The feature `grammar_perfektum` is already registered in grammar-features.json with `dataPath: "conjugations.perfektum"` — no change needed. For noun full-declension, a new `grammar_noun_declension` feature ID may be needed if the data path changes from the existing `cases.dativ` |
| v2 lookup API — noun `cases` vs `full_declension` | Assuming the new full declension key automatically appears in v2 response | The v2 lookup handler at line 213-214 explicitly names `cases` and `declension` as the fields it passes through. A new `full_declension` key will NOT appear unless the handler is updated to include it |
| Search index rebuild | Rebuilding the search index and forgetting to deploy `search-index.pretty.json` alongside `search-index.json` | Both files exist in `dictionary/de/` — the rebuild script must update both, or the pretty-print version goes stale |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Adding 16 declined forms per noun to the search index | Search index grows from 420 KB to 2+ MB; Vercel cold-start parse time increases; search latency degrades | Keep search index at 1 entry per base noun; inflection lookup stays in bank data | Immediately if all 331 nouns × 16 forms are indexed |
| Adding full Perfektum conjugation tables to the search index (indexing "bin gegangen", "bist gegangen", etc. as separate entries) | Search index balloons from 679 verb entries to 679 × 6 = 4,074+ entries just for verbs | Index only the base participle form as a synonym entry if inflection search is needed; do not create 6 pronoun-form entries per verb | At 148 verbs × 6 forms × 2 tenses (preteritum + Perfektum) = 1,776 extra entries — significant but not catastrophic |
| Loading the full nounbank.json on every v2 lookup request | Nounbank is currently ~200 KB; with full declension data per noun it may reach 500-800 KB; cold-start parse time increases | Module-level cache (already in place in the v2 lookup handler via `indexCache`) prevents repeated disk reads; the bank parse overhead is a one-time cost per warm instance | Not a problem at current Vercel usage levels; would matter at high-traffic scale |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Perfektum data written to BOTH banks:** Verify `vocabulary/dictionary/de/verbbank.json` contains `conjugations.perfektum` for at least 5 verbs across different categories (strong, weak, separable, inseparable, reflexive) before marking the data entry phase complete
- [ ] **Dual-auxiliary verbs flagged:** Verify that ausziehen, fahren, fliegen, schwimmen, laufen have `dual_auxiliary: true` and `auxiliary_note` fields
- [ ] **Separable verb participles correct:** Spot-check: aufstehen=aufgestanden, mitnehmen=mitgenommen, einladen=eingeladen — ge- must be between prefix and stem
- [ ] **Inseparable verb participles correct:** Spot-check: besuchen=besucht, vergessen=vergessen, bekommen=bekommen — no ge- prefix
- [ ] **N-Deklination nouns have weak forms:** Verify Bär Genitiv="des Bären" (not "des Bärs"), Elefant Dativ="dem Elefanten", Affe Akkusativ="den Affen"
- [ ] **False positives avoided:** Verify Käse Genitiv="des Käses" (strong! not "des Käsen"), See Genitiv="des Sees" (strong)
- [ ] **Dative plural of -s plural nouns:** Verify Auto Dative plural="den Autos" (not "den Autosn"), Restaurant Dative plural="den Restaurants"
- [ ] **Eltern has no singular forms:** Verify declension for Eltern contains only plural data
- [ ] **Uncountable nouns have no plural forms:** Verify Mathematik, Deutsch, Musik have no generated plural declension forms
- [ ] **Sein/haben/werden Perfektum correct:** sein=gewesen (sein), haben=gehabt (haben), werden=geworden (sein)
- [ ] **Modal Perfektum documented:** möchten entry has a note that it uses gemocht from mögen; all modals have `modal_note` in Perfektum block
- [ ] **Noun schema structure decided:** PROJECT.md documents the chosen structural approach (new key vs. migration) before any noun declension data is written
- [ ] **v2 API handler updated for new noun key:** If `full_declension` key is chosen, verify the v2 lookup handler at line 213 is updated to pass it through
- [ ] **Grammar-features.json updated for noun declension:** New feature IDs for Dativ and Genitiv noun cases registered if data path changes

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong auxiliary for a batch of verbs | LOW | Fix auxiliary field and conjugated forms in verbbank entries; re-deploy; no structural change |
| Separable verb ge- position wrong (geaufgestanden) | LOW | Fix participle in affected entries; re-generate conjugated forms; spot-check before re-deploy |
| Inseparable verb given spurious ge- (gebesucht) | LOW | Fix participle; verify all inseparable verbs; re-deploy |
| N-Deklination noun given strong endings | MEDIUM | Identify all 11 n-Deklination nouns; fix Genitiv/Dativ/Akkusativ forms in all cases; re-deploy; search index may need rebuild if declined forms were indexed |
| Dative plural -n added to -s plural nouns | MEDIUM | Identify all 26 -s plural nouns; fix Dative plural forms; re-deploy |
| Noun schema structural conflict (cases key collision) | HIGH | Requires migrating existing 223 `cases` entries to new structure; updating grammar-features.json dataPath references; updating v2 API handler; re-deploy; test all noun lookups |
| Perfektum data missing from dictionary bank | MEDIUM | Write Perfektum data to dictionary/de/verbbank.json for all 148 verbs; re-deploy; test v2 API verb lookup |
| Search index bloated with declined forms | MEDIUM | Remove declined form entries from search-index.json; rebuild index; re-deploy; 24h CDN cache before clients see corrected index |
| Reflexive verb wrong pronoun in Perfektum | LOW | Fix pronoun agreement in affected entries; spot-check all 26 reflexive verbs; re-deploy |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Haben/sein assignment for dual-auxiliary verbs | Schema definition — add `dual_auxiliary` flag and `auxiliary_note` field | Spot-check: ausziehen and schwimmen have `dual_auxiliary: true`; all conjugated forms use the primary auxiliary |
| Separable verb ge- position error | Data entry — separable verbs processed as named group, participles stored explicitly | Spot-check: mitgenommen (NOT gemitgenommen), aufgestanden (NOT geaufgestanden) |
| Inseparable prefix verbs given ge- | Schema definition — add `inseparable: true` flag; data entry — explicit participles | Spot-check: besucht (NOT gebesucht), vergessen (NOT gevergessen) |
| Modal verbs treated as regular verbs | Data entry — modals processed separately with modal_note | All 7 modals have `auxiliary_note` or `modal_note`; möchten has no standalone participle |
| Reflexive pronoun agreement in Perfektum | Data entry — reflexive verbs verified across all 6 persons | Check ich/du/wir forms for 3 reflexive verbs: no "sich" for ich or du forms |
| Verb phrase entries treated as regular verbs | Data entry — 4 verbphrase entries processed outside main loop | All 4 verbphrase IDs have manually verified Perfektum forms |
| N-Deklination nouns declined as strong | Schema definition — `weak_masculine: true` flag; pre-entry audit | Spot-check: Bär Genitiv=Bären, Elefant Dativ=Elefanten |
| Noun `cases` schema conflict | Schema definition phase — structural decision made, documented in PROJECT.md | `ajv validate nounbank.json` passes with zero errors after schema change |
| Dative plural -n on -s plural nouns | Data generation — explicit -s plural check in generation script | All 26 -s plural nouns have Dative plural = Nominativ plural |
| Plural-only and uncountable nouns given wrong forms | Pre-entry cleanup — normalize plural markers; schema handling | Eltern has no singular declension; Mathematik has no plural declension |
| Verb preteritum sync discrepancy in dictionary bank | Integration phase — audit dictionary verbbank before writing Perfektum | `dictionary/de/verbbank.json` contains `conjugations.perfektum` for sein_verb after phase |
| Sein/haben/werden Perfektum irregular | Data entry — these 3 processed first as mandatory test cases | sein participle=gewesen, werden participle=geworden, haben participle=gehabt |
| Search index bloat from declined forms | Integration phase — explicit rule: no declined forms in search index | Search index entry count for nouns does not exceed current 1,641 |
| v2 API missing new noun declension key | Integration phase — v2 handler updated if new key used | v2 GET /api/vocab/v2/lookup/german/freund_noun response contains full declension data |

---

## Sources

- `vocabulary/core/de/verbbank.json` — direct inspection: 148 entries, 7 modals, 19 separable, 26 reflexive, 20 inseparable-prefix verbs identified
- `vocabulary/dictionary/de/verbbank.json` — direct inspection: confirmed preteritum absent for all 148 shared verbs (existing sync debt)
- `vocabulary/core/de/nounbank.json` — direct inspection: 331 entries, 223 with partial `cases` data (nominativ/akkusativ only), 2 with `declension` key, 25 uncountable, 2 plural-only, 26 with -s plural
- `vocabulary/schema/verb.schema.json` — confirmed no `inseparable`, `dual_auxiliary`, or `particip` fields present
- `vocabulary/schema/noun.schema.json` — confirmed `cases` key structure; identified structural conflict for full 4-case declension
- `vocabulary/grammar-features.json` — confirmed `grammar_perfektum` feature already registered; `cases.akkusativ.ubestemt` dataPath confirmed
- `api/vocab/v2/lookup/[language]/[wordId].js` — direct inspection: lines 213-220 show which noun/verb fields are passed through; `declension` already handled for adjective's `declension.positiv` check at line 252
- `vocabulary/dictionary/de/search-index.json` — 3,454 entries, 420 KB; no declined forms currently indexed; 1,641 noun base forms, 679 verb base forms
- `.planning/research/PITFALLS.md` (v1.1 research) — precedents: explicit form storage decision, dual-bank sync requirement, preteritum spot-check pattern
- German grammar knowledge: n-Deklination paradigm (Duden Grammatik §4); dative plural -n rule and -s exception; Perfektum auxiliary selection rules (Hammer's German Grammar); inseparable prefix list; modal Perfektum double-infinitive construction

---
*Pitfalls research for: Adding German Perfektum conjugations and noun declension to Papertek Vocabulary API (v1.2 milestone)*
*Researched: 2026-02-22*
