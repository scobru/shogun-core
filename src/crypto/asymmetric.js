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
exports.decrypt = exports.encrypt = exports.deserializePrivateKey = exports.deserializePublicKey = exports.generateKeyPair = void 0;
var hashing_1 = require("./hashing");
// RSA Key Generation and Encryption/Decryption Methods
var generateKeyPair = function () { return __awaiter(void 0, void 0, void 0, function () {
    var keyPair, publicKeyJWK, privateKeyJWK, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, crypto.subtle.generateKey({
                        name: "RSA-OAEP",
                        modulusLength: 4096, // Can be 1024, 2048, or 4096
                        publicExponent: new Uint8Array([1, 0, 1]), // 65537 in bytes
                        hash: "SHA-256", // Can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
                    }, true, // Whether the key is extractable
                    ["encrypt", "decrypt"])];
            case 1:
                keyPair = _a.sent();
                return [4 /*yield*/, crypto.subtle.exportKey("jwk", keyPair.publicKey)];
            case 2:
                publicKeyJWK = _a.sent();
                return [4 /*yield*/, crypto.subtle.exportKey("jwk", keyPair.privateKey)];
            case 3:
                privateKeyJWK = _a.sent();
                return [2 /*return*/, {
                        publicKey: publicKeyJWK,
                        privateKey: privateKeyJWK,
                    }];
            case 4:
                error_1 = _a.sent();
                console.error("Error generating key pair:", error_1);
                throw error_1;
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.generateKeyPair = generateKeyPair;
var deserializePublicKey = function (key) { return __awaiter(void 0, void 0, void 0, function () {
    var jwkKey, publicKey, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                jwkKey = typeof key === "string" ? JSON.parse(key) : key;
                // Validate that required JWK properties exist
                if (!jwkKey.kty) {
                    throw new Error('Invalid JWK: missing "kty" property');
                }
                return [4 /*yield*/, crypto.subtle.importKey("jwk", // Import format
                    jwkKey, // The key in JWK format
                    {
                        name: "RSA-OAEP", // Algorithm name
                        hash: "SHA-256", // Hash algorithm
                    }, true, // Extractable flag
                    ["encrypt"])];
            case 1:
                publicKey = _a.sent();
                return [2 /*return*/, publicKey];
            case 2:
                error_2 = _a.sent();
                console.error("Error deserializing public key:", error_2);
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deserializePublicKey = deserializePublicKey;
var deserializePrivateKey = function (key) { return __awaiter(void 0, void 0, void 0, function () {
    var jwkKey, privateKey, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                jwkKey = typeof key === "string" ? JSON.parse(key) : key;
                // Validate that required JWK properties exist
                if (!jwkKey.kty) {
                    throw new Error('Invalid JWK: missing "kty" property');
                }
                return [4 /*yield*/, crypto.subtle.importKey("jwk", // Import format
                    jwkKey, // The key in JWK format
                    {
                        name: "RSA-OAEP", // Algorithm name
                        hash: "SHA-256", // Hash algorithm
                    }, true, // Extractable flag
                    ["decrypt"])];
            case 1:
                privateKey = _a.sent();
                return [2 /*return*/, privateKey];
            case 2:
                error_3 = _a.sent();
                console.error("Error deserializing private key:", error_3);
                throw error_3;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deserializePrivateKey = deserializePrivateKey;
var encrypt = function (message, publicKey) { return __awaiter(void 0, void 0, void 0, function () {
    var encodedMessage, encrypted;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                encodedMessage = new TextEncoder().encode(message);
                return [4 /*yield*/, crypto.subtle.encrypt({
                        name: "RSA-OAEP",
                    }, publicKey, encodedMessage)];
            case 1:
                encrypted = _a.sent();
                return [2 /*return*/, (0, hashing_1.arrayBufferToBase64)(encrypted)];
        }
    });
}); };
exports.encrypt = encrypt;
var decrypt = function (encryptedMessage, privateKey) { return __awaiter(void 0, void 0, void 0, function () {
    var buffer, decrypted, message, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                buffer = (0, hashing_1.base64ToArrayBuffer)(encryptedMessage);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, crypto.subtle.decrypt({
                        name: "RSA-OAEP",
                    }, privateKey, buffer)];
            case 2:
                decrypted = _a.sent();
                message = new TextDecoder().decode(decrypted);
                return [2 /*return*/, message];
            case 3:
                error_4 = _a.sent();
                console.error("Decryption error:", error_4);
                throw new Error("Unable to decrypt message. Incorrect private key.");
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.decrypt = decrypt;
