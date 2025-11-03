"use strict";
/**
 * MLS (Message Layer Security) Manager
 * RFC 9420 implementation using ts-mls library
 * Provides end-to-end encrypted group messaging with forward secrecy
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLSManager = void 0;
const ts_mls_1 = require("ts-mls");
// Helper to strip trailing null nodes per RFC 9420
function stripTrailingNulls(tree) {
    let lastNonNull = tree.length - 1;
    while (lastNonNull >= 0 && tree[lastNonNull] === null) {
        lastNonNull--;
    }
    return tree.slice(0, lastNonNull + 1);
}
/**
 * MLSManager wraps the ts-mls functional API with a class-based interface
 * for easier state management in applications
 */
class MLSManager {
    constructor(userId) {
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
    async initialize() {
        if (this.initialized) {
            console.warn("MLS Manager already initialized");
            return;
        }
        try {
            console.log(`🔐 [MLS] Initializing for user: ${this.userId}`);
            // Use MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519 (ID: 1)
            // Using nobleCryptoProvider for compatibility (pure JS implementation)
            const cipherSuiteName = "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519";
            const cs = (0, ts_mls_1.getCiphersuiteFromName)(cipherSuiteName);
            this.cipherSuite = await ts_mls_1.nobleCryptoProvider.getCiphersuiteImpl(cs);
            console.log(`✅ [MLS] Using ciphersuite: ${cipherSuiteName}`);
            // Mark as initialized before generating key package
            this.initialized = true;
            // Generate initial key package for this user
            await this.generateKeyPackage();
            console.log("✅ [MLS] Initialized successfully");
        }
        catch (error) {
            console.error("❌ [MLS] Failed to initialize:", error);
            throw new Error(`MLS initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Generate a new key package for joining groups
     */
    async generateKeyPackage() {
        this.ensureInitialized();
        try {
            console.log("🔑 [MLS] Generating key package");
            const keyPackageResult = await (0, ts_mls_1.generateKeyPackage)(this.credential, (0, ts_mls_1.defaultCapabilities)(), ts_mls_1.defaultLifetime, [], this.cipherSuite);
            this.keyPackage = {
                ...keyPackageResult,
                userId: this.userId,
            };
            console.log("✅ [MLS] Key package generated");
            return this.keyPackage;
        }
        catch (error) {
            console.error("❌ [MLS] Failed to generate key package:", error);
            throw new Error(`Key package generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get the current key package
     */
    getKeyPackage() {
        return this.keyPackage;
    }
    /**
     * Create a new MLS group
     */
    async createGroup(groupId) {
        this.ensureInitialized();
        try {
            console.log(`📝 [MLS] Creating group: ${groupId}`);
            if (!this.keyPackage) {
                throw new Error("No key package available. Call generateKeyPackage() first.");
            }
            const groupIdBytes = new TextEncoder().encode(groupId);
            // Create group using ts-mls
            const groupState = await (0, ts_mls_1.createGroup)(groupIdBytes, this.keyPackage.publicPackage, this.keyPackage.privatePackage, [], this.cipherSuite);
            this.groups.set(groupId, groupState);
            const groupInfo = {
                groupId: groupIdBytes,
                members: [this.userId],
                epoch: groupState.groupContext.epoch,
            };
            console.log(`✅ [MLS] Group created: ${groupId}, epoch: ${groupState.groupContext.epoch}`);
            return groupInfo;
        }
        catch (error) {
            console.error("❌ [MLS] Failed to create group:", error);
            throw new Error(`Group creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Add members to an existing group
     */
    async addMembers(groupId, keyPackages) {
        this.ensureInitialized();
        try {
            console.log(`➕ [MLS] Adding ${keyPackages.length} member(s) to group: ${groupId}`);
            const groupState = this.groups.get(groupId);
            if (!groupState) {
                throw new Error(`Group ${groupId} not found`);
            }
            // Create add proposals for each key package
            const addProposals = keyPackages.map((kp) => ({
                proposalType: "add",
                add: {
                    keyPackage: kp.publicPackage,
                },
            }));
            // Create commit with add proposals
            const commitResult = await (0, ts_mls_1.createCommit)({ state: groupState, cipherSuite: this.cipherSuite }, { extraProposals: addProposals });
            // Update group state
            this.groups.set(groupId, commitResult.newState);
            if (!commitResult.welcome) {
                throw new Error("No welcome message generated");
            }
            console.log(`✅ [MLS] Members added, new epoch: ${commitResult.newState.groupContext.epoch}`);
            // Debug: Log the commit structure
            console.group("🔍 [MLS Debug] Commit Structure");
            console.log("commitResult keys:", Object.keys(commitResult));
            console.log("commit:", commitResult.commit);
            if (commitResult.commit?.wireformat === "mls_private_message") {
                console.log("commit.privateMessage:", commitResult.commit.privateMessage);
            }
            console.groupEnd();
            // RFC 9420 Section 11.2: Commit Distribution
            // ⚠️ IMPORTANT: The returned commit MUST be sent to all existing group members
            // so they can process it with processCommit() to stay synchronized.
            //
            // Distribution flow:
            // 1. Alice adds Bob: addMembers() returns { welcome, commit }
            // 2. Alice sends welcome to Bob (new member)
            // 3. Alice sends commit to existing members (Charlie, David, etc.)
            // 4. All existing members call processCommit(commit) to update their state
            //
            // Without distributing the commit, existing members will remain at old epoch
            // and won't be able to decrypt messages from the updated group.
            // Convert ratchetTree to a real array (it's Uint8Array-like with numeric indices)
            const ratchetTreeArray = Array.from(commitResult.newState.ratchetTree);
            // RFC 9420: Strip trailing null nodes before transmission
            const strippedTree = stripTrailingNulls(ratchetTreeArray);
            console.log(`🔍 [MLS] Ratchet tree stripped: ${ratchetTreeArray.length} -> ${strippedTree.length} nodes`);
            return {
                welcome: commitResult.welcome,
                ratchetTree: strippedTree,
                commit: commitResult.commit,
            };
        }
        catch (error) {
            console.error("❌ [MLS] Failed to add members:", error);
            throw new Error(`Adding members failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
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
    async processWelcome(welcome, ratchetTree) {
        this.ensureInitialized();
        try {
            console.log("📩 [MLS] Processing welcome message");
            if (!this.keyPackage) {
                throw new Error("No key package available");
            }
            // RFC 9420: Interior null nodes are valid (represent blank parent nodes)
            // Trailing nulls are stripped by sender per RFC requirement
            // Simply pass the tree as-is to ts-mls joinGroup()
            if (ratchetTree && Array.isArray(ratchetTree)) {
                const nullCount = ratchetTree.filter((n) => n === null).length;
                console.log(`🔍 [MLS] Ratchet tree received: ${ratchetTree.length} nodes (${nullCount} interior nulls)`);
                // DEBUG: Log structure of each node
                console.group("🔍 [MLS Debug] Ratchet Tree Structure");
                ratchetTree.forEach((node, i) => {
                    if (node === null) {
                        console.log(`  Node ${i}: NULL`);
                    }
                    else {
                        console.log(`  Node ${i}:`, {
                            type: typeof node,
                            isObject: typeof node === "object" && node !== null,
                            hasNodeType: typeof node === "object" && node !== null && "nodeType" in node,
                            nodeType: node?.nodeType,
                            keys: node && typeof node === "object"
                                ? Object.keys(node).slice(0, 5)
                                : "n/a",
                        });
                    }
                });
                console.groupEnd();
            }
            const groupState = await (0, ts_mls_1.joinGroup)(welcome, this.keyPackage.publicPackage, this.keyPackage.privatePackage, ts_mls_1.emptyPskIndex, this.cipherSuite, ratchetTree);
            const groupId = new TextDecoder().decode(groupState.groupContext.groupId);
            this.groups.set(groupId, groupState);
            // Extract member identities from ratchet tree
            const members = this.extractMembersFromState(groupState);
            const groupInfo = {
                groupId: groupState.groupContext.groupId,
                members,
                epoch: groupState.groupContext.epoch,
            };
            console.log(`✅ [MLS] Welcome processed, joined group: ${groupId}`);
            return groupInfo;
        }
        catch (error) {
            console.error("❌ [MLS] Failed to process welcome:", error);
            throw new Error(`Welcome processing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Encrypt a message for a group
     */
    async encryptMessage(groupId, plaintext) {
        this.ensureInitialized();
        try {
            console.log(`🔒 [MLS] Encrypting message for group: ${groupId}`);
            const groupState = this.groups.get(groupId);
            if (!groupState) {
                throw new Error(`Group ${groupId} not found`);
            }
            const plaintextBytes = new TextEncoder().encode(plaintext);
            // Create application message
            const result = await (0, ts_mls_1.createApplicationMessage)(groupState, plaintextBytes, this.cipherSuite);
            // Update group state (for key ratcheting)
            this.groups.set(groupId, result.newState);
            // Encode the private message
            const encoded = (0, ts_mls_1.encodeMlsMessage)({
                privateMessage: result.privateMessage,
                wireformat: "mls_private_message",
                version: "mls10",
            });
            const envelope = {
                groupId: new TextEncoder().encode(groupId),
                ciphertext: encoded,
                timestamp: Date.now(),
            };
            console.log("✅ [MLS] Message encrypted");
            return envelope;
        }
        catch (error) {
            console.error("❌ [MLS] Failed to encrypt message:", error);
            throw new Error(`Message encryption failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Decrypt a message from a group
     */
    async decryptMessage(envelope) {
        this.ensureInitialized();
        try {
            const groupId = new TextDecoder().decode(envelope.groupId);
            console.log(`🔓 [MLS] Decrypting message for group: ${groupId}`);
            const groupState = this.groups.get(groupId);
            if (!groupState) {
                throw new Error(`Group ${groupId} not found`);
            }
            // Decode the message
            const decoded = (0, ts_mls_1.decodeMlsMessage)(envelope.ciphertext, 0);
            if (!decoded || decoded.length === 0) {
                // Changed from 0n to 0 to fix type error
                throw new Error("Failed to decode message");
            }
            const decodedMessage = decoded[0];
            if (decodedMessage.wireformat !== "mls_private_message") {
                throw new Error("Expected private message");
            }
            // Process the private message
            const result = await (0, ts_mls_1.processPrivateMessage)(groupState, decodedMessage.privateMessage, ts_mls_1.emptyPskIndex, this.cipherSuite);
            // Update group state
            this.groups.set(groupId, result.newState);
            if (result.kind !== "applicationMessage") {
                throw new Error("Expected application message");
            }
            const plaintext = new TextDecoder().decode(result.message);
            console.log("✅ [MLS] Message decrypted");
            return plaintext;
        }
        catch (error) {
            console.error("❌ [MLS] Failed to decrypt message:", error);
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update the group keys (key rotation)
     */
    async updateKey(groupId) {
        this.ensureInitialized();
        try {
            console.log(`🔄 [MLS] Performing key rotation for group: ${groupId}`);
            const groupState = this.groups.get(groupId);
            if (!groupState) {
                throw new Error(`Group ${groupId} not found`);
            }
            // Create update commit (forces path update)
            const commitResult = await (0, ts_mls_1.createCommit)({ state: groupState, cipherSuite: this.cipherSuite }, {});
            // Update group state
            this.groups.set(groupId, commitResult.newState);
            console.log(`✅ [MLS] Key rotation successful, new epoch: ${commitResult.newState.groupContext.epoch}`);
            // Return the raw commit object for other members to process
            return commitResult.commit;
        }
        catch (error) {
            console.error("❌ [MLS] Failed to update key:", error);
            throw new Error(`Key update failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Process a commit message (key rotation, member changes)
     *
     * RFC 9420 Section 12.1.8:
     * - Update commits (key rotation) → PrivateMessage
     * - Add/Remove commits → PublicMessage (for existing group members)
     *
     * This implementation handles both types based on wireformat.
     */
    async processCommit(groupId, commit) {
        this.ensureInitialized();
        try {
            console.log(`⚙️ [MLS] Processing commit for group: ${groupId}`);
            console.log(`🔍 [MLS Debug] Commit wireformat: ${commit.wireformat}`);
            // DETAILED DEBUG LOGGING
            console.group("🔍 [MLS Debug] Full Commit Structure");
            console.log("commit keys:", Object.keys(commit));
            console.log("commit.wireformat:", commit.wireformat);
            console.log("commit.publicMessage:", commit.publicMessage);
            console.log("commit.privateMessage:", commit.privateMessage);
            // Log proposals if present
            if (commit.publicMessage?.content) {
                console.log("publicMessage.content:", commit.publicMessage.content);
                console.log("publicMessage.content.proposals:", commit.publicMessage.content.proposals);
                if (commit.publicMessage.content.proposals) {
                    commit.publicMessage.content.proposals.forEach((prop, i) => {
                        console.log(`  Proposal ${i}:`, {
                            proposalType: prop.proposalType,
                            keys: Object.keys(prop),
                            full: prop,
                        });
                    });
                }
            }
            console.groupEnd();
            const groupState = this.groups.get(groupId);
            if (!groupState) {
                throw new Error(`Group ${groupId} not found`);
            }
            let result;
            // RFC 9420: Route based on message type
            if (commit.wireformat === "mls_public_message") {
                // Public messages (add/remove member commits)
                console.log("🔍 [MLS Debug] Processing as PUBLIC message (add/remove)...");
                const publicMessage = commit.publicMessage || commit;
                result = await (0, ts_mls_1.processPublicMessage)(groupState, publicMessage, ts_mls_1.emptyPskIndex, this.cipherSuite);
            }
            else if (commit.wireformat === "mls_private_message") {
                // Private messages (update/key rotation commits)
                console.log("🔍 [MLS Debug] Processing as PRIVATE message (update)...");
                const privateMessage = commit.privateMessage || commit;
                result = await (0, ts_mls_1.processPrivateMessage)(groupState, privateMessage, ts_mls_1.emptyPskIndex, this.cipherSuite);
            }
            else {
                throw new Error(`Unknown commit wireformat: ${commit.wireformat}`);
            }
            // Update group state
            this.groups.set(groupId, result.newState);
            console.log(`✅ [MLS] Commit processed, epoch: ${result.newState.groupContext.epoch}`);
        }
        catch (error) {
            console.error("❌ [MLS] Failed to process commit:", error);
            console.error("❌ [MLS Debug] Error details:", error instanceof Error ? error.stack : String(error));
            console.error("❌ [MLS Debug] Error message:", error instanceof Error ? error.message : String(error));
            throw new Error(`Commit processing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Remove members from a group
     */
    async removeMembers(groupId, memberIndices) {
        this.ensureInitialized();
        try {
            console.log(`➖ [MLS] Removing ${memberIndices.length} member(s) from group: ${groupId}`);
            const groupState = this.groups.get(groupId);
            if (!groupState) {
                throw new Error(`Group ${groupId} not found`);
            }
            // Create remove proposals
            const removeProposals = memberIndices.map((index) => ({
                proposalType: "remove",
                remove: {
                    removed: index, // Changed from BigInt(index) to number
                },
            }));
            // Create commit with remove proposals
            const commitResult = await (0, ts_mls_1.createCommit)({ state: groupState, cipherSuite: this.cipherSuite }, { extraProposals: removeProposals });
            // Update group state
            this.groups.set(groupId, commitResult.newState);
            // Encode the commit
            let encodedCommit;
            if (commitResult.commit &&
                commitResult.commit.wireformat === "mls_public_message") {
                encodedCommit = (0, ts_mls_1.encodeMlsMessage)({
                    publicMessage: commitResult.commit
                        .publicMessage,
                    wireformat: "mls_public_message",
                    version: "mls10",
                });
            }
            else {
                // Fallback or error handling if not a public message
                // For now, we'll assume it should be public for remove operation.
                throw new Error("Commit result does not contain a public message for encoding.");
            }
            console.log("✅ [MLS] Members removed");
            return encodedCommit;
        }
        catch (error) {
            console.error("❌ [MLS] Failed to remove members:", error);
            throw new Error(`Member removal failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get list of groups
     */
    async getGroups() {
        this.ensureInitialized();
        try {
            const groupIds = Array.from(this.groups.keys()).map((id) => new TextEncoder().encode(id));
            return groupIds;
        }
        catch (error) {
            console.error("❌ [MLS] Failed to get groups:", error);
            throw new Error(`Getting groups failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Export group state for persistence
     */
    async exportGroupState(groupId) {
        this.ensureInitialized();
        try {
            console.log(`💾 [MLS] Exporting state for group: ${groupId}`);
            const groupState = this.groups.get(groupId);
            if (!groupState) {
                throw new Error(`Group ${groupId} not found`);
            }
            // Note: ts-mls ClientState contains non-serializable crypto keys
            // This is a simplified export - in production you'd need proper serialization
            const exportData = {
                groupId,
                epoch: groupState.groupContext.epoch.toString(),
                exported: Date.now(),
                // Add other serializable fields as needed
            };
            console.log("✅ [MLS] Group state exported");
            return exportData;
        }
        catch (error) {
            console.error("❌ [MLS] Failed to export group state:", error);
            throw new Error(`Group state export failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get user ID
     */
    getUserId() {
        return this.userId;
    }
    /**
     * Get group information
     */
    async getGroupKeyInfo(groupId) {
        const groupState = this.groups.get(groupId);
        if (!groupState) {
            return null;
        }
        const members = this.extractMembersFromState(groupState);
        return {
            groupId,
            epoch: groupState.groupContext.epoch.toString(),
            members,
            cipherSuite: "MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519",
            treeHash: this.bytesToHex(groupState.groupContext.treeHash).substring(0, 16),
        };
    }
    /**
     * Clean up resources
     */
    async destroy() {
        this.groups.clear();
        this.keyPackage = null;
        this.initialized = false;
        console.log("✅ [MLS] Manager destroyed");
    }
    /**
     * Extract member identities from group state
     */
    extractMembersFromState(state) {
        const members = [];
        try {
            // Iterate through ratchet tree to find leaf nodes
            for (let i = 0; i < state.ratchetTree.length; i++) {
                const node = state.ratchetTree[i];
                if (node &&
                    node.nodeType === "leaf" &&
                    node.leaf.credential) {
                    const credential = node.leaf.credential;
                    if (credential.credentialType === "basic" && credential.identity) {
                        const identity = new TextDecoder().decode(credential.identity);
                        members.push(identity);
                    }
                    else {
                        console.warn("Skipping credential without basic identity:", credential);
                    }
                }
            }
        }
        catch (error) {
            console.warn("Could not extract members:", error);
            members.push(this.userId); // At least include self
        }
        return members;
    }
    /**
     * Convert bytes to hex string
     */
    bytesToHex(bytes) {
        return Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }
    /**
     * Ensure the manager is initialized
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error("MLS Manager not initialized. Call initialize() first.");
        }
    }
}
exports.MLSManager = MLSManager;
exports.default = MLSManager;
