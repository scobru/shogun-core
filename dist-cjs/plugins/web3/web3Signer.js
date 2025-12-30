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
    constructor(web3Connector) {
        this.credentials = new Map();
        this.MESSAGE_TO_SIGN = 'I Love Shogun!'; // Same as normal approach
        this.web3Connector = web3Connector || new web3Connector_1.Web3Connector();
    }
    /**
     * Creates a new Web3 signing credential
     * CONSISTENT with normal Web3 approach
     */
    async createSigningCredential(address) {
        try {
            // Validate address
            const validAddress = ethers_1.ethers.getAddress(address.toLowerCase());
            // Request signature using the same approach as normal Web3
            const signature = await this.requestSignature(validAddress);
            // Generate credentials using the SAME logic as normal approach
            const username = `${validAddress.toLowerCase()}`;
            // FIX: Use only address for password generation to ensure consistency
            // The signature changes each time, causing different passwords for same user
            const password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`${validAddress.toLowerCase()}:shogun-web3`));
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
            console.error('Error creating Web3 signing credential:', error);
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
            const signature = await signer.signMessage(this.MESSAGE_TO_SIGN);
            return signature;
        }
        catch (error) {
            console.error('Failed to request signature:', error);
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
                    throw new Error('Address mismatch during authentication');
                }
                // Sign the data
                const dataToSign = JSON.stringify(data);
                const signature = await signer.signMessage(dataToSign);
                return signature;
            }
            catch (error) {
                console.error('Web3 authentication error:', error);
                throw error;
            }
        };
    }
    /**
     * Creates a derived key pair from Web3 credential
     * CONSISTENT with normal approach: uses password as seed
     */
    async createDerivedKeyPair(address, extra) {
        // Use the deterministic approach instead of stored credentials
        return this.createDerivedKeyPairFromAddress(address, extra);
    }
    /**
     * Authenticate with existing pair (for login)
     * This generates the deterministic pair from address and authenticates with GunDB
     * GunDB will recognize the user because the pair is deterministic
     */
    async authenticateWithExistingPair(address, gunInstance) {
        try {
            console.log(`🔧 Web3Signer - authenticating with deterministic pair for address:`, address);
            // Generate the deterministic pair directly from address (no need for stored credentials)
            const derivedPair = await this.createDerivedKeyPairFromAddress(address);
            console.log(`🔧 Web3Signer - deterministic pair created, attempting auth with GunDB`);
            return new Promise((resolve) => {
                // Authenticate directly with GunDB using the deterministic pair
                gunInstance.user().auth(derivedPair, (authAck) => {
                    if (authAck.err) {
                        console.log(`🔧 Web3Signer - auth failed:`, authAck.err);
                        resolve({ success: false, error: authAck.err });
                    }
                    else {
                        const userPub = authAck.pub;
                        console.log(`🔧 Web3Signer - auth successful, userPub:`, userPub ? userPub.slice(0, 8) + '...' : 'null');
                        resolve({ success: true, userPub });
                    }
                });
            });
        }
        catch (error) {
            console.error('Error authenticating with deterministic pair:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Creates a derived key pair directly from address (deterministic)
     * This ensures the same pair is generated every time for the same address
     */
    async createDerivedKeyPairFromAddress(address, extra) {
        try {
            // Generate deterministic password from address (same as createSigningCredential)
            const validAddress = ethers_1.ethers.getAddress(address.toLowerCase());
            const password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`${validAddress.toLowerCase()}:shogun-web3`));
            console.log(`🔧 Web3Signer - generating deterministic pair for address:`, validAddress);
            // Use the same derive function as normal approach
            const derivedKeys = await (0, derive_1.default)(password, // Deterministic password from address
            extra, { includeP256: true });
            return {
                pub: derivedKeys.pub,
                priv: derivedKeys.priv,
                epub: derivedKeys.epub,
                epriv: derivedKeys.epriv,
            };
        }
        catch (error) {
            console.error('Error creating derived key pair from address:', error);
            throw error;
        }
    }
    /**
     * Creates a Gun user from Web3 credential
     * This ensures the SAME user is created as with normal approach
     * FIX: Use derived pair instead of username/password for GunDB auth
     */
    async createGunUser(address, gunInstance) {
        try {
            console.log(`🔧 Web3Signer - creating Gun user with deterministic pair for address:`, address);
            // Generate the deterministic pair directly from address
            const derivedPair = await this.createDerivedKeyPairFromAddress(address);
            return new Promise((resolve) => {
                // Use the derived pair directly for GunDB auth
                gunInstance.user().create(derivedPair, (ack) => {
                    if (ack.err) {
                        console.log(`🔧 Web3Signer - user creation failed, trying auth:`, ack.err);
                        // Try to login if user already exists
                        gunInstance.user().auth(derivedPair, (authAck) => {
                            if (authAck.err) {
                                console.log(`🔧 Web3Signer - auth also failed:`, authAck.err);
                                resolve({ success: false, error: authAck.err });
                            }
                            else {
                                const userPub = authAck.pub;
                                console.log(`🔧 Web3Signer - auth successful, userPub:`, userPub ? userPub.slice(0, 8) + '...' : 'null');
                                resolve({ success: true, userPub });
                            }
                        });
                    }
                    else {
                        console.log(`🔧 Web3Signer - user created successfully, now logging in`);
                        // User created, now login
                        gunInstance.user().auth(derivedPair, (authAck) => {
                            if (authAck.err) {
                                console.log(`🔧 Web3Signer - login after creation failed:`, authAck.err);
                                resolve({ success: false, error: authAck.err });
                            }
                            else {
                                const userPub = authAck.pub;
                                console.log(`🔧 Web3Signer - login successful, userPub:`, userPub ? userPub.slice(0, 8) + '...' : 'null');
                                resolve({ success: true, userPub });
                            }
                        });
                    }
                });
            });
        }
        catch (error) {
            console.error('Error creating Gun user:', error);
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
            return 'SEA' + JSON.stringify(seaSignature);
        }
        catch (error) {
            console.error('Error signing with derived keys:', error);
            throw error;
        }
    }
    /**
     * Get the Gun user public key for a credential
     * This allows checking if the same user would be created
     */
    async getGunUserPub(address) {
        try {
            // Generate the deterministic pair and return the public key
            const derivedPair = await this.createDerivedKeyPairFromAddress(address);
            return derivedPair.pub;
        }
        catch (error) {
            console.error('Error getting Gun user pub:', error);
            return undefined;
        }
    }
    /**
     * Get the password (for consistency checking)
     */
    getPassword(address) {
        try {
            // Generate deterministic password from address (same as createSigningCredential)
            const validAddress = ethers_1.ethers.getAddress(address.toLowerCase());
            const password = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`${validAddress.toLowerCase()}:shogun-web3`));
            return password;
        }
        catch (error) {
            console.error('Error getting password:', error);
            return undefined;
        }
    }
    /**
     * Check if this credential would create the same Gun user as normal approach
     */
    async verifyConsistency(address, expectedUserPub) {
        try {
            // Generate the deterministic pair
            const derivedKeys = await this.createDerivedKeyPairFromAddress(address);
            return {
                consistent: expectedUserPub
                    ? derivedKeys.pub === expectedUserPub
                    : true,
                actualUserPub: derivedKeys.pub,
                expectedUserPub,
            };
        }
        catch (error) {
            console.error('Error verifying consistency:', error);
            return { consistent: false };
        }
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
