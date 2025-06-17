"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3ConnectorPlugin = void 0;
const base_1 = require("../base");
const web3Connector_1 = require("./web3Connector");
const web3Signer_1 = require("./web3Signer");
const logger_1 = require("../../utils/logger");
const ethers_1 = require("ethers");
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
        (0, logger_1.log)("Web3 plugin initialized with signer support");
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
        (0, logger_1.log)("Web3 plugin destroyed");
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
        (0, logger_1.log)("Calling credential generation");
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
            (0, logger_1.log)(`Creating Web3 signing credential for address: ${address}`);
            return await this.assertSigner().createSigningCredential(address);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating Web3 signing credential: ${error.message}`);
            throw error;
        }
    }
    /**
     * Creates an authenticator function for Web3 signing
     */
    createAuthenticator(address) {
        try {
            (0, logger_1.log)(`Creating Web3 authenticator for address: ${address}`);
            return this.assertSigner().createAuthenticator(address);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating Web3 authenticator: ${error.message}`);
            throw error;
        }
    }
    /**
     * Creates a derived key pair from Web3 credential
     */
    async createDerivedKeyPair(address, extra) {
        try {
            (0, logger_1.log)(`Creating derived key pair for address: ${address}`);
            return await this.assertSigner().createDerivedKeyPair(address, extra);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating derived key pair: ${error.message}`);
            throw error;
        }
    }
    /**
     * Signs data with derived keys after Web3 verification
     */
    async signWithDerivedKeys(data, address, extra) {
        try {
            (0, logger_1.log)(`Signing data with derived keys for address: ${address}`);
            return await this.assertSigner().signWithDerivedKeys(data, address, extra);
        }
        catch (error) {
            (0, logger_1.logError)(`Error signing with derived keys: ${error.message}`);
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
            (0, logger_1.log)(`Creating Gun user from Web3 signing credential: ${address}`);
            return await this.assertSigner().createGunUser(address, core.gun);
        }
        catch (error) {
            (0, logger_1.logError)(`Error creating Gun user from Web3 signing credential: ${error.message}`);
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
            (0, logger_1.log)(`Verifying Web3 consistency for address: ${address}`);
            return await this.assertSigner().verifyConsistency(address, expectedUserPub);
        }
        catch (error) {
            (0, logger_1.logError)(`Error verifying Web3 consistency: ${error.message}`);
            return { consistent: false };
        }
    }
    /**
     * Complete oneshot workflow that creates the SAME Gun user as normal approach
     * This is the recommended method for oneshot signing with full consistency
     */
    async setupConsistentOneshotSigning(address) {
        try {
            (0, logger_1.log)(`Setting up consistent Web3 oneshot signing for: ${address}`);
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
            (0, logger_1.logError)(`Error setting up consistent Web3 oneshot signing: ${error.message}`);
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
        (0, logger_1.log)("Login with Web3");
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`Web3 login attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for Web3 login");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "WEB3_UNAVAILABLE", "Web3 is not available in the browser");
            }
            (0, logger_1.log)("Generating credentials for Web3 login...");
            const credentials = await this.generateCredentials(address);
            if (!credentials?.username ||
                !credentials?.password ||
                !credentials.signature ||
                !credentials.message) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Web3 credentials not generated correctly or signature missing");
            }
            (0, logger_1.log)(`Credentials generated successfully. Username: ${credentials.username}`);
            (0, logger_1.log)("Verifying Web3 signature...");
            const recoveredAddress = ethers_1.ethers.verifyMessage(credentials.message, credentials.signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                (0, logger_1.logError)(`Signature verification failed. Expected: ${address}, Got: ${recoveredAddress}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "Web3 signature verification failed. Address mismatch.");
            }
            (0, logger_1.log)("Web3 signature verified successfully.");
            // Set authentication method to web3 before login
            core.setAuthMethod("web3");
            // Use core's login method with direct GunDB authentication
            (0, logger_1.log)("Logging in using core login method...");
            const loginResult = await core.login(credentials.username, credentials.password);
            if (!loginResult.success) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "WEB3_LOGIN_FAILED", loginResult.error || "Failed to log in with Web3 credentials");
            }
            // Emit login event
            core.emit("auth:login", {
                userPub: loginResult.userPub,
                username: credentials.username,
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
        (0, logger_1.log)("Sign up with Web3");
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`Web3 registration attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for Web3 registration");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "WEB3_UNAVAILABLE", "Web3 is not available in the browser");
            }
            (0, logger_1.log)("Generating credentials for Web3 registration...");
            const credentials = await this.generateCredentials(address);
            if (!credentials?.username ||
                !credentials?.password ||
                !credentials.signature ||
                !credentials.message) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Web3 credentials not generated correctly or signature missing");
            }
            (0, logger_1.log)(`Credentials generated successfully. Username: ${credentials.username}`);
            (0, logger_1.log)("Verifying Web3 signature...");
            const recoveredAddress = ethers_1.ethers.verifyMessage(credentials.message, credentials.signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                (0, logger_1.logError)(`Signature verification failed. Expected: ${address}, Got: ${recoveredAddress}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "Web3 signature verification failed. Address mismatch.");
            }
            (0, logger_1.log)("Web3 signature verified successfully.");
            // Set authentication method to web3 before signup
            core.setAuthMethod("web3");
            // Use core's signUp method with direct GunDB authentication
            (0, logger_1.log)("Signing up using core signUp method...");
            const signUpResult = await core.signUp(credentials.username, credentials.password);
            if (!signUpResult.success) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "WEB3_SIGNUP_FAILED", signUpResult.error || "Failed to sign up with Web3 credentials");
            }
            // Emit signup event
            core.emit("auth:signup", {
                userPub: signUpResult.userPub,
                username: credentials.username,
                method: "web3",
            });
            return signUpResult;
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
