"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaMaskPlugin = void 0;
const base_1 = require("../base");
const metamask_1 = require("./metamask");
const logger_1 = require("../../utils/logger");
const ethers_1 = require("ethers");
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin per la gestione delle funzionalità MetaMask in ShogunCore
 */
class MetaMaskPlugin extends base_1.BasePlugin {
    name = "metamask";
    version = "1.0.0";
    description = "Provides MetaMask wallet connection and authentication for ShogunCore";
    metamask = null;
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Inizializziamo il modulo MetaMask
        this.metamask = new metamask_1.MetaMask();
        (0, logger_1.log)("MetaMask plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        if (this.metamask) {
            this.metamask.cleanup();
        }
        this.metamask = null;
        super.destroy();
        (0, logger_1.log)("MetaMask plugin destroyed");
    }
    /**
     * Assicura che il modulo MetaMask sia inizializzato
     * @private
     */
    assertMetaMask() {
        this.assertInitialized();
        if (!this.metamask) {
            throw new Error("MetaMask module not initialized");
        }
        return this.metamask;
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
    /**
     * Login con MetaMask
     * @param address - Indirizzo Ethereum
     * @returns {Promise<AuthResult>} Risultato dell'autenticazione
     * @description Autentica l'utente usando le credenziali del wallet MetaMask dopo la verifica della firma
     */
    async login(address) {
        (0, logger_1.log)("Login with MetaMask");
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`MetaMask login attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for MetaMask login");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "METAMASK_UNAVAILABLE", "MetaMask is not available in the browser");
            }
            (0, logger_1.log)("Generating credentials for MetaMask login...");
            const credentials = await this.generateCredentials(address);
            if (!credentials?.username ||
                !credentials?.password ||
                !credentials.signature ||
                !credentials.message) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "MetaMask credentials not generated correctly or signature missing");
            }
            (0, logger_1.log)(`Credentials generated successfully. Username: ${credentials.username}`);
            (0, logger_1.log)("Verifying MetaMask signature...");
            const recoveredAddress = ethers_1.ethers.verifyMessage(credentials.message, credentials.signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                (0, logger_1.logError)(`Signature verification failed. Expected: ${address}, Got: ${recoveredAddress}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "MetaMask signature verification failed. Address mismatch.");
            }
            (0, logger_1.log)("MetaMask signature verified successfully.");
            // For MetaMask authentication, we'll use a direct approach rather than using createUserWithGunDB
            (0, logger_1.log)("Attempting direct auth with GunDB for MetaMask account...");
            // Try to authenticate directly first
            try {
                const gun = core.gun;
                let authSuccess = false;
                await new Promise((resolve) => {
                    // Clear any previous auth state
                    try {
                        if (gun.user && gun.user()._ && gun.user()._.sea) {
                            gun.user()._.sea = null;
                        }
                    }
                    catch (e) {
                        // Ignore reset errors
                    }
                    // Try direct authentication
                    gun
                        .user()
                        .auth(credentials.username, credentials.password, (ack) => {
                        if (ack.err) {
                            (0, logger_1.log)(`Direct auth failed: ${ack.err}, will try creating user first`);
                            resolve();
                        }
                        else {
                            authSuccess = true;
                            (0, logger_1.log)("Direct auth successful");
                            resolve();
                        }
                    });
                });
                // If direct auth succeeded, we're done
                if (authSuccess) {
                    const userPub = core.gun.user().is?.pub || "";
                    // Emit login event
                    core.emit("auth:login", {
                        userPub: userPub,
                        username: credentials.username,
                        method: "metamask",
                    });
                    return {
                        success: true,
                        userPub: userPub,
                        username: credentials.username,
                    };
                }
                // If direct auth failed, try to create the user first
                (0, logger_1.log)("Creating MetaMask user account...");
                let createSuccess = false;
                await new Promise((resolve) => {
                    gun
                        .user()
                        .create(credentials.username, credentials.password, (ack) => {
                        if (ack.err && ack.err !== "User already created!") {
                            (0, logger_1.log)(`User creation failed: ${ack.err}`);
                            resolve();
                        }
                        else {
                            // Even if we get "User already created!" consider it a success
                            createSuccess = true;
                            (0, logger_1.log)("User creation successful or already exists");
                            resolve();
                        }
                    });
                });
                if (!createSuccess) {
                    throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "METAMASK_USER_CREATION_FAILED", "Failed to create MetaMask user account");
                }
                // Now try to authenticate again
                (0, logger_1.log)("Authenticating after create/verify...");
                let loginSuccess = false;
                let userPub = "";
                await new Promise((resolve) => {
                    // Clear any previous auth state
                    try {
                        if (gun.user && gun.user()._ && gun.user()._.sea) {
                            gun.user()._.sea = null;
                        }
                    }
                    catch (e) {
                        // Ignore reset errors
                    }
                    gun
                        .user()
                        .auth(credentials.username, credentials.password, (ack) => {
                        if (ack.err) {
                            (0, logger_1.log)(`Post-creation auth failed: ${ack.err}`);
                            resolve();
                        }
                        else {
                            loginSuccess = true;
                            userPub = gun.user().is?.pub || "";
                            (0, logger_1.log)(`Post-creation auth successful: ${userPub}`);
                            resolve();
                        }
                    });
                });
                if (!loginSuccess) {
                    throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "METAMASK_LOGIN_FAILED", "Failed to log in after creating or verifying MetaMask user account");
                }
                // Emit login event
                core.emit("auth:login", {
                    userPub: userPub,
                    username: credentials.username,
                    method: "metamask",
                });
                return {
                    success: true,
                    userPub: userPub,
                    username: credentials.username,
                };
            }
            catch (authError) {
                // Pass the specific authentication error up the chain
                throw authError;
            }
        }
        catch (error) {
            // Handle both ShogunError and generic errors
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "METAMASK_LOGIN_ERROR";
            const errorMessage = error?.message || "Unknown error during MetaMask login";
            const handledError = errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return {
                success: false,
                error: handledError.message,
            };
        }
    }
    /**
     * Registra un nuovo utente con MetaMask
     * @param address - Indirizzo Ethereum
     * @returns {Promise<AuthResult>} Risultato della registrazione
     * @description Crea un nuovo account utente usando le credenziali del wallet MetaMask dopo la verifica della firma
     */
    async signUp(address) {
        (0, logger_1.log)("Sign up with MetaMask");
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`MetaMask registration attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Ethereum address required for MetaMask registration");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "METAMASK_UNAVAILABLE", "MetaMask is not available in the browser");
            }
            (0, logger_1.log)("Generating credentials for MetaMask registration...");
            const credentials = await this.generateCredentials(address);
            if (!credentials?.username ||
                !credentials?.password ||
                !credentials.signature ||
                !credentials.message) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "MetaMask credentials not generated correctly or signature missing");
            }
            (0, logger_1.log)(`Credentials generated successfully. Username: ${credentials.username}`);
            (0, logger_1.log)("Verifying MetaMask signature...");
            const recoveredAddress = ethers_1.ethers.verifyMessage(credentials.message, credentials.signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                (0, logger_1.logError)(`Signature verification failed. Expected: ${address}, Got: ${recoveredAddress}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "MetaMask signature verification failed. Address mismatch.");
            }
            (0, logger_1.log)("MetaMask signature verified successfully.");
            // For MetaMask registration, we'll use a direct approach
            (0, logger_1.log)("Creating MetaMask user account directly...");
            try {
                const gun = core.gun;
                // First, check if the user already exists by trying to authenticate
                let userExists = false;
                await new Promise((resolve) => {
                    // Reset user state
                    try {
                        if (gun.user && gun.user()._ && gun.user()._.sea) {
                            gun.user()._.sea = null;
                        }
                    }
                    catch (e) {
                        // Ignore reset errors
                    }
                    // Try authentication to see if user exists
                    gun
                        .user()
                        .auth(credentials.username, credentials.password, (ack) => {
                        if (!ack.err) {
                            userExists = true;
                            (0, logger_1.log)("User already exists and credentials are valid");
                        }
                        resolve();
                    });
                });
                // If user already exists, return success
                if (userExists) {
                    const userPub = core.gun.user().is?.pub || "";
                    // Emit signup event (even though it's more of a login)
                    core.emit("auth:signup", {
                        userPub: userPub,
                        username: credentials.username,
                        method: "metamask",
                    });
                    return {
                        success: true,
                        userPub: userPub,
                        username: credentials.username,
                    };
                }
                // Otherwise create the user
                (0, logger_1.log)("Creating new MetaMask user account...");
                let createSuccess = false;
                await new Promise((resolve) => {
                    // Reset user state
                    try {
                        if (gun.user && gun.user()._ && gun.user()._.sea) {
                            gun.user()._.sea = null;
                        }
                    }
                    catch (e) {
                        // Ignore reset errors
                    }
                    gun
                        .user()
                        .create(credentials.username, credentials.password, (ack) => {
                        if (ack.err && ack.err !== "User already created!") {
                            (0, logger_1.log)(`User creation failed: ${ack.err}`);
                            resolve();
                        }
                        else {
                            createSuccess = true;
                            (0, logger_1.log)("User creation successful or already exists");
                            resolve();
                        }
                    });
                });
                if (!createSuccess) {
                    throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "METAMASK_USER_CREATION_FAILED", "Failed to create MetaMask user account");
                }
                // Now authenticate with the new account
                (0, logger_1.log)("Authenticating with new account...");
                let loginSuccess = false;
                let userPub = "";
                await new Promise((resolve) => {
                    // Reset user state
                    try {
                        if (gun.user && gun.user()._ && gun.user()._.sea) {
                            gun.user()._.sea = null;
                        }
                    }
                    catch (e) {
                        // Ignore reset errors
                    }
                    gun
                        .user()
                        .auth(credentials.username, credentials.password, (ack) => {
                        if (ack.err) {
                            (0, logger_1.log)(`Post-creation auth failed: ${ack.err}`);
                            resolve();
                        }
                        else {
                            loginSuccess = true;
                            userPub = gun.user().is?.pub || "";
                            (0, logger_1.log)(`Post-creation auth successful: ${userPub}`);
                            resolve();
                        }
                    });
                });
                if (!loginSuccess) {
                    throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "METAMASK_SIGNUP_AUTH_FAILED", "Failed to log in after creating MetaMask user account");
                }
                // Emit signup event
                core.emit("auth:signup", {
                    userPub: userPub,
                    username: credentials.username,
                    method: "metamask",
                });
                return {
                    success: true,
                    userPub: userPub,
                    username: credentials.username,
                };
            }
            catch (authError) {
                // Pass the specific authentication error up the chain
                throw authError;
            }
        }
        catch (error) {
            // Handle both ShogunError and generic errors
            const errorType = error?.type || errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code || "METAMASK_SIGNUP_ERROR";
            const errorMessage = error?.message || "Unknown error during MetaMask registration";
            const handledError = errorHandler_1.ErrorHandler.handle(errorType, errorCode, errorMessage, error);
            return {
                success: false,
                error: handledError.message,
            };
        }
    }
    /**
     * Legacy method for MetaMask login - use login() instead
     * @deprecated Use login(address) instead
     */
    async loginWithMetaMask(address) {
        return this.login(address);
    }
    /**
     * Legacy method for MetaMask signup - use signUp() instead
     * @deprecated Use signUp(address) instead
     */
    async signUpWithMetaMask(address) {
        return this.signUp(address);
    }
}
exports.MetaMaskPlugin = MetaMaskPlugin;
