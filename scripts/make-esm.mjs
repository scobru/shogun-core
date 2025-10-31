import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outPath = resolve(__dirname, '../dist/index.esm.js');
mkdirSync(dirname(outPath), { recursive: true });

const content = `// ESM facade that re-exports named symbols from the CJS build for ESM consumers\nimport cjs from './index.js';\n\nexport const ShogunCore = cjs.ShogunCore;\nexport const RxJS = cjs.RxJS;\nexport const crypto = cjs.crypto;\nexport const derive = cjs.derive;\nexport const GunErrors = cjs.GunErrors;\nexport const DataBase = cjs.DataBase;\n// Note: Gun and SEA are not exported - users should import them directly from 'gun' package\n\nexport const generateSeedPhrase = cjs.generateSeedPhrase;\nexport const validateSeedPhrase = cjs.validateSeedPhrase;\nexport const mnemonicToSeed = cjs.mnemonicToSeed;\nexport const seedToPassword = cjs.seedToPassword;\nexport const deriveCredentialsFromMnemonic = cjs.deriveCredentialsFromMnemonic;\nexport const formatSeedPhrase = cjs.formatSeedPhrase;\nexport const normalizeSeedPhrase = cjs.normalizeSeedPhrase;\n\nexport const CryptoIdentityManager = cjs.CryptoIdentityManager;\n\nexport default cjs;\n`;

writeFileSync(outPath, content, 'utf8');
console.log('[make-esm] Wrote', outPath);

