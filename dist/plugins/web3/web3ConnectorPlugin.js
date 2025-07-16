"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3ConnectorPlugin = void 0;
const base_1 = require("../base");
const web3Connector_1 = require("./web3Connector");
const web3Signer_1 = require("./web3Signer");
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin per la gestione delle funzionalità Web3 in ShogunCore
 */
class Web3ConnectorPlugin extends base_1.BasePlugin {
    name = "web3";
    version = "1.0.0";
    description = "Provides Ethereum wallet connection and authentication for ShogunCore";
    Web3 = null;
    signer = null;
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Inizializziamo il modulo Web3
        this.Web3 = new web3Connector_1.Web3Connector();
        this.signer = new web3Signer_1.Web3Signer(this.Web3);
        console.log("[web3ConnectorPlugin] Web3 plugin initialized with signer support");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        if (this.Web3) {
            this.Web3.cleanup();
        }
        this.Web3 = null;
        this.signer = null;
        super.destroy();
        console.log("[web3ConnectorPlugin] Web3 plugin destroyed");
    }
    /**
     * Assicura che il modulo Web3 sia inizializzato
     * @private
     */
    assertMetaMask() {
        this.assertInitialized();
        if (!this.Web3) {
            throw new Error("Web3 module not initialized");
        }
        return this.Web3;
    }
    /**
     * Assicura che il signer sia inizializzato
     * @private
     */
    assertSigner() {
        this.assertInitialized();
        if (!this.signer) {
            throw new Error("Web3 signer not initialized");
        }
        return this.signer;
    }
    /**
     * @inheritdoc
     */
    isAvailable() {
        return this.assertMetaMask().isAvailable();
    }
    /**
     * @inheritdoc
     */
    async connectMetaMask() {
        return this.assertMetaMask().connectMetaMask();
    }
    /**
     * @inheritdoc
     */
    async generateCredentials(address) {
        console.log("[web3ConnectorPlugin] Calling credential generation");
        return this.assertMetaMask().generateCredentials(address);
    }
    /**
     * @inheritdoc
     */
    cleanup() {
        this.assertMetaMask().cleanup();
    }
    /**
     * @inheritdoc
     */
    setCustomProvider(rpcUrl, privateKey) {
        this.assertMetaMask().setCustomProvider(rpcUrl, privateKey);
    }
    /**
     * @inheritdoc
     */
    async getSigner() {
        return this.assertMetaMask().getSigner();
    }
    /**
     * @inheritdoc
     */
    async getProvider() {
        return this.assertMetaMask().getProvider();
    }
    /**
     * @inheritdoc
     */
    async generatePassword(signature) {
        return this.assertMetaMask().generatePassword(signature);
    }
    /**
     * @inheritdoc
     */
    async verifySignature(message, signature) {
        return this.assertMetaMask().verifySignature(message, signature);
    }
    // === WEB3 SIGNER METHODS ===
    /**
     * Creates a new Web3 signing credential
     * CONSISTENT with normal Web3 approach
     */
    async createSigningCredential(address) {
        try {
            console.log(`Creating Web3 signing credential for address: ${address}`);
            return await this.assertSigner().createSigningCredential(address);
        }
        catch (error) {
            console.error(`Error creating Web3 signing credential: ${error.message}`);
            throw error;
        }
    }
    /**
     * Creates an authenticator function for Web3 signing
     */
    createAuthenticator(address) {
        try {
            console.log(`Creating Web3 authenticator for address: ${address}`);
            return this.assertSigner().createAuthenticator(address);
        }
        catch (error) {
            console.error(`Error creating Web3 authenticator: ${error.message}`);
            throw error;
        }
    }
    /**
     * Creates a derived key pair from Web3 credential
     */
    async createDerivedKeyPair(address, extra) {
        try {
            console.log(`Creating derived key pair for address: ${address}`);
            return await this.assertSigner().createDerivedKeyPair(address, extra);
        }
        catch (error) {
            console.error(`Error creating derived key pair: ${error.message}`);
            throw error;
        }
    }
    /**
     * Signs data with derived keys after Web3 verification
     */
    async signWithDerivedKeys(data, address, extra) {
        try {
            console.log(`Signing data with derived keys for address: ${address}`);
            return await this.assertSigner().signWithDerivedKeys(data, address, extra);
        }
        catch (error) {
            console.error(`Error signing with derived keys: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get signing credential by address
     */
    getSigningCredential(address) {
        return this.assertSigner().getCredential(address);
    }
    /**
     * List all signing credentials
     */
    listSigningCredentials() {
        return this.assertSigner().listCredentials();
    }
    /**
     * Remove a signing credential
     */
    removeSigningCredential(address) {
        return this.assertSigner().removeCredential(address);
    }
    // === CONSISTENCY METHODS ===
    /**
     * Creates a Gun user from Web3 signing credential
     * This ensures the SAME user is created as with normal approach
     */
    async createGunUserFromSigningCredential(address) {
        try {
            const core = this.assertInitialized();
            console.log(`Creating Gun user from Web3 signing credential: ${address}`);
            return await this.assertSigner().createGunUser(address, core.gun);
        }
        catch (error) {
            console.error(`Error creating Gun user from Web3 signing credential: ${error.message}`);
            throw error;
        }
    }
    /**
     * Get the Gun user public key for a signing credential
     */
    getGunUserPubFromSigningCredential(address) {
        return this.assertSigner().getGunUserPub(address);
    }
    /**
     * Get the password (for consistency checking)
     */
    getPassword(address) {
        return this.assertSigner().getPassword(address);
    }
    /**
     * Verify consistency between oneshot and normal approaches
     * This ensures both approaches create the same Gun user
     */
    async verifyConsistency(address, expectedUserPub) {
        try {
            console.log(`Verifying Web3 consistency for address: ${address}`);
            return await this.assertSigner().verifyConsistency(address, expectedUserPub);
        }
        catch (error) {
            console.error(`Error verifying Web3 consistency: ${error.message}`);
            return { consistent: false };
        }
    }
    /**
     * Complete oneshot workflow that creates the SAME Gun user as normal approach
     * This is the recommended method for oneshot signing with full consistency
     */
    async setupConsistentOneshotSigning(address) {
        try {
            console.log(`Setting up consistent Web3 oneshot signing for: ${address}`);
            // 1. Create signing credential (with consistent password generation)
            const credential = await this.createSigningCredential(address);
            // 2. Create authenticator
            const authenticator = this.createAuthenticator(address);
            // 3. Create Gun user (same as normal approach)
            const gunUser = await this.createGunUserFromSigningCredential(address);
            return {
                credential,
                authenticator,
                gunUser,
                username: credential.username,
                password: credential.password,
            };
        }
        catch (error) {
            console.error(`Error setting up consistent Web3 oneshot signing: ${error.message}`);
            throw error;
        }
    }
    // === EXISTING METHODS ===
    /**
     * Login con Web3
     * @param address - Indirizzo Ethereum
     * @returns {Promise<AuthResult>} Risultato dell'autenticazione
     * @description Autentica l'utente usando le credenziali del wallet Web3 dopo la verifica della firma
     */
    async login(address) {
        console.log("[web3ConnectorPlugin] Login with Web3");
        try {
            const core = this.assertInitialized();
            console.log(`Web3 login attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for Web3 login");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "WEB3_UNAVAILABLE", "Web3 is not available in the browser");
            }
            console.log("[web3ConnectorPlugin] Generating credentials for Web3 login...");
            const k = await this.generateCredentials(address);
            const username = address.toLowerCase();
            if (!k?.pub || !k?.priv) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Web3 credentials not generated correctly or signature missing");
            }
            console.log(`Credentials generated successfully. Username: ${username}`);
            // Set authentication method to web3 before login
            core.setAuthMethod("web3");
            // Use core's login method with direct GunDB authentication
            console.log("[web3ConnectorPlugin] Logging in using core login method...");
            const loginResult = await core.login(username, "", k);
            if (!loginResult.success) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "WEB3_LOGIN_FAILED", loginResult.error || "Failed to log in with Web3 credentials");
            }
            // Emit login event
            core.emit("auth:login", {
                userPub: loginResult.userPub,
                username: address,
                method: "web3",
            });
            return loginResult;
        }
        catch (error) {
            // Handle both ShogunError and generic errors
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "WEB3_LOGIN_ERROR";
            const errorMessage = error?.message || "Unknown error during Web3 login";
            const handledError = errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return {
                success: false,
                error: handledError.message,
            };
        }
    }
    /**
     * Registra un nuovo utente con Web3
     * @param address - Indirizzo Ethereum
     * @returns {Promise<AuthResult>} Risultato della registrazione
     * @description Crea un nuovo account utente usando le credenziali del wallet Web3 dopo la verifica della firma
     */
    async signUp(address) {
        console.log("[web3ConnectorPlugin] Sign up with Web3");
        try {
            const core = this.assertInitialized();
            console.log(`Web3 registration attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for Web3 registration");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "WEB3_UNAVAILABLE", "Web3 is not available in the browser");
            }
            console.log("[web3ConnectorPlugin] Generating credentials for Web3 registration...");
            const k = await this.generateCredentials(address);
            const username = address.toLowerCase();
            if (!k?.pub || !k?.priv) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Web3 credentials not generated correctly or signature missing");
            }
            console.log(`Credentials generated successfully. Username: ${username}`);
            // Set authentication method to web3 before signup
            core.setAuthMethod("web3");
            // Use core's signUp method with direct GunDB authentication
            console.log("[web3ConnectorPlugin] Signing up using core signUp method...");
            const signupResult = await core.signUp(username, "", "", k);
            if (!signupResult.success) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "WEB3_SIGNUP_FAILED", signupResult.error || "Failed to sign up with Web3 credentials");
            }
            return signupResult;
        }
        catch (error) {
            // Handle both ShogunError and generic errors
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "WEB3_SIGNUP_ERROR";
            const errorMessage = error?.message || "Unknown error during Web3 registration";
            const handledError = errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return {
                success: false,
                error: handledError.message,
            };
        }
    }
}
exports.Web3ConnectorPlugin = Web3ConnectorPlugin;
