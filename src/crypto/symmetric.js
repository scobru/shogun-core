"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveKeyFromPassword = exports.decryptWithSymmetricKey = exports.encryptWithSymmetricKey = exports.deserializeSymmetricKey = exports.generateSymmetricKey = void 0;
var hashing_1 = require("./hashing");
// Symmetric Key Generation and Encryption/Decryption Methods
var generateSymmetricKey = function () { return __awaiter(void 0, void 0, void 0, function () {
    var key, keyJWK;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, crypto.subtle.generateKey({
                    name: "AES-GCM",
                    length: 256, // can be 128, 192, or 256
                }, true, // whether the key is extractable
                ["encrypt", "decrypt"])];
            case 1:
                key = _a.sent();
                return [4 /*yield*/, crypto.subtle.exportKey("jwk", key)];
            case 2:
                keyJWK = _a.sent();
                return [2 /*return*/, keyJWK];
        }
    });
}); };
exports.generateSymmetricKey = generateSymmetricKey;
var deserializeSymmetricKey = function (key) { return __awaiter(void 0, void 0, void 0, function () {
    var jwkKey, deSerializedSymmetricKey, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                jwkKey = typeof key === "string" ? JSON.parse(key) : key;
                // Validate that required JWK properties exist for symmetric keys
                if (!jwkKey.kty) {
                    throw new Error('Invalid JWK: missing "kty" property');
                }
                // Ensure the key type is correct for symmetric keys
                if (jwkKey.kty !== "oct") {
                    jwkKey.kty = "oct";
                }
                return [4 /*yield*/, crypto.subtle.importKey("jwk", jwkKey, {
                        name: "AES-GCM",
                    }, true, ["encrypt", "decrypt"])];
            case 1:
                deSerializedSymmetricKey = _a.sent();
                return [2 /*return*/, deSerializedSymmetricKey];
            case 2:
                error_1 = _a.sent();
                console.error("Error deserializing symmetric key:", error_1);
                throw error_1;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deserializeSymmetricKey = deserializeSymmetricKey;
var encryptWithSymmetricKey = function (message, key) { return __awaiter(void 0, void 0, void 0, function () {
    var encodedMessage, iv, encrypted;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                encodedMessage = new TextEncoder().encode(message);
                iv = crypto.getRandomValues(new Uint8Array(12));
                return [4 /*yield*/, crypto.subtle.encrypt({
                        name: "AES-GCM",
                        iv: iv,
                    }, key, encodedMessage)];
            case 1:
                encrypted = _a.sent();
                return [2 /*return*/, {
                        ciphertext: (0, hashing_1.arrayBufferToBase64)(encrypted),
                        iv: (0, hashing_1.arrayBufferToBase64)(iv.buffer),
                    }];
        }
    });
}); };
exports.encryptWithSymmetricKey = encryptWithSymmetricKey;
var decryptWithSymmetricKey = function (encryptedData, key) { return __awaiter(void 0, void 0, void 0, function () {
    var ciphertext, iv, buffer, ivBuffer, decrypted, message, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ciphertext = encryptedData.ciphertext, iv = encryptedData.iv;
                buffer = (0, hashing_1.base64ToArrayBuffer)(ciphertext);
                ivBuffer = (0, hashing_1.base64ToArrayBuffer)(iv);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, crypto.subtle.decrypt({
                        name: "AES-GCM",
                        iv: ivBuffer,
                    }, key, buffer)];
            case 2:
                decrypted = _a.sent();
                message = new TextDecoder().decode(decrypted);
                return [2 /*return*/, message];
            case 3:
                error_2 = _a.sent();
                throw new Error("Unable to decrypt message. Incorrect key.");
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.decryptWithSymmetricKey = decryptWithSymmetricKey;
// Password-based key derivation
var deriveKeyFromPassword = function (password, salt) { return __awaiter(void 0, void 0, void 0, function () {
    var encoder, actualSalt, _a, passwordKey, derivedKey;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                encoder = new TextEncoder();
                _a = salt;
                if (_a) return [3 /*break*/, 2];
                return [4 /*yield*/, crypto.subtle.digest("SHA-256", encoder.encode(password))];
            case 1:
                _a = (_b.sent());
                _b.label = 2;
            case 2:
                actualSalt = _a;
                return [4 /*yield*/, crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"])];
            case 3:
                passwordKey = _b.sent();
                return [4 /*yield*/, crypto.subtle.deriveKey({
                        name: "PBKDF2",
                        salt: actualSalt,
                        iterations: 100000, // Strong iteration count
                        hash: "SHA-256",
                    }, passwordKey, {
                        name: "AES-GCM",
                        length: 256,
                    }, false, // Not extractable for security
                    ["encrypt", "decrypt"])];
            case 4:
                derivedKey = _b.sent();
                return [2 /*return*/, { key: derivedKey, salt: actualSalt }];
        }
    });
}); };
exports.deriveKeyFromPassword = deriveKeyFromPassword;
