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
            (0, logger_1.log)("Attempting login or user creation with verified credentials...");
            // Utilizziamo il metodo privato del core per la creazione dell'utente in GunDB
            const createUserWithGunDB = core["createUserWithGunDB"].bind(core);
            const result = await createUserWithGunDB(credentials.username, credentials.password);
            if (!result.success || !result.userPub) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "LOGIN_CREATE_FAILED", result.error ??
                    "Login or user creation failed after signature verification");
            }
            (0, logger_1.log)(`Login/Creation successful: ${result.userPub}`);
            // Emettiamo l'evento di login tramite il core
            core.emit("auth:login", {
                userPub: result.userPub,
                username: credentials.username,
                method: "metamask",
            });
            return {
                success: true,
                userPub: result.userPub,
                username: credentials.username,
            };
        }
        catch (error) {
            // Cattura sia errori conformi a ShogunError che generici
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
            (0, logger_1.log)("Attempting user creation (or login if exists) with verified credentials...");
            // Utilizziamo il metodo privato del core per la creazione dell'utente in GunDB
            const createUserWithGunDB = core["createUserWithGunDB"].bind(core);
            const result = await createUserWithGunDB(credentials.username, credentials.password);
            if (!result.success || !result.userPub) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "USER_CREATE_LOGIN_FAILED", result.error ??
                    "User creation or login failed after signature verification");
            }
            (0, logger_1.log)(`User creation/login successful: ${result.userPub}`);
            // Emettiamo l'evento di registrazione tramite il core
            core.emit("auth:signup", {
                userPub: result.userPub,
                username: credentials.username,
                method: "metamask",
            });
            return {
                success: true,
                userPub: result.userPub,
                username: credentials.username,
            };
        }
        catch (error) {
            // Cattura sia errori conformi a ShogunError che generici
            const errorType = error?.type ?? errorHandler_1.ErrorType.AUTHENTICATION;
            const errorCode = error?.code ?? "METAMASK_SIGNUP_ERROR";
            const errorMessage = error?.message ?? "Unknown error during MetaMask registration";
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
