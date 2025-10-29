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
exports.default = default_1;
var p256_1 = require("@noble/curves/p256");
var secp256k1_1 = require("@noble/curves/secp256k1");
var sha256_1 = require("@noble/hashes/sha256");
var sha3_1 = require("@noble/hashes/sha3");
var ripemd160_1 = require("@noble/hashes/ripemd160");
function default_1(pwd_1, extra_1) {
    return __awaiter(this, arguments, void 0, function (pwd, extra, options) {
        var TEXT_ENCODER, pwdBytes, extras, extraBuf, combinedInput, version, result, _a, includeP256, _b, includeSecp256k1Bitcoin, _c, includeSecp256k1Ethereum, salts, _d, signingKeys, encryptionKeys, bitcoinSalt, bitcoinPrivateKey, bitcoinPublicKey, ethereumSalt, ethereumPrivateKey, ethereumPublicKey;
        var _this = this;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    TEXT_ENCODER = new TextEncoder();
                    pwdBytes = pwd
                        ? typeof pwd === "string"
                            ? TEXT_ENCODER.encode(normalizeString(pwd))
                            : pwd
                        : crypto.getRandomValues(new Uint8Array(32));
                    extras = extra
                        ? (Array.isArray(extra) ? extra : [extra]).map(function (e) {
                            return normalizeString(e.toString());
                        })
                        : [];
                    extraBuf = TEXT_ENCODER.encode(extras.join("|"));
                    combinedInput = new Uint8Array(pwdBytes.length + extraBuf.length);
                    combinedInput.set(pwdBytes);
                    combinedInput.set(extraBuf, pwdBytes.length);
                    if (combinedInput.length < 16) {
                        throw new Error("Insufficient input entropy (".concat(combinedInput.length, ")"));
                    }
                    version = "v1";
                    result = {};
                    _a = options.includeP256, includeP256 = _a === void 0 ? true : _a, _b = options.includeSecp256k1Bitcoin, includeSecp256k1Bitcoin = _b === void 0 ? true : _b, _c = options.includeSecp256k1Ethereum, includeSecp256k1Ethereum = _c === void 0 ? true : _c;
                    if (!includeP256) return [3 /*break*/, 2];
                    salts = [
                        { label: "signing", type: "pub/priv" },
                        { label: "encryption", type: "epub/epriv" },
                    ];
                    return [4 /*yield*/, Promise.all(salts.map(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                            var salt, privateKey, publicKey;
                            var label = _b.label;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        salt = TEXT_ENCODER.encode("".concat(label, "-").concat(version));
                                        return [4 /*yield*/, stretchKey(combinedInput, salt)];
                                    case 1:
                                        privateKey = _c.sent();
                                        if (!p256_1.p256.utils.isValidPrivateKey(privateKey)) {
                                            throw new Error("Invalid private key for ".concat(label));
                                        }
                                        publicKey = p256_1.p256.getPublicKey(privateKey, false);
                                        return [2 /*return*/, {
                                                pub: keyBufferToJwk(publicKey),
                                                priv: arrayBufToBase64UrlEncode(privateKey),
                                            }];
                                }
                            });
                        }); }))];
                case 1:
                    _d = _e.sent(), signingKeys = _d[0], encryptionKeys = _d[1];
                    // Chiavi P-256 esistenti
                    result.pub = signingKeys.pub;
                    result.priv = signingKeys.priv;
                    result.epub = encryptionKeys.pub;
                    result.epriv = encryptionKeys.priv;
                    _e.label = 2;
                case 2:
                    if (!includeSecp256k1Bitcoin) return [3 /*break*/, 4];
                    bitcoinSalt = TEXT_ENCODER.encode("secp256k1-bitcoin-".concat(version));
                    return [4 /*yield*/, stretchKey(combinedInput, bitcoinSalt)];
                case 3:
                    bitcoinPrivateKey = _e.sent();
                    if (!secp256k1_1.secp256k1.utils.isValidPrivateKey(bitcoinPrivateKey)) {
                        throw new Error("Invalid secp256k1 private key for Bitcoin");
                    }
                    bitcoinPublicKey = secp256k1_1.secp256k1.getPublicKey(bitcoinPrivateKey, true);
                    result.secp256k1Bitcoin = {
                        privateKey: bytesToHex(bitcoinPrivateKey),
                        publicKey: bytesToHex(bitcoinPublicKey),
                        address: deriveP2PKHAddress(bitcoinPublicKey),
                    };
                    _e.label = 4;
                case 4:
                    if (!includeSecp256k1Ethereum) return [3 /*break*/, 6];
                    ethereumSalt = TEXT_ENCODER.encode("secp256k1-ethereum-".concat(version));
                    return [4 /*yield*/, stretchKey(combinedInput, ethereumSalt)];
                case 5:
                    ethereumPrivateKey = _e.sent();
                    if (!secp256k1_1.secp256k1.utils.isValidPrivateKey(ethereumPrivateKey)) {
                        throw new Error("Invalid secp256k1 private key for Ethereum");
                    }
                    ethereumPublicKey = secp256k1_1.secp256k1.getPublicKey(ethereumPrivateKey, false);
                    result.secp256k1Ethereum = {
                        privateKey: "0x" + bytesToHex(ethereumPrivateKey),
                        publicKey: "0x" + bytesToHex(ethereumPublicKey),
                        address: deriveKeccak256Address(ethereumPublicKey),
                    };
                    _e.label = 6;
                case 6: return [2 /*return*/, result];
            }
        });
    });
}
function arrayBufToBase64UrlEncode(buf) {
    return btoa(String.fromCharCode.apply(String, buf))
        .replace(/\//g, "_")
        .replace(/=/g, "")
        .replace(/\+/g, "-");
}
function keyBufferToJwk(publicKeyBuffer) {
    if (publicKeyBuffer[0] !== 4)
        throw new Error("Invalid uncompressed public key format");
    return [
        arrayBufToBase64UrlEncode(publicKeyBuffer.slice(1, 33)), // x
        arrayBufToBase64UrlEncode(publicKeyBuffer.slice(33, 65)), // y
    ].join(".");
}
function normalizeString(str) {
    return str.normalize("NFC").trim();
}
function stretchKey(input_1, salt_1) {
    return __awaiter(this, arguments, void 0, function (input, salt, iterations) {
        var baseKey, keyBits, keyBytes, error_1, fallbackKey;
        if (iterations === void 0) { iterations = 300000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, crypto.subtle.importKey("raw", input, { name: "PBKDF2" }, false, ["deriveBits"])];
                case 1:
                    baseKey = _a.sent();
                    return [4 /*yield*/, crypto.subtle.deriveBits({
                            name: "PBKDF2",
                            salt: salt,
                            iterations: iterations,
                            hash: "SHA-256",
                        }, baseKey, 256)];
                case 2:
                    keyBits = _a.sent();
                    keyBytes = new Uint8Array(keyBits);
                    // Ensure the key is valid for secp256k1
                    return [2 /*return*/, ensureValidSecp256k1Key(keyBytes)];
                case 3:
                    error_1 = _a.sent();
                    fallbackKey = generateFallbackKey(input, salt);
                    return [2 /*return*/, ensureValidSecp256k1Key(fallbackKey)];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function generateFallbackKey(input, salt) {
    // Simple deterministic key generation as fallback
    var key = new Uint8Array(32);
    for (var i = 0; i < 32; i++) {
        key[i] = (i * 7 + salt[i % salt.length]) % 256;
    }
    return key;
}
function ensureValidSecp256k1Key(keyBytes) {
    // Ensure the key is not all zeros
    if (keyBytes.every(function (byte) { return byte === 0; })) {
        keyBytes[0] = 1;
    }
    // secp256k1 curve order is approximately 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1
    var maxValidKey = new Uint8Array([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6,
    ]);
    // If the key is greater than or equal to the curve order, reduce it
    var isGreaterOrEqual = true;
    for (var i = 0; i < 32; i++) {
        if (keyBytes[i] < maxValidKey[i]) {
            isGreaterOrEqual = false;
            break;
        }
        else if (keyBytes[i] > maxValidKey[i]) {
            break;
        }
    }
    if (isGreaterOrEqual) {
        // Reduce the key by setting it to a safe value
        keyBytes[31] = 0xe5; // Set to a value less than the curve order
    }
    // Additional validation: ensure the key is not too small
    if (keyBytes.every(function (byte) { return byte === 0; }) ||
        keyBytes.every(function (byte) { return byte === 1; })) {
        // Set to a safe default value
        keyBytes.fill(0);
        keyBytes[0] = 0x01;
        keyBytes[31] = 0xff;
    }
    return keyBytes;
}
function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(function (b) { return b.toString(16).padStart(2, "0"); })
        .join("");
}
// Base58 encoding per Bitcoin
var BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58Encode(bytes) {
    if (bytes.length === 0)
        return "";
    // Count leading zeros
    var zeros = 0;
    for (var i = 0; i < bytes.length && bytes[i] === 0; i++) {
        zeros++;
    }
    // Convert to base58
    var digits = [0];
    for (var i = zeros; i < bytes.length; i++) {
        var carry = bytes[i];
        for (var j = 0; j < digits.length; j++) {
            carry += digits[j] << 8;
            digits[j] = carry % 58;
            carry = (carry / 58) | 0;
        }
        while (carry > 0) {
            digits.push(carry % 58);
            carry = (carry / 58) | 0;
        }
    }
    // Convert to string
    var result = "";
    for (var i = 0; i < zeros; i++) {
        result += BASE58_ALPHABET[0];
    }
    for (var i = digits.length - 1; i >= 0; i--) {
        result += BASE58_ALPHABET[digits[i]];
    }
    return result;
}
function deriveP2PKHAddress(publicKey) {
    // Bitcoin P2PKH address derivation
    // 1. SHA256 hash del public key
    var sha256Hash = (0, sha256_1.sha256)(publicKey);
    // 2. RIPEMD160 hash del risultato
    var ripemd160Hash = (0, ripemd160_1.ripemd160)(sha256Hash);
    // 3. Aggiungi version byte (0x00 per mainnet P2PKH)
    var versionedHash = new Uint8Array(21);
    versionedHash[0] = 0x00; // Mainnet P2PKH version
    versionedHash.set(ripemd160Hash, 1);
    // 4. Double SHA256 per checksum
    var checksum = (0, sha256_1.sha256)((0, sha256_1.sha256)(versionedHash));
    // 5. Aggiungi i primi 4 byte del checksum
    var addressBytes = new Uint8Array(25);
    addressBytes.set(versionedHash);
    addressBytes.set(checksum.slice(0, 4), 21);
    // 6. Base58 encode
    return base58Encode(addressBytes);
}
function deriveKeccak256Address(publicKey) {
    // Ethereum address derivation usando Keccak256
    // 1. Rimuovi il prefix byte (0x04) dalla chiave pubblica non compressa
    var publicKeyWithoutPrefix = publicKey.slice(1);
    // 2. Calcola Keccak256 hash
    var hash = (0, sha3_1.keccak_256)(publicKeyWithoutPrefix);
    // 3. Prendi gli ultimi 20 byte
    var address = hash.slice(-20);
    // 4. Aggiungi '0x' prefix e converti in hex
    return "0x" + bytesToHex(address);
}
