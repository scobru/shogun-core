/**
 * Constants for WebAuthn configuration
 */
const TIMEOUT_MS = 60000;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 64;
import { ethers } from "ethers";
/**
 * Generates a unique device identifier
 */
const generateDeviceId = () => {
    const platform = typeof navigator !== "undefined" ? navigator.platform : "unknown";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return uint8ArrayToHex(new TextEncoder().encode(`${platform}-${timestamp}-${random}`));
};
/**
 * Gets platform information
 */
const getPlatformInfo = () => {
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
};
/**
 * Converts Uint8Array to hexadecimal string
 */
const uint8ArrayToHex = (arr) => {
    return Array.from(arr)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
};
/**
 * Gets cryptographically secure random bytes
 */
const getRandomBytes = (length) => {
    if (typeof window !== "undefined" && window.crypto) {
        return window.crypto.getRandomValues(new Uint8Array(length));
    }
    throw new Error("No cryptographic implementation available");
};
/**
 * Generates a challenge for WebAuthn operations
 */
const generateChallenge = (username) => {
    const timestamp = Date.now().toString();
    const randomBytes = getRandomBytes(32);
    const challengeData = `${username}-${timestamp}-${uint8ArrayToHex(randomBytes)}`;
    return new TextEncoder().encode(challengeData);
};
/**
 * Converts ArrayBuffer to URL-safe base64 string
 */
const bufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((str, byte) => str + String.fromCharCode(byte), "");
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};
/**
 * Converts URL-safe base64 string to ArrayBuffer
 */
const base64ToBuffer = (base64) => {
    if (!/^[A-Za-z0-9\-_]*$/.test(base64)) {
        throw new Error("Invalid base64 string");
    }
    const base64Url = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
    const base64Padded = base64Url + padding;
    try {
        const binary = atob(base64Padded);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            buffer[i] = binary.charCodeAt(i);
        }
        return buffer.buffer;
    }
    catch (error) {
        throw new Error("Failed to decode base64 string");
    }
};
/**
 * Generates credentials from username and salt
 */
const generateCredentialsFromSalt = (username, salt) => {
    const data = ethers.toUtf8Bytes(username + salt);
    return {
        password: ethers.sha256(data),
    };
};
/**
 * Main WebAuthn class for authentication management
 */
class Webauthn {
    /**
     * Creates a new WebAuthn instance
     */
    constructor(gunInstance) {
        this.rpId = window.location.hostname.split(':')[0];
        this.gunInstance = gunInstance;
        this.credential = null;
    }
    /**
     * Validates a username
     */
    validateUsername(username) {
        if (!username || typeof username !== "string") {
            throw new Error("Username must be a non-empty string");
        }
        if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH) {
            throw new Error(`Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`);
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new Error("Username can only contain letters, numbers, underscores and hyphens");
        }
        // Username is valid
    }
    /**
     * Creates a new WebAuthn account
     */
    async createAccount(username, credentials, isNewDevice = false) {
        const result = await this.generateCredentials(username, credentials, isNewDevice);
        if (!result.success) {
            throw new Error(result.error || "Error creating account");
        }
        return result;
    }
    /**
     * Checks if WebAuthn is supported
     */
    isSupported() {
        return typeof window !== 'undefined' &&
            window.PublicKeyCredential !== undefined;
    }
    /**
     * Creates a new credential
     */
    async createCredential(username) {
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            const userId = new TextEncoder().encode(username);
            const publicKeyCredentialCreationOptions = {
                challenge,
                rp: {
                    name: "Shogun Wallet",
                    ...(this.rpId !== 'localhost' && { id: this.rpId })
                },
                user: {
                    id: userId,
                    name: username,
                    displayName: username
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 }
                ],
                timeout: 60000,
                attestation: "none",
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "preferred",
                    requireResidentKey: false
                }
            };
            console.log("Attempting to create credentials with options:", publicKeyCredentialCreationOptions);
            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });
            if (!credential) {
                throw new Error("Credential creation failed");
            }
            console.log("Credentials created successfully:", credential);
            this.credential = credential;
            return credential;
        }
        catch (error) {
            console.error("Detailed error in credential creation:", error);
            throw new Error(`Error creating credentials: ${error.message}`);
        }
    }
    /**
     * Generates or verifies credentials
     */
    async generateCredentials(username, existingCredential, isLogin = false) {
        try {
            if (isLogin) {
                return this.verifyCredential(username);
            }
            else {
                const credential = await this.createCredential(username);
                const credentialId = credential.id;
                let publicKey = null;
                if (credential && credential.response?.getPublicKey) {
                    publicKey = credential.response.getPublicKey();
                }
                return {
                    success: true,
                    credentialId,
                    publicKey
                };
            }
        }
        catch (error) {
            console.error("Error in generateCredentials:", error);
            return {
                success: false,
                error: error.message || "Error during WebAuthn operation"
            };
        }
    }
    /**
     * Verifies an existing credential
     */
    async verifyCredential(username) {
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            const options = {
                challenge,
                timeout: 60000,
                userVerification: "preferred",
                ...(this.rpId !== 'localhost' && { rpId: this.rpId })
            };
            if (this.credential?.rawId) {
                options.allowCredentials = [{
                        id: this.credential.rawId,
                        type: 'public-key'
                    }];
            }
            const assertion = await navigator.credentials.get({
                publicKey: options
            });
            if (!assertion) {
                return {
                    success: false,
                    error: "Credential verification failed"
                };
            }
            return {
                success: true,
                credentialId: assertion.id
            };
        }
        catch (error) {
            console.error("Error verifying credentials:", error);
            return {
                success: false,
                error: error.message || "Error verifying credentials"
            };
        }
    }
    /**
     * Saves the credential to Gun database
     */
    async saveToGun(username, credential) {
        if (this.gunInstance) {
            try {
                await this.gunInstance.get(`webauthn_${username}`).put({
                    credentialId: credential.id,
                    type: credential.type,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                console.error("Error saving credentials to Gun:", error);
            }
        }
        // No action if gunInstance is not available
    }
    /**
     * Removes device credentials
     */
    async removeDevice(username, credentialId, credentials) {
        if (!credentials || !credentials.credentials || !credentials.credentials[credentialId]) {
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
     * Authenticates a user
     */
    async authenticateUser(username, salt) {
        try {
            this.validateUsername(username);
            if (!salt) {
                throw new Error("No WebAuthn credentials found for this username");
            }
            const challenge = generateChallenge(username);
            const assertionOptions = {
                challenge,
                allowCredentials: [],
                timeout: TIMEOUT_MS,
                userVerification: "required",
                rpId: this.rpId,
            };
            const abortController = new AbortController();
            const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);
            try {
                const assertion = (await navigator.credentials.get({
                    publicKey: assertionOptions,
                    signal: abortController.signal,
                }));
                if (!assertion) {
                    throw new Error("WebAuthn verification failed");
                }
                const { password } = generateCredentialsFromSalt(username, salt);
                return {
                    success: true,
                    username,
                    password,
                    credentialId: bufferToBase64(assertion.rawId),
                };
            }
            finally {
                clearTimeout(timeoutId);
            }
        }
        catch (error) {
            console.error("WebAuthn login error:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Signs data using WebAuthn
     */
    async sign(data) {
        const signature = await navigator.credentials.get({
            publicKey: {
                challenge: new Uint8Array(16),
                rpId: this.rpId,
            },
        });
        return signature;
    }
}
// Add to global scope if available
if (typeof window !== "undefined") {
    window.Webauthn = Webauthn;
}
else if (typeof global !== "undefined") {
    global.Webauthn = Webauthn;
}
export { Webauthn };
