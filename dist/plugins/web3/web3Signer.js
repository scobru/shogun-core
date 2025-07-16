"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Signer = void 0;
const web3Connector_1 = require("./web3Connector");
const ethers_1 = require("ethers");
const derive_1 = __importDefault(require("../../gundb/derive"));
/**
 * Web3 Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but for Web3/MetaMask
 * CONSISTENT with normal Web3 approach
 */
class Web3Signer {
    web3Connector;
    credentials = new Map();
    MESSAGE_TO_SIGN = "I Love Shogun!"; // Same as normal approach
    constructor(web3Connector) {
        this.web3Connector = web3Connector || new web3Connector_1.Web3Connector();
    }
    /**
     * Creates a new Web3 signing credential
     * CONSISTENT with normal Web3 approach
     */
    async createSigningCredential(address) {
        try {
            console.log(`Creating Web3 signing credential for address: ${address}`);
            // Validate address
            const validAddress = ethers_1.ethers.getAddress(address.toLowerCase());
            // Request signature using the same approach as normal Web3
            const signature = await this.requestSignature(validAddress);
            // Generate credentials using the SAME logic as normal approach
            const username = `${validAddress.toLowerCase()}`;
            const password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`${signature}:${validAddress.toLowerCase()}`));
            const signingCredential = {
                address: validAddress,
                signature,
                message: this.MESSAGE_TO_SIGN,
                username,
                password, // This ensures consistency with normal approach
            };
            // Store credential for later use
            this.credentials.set(validAddress.toLowerCase(), signingCredential);
            console.log("Created Web3 signing credential:", signingCredential);
            return signingCredential;
        }
        catch (error) {
            console.error("Error creating Web3 signing credential:", error);
            throw new Error(`Failed to create Web3 signing credential: ${error.message}`);
        }
    }
    /**
     * Request signature from MetaMask
     * Uses the same approach as normal Web3Connector
     */
    async requestSignature(address) {
        try {
            const signer = await this.web3Connector.getSigner();
            const signerAddress = await signer.getAddress();
            if (signerAddress.toLowerCase() !== address.toLowerCase()) {
                throw new Error(`Signer address (${signerAddress}) does not match expected address (${address})`);
            }
            console.log(`Requesting signature for message: ${this.MESSAGE_TO_SIGN}`);
            const signature = await signer.signMessage(this.MESSAGE_TO_SIGN);
            console.log("Signature obtained successfully");
            return signature;
        }
        catch (error) {
            console.error("Failed to request signature:", error);
            throw error;
        }
    }
    /**
     * Creates an authenticator function compatible with SEA.sign
     * This is the key function that makes it work like webauthn.js but for Web3
     */
    createAuthenticator(address) {
        const credential = this.credentials.get(address.toLowerCase());
        if (!credential) {
            throw new Error(`Credential for address ${address} not found`);
        }
        return async (data) => {
            try {
                // Verify the user by requesting a new signature for the data
                const signer = await this.web3Connector.getSigner();
                const signerAddress = await signer.getAddress();
                if (signerAddress.toLowerCase() !== address.toLowerCase()) {
                    throw new Error("Address mismatch during authentication");
                }
                // Sign the data
                const dataToSign = JSON.stringify(data);
                const signature = await signer.signMessage(dataToSign);
                console.log("Web3 authentication successful:", { data, signature });
                return signature;
            }
            catch (error) {
                console.error("Web3 authentication error:", error);
                throw error;
            }
        };
    }
    /**
     * Creates a derived key pair from Web3 credential
     * CONSISTENT with normal approach: uses password as seed
     */
    async createDerivedKeyPair(address, extra) {
        const credential = this.credentials.get(address.toLowerCase());
        if (!credential) {
            throw new Error(`Credential for address ${address} not found`);
        }
        try {
            // CONSISTENCY: Use the same approach as normal Web3
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
            console.error("Error deriving keys from Web3 credential:", error);
            throw error;
        }
    }
    /**
     * Creates a Gun user from Web3 credential
     * This ensures the SAME user is created as with normal approach
     */
    async createGunUser(address, gunInstance) {
        const credential = this.credentials.get(address.toLowerCase());
        if (!credential) {
            throw new Error(`Credential for address ${address} not found`);
        }
        try {
            // Use the SAME approach as normal Web3
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
     * Signs data using Web3 + derived keys
     * This provides a hybrid approach: Web3 for user verification + derived keys for actual signing
     * CONSISTENT with normal approach
     */
    async signWithDerivedKeys(data, address, extra) {
        try {
            // First, verify user with Web3
            const authenticator = this.createAuthenticator(address);
            await authenticator(data); // This verifies the user
            // Then use derived keys for actual signing (CONSISTENT approach)
            const keyPair = await this.createDerivedKeyPair(address, extra);
            // Create signature using the same approach as SEA
            const message = JSON.stringify(data);
            const messageHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(message));
            // Use ethers for signing (compatible with SEA)
            const wallet = new ethers_1.ethers.Wallet(keyPair.priv);
            const signature = await wallet.signMessage(message);
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
exports.Web3Signer = Web3Signer;
exports.default = Web3Signer;
