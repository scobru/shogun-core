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
        // Rimuovo i console.log superflui
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
        // Linea 50
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
        // Rimuovo i console.log superflui
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
            const conn = this.assertMetaMask();
            if (typeof conn.createSigningCredential === "function") {
                return await conn.createSigningCredential(address);
            }
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
            const conn = this.assertMetaMask();
            if (typeof conn.createAuthenticator === "function") {
                return conn.createAuthenticator(address);
            }
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
            const conn = this.assertMetaMask();
            if (typeof conn.createDerivedKeyPair === "function") {
                return await conn.createDerivedKeyPair(address, extra);
            }
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
            const conn = this.assertMetaMask();
            if (typeof conn.signWithDerivedKeys === "function") {
                return await conn.signWithDerivedKeys(data, address, extra);
            }
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
        const conn = this.assertMetaMask();
        if (typeof conn.getSigningCredential === "function") {
            return conn.getSigningCredential(address);
        }
        return this.assertSigner().getCredential(address);
    }
    /**
     * List all signing credentials
     */
    listSigningCredentials() {
        const conn = this.assertMetaMask();
        if (typeof conn.listSigningCredentials === "function") {
            return conn.listSigningCredentials();
        }
        return this.assertSigner().listCredentials();
    }
    /**
     * Remove a signing credential
     */
    removeSigningCredential(address) {
        const conn = this.assertMetaMask();
        if (typeof conn.removeSigningCredential === "function") {
            return conn.removeSigningCredential(address);
        }
        return this.assertSigner().removeCredential(address);
    }
    // === CONSISTENCY METHODS ===
    /**
     * Creates a Gun user from Web3 signing credential
     * This ensures the SAME user is created as with normal approach
     */
    async createGunUserFromSigningCredential(address) {
        try {
            const conn = this.assertMetaMask();
            if (typeof conn.createGunUserFromSigningCredential === "function") {
                return await conn.createGunUserFromSigningCredential(address);
            }
            const core = this.assertInitialized();
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
        const conn = this.assertMetaMask();
        if (typeof conn.getGunUserPubFromSigningCredential === "function") {
            return conn.getGunUserPubFromSigningCredential(address);
        }
        return this.assertSigner().getGunUserPub(address);
    }
    /**
     * Get the password (for consistency checking)
     */
    getPassword(address) {
        const conn = this.assertMetaMask();
        if (typeof conn.getPassword === "function") {
            return conn.getPassword(address);
        }
        return this.assertSigner().getPassword(address);
    }
    /**
     * Verify consistency between oneshot and normal approaches
     * This ensures both approaches create the same Gun user
     */
    async verifyConsistency(address, expectedUserPub) {
        try {
            const conn = this.assertMetaMask();
            if (typeof conn.verifyConsistency === "function") {
                return await conn.verifyConsistency(address, expectedUserPub);
            }
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
            const conn = this.assertMetaMask();
            if (typeof conn.setupConsistentOneshotSigning === "function") {
                return await conn.setupConsistentOneshotSigning(address);
            }
            // Fallback implementation when connector doesn't have the method
            const credential = await this.createSigningCredential(address);
            const authenticator = this.createAuthenticator(address);
            const gunUser = await this.createGunUserFromSigningCredential(address);
            return {
                credential,
                authenticator,
                gunUser,
                username: address,
                password: "web3-generated-password",
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
        try {
            const core = this.assertInitialized();
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for Web3 login");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "WEB3_UNAVAILABLE", "Web3 is not available in the browser");
            }
            // Use setupConsistentOneshotSigning for login
            const { gunUser } = await this.setupConsistentOneshotSigning(address);
            if (!gunUser.success) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "WEB3_LOGIN_FAILED", gunUser.error || "Failed to log in with Web3 credentials");
            }
            // Set authentication method to web3
            core.setAuthMethod("web3");
            // Return success result
            const loginResult = {
                success: true,
                user: {
                    userPub: gunUser.userPub,
                    username: address,
                },
                userPub: gunUser.userPub,
            };
            // Emit login event
            core.emit("auth:login", {
                userPub: gunUser.userPub || "",
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
            errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Register new user with Web3 wallet
     * @param address - Ethereum address
     * @returns {Promise<SignUpResult>} Registration result
     */
    async signUp(address) {
        try {
            const core = this.assertInitialized();
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for Web3 registration");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "WEB3_UNAVAILABLE", "Web3 is not available in the browser");
            }
            // Use setupConsistentOneshotSigning for signup
            const { gunUser } = await this.setupConsistentOneshotSigning(address);
            if (!gunUser.success) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "WEB3_SIGNUP_FAILED", gunUser.error || "Failed to sign up with Web3 credentials");
            }
            // Set authentication method to web3
            core.setAuthMethod("web3");
            // Return success result
            const signupResult = {
                success: true,
                user: {
                    userPub: gunUser.userPub,
                    username: address,
                },
                userPub: gunUser.userPub,
            };
            return signupResult;
        }
        catch (error) {
            // Handle both ShogunError and generic errors
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "WEB3_SIGNUP_ERROR";
            const errorMessage = error?.message || "Unknown error during Web3 registration";
            errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return { success: false, error: errorMessage };
        }
    }
}
exports.Web3ConnectorPlugin = Web3ConnectorPlugin;
