"use strict";
/**
 * MLS (Message Layer Security) Manager
 * RFC 9420 implementation using ts-mls library
 * Provides end-to-end encrypted group messaging with forward secrecy
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.MLSManager = void 0;
var ts_mls_1 = require("ts-mls");
// Helper to strip trailing null nodes per RFC 9420
function stripTrailingNulls(tree) {
    var lastNonNull = tree.length - 1;
    while (lastNonNull >= 0 && tree[lastNonNull] === null) {
        lastNonNull--;
    }
    return tree.slice(0, lastNonNull + 1);
}
/**
 * MLSManager wraps the ts-mls functional API with a class-based interface
 * for easier state management in applications
 */
var MLSManager = /** @class */ (function () {
    function MLSManager(userId) {
        this.cipherSuite = null;
        this.initialized = false;
        this.groups = new Map();
        this.keyPackage = null;
        this.userId = userId;
        this.credential = {
            credentialType: "basic",
            identity: new TextEncoder().encode(userId),
        };
    }
    /**
     * Initialize the MLS client with a ciphersuite
     */
    MLSManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cipherSuiteName, cs, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.initialized) {
                            console.warn("MLS Manager already initialized");
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        console.log("\uD83D\uDD10 [MLS] Initializing for user: ".concat(this.userId));
                        cipherSuiteName = "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519";
                        cs = (0, ts_mls_1.getCiphersuiteFromName)(cipherSuiteName);
                        _a = this;
                        return [4 /*yield*/, ts_mls_1.nobleCryptoProvider.getCiphersuiteImpl(cs)];
                    case 2:
                        _a.cipherSuite = _b.sent();
                        console.log("\u2705 [MLS] Using ciphersuite: ".concat(cipherSuiteName));
                        // Mark as initialized before generating key package
                        this.initialized = true;
                        // Generate initial key package for this user
                        return [4 /*yield*/, this.generateKeyPackage()];
                    case 3:
                        // Generate initial key package for this user
                        _b.sent();
                        console.log("✅ [MLS] Initialized successfully");
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        console.error("❌ [MLS] Failed to initialize:", error_1);
                        throw new Error("MLS initialization failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a new key package for joining groups
     */
    MLSManager.prototype.generateKeyPackage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var keyPackageResult, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("🔑 [MLS] Generating key package");
                        return [4 /*yield*/, (0, ts_mls_1.generateKeyPackage)(this.credential, (0, ts_mls_1.defaultCapabilities)(), ts_mls_1.defaultLifetime, [], this.cipherSuite)];
                    case 2:
                        keyPackageResult = _a.sent();
                        this.keyPackage = __assign(__assign({}, keyPackageResult), { userId: this.userId });
                        console.log("✅ [MLS] Key package generated");
                        return [2 /*return*/, this.keyPackage];
                    case 3:
                        error_2 = _a.sent();
                        console.error("❌ [MLS] Failed to generate key package:", error_2);
                        throw new Error("Key package generation failed: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the current key package
     */
    MLSManager.prototype.getKeyPackage = function () {
        return this.keyPackage;
    };
    /**
     * Create a new MLS group
     */
    MLSManager.prototype.createGroup = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var groupIdBytes, groupState, groupInfo, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("\uD83D\uDCDD [MLS] Creating group: ".concat(groupId));
                        if (!this.keyPackage) {
                            throw new Error("No key package available. Call generateKeyPackage() first.");
                        }
                        groupIdBytes = new TextEncoder().encode(groupId);
                        return [4 /*yield*/, (0, ts_mls_1.createGroup)(groupIdBytes, this.keyPackage.publicPackage, this.keyPackage.privatePackage, [], this.cipherSuite)];
                    case 2:
                        groupState = _a.sent();
                        this.groups.set(groupId, groupState);
                        groupInfo = {
                            groupId: groupIdBytes,
                            members: [this.userId],
                            epoch: groupState.groupContext.epoch,
                        };
                        console.log("\u2705 [MLS] Group created: ".concat(groupId, ", epoch: ").concat(groupState.groupContext.epoch));
                        return [2 /*return*/, groupInfo];
                    case 3:
                        error_3 = _a.sent();
                        console.error("❌ [MLS] Failed to create group:", error_3);
                        throw new Error("Group creation failed: ".concat(error_3 instanceof Error ? error_3.message : String(error_3)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add members to an existing group
     */
    MLSManager.prototype.addMembers = function (groupId, keyPackages) {
        return __awaiter(this, void 0, void 0, function () {
            var groupState, addProposals, commitResult, ratchetTreeArray, strippedTree, error_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.ensureInitialized();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        console.log("\u2795 [MLS] Adding ".concat(keyPackages.length, " member(s) to group: ").concat(groupId));
                        groupState = this.groups.get(groupId);
                        if (!groupState) {
                            throw new Error("Group ".concat(groupId, " not found"));
                        }
                        addProposals = keyPackages.map(function (kp) { return ({
                            proposalType: "add",
                            add: {
                                keyPackage: kp.publicPackage,
                            },
                        }); });
                        return [4 /*yield*/, (0, ts_mls_1.createCommit)({ state: groupState, cipherSuite: this.cipherSuite }, { extraProposals: addProposals })];
                    case 2:
                        commitResult = _b.sent();
                        // Update group state
                        this.groups.set(groupId, commitResult.newState);
                        if (!commitResult.welcome) {
                            throw new Error("No welcome message generated");
                        }
                        console.log("\u2705 [MLS] Members added, new epoch: ".concat(commitResult.newState.groupContext.epoch));
                        // Debug: Log the commit structure
                        console.group("🔍 [MLS Debug] Commit Structure");
                        console.log("commitResult keys:", Object.keys(commitResult));
                        console.log("commit:", commitResult.commit);
                        console.log("commit.privateMessage:", (_a = commitResult.commit) === null || _a === void 0 ? void 0 : _a.privateMessage);
                        console.groupEnd();
                        ratchetTreeArray = Array.from(commitResult.newState.ratchetTree);
                        strippedTree = stripTrailingNulls(ratchetTreeArray);
                        console.log("\uD83D\uDD0D [MLS] Ratchet tree stripped: ".concat(ratchetTreeArray.length, " -> ").concat(strippedTree.length, " nodes"));
                        return [2 /*return*/, {
                                welcome: commitResult.welcome,
                                ratchetTree: strippedTree,
                                commit: commitResult.commit,
                            }];
                    case 3:
                        error_4 = _b.sent();
                        console.error("❌ [MLS] Failed to add members:", error_4);
                        throw new Error("Adding members failed: ".concat(error_4 instanceof Error ? error_4.message : String(error_4)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process a Welcome message to join an MLS group
     *
     * RFC 9420 Compliance:
     * - Interior null nodes represent blank parent nodes (unmerged positions)
     * - These nulls are REQUIRED for proper binary tree structure
     * - Trailing nulls are stripped by sender (per RFC 9420 requirement)
     * - ratchetTree parameter is optional; ts-mls can extract from Welcome extension
     *
     * @param welcome - The Welcome message from group creator
     * @param ratchetTree - Optional ratchet tree (normally provided out-of-band)
     */
    MLSManager.prototype.processWelcome = function (welcome, ratchetTree) {
        return __awaiter(this, void 0, void 0, function () {
            var nullCount, groupState, groupId, members, groupInfo, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("📩 [MLS] Processing welcome message");
                        if (!this.keyPackage) {
                            throw new Error("No key package available");
                        }
                        // RFC 9420: Interior null nodes are valid (represent blank parent nodes)
                        // Trailing nulls are stripped by sender per RFC requirement
                        // Simply pass the tree as-is to ts-mls joinGroup()
                        if (ratchetTree && Array.isArray(ratchetTree)) {
                            nullCount = ratchetTree.filter(function (n) { return n === null; }).length;
                            console.log("\uD83D\uDD0D [MLS] Ratchet tree received: ".concat(ratchetTree.length, " nodes (").concat(nullCount, " interior nulls)"));
                            // DEBUG: Log structure of each node
                            console.group("🔍 [MLS Debug] Ratchet Tree Structure");
                            ratchetTree.forEach(function (node, i) {
                                if (node === null) {
                                    console.log("  Node ".concat(i, ": NULL"));
                                }
                                else {
                                    console.log("  Node ".concat(i, ":"), {
                                        type: typeof node,
                                        isObject: typeof node === "object",
                                        hasNodeType: node && typeof node === "object" && "nodeType" in node,
                                        nodeType: node === null || node === void 0 ? void 0 : node.nodeType,
                                        keys: node && typeof node === "object"
                                            ? Object.keys(node).slice(0, 5)
                                            : "n/a",
                                    });
                                }
                            });
                            console.groupEnd();
                        }
                        return [4 /*yield*/, (0, ts_mls_1.joinGroup)(welcome, this.keyPackage.publicPackage, this.keyPackage.privatePackage, ts_mls_1.emptyPskIndex, this.cipherSuite, ratchetTree)];
                    case 2:
                        groupState = _a.sent();
                        groupId = new TextDecoder().decode(groupState.groupContext.groupId);
                        this.groups.set(groupId, groupState);
                        members = this.extractMembersFromState(groupState);
                        groupInfo = {
                            groupId: groupState.groupContext.groupId,
                            members: members,
                            epoch: groupState.groupContext.epoch,
                        };
                        console.log("\u2705 [MLS] Welcome processed, joined group: ".concat(groupId));
                        return [2 /*return*/, groupInfo];
                    case 3:
                        error_5 = _a.sent();
                        console.error("❌ [MLS] Failed to process welcome:", error_5);
                        throw new Error("Welcome processing failed: ".concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Encrypt a message for a group
     */
    MLSManager.prototype.encryptMessage = function (groupId, plaintext) {
        return __awaiter(this, void 0, void 0, function () {
            var groupState, plaintextBytes, result, encoded, envelope, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("\uD83D\uDD12 [MLS] Encrypting message for group: ".concat(groupId));
                        groupState = this.groups.get(groupId);
                        if (!groupState) {
                            throw new Error("Group ".concat(groupId, " not found"));
                        }
                        plaintextBytes = new TextEncoder().encode(plaintext);
                        return [4 /*yield*/, (0, ts_mls_1.createApplicationMessage)(groupState, plaintextBytes, this.cipherSuite)];
                    case 2:
                        result = _a.sent();
                        // Update group state (for key ratcheting)
                        this.groups.set(groupId, result.newState);
                        encoded = (0, ts_mls_1.encodeMlsMessage)({
                            privateMessage: result.privateMessage,
                            wireformat: "mls_private_message",
                            version: "mls10",
                        });
                        envelope = {
                            groupId: new TextEncoder().encode(groupId),
                            ciphertext: encoded,
                            timestamp: Date.now(),
                        };
                        console.log("✅ [MLS] Message encrypted");
                        return [2 /*return*/, envelope];
                    case 3:
                        error_6 = _a.sent();
                        console.error("❌ [MLS] Failed to encrypt message:", error_6);
                        throw new Error("Message encryption failed: ".concat(error_6 instanceof Error ? error_6.message : String(error_6)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Decrypt a message from a group
     */
    MLSManager.prototype.decryptMessage = function (envelope) {
        return __awaiter(this, void 0, void 0, function () {
            var groupId, groupState, decoded, decodedMessage, result, plaintext, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        groupId = new TextDecoder().decode(envelope.groupId);
                        console.log("\uD83D\uDD13 [MLS] Decrypting message for group: ".concat(groupId));
                        groupState = this.groups.get(groupId);
                        if (!groupState) {
                            throw new Error("Group ".concat(groupId, " not found"));
                        }
                        decoded = (0, ts_mls_1.decodeMlsMessage)(envelope.ciphertext, 0);
                        if (!decoded) {
                            throw new Error("Failed to decode message");
                        }
                        decodedMessage = decoded[0];
                        if (decodedMessage.wireformat !== "mls_private_message") {
                            throw new Error("Expected private message");
                        }
                        return [4 /*yield*/, (0, ts_mls_1.processPrivateMessage)(groupState, decodedMessage.privateMessage, ts_mls_1.emptyPskIndex, this.cipherSuite)];
                    case 2:
                        result = _a.sent();
                        // Update group state
                        this.groups.set(groupId, result.newState);
                        if (result.kind !== "applicationMessage") {
                            throw new Error("Expected application message");
                        }
                        plaintext = new TextDecoder().decode(result.message);
                        console.log("✅ [MLS] Message decrypted");
                        return [2 /*return*/, plaintext];
                    case 3:
                        error_7 = _a.sent();
                        console.error("❌ [MLS] Failed to decrypt message:", error_7);
                        throw new Error("Decryption failed: ".concat(error_7 instanceof Error ? error_7.message : String(error_7)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update the group keys (key rotation)
     */
    MLSManager.prototype.updateKey = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var groupState, commitResult, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("\uD83D\uDD04 [MLS] Performing key rotation for group: ".concat(groupId));
                        groupState = this.groups.get(groupId);
                        if (!groupState) {
                            throw new Error("Group ".concat(groupId, " not found"));
                        }
                        return [4 /*yield*/, (0, ts_mls_1.createCommit)({ state: groupState, cipherSuite: this.cipherSuite }, {})];
                    case 2:
                        commitResult = _a.sent();
                        // Update group state
                        this.groups.set(groupId, commitResult.newState);
                        console.log("\u2705 [MLS] Key rotation successful, new epoch: ".concat(commitResult.newState.groupContext.epoch));
                        // Return the raw commit object for other members to process
                        return [2 /*return*/, commitResult.commit];
                    case 3:
                        error_8 = _a.sent();
                        console.error("❌ [MLS] Failed to update key:", error_8);
                        throw new Error("Key update failed: ".concat(error_8 instanceof Error ? error_8.message : String(error_8)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process a commit message (key rotation, member changes)
     *
     * RFC 9420 Section 12.1.8:
     * - Update commits (key rotation) → PrivateMessage
     * - Add/Remove commits → PublicMessage (for existing group members)
     *
     * This implementation handles both types based on wireformat.
     */
    MLSManager.prototype.processCommit = function (groupId, commit) {
        return __awaiter(this, void 0, void 0, function () {
            var groupState, result, publicMessage, privateMessage, error_9;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.ensureInitialized();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        console.log("\u2699\uFE0F [MLS] Processing commit for group: ".concat(groupId));
                        console.log("\uD83D\uDD0D [MLS Debug] Commit wireformat: ".concat(commit.wireformat));
                        // DETAILED DEBUG LOGGING
                        console.group("🔍 [MLS Debug] Full Commit Structure");
                        console.log("commit keys:", Object.keys(commit));
                        console.log("commit.wireformat:", commit.wireformat);
                        console.log("commit.publicMessage:", commit.publicMessage);
                        console.log("commit.privateMessage:", commit.privateMessage);
                        // Log proposals if present
                        if ((_a = commit.publicMessage) === null || _a === void 0 ? void 0 : _a.content) {
                            console.log("publicMessage.content:", commit.publicMessage.content);
                            console.log("publicMessage.content.proposals:", commit.publicMessage.content.proposals);
                            if (commit.publicMessage.content.proposals) {
                                commit.publicMessage.content.proposals.forEach(function (prop, i) {
                                    console.log("  Proposal ".concat(i, ":"), {
                                        proposalType: prop.proposalType,
                                        keys: Object.keys(prop),
                                        full: prop,
                                    });
                                });
                            }
                        }
                        console.groupEnd();
                        groupState = this.groups.get(groupId);
                        if (!groupState) {
                            throw new Error("Group ".concat(groupId, " not found"));
                        }
                        result = void 0;
                        if (!(commit.wireformat === "mls_public_message")) return [3 /*break*/, 3];
                        // Public messages (add/remove member commits)
                        console.log("🔍 [MLS Debug] Processing as PUBLIC message (add/remove)...");
                        publicMessage = commit.publicMessage || commit;
                        return [4 /*yield*/, (0, ts_mls_1.processPublicMessage)(groupState, publicMessage, ts_mls_1.emptyPskIndex, this.cipherSuite)];
                    case 2:
                        result = _b.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        if (!(commit.wireformat === "mls_private_message")) return [3 /*break*/, 5];
                        // Private messages (update/key rotation commits)
                        console.log("🔍 [MLS Debug] Processing as PRIVATE message (update)...");
                        privateMessage = commit.privateMessage || commit;
                        return [4 /*yield*/, (0, ts_mls_1.processPrivateMessage)(groupState, privateMessage, ts_mls_1.emptyPskIndex, this.cipherSuite)];
                    case 4:
                        result = _b.sent();
                        return [3 /*break*/, 6];
                    case 5: throw new Error("Unknown commit wireformat: ".concat(commit.wireformat));
                    case 6:
                        // Update group state
                        this.groups.set(groupId, result.newState);
                        console.log("\u2705 [MLS] Commit processed, epoch: ".concat(result.newState.groupContext.epoch));
                        return [3 /*break*/, 8];
                    case 7:
                        error_9 = _b.sent();
                        console.error("❌ [MLS] Failed to process commit:", error_9);
                        console.error("❌ [MLS Debug] Error details:", error_9 instanceof Error ? error_9.stack : "No stack trace");
                        console.error("❌ [MLS Debug] Error message:", error_9 instanceof Error ? error_9.message : String(error_9));
                        throw new Error("Commit processing failed: ".concat(error_9 instanceof Error ? error_9.message : String(error_9)));
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove members from a group
     */
    MLSManager.prototype.removeMembers = function (groupId, memberIndices) {
        return __awaiter(this, void 0, void 0, function () {
            var groupState, removeProposals, commitResult, encodedCommit, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.ensureInitialized();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("\u2796 [MLS] Removing ".concat(memberIndices.length, " member(s) from group: ").concat(groupId));
                        groupState = this.groups.get(groupId);
                        if (!groupState) {
                            throw new Error("Group ".concat(groupId, " not found"));
                        }
                        removeProposals = memberIndices.map(function (index) { return ({
                            proposalType: "remove",
                            remove: {
                                removed: index, // ts-mls expects number, not BigInt
                            },
                        }); });
                        return [4 /*yield*/, (0, ts_mls_1.createCommit)({ state: groupState, cipherSuite: this.cipherSuite }, { extraProposals: removeProposals })];
                    case 2:
                        commitResult = _a.sent();
                        // Update group state
                        this.groups.set(groupId, commitResult.newState);
                        encodedCommit = (0, ts_mls_1.encodeMlsMessage)({
                            publicMessage: commitResult.publicMessage,
                            wireformat: "mls_public_message",
                            version: "mls10",
                        });
                        console.log("✅ [MLS] Members removed");
                        return [2 /*return*/, encodedCommit];
                    case 3:
                        error_10 = _a.sent();
                        console.error("❌ [MLS] Failed to remove members:", error_10);
                        throw new Error("Member removal failed: ".concat(error_10 instanceof Error ? error_10.message : String(error_10)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get list of groups
     */
    MLSManager.prototype.getGroups = function () {
        return __awaiter(this, void 0, void 0, function () {
            var groupIds;
            return __generator(this, function (_a) {
                this.ensureInitialized();
                try {
                    groupIds = Array.from(this.groups.keys()).map(function (id) {
                        return new TextEncoder().encode(id);
                    });
                    return [2 /*return*/, groupIds];
                }
                catch (error) {
                    console.error("❌ [MLS] Failed to get groups:", error);
                    throw new Error("Getting groups failed: ".concat(error instanceof Error ? error.message : String(error)));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Export group state for persistence
     */
    MLSManager.prototype.exportGroupState = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var groupState, exportData;
            return __generator(this, function (_a) {
                this.ensureInitialized();
                try {
                    console.log("\uD83D\uDCBE [MLS] Exporting state for group: ".concat(groupId));
                    groupState = this.groups.get(groupId);
                    if (!groupState) {
                        throw new Error("Group ".concat(groupId, " not found"));
                    }
                    exportData = {
                        groupId: groupId,
                        epoch: groupState.groupContext.epoch.toString(),
                        exported: Date.now(),
                        // Add other serializable fields as needed
                    };
                    console.log("✅ [MLS] Group state exported");
                    return [2 /*return*/, exportData];
                }
                catch (error) {
                    console.error("❌ [MLS] Failed to export group state:", error);
                    throw new Error("Group state export failed: ".concat(error instanceof Error ? error.message : String(error)));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get user ID
     */
    MLSManager.prototype.getUserId = function () {
        return this.userId;
    };
    /**
     * Get group information
     */
    MLSManager.prototype.getGroupKeyInfo = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var groupState, members;
            return __generator(this, function (_a) {
                groupState = this.groups.get(groupId);
                if (!groupState) {
                    return [2 /*return*/, null];
                }
                members = this.extractMembersFromState(groupState);
                return [2 /*return*/, {
                        groupId: groupId,
                        epoch: groupState.groupContext.epoch.toString(),
                        members: members,
                        cipherSuite: "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519",
                        treeHash: this.bytesToHex(groupState.groupContext.treeHash).substring(0, 16),
                    }];
            });
        });
    };
    /**
     * Clean up resources
     */
    MLSManager.prototype.destroy = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.groups.clear();
                this.keyPackage = null;
                this.initialized = false;
                console.log("✅ [MLS] Manager destroyed");
                return [2 /*return*/];
            });
        });
    };
    /**
     * Extract member identities from group state
     */
    MLSManager.prototype.extractMembersFromState = function (state) {
        var _a;
        var members = [];
        try {
            // Iterate through ratchet tree to find leaf nodes
            for (var i = 0; i < state.ratchetTree.length; i++) {
                var node = state.ratchetTree[i];
                if (node &&
                    node.nodeType === "leaf" &&
                    ((_a = node.leaf) === null || _a === void 0 ? void 0 : _a.credential)) {
                    var identity = new TextDecoder().decode(node.leaf.credential.identity);
                    members.push(identity);
                }
            }
        }
        catch (error) {
            console.warn("Could not extract members:", error);
            members.push(this.userId); // At least include self
        }
        return members;
    };
    /**
     * Convert bytes to hex string
     */
    MLSManager.prototype.bytesToHex = function (bytes) {
        return Array.from(bytes)
            .map(function (b) { return b.toString(16).padStart(2, "0"); })
            .join("");
    };
    /**
     * Ensure the manager is initialized
     */
    MLSManager.prototype.ensureInitialized = function () {
        if (!this.initialized) {
            throw new Error("MLS Manager not initialized. Call initialize() first.");
        }
    };
    return MLSManager;
}());
exports.MLSManager = MLSManager;
exports.default = MLSManager;
