# Papertek Vocabulary API

## Permissions
- You may edit any file in this repository without asking
- You may run any script (npm run, node scripts/) without asking
- You may create new files without asking
- You may commit and push to main without asking when instructed

## Project context
- Norwegian vocabulary API for Leksihjelp Chrome extension
- Languages: German, Spanish, French, Norwegian (Bokmål + Nynorsk), English
- Two-way dictionary with v3 API (lexicon model)
- Deployed on Vercel

## Conventions
- Scripts in `scripts/` use ES modules (import/export)
- Lexicon data in `vocabulary/lexicon/{lang}/`
- Links in `vocabulary/lexicon/links/{pair}/`
- Run `npm run validate:lexicon` after data changes
- Run `npm run build:lexicon-search-index` to rebuild search indices
