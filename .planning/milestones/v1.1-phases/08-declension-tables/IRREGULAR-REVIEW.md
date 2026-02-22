# Irregular Declension Forms — Human Review

> Generated: 2026-02-21
> Source: vocabulary/core/de/adjectivebank.json (via verify-declension.js)
> Purpose: Sanity-check all irregular declension stems. Scan for obvious errors
> like "hochem" (wrong) instead of "hohem" (correct).

## How to Use This Report

- **Positiv stem**: the base used for all positiv declined forms
- **stark nom.m**: maskulin nominativ stark (e.g., "ein hoher Berg")
- **stark dat.m**: maskulin dativ stark (e.g., "mit hohem Aufwand") — SC-3 critical check
- **stark nom.n**: neutrum nominativ stark (e.g., "ein hohes Haus")
- **Komp base**: the base form used for komparativ declension (full komparativ form)
- **komp stark nom.m**: komparativ maskulin nominativ stark (e.g., "ein höherer Berg")
- **Sup stem**: the superlativ stem from comparison.superlativ
- **sup schwach nom.m**: schwach maskulin nominativ (e.g., "der höchste Berg")

## Irregular Forms Table

| Adjective | Category | Pos stem | stark nom.m | stark dat.m | stark nom.n | Komp base | komp stark nom.m | Sup stem | sup schwach nom.m |
|-----------|----------|----------|-------------|-------------|-------------|-----------|-----------------|----------|-------------------|
| hoch | suppletive | hoh- | hoher | hohem | hohes | höher | höherer | höchst | höchste |
| gut | suppletive | gut | guter | gutem | gutes | besser | besserer | best | beste |
| viel | suppletive | viel | vieler | vielem | vieles | mehr | mehrerer | meist | meiste |
| dunkel | e-drop (-el) | dunkl- | dunkler | dunklem | dunkles | dunkler | dunklerer | dunkelst | dunkelste |
| flexibel | e-drop (-el) | flexibl- | flexibler | flexiblem | flexibles | flexibler | flexiblerer | flexibelst | flexibelste |
| teuer | e-drop (-er) | teur- | teurer | teurem | teures | teurer | teurerer | teuerst | teuerste |
| alt | umlaut | alt | alter | altem | altes | älter | älterer | ältest | älteste |
| arm | umlaut | arm | armer | armem | armes | ärmer | ärmerer | ärmst | ärmste |
| groß | umlaut | groß | großer | großem | großes | größer | größerer | größt | größte |
| hart | umlaut | hart | harter | hartem | hartes | härter | härterer | härtest | härteste |
| jung | umlaut | jung | junger | jungem | junges | jünger | jüngerer | jüngst | jüngste |
| kalt | umlaut | kalt | kalter | kaltem | kaltes | kälter | kälterer | kältest | kälteste |
| kurz | umlaut | kurz | kurzer | kurzem | kurzes | kürzer | kürzerer | kürzest | kürzeste |
| lang | umlaut | lang | langer | langem | langes | länger | längerer | längst | längste |
| scharf | umlaut | scharf | scharfer | scharfem | scharfes | schärfer | schärferer | schärfst | schärfste |
| stark | umlaut | stark | starker | starkem | starkes | stärker | stärkerer | stärkst | stärkste |
| warm | umlaut | warm | warmer | warmem | warmes | wärmer | wärmerer | wärmst | wärmste |
| krank | umlaut | krank | kranker | krankem | krankes | kränker | kränkerer | kränkst | kränkste |
| dumm | umlaut | dumm | dummer | dummem | dummes | dümmer | dümmerer | dümmst | dümmste |
| klug | umlaut | klug | kluger | klugem | kluges | klüger | klügerer | klügst | klügste |
| nass | umlaut | nass | nasser | nassem | nasses | nässer | nässerer | nässest | nässeste |
| gesund | umlaut | gesund | gesunder | gesundem | gesundes | gesünder | gesünderer | gesündest | gesündeste |
| schwach | umlaut | schwach | schwacher | schwachem | schwaches | schwächer | schwächerer | schwächst | schwächste |
| blind | cons-cluster | blind | blinder | blindem | blindes | blinder | blinderer | blindest | blindeste |
| rund | cons-cluster | rund | runder | rundem | rundes | runder | runderer | rundest | rundeste |
| mild | cons-cluster | mild | milder | mildem | mildes | milder | milderer | mildest | mildeste |
| wild | cons-cluster | wild | wilder | wildem | wildes | wilder | wilderer | wildest | wildeste |
| fremd | cons-cluster | fremd | fremder | fremdem | fremdes | fremder | fremderer | fremdest | fremdeste |

## Critical Checks

The following forms MUST appear exactly as shown (common error sites):

| What you see | What it should be | What would be WRONG |
|---|---|---|
| hoch stark.dat.m | **hohem** | hochem |
| dunkel stark.nom.m | **dunkler** | dunkeler |
| dunkel stark.dat.m | **dunklem** | dunkelem |
| teuer stark.nom.n | **teures** | teueres |
| teuer stark.dat.m | **teurem** | teuerem |
| schnell komp stark.nom.m | **schnellerer** | schneller |
| hoch komp stark.nom.m | **höherer** | höher |
| gut sup schwach.nom.m | **beste** | gütest, guteste |

## SC-3 Spot Check: hoch

### hoch — Full Positiv Declension Table

**Stark:**

| Case | m | f | n | pl |
|------|---|---|---|----|
| nominativ | hoher | hohe | hohes | hohe |
| akkusativ | hohen | hohe | hohes | hohe |
| dativ | hohem | hoher | hohem | hohen |
| genitiv | hohen | hoher | hohen | hoher |

**Schwach:**

| Case | m | f | n | pl |
|------|---|---|---|----|
| nominativ | hohe | hohe | hohe | hohen |
| akkusativ | hohen | hohe | hohe | hohen |
| dativ | hohen | hohen | hohen | hohen |
| genitiv | hohen | hohen | hohen | hohen |

**Gemischt:**

| Case | m | f | n | pl |
|------|---|---|---|----|
| nominativ | hoher | hohe | hohes | hohen |
| akkusativ | hohen | hohe | hohes | hohen |
| dativ | hohen | hohen | hohen | hohen |
| genitiv | hohen | hohen | hohen | hohen |



*Expected: hoher/hohe/hohes/hohem/hohen/hohes/hohes/hoher/hohes/hoher — NOT hoch- prefix in any form*

## Verification Status

Run `node .planning/phases/08-declension-tables/verify-declension.js` for automated spot-checks.
All spot-checks: 87 passed, 0 failed as of 2026-02-21.
