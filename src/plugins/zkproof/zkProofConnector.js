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
exports.ZkProofConnector = void 0;
var identity_1 = require("@semaphore-protocol/identity");
var group_1 = require("@semaphore-protocol/group");
var proof_1 = require("@semaphore-protocol/proof");
var ethers_1 = require("ethers");
var derive_1 = require("../../gundb/derive");
var errorHandler_1 = require("../../utils/errorHandler");
/**
 * Connector for ZK-Proof operations using Semaphore protocol
 */
var ZkProofConnector = /** @class */ (function () {
    function ZkProofConnector() {
        this.identityCache = new Map();
        this.credentialCache = new Map();
        this.groups = new Map();
    }
    /**
     * Generate a new Semaphore identity
     */
    ZkProofConnector.prototype.generateIdentity = function (seed) {
        return __awaiter(this, void 0, void 0, function () {
            var identity, commitment, trapdoor, nullifier;
            return __generator(this, function (_a) {
                try {
                    identity = void 0;
                    if (seed) {
                        // Deterministic generation from seed
                        identity = new identity_1.Identity(seed);
                    }
                    else {
                        // Random generation
                        identity = new identity_1.Identity();
                    }
                    commitment = identity.commitment.toString();
                    trapdoor = identity.trapdoor.toString();
                    nullifier = identity.nullifier.toString();
                    // Cache the identity
                    this.identityCache.set(commitment, identity);
                    return [2 /*return*/, {
                            commitment: commitment,
                            trapdoor: trapdoor,
                            nullifier: nullifier,
                            createdAt: Date.now(),
                        }];
                }
                catch (error) {
                    errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "ZK_IDENTITY_GENERATION_FAILED", "Failed to generate ZK identity: ".concat(error.message), error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Restore identity from trapdoor
     */
    ZkProofConnector.prototype.restoreIdentity = function (trapdoor) {
        return __awaiter(this, void 0, void 0, function () {
            var identity, commitment;
            return __generator(this, function (_a) {
                try {
                    identity = new identity_1.Identity(trapdoor);
                    commitment = identity.commitment.toString();
                    // Cache the identity
                    this.identityCache.set(commitment, identity);
                    return [2 /*return*/, {
                            commitment: commitment,
                            trapdoor: identity.trapdoor.toString(),
                            nullifier: identity.nullifier.toString(),
                            createdAt: Date.now(),
                        }];
                }
                catch (error) {
                    errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "ZK_IDENTITY_RESTORE_FAILED", "Failed to restore ZK identity: ".concat(error.message), error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate Gun credentials from ZK identity
     */
    ZkProofConnector.prototype.generateCredentials = function (identityData) {
        return __awaiter(this, void 0, void 0, function () {
            var username, password, gunPair, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        username = "zk_".concat(identityData.commitment.slice(0, 16));
                        password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes("".concat(identityData.trapdoor, "_").concat(identityData.nullifier)));
                        return [4 /*yield*/, (0, derive_1.default)(password, username, {
                                includeP256: true,
                            })];
                    case 1:
                        gunPair = _a.sent();
                        // Cache credential
                        this.credentialCache.set(identityData.commitment, {
                            commitment: identityData.commitment,
                            gunPair: gunPair,
                            createdAt: identityData.createdAt,
                        });
                        return [2 /*return*/, gunPair];
                    case 2:
                        error_1 = _a.sent();
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "ZK_CREDENTIAL_GENERATION_FAILED", "Failed to generate credentials from ZK identity: ".concat(error_1.message), error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get or create a Semaphore group
     */
    ZkProofConnector.prototype.getOrCreateGroup = function (groupId) {
        if (groupId === void 0) { groupId = "default"; }
        if (!this.groups.has(groupId)) {
            // Convert string groupId to BigNumber using keccak256 hash
            var groupIdHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(groupId));
            var groupIdNumber = BigInt(groupIdHash);
            this.groups.set(groupId, new group_1.Group(groupIdNumber));
        }
        return this.groups.get(groupId);
    };
    /**
     * Add identity to a group
     */
    ZkProofConnector.prototype.addToGroup = function (commitment, groupId) {
        if (groupId === void 0) { groupId = "default"; }
        var group = this.getOrCreateGroup(groupId);
        group.addMember(BigInt(commitment));
    };
    /**
     * Generate a Semaphore proof
     */
    ZkProofConnector.prototype.generateProof = function (identityData_1) {
        return __awaiter(this, arguments, void 0, function (identityData, options) {
            var groupId, messageString, scopeString, messageHash, message, scopeHash, scope, identity, group, fullProof, error_2;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        groupId = options.groupId || "default";
                        messageString = options.message || "authenticate";
                        scopeString = options.scope || "shogun-auth";
                        messageHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(messageString));
                        message = BigInt(messageHash);
                        scopeHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(scopeString));
                        scope = BigInt(scopeHash);
                        identity = this.identityCache.get(identityData.commitment);
                        if (!identity && identityData.trapdoor) {
                            identity = new identity_1.Identity(identityData.trapdoor);
                            this.identityCache.set(identityData.commitment, identity);
                        }
                        if (!identity) {
                            throw new Error("Identity not found and cannot be reconstructed");
                        }
                        group = this.getOrCreateGroup(groupId);
                        // Add identity to group if not already added
                        if (group.indexOf(identity.commitment) === -1) {
                            group.addMember(identity.commitment);
                        }
                        return [4 /*yield*/, (0, proof_1.generateProof)(identity, group, message, scope)];
                    case 1:
                        fullProof = _a.sent();
                        return [2 /*return*/, {
                                merkleTreeRoot: fullProof.merkleTreeRoot.toString(),
                                nullifierHash: fullProof.nullifierHash.toString(),
                                signal: fullProof.signal.toString(),
                                externalNullifier: fullProof.externalNullifier.toString(),
                                proof: fullProof.proof.map(function (p) { return p.toString(); }),
                            }];
                    case 2:
                        error_2 = _a.sent();
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "ZK_PROOF_GENERATION_FAILED", "Failed to generate ZK proof: ".concat(error_2.message), error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify a Semaphore proof
     */
    ZkProofConnector.prototype.verifyProof = function (proof_2) {
        return __awaiter(this, arguments, void 0, function (proof, treeDepth) {
            var verified, error_3;
            if (treeDepth === void 0) { treeDepth = 20; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, proof_1.verifyProof)(proof, treeDepth)];
                    case 1:
                        verified = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                verified: verified,
                            }];
                    case 2:
                        error_3 = _a.sent();
                        errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "ZK_PROOF_VERIFICATION_FAILED", "Failed to verify ZK proof: ".concat(error_3.message), error_3);
                        return [2 /*return*/, {
                                success: false,
                                verified: false,
                                error: error_3.message,
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get cached credential by commitment
     */
    ZkProofConnector.prototype.getCredential = function (commitment) {
        return this.credentialCache.get(commitment);
    };
    /**
     * Clear all caches
     */
    ZkProofConnector.prototype.cleanup = function () {
        this.identityCache.clear();
        this.credentialCache.clear();
        this.groups.clear();
    };
    return ZkProofConnector;
}());
exports.ZkProofConnector = ZkProofConnector;
