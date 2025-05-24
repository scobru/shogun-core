"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitcoinWalletPlugin = void 0;
const base_1 = require("../base");
const bitcoinWallet_1 = require("./bitcoinWallet");
const logger_1 = require("../../utils/logger");
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Plugin for managing Bitcoin wallet functionality in ShogunCore
 * Supports Alby, Nostr extensions, or direct key management
 */
class BitcoinWalletPlugin extends base_1.BasePlugin {
    name = "bitcoin-wallet";
    version = "1.0.0";
    description = "Provides Bitcoin wallet connection and authentication for ShogunCore";
    bitcoinWallet = null;
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        // Initialize the Bitcoin wallet module
        this.bitcoinWallet = new bitcoinWallet_1.BitcoinWallet();
        (0, logger_1.log)("Bitcoin wallet plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        if (this.bitcoinWallet) {
            this.bitcoinWallet.cleanup();
        }
        this.bitcoinWallet = null;
        super.destroy();
        (0, logger_1.log)("Bitcoin wallet plugin destroyed");
    }
    /**
     * Ensure that the Bitcoin wallet module is initialized
     * @private
     */
    assertBitcoinWallet() {
        this.assertInitialized();
        if (!this.bitcoinWallet) {
            throw new Error("Bitcoin wallet module not initialized");
        }
        return this.bitcoinWallet;
    }
    /**
     * @inheritdoc
     */
    isAvailable() {
        return this.assertBitcoinWallet().isAvailable();
    }
    /**
     * Check if Alby extension is available
     * Note: Alby is deprecated in favor of Nostr
     */
    isAlbyAvailable() {
        (0, logger_1.log)("Alby is deprecated, using Nostr instead");
        return this.isNostrExtensionAvailable();
    }
    /**
     * Check if Nostr extension is available
     */
    isNostrExtensionAvailable() {
        return this.assertBitcoinWallet().isNostrExtensionAvailable();
    }
    /**
     * @inheritdoc
     */
    async connectWallet(type = "nostr") {
        // Prioritize nostr over alby (since they are functionally identical)
        // If type is alby, try to use nostr instead
        if (type === "alby") {
            (0, logger_1.log)("Alby is deprecated, using Nostr instead");
            type = "nostr";
        }
        return this.assertBitcoinWallet().connectWallet(type);
    }
    /**
     * @inheritdoc
     */
    async generateCredentials(address) {
        (0, logger_1.log)("Calling credential generation for Bitcoin wallet");
        return this.assertBitcoinWallet().generateCredentials(address);
    }
    /**
     * @inheritdoc
     */
    cleanup() {
        this.assertBitcoinWallet().cleanup();
    }
    /**
     * @inheritdoc
     */
    async verifySignature(message, signature, address) {
        return this.assertBitcoinWallet().verifySignature(message, signature, address);
    }
    /**
     * @inheritdoc
     */
    async generatePassword(signature) {
        return this.assertBitcoinWallet().generatePassword(signature);
    }
    /**
     * Login with Bitcoin wallet
     * @param address - Bitcoin address
     * @returns {Promise<AuthResult>} Authentication result
     * @description Authenticates the user using Bitcoin wallet credentials after signature verification
     */
    async login(address) {
        (0, logger_1.log)("Login with Bitcoin wallet");
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`Bitcoin wallet login attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Bitcoin address required for login");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "BITCOIN_WALLET_UNAVAILABLE", "No Bitcoin wallet available in the browser");
            }
            (0, logger_1.log)("Generating credentials for Bitcoin wallet login...");
            const credentials = await this.generateCredentials(address);
            if (!credentials?.username ||
                !credentials?.password ||
                !credentials.signature ||
                !credentials.message) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Bitcoin wallet credentials not generated correctly or signature missing");
            }
            (0, logger_1.log)(`Credentials generated successfully. Username: ${credentials.username}`);
            (0, logger_1.log)("Verifying Bitcoin wallet signature...");
            const isValid = await this.verifySignature(credentials.message, credentials.signature, address);
            if (!isValid) {
                (0, logger_1.logError)(`Signature verification failed for address: ${address}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "Bitcoin wallet signature verification failed");
            }
            (0, logger_1.log)("Bitcoin wallet signature verified successfully.");
            // For Bitcoin wallet authentication, we'll use a direct approach rather than using createUserWithGunDB
            (0, logger_1.log)("Attempting direct auth with GunDB for Bitcoin wallet account...");
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
                        method: "bitcoin",
                    });
                    return {
                        success: true,
                        userPub: userPub,
                        username: credentials.username,
                    };
                }
                // If direct auth failed, try to create the user first
                (0, logger_1.log)("Creating Bitcoin wallet user account...");
                let createSuccess = false;
                let createError = "";
                await new Promise((resolve) => {
                    core.gun
                        .user()
                        .create(credentials.username, credentials.password, (ack) => {
                        if (ack.err) {
                            createError = ack.err;
                            (0, logger_1.log)(`User creation failed: ${ack.err}`);
                            // Don't immediately consider this a failure - the user might already exist
                            if (ack.err === "User already created!") {
                                (0, logger_1.log)("User already exists, will try different authentication approach");
                                createSuccess = false;
                            }
                            else {
                                createSuccess = false;
                            }
                        }
                        else {
                            createSuccess = true;
                            (0, logger_1.log)("User created successfully");
                        }
                        resolve();
                    });
                });
                // Special handling for "User already created!" error
                // This is a common case that we should try to handle gracefully
                if (!createSuccess && createError === "User already created!") {
                    (0, logger_1.log)("User exists but authentication failed. Trying alternative approach...");
                    // Try one more time with a forced reset
                    authSuccess = false;
                    await new Promise((resolveRetry) => {
                        // More aggressive state reset
                        try {
                            const gunUser = core.gun.user();
                            if (gunUser) {
                                // Force a leave/recall cycle
                                gunUser.leave();
                                setTimeout(() => {
                                    // Try authentication again after a short delay
                                    core.gun
                                        .user()
                                        .auth(credentials.username, credentials.password, (retryAck) => {
                                        if (retryAck.err) {
                                            (0, logger_1.log)(`Retry auth failed: ${retryAck.err}`);
                                            resolveRetry();
                                        }
                                        else {
                                            authSuccess = true;
                                            (0, logger_1.log)("Retry auth successful");
                                            resolveRetry();
                                        }
                                    });
                                }, 100);
                            }
                            else {
                                resolveRetry();
                            }
                        }
                        catch (e) {
                            (0, logger_1.log)(`Error during retry setup: ${e}`);
                            resolveRetry();
                        }
                    });
                    if (authSuccess) {
                        const userPub = core.gun.user().is?.pub || "";
                        // Emit login event
                        core.emit("auth:login", {
                            userPub: userPub,
                            username: credentials.username,
                            method: "bitcoin",
                        });
                        return {
                            success: true,
                            userPub: userPub,
                            username: credentials.username,
                        };
                    }
                    // If we still can't authenticate, try a last resort approach
                    (0, logger_1.log)("Authentication still failing. Using emergency fallback...");
                    try {
                        // Generate slightly modified credentials as a last resort
                        // This adds a small random suffix to the password
                        const emergencyPassword = `${credentials.password}_${Date.now() % 1000}`;
                        let emergencyCreateSuccess = false;
                        await new Promise((resolveEmergency) => {
                            core.gun
                                .user()
                                .create(credentials.username, emergencyPassword, (emergencyAck) => {
                                if (!emergencyAck.err) {
                                    emergencyCreateSuccess = true;
                                    (0, logger_1.log)("Emergency user creation successful");
                                }
                                else {
                                    (0, logger_1.log)(`Emergency user creation failed: ${emergencyAck.err}`);
                                }
                                resolveEmergency();
                            });
                        });
                        if (emergencyCreateSuccess) {
                            // Try to authenticate with the emergency credentials
                            let emergencyAuthSuccess = false;
                            await new Promise((resolveEmergencyAuth) => {
                                core.gun
                                    .user()
                                    .auth(credentials.username, emergencyPassword, (emergencyAuthAck) => {
                                    if (!emergencyAuthAck.err) {
                                        emergencyAuthSuccess = true;
                                        (0, logger_1.log)("Emergency authentication successful");
                                    }
                                    else {
                                        (0, logger_1.log)(`Emergency authentication failed: ${emergencyAuthAck.err}`);
                                    }
                                    resolveEmergencyAuth();
                                });
                            });
                            if (emergencyAuthSuccess) {
                                const userPub = core.gun.user().is?.pub || "";
                                // Emit login event
                                core.emit("auth:login", {
                                    userPub: userPub,
                                    username: credentials.username,
                                    method: "bitcoin",
                                });
                                return {
                                    success: true,
                                    userPub: userPub,
                                    username: credentials.username,
                                };
                            }
                        }
                    }
                    catch (emergencyError) {
                        (0, logger_1.log)(`Emergency fallback failed: ${emergencyError}`);
                    }
                    // If all else fails, throw a more descriptive error
                    throw new Error("User account exists but authentication failed. Try using a different wallet type or address.");
                }
                if (!createSuccess) {
                    throw new Error("Failed to create user account");
                }
                // Now try to authenticate again
                authSuccess = false;
                await new Promise((resolve) => {
                    core.gun
                        .user()
                        .auth(credentials.username, credentials.password, (ack) => {
                        if (ack.err) {
                            (0, logger_1.log)(`Auth after creation failed: ${ack.err}`);
                        }
                        else {
                            authSuccess = true;
                            (0, logger_1.log)("Auth after creation successful");
                        }
                        resolve();
                    });
                });
                if (!authSuccess) {
                    throw new Error("Failed to authenticate after user creation");
                }
                const userPub = core.gun.user().is?.pub || "";
                // Emit login event
                core.emit("auth:login", {
                    userPub: userPub,
                    username: credentials.username,
                    method: "bitcoin",
                });
                return {
                    success: true,
                    userPub: userPub,
                    username: credentials.username,
                };
            }
            catch (error) {
                (0, logger_1.logError)("Error during Bitcoin wallet authentication:", error);
                throw error;
            }
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "BITCOIN_LOGIN_FAILED", error.message ?? "Unknown error during Bitcoin wallet login", error);
            return {
                success: false,
                error: error.message ?? "Unknown error during Bitcoin wallet login",
            };
        }
    }
    /**
     * Register a new user with Bitcoin wallet
     * @param address - Bitcoin address
     * @returns {Promise<AuthResult>} Registration result
     * @description Creates a new user account with Bitcoin wallet credentials
     */
    async signUp(address) {
        (0, logger_1.log)("Sign up with Bitcoin wallet");
        try {
            const core = this.assertInitialized();
            (0, logger_1.log)(`Bitcoin wallet signup attempt for address: ${address}`);
            if (!address) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.VALIDATION, "ADDRESS_REQUIRED", "Bitcoin address required for signup");
            }
            if (!this.isAvailable()) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.ENVIRONMENT, "BITCOIN_WALLET_UNAVAILABLE", "No Bitcoin wallet available in the browser");
            }
            // Generate credentials similar to login
            (0, logger_1.log)("Generating credentials for Bitcoin wallet signup...");
            const credentials = await this.generateCredentials(address);
            if (!credentials?.username ||
                !credentials?.password ||
                !credentials.signature ||
                !credentials.message) {
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.AUTHENTICATION, "CREDENTIAL_GENERATION_FAILED", "Bitcoin wallet credentials not generated correctly or signature missing");
            }
            (0, logger_1.log)(`Credentials generated successfully. Username: ${credentials.username}`);
            // Verify signature
            (0, logger_1.log)("Verifying Bitcoin wallet signature...");
            const isValid = await this.verifySignature(credentials.message, credentials.signature, address);
            if (!isValid) {
                (0, logger_1.logError)(`Signature verification failed for address: ${address}`);
                throw (0, errorHandler_1.createError)(errorHandler_1.ErrorType.SECURITY, "SIGNATURE_VERIFICATION_FAILED", "Bitcoin wallet signature verification failed");
            }
            (0, logger_1.log)("Bitcoin wallet signature verified successfully.");
            // For Bitcoin wallet registration, try to create user directly
            (0, logger_1.log)("Creating Bitcoin wallet user account...");
            let createSuccess = false;
            let userCreationError = "";
            await new Promise((resolve) => {
                core.gun
                    .user()
                    .create(credentials.username, credentials.password, (ack) => {
                    if (ack.err) {
                        userCreationError = ack.err;
                        (0, logger_1.log)(`User creation failed: ${ack.err}`);
                        createSuccess = false;
                    }
                    else {
                        createSuccess = true;
                        (0, logger_1.log)("User created successfully");
                    }
                    resolve();
                });
            });
            // If user already exists, we'll try to authenticate anyway
            // This handles cases where the user was previously created
            if (!createSuccess && userCreationError === "User already created!") {
                (0, logger_1.log)("User already exists, trying to authenticate...");
            }
            else if (!createSuccess) {
                throw new Error(`User creation failed: ${userCreationError}`);
            }
            // Now authenticate with the credentials
            let authSuccess = false;
            await new Promise((resolve) => {
                core.gun
                    .user()
                    .auth(credentials.username, credentials.password, (ack) => {
                    if (ack.err) {
                        (0, logger_1.log)(`Auth failed: ${ack.err}`);
                    }
                    else {
                        authSuccess = true;
                        (0, logger_1.log)("Auth successful");
                    }
                    resolve();
                });
            });
            if (!authSuccess) {
                // If authentication failed but user exists, try the same recovery flow as in login
                if (userCreationError === "User already created!") {
                    (0, logger_1.log)("Authentication failed for existing user. Trying alternative approach...");
                    // Try with a forced reset
                    await new Promise((resolveRetry) => {
                        try {
                            const gunUser = core.gun.user();
                            if (gunUser) {
                                // Force a leave/recall cycle
                                gunUser.leave();
                                setTimeout(() => {
                                    // Try authentication again after a short delay
                                    core.gun
                                        .user()
                                        .auth(credentials.username, credentials.password, (retryAck) => {
                                        if (retryAck.err) {
                                            (0, logger_1.log)(`Retry auth failed: ${retryAck.err}`);
                                            resolveRetry();
                                        }
                                        else {
                                            authSuccess = true;
                                            (0, logger_1.log)("Retry auth successful");
                                            resolveRetry();
                                        }
                                    });
                                }, 100);
                            }
                            else {
                                resolveRetry();
                            }
                        }
                        catch (e) {
                            (0, logger_1.log)(`Error during retry setup: ${e}`);
                            resolveRetry();
                        }
                    });
                    if (authSuccess) {
                        const userPub = core.gun.user().is?.pub || "";
                        // Emit signup/login event
                        core.emit("auth:signup", {
                            userPub: userPub,
                            username: credentials.username,
                            method: "bitcoin",
                        });
                        core.emit("auth:login", {
                            userPub: userPub,
                            username: credentials.username,
                            method: "bitcoin",
                        });
                        return {
                            success: true,
                            userPub: userPub,
                            username: credentials.username,
                        };
                    }
                }
                throw new Error("Failed to authenticate after user creation");
            }
            const userPub = core.gun.user().is?.pub || "";
            // Emit events
            core.emit("auth:signup", {
                userPub: userPub,
                username: credentials.username,
                method: "bitcoin",
            });
            core.emit("auth:login", {
                userPub: userPub,
                username: credentials.username,
                method: "bitcoin",
            });
            return {
                success: true,
                userPub: userPub,
                username: credentials.username,
            };
        }
        catch (error) {
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.AUTHENTICATION, "BITCOIN_SIGNUP_FAILED", error.message ?? "Unknown error during Bitcoin wallet signup", error);
            return {
                success: false,
                error: error.message ?? "Unknown error during Bitcoin wallet signup",
            };
        }
    }
    /**
     * Convenience method that matches the interface pattern
     */
    async loginWithBitcoinWallet(address) {
        return this.login(address);
    }
    /**
     * Convenience method that matches the interface pattern
     */
    async signUpWithBitcoinWallet(address) {
        return this.signUp(address);
    }
}
exports.BitcoinWalletPlugin = BitcoinWalletPlugin;
