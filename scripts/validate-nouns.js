import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

const nounBankPath = process.env.NOUN_BANK || 'vocabulary/core/de/nounbank.json';

const coreSchema = JSON.parse(readFileSync('vocabulary/schema/core-word.schema.json', 'utf8'));
const nounSchema = JSON.parse(readFileSync('vocabulary/schema/noun.schema.json', 'utf8'));
const nounBank = JSON.parse(readFileSync(nounBankPath, 'utf8'));

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(coreSchema, 'core-word.schema.json');
ajv.addSchema(nounSchema);

const validate = ajv.getSchema('https://papertek.no/schemas/vocabulary/noun.schema.json');
if (!validate) { console.error('Schema not found'); process.exit(1); }

const valid = validate(nounBank);
if (valid) {
  const count = Object.keys(nounBank).filter(k => k !== '_metadata').length;
  console.log(`PASS: All ${count} noun entries validate against schema`);
  process.exit(0);
} else {
  const errorCount = (validate.errors || []).length;
  console.error(`FAIL: ${errorCount} validation error(s) found`);
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
