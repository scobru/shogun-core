"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webauthn = void 0;
exports.deriveWebauthnKeys = deriveWebauthnKeys;
/**
 * Constants for WebAuthn configuration
 */
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 64;
const ethers_1 = require("ethers");
const errorHandler_1 = require("../../utils/errorHandler");
const eventEmitter_1 = require("../../utils/eventEmitter");
const types_1 = require("./types");
const derive_1 = __importDefault(require("../../gundb/derive"));
/**
 * Constants for WebAuthn configuration
 */
const DEFAULT_CONFIG = {
    rpName: "Shogun Wallet",
    timeout: 60000,
    userVerification: "preferred",
    attestation: "none",
    authenticatorAttachment: "platform",
    requireResidentKey: false,
};
/**
 * Main WebAuthn class for authentication management
 */
class Webauthn extends eventEmitter_1.EventEmitter {
    config;
    gunInstance;
    credential;
    abortController = null;
    /**
     * Creates a new WebAuthn instance
     */
    constructor(gunInstance, config) {
        super();
        this.gunInstance = gunInstance;
        this.credential = null;
        // Merge default config with provided config
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            rpId: config?.rpId ??
                (typeof window !== "undefined"
                    ? window.location.hostname.split(":")[0]
                    : "localhost"),
        };
    }
    /**
     * Validates a username
     */
    validateUsername(username) {
        if (!username || typeof username !== "string") {
            throw new Error("Username must be a non-empty string");
        }
        if (username.length < MIN_USERNAME_LENGTH ||
            username.length > MAX_USERNAME_LENGTH) {
            throw new Error(`Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`);
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new Error("Username can only contain letters, numbers, underscores and hyphens");
        }
    }
    /**
     * Creates a new WebAuthn account with retry logic
     */
    async createAccount(username, credentials, isNewDevice = false) {
        try {
            this.validateUsername(username);
            const maxRetries = 3;
            let lastError = null;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const result = await this.generateCredentials(username, credentials, isNewDevice);
                    if (result.success) {
                        this.emit(types_1.WebAuthnEventType.DEVICE_REGISTERED, {
                            type: types_1.WebAuthnEventType.DEVICE_REGISTERED,
                            data: { username },
                            timestamp: Date.now(),
                        });
                        return result;
                    }
                    lastError = new Error(result.error ?? "Unknown error");
                }
                catch (error) {
                    lastError = error;
                    if (attempt < maxRetries) {
                        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
                        continue;
                    }
                }
            }
            throw lastError || new Error("Failed to create account after retries");
        }
        catch (error) {
            this.emit(types_1.WebAuthnEventType.ERROR, {
                type: types_1.WebAuthnEventType.ERROR,
                data: { error: error.message },
                timestamp: Date.now(),
            });
            throw error;
        }
    }
    /**
     * Authenticates a user with timeout and abort handling
     */
    async authenticateUser(username, salt, options = {}) {
        try {
            this.validateUsername(username);
            if (!salt) {
                const error = new Error("No WebAuthn credentials found for this username");
                errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "NO_CREDENTIALS", error.message, error);
                return { success: false, error: error.message };
            }
            // Cancel any existing authentication attempt
            this.abortAuthentication();
            // Create new abort controller
            this.abortController = new AbortController();
            const timeout = options.timeout || this.config.timeout;
            const timeoutId = setTimeout(() => this.abortController?.abort(), timeout);
            try {
                const challenge = this.generateChallenge(username);
                const assertionOptions = {
                    challenge,
                    allowCredentials: [],
                    timeout,
                    userVerification: options.userVerification || this.config.userVerification,
                    rpId: this.config.rpId,
                };
                const assertion = (await navigator.credentials.get({
                    publicKey: assertionOptions,
                    signal: this.abortController.signal,
                }));
                if (!assertion) {
                    throw new Error("WebAuthn verification failed");
                }
                const { password } = this.generateCredentialsFromSalt(username, salt);
                const deviceInfo = this.getDeviceInfo(assertion.id);
                const result = {
                    success: true,
                    username,
                    password,
                    credentialId: this.bufferToBase64(assertion.rawId),
                    deviceInfo,
                };
                this.emit(types_1.WebAuthnEventType.AUTHENTICATION_SUCCESS, {
                    type: types_1.WebAuthnEventType.AUTHENTICATION_SUCCESS,
                    data: { username, deviceInfo },
                    timestamp: Date.now(),
                });
                return result;
            }
            finally {
                clearTimeout(timeoutId);
                this.abortController = null;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown WebAuthn error";
            this.emit(types_1.WebAuthnEventType.AUTHENTICATION_FAILED, {
                type: types_1.WebAuthnEventType.AUTHENTICATION_FAILED,
                data: { username, error: errorMessage },
                timestamp: Date.now(),
            });
            errorHandler_1.ErrorHandler.handle(errorHandler_1.ErrorType.WEBAUTHN, "AUTH_ERROR", errorMessage, error);
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Aborts current authentication attempt
     */
    abortAuthentication() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
    /**
     * Gets device information
     */
    getDeviceInfo(credentialId) {
        const platformInfo = this.getPlatformInfo();
        return {
            deviceId: credentialId,
            timestamp: Date.now(),
            name: platformInfo.name,
            platform: platformInfo.platform,
            lastUsed: Date.now(),
        };
    }
    /**
     * Gets platform information
     */
    getPlatformInfo() {
        if (typeof navigator === "undefined") {
            return { name: "unknown", platform: "unknown" };
        }
        const platform = navigator.platform;
        const userAgent = navigator.userAgent;
        if (/iPhone|iPad|iPod/.test(platform)) {
            return { name: "iOS Device", platform };
        }
        if (/Android/.test(userAgent)) {
            return { name: "Android Device", platform };
        }
        if (/Win/.test(platform)) {
            return { name: "Windows Device", platform };
        }
        if (/Mac/.test(platform)) {
            return { name: "Mac Device", platform };
        }
        if (/Linux/.test(platform)) {
            return { name: "Linux Device", platform };
        }
        return { name: "Unknown Device", platform };
    }
    /**
     * Generates a challenge for WebAuthn operations
     */
    generateChallenge(username) {
        const timestamp = Date.now().toString();
        const randomBytes = this.getRandomBytes(32);
        const challengeData = `${username}-${timestamp}-${this.uint8ArrayToHex(randomBytes)}`;
        return new TextEncoder().encode(challengeData);
    }
    /**
     * Gets cryptographically secure random bytes
     */
    getRandomBytes(length) {
        if (typeof window !== "undefined" && window.crypto) {
            return window.crypto.getRandomValues(new Uint8Array(length));
        }
        throw new Error("No cryptographic implementation available");
    }
    /**
     * Converts Uint8Array to hexadecimal string
     */
    uint8ArrayToHex(arr) {
        return Array.from(arr)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }
    /**
     * Converts ArrayBuffer to URL-safe base64 string
     */
    bufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        const binary = bytes.reduce((str, byte) => str + String.fromCharCode(byte), "");
        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    }
    /**
     * Generates credentials from username and salt
     */
    generateCredentialsFromSalt(username, salt) {
        const data = ethers_1.ethers.toUtf8Bytes(username + salt);
        return {
            password: ethers_1.ethers.sha256(data),
        };
    }
    /**
     * Checks if WebAuthn is supported
     */
    isSupported() {
        return (typeof window !== "undefined" && window.PublicKeyCredential !== undefined);
    }
    /**
     * Creates a WebAuthn credential for registration
     */
    async createCredential(username) {
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            const userId = new TextEncoder().encode(username);
            const publicKeyCredentialCreationOptions = {
                challenge,
                rp: {
                    name: "Shogun Wallet",
                    ...(this.config.rpId !== "localhost" && { id: this.config.rpId }),
                },
                user: {
                    id: userId,
                    name: username,
                    displayName: username,
                },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                timeout: this.config.timeout,
                attestation: this.config.attestation,
                authenticatorSelection: {
                    authenticatorAttachment: this.config.authenticatorAttachment,
                    userVerification: this.config.userVerification,
                    requireResidentKey: this.config.requireResidentKey,
                },
            };
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions,
            });
            if (!credential) {
                throw new Error("Credential creation failed");
            }
            const webAuthnCredential = credential;
            // Convert to WebAuthnCredentialData
            const credentialData = {
                id: webAuthnCredential.id,
                rawId: webAuthnCredential.rawId,
                type: webAuthnCredential.type,
                response: {
                    clientDataJSON: webAuthnCredential.response.clientDataJSON,
                },
                getClientExtensionResults: webAuthnCredential.getClientExtensionResults,
            };
            // Add additional response properties if available
            if ("attestationObject" in webAuthnCredential.response) {
                credentialData.response.attestationObject = webAuthnCredential.response.attestationObject;
            }
            this.credential = credentialData;
            return credentialData;
        }
        catch (error) {
            console.error("Detailed error in credential creation:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Error creating credentials: ${errorMessage}`);
        }
    }
    /**
     * Generates WebAuthn credentials (uniforme con altri plugin)
     */
    async generateCredentials(username, existingCredential, isLogin = false) {
        try {
            if (isLogin) {
                const verificationResult = await this.verifyCredential(username);
                if (!verificationResult.success || !verificationResult.credentialId) {
                    return {
                        success: false,
                        username,
                        key: undefined,
                        credentialId: "",
                        error: verificationResult.error,
                        publicKey: null,
                    };
                }
                // Deriva la chiave GunDB
                const key = await deriveWebauthnKeys(username, verificationResult.credentialId);
                return {
                    success: true,
                    username,
                    key,
                    credentialId: verificationResult.credentialId,
                    publicKey: null,
                };
            }
            else {
                const credential = await this.createCredential(username);
                const credentialId = credential.id;
                let publicKey = null;
                if (credential?.response?.getPublicKey) {
                    publicKey = credential.response.getPublicKey();
                }
                // Deriva la chiave GunDB
                const key = await deriveWebauthnKeys(username, credentialId);
                return {
                    success: true,
                    username,
                    key,
                    credentialId,
                    publicKey,
                };
            }
        }
        catch (error) {
            console.error("Error in generateCredentials:", error);
            const errorMessage = error instanceof Error
                ? error.message
                : "Unknown error during WebAuthn operation";
            return {
                success: false,
                username,
                key: undefined,
                credentialId: "",
                error: errorMessage,
                publicKey: null,
            };
        }
    }
    /**
     * Verifies a credential
     */
    async verifyCredential(username) {
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            const options = {
                challenge,
                timeout: this.config.timeout,
                userVerification: this.config.userVerification,
                ...(this.config.rpId !== "localhost" && { rpId: this.config.rpId }),
            };
            if (this.credential?.rawId) {
                options.allowCredentials = [
                    {
                        id: this.credential.rawId,
                        type: "public-key",
                    },
                ];
            }
            const assertion = await navigator.credentials.get({
                publicKey: options,
            });
            if (!assertion) {
                return {
                    success: false,
                    error: "Credential verification failed",
                };
            }
            return {
                success: true,
                credentialId: assertion.id,
                username,
            };
        }
        catch (error) {
            console.error("Error verifying credentials:", error);
            const errorMessage = error instanceof Error
                ? error.message
                : "Unknown error verifying credentials";
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Removes device credentials
     */
    async removeDevice(username, credentialId, credentials) {
        if (!credentials ||
            !credentials.credentials ||
            !credentials.credentials[credentialId]) {
            return { success: false };
        }
        const updatedCreds = { ...credentials };
        // Make sure credentials exists before modifying it
        if (updatedCreds.credentials) {
            delete updatedCreds.credentials[credentialId];
        }
        return {
            success: true,
            updatedCredentials: updatedCreds,
        };
    }
    /**
     * Signs data with the credential
     */
    async sign(data) {
        const signature = await navigator.credentials.get({
            publicKey: {
                challenge: new Uint8Array(16),
                rpId: this.config.rpId,
            },
        });
        return signature;
    }
}
exports.Webauthn = Webauthn;
// Add to global scope if available
if (typeof window !== "undefined") {
    window.Webauthn = Webauthn;
}
else if (typeof global !== "undefined") {
    global.Webauthn = Webauthn;
}
// Funzione helper per derivare chiavi WebAuthn (come per Web3)
async function deriveWebauthnKeys(username, credentialId) {
    const hashedCredentialId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(credentialId));
    const salt = `${username}_${credentialId}`;
    return await (0, derive_1.default)(hashedCredentialId, salt, {
        includeP256: true,
    });
}
