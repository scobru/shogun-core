import { ethers } from "ethers";
import { log, logError } from "../../utils/logger";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";
import { EventEmitter } from "../../utils/eventEmitter";
/**
 * Genera una password casuale sicura
 * @param length Lunghezza della password
 * @returns Password generata
 */
function generateSecureRandomPassword(length = 32) {
    // Genera una stringa casuale sicura
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
/**
 * Deriva una chiave di cifratura da username e password
 * @param username Nome utente
 * @param password Password
 * @returns Chiave derivata
 */
async function deriveEncryptionKey(username, password) {
    // In un ambiente reale, usa PBKDF2 o Argon2
    const data = new TextEncoder().encode(`${username}:${password}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
/**
 * ShogunDID class for decentralized identity management
 */
export class ShogunDID extends EventEmitter {
    /**
     * Initialize ShogunDID manager
     */
    constructor(shogunCore, registryConfig, options) {
        super();
        this.methodName = "shogun";
        this.didCache = new Map();
        this.DEFAULT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
        this.DEFAULT_TIMEOUT = 10000; // 10 seconds
        this.DEFAULT_MAX_RETRIES = 3;
        this.DEFAULT_RETRY_DELAY = 1000; // 1 second
        this.registryConfig = {
            address: "0x1234...", // Da configurare
            network: "mainnet",
            timeout: this.DEFAULT_TIMEOUT,
            maxRetries: this.DEFAULT_MAX_RETRIES,
            retryDelay: this.DEFAULT_RETRY_DELAY,
        };
        this.core = shogunCore;
        this.registryConfig = { ...this.registryConfig, ...registryConfig };
        this.options = options || { useSecureRandomPassword: true };
        log("ShogunDID initialized");
    }
    /**
     * Create a new Shogun DID
     */
    async createDID(options = {}) {
        try {
            if (!this.core.isLoggedIn()) {
                throw new Error("User must be logged in to create a DID");
            }
            const userPub = this.getUserPublicKey();
            if (!userPub) {
                throw new Error("Cannot retrieve user's public key");
            }
            let methodSpecificId = ethers
                .keccak256(ethers.toUtf8Bytes(userPub))
                .slice(2, 42);
            if (options.network) {
                methodSpecificId = `${options.network}:${methodSpecificId}`;
            }
            const did = `did:${this.methodName}:${methodSpecificId}`;
            await this.storeDID(did, options);
            this.emit("didCreated", { did });
            log(`Created DID: ${did}`);
            return did;
        }
        catch (error) {
            logError("Error creating DID:", error);
            ErrorHandler.handle(ErrorType.DID, "CREATE_DID_ERROR", error instanceof Error ? error.message : "Error creating DID", error);
            throw error;
        }
    }
    /**
     * Store DID document
     * @param did DID identifier
     * @param options DID creation options or document
     * @returns Promise that resolves when DID is stored
     */
    async storeDID(did, options) {
        try {
            if (!this.isValidDID(did)) {
                throw new Error("Invalid DID format");
            }
            // Use existing document if provided, otherwise create a new one
            const didDocument = options.document || this.createDidDocument(did, options);
            // Store in GunDB
            return new Promise((resolve, reject) => {
                this.core.gun
                    .get("dids")
                    .get(did)
                    .put({
                    document: JSON.stringify(didDocument),
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    deactivated: false,
                }, (ack) => {
                    if (ack.err) {
                        reject(new Error(`Failed to store DID: ${ack.err}`));
                    }
                    else {
                        // Associate DID with current user
                        this.core.gun
                            .user()
                            .get("did")
                            .put(did, (userAck) => {
                            if (userAck.err) {
                                logError(`Warning: DID created but not associated with user: ${userAck.err}`);
                            }
                            resolve();
                        });
                    }
                });
                // Set timeout to avoid hanging
                setTimeout(() => reject(new Error("Timeout storing DID")), 10000);
            });
        }
        catch (error) {
            logError("Error storing DID:", error);
            throw error;
        }
    }
    /**
     * Create a DID Document from options
     * @param did DID identifier
     * @param options Creation options
     * @returns DID Document
     */
    createDidDocument(did, options) {
        const controller = options.controller ?? this.getUserPublicKey() ?? did;
        // Create basic DID document structure
        const document = {
            "@context": [
                "https://www.w3.org/ns/did/v1",
                "https://w3id.org/security/suites/ed25519-2020/v1",
            ],
            id: did,
            controller: controller,
            verificationMethod: [
                {
                    id: `${did}#keys-1`,
                    type: "Ed25519VerificationKey2020",
                    controller: did,
                    publicKeyMultibase: `z${this.getUserPublicKey() || ethers.keccak256(ethers.toUtf8Bytes(did))}`,
                },
            ],
            authentication: [`${did}#keys-1`],
            assertionMethod: [`${did}#keys-1`],
        };
        // Add services if provided
        if (options.services && options.services.length > 0) {
            document.service = options.services.map((service, index) => ({
                id: `${did}#service-${index + 1}`,
                type: service.type,
                serviceEndpoint: service.endpoint,
            }));
        }
        return document;
    }
    /**
     * Helper to get public key of current user
     */
    getUserPublicKey() {
        try {
            if (!this.core.isLoggedIn()) {
                return null;
            }
            const user = this.core.gun.user();
            // @ts-ignore - Accessing internal Gun property that is not fully typed
            const pub = user && user._ && user._.sea && user._.sea.pub;
            return pub ?? null;
        }
        catch (error) {
            logError("Error getting user public key:", error);
            return null;
        }
    }
    /**
     * Resolve a DID with caching
     */
    async resolveDID(did, options = {}) {
        try {
            const cacheDuration = options.cacheDuration ?? this.DEFAULT_CACHE_DURATION;
            const timeout = options.timeout ?? this.DEFAULT_TIMEOUT;
            // Check cache first
            const cached = this.didCache.get(did);
            if (cached && Date.now() - cached.timestamp < cacheDuration) {
                return {
                    didResolutionMetadata: { contentType: "application/did+json" },
                    didDocument: this.getDocumentFromCache(cached),
                    didDocumentMetadata: {},
                };
            }
            // Validate DID format
            if (!this.isValidDID(did)) {
                return this.createErrorResolution("invalidDid", "Invalid DID format");
            }
            const [_, method, methodSpecificId] = did.split(":");
            if (method !== this.methodName) {
                return this.createErrorResolution("unsupportedDidMethod", `Unsupported DID method: ${method}`);
            }
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    resolve(this.createErrorResolution("timeout", "DID resolution timeout"));
                }, timeout);
                this.core.gun
                    .get("dids")
                    .get(did)
                    .once((didDocData) => {
                    clearTimeout(timeoutId);
                    if (!didDocData) {
                        resolve(this.createErrorResolution("notFound", "DID Document not found"));
                        return;
                    }
                    try {
                        const didDocument = this.parseOrCreateDIDDocument(did, didDocData);
                        // Cache the result
                        this.didCache.set(did, {
                            data: didDocument,
                            document: didDocument, // For backwards compatibility
                            timestamp: Date.now(),
                            network: methodSpecificId.split(":")[0] || "main",
                        });
                        resolve({
                            didResolutionMetadata: { contentType: "application/did+json" },
                            didDocument,
                            didDocumentMetadata: {
                                created: didDocData.created,
                                updated: didDocData.updated,
                                deactivated: didDocData.deactivated ?? false,
                            },
                        });
                    }
                    catch (error) {
                        resolve(this.createErrorResolution("invalidDidDocument", "Error parsing DID Document"));
                    }
                });
            });
        }
        catch (error) {
            logError("Error resolving DID:", error);
            return this.createErrorResolution("internalError", error instanceof Error ? error.message : "Unknown error");
        }
    }
    /**
     * Register DID on blockchain with retry logic
     */
    async registerDIDOnChain(did, signer) {
        try {
            if (!this.core.isLoggedIn()) {
                throw new Error("User must be logged in to register DID on chain");
            }
            let effectiveSigner = signer || this.getWallet();
            if (!effectiveSigner) {
                throw new Error("No signer provided and main wallet not available");
            }
            const didRegistryABI = [
                "function registerDID(string did, string controller) public returns (bool)",
            ];
            const didRegistryContract = new ethers.Contract(this.registryConfig.address, didRegistryABI, effectiveSigner);
            for (let attempt = 1; attempt <= this.registryConfig.maxRetries; attempt++) {
                try {
                    const tx = await didRegistryContract.registerDID(did, this.getUserPublicKey());
                    const receipt = await tx.wait();
                    this.emit("didRegistered", { did, txHash: receipt.hash });
                    log(`DID registered on blockchain: ${did}, tx: ${receipt.hash}`);
                    return {
                        success: true,
                        txHash: receipt.hash,
                    };
                }
                catch (error) {
                    if (attempt === this.registryConfig.maxRetries)
                        throw error;
                    await new Promise((resolve) => setTimeout(resolve, this.registryConfig.retryDelay));
                }
            }
            throw new Error("Failed to register DID after retries");
        }
        catch (error) {
            logError("Error registering DID on blockchain:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Get the current user's DID
     * @returns The user's DID or null if not found
     */
    async getCurrentUserDID() {
        try {
            if (!this.core.isLoggedIn()) {
                return null;
            }
            const userPub = this.getUserPublicKey();
            if (!userPub) {
                return null;
            }
            return new Promise((resolve) => {
                // Try to find existing DID in user's space
                this.core.gun
                    .user()
                    .get("did")
                    .once((data) => {
                    if (data && typeof data === "string") {
                        resolve(data);
                    }
                    else {
                        resolve(null);
                    }
                });
                // Set timeout to avoid hanging
                setTimeout(() => resolve(null), 5000);
            });
        }
        catch (error) {
            logError("Error getting current user DID:", error);
            return null;
        }
    }
    /**
     * Authenticate using a DID
     * @param did - The DID to authenticate
     * @param challenge - Optional challenge for authentication
     * @returns Authentication result
     */
    async authenticateWithDID(did, challenge) {
        try {
            log(`Authenticating with DID: ${did}`);
            // Verify DID format
            if (!this.isValidDID(did)) {
                return {
                    success: false,
                    error: "Invalid DID format",
                };
            }
            // Resolve DID to get document
            const resolution = await this.resolveDID(did);
            if (resolution.didResolutionMetadata.error || !resolution.didDocument) {
                return {
                    success: false,
                    error: `DID resolution failed: ${resolution.didResolutionMetadata.error}`,
                };
            }
            // Extract authentication details from DID Document
            const authMethod = this.extractAuthenticationMethod(resolution.didDocument);
            if (!authMethod) {
                return {
                    success: false,
                    error: "No valid authentication method found in DID Document",
                };
            }
            // Determine which authentication method to use
            if (authMethod.type.includes("EcdsaSecp256k1")) {
                // Handle Ethereum/MetaMask authentication
                return this.authenticateWithEthereum(authMethod, challenge);
            }
            else if (authMethod.type.includes("WebAuthn")) {
                // Handle WebAuthn authentication
                return this.authenticateWithWebAuthn(authMethod, challenge);
            }
            else {
                // Default to GunDB authentication
                return this.authenticateWithGunDB(authMethod.controller.split(":").pop() ?? "", challenge);
            }
        }
        catch (error) {
            logError("Error authenticating with DID:", error);
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Unknown error during authentication",
            };
        }
    }
    /**
     * Update DID Document
     * @param did DID to update
     * @param updates Partial DID Document to merge with existing document
     * @returns True if the document was updated successfully
     */
    async updateDIDDocument(did, updates) {
        try {
            if (!this.core.isLoggedIn()) {
                throw new Error("User must be logged in to update a DID document");
            }
            if (!this.isValidDID(did)) {
                throw new Error("Invalid DID format");
            }
            // Resolve the current DID document
            const resolution = await this.resolveDID(did);
            if (resolution.didResolutionMetadata.error || !resolution.didDocument) {
                throw new Error(`Cannot update DID document: ${resolution.didResolutionMetadata.error ?? "Document not found"}`);
            }
            // Merge the existing document with updates
            const currentDoc = resolution.didDocument;
            const updatedDoc = {
                ...currentDoc,
                ...updates,
            };
            // Special handling for arrays that need to be merged instead of replaced
            if (updates.service && currentDoc.service) {
                // Find services by ID to update, or add if not exists
                const mergedServices = [...currentDoc.service];
                for (const newService of updates.service) {
                    const existingIndex = mergedServices.findIndex((s) => s.id === newService.id);
                    if (existingIndex >= 0) {
                        mergedServices[existingIndex] = newService;
                    }
                    else {
                        mergedServices.push(newService);
                    }
                }
                updatedDoc.service = mergedServices;
            }
            if (updates.verificationMethod && currentDoc.verificationMethod) {
                // Same merge logic for verification methods
                const mergedMethods = [...currentDoc.verificationMethod];
                for (const newMethod of updates.verificationMethod) {
                    const existingIndex = mergedMethods.findIndex((m) => m.id === newMethod.id);
                    if (existingIndex >= 0) {
                        mergedMethods[existingIndex] = newMethod;
                    }
                    else {
                        mergedMethods.push(newMethod);
                    }
                }
                updatedDoc.verificationMethod = mergedMethods;
            }
            // Store the updated document
            await this.storeDID(did, { document: updatedDoc });
            // Update the cache
            const [_, , methodSpecificId] = did.split(":");
            this.didCache.set(did, {
                data: updatedDoc,
                document: updatedDoc, // For backwards compatibility
                timestamp: Date.now(),
                network: methodSpecificId.split(":")[0] || "main",
            });
            this.emit("didUpdated", { did, document: updatedDoc });
            log(`Updated DID Document: ${did}`);
            return true;
        }
        catch (error) {
            logError("Error updating DID document:", error);
            ErrorHandler.handle(ErrorType.DID, "UPDATE_DID_ERROR", error instanceof Error ? error.message : "Error updating DID", error);
            return false;
        }
    }
    /**
     * Deactivate a DID
     * @param did - The DID to deactivate
     * @returns Whether the deactivation was successful
     */
    async deactivateDID(did) {
        try {
            if (!this.core.isLoggedIn()) {
                throw new Error("User must be logged in to deactivate a DID");
            }
            const currentUserDID = await this.getCurrentUserDID();
            if (did !== currentUserDID) {
                throw new Error("Cannot deactivate a DID you don't control");
            }
            return new Promise((resolve) => {
                this.core.gun
                    .get("dids")
                    .get(did)
                    .put({
                    deactivated: true,
                    updated: new Date().toISOString(),
                }, (ack) => {
                    if (ack.err) {
                        logError(`Error deactivating DID: ${ack.err}`);
                        resolve(false);
                    }
                    else {
                        log(`Successfully deactivated DID: ${did}`);
                        resolve(true);
                    }
                });
                // Set timeout
                setTimeout(() => resolve(false), 10000);
            });
        }
        catch (error) {
            logError("Error deactivating DID:", error);
            return false;
        }
    }
    /**
     * Validate if a string is a properly formatted DID
     * @param did - The DID to validate
     * @returns Whether the DID is valid
     */
    isValidDID(did) {
        // Basic DID format validation
        const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9.:%]+$/;
        return didRegex.test(did);
    }
    /**
     * Generate a DID Document from a DID
     * @param did - The DID to create a document for
     * @param options - DID creation options
     * @returns The created DID Document
     */
    generateDIDDocument(did, options = {}) {
        // Get user's public key
        const userPub = this.getUserPublicKey();
        // Basic DID Document following W3C standards
        const document = {
            "@context": [
                "https://www.w3.org/ns/did/v1",
                "https://w3id.org/security/suites/ed25519-2020/v1",
            ],
            id: did,
            controller: options.controller ?? did,
            verificationMethod: [
                {
                    id: `${did}#keys-1`,
                    type: "Ed25519VerificationKey2020",
                    controller: did,
                    publicKeyMultibase: `z${userPub}`,
                },
            ],
            authentication: [`${did}#keys-1`],
            assertionMethod: [`${did}#keys-1`],
        };
        // Add services if provided
        if (options.services && options.services.length > 0) {
            document.service = options.services.map((service, index) => ({
                id: `${did}#service-${index + 1}`,
                type: service.type,
                serviceEndpoint: service.endpoint,
            }));
        }
        return document;
    }
    // Private helper methods
    createErrorResolution(error, message) {
        return {
            didResolutionMetadata: {
                error,
                contentType: "application/did+json",
            },
            didDocument: null,
            didDocumentMetadata: {},
        };
    }
    parseOrCreateDIDDocument(did, data) {
        if (data.document) {
            try {
                // Parse stored document
                return JSON.parse(data.document);
            }
            catch (e) {
                // If parsing fails, create a new basic document
                logError("Error parsing stored DID Document, creating a basic one", e);
            }
        }
        // Create a basic DID Document if none exists or parsing failed
        return {
            "@context": "https://www.w3.org/ns/did/v1",
            id: did,
            authentication: [],
        };
    }
    extractAuthenticationMethod(document) {
        // Get authentication methods
        const authMethods = document.authentication || [];
        // Process authentication references or embedded methods
        for (const auth of authMethods) {
            if (typeof auth === "string") {
                // Reference to a verification method
                const methodId = auth;
                const method = document.verificationMethod?.find((vm) => vm.id === methodId);
                if (method) {
                    return {
                        id: method.id,
                        type: method.type,
                        controller: method.controller,
                    };
                }
            }
            else {
                // Embedded verification method
                return auth;
            }
        }
        return null;
    }
    getWallet() {
        try {
            if (this.core.constructor.name === "ShogunCore") {
                // Core moderno, usa getPlugin
                if (!this.core.getPlugin) {
                    return null;
                }
                const walletPlugin = this.core.getPlugin(this.core.constructor.name === "ShogunCore"
                    ? "wallet"
                    : "walletManager");
                if (walletPlugin &&
                    typeof walletPlugin === "object" &&
                    "getMainWallet" in walletPlugin) {
                    return walletPlugin.getMainWallet();
                }
            }
            else if ("getMainWallet" in this.core) {
                // Core legacy
                return this.core.getMainWallet();
            }
            return null;
        }
        catch (e) {
            return null;
        }
    }
    async authenticateWithEthereum(authMethod, challenge) {
        // Extract Ethereum address from DID or authMethod
        const address = authMethod.id.split("#")[0].split(":").pop() || "";
        // Usa il metodo loginWithMetaMask se disponibile nel core
        if ("loginWithMetaMask" in this.core) {
            return this.core.loginWithMetaMask(address);
        }
        // Altrimenti, prova con getAuthenticationMethod
        if (!this.core.getAuthenticationMethod) {
            return {
                success: false,
                error: "Authentication method provider not available",
            };
        }
        const auth = this.core.getAuthenticationMethod("metamask");
        if (auth && typeof auth === "object" && "login" in auth) {
            return auth.login(address);
        }
        return {
            success: false,
            error: "MetaMask authentication not available",
        };
    }
    async authenticateWithWebAuthn(authMethod, challenge) {
        // Extract username from controller or other means
        const username = authMethod.controller.split(":").pop() || "";
        // Usa il metodo loginWithWebAuthn se disponibile nel core
        if ("loginWithWebAuthn" in this.core) {
            return this.core.loginWithWebAuthn(username);
        }
        // Altrimenti, prova con getAuthenticationMethod
        if (!this.core.getAuthenticationMethod) {
            return {
                success: false,
                error: "Authentication method provider not available",
            };
        }
        const auth = this.core.getAuthenticationMethod("webauthn");
        if (auth && typeof auth === "object" && "login" in auth) {
            return auth.login(username);
        }
        return {
            success: false,
            error: "WebAuthn authentication not available",
        };
    }
    async authenticateWithGunDB(username, challenge) {
        try {
            log("Authenticating with GunDB using password method", username);
            // Estraiamo la password dalla sfida o generiamo una password sicura
            let password = challenge ?? "";
            // Se abilitato, genera una password casuale sicura
            const useSecureRandomPassword = this.options && this.options.useSecureRandomPassword;
            if (useSecureRandomPassword && !password) {
                password = generateSecureRandomPassword();
            }
            // Deriva una chiave sicura da username e password
            const encryptionKey = await deriveEncryptionKey(username, password);
            // Utilizziamo il metodo di autenticazione "password"
            if (!this.core.getAuthenticationMethod) {
                throw new Error("Authentication method provider not available");
            }
            const passwordAuth = this.core.getAuthenticationMethod("password");
            if (!passwordAuth) {
                throw new Error("Password authentication method not available");
            }
            // Autentica l'utente
            return await passwordAuth.authenticate(username, encryptionKey);
        }
        catch (error) {
            log("Error authenticating with GunDB:", error);
            throw error;
        }
    }
    /**
     * Verifica se un DID è registrato sulla blockchain
     * @param did - Il DID da verificare
     * @returns Promise con il risultato della verifica
     */
    async verifyDIDOnChain(did) {
        try {
            // Definire l'interfaccia del contratto (ABI semplificato per esempio)
            const didRegistryABI = [
                "function isDIDRegistered(string did) public view returns (bool)",
                "function getDIDController(string did) public view returns (string)",
            ];
            // Indirizzo del contratto di registro DID
            const didRegistryAddress = "0x1234..."; // Da sostituire con l'indirizzo reale
            // Se non c'è un provider in ShogunCore, usiamo il signer del wallet
            const wallet = this.getWallet();
            const provider = wallet?.provider || this.core.provider;
            if (!provider) {
                throw new Error("Provider non disponibile per verificare il DID on-chain");
            }
            // Creare un'istanza del contratto con il provider
            const didRegistryContract = new ethers.Contract(didRegistryAddress, didRegistryABI, provider);
            // Verificare se il DID è registrato
            const isRegistered = await didRegistryContract.isDIDRegistered(did);
            if (!isRegistered) {
                return { isRegistered: false };
            }
            // Ottenere il controller del DID
            const controller = await didRegistryContract.getDIDController(did);
            return {
                isRegistered: true,
                controller,
            };
        }
        catch (error) {
            logError("Error verifying DID on blockchain:", error);
            return {
                isRegistered: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Clear DID cache
     */
    clearCache() {
        this.didCache.clear();
        this.emit("cacheCleared");
    }
    /**
     * Remove specific DID from cache
     */
    removeFromCache(did) {
        this.didCache.delete(did);
        this.emit("didRemovedFromCache", { did });
    }
    /**
     * Helper to get document from cache entry (compatibility)
     */
    getDocumentFromCache(cache) {
        // First try the new structure
        if (cache.data) {
            return cache.data;
        }
        // Fall back to old structure for backwards compatibility
        if (cache.document) {
            return cache.document;
        }
        return null;
    }
}
