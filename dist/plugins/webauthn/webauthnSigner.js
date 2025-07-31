"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAuthnSigner = void 0;
const webauthn_1 = require("./webauthn");
const p256_1 = require("@noble/curves/p256");
const sha256_1 = require("@noble/hashes/sha256");
const derive_1 = __importDefault(require("../../gundb/derive"));
const ethers_1 = require("ethers");
/**
 * Base64URL encoding utilities
 */
const base64url = {
    encode: function (buffer) {
        const bytes = new Uint8Array(buffer);
        return btoa(String.fromCharCode(...bytes))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    },
    decode: function (str) {
        str = str.replace(/-/g, "+").replace(/_/g, "/");
        while (str.length % 4)
            str += "=";
        const binary = atob(str);
        return new Uint8Array(binary.split("").map((c) => c.charCodeAt(0)));
    },
};
/**
 * WebAuthn Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but integrated with our architecture
 * CONSISTENT with normal WebAuthn approach
 */
class WebAuthnSigner {
    webauthn;
    credentials = new Map();
    constructor(webauthn) {
        this.webauthn = webauthn || new webauthn_1.Webauthn();
    }
    /**
     * Creates a new WebAuthn credential for signing
     * Similar to webauthn.js create functionality but CONSISTENT with normal approach
     */
    async createSigningCredential(username) {
        try {
            const credential = (await navigator.credentials.create({
                publicKey: {
                    challenge: crypto.getRandomValues(new Uint8Array(32)),
                    rp: {
                        id: window.location.hostname === "localhost"
                            ? "localhost"
                            : window.location.hostname,
                        name: "Shogun Wallet",
                    },
                    user: {
                        id: new TextEncoder().encode(username),
                        name: username,
                        displayName: username,
                    },
                    // Use the same algorithms as webauthn.js for SEA compatibility
                    pubKeyCredParams: [
                        { type: "public-key", alg: -7 }, // ECDSA, P-256 curve, for signing
                        { type: "public-key", alg: -25 }, // ECDH, P-256 curve, for creating shared secrets
                        { type: "public-key", alg: -257 },
                    ],
                    authenticatorSelection: {
                        userVerification: "preferred",
                    },
                    timeout: 60000,
                    attestation: "none",
                },
            }));
            if (!credential) {
                throw new Error("Failed to create WebAuthn credential");
            }
            // Extract public key in the same way as webauthn.js
            const response = credential.response;
            const publicKey = response.getPublicKey();
            if (!publicKey) {
                throw new Error("Failed to get public key from credential");
            }
            const rawKey = new Uint8Array(publicKey);
            // Extract coordinates like webauthn.js (slice positions may need adjustment)
            const xCoord = rawKey.slice(27, 59);
            const yCoord = rawKey.slice(59, 91);
            const x = base64url.encode(xCoord);
            const y = base64url.encode(yCoord);
            const pub = `${x}.${y}`;
            // CONSISTENCY: Use the same hashing approach as normal WebAuthn
            const hashedCredentialId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(credential.id));
            const signingCredential = {
                id: credential.id,
                rawId: credential.rawId,
                publicKey: { x, y },
                pub,
                hashedCredentialId, // This ensures consistency
            };
            // Store credential for later use
            this.credentials.set(credential.id, signingCredential);
            return signingCredential;
        }
        catch (error) {
            console.error("Error creating signing credential:", error);
            throw new Error(`Failed to create signing credential: ${error.message}`);
        }
    }
    /**
     * Creates an authenticator function compatible with SEA.sign
     * This is the key function that makes it work like webauthn.js
     */
    createAuthenticator(credentialId) {
        const credential = this.credentials.get(credentialId);
        if (!credential) {
            throw new Error(`Credential ${credentialId} not found`);
        }
        return async (data) => {
            try {
                const challenge = new TextEncoder().encode(JSON.stringify(data));
                const options = {
                    challenge,
                    rpId: window.location.hostname === "localhost"
                        ? "localhost"
                        : window.location.hostname,
                    userVerification: "preferred",
                    allowCredentials: [
                        {
                            type: "public-key",
                            id: credential.rawId,
                        },
                    ],
                    timeout: 60000,
                };
                const assertion = (await navigator.credentials.get({
                    publicKey: options,
                }));
                if (!assertion) {
                    throw new Error("WebAuthn assertion failed");
                }
                return assertion.response;
            }
            catch (error) {
                console.error("WebAuthn assertion error:", error);
                throw error;
            }
        };
    }
    /**
     * Creates a derived key pair from WebAuthn credential
     * CONSISTENT with normal approach: uses hashedCredentialId as password
     */
    async createDerivedKeyPair(credentialId, username, extra) {
        const credential = this.credentials.get(credentialId);
        if (!credential) {
            throw new Error(`Credential ${credentialId} not found`);
        }
        try {
            // CONSISTENCY: Use the same approach as normal WebAuthn
            // Use hashedCredentialId as password (same as normal approach)
            const derivedKeys = await (0, derive_1.default)(credential.hashedCredentialId, // This is the key change!
            extra, { includeP256: true });
            return {
                pub: derivedKeys.pub,
                priv: derivedKeys.priv,
                epub: derivedKeys.epub,
                epriv: derivedKeys.epriv,
            };
        }
        catch (error) {
            console.error("Error deriving keys from WebAuthn credential:", error);
            throw error;
        }
    }
    /**
     * Creates a Gun user from WebAuthn credential
     * This ensures the SAME user is created as with normal approach
     */
    async createGunUser(credentialId, username, gunInstance) {
        const credential = this.credentials.get(credentialId);
        if (!credential) {
            throw new Error(`Credential ${credentialId} not found`);
        }
        try {
            // Use the SAME approach as normal WebAuthn
            return new Promise((resolve) => {
                gunInstance
                    .user()
                    .create(username, credential.hashedCredentialId, (ack) => {
                    if (ack.err) {
                        // Try to login if user already exists
                        gunInstance
                            .user()
                            .auth(username, credential.hashedCredentialId, (authAck) => {
                            if (authAck.err) {
                                resolve({ success: false, error: authAck.err });
                            }
                            else {
                                const userPub = authAck.pub;
                                // Update credential with Gun user pub
                                credential.gunUserPub = userPub;
                                this.credentials.set(credentialId, credential);
                                resolve({ success: true, userPub });
                            }
                        });
                    }
                    else {
                        // User created, now login
                        gunInstance
                            .user()
                            .auth(username, credential.hashedCredentialId, (authAck) => {
                            if (authAck.err) {
                                resolve({ success: false, error: authAck.err });
                            }
                            else {
                                const userPub = authAck.pub;
                                // Update credential with Gun user pub
                                credential.gunUserPub = userPub;
                                this.credentials.set(credentialId, credential);
                                resolve({ success: true, userPub });
                            }
                        });
                    }
                });
            });
        }
        catch (error) {
            console.error("Error creating Gun user:", error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Signs data using WebAuthn + derived keys
     * This provides a hybrid approach: WebAuthn for user verification + derived keys for actual signing
     * CONSISTENT with normal approach
     */
    async signWithDerivedKeys(data, credentialId, username, extra) {
        try {
            // First, verify user with WebAuthn
            const authenticator = this.createAuthenticator(credentialId);
            await authenticator(data); // This verifies the user
            // Then use derived keys for actual signing (CONSISTENT approach)
            const keyPair = await this.createDerivedKeyPair(credentialId, username, extra);
            // Create signature using P-256 (same as SEA)
            const message = JSON.stringify(data);
            const messageHash = (0, sha256_1.sha256)(new TextEncoder().encode(message));
            // Convert base64url private key to bytes
            const privKeyBytes = base64url.decode(keyPair.priv);
            // Sign with P-256
            const signature = p256_1.p256.sign(messageHash, privKeyBytes);
            // Format like SEA signature
            const seaSignature = {
                m: message,
                s: base64url.encode(signature.toCompactRawBytes()),
            };
            return "SEA" + JSON.stringify(seaSignature);
        }
        catch (error) {
            console.error("Error signing with derived keys:", error);
            throw error;
        }
    }
    /**
     * Get the Gun user public key for a credential
     * This allows checking if the same user would be created
     */
    getGunUserPub(credentialId) {
        const credential = this.credentials.get(credentialId);
        return credential?.gunUserPub;
    }
    /**
     * Get the hashed credential ID (for consistency checking)
     */
    getHashedCredentialId(credentialId) {
        const credential = this.credentials.get(credentialId);
        return credential?.hashedCredentialId;
    }
    /**
     * Check if this credential would create the same Gun user as normal approach
     */
    async verifyConsistency(credentialId, username, expectedUserPub) {
        const credential = this.credentials.get(credentialId);
        if (!credential) {
            return { consistent: false };
        }
        // The derived keys should be the same as normal approach
        const derivedKeys = await this.createDerivedKeyPair(credentialId, username);
        return {
            consistent: expectedUserPub ? derivedKeys.pub === expectedUserPub : true,
            actualUserPub: derivedKeys.pub,
            expectedUserPub,
        };
    }
    /**
     * Get credential by ID
     */
    getCredential(credentialId) {
        return this.credentials.get(credentialId);
    }
    /**
     * List all stored credentials
     */
    listCredentials() {
        return Array.from(this.credentials.values());
    }
    /**
     * Remove a credential
     */
    removeCredential(credentialId) {
        return this.credentials.delete(credentialId);
    }
}
exports.WebAuthnSigner = WebAuthnSigner;
exports.default = WebAuthnSigner;
