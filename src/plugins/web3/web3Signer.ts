import { Web3Connector } from "./web3Connector";
import { ethers } from "ethers";
import { logDebug, logError } from "../../utils/logger";
import derive from "../../gundb/derive";

/**
 * Web3 Signing Credential for oneshot signing
 */
export interface Web3SigningCredential {
  address: string;
  signature: string;
  message: string;
  username: string; // For consistency with normal approach
  password: string; // For consistency with normal approach
  gunUserPub?: string; // The Gun user public key if created
}

/**
 * Web3 Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but for Web3/MetaMask
 * CONSISTENT with normal Web3 approach
 */
export class Web3Signer {
  private web3Connector: Web3Connector;
  private credentials: Map<string, Web3SigningCredential> = new Map();
  private readonly MESSAGE_TO_SIGN = "I Love Shogun!"; // Same as normal approach

  constructor(web3Connector?: Web3Connector) {
    this.web3Connector = web3Connector || new Web3Connector();
  }

  /**
   * Creates a new Web3 signing credential
   * CONSISTENT with normal Web3 approach
   */
  async createSigningCredential(
    address: string,
  ): Promise<Web3SigningCredential> {
    try {
      logDebug(`Creating Web3 signing credential for address: ${address}`);

      // Validate address
      const validAddress = ethers.getAddress(address.toLowerCase());

      // Request signature using the same approach as normal Web3
      const signature = await this.requestSignature(validAddress);

      // Generate credentials using the SAME logic as normal approach
      const username = `${validAddress.toLowerCase()}`;
      const password = ethers.keccak256(
        ethers.toUtf8Bytes(`${signature}:${validAddress.toLowerCase()}`),
      );

      const signingCredential: Web3SigningCredential = {
        address: validAddress,
        signature,
        message: this.MESSAGE_TO_SIGN,
        username,
        password, // This ensures consistency with normal approach
      };

      // Store credential for later use
      this.credentials.set(validAddress.toLowerCase(), signingCredential);

      logDebug("Created Web3 signing credential:", signingCredential);
      return signingCredential;
    } catch (error: any) {
      logError("Error creating Web3 signing credential:", error);
      throw new Error(
        `Failed to create Web3 signing credential: ${error.message}`,
      );
    }
  }

  /**
   * Request signature from MetaMask
   * Uses the same approach as normal Web3Connector
   */
  private async requestSignature(address: string): Promise<string> {
    try {
      const signer = await this.web3Connector.getSigner();
      const signerAddress = await signer.getAddress();

      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error(
          `Signer address (${signerAddress}) does not match expected address (${address})`,
        );
      }

      logDebug(`Requesting signature for message: ${this.MESSAGE_TO_SIGN}`);
      const signature = await signer.signMessage(this.MESSAGE_TO_SIGN);
      logDebug("Signature obtained successfully");

      return signature;
    } catch (error: any) {
      logError("Failed to request signature:", error);
      throw error;
    }
  }

  /**
   * Creates an authenticator function compatible with SEA.sign
   * This is the key function that makes it work like webauthn.js but for Web3
   */
  createAuthenticator(address: string): (data: any) => Promise<string> {
    const credential = this.credentials.get(address.toLowerCase());
    if (!credential) {
      throw new Error(`Credential for address ${address} not found`);
    }

    return async (data: any): Promise<string> => {
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

        logDebug("Web3 authentication successful:", { data, signature });
        return signature;
      } catch (error: any) {
        logError("Web3 authentication error:", error);
        throw error;
      }
    };
  }

  /**
   * Creates a derived key pair from Web3 credential
   * CONSISTENT with normal approach: uses password as seed
   */
  async createDerivedKeyPair(
    address: string,
    extra?: string[],
  ): Promise<{ pub: string; priv: string; epub: string; epriv: string }> {
    const credential = this.credentials.get(address.toLowerCase());
    if (!credential) {
      throw new Error(`Credential for address ${address} not found`);
    }

    try {
      // CONSISTENCY: Use the same approach as normal Web3
      // Use password as seed (same as normal approach)
      const derivedKeys = await derive(
        credential.password, // This is the key consistency point!
        extra,
        { includeP256: true },
      );

      return {
        pub: derivedKeys.pub,
        priv: derivedKeys.priv,
        epub: derivedKeys.epub,
        epriv: derivedKeys.epriv,
      };
    } catch (error: any) {
      logError("Error deriving keys from Web3 credential:", error);
      throw error;
    }
  }

  /**
   * Creates a Gun user from Web3 credential
   * This ensures the SAME user is created as with normal approach
   */
  async createGunUser(
    address: string,
    gunInstance: any,
  ): Promise<{ success: boolean; userPub?: string; error?: string }> {
    const credential = this.credentials.get(address.toLowerCase());
    if (!credential) {
      throw new Error(`Credential for address ${address} not found`);
    }

    try {
      // Use the SAME approach as normal Web3
      return new Promise((resolve) => {
        gunInstance
          .user()
          .create(credential.username, credential.password, (ack: any) => {
            if (ack.err) {
              // Try to login if user already exists
              gunInstance
                .user()
                .auth(
                  credential.username,
                  credential.password,
                  (authAck: any) => {
                    if (authAck.err) {
                      resolve({ success: false, error: authAck.err });
                    } else {
                      const userPub = authAck.pub;
                      // Update credential with Gun user pub
                      credential.gunUserPub = userPub;
                      this.credentials.set(address.toLowerCase(), credential);
                      resolve({ success: true, userPub });
                    }
                  },
                );
            } else {
              // User created, now login
              gunInstance
                .user()
                .auth(
                  credential.username,
                  credential.password,
                  (authAck: any) => {
                    if (authAck.err) {
                      resolve({ success: false, error: authAck.err });
                    } else {
                      const userPub = authAck.pub;
                      // Update credential with Gun user pub
                      credential.gunUserPub = userPub;
                      this.credentials.set(address.toLowerCase(), credential);
                      resolve({ success: true, userPub });
                    }
                  },
                );
            }
          });
      });
    } catch (error: any) {
      logError("Error creating Gun user:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Signs data using Web3 + derived keys
   * This provides a hybrid approach: Web3 for user verification + derived keys for actual signing
   * CONSISTENT with normal approach
   */
  async signWithDerivedKeys(
    data: any,
    address: string,
    extra?: string[],
  ): Promise<string> {
    try {
      // First, verify user with Web3
      const authenticator = this.createAuthenticator(address);
      await authenticator(data); // This verifies the user

      // Then use derived keys for actual signing (CONSISTENT approach)
      const keyPair = await this.createDerivedKeyPair(address, extra);

      // Create signature using the same approach as SEA
      const message = JSON.stringify(data);
      const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));

      // Use ethers for signing (compatible with SEA)
      const wallet = new ethers.Wallet(keyPair.priv);
      const signature = await wallet.signMessage(message);

      // Format like SEA signature
      const seaSignature = {
        m: message,
        s: signature,
      };

      return "SEA" + JSON.stringify(seaSignature);
    } catch (error: any) {
      logError("Error signing with derived keys:", error);
      throw error;
    }
  }

  /**
   * Get the Gun user public key for a credential
   * This allows checking if the same user would be created
   */
  getGunUserPub(address: string): string | undefined {
    const credential = this.credentials.get(address.toLowerCase());
    return credential?.gunUserPub;
  }

  /**
   * Get the password (for consistency checking)
   */
  getPassword(address: string): string | undefined {
    const credential = this.credentials.get(address.toLowerCase());
    return credential?.password;
  }

  /**
   * Check if this credential would create the same Gun user as normal approach
   */
  async verifyConsistency(
    address: string,
    expectedUserPub?: string,
  ): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }> {
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
  getCredential(address: string): Web3SigningCredential | undefined {
    return this.credentials.get(address.toLowerCase());
  }

  /**
   * List all stored credentials
   */
  listCredentials(): Web3SigningCredential[] {
    return Array.from(this.credentials.values());
  }

  /**
   * Remove a credential
   */
  removeCredential(address: string): boolean {
    return this.credentials.delete(address.toLowerCase());
  }
}

export default Web3Signer;
