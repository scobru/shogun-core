
import { normalizeSeedPhrase, validateSeedPhrase } from './src/utils/seedPhrase.ts';

const testPhrase = "velvet genuine decide soon sadness wet custom olympic fat gauge okay steak";
const normalized = normalizeSeedPhrase(testPhrase);
const isValid = validateSeedPhrase(normalized);

console.log('Original:', testPhrase);
console.log('Normalized:', normalized);
console.log('Is valid:', isValid);

const withNoise = "  velvet,  GENUINE decide soon sadness wet custom olympic fat gauge okay steak  ";
const normalizedNoise = normalizeSeedPhrase(withNoise);
const isValidNoise = validateSeedPhrase(normalizedNoise);

console.log('With noise:', withNoise);
console.log('Normalized:', normalizedNoise);
console.log('Is valid:', isValidNoise);
