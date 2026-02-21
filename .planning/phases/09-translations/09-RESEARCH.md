# Phase 9: Translations - Research

**Researched:** 2026-02-21
**Domain:** JSON translation data generation at scale — German adjective bank (nb + en language pairs)
**Confidence:** HIGH — all findings from direct inspection of source files in this repository

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Norwegian translation depth:**
- Full rich format for all 259 new entries: translation + explanation + synonyms + examples
- Upgrade the 24 existing simple nb entries (e.g. gelb_adj: "gul") to the same rich format
- Total nb work: 259 new entries + 24 upgrades = 283 entries needing rich data
- Explanation field written in Norwegian (Bokmål only)
- Bokmål only — Nynorsk will be a separate language pair (de-nn) in a future phase

**English translation depth:**
- Full rich format matching nb: translation + explanation + synonyms + examples
- Upgrade all 106 existing simple en entries to the rich format
- Total en work: 259 new entries + 106 upgrades = 365 entries needing rich data
- Explanation field written in English
- Full parity between nb and en — same richness level

**Example sentences:**
- Same German sentences used in both nb and en translations — only the target-language translation differs
- Number of examples per entry: Claude's discretion based on word complexity

**Multi-meaning handling:**
- `translation` field contains the primary meaning only (not slash-separated multiple meanings)
- `synonyms` array contains target-language synonyms for the primary meaning only
- New `alternativeMeanings` field added for distinct secondary meanings of the German word
- `alternativeMeanings` format: array of objects with `meaning` (string) and `context` (string) fields
  - Example: `{"meaning": "boring", "context": "figurative"}` for trocken
- This keeps synonyms pure and makes secondary meanings programmable for consuming apps

**Translation sourcing:**
- AI-generated translations with spot-checking
- Spot-check focus: false friends (German-Norwegian cognates with different meanings) and adjectives with irregular/nuanced meanings
- Generate a verification report (markdown) listing all flagged entries with reasoning and suggested translations for user review before commit

### Claude's Discretion

- Number of example sentences per entry (based on word complexity)
- Number of synonyms per entry
- Which entries to flag as false friends or requiring extra review
- Exact wording of explanations

### Deferred Ideas (OUT OF SCOPE)

- Nynorsk (de-nn) translation pair — future phase/milestone
- Translation schema validation (if alternativeMeanings needs schema support) — may be handled during planning
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BANK-04 | Norwegian (nb) translations provided for all new adjective entries | 259 new entries in core bank have no matching key in `vocabulary/translations/de-nb/adjectivebank.json`. File currently has 106 entries; 24 of those are simple (translation-only) and need upgrade. Total nb work: 283 entries. |
| BANK-05 | English (en) translations provided for all new adjective entries | 259 new entries in core bank have no matching key in `vocabulary/translations/de-en/adjectivebank.json`. All 106 existing en entries are simple (translation-only). Total en work: 365 entries (259 new + 106 upgrades). |
</phase_requirements>

---

## Summary

Phase 9 is a data-population phase with a clearly defined scope. The core bank now has 365 adjective entries; the translation files (`de-nb/adjectivebank.json` and `de-en/adjectivebank.json`) each have only 106 entries — all 259 new adjectives are missing. Additionally, the existing 106 nb entries are in mixed quality (24 have only a `translation` field; the other 82 are already at varying levels of richness), and all 106 existing en entries have only a `translation` field. Phase 9 closes all three gaps.

The rich translation format is already established by the existing nb entries: `translation` (string), `explanation` (object with `_description` key), `synonyms` (array of strings), and `examples` (array of `{sentence, translation}` objects). Phase 9 introduces one new field: `alternativeMeanings` (array of `{meaning, context}` objects), used for German adjectives with genuinely distinct secondary senses (e.g., `trocken` = dry / boring; `fest` = firm / party in Norwegian false-friend context). The existing slash-separated `translation` values in 23 nb entries (e.g., `"tørr/kjedelig"`) must be cleaned up: the primary meaning goes in `translation`, secondary distinct meanings move to `alternativeMeanings`.

There is no automated generation possible for this phase — translation quality, example sentence selection, and explanation wording require language knowledge. The execution approach mirrors other data-population phases: Claude generates all content inline in a single plan, writes the updated files directly, and produces a human-readable verification report of flagged entries (false friends, multi-meaning words, nuanced adjectives) for user review before commit.

**Primary recommendation:** Generate all 648 entries (283 nb + 365 en) in a single plan. Use a Node.js merge script to inject new entries into the existing files, sorting alphabetically by key, and produce a verification report. Do NOT attempt to batch by CEFR level or alphabet — the volume is manageable in one shot at ~7-8 lines per entry.

---

## Current State Analysis

### File: `vocabulary/translations/de-nb/adjectivebank.json`

| Category | Count | Action |
|----------|-------|--------|
| Entries with full rich format (translation + explanation + examples) | 82 | No change — already rich |
| Simple entries (translation field only) — need upgrade | 24 | Add explanation + synonyms + examples |
| New entries missing entirely | 259 | Add full rich entry |
| **Total nb file after phase** | **365** | |

**The 24 simple nb entries that need upgrade:**
`gelb_adj`, `schwarz_adj`, `weiss_adj`, `grau_adj`, `braun_adj`, `intelligent_adj`, `faul_adj`, `musikalisch_adj`, `zufrieden_adj`, `gemuetlich_adj`, `bunt_adj`, `frisch_adj`, `sicher_adj`, `wach_adj`, `sympathisch_adj`, `stressig_adj`, `hoch_adj`, `gern_adj`, `anstrengend_adj`, `hart_adj`, `weit_adj`, `geheim_adj`, `recht_adj`, `ueberrascht_adj`

### File: `vocabulary/translations/de-en/adjectivebank.json`

| Category | Count | Action |
|----------|-------|--------|
| All existing entries (translation field only) | 106 | Upgrade all to rich format |
| New entries missing entirely | 259 | Add full rich entry |
| **Total en file after phase** | **365** | |

### Manifest: Both `de-nb/manifest.json` and `de-en/manifest.json`

Currently show `"adjectivebank.json": 108` (includes `_metadata` in count — actual data entries = 106). After phase: update to `365`.

**Note:** The manifests also show `"totalWords": 870`. After adding 259 adjectives, totalWords becomes 1129 for both. This must be updated.

---

## Architecture Patterns

### Rich Translation Entry Format

The established format for a full rich adjective translation entry (from existing nb entries):

```json
"trocken_adj": {
  "translation": "tørr",
  "explanation": {
    "_description": "Betyr \"tørr\" (om overflate, vær eller mat). I overført betydning kan det bety noe kjedelig eller uinspirerende."
  },
  "synonyms": ["uttørket", "turr"],
  "examples": [
    { "sentence": "Das Handtuch ist trocken.", "translation": "Håndkleet er tørt." },
    { "sentence": "Es ist heute sehr trocken.", "translation": "Det er veldig tørt i dag." },
    { "sentence": "Er hat einen trockenen Humor.", "translation": "Han har en tørr humor." }
  ],
  "alternativeMeanings": [
    { "meaning": "kjedelig", "context": "overført, om noe uinspirerende eller kjedelig" }
  ]
}
```

Key structural rules (verified from existing data):
- `explanation` is an object with a single `_description` key (not a plain string) — this is a project-wide convention across all translation banks
- `synonyms` is an array of bare strings (no objects, no counts)
- `examples` each have `sentence` (German) and `translation` (target language)
- `alternativeMeanings` is a new field — not in existing entries — introduced in Phase 9

### Translation vs alternativeMeanings vs synonyms

| Field | Contains | When to use |
|-------|----------|-------------|
| `translation` | Primary meaning (one language, one sense) | Always — the core translation |
| `synonyms` | Target-language synonyms for the PRIMARY meaning | When multiple target words map to the same German sense |
| `alternativeMeanings` | Genuinely DIFFERENT German senses | When the German word has distinct meanings that would mislead learners if left unstated |

**Examples of proper split:**
- `lustig`: translation = "morsom", synonyms = ["gøy", "komisk"] — these are all the same sense
- `trocken`: translation = "tørr", alternativeMeanings = [{"meaning": "kjedelig", "context": "overført"}] — these are different senses

### Slash-separated translation cleanup (23 existing nb entries)

The current nb file has 23 entries with slash-separated primary meanings (e.g., `"morsom / gøy"`, `"sint / slem"`). Under the new rules:
- If the slash separates synonyms (same meaning): keep in `translation` OR move the secondary synonym to `synonyms`
- If the slash separates distinct meanings: split — primary meaning to `translation`, distinct secondary meaning to `alternativeMeanings`

The locked decision states: `translation` field contains primary meaning only. So ALL slash-separated values in the existing 82 nb entries need evaluation during upgrade of the 24 simple entries and when generating new content.

**Important:** The 23 slash-separated entries are NOT all in the simple-24 upgrade list. Some of them (like `trocken_adj`, `toll_adj`, `schoen_adj`) already have rich content but still have slash-separated `translation`. These must also be cleaned up in the same pass — the slash cleanup applies to ALL 106 existing entries, not just the 24 simple ones.

---

## Execution Approach

### Single-Plan Strategy

Based on prior phase execution patterns (Phases 6, 7, 8), this phase should execute as a single plan. The volume is:
- 648 total entries to write (283 nb + 365 en)
- Estimated 7-10 lines per entry in JSON = ~5,000-6,500 lines of new content
- Existing files: 800 lines (nb) + 327 lines (en)
- Final files: estimated 3,000-3,500 lines each

This is manageable in a single execution. Claude generates all translation content inline — no generation script needed (unlike Phase 7 comparison data or Phase 8 declension tables, which could use rule engines). The "script" in this phase is a merge utility that:
1. Reads the existing translation files
2. Injects new entries (pre-written as JavaScript objects in the script itself)
3. Upgrades existing simple entries
4. Sorts alphabetically by key
5. Writes the merged file
6. Updates manifests

### Recommended Script Pattern

```javascript
// generate-translations.js
// Pattern: embed all translation data as const, then merge into existing files

import { readFileSync, writeFileSync } from 'fs';

const NEW_NB_ENTRIES = {
  // 259 new entries + 24 upgrades
  "abhaengig_adj": {
    "translation": "avhengig",
    "explanation": { "_description": "..." },
    "synonyms": [...],
    "examples": [...]
  },
  // ... all 283 entries
};

const NEW_EN_ENTRIES = {
  // 259 new entries + 106 upgrades
  "abhaengig_adj": {
    "translation": "dependent",
    "explanation": { "_description": "..." },
    "synonyms": [...],
    "examples": [...]
  },
  // ... all 365 entries
};

function mergeAndWrite(filePath, newEntries) {
  const existing = JSON.parse(readFileSync(filePath, 'utf8'));
  const metadata = existing._metadata;
  // Merge: new entries override existing for upgrades, new entries are added
  const merged = { _metadata: metadata };
  // Collect all non-metadata keys from both existing and new
  const allKeys = new Set([
    ...Object.keys(existing).filter(k => k !== '_metadata'),
    ...Object.keys(newEntries)
  ]);
  // Sort alphabetically
  for (const key of [...allKeys].sort()) {
    merged[key] = newEntries[key] ?? existing[key];
  }
  // Update metadata counts
  const entryCount = Object.keys(merged).filter(k => k !== '_metadata').length;
  writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`Wrote ${entryCount} entries to ${filePath}`);
}
```

### Verification Report Format

Following the IRREGULAR-REVIEW.md pattern from Phase 8, produce a `TRANSLATION-REVIEW.md` with:
- Flagged false friends (German-Norwegian cognates with different meanings)
- Multi-meaning entries (with reasoning for alternativeMeanings choices)
- Nuanced/irregular meaning entries
- A table format for human spot-checking

---

## False Friends and Spot-Check Priorities (nb)

These entries require extra care for Norwegian learners. The verification report should include all of these with explicit reasoning.

### Confirmed False Friends (German ≠ Norwegian)

| German word | German meaning | Norwegian false friend | Norwegian correct translation |
|-------------|---------------|----------------------|-------------------------------|
| `arm` | poor (financially) | arm (body part) | fattig |
| `fest` | firm/solid/fixed | fest (party/celebration) | fast, solid |
| `rein` | pure/clean | rein (reindeer) | ren, pur |
| `aktuell` | current/topical | aktuell (relevant) | aktuell* (close but not identical) |
| `eventuell` | possibly/perhaps | eventuelt (if necessary) | muligens, kanskje |
| `brav` | nice/obedient/well-behaved | brav (brave/courageous) | snill, lydig (NOT modig/tapper) |

*`aktuell` in German means "current" (heute aktuell = topical today). Norwegian "aktuell" means "relevant" — a subtle but real difference. Explanation note recommended.

### Adjectives Needing alternativeMeanings in nb

| _id | Primary translation (nb) | Secondary distinct meaning | Context |
|-----|--------------------------|---------------------------|---------|
| `fest_adj` | fast/solid | fest/fest (celebration) | NOT a translation — just a cognate warning |
| `glatt_adj` | glatt (smooth) | glatt (slippery) — but in German also means "outright/simply" | figurativ |
| `scharf_adj` | skarp | krydret (spicy food) | matlaging |
| `sauer_adj` | sur | irritert/sint | overført |
| `schwer_adj` | tung | vanskelig | overført |
| `leicht_adj` | lett | enkel/ukomplisert | overført |
| `tief_adj` | dyp | lav (of voice/price) | kontekstuelt |
| `locker_adj` | løs | avslappet/uformell | overført |
| `blind_adj` | blind | naiv/uvitende | overført |
| `voll_adj` | full | full (drunk) | dagligtale, uformell |
| `ganz_adj` | hel/full | ganske (intensifier) | grammatisk funksjon |

### Adjectives Already in nb That Need slash-split cleanup

All 23 existing entries with slash-separated translations must be evaluated:

| _id | Current value | Recommendation |
|-----|---------------|----------------|
| `trocken_adj` | tørr/kjedelig | Split: primary=tørr, alternativeMeanings=[{meaning:kjedelig, context:overført}] |
| `toll_adj` | flott / kjempebra | Synonyms: primary=flott, synonyms=[kjempebra, fantastisk] |
| `schoen_adj` | pen / fin | Synonyms: primary=pen, synonyms=[fin, vakker] |
| `lustig_adj` | morsom / gøy | Synonyms: primary=morsom, synonyms=[gøy, komisk] |
| `gut_adj` | god / bra | Synonyms: primary=god, synonyms=[bra, utmerket] |
| `faul_adj` | lat / doven | Synonyms: primary=lat, synonyms=[doven] |
| `schlau_adj` | smart / lur | Synonyms: primary=smart, synonyms=[lur, klok] |
| `lecker_adj` | godt / smakfullt | Synonyms: primary=godt, synonyms=[smakfullt, deilig] |
| `bloed_adj` | dum / irriterende | Split: these are different senses in context |
| `brav_adj` | snill / lydig | Synonyms: primary=snill, synonyms=[lydig, artig] |
| `richtig_adj` | riktig / skikkelig | Split: riktig=correct, skikkelig=proper/real are different |
| `einfach_adj` | enkel / lett | Synonyms: primary=enkel, synonyms=[lett, ukomplisert] |
| `gespannt_adj` | spent / nysgjerrig | Synonyms: primary=spent, synonyms=[nysgjerrig] |
| `gesund_adj` | sunn / sunt | Same word: primary=sunn (adjective agreement with neuter) |
| `erschoepft_adj` | utmattet / utslitt | Synonyms: primary=utmattet, synonyms=[utslitt, ferdig] |
| `traurig_adj` | trist / lei seg | Synonyms: primary=trist, synonyms=[lei seg, nedtrykt] |
| `aufgeregt_adj` | spent / opphisset | Split: spent=excited, opphisset=agitated/wound up |
| `anstrengend_adj` | anstrengende / slitsom | Synonyms: primary=anstrengende, synonyms=[slitsom] |
| `schlimm_adj` | ille / galt | Synonyms: primary=ille, synonyms=[galt, alvorlig] |
| `boese_adj` | sint / slem | Split: sint=angry, slem=mean/evil are different |
| `heiss_adj` | varmt / het | Same sense: primary=varm, synonyms=[het] |
| `recht_adj` | rett / riktig | Synonyms: primary=rett, synonyms=[riktig, korrekt] |
| `lila_adj` | lilla / fiolett | Synonyms: primary=lilla, synonyms=[fiolett] |

---

## Volume and Work Scope

| File | Current entries | Final entries | New | Upgraded |
|------|----------------|---------------|-----|----------|
| `de-nb/adjectivebank.json` | 106 | 365 | 259 | 24 (simple→rich) + 23 (slash cleanup) |
| `de-en/adjectivebank.json` | 106 | 365 | 259 | 106 (all simple→rich) |

**Work units:**
- 259 entries: generate new nb AND en simultaneously (same German word, parallel treatment)
- 24 entries: upgrade existing simple nb entries
- 82 entries: clean up slash-separated translations in existing rich nb entries (only the translation field, keep existing examples/synonyms)
- 106 entries: upgrade all existing en entries from translation-only to rich

**Scale check:**
- Current nb file: 800 lines / 106 entries = 7.5 lines/entry average
- New rich format with all fields: ~10-15 lines/entry
- Final nb file estimated: ~4,500-5,500 lines
- This is manageable as a single generated JSON file

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sorting merged JSON keys | Custom sort function | Standard `.sort()` on extracted keys | ASCII-sort on `_id` strings (umlauts transliterated already — keys are ASCII) |
| Deduplication | Complex diff logic | Simple `newEntries[key] ?? existing[key]` merge | New entries always win for upgrades; no conflict resolution needed |
| Manifest count update | Separate manifest script | Inline in same merge script | Only two fields change: `adjectivebank.json` count and `totalWords` |

**Key insight:** Unlike Phases 7 and 8, no rule engine can generate translation content — this is linguistic data requiring human language knowledge. Claude must generate all content directly. The "script" is just a merge/sort utility to apply the pre-written content correctly into the files.

---

## Common Pitfalls

### Pitfall 1: Slash-separated translations bleed into new entries
**What goes wrong:** Author generates new entries with same slash-separated pattern (`"scharf": "scharf / spitz"`) that the locked decision prohibits.
**Why it happens:** Existing entries model the wrong pattern. Old format was slash-separated; new format splits meanings.
**How to avoid:** Generate primary meaning only in `translation`; use `synonyms` for near-synonyms, `alternativeMeanings` for genuinely different senses.
**Warning signs:** Any `translation` value containing `/` after Phase 9.

### Pitfall 2: Upgrading only the 24 simple nb entries and missing the 82 rich-but-slash-contaminated entries
**What goes wrong:** 23 existing rich nb entries still have slash-separated `translation` field after the phase.
**Why it happens:** The CONTEXT.md says "24 simple entries need upgrade" but the slash cleanup applies to the translation field of ALL 106 existing entries.
**How to avoid:** Treat slash cleanup as a separate pass on all 106 existing nb entries, not just the 24 simple ones.

### Pitfall 3: `_description` key omitted from `explanation` object
**What goes wrong:** `"explanation": "Betyr tørt..."` (string) instead of `"explanation": {"_description": "Betyr tørt..."}`
**Why it happens:** The explanation wrapping in an object with `_description` key is non-obvious — looks like over-engineering.
**How to avoid:** Follow the project pattern exactly. The `_description` key is a project-wide convention across ALL translation banks (193 occurrences found in current files). The consuming app likely uses this key to display optional metadata.
**Warning signs:** Any `explanation` value that is a plain string instead of `{"_description": "..."}`.

### Pitfall 4: Example sentences not shared between nb and en
**What goes wrong:** Different German sentences in nb vs en examples for the same adjective.
**Why it happens:** Generated independently without cross-checking.
**How to avoid:** Generate nb first (or generate both simultaneously). The locked decision states: same German `sentence` in both; only `translation` differs.

### Pitfall 5: Manifest count not updated
**What goes wrong:** `de-nb/manifest.json` and `de-en/manifest.json` still show `adjectivebank.json: 108` (or 106) and `totalWords: 870`.
**Why it happens:** Manifest update is a separate step that's easy to forget.
**How to avoid:** Update manifests in the same merge script. New counts: `adjectivebank.json: 365`, `totalWords: 1129`.

### Pitfall 6: false friends not flagged for review
**What goes wrong:** `arm_adj` translated as `arm` (the body part word in Norwegian) instead of `fattig` (poor financially).
**Why it happens:** German-Norwegian cognate trap — the words look and sound the same.
**How to avoid:** Generate the TRANSLATION-REVIEW.md verification report as a mandatory artifact. Include all confirmed false friends table from this research doc.

---

## Code Examples

### Merge script pattern (from Phase 6/7 project convention)

```javascript
// Source: project pattern established in Phase 6 (generate-stubs.js) and Phase 7 (generate-comparison.js)
import { readFileSync, writeFileSync } from 'fs';

function processTranslationFile(filePath, newAndUpgradedEntries) {
  const existing = JSON.parse(readFileSync(filePath, 'utf8'));
  const { _metadata, ...existingEntries } = existing;

  // Merge: new/upgraded entries override existing; sort alphabetically by key
  const merged = { ...existingEntries, ...newAndUpgradedEntries };
  const sortedKeys = Object.keys(merged).sort();

  const result = { _metadata };
  for (const key of sortedKeys) {
    result[key] = merged[key];
  }

  const entryCount = sortedKeys.length;
  writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  return entryCount;
}
```

### Rich entry structure — canonical examples

**Norwegian (nb) — entry with alternativeMeanings:**
```json
"fest_adj": {
  "translation": "fast",
  "explanation": {
    "_description": "Betyr \"fast\", \"solid\" eller \"bestemt\". NB: på norsk betyr \"fest\" en fest/selskap — helt annen betydning enn det tyske adjektivet."
  },
  "synonyms": ["solid", "stabil", "bestemt"],
  "examples": [
    { "sentence": "Das Seil ist fest.", "translation": "Taustrenget er fast." },
    { "sentence": "Ich halte es fest.", "translation": "Jeg holder det fast." },
    { "sentence": "Sie hat eine feste Meinung.", "translation": "Hun har en bestemt mening." }
  ]
}
```

**Norwegian (nb) — entry with alternativeMeanings:**
```json
"scharf_adj": {
  "translation": "skarp",
  "explanation": {
    "_description": "Betyr \"skarp\". Kan brukes om knivsegger, kritikk, syn — eller om sterk/krydret smak."
  },
  "synonyms": ["spiss", "hvass"],
  "examples": [
    { "sentence": "Das Messer ist scharf.", "translation": "Kniven er skarp." },
    { "sentence": "Er hat einen scharfen Blick.", "translation": "Han har et skarpt blikk." },
    { "sentence": "Das Essen ist sehr scharf.", "translation": "Maten er veldig sterk/krydret." }
  ],
  "alternativeMeanings": [
    { "meaning": "sterk/krydret", "context": "om mat med mye chili eller krydder" }
  ]
}
```

**English (en) — entry:**
```json
"scharf_adj": {
  "translation": "sharp",
  "explanation": {
    "_description": "Means 'sharp'. Used for knife edges, criticism, eyesight — or for strong/spicy flavor."
  },
  "synonyms": ["keen", "acute"],
  "examples": [
    { "sentence": "Das Messer ist scharf.", "translation": "The knife is sharp." },
    { "sentence": "Er hat einen scharfen Blick.", "translation": "He has a sharp eye." },
    { "sentence": "Das Essen ist sehr scharf.", "translation": "The food is very spicy." }
  ],
  "alternativeMeanings": [
    { "meaning": "spicy/hot", "context": "for food with a strong, peppery flavor" }
  ]
}
```

---

## File and Storage Pattern

Phase 9 writes to translation files ONLY — NOT to the core or dictionary banks. This is a single-storage phase (unlike Phases 5-8 which used dual-bank writes).

| File | Action | Count change |
|------|--------|-------------|
| `vocabulary/translations/de-nb/adjectivebank.json` | Merge new + upgraded entries | 106 → 365 |
| `vocabulary/translations/de-en/adjectivebank.json` | Merge new + upgraded entries | 106 → 365 |
| `vocabulary/translations/de-nb/manifest.json` | Update adjectivebank count + totalWords | 108 → 365, 870 → 1129 |
| `vocabulary/translations/de-en/manifest.json` | Update adjectivebank count + totalWords | 108 → 365, 870 → 1129 |

**Note on dict banks:** `vocabulary/translations/de-nb-dict/` and `vocabulary/translations/de-en-dict/` contain only `generalbank.json`, `nounbank.json`, `verbbank.json` — no adjectivebank. No action needed in dict translation banks.

**API routing:** The v1 translations API routes directly to `vocabulary/translations/{pair}/` files. No API changes needed — the existing handler at `api/vocab/v1/translations/[pair].js` will serve the new content automatically after deployment.

---

## Verification Report Artifact

The TRANSLATION-REVIEW.md artifact (mandatory, produced by the plan script) should follow the IRREGULAR-REVIEW.md pattern from Phase 8:

```markdown
# Translation Review — German Adjective Bank

> Generated: [date]
> Purpose: Human spot-check of false friends, multi-meaning entries, nuanced translations.
> Review before committing.

## False Friends (German-Norwegian)

| _id | German | German meaning | Norwegian cognate | Correct nb translation | Risk level |
|-----|--------|---------------|-------------------|----------------------|------------|
| arm_adj | arm | poor (financial) | arm = limb | fattig | HIGH |
| fest_adj | fest | firm/fixed | fest = party | fast, solid | HIGH |
| brav_adj | brav | well-behaved | brav = brave | snill, lydig | HIGH |
| rein_adj | rein | pure/clean | rein = reindeer | ren, pur | MEDIUM |

## Multi-meaning entries (alternativeMeanings used)

| _id | Primary translation | alternativeMeanings | Reasoning |
|-----|--------------------|--------------------|-----------|
| scharf_adj | skarp/sharp | sterk/krydret (spicy) | German scharf covers both sharp and spicy |
| ... | ... | ... | ... |

## Nuanced/review-recommended entries

| _id | nb translation | en translation | Flag reason |
|-----|----------------|----------------|-------------|
| aktuell_adj | aktuell (current) | current/topical | German aktuell ≠ exactly Norwegian aktuell |
| eventuell_adj | muligens | possibly | German "eventuell" is weaker than Norwegian "eventuelt" |
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Slash-separated translations (`"tørr/kjedelig"`) | Split: `translation` + `alternativeMeanings` | Makes data programmable — consuming apps can show/hide secondary meanings |
| Simple translation-only entries for 106 en adjectives | Full rich format (explanation + synonyms + examples) | Richer data for English-speaking learners and apps |

---

## Open Questions

1. **Manifest count discrepancy**
   - What we know: The manifests currently show `"adjectivebank.json": 108` but the file has 106 data entries (108 = 106 entries + _metadata key, counted incorrectly at generation time — see existing manifest at Phase 6 time)
   - What's unclear: Whether the manifest counts `_metadata` as an entry or not. Current value is 108 for 106 data entries — suggests metadata IS counted.
   - Recommendation: Inspect existing manifest logic. If 108 = 106 data + metadata + 1 (off-by-one?), then 365 data entries → manifest count should be 365. The most defensible approach: count only keys that don't start with `_`.

2. **`alternativeMeanings` and schema validation**
   - What we know: There is no schema for translation files (`vocabulary/schema/` has no translation schema). The CONTEXT.md deferred "translation schema validation" to planning.
   - What's unclear: Whether adding `alternativeMeanings` to entries requires any schema update.
   - Recommendation: Since no translation schema exists, no schema update is needed. The field can be added freely. If schema validation for translation files becomes a future requirement, `alternativeMeanings` should be added to the schema at that time.

3. **Slash cleanup scope for existing 82 rich nb entries**
   - What we know: 23 of the 82 rich nb entries have slash-separated `translation` values. The locked decision requires primary meaning only in `translation`.
   - What's unclear: Whether the 82 rich nb entries (not in the 24 simple list) are in scope for this phase or only the 24 simple ones need work.
   - Recommendation: Yes, all 106 existing nb entries should have their `translation` field cleaned up as part of this phase. The slash cleanup is part of "upgrading to rich format" — and the locked decision applies to all entries, not just new ones.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection of `vocabulary/translations/de-nb/adjectivebank.json` (106 entries, formats verified)
- Direct inspection of `vocabulary/translations/de-en/adjectivebank.json` (106 entries, all simple)
- Direct inspection of `vocabulary/core/de/adjectivebank.json` (365 entries, gap analysis performed)
- Direct inspection of `.planning/phases/09-translations/09-CONTEXT.md` (locked decisions)
- Direct inspection of `vocabulary/translations/de-nb/manifest.json` (current counts)
- Direct inspection of `vocabulary/translations/de-en/manifest.json` (current counts)
- Direct inspection of `api/vocab/v1/translations/[pair].js` (API routing confirmed)
- Python analysis scripts run on live files (counts verified programmatically)

### Secondary (MEDIUM confidence)

- Pattern analysis from Phase 6/7/8 execution: script structure, merge approach, verification report format
- Phase 4 candidates JSON: CEFR distribution (259 adjectives: A1:39, A2:55, B1:165)
- False friend analysis: German-Norwegian linguistic knowledge (common knowledge, cross-verified against known German-Norwegian false friend lists)

---

## Metadata

**Confidence breakdown:**
- Current file state and entry counts: HIGH — verified programmatically
- Rich format structure: HIGH — verified from existing nb entries
- alternativeMeanings field design: HIGH — taken verbatim from locked CONTEXT.md decisions
- False friend list: MEDIUM — linguistically well-established but not cross-referenced against authoritative dictionary source
- Manifest count logic: MEDIUM — the off-by-one ambiguity (108 vs 106) is an open question

**Research date:** 2026-02-21
**Valid until:** Stable — this is static data research, not library API research. Valid until files change.
