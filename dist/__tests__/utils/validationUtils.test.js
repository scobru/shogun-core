"use strict";
// Mock delle funzioni di validazione
const validationUtils = {
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    isValidPassword: (password) => {
        // Verifica che la password abbia almeno 8 caratteri e contenga
        // almeno una lettera maiuscola, una minuscola e un numero
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
    },
    isValidUsername: (username) => {
        // Verifica che lo username abbia tra 3 e 30 caratteri e contenga
        // solo lettere, numeri, trattini e underscore
        return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
    },
    isNonEmptyString: (str) => {
        return typeof str === 'string' && str.trim().length > 0;
    },
    isNumber: (value) => {
        return typeof value === 'number' && !isNaN(value);
    },
    isInteger: (value) => {
        return typeof value === 'number' && !isNaN(value) && Number.isInteger(value);
    },
    isPositiveNumber: (value) => {
        return typeof value === 'number' && !isNaN(value) && value > 0;
    },
    isNonNegativeNumber: (value) => {
        return typeof value === 'number' && !isNaN(value) && value >= 0;
    },
    isInRange: (value, min, max) => {
        return value >= min && value <= max;
    },
    isBoolean: (value) => {
        return typeof value === 'boolean';
    },
    isArray: (value) => {
        return Array.isArray(value);
    },
    isNonEmptyArray: (value) => {
        return Array.isArray(value) && value.length > 0;
    },
    isObject: (value) => {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    },
    isNonEmptyObject: (value) => {
        return typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            Object.keys(value).length > 0;
    },
    hasRequiredProperties: (obj, requiredProps) => {
        if (!validationUtils.isObject(obj))
            return false;
        for (const prop of requiredProps) {
            if (!(prop in obj))
                return false;
        }
        return true;
    },
    validateObject: (obj, schema) => {
        if (!validationUtils.isObject(obj))
            return false;
        for (const [prop, validator] of Object.entries(schema)) {
            if (!(prop in obj) || !validator(obj[prop]))
                return false;
        }
        return true;
    }
};
describe('ValidationUtils', () => {
    describe('isValidEmail', () => {
        test('dovrebbe validare correttamente gli indirizzi email', () => {
            // Indirizzi email validi
            expect(validationUtils.isValidEmail('user@example.com')).toBe(true);
            expect(validationUtils.isValidEmail('user.name@example.co.uk')).toBe(true);
            expect(validationUtils.isValidEmail('user+tag@example.com')).toBe(true);
            // Indirizzi email non validi
            expect(validationUtils.isValidEmail('user@')).toBe(false);
            expect(validationUtils.isValidEmail('user@.com')).toBe(false);
            expect(validationUtils.isValidEmail('user@example')).toBe(false);
            expect(validationUtils.isValidEmail('userexample.com')).toBe(false);
            expect(validationUtils.isValidEmail('')).toBe(false);
            expect(validationUtils.isValidEmail('user@exam ple.com')).toBe(false);
        });
    });
    describe('isValidPassword', () => {
        test('dovrebbe validare correttamente le password', () => {
            // Password valide
            expect(validationUtils.isValidPassword('Password123')).toBe(true);
            expect(validationUtils.isValidPassword('StrongP4ssword')).toBe(true);
            // Password non valide
            expect(validationUtils.isValidPassword('pass')).toBe(false); // troppo corta
            expect(validationUtils.isValidPassword('password')).toBe(false); // manca maiuscola e numero
            expect(validationUtils.isValidPassword('PASSWORD123')).toBe(false); // manca minuscola
            expect(validationUtils.isValidPassword('Password')).toBe(false); // manca numero
            expect(validationUtils.isValidPassword('12345678')).toBe(false); // mancano lettere
        });
    });
    describe('isValidUsername', () => {
        test('dovrebbe validare correttamente gli username', () => {
            // Username validi
            expect(validationUtils.isValidUsername('user')).toBe(true);
            expect(validationUtils.isValidUsername('user123')).toBe(true);
            expect(validationUtils.isValidUsername('user_name')).toBe(true);
            expect(validationUtils.isValidUsername('user-name')).toBe(true);
            // Username non validi
            expect(validationUtils.isValidUsername('us')).toBe(false); // troppo corto
            expect(validationUtils.isValidUsername('user@name')).toBe(false); // carattere non consentito
            expect(validationUtils.isValidUsername('user name')).toBe(false); // spazio non consentito
            expect(validationUtils.isValidUsername('a'.repeat(31))).toBe(false); // troppo lungo
        });
    });
    describe('isNonEmptyString', () => {
        test('dovrebbe identificare correttamente le stringhe non vuote', () => {
            expect(validationUtils.isNonEmptyString('hello')).toBe(true);
            expect(validationUtils.isNonEmptyString('  hello  ')).toBe(true);
            expect(validationUtils.isNonEmptyString('')).toBe(false);
            expect(validationUtils.isNonEmptyString('   ')).toBe(false);
            expect(validationUtils.isNonEmptyString(123)).toBe(false);
            expect(validationUtils.isNonEmptyString(null)).toBe(false);
            expect(validationUtils.isNonEmptyString(undefined)).toBe(false);
            expect(validationUtils.isNonEmptyString({})).toBe(false);
            expect(validationUtils.isNonEmptyString([])).toBe(false);
        });
    });
    describe('isNumber e varianti', () => {
        test('isNumber dovrebbe identificare correttamente i numeri', () => {
            expect(validationUtils.isNumber(123)).toBe(true);
            expect(validationUtils.isNumber(0)).toBe(true);
            expect(validationUtils.isNumber(-123)).toBe(true);
            expect(validationUtils.isNumber(123.45)).toBe(true);
            expect(validationUtils.isNumber('123')).toBe(false);
            expect(validationUtils.isNumber(NaN)).toBe(false);
            expect(validationUtils.isNumber(null)).toBe(false);
            expect(validationUtils.isNumber(undefined)).toBe(false);
            expect(validationUtils.isNumber({})).toBe(false);
        });
        test('isInteger dovrebbe identificare correttamente gli interi', () => {
            expect(validationUtils.isInteger(123)).toBe(true);
            expect(validationUtils.isInteger(0)).toBe(true);
            expect(validationUtils.isInteger(-123)).toBe(true);
            expect(validationUtils.isInteger(123.45)).toBe(false);
            expect(validationUtils.isInteger('123')).toBe(false);
            expect(validationUtils.isInteger(NaN)).toBe(false);
        });
        test('isPositiveNumber dovrebbe identificare correttamente i numeri positivi', () => {
            expect(validationUtils.isPositiveNumber(123)).toBe(true);
            expect(validationUtils.isPositiveNumber(0.1)).toBe(true);
            expect(validationUtils.isPositiveNumber(0)).toBe(false);
            expect(validationUtils.isPositiveNumber(-123)).toBe(false);
            expect(validationUtils.isPositiveNumber('123')).toBe(false);
        });
        test('isNonNegativeNumber dovrebbe identificare correttamente i numeri non negativi', () => {
            expect(validationUtils.isNonNegativeNumber(123)).toBe(true);
            expect(validationUtils.isNonNegativeNumber(0)).toBe(true);
            expect(validationUtils.isNonNegativeNumber(-123)).toBe(false);
            expect(validationUtils.isNonNegativeNumber('123')).toBe(false);
        });
        test('isInRange dovrebbe verificare correttamente i range', () => {
            expect(validationUtils.isInRange(5, 1, 10)).toBe(true);
            expect(validationUtils.isInRange(1, 1, 10)).toBe(true);
            expect(validationUtils.isInRange(10, 1, 10)).toBe(true);
            expect(validationUtils.isInRange(0, 1, 10)).toBe(false);
            expect(validationUtils.isInRange(11, 1, 10)).toBe(false);
        });
    });
    describe('isBoolean', () => {
        test('dovrebbe identificare correttamente i booleani', () => {
            expect(validationUtils.isBoolean(true)).toBe(true);
            expect(validationUtils.isBoolean(false)).toBe(true);
            expect(validationUtils.isBoolean(0)).toBe(false);
            expect(validationUtils.isBoolean(1)).toBe(false);
            expect(validationUtils.isBoolean('true')).toBe(false);
            expect(validationUtils.isBoolean(null)).toBe(false);
        });
    });
    describe('isArray e varianti', () => {
        test('isArray dovrebbe identificare correttamente gli array', () => {
            expect(validationUtils.isArray([])).toBe(true);
            expect(validationUtils.isArray([1, 2, 3])).toBe(true);
            expect(validationUtils.isArray({})).toBe(false);
            expect(validationUtils.isArray('array')).toBe(false);
            expect(validationUtils.isArray(null)).toBe(false);
        });
        test('isNonEmptyArray dovrebbe identificare correttamente gli array non vuoti', () => {
            expect(validationUtils.isNonEmptyArray([1, 2, 3])).toBe(true);
            expect(validationUtils.isNonEmptyArray([])).toBe(false);
            expect(validationUtils.isNonEmptyArray({})).toBe(false);
            expect(validationUtils.isNonEmptyArray('array')).toBe(false);
        });
    });
    describe('isObject e varianti', () => {
        test('isObject dovrebbe identificare correttamente gli oggetti', () => {
            expect(validationUtils.isObject({})).toBe(true);
            expect(validationUtils.isObject({ a: 1 })).toBe(true);
            expect(validationUtils.isObject([])).toBe(false);
            expect(validationUtils.isObject(null)).toBe(false);
            expect(validationUtils.isObject('object')).toBe(false);
            expect(validationUtils.isObject(123)).toBe(false);
        });
        test('isNonEmptyObject dovrebbe identificare correttamente gli oggetti non vuoti', () => {
            expect(validationUtils.isNonEmptyObject({ a: 1 })).toBe(true);
            expect(validationUtils.isNonEmptyObject({})).toBe(false);
            expect(validationUtils.isNonEmptyObject([])).toBe(false);
            expect(validationUtils.isNonEmptyObject(null)).toBe(false);
        });
    });
    describe('hasRequiredProperties', () => {
        test('dovrebbe verificare correttamente la presenza di proprietà richieste', () => {
            const obj = { a: 1, b: 2, c: 3 };
            expect(validationUtils.hasRequiredProperties(obj, ['a'])).toBe(true);
            expect(validationUtils.hasRequiredProperties(obj, ['a', 'b'])).toBe(true);
            expect(validationUtils.hasRequiredProperties(obj, ['a', 'b', 'c'])).toBe(true);
            expect(validationUtils.hasRequiredProperties(obj, ['d'])).toBe(false);
            expect(validationUtils.hasRequiredProperties(obj, ['a', 'd'])).toBe(false);
            expect(validationUtils.hasRequiredProperties('not an object', ['a'])).toBe(false);
        });
    });
    describe('validateObject', () => {
        test('dovrebbe validare correttamente gli oggetti secondo uno schema', () => {
            const schema = {
                name: validationUtils.isNonEmptyString,
                age: validationUtils.isPositiveNumber,
                active: validationUtils.isBoolean
            };
            const validObj = { name: 'John', age: 30, active: true };
            expect(validationUtils.validateObject(validObj, schema)).toBe(true);
            const invalidObj1 = { name: '', age: 30, active: true };
            expect(validationUtils.validateObject(invalidObj1, schema)).toBe(false);
            const invalidObj2 = { name: 'John', age: -5, active: true };
            expect(validationUtils.validateObject(invalidObj2, schema)).toBe(false);
            const invalidObj3 = { name: 'John', age: 30, active: 'yes' };
            expect(validationUtils.validateObject(invalidObj3, schema)).toBe(false);
            const missingPropObj = { name: 'John', active: true };
            expect(validationUtils.validateObject(missingPropObj, schema)).toBe(false);
            expect(validationUtils.validateObject('not an object', schema)).toBe(false);
        });
    });
});
