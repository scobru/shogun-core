import { Webauthn } from "./webauthn";
import { p256 } from "@noble/curves/p256";
import { sha256 } from "@noble/hashes/sha256";
import derive from "../../gundb/derive";
import { ethers } from "ethers";

/**
 * Base64URL encoding utilities
 */
const base64url = {
  encode: function (buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  },
  decode: function (str: string): Uint8Array {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    const binary = atob(str);
    return new Uint8Array(binary.split("").map((c) => c.charCodeAt(0)));
  },
};

/**
 * WebAuthn Credential for oneshot signing
 */
export interface WebAuthnSigningCredential {
  id: string;
  rawId: ArrayBuffer;
  publicKey: {
    x: string; // base64url encoded
    y: string; // base64url encoded
  };
  pub: string; // x.y format for SEA compatibility
  hashedCredentialId: string; // For consistency with normal approach
  gunUserPub?: string; // The Gun user public key if created
}

/**
 * WebAuthn Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but integrated with our architecture
 * CONSISTENT with normal WebAuthn approach
 */
export class WebAuthnSigner {
  private webauthn: Webauthn;
  private credentials: Map<string, WebAuthnSigningCredential> = new Map();

  constructor(webauthn?: Webauthn) {
    this.webauthn = webauthn || new Webauthn();
  }

  /**
   * Creates a new WebAuthn credential for signing
   * Similar to webauthn.js create functionality but CONSISTENT with normal approach
   */
  async createSigningCredential(
    username: string,
  ): Promise<WebAuthnSigningCredential> {
    try {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: {
            id:
              window.location.hostname === "localhost"
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
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create WebAuthn credential");
      }

      // Extract public key in the same way as webauthn.js
      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKey = response.getPublicKey();

      if (!publicKey) {
        throw new Error("Failed to get public key from credential");
      }

      const rawKey = new Uint8Array(publicKey);
      console.log("Raw public key bytes:", rawKey);

      // Extract coordinates like webauthn.js (slice positions may need adjustment)
      const xCoord = rawKey.slice(27, 59);
      const yCoord = rawKey.slice(59, 91);

      const x = base64url.encode(xCoord);
      const y = base64url.encode(yCoord);
      const pub = `${x}.${y}`;

      // CONSISTENCY: Use the same hashing approach as normal WebAuthn
      const hashedCredentialId = ethers.keccak256(
        ethers.toUtf8Bytes(credential.id),
      );

      const signingCredential: WebAuthnSigningCredential = {
        id: credential.id,
        rawId: credential.rawId,
        publicKey: { x, y },
        pub,
        hashedCredentialId, // This ensures consistency
      };

      // Store credential for later use
      this.credentials.set(credential.id, signingCredential);

      console.log("Created signing credential:", signingCredential);
      return signingCredential;
    } catch (error: any) {
      console.error("Error creating signing credential:", error);
      throw new Error(`Failed to create signing credential: ${error.message}`);
    }
  }

  /**
   * Creates an authenticator function compatible with SEA.sign
   * This is the key function that makes it work like webauthn.js
   */
  createAuthenticator(
    credentialId: string,
  ): (data: any) => Promise<AuthenticatorAssertionResponse> {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found`);
    }

    return async (data: any): Promise<AuthenticatorAssertionResponse> => {
      try {
        const challenge = new TextEncoder().encode(JSON.stringify(data));

        const options: PublicKeyCredentialRequestOptions = {
          challenge,
          rpId:
            window.location.hostname === "localhost"
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
        })) as PublicKeyCredential;

        if (!assertion) {
          throw new Error("WebAuthn assertion failed");
        }

        console.log("WebAuthn assertion successful:", { options, assertion });
        return assertion.response as AuthenticatorAssertionResponse;
      } catch (error: any) {
        console.error("WebAuthn assertion error:", error);
        throw error;
      }
    };
  }

  /**
   * Creates a derived key pair from WebAuthn credential
   * CONSISTENT with normal approach: uses hashedCredentialId as password
   */
  async createDerivedKeyPair(
    credentialId: string,
    username: string,
    extra?: string[],
  ): Promise<{ pub: string; priv: string; epub: string; epriv: string }> {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found`);
    }

    try {
      // CONSISTENCY: Use the same approach as normal WebAuthn
      // Use hashedCredentialId as password (same as normal approach)
      const derivedKeys = await derive(
        credential.hashedCredentialId, // This is the key change!
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
      console.error("Error deriving keys from WebAuthn credential:", error);
      throw error;
    }
  }

  /**
   * Creates a Gun user from WebAuthn credential
   * This ensures the SAME user is created as with normal approach
   */
  async createGunUser(
    credentialId: string,
    username: string,
    gunInstance: any,
  ): Promise<{ success: boolean; userPub?: string; error?: string }> {
    const credential = this.credentials.get(credentialId);
    if (!credential) {
      throw new Error(`Credential ${credentialId} not found`);
    }

    try {
      // Use the SAME approach as normal WebAuthn
      return new Promise((resolve) => {
        gunInstance
          .user()
          .create(username, credential.hashedCredentialId, (ack: any) => {
            if (ack.err) {
              // Try to login if user already exists
              gunInstance
                .user()
                .auth(
                  username,
                  credential.hashedCredentialId,
                  (authAck: any) => {
                    if (authAck.err) {
                      resolve({ success: false, error: authAck.err });
                    } else {
                      const userPub = authAck.pub;
                      // Update credential with Gun user pub
                      credential.gunUserPub = userPub;
                      this.credentials.set(credentialId, credential);
                      resolve({ success: true, userPub });
                    }
                  },
                );
            } else {
              // User created, now login
              gunInstance
                .user()
                .auth(
                  username,
                  credential.hashedCredentialId,
                  (authAck: any) => {
                    if (authAck.err) {
                      resolve({ success: false, error: authAck.err });
                    } else {
                      const userPub = authAck.pub;
                      // Update credential with Gun user pub
                      credential.gunUserPub = userPub;
                      this.credentials.set(credentialId, credential);
                      resolve({ success: true, userPub });
                    }
                  },
                );
            }
          });
      });
    } catch (error: any) {
      console.error("Error creating Gun user:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Signs data using WebAuthn + derived keys
   * This provides a hybrid approach: WebAuthn for user verification + derived keys for actual signing
   * CONSISTENT with normal approach
   */
  async signWithDerivedKeys(
    data: any,
    credentialId: string,
    username: string,
    extra?: string[],
  ): Promise<string> {
    try {
      // First, verify user with WebAuthn
      const authenticator = this.createAuthenticator(credentialId);
      await authenticator(data); // This verifies the user

      // Then use derived keys for actual signing (CONSISTENT approach)
      const keyPair = await this.createDerivedKeyPair(
        credentialId,
        username,
        extra,
      );

      // Create signature using P-256 (same as SEA)
      const message = JSON.stringify(data);
      const messageHash = sha256(new TextEncoder().encode(message));

      // Convert base64url private key to bytes
      const privKeyBytes = base64url.decode(keyPair.priv);

      // Sign with P-256
      const signature = p256.sign(messageHash, privKeyBytes);

      // Format like SEA signature
      const seaSignature = {
        m: message,
        s: base64url.encode(signature.toCompactRawBytes()),
      };

      return "SEA" + JSON.stringify(seaSignature);
    } catch (error: any) {
      console.error("Error signing with derived keys:", error);
      throw error;
    }
  }

  /**
   * Get the Gun user public key for a credential
   * This allows checking if the same user would be created
   */
  getGunUserPub(credentialId: string): string | undefined {
    const credential = this.credentials.get(credentialId);
    return credential?.gunUserPub;
  }

  /**
   * Get the hashed credential ID (for consistency checking)
   */
  getHashedCredentialId(credentialId: string): string | undefined {
    const credential = this.credentials.get(credentialId);
    return credential?.hashedCredentialId;
  }

  /**
   * Check if this credential would create the same Gun user as normal approach
   */
  async verifyConsistency(
    credentialId: string,
    username: string,
    expectedUserPub?: string,
  ): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }> {
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
  getCredential(credentialId: string): WebAuthnSigningCredential | undefined {
    return this.credentials.get(credentialId);
  }

  /**
   * List all stored credentials
   */
  listCredentials(): WebAuthnSigningCredential[] {
    return Array.from(this.credentials.values());
  }

  /**
   * Remove a credential
   */
  removeCredential(credentialId: string): boolean {
    return this.credentials.delete(credentialId);
  }
}

export default WebAuthnSigner;
