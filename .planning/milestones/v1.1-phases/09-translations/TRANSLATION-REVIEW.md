# Translation Review Report — Phase 9 (German Adjectives)

**Generated:** 2026-02-21
**Scope:** de-nb and de-en adjectivebank.json (365 entries each)
**Purpose:** Human spot-check guide for translation quality, false friend accuracy, and polysemy handling

---

## How to Use This Report

1. **False Friends table** — highest priority. Verify these manually in the final JSON files.
2. **Multi-meaning entries** — review `alternativeMeanings` for accuracy and completeness.
3. **Nuanced entries** — spot-check these translations for register and context appropriateness.
4. **Run verify-translations.js** to confirm all automated checks still pass after any edits.

---

## 1. False Friends (German-Norwegian)

German-Norwegian false friends where the German adjective looks identical or similar to a Norwegian word but has a different meaning. These are the highest-risk entries for incorrect translations.

| _id | German Word | German Meaning | Norwegian False Friend | Correct nb Translation | Risk |
|-----|-------------|----------------|------------------------|------------------------|------|
| `arm_adj` | arm | poor, destitute | arm (body part) | fattig | High |
| `fest_adj` | fest | firm, solid, fixed | fest (party) | fast | High |
| `brav_adj` | brav | well-behaved, obedient | modig/tapper (brave/courageous) | snill | High |
| `rein_adj` | rein | pure, clean | rein (reindeer) | ren | High |
| `eventuell_adj` | eventuell | possibly, perhaps | eventuelt (in that case/if so) | muligens | High |
| `aktuell_adj` | aktuell | current, topical | aktuell (relevant) | aktuell | Medium |
| `genial_adj` | genial | brilliant, inspired | genial (genial/good-natured) | N/A | Medium |
| `simpel_adj` | simpel | simple, plain | simpel (mean/vulgar in nb) | N/A | Medium |

### Verification Commands

Check each false friend in the actual file:
```bash
node -e "
const nb = JSON.parse(require('fs').readFileSync('vocabulary/translations/de-nb/adjectivebank.json','utf8'));
['arm_adj','fest_adj','brav_adj','rein_adj','eventuell_adj','aktuell_adj','genial_adj','simpel_adj'].forEach(k => {
  console.log(k + ':', nb[k] ? nb[k].translation : 'MISSING');
});
"
```

---

## 2. Multi-Meaning Entries (alternativeMeanings)

Entries where the German adjective has genuinely distinct secondary senses beyond the primary translation. All 30 entries listed below use the `alternativeMeanings` field.

| _id | Primary nb | Primary en | Secondary Meanings (from alternativeMeanings) | Count |
|-----|-----------|------------|----------------------------------------------|-------|
| `aergerlich_adj` | irriterende | annoying | "irritert" (om person som er sint eller ergerlig) | 1 |
| `aufgeregt_adj` | spent | excited | "opprørt/opphisset" (om person som er agitert eller urolig) | 1 |
| `bestimmt_adj` | bestemt | certain | "sikkert/garantert" (som adverb: "bestimmt" = helt sikkert) | 1 |
| `blind_adj` | blind | blind | "uvitende/naiv" (overført: blind for egne feil eller situasjonen) | 1 |
| `bloed_adj` | dum | stupid | "irriterende" (uformelt om noe ergerlig eller kjedelig) | 1 |
| `bloss_adj` | bare | bare | "naken/ubeskyttet" (som adjektiv om hender eller kropp uten beskyttelse) | 1 |
| `boese_adj` | sint | angry | "slem/ond" (om karakter eller oppførsel — moralsk negativ) | 1 |
| `falsch_adj` | feil | wrong | "falsk/uærlig" (om person eller handling som er uoppriktig) | 1 |
| `faul_adj` | lat | lazy | "råtten" (om mat eller organisk materiale som har gått dårlig) | 1 |
| `frei_adj` | fri | free | "gratis" (om noe som ikke koster penger) | 1 |
| `ganz_adj` | hel | whole | "ganske/nokså" (som adverb: forsterker av adjektiv — "ganz gut" = ganske bra) | 1 |
| `gerade_adj` | rett | straight | "nettopp" (som adverb om noe som skjedde øyeblikk siden) | 1 |
| `glatt_adj` | glatt | smooth | "rett og slett" (forsterker: glatt unmöglich = rett og slett umulig) | 1 |
| `gleich_adj` | lik | equal | "straks/snart" (som adverb om noe som skjer om litt) | 1 |
| `hart_adj` | hard | hard | "tøff/brutal" (om behandling eller situasjon som er krevende) | 1 |
| `kaputt_adj` | ødelagt | broken | "utslitt/ferdig" (uformelt om person som er totalt utmattet) | 1 |
| `komisch_adj` | merkelig | strange | "morsom/komisk" (eldre bruk — i dag oftest "merkelig" i dagligtale) | 1 |
| `leicht_adj` | lett | light | "enkel/ukomplisert" (om oppgave eller forståelse) | 1 |
| `locker_adj` | løs | loose | "avslappet/uformell" (om person eller atmosfære — ikke anstrengt) | 1 |
| `natuerlich_adj` | naturlig | natural | "selvfølgelig" (som adverb/bekreftelse: "natürlich!" = selvfølgelig!) | 1 |
| `richtig_adj` | riktig | correct | "skikkelig/ordentlig" (som forsterker: "ein richtiges Problem" = et skikkelig problem) | 1 |
| `sauer_adj` | sur | sour | "irritert/sint" (overført: person som er sur/irritert) | 1 |
| `scharf_adj` | skarp | sharp | "sterk/krydret" (om mat med sterk smak, mye chili eller krydder) | 1 |
| `schuldig_adj` | skyldig | guilty | "å skylde (penger)" ("Ich bin dir etwas schuldig" = jeg skylder deg noe) | 1 |
| `schwer_adj` | tung | heavy | "vanskelig" (om oppgave, problem eller situasjon som er krevende) | 1 |
| `tief_adj` | dyp | deep | "lav" (om stemme, tone eller pris) | 1 |
| `trocken_adj` | tørr | dry | "kjedelig" (overført: om noe uinspirerende eller kjedelig) | 1 |
| `unheimlich_adj` | uhyggelig | eerie | "utrolig/veldig" (forsterker i uformelt talespråk) | 1 |
| `voll_adj` | full | full | "full (av alkohol)" (dagligtale, uformelt) | 1 |
| `wahnsinnig_adj` | gal | insane | "utrolig/enormt" (forsterker i dagligtale: "wahnsinnig schön" = utrolig vakkert) | 1 |

### Review Notes for alternativeMeanings

- Each entry should have a clear usage context that distinguishes it from the primary meaning
- The `context` field should be short (2-5 words): "cooking", "figurative use", "technical", etc.
- If a secondary meaning is just a synonym, remove it from alternativeMeanings (it belongs in synonyms)

---

## 3. Nuanced/Review-Recommended Entries

Entries where the translation choice is context-dependent, has register implications, or reflects a judgment call that a native speaker should verify.

| _id | nb Translation | en Translation | Review Reason |
|-----|---------------|----------------|---------------|
| `spaet_adj` | sen | late | Time-relative adverb often used as adjective; context-dependent |
| `frueh_adj` | tidlig | early | Time-relative; "tidlig" is correct but "for tidlig" is also common |
| `streng_adj` | streng | strict | Connotation varies: strict teacher vs strict diet vs strict rules |
| `krank_adj` | syk | sick | False partial cognate: Norwegian "krank" is archaic; "syk" is correct |
| `wild_adj` | vill | wild | Multiple senses: wild animal, wild party, wild enthusiasm — context matters |
| `scharf_adj` | skarp | sharp | Very polysemous: sharp knife, spicy food, sharp-looking (attractive) |
| `faul_adj` | lat | lazy | Two senses: lazy (person) and rotten (food) — very different contexts |
| `schwer_adj` | tung | heavy | Heavy (physical) vs difficult (metaphorical) — both common |
| `leicht_adj` | lett | light | Light (physical) vs easy (metaphorical) — mirror of schwer |
| `hart_adj` | hard | hard | Hard (physical), hard (difficult), harsh (person) — context-dependent |

---

## 4. Statistics

| Metric | Count |
|--------|-------|
| Total entries (nb) | 365 |
| Total entries (en) | 365 |
| Entries with alternativeMeanings | 30 |
| Entries with 1 example | 0 |
| Entries with 2 examples | 330 |
| Entries with 3+ examples | 35 |
| False friends documented | 8 |
| Nuanced entries flagged | 10 |
| Slash translations remaining | 0 |
| Automated check failures | 0 |

---

## 5. Automated Verification Summary

Run: `node .planning/phases/09-translations/verify-translations.js`

**Status at generation time:** ALL CHECKS PASSED


---

*Report generated by verify-translations.js on 2026-02-21*
