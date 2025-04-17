import { CONFIG } from '../../config';
describe('CONFIG', () => {
    test('dovrebbe avere tutte le proprietà richieste', () => {
        expect(CONFIG).toHaveProperty('TIMEOUT');
        expect(CONFIG).toHaveProperty('PATHS');
        expect(CONFIG).toHaveProperty('STORAGE_KEYS');
        expect(CONFIG).toHaveProperty('GUN_TABLES');
        expect(CONFIG).toHaveProperty('AUTH');
        expect(CONFIG).toHaveProperty('PREFIX');
        expect(CONFIG).toHaveProperty('PEERS');
        expect(CONFIG).toHaveProperty('MESSAGE_TO_SIGN');
    });
    test('le proprietà TIMEOUT dovrebbero essere numeri validi', () => {
        expect(typeof CONFIG.TIMEOUT.AUTH).toBe('number');
        expect(typeof CONFIG.TIMEOUT.GUN).toBe('number');
        expect(typeof CONFIG.TIMEOUT.WALLET).toBe('number');
        expect(CONFIG.TIMEOUT.AUTH).toBeGreaterThan(0);
        expect(CONFIG.TIMEOUT.GUN).toBeGreaterThan(0);
        expect(CONFIG.TIMEOUT.WALLET).toBeGreaterThan(0);
    });
    test('le chiavi di storage dovrebbero essere stringhe non vuote', () => {
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            expect(typeof key).toBe('string');
            expect(key.length).toBeGreaterThan(0);
        });
    });
    test('i nomi delle tabelle GUN dovrebbero essere stringhe non vuote', () => {
        Object.values(CONFIG.GUN_TABLES).forEach(tableName => {
            expect(typeof tableName).toBe('string');
            expect(tableName.length).toBeGreaterThan(0);
        });
    });
    test('i valori AUTH dovrebbero essere numeri validi', () => {
        expect(typeof CONFIG.AUTH.MIN_PASSWORD_LENGTH).toBe('number');
        expect(typeof CONFIG.AUTH.MAX_USERNAME_LENGTH).toBe('number');
        expect(typeof CONFIG.AUTH.MIN_USERNAME_LENGTH).toBe('number');
        expect(CONFIG.AUTH.MIN_PASSWORD_LENGTH).toBeGreaterThan(0);
        expect(CONFIG.AUTH.MAX_USERNAME_LENGTH).toBeGreaterThan(0);
        expect(CONFIG.AUTH.MIN_USERNAME_LENGTH).toBeGreaterThan(0);
    });
    test('il percorso di derivazione dovrebbe essere una stringa valida', () => {
        expect(typeof CONFIG.PATHS.DERIVATION_BASE).toBe('string');
        expect(CONFIG.PATHS.DERIVATION_BASE).toContain("m/44'/60'/0'/0/");
    });
    test('il PREFIX dovrebbe essere una stringa non vuota', () => {
        expect(typeof CONFIG.PREFIX).toBe('string');
        expect(CONFIG.PREFIX.length).toBeGreaterThan(0);
    });
    test('MESSAGE_TO_SIGN dovrebbe essere una stringa non vuota', () => {
        expect(typeof CONFIG.MESSAGE_TO_SIGN).toBe('string');
        expect(CONFIG.MESSAGE_TO_SIGN.length).toBeGreaterThan(0);
    });
    test('PEERS dovrebbe essere un array', () => {
        expect(Array.isArray(CONFIG.PEERS)).toBe(true);
    });
});
