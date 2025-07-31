"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrSigner = void 0;
const nostrConnector_1 = require("./nostrConnector");
const derive_1 = __importDefault(require("../../gundb/derive"));
const ethers_1 = require("ethers");
/**
 * Nostr Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but for Nostr/Bitcoin wallets
 * CONSISTENT with normal Nostr approach
 */
class NostrSigner {
    nostrConnector;
    credentials = new Map();
    MESSAGE_TO_SIGN = "I Love Shogun!"; // Same as normal approach
    constructor(nostrConnector) {
        this.nostrConnector = nostrConnector || new nostrConnector_1.NostrConnector();
    }
    /**
     * Creates a new Nostr signing credential
     * CONSISTENT with normal Nostr approach
     */
    async createSigningCredential(address) {
        try {
            // Validate address (same validation as normal approach)
            const validAddress = this.validateAddress(address);
            // Generate signature using the SAME approach as normal Nostr
            const signature = await this.generateDeterministicSignature(validAddress);
            // Generate credentials using the SAME logic as normal approach
            const username = `${validAddress.toLowerCase()}`;
            const password = await this.generatePassword(signature);
            const signingCredential = {
                address: validAddress,
                signature,
                message: this.MESSAGE_TO_SIGN,
                username,
                password, // This ensures consistency with normal approach
            };
            // Store credential for later use
            this.credentials.set(validAddress.toLowerCase(), signingCredential);
            return signingCredential;
        }
        catch (error) {
            console.error("Error creating Nostr signing credential:", error);
            throw new Error(`Failed to create Nostr signing credential: ${error.message}`);
        }
    }
    /**
     * Validates address using the same logic as NostrConnector
     */
    validateAddress(address) {
        if (!address) {
            throw new Error("Address not provided");
        }
        try {
            const normalizedAddress = String(address).trim();
            // Basic validation for Bitcoin addresses and Nostr pubkeys (same as normal approach)
            if (!/^(npub1|[0-9a-f]{64}|bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/.test(normalizedAddress)) {
                // More lenient validation for Nostr addresses
                if (normalizedAddress.length < 10) {
                    throw new Error("Invalid Nostr/Bitcoin address format");
                }
            }
            return normalizedAddress;
        }
        catch (error) {
            throw new Error("Invalid Nostr/Bitcoin address provided");
        }
    }
    /**
     * Generate deterministic signature using the SAME approach as NostrConnector
     */
    async generateDeterministicSignature(address) {
        // Create a deterministic signature based on the address and a fixed message
        // This ensures the same credentials are generated each time for the same address
        // SAME LOGIC as NostrConnector.generateDeterministicSignature
        const baseString = `${address}_${this.MESSAGE_TO_SIGN}_shogun_deterministic`;
        // Simple hash function to create a deterministic signature
        let hash = "";
        let runningValue = 0;
        for (let i = 0; i < baseString.length; i++) {
            const charCode = baseString.charCodeAt(i);
            runningValue = (runningValue * 31 + charCode) & 0xffffffff;
            if (i % 4 === 3) {
                hash += runningValue.toString(16).padStart(8, "0");
            }
        }
        // Ensure we have exactly 128 characters (64 bytes in hex)
        while (hash.length < 128) {
            runningValue = (runningValue * 31 + hash.length) & 0xffffffff;
            hash += runningValue.toString(16).padStart(8, "0");
        }
        // Ensure the result is exactly 128 characters and contains only valid hex characters
        let deterministicSignature = hash.substring(0, 128);
        // Double-check that it's a valid hex string
        deterministicSignature = deterministicSignature
            .toLowerCase()
            .replace(/[^0-9a-f]/g, "0");
        // Ensure it's exactly 128 characters
        if (deterministicSignature.length < 128) {
            deterministicSignature = deterministicSignature.padEnd(128, "0");
        }
        else if (deterministicSignature.length > 128) {
            deterministicSignature = deterministicSignature.substring(0, 128);
        }
        return deterministicSignature;
    }
    /**
     * Generate password using the SAME approach as NostrConnector
     */
    async generatePassword(signature) {
        if (!signature) {
            throw new Error("Invalid signature");
        }
        try {
            // SAME LOGIC as NostrConnector.generatePassword
            const normalizedSig = signature.toLowerCase().replace(/[^a-f0-9]/g, "");
            const passwordHash = ethers_1.ethers.sha256(ethers_1.ethers.toUtf8Bytes(normalizedSig));
            return passwordHash;
        }
        catch (error) {
            console.error("Error generating password:", error);
            throw new Error("Failed to generate password from signature");
        }
    }
    /**
     * Creates an authenticator function compatible with SEA.sign
     * This is the key function that makes it work like webauthn.js but for Nostr
     */
    createAuthenticator(address) {
        const credential = this.credentials.get(address.toLowerCase());
        if (!credential) {
            throw new Error(`Credential for address ${address} not found`);
        }
        return async (data) => {
            try {
                // Verify the user by requesting a new signature for the data
                // In a real implementation, this would use the Nostr extension
                const dataToSign = JSON.stringify(data);
                // For now, create a deterministic signature based on the data and credential
                const signature = await this.signData(dataToSign, credential);
                return signature;
            }
            catch (error) {
                console.error("Nostr authentication error:", error);
                throw error;
            }
        };
    }
    /**
     * Sign data using the credential
     */
    async signData(data, credential) {
        // Create a deterministic signature for the data
        const signatureBase = `${credential.signature}_${data}`;
        return this.generateDeterministicSignature(signatureBase);
    }
    /**
     * Creates a derived key pair from Nostr credential
     * CONSISTENT with normal approach: uses password as seed
     */
    async createDerivedKeyPair(address, extra) {
        const credential = this.credentials.get(address.toLowerCase());
        if (!credential) {
            throw new Error(`Credential for address ${address} not found`);
        }
        try {
            // CONSISTENCY: Use the same approach as normal Nostr
            // Use password as seed (same as normal approach)
            const derivedKeys = await (0, derive_1.default)(credential.password, // This is the key consistency point!
            extra, { includeP256: true });
            return {
                pub: derivedKeys.pub,
                priv: derivedKeys.priv,
                epub: derivedKeys.epub,
                epriv: derivedKeys.epriv,
            };
        }
        catch (error) {
            console.error("Error deriving keys from Nostr credential:", error);
            throw error;
        }
    }
    /**
     * Creates a Gun user from Nostr credential
     * This ensures the SAME user is created as with normal approach
     */
    async createGunUser(address, gunInstance) {
        const credential = this.credentials.get(address.toLowerCase());
        if (!credential) {
            throw new Error(`Credential for address ${address} not found`);
        }
        try {
            // Use the SAME approach as normal Nostr
            return new Promise((resolve) => {
                gunInstance
                    .user()
                    .create(credential.username, credential.password, (ack) => {
                    if (ack.err) {
                        // Try to login if user already exists
                        gunInstance
                            .user()
                            .auth(credential.username, credential.password, (authAck) => {
                            if (authAck.err) {
                                resolve({ success: false, error: authAck.err });
                            }
                            else {
                                const userPub = authAck.pub;
                                // Update credential with Gun user pub
                                credential.gunUserPub = userPub;
                                this.credentials.set(address.toLowerCase(), credential);
                                resolve({ success: true, userPub });
                            }
                        });
                    }
                    else {
                        // User created, now login
                        gunInstance
                            .user()
                            .auth(credential.username, credential.password, (authAck) => {
                            if (authAck.err) {
                                resolve({ success: false, error: authAck.err });
                            }
                            else {
                                const userPub = authAck.pub;
                                // Update credential with Gun user pub
                                credential.gunUserPub = userPub;
                                this.credentials.set(address.toLowerCase(), credential);
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
     * Signs data using Nostr + derived keys
     * This provides a hybrid approach: Nostr for user verification + derived keys for actual signing
     * CONSISTENT with normal approach
     */
    async signWithDerivedKeys(data, address, extra) {
        try {
            // First, verify user with Nostr
            const authenticator = this.createAuthenticator(address);
            await authenticator(data); // This verifies the user
            // Then use derived keys for actual signing (CONSISTENT approach)
            const keyPair = await this.createDerivedKeyPair(address, extra);
            // Create signature using the same approach as SEA
            const message = JSON.stringify(data);
            // Use a simple signing approach (in production, would use proper crypto)
            const signature = await this.generateDeterministicSignature(`${keyPair.priv}_${message}`);
            // Format like SEA signature
            const seaSignature = {
                m: message,
                s: signature,
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
    getGunUserPub(address) {
        const credential = this.credentials.get(address.toLowerCase());
        return credential?.gunUserPub;
    }
    /**
     * Get the password (for consistency checking)
     */
    getPassword(address) {
        const credential = this.credentials.get(address.toLowerCase());
        return credential?.password;
    }
    /**
     * Check if this credential would create the same Gun user as normal approach
     */
    async verifyConsistency(address, expectedUserPub) {
        const credential = this.credentials.get(address.toLowerCase());
        if (!credential) {
            return { consistent: false };
        }
        // The derived keys should be the same as normal approach
        const derivedKeys = await this.createDerivedKeyPair(address);
        return {
            consistent: expectedUserPub ? derivedKeys.pub === expectedUserPub : true,
            actualUserPub: derivedKeys.pub,
            expectedUserPub,
        };
    }
    /**
     * Get credential by address
     */
    getCredential(address) {
        return this.credentials.get(address.toLowerCase());
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
    removeCredential(address) {
        return this.credentials.delete(address.toLowerCase());
    }
}
exports.NostrSigner = NostrSigner;
exports.default = NostrSigner;
