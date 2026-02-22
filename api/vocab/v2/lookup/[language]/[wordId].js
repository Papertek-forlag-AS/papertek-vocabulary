import fs from 'fs';
import path from 'path';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
};

const LANGUAGE_MAP = {
  german: 'de', de: 'de', deutsch: 'de',
  spanish: 'es', es: 'es', espanol: 'es',
  french: 'fr', fr: 'fr', francais: 'fr',
};

// Map word ID suffixes to bank file names
const TYPE_TO_BANK = {
  verb: 'verbbank',
  noun: 'nounbank',
  adj: 'adjectivebank',
  adv: 'generalbank',
  prep: 'generalbank',
  conj: 'generalbank',
  interj: 'generalbank',
  pron: 'pronounsbank',
  art: 'articlesbank',
  num: 'numbersbank',
  phrase: 'phrasesbank',
  interr: 'generalbank',
  propn: 'generalbank',
  contr: 'articlesbank',
  expr: 'generalbank',
  dem_pron: 'pronounsbank',
  poss_pron: 'pronounsbank',
  dobj_pron: 'pronounsbank',
  iobj_pron: 'pronounsbank',
  refl_pron: 'pronounsbank',
  possessiv: 'pronounsbank',
};

function setCors(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
}

function getVocabBasePath() {
  return path.join(process.cwd(), 'vocabulary');
}

/**
 * Determine which bank file a word ID belongs to.
 * Tries suffix matching: "familie_noun" -> "noun" -> nounbank
 */
function wordIdToBank(wordId) {
  // Try from longest suffix to shortest (for multi-part suffixes like dem_pron)
  const parts = wordId.split('_');

  // Try two-part suffix first (e.g., dem_pron, poss_pron)
  if (parts.length >= 3) {
    const twoPartSuffix = parts.slice(-2).join('_');
    if (TYPE_TO_BANK[twoPartSuffix]) {
      return TYPE_TO_BANK[twoPartSuffix];
    }
  }

  // Try single-part suffix
  if (parts.length >= 2) {
    const suffix = parts[parts.length - 1];
    if (TYPE_TO_BANK[suffix]) {
      return TYPE_TO_BANK[suffix];
    }
  }

  return null;
}

/**
 * Search all banks for a word ID (fallback when suffix mapping fails)
 */
function findWordInAllBanks(vocabBase, langCode, wordId) {
  const dictPath = path.join(vocabBase, 'dictionary', langCode);
  if (!fs.existsSync(dictPath)) return null;

  const files = fs.readdirSync(dictPath).filter(f => f.endsWith('bank.json'));

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dictPath, file), 'utf-8'));
    if (data[wordId]) {
      return { entry: data[wordId], bankName: file.replace('.json', '') };
    }
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    setCors(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { language, wordId, lang: translationLang = 'nb' } = req.query;

  // Validate language
  const langCode = language ? LANGUAGE_MAP[language.toLowerCase()] : null;
  if (!langCode) {
    setCors(res);
    return res.status(400).json({
      error: 'Invalid language',
      available: [...new Set(Object.values(LANGUAGE_MAP))],
    });
  }

  if (!wordId) {
    setCors(res);
    return res.status(400).json({ error: 'wordId parameter is required' });
  }

  try {
    const vocabBase = getVocabBasePath();
    let entry = null;
    let bankName = null;

    // Try direct bank lookup first
    const guessedBank = wordIdToBank(wordId);
    if (guessedBank) {
      const bankPath = path.join(vocabBase, 'dictionary', langCode, `${guessedBank}.json`);
      if (fs.existsSync(bankPath)) {
        const bankData = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
        if (bankData[wordId]) {
          entry = bankData[wordId];
          bankName = guessedBank;
        }
      }
    }

    // Fallback: search all banks
    if (!entry) {
      const result = findWordInAllBanks(vocabBase, langCode, wordId);
      if (result) {
        entry = result.entry;
        bankName = result.bankName;
      }
    }

    if (!entry) {
      setCors(res);
      return res.status(404).json({
        error: 'Word not found',
        wordId,
        language: langCode,
      });
    }

    // Load translation data — try curriculum translations first, then dictionary translations
    const translationPair = `${langCode}-${translationLang}`;
    const translationBankPath = path.join(vocabBase, 'translations', translationPair, `${bankName}.json`);
    const dictTranslationBankPath = path.join(vocabBase, 'translations', `${translationPair}-dict`, `${bankName}.json`);

    let translationEntry = null;
    // 1. Try curriculum translations (highest priority)
    if (fs.existsSync(translationBankPath)) {
      const transData = JSON.parse(fs.readFileSync(translationBankPath, 'utf-8'));
      translationEntry = transData[wordId] || null;
    }
    // 2. Fallback to dictionary-only translations
    if (!translationEntry && fs.existsSync(dictTranslationBankPath)) {
      const dictTransData = JSON.parse(fs.readFileSync(dictTranslationBankPath, 'utf-8'));
      translationEntry = dictTransData[wordId] || null;
    }

    // Build merged response
    const response = {
      _meta: {
        wordId,
        source: entry.curriculum ? 'curriculum' : 'dictionary',
        language: langCode,
        translationLang,
      },
      // Core fields
      word: entry.word,
      type: entry.type || null,
      audio: entry.audio || null,
      audioUrl: entry.audio ? `/shared/vocabulary/core/${langCode}/audio/${entry.audio}` : null,

      // Translation fields
      translation: translationEntry?.translation || null,
      synonyms: translationEntry?.synonyms || [],
      translationSynonyms: translationEntry?.translation_synonyms || [],
      examples: translationEntry?.examples || [],
      explanation: translationEntry?.explanation?._description || null,

      // Dictionary extension fields
      curriculum: entry.curriculum || false,
      cefr: entry.cefr || null,
      frequency: entry.frequency || null,
      tags: entry.tags || [],
      register: entry.register || null,
      usageNotes: entry.usageNotes || null,
      collocations: entry.collocations || [],
      relatedWords: entry.relatedWords || [],
      etymology: entry.etymology || null,
    };

    // Noun-specific fields
    if (entry.genus) response.genus = entry.genus;
    if (entry.plural) response.plural = entry.plural;
    if (entry.cases) response.cases = entry.cases;
    if (entry.declension) response.declension = entry.declension;
    if (translationEntry?.definite) response.definiteTranslation = translationEntry.definite;

    // Verb-specific fields
    if (entry.conjugations) response.conjugations = entry.conjugations;
    if (entry.verbClass) response.verbClass = entry.verbClass;
    if (entry.separable) response.separable = true;
    if (entry.separablePrefix) response.separablePrefix = entry.separablePrefix;
    if (entry.inseparable) response.inseparable = true;

    // Noun declension fields (synced from core nounbank in Phase 15)
    if (entry.weak_masculine) response.weakMasculine = true;
    if (entry.declension_type) response.declensionType = entry.declension_type;

    // Adjective-specific fields
    if (entry.comparison) response.comparison = entry.comparison;

    // Intro field (curriculum)
    if (entry.intro) response.intro = entry.intro;

    // Grammar features metadata — tells clients which grammar concepts apply to this word
    // Enables progressive disclosure in smart dictionaries (Chrome extension etc.)
    const grammarFeatures = [];
    if (entry.conjugations?.presens) grammarFeatures.push('grammar_presens');
    if (entry.conjugations?.preteritum) grammarFeatures.push('grammar_preteritum');
    if (entry.conjugations?.perfektum) grammarFeatures.push('grammar_perfektum');
    if (entry.conjugations?.presens?.former) {
      // Determine pronoun scope from available forms
      const forms = Object.keys(entry.conjugations.presens.former);
      if (forms.includes('ihr') || forms.includes('sie/Sie')) grammarFeatures.push('grammar_pronouns_all');
      else if (forms.includes('wir')) grammarFeatures.push('grammar_pronouns_singular_wir');
      else grammarFeatures.push('grammar_pronouns_ich_du');
    }
    if (entry.genus) grammarFeatures.push('grammar_articles');
    if (entry.plural) grammarFeatures.push('grammar_plural');
    if (entry.cases?.akkusativ) {
      grammarFeatures.push('grammar_accusative_indefinite');
      grammarFeatures.push('grammar_accusative_definite');
    }
    if (entry.cases?.dativ) grammarFeatures.push('grammar_dative');
    if (entry.cases?.nominativ?.feature === 'grammar_noun_declension') {
      grammarFeatures.push('grammar_noun_declension');
    }
    if (entry.cases?.genitiv?.feature === 'grammar_genitiv') {
      grammarFeatures.push('grammar_genitiv');
    }
    if (entry.comparison?.komparativ) grammarFeatures.push('grammar_comparative');
    if (entry.comparison?.superlativ) grammarFeatures.push('grammar_superlative');
    // Adjective declension — positiv key is unique to adjective declension blocks
    if (entry.declension?.positiv) {
      grammarFeatures.push('grammar_adjective_declension');
    }
    // Adjective genitive declension — check if genitiv key exists in any declension type
    if (entry.declension?.positiv?.stark?.genitiv ||
        entry.declension?.positiv?.schwach?.genitiv ||
        entry.declension?.positiv?.gemischt?.genitiv) {
      grammarFeatures.push('grammar_adjective_genitive');
    }
    // Check explanation text for case references (contractions, prepositions)
    const explanationText = (translationEntry?.explanation?._description || '').toLowerCase();
    if (explanationText.includes('dativ') && !grammarFeatures.includes('grammar_dative')) {
      grammarFeatures.push('grammar_dative');
    }
    if (explanationText.includes('akkusativ') && !grammarFeatures.includes('grammar_accusative_indefinite')) {
      grammarFeatures.push('grammar_accusative_indefinite');
    }
    if (grammarFeatures.length > 0) response.grammarFeatures = grammarFeatures;

    setCors(res);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(response);
  } catch (error) {
    console.error('Lookup API error:', error);
    setCors(res);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
