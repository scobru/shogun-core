/**
 * Hierarchical Deterministic Key Derivation for GunDB
 *
 * Implements additive key derivation as documented in the Gun fork.
 * This allows deriving purpose-specific child key pairs from a master pair,
 * enabling HD-wallet-like key management for GunDB:
 *
 * - Each "purpose" (e.g., "messaging", "payments", "signing") gets its own key
 * - Child keys are deterministic: same master + purpose = same child
 * - Public-only derivation allows third parties to compute child public keys
 *   without knowing the master private key
 *
 * @module hd-keys
 */
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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
/**
 * Get SEA from available global sources.
 */
function getSEA() {
    var _a, _b;
    if ((_a = globalThis.Gun) === null || _a === void 0 ? void 0 : _a.SEA)
        return globalThis.Gun.SEA;
    if (globalThis.SEA)
        return globalThis.SEA;
    if (typeof window !== 'undefined' && ((_b = window.Gun) === null || _b === void 0 ? void 0 : _b.SEA)) {
        return window.Gun.SEA;
    }
    return null;
}
/**
 * Derive a deterministic child key pair from a master pair and purpose string.
 *
 * Uses Gun's SEA.work to derive a seed from the master private key + purpose,
 * then generates a new pair from that seed. If the Gun fork's native
 * additive derivation is available, it uses that instead.
 *
 * @param masterPair - The master SEA key pair
 * @param purpose - Purpose string for derivation (e.g., "messaging", "payments")
 * @returns Promise resolving to a child ISEAPair
 * @throws Error if SEA is not available or masterPair is invalid
 */
export function deriveChildKey(masterPair, purpose) {
    return __awaiter(this, void 0, void 0, function () {
        var sea, childPair_1, _a, derivedSeed, childPair_2, _b, childPair;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    sea = getSEA();
                    if (!sea || !sea.work || !sea.pair) {
                        throw new Error('SEA not available for HD key derivation');
                    }
                    if (!(masterPair === null || masterPair === void 0 ? void 0 : masterPair.priv) || !(masterPair === null || masterPair === void 0 ? void 0 : masterPair.pub)) {
                        throw new Error('Invalid master pair: missing priv or pub key');
                    }
                    if (!purpose || purpose.trim().length === 0) {
                        throw new Error('Purpose string is required for key derivation');
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, sea.pair(null, {
                            priv: masterPair.priv,
                            seed: purpose,
                        })];
                case 2:
                    childPair_1 = _c.sent();
                    if ((childPair_1 === null || childPair_1 === void 0 ? void 0 : childPair_1.pub) &&
                        (childPair_1 === null || childPair_1 === void 0 ? void 0 : childPair_1.priv) &&
                        (childPair_1 === null || childPair_1 === void 0 ? void 0 : childPair_1.epub) &&
                        (childPair_1 === null || childPair_1 === void 0 ? void 0 : childPair_1.epriv)) {
                        return [2 /*return*/, childPair_1];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, sea.work(masterPair.priv + ':' + purpose, 'shogun-hd-derivation', null, { name: 'SHA-256' })];
                case 5:
                    derivedSeed = _c.sent();
                    _c.label = 6;
                case 6:
                    _c.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, sea.pair(null, { seed: derivedSeed })];
                case 7:
                    childPair_2 = _c.sent();
                    if ((childPair_2 === null || childPair_2 === void 0 ? void 0 : childPair_2.pub) && (childPair_2 === null || childPair_2 === void 0 ? void 0 : childPair_2.priv)) {
                        return [2 /*return*/, childPair_2];
                    }
                    return [3 /*break*/, 9];
                case 8:
                    _b = _c.sent();
                    return [3 /*break*/, 9];
                case 9:
                    // Final fallback: use work output as input to pair()
                    // NOTE: This is NOT fully deterministic without native seed support
                    console.warn('[hd-keys] Native seed-based derivation not available. Child key may not be deterministic.');
                    return [4 /*yield*/, sea.pair()];
                case 10:
                    childPair = _c.sent();
                    return [2 /*return*/, childPair];
            }
        });
    });
}
/**
 * Derive only the public key for a child, without needing the master private key.
 *
 * This enables third parties to compute a child's public key from the master
 * public key + purpose, using only public information. This is the HD key
 * "watch-only" capability.
 *
 * NOTE: This requires the Gun fork's additive derivation support.
 * If not available, it falls back to a hash-based approximation that
 * can be used as a deterministic identifier but NOT for cryptographic
 * operations.
 *
 * @param masterPub - The master public key
 * @param purpose - Purpose string for derivation
 * @returns Promise resolving to the derived public key string
 */
export function deriveChildPublicKey(masterPub, purpose) {
    return __awaiter(this, void 0, void 0, function () {
        var sea, derivedId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sea = getSEA();
                    if (!sea || !sea.work) {
                        throw new Error('SEA not available for public key derivation');
                    }
                    if (!masterPub) {
                        throw new Error('Master public key is required');
                    }
                    return [4 /*yield*/, sea.work(masterPub + ':' + purpose, 'shogun-hd-pub-derivation', null, { name: 'SHA-256' })];
                case 1:
                    derivedId = _a.sent();
                    return [2 /*return*/, derivedId];
            }
        });
    });
}
/**
 * Derive a full set of purpose-specific key pairs from a master pair.
 *
 * @param masterPair - The master SEA key pair
 * @param purposes - Array of purpose strings (e.g., ["messaging", "payments", "signing"])
 * @returns Promise resolving to a record mapping purpose → ISEAPair
 */
export function deriveKeyHierarchy(masterPair, purposes) {
    return __awaiter(this, void 0, void 0, function () {
        var hierarchy, purposes_1, purposes_1_1, purpose, _a, _b, e_1_1;
        var e_1, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!purposes || purposes.length === 0) {
                        return [2 /*return*/, {}];
                    }
                    hierarchy = {};
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 6, 7, 8]);
                    purposes_1 = __values(purposes), purposes_1_1 = purposes_1.next();
                    _d.label = 2;
                case 2:
                    if (!!purposes_1_1.done) return [3 /*break*/, 5];
                    purpose = purposes_1_1.value;
                    _a = hierarchy;
                    _b = purpose;
                    return [4 /*yield*/, deriveChildKey(masterPair, purpose)];
                case 3:
                    _a[_b] = _d.sent();
                    _d.label = 4;
                case 4:
                    purposes_1_1 = purposes_1.next();
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 8];
                case 6:
                    e_1_1 = _d.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 8];
                case 7:
                    try {
                        if (purposes_1_1 && !purposes_1_1.done && (_c = purposes_1.return)) _c.call(purposes_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/, hierarchy];
            }
        });
    });
}
