/**
 * Manages stealth logic using Gun and SEA
 */
import { ethers } from "ethers";
import { Storage } from "../storage/storage";
class Stealth {
    constructor(storage) {
        this.lastEphemeralKeyPair = null;
        this.lastMethodUsed = "unknown";
        this.STEALTH_HISTORY_KEY = "stealthHistory";
        this.STEALTH_DATA_TABLE = "Stealth";
        this.storage = storage || new Storage(); // Use provided storage or create a new one
    }
    /**
     * Removes the initial tilde (~) from the public key if present
     */
    formatPublicKey(publicKey) {
        if (!publicKey) {
            return null;
        }
        const trimmedKey = publicKey.trim();
        if (!trimmedKey) {
            return null;
        }
        if (!/^[~]?[\w+/=\-_.]+$/.test(trimmedKey)) {
            return null;
        }
        return trimmedKey.startsWith("~") ? trimmedKey.slice(1) : trimmedKey;
    }
    /**
     * Creates a new stealth account
     */
    async createAccount() {
        try {
            // Generate a new key pair
            const keyPair = await Gun.SEA.pair();
            if (!keyPair ||
                !keyPair.pub ||
                !keyPair.priv ||
                !keyPair.epub ||
                !keyPair.epriv) {
                throw new Error("Failed to generate stealth key pair");
            }
            return {
                pub: keyPair.pub,
                priv: keyPair.priv,
                epub: keyPair.epub,
                epriv: keyPair.epriv,
            };
        }
        catch (error) {
            console.error("Error creating stealth account:", error);
            throw error;
        }
    }
    /**
     * Generates a stealth address for the recipient's public key
     */
    async generateStealthAddress(recipientPublicKey) {
        if (!recipientPublicKey) {
            throw new Error("Invalid keys: missing or invalid parameters");
        }
        // First create stealth keys
        const stealthKeys = await this.createAccount();
        if (!stealthKeys) {
            throw new Error("Failed to create stealth keys");
        }
        console.log("Generating stealth address with keys:", {
            userPub: stealthKeys.pub,
            userEpub: stealthKeys.epub,
            recipientPub: recipientPublicKey,
        });
        return new Promise((resolve, reject) => {
            // Generate ephemeral key pair
            Gun.SEA.pair((ephemeralKeyPair) => {
                if (!ephemeralKeyPair?.epub || !ephemeralKeyPair?.epriv) {
                    reject(new Error("Invalid ephemeral keys"));
                    return;
                }
                console.log("Ephemeral keys generated:", ephemeralKeyPair);
                // Store entire pair for debugging
                this.lastEphemeralKeyPair = ephemeralKeyPair;
                // Create stealth data
                const stealthData = {
                    recipientPublicKey: recipientPublicKey,
                    ephemeralKeyPair: ephemeralKeyPair,
                    timestamp: Date.now(),
                };
                // Use this specific format for SEA.secret parameter
                const keyForSecret = {
                    epub: ephemeralKeyPair.epub,
                    epriv: ephemeralKeyPair.epriv,
                };
                console.log("Key format for secret (generation):", JSON.stringify(keyForSecret));
                Gun.SEA.secret(recipientPublicKey, keyForSecret, async (sharedSecret) => {
                    console.log("Shared secret successfully generated with recipient keys");
                    console.log("Input format used:", {
                        recipientPublicKey: recipientPublicKey,
                        ephemeralKeyObject: keyForSecret,
                    });
                    try {
                        // Generate stealth address using shared secret
                        const stealthPrivateKey = ethers.keccak256(ethers.toUtf8Bytes(sharedSecret));
                        const stealthWallet = new ethers.Wallet(stealthPrivateKey);
                        console.log("Stealth address generated:", {
                            address: stealthWallet.address,
                            ephemeralPubKey: ephemeralKeyPair.epub,
                            recipientPublicKey: recipientPublicKey,
                        });
                        // Save method used and shared secret
                        this.lastMethodUsed = "standard";
                        stealthData.method = "standard";
                        stealthData.sharedSecret = sharedSecret;
                        // Save data in storage to allow opening
                        this.saveStealthHistory(stealthWallet.address, stealthData);
                        resolve({
                            stealthAddress: stealthWallet.address,
                            ephemeralPublicKey: ephemeralKeyPair.epub,
                            recipientPublicKey: recipientPublicKey,
                        });
                    }
                    catch (error) {
                        reject(new Error(`Error creating stealth address: ${error instanceof Error ? error.message : "unknown error"}`));
                    }
                });
            });
        });
    }
    /**
     * Opens a stealth address by deriving the private key
     */
    async openStealthAddress(stealthAddress, ephemeralPublicKey, pair) {
        console.log(`Attempting to open stealth address ${stealthAddress}`);
        // First check if we have data saved in storage
        try {
            const stealthHistoryJson = this.storage.getItem(this.STEALTH_HISTORY_KEY) || "{}";
            const history = JSON.parse(stealthHistoryJson);
            console.log(`Checking if data exists for address ${stealthAddress} in storage`);
            const data = history[stealthAddress];
            if (data) {
                console.log("Found locally saved stealth data:", data);
                // If we have the shared secret, we can derive the wallet directly
                if (data.sharedSecret) {
                    console.log("Direct derivation from saved shared secret");
                    const stealthPrivateKey = ethers.keccak256(ethers.toUtf8Bytes(data.sharedSecret));
                    return new ethers.Wallet(stealthPrivateKey);
                }
                // If we have the method and complete ephemeral keys, try to regenerate the secret
                if (data.method && data.ephemeralKeyPair) {
                    console.log("Attempting to regenerate secret with method:", data.method);
                    if (data.method === "standard") {
                        // Use the specific format we used during generation
                        const keyForSecret = {
                            epub: data.ephemeralKeyPair.epub,
                            epriv: data.ephemeralKeyPair.epriv,
                        };
                        console.log("Regenerating with explicit format:", JSON.stringify(keyForSecret));
                        return new Promise((resolve, reject) => {
                            Gun.SEA.secret(data.recipientPublicKey, keyForSecret, async (secret) => {
                                if (!secret) {
                                    reject(new Error("Unable to regenerate shared secret"));
                                    return;
                                }
                                try {
                                    const stealthPrivateKey = ethers.keccak256(ethers.toUtf8Bytes(secret));
                                    const wallet = new ethers.Wallet(stealthPrivateKey);
                                    // Verify generated wallet matches address
                                    if (wallet.address.toLowerCase() ===
                                        stealthAddress.toLowerCase()) {
                                        console.log("Regeneration successful! Matching address:", wallet.address);
                                        return resolve(wallet);
                                    }
                                    console.log("Generated address does not match:", wallet.address);
                                    // Continue with standard methods
                                    throw new Error("Address does not match"); // To exit and continue
                                }
                                catch (e) {
                                    console.error("Error during derivation:", e);
                                    // Continue with standard methods
                                    throw new Error("Derivation error"); // To exit and continue
                                }
                            });
                        });
                    }
                    throw new Error("Method not supported"); // To exit and continue
                }
                throw new Error("Insufficient data"); // To exit and continue
            }
            console.log("No stealth data found in storage for this address");
            throw new Error("No data found"); // To continue with standard methods
        }
        catch (e) {
            console.log("Error retrieving data from storage:", e);
            // Proceed with normal method
            return this.openStealthAddressStandard(stealthAddress, ephemeralPublicKey, pair);
        }
    }
    /**
     * Standard method to open a stealth address (used as fallback)
     */
    async openStealthAddressStandard(stealthAddress, ephemeralPublicKey, pair) {
        if (!stealthAddress || !ephemeralPublicKey) {
            throw new Error("Missing parameters: stealthAddress or ephemeralPublicKey");
        }
        // Retrieve user's stealth keys
        console.log("Opening stealth address with retrieved keys:", {
            stealthAddress: stealthAddress,
            ephemeralPublicKey: ephemeralPublicKey,
            userKeysFound: !!pair,
        });
        return new Promise((resolve, reject) => {
            // Try all possible parameter combinations for SEA.secret
            const attempts = [
                // Attempt 1: Standard method - ephemeral keys first
                () => {
                    console.log("Attempt 1: Standard method with ephemeral keys");
                    return new Promise((res) => {
                        Gun.SEA.secret(ephemeralPublicKey, pair, async (secret) => {
                            try {
                                if (!secret) {
                                    return res(null);
                                }
                                const wallet = this.deriveWalletFromSecret(secret);
                                if (wallet.address.toLowerCase() ===
                                    stealthAddress.toLowerCase()) {
                                    return res(wallet);
                                }
                                return res(null);
                            }
                            catch (e) {
                                return res(null);
                            }
                        });
                    });
                },
            ];
            // Helper function to derive wallet from secret
            this.deriveWalletFromSecret = (secret) => {
                const stealthPrivateKey = ethers.keccak256(ethers.toUtf8Bytes(secret));
                return new ethers.Wallet(stealthPrivateKey);
            };
            // Execute all attempts in sequence
            const tryNextAttempt = async (index = 0) => {
                if (index >= attempts.length) {
                    return reject(new Error("All stealth address derivation methods failed"));
                }
                const wallet = await attempts[index]();
                if (wallet) {
                    console.log(`Method ${index + 1} worked!`);
                    return resolve(wallet);
                }
                tryNextAttempt(index + 1);
            };
            tryNextAttempt();
        });
    }
    /**
     * Gets public key from an address
     */
    async getPublicKey(publicKey) {
        // Format public key
        return this.formatPublicKey(publicKey);
    }
    /**
     * Saves stealth keys in user profile
     * @returns The stealth keys to save
     */
    prepareStealthKeysForSaving(stealthKeyPair) {
        if (!stealthKeyPair?.pub ||
            !stealthKeyPair?.priv ||
            !stealthKeyPair?.epub ||
            !stealthKeyPair?.epriv) {
            throw new Error("Invalid stealth keys: missing or incomplete parameters");
        }
        return stealthKeyPair;
    }
    /**
     * Derives a wallet from shared secret
     */
    deriveWalletFromSecret(secret) {
        const stealthPrivateKey = ethers.keccak256(ethers.toUtf8Bytes(secret));
        return new ethers.Wallet(stealthPrivateKey);
    }
    /**
     * Saves stealth data in storage
     */
    saveStealthHistory(address, data) {
        // Save to storage
        try {
            const stealthHistoryJson = this.storage.getItem(this.STEALTH_HISTORY_KEY) || "{}";
            const history = JSON.parse(stealthHistoryJson);
            history[address] = data;
            this.storage.setItem(this.STEALTH_HISTORY_KEY, JSON.stringify(history));
            console.log(`Stealth data saved for address ${address}`);
        }
        catch (e) {
            console.error("Error saving stealth data:", e);
        }
    }
}
// Make globally available
if (typeof window !== "undefined") {
    window.Stealth = Stealth;
}
else if (typeof global !== "undefined") {
    global.Stealth = Stealth;
}
export { Stealth };
