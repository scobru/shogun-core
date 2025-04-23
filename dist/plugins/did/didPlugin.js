"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIDPlugin = void 0;
const base_1 = require("../base");
const DID_1 = require("./DID");
const logger_1 = require("../../utils/logger");
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin per la gestione delle identità decentralizzate (DID) in ShogunCore
 */
class DIDPlugin extends base_1.BasePlugin {
    name = "did";
    version = "1.0.0";
    description = "Provides Decentralized Identifiers (DID) functionality for ShogunCore";
    did = null;
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Inizializza il modulo DID
        this.did = new DID_1.ShogunDID(core);
        (0, logger_1.log)("DID plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        this.did = null;
        super.destroy();
        (0, logger_1.log)("DID plugin destroyed");
    }
    /**
     * Assicura che il modulo DID sia inizializzato
     * @private
     */
    assertDID() {
        this.assertInitialized();
        if (!this.did) {
            throw new Error("DID module not initialized");
        }
        return this.did;
    }
    /**
     * @inheritdoc
     */
    async getCurrentUserDID() {
        return this.assertDID().getCurrentUserDID();
    }
    /**
     * @inheritdoc
     */
    async resolveDID(did) {
        return this.assertDID().resolveDID(did);
    }
    /**
     * @inheritdoc
     */
    async authenticateWithDID(did, challenge) {
        return this.assertDID().authenticateWithDID(did, challenge);
    }
    /**
     * @inheritdoc
     */
    async createDID(options) {
        return this.assertDID().createDID(options);
    }
    /**
     * @inheritdoc
     */
    async updateDIDDocument(did, documentUpdates) {
        return this.assertDID().updateDIDDocument(did, documentUpdates);
    }
    /**
     * @inheritdoc
     */
    async deactivateDID(did) {
        return this.assertDID().deactivateDID(did);
    }
    /**
     * @inheritdoc
     */
    async registerDIDOnChain(did, signer) {
        return this.assertDID().registerDIDOnChain(did, signer);
    }
    /**
     * @inheritdoc
     */
    async ensureUserHasDID(options) {
        try {
            const core = this.core;
            if (!core) {
                throw new Error("Core not available");
            }
            if (!core.isLoggedIn()) {
                (0, logger_1.logError)("Cannot ensure DID: user not authenticated");
                return null;
            }
            // Utilizziamo una Promise con timeout per evitare blocchi
            return await Promise.race([
                this._ensureUserHasDIDWithTimeout(options),
                // Promise di timeout che si risolve dopo 5 secondi
                new Promise((resolve) => {
                    setTimeout(() => {
                        (0, logger_1.logError)("Timeout during DID creation/verification");
                        resolve(null);
                    }, 5000);
                }),
            ]);
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.DID, "ENSURE_DID_FAILED", `Error ensuring user has DID: ${error instanceof Error ? error.message : String(error)}`, error);
            return null;
        }
    }
    /**
     * Implementation of the ensureUserHasDID with timeout handling
     * @param options DID creation options
     * @returns The DID identifier or null if failed
     * @private
     */
    async _ensureUserHasDIDWithTimeout(options) {
        const core = this.assertInitialized();
        // Verifica se l'utente ha già un DID
        let did = await this.getCurrentUserDID();
        // Se l'utente ha già un DID, lo restituiamo
        if (did) {
            (0, logger_1.log)(`User already has DID: ${did}`);
            // Se sono state fornite opzioni, aggiorniamo il documento DID
            if (options && Object.keys(options).length > 0) {
                try {
                    const updated = await this.updateDIDDocument(did, {
                        service: options.services?.map((service, index) => ({
                            id: `${did}#service-${index + 1}`,
                            type: service.type,
                            serviceEndpoint: service.endpoint,
                        })),
                    });
                    if (updated) {
                        (0, logger_1.log)(`Updated DID document for: ${did}`);
                    }
                }
                catch (updateError) {
                    (0, logger_1.logError)("Error updating DID document:", updateError);
                }
            }
            return did;
        }
        // Se l'utente non ha un DID, ne creiamo uno nuovo
        (0, logger_1.log)("Creating new DID for authenticated user");
        const userPub = core.gundb.gun.user().is?.pub ?? "";
        const mergedOptions = {
            network: "main",
            controller: userPub,
            ...options,
        };
        did = await this.createDID(mergedOptions);
        // Emetti evento di creazione DID
        core.emit("did:created", { did, userPub });
        (0, logger_1.log)(`Created new DID for user: ${did}`);
        return did || null;
    }
}
exports.DIDPlugin = DIDPlugin;
