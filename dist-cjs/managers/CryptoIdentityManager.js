"use strict";
/**
 * CryptoIdentityManager - Wrapper per la generazione delle identità crypto
 * Genera tutte le identità crypto disponibili. Il salvataggio sarà gestito lato frontend.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoIdentityManager = void 0;
const asymmetric_1 = require("../crypto/asymmetric");
const symmetric_1 = require("../crypto/symmetric");
const signal_protocol_1 = require("../crypto/signal-protocol");
const pgp_1 = require("../crypto/pgp");
const mls_1 = require("../crypto/mls");
const sframe_1 = require("../crypto/sframe");
const errorHandler_1 = require("../utils/errorHandler");
/**
 * Manager per la generazione delle identità crypto
 * Genera tutte le identità crypto disponibili. Il salvataggio sarà gestito lato frontend.
 */
class CryptoIdentityManager {
    constructor() {
        this.pgpManager = new pgp_1.PGPManager();
        this.mlsManager = new mls_1.MLSManager("default-user");
        this.sframeManager = new sframe_1.SFrameManager();
        // Inizializza PGP Manager
        this.pgpManager.initialize().catch((error) => {
            console.warn("PGP Manager initialization failed:", error);
        });
    }
    /**
     * Genera tutte le identità crypto disponibili per un utente
     * @param username - Nome utente
     * @param seaPair - Coppia di chiavi SEA dell'utente
     * @returns Promise con le identità generate
     */
    async generateAllIdentities(username, seaPair) {
        try {
            console.log(`🔐 [CryptoIdentityManager] Generating crypto identities for: ${username}`);
            const identities = {
                createdAt: Date.now(),
                version: "1.0.0",
            };
            // 1. Genera coppia di chiavi RSA-4096
            console.log(`🔑 [${username}] Generating RSA key pair...`);
            try {
                identities.rsa = await (0, asymmetric_1.generateKeyPair)();
                console.log(`✅ [${username}] RSA key pair generated`);
            }
            catch (error) {
                console.error(`❌ [${username}] RSA key generation failed:`, error);
            }
            // 2. Genera chiave simmetrica AES-256
            console.log(`🔑 [${username}] Generating AES symmetric key...`);
            try {
                identities.aes = await (0, symmetric_1.generateSymmetricKey)();
                console.log(`✅ [${username}] AES symmetric key generated`);
            }
            catch (error) {
                console.error(`❌ [${username}] AES key generation failed:`, error);
            }
            // 3. Genera identità Signal Protocol
            console.log(`🔑 [${username}] Generating Signal Protocol identity...`);
            try {
                identities.signal = await (0, signal_protocol_1.initializeSignalUser)(username);
                console.log(`✅ [${username}] Signal Protocol identity generated`);
            }
            catch (error) {
                console.error(`❌ [${username}] Signal Protocol generation failed:`, error);
            }
            // 4. Genera coppia di chiavi PGP
            console.log(`🔑 [${username}] Generating PGP key pair...`);
            try {
                identities.pgp = await this.pgpManager.generateKeyPair(username, `${username}@example.com`);
                console.log(`✅ [${username}] PGP key pair generated`);
            }
            catch (error) {
                console.error(`❌ [${username}] PGP key generation failed:`, error);
            }
            // 5. Inizializza MLS Manager e crea gruppo
            console.log(`🔑 [${username}] Initializing MLS group...`);
            try {
                await this.mlsManager.initialize();
                const groupId = `group_${username}_${Date.now()}`;
                const groupInfo = await this.mlsManager.createGroup(groupId);
                // Skip adding members for now due to MLS library issues
                // await this.mlsManager.addMembers(groupId, [username]);
                identities.mls = {
                    groupId: groupInfo.groupId.toString(),
                    memberId: username,
                };
                console.log(`✅ [${username}] MLS group created: ${groupId}`);
            }
            catch (error) {
                console.error(`❌ [${username}] MLS initialization failed:`, error);
            }
            // 6. Genera chiave SFrame
            console.log(`🔑 [${username}] Generating SFrame key...`);
            try {
                await this.sframeManager.initialize();
                const sframeKey = await this.sframeManager.generateKey(1);
                identities.sframe = { keyId: sframeKey.keyId };
                console.log(`✅ [${username}] SFrame key generated: ${sframeKey.keyId}`);
            }
            catch (error) {
                console.error(`❌ [${username}] SFrame key generation failed:`, error);
            }
            console.log(`✅ [CryptoIdentityManager] All crypto identities generated for: ${username}`);
            // Force garbage collection after generation
            if (typeof global !== "undefined" && global.gc) {
                global.gc();
                console.log(`🧹 [${username}] Forced garbage collection after identity generation`);
            }
            return {
                success: true,
                identities,
            };
        }
        catch (error) {
            console.error(`❌ [CryptoIdentityManager] Identity generation failed:`, error);
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.ENCRYPTION, "IDENTITY_GENERATION_FAILED", error.message ?? "Failed to generate crypto identities", error);
            return {
                success: false,
                error: error.message ?? "Failed to generate crypto identities",
            };
        }
    }
    /**
     * Genera le identità crypto per un utente
     * Wrapper che chiama generateAllIdentities (mantenuto per compatibilità)
     * @param username - Nome utente
     * @param seaPair - Coppia di chiavi SEA dell'utente (opzionale, non più utilizzato ma mantenuto per compatibilità)
     * @param forceRegenerate - Ignorato, genera sempre nuove identità
     * @returns Promise con le identità generate
     */
    async setupCryptoIdentities(username, seaPair, forceRegenerate = false) {
        return this.generateAllIdentities(username, seaPair);
    }
}
exports.CryptoIdentityManager = CryptoIdentityManager;
