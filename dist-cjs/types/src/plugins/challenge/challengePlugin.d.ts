/**
 * Challenge-Response Authentication Plugin
 *
 * Implements a secure two-step authentication flow where the private key
 * never leaves the client. Flow:
 *
 * 1. Client requests a challenge from the server (sends username + password)
 * 2. Server verifies password, returns a random challenge string
 * 3. Client signs the challenge with its SEA private key
 * 4. Server verifies the signature using the stored public key
 * 5. Server issues a JWT token on success
 *
 * Based on the challenge-response pattern from GunAuth.
 */
import { BasePlugin } from '../base';
import { PluginCategory } from '../../interfaces/shogun';
import type { AuthResult } from '../../interfaces/shogun';
import type { ChallengeData, ChallengeConfig, ChallengePluginInterface } from './types';
export declare class ChallengePlugin extends BasePlugin implements ChallengePluginInterface {
    name: string;
    version: string;
    description: string;
    _category: PluginCategory;
    private config;
    /**
     * Configure the challenge plugin
     * @param config - Challenge configuration
     */
    configure(config: Partial<ChallengeConfig>): void;
    /**
     * Get SEA safely from various sources
     */
    private getSEA;
    /**
     * Request an authentication challenge from the server.
     *
     * @param serverUrl - Base URL of the auth server
     * @param username - Username to authenticate as
     * @param password - Password for initial server-side verification
     * @returns Promise resolving to ChallengeData
     * @throws Error if server rejects the request
     */
    requestChallenge(serverUrl: string, username: string, password: string): Promise<ChallengeData>;
    /**
     * Sign a challenge string with the user's SEA private key.
     * The private key NEVER leaves the client.
     *
     * @param challenge - The challenge string to sign
     * @param pair - The user's key pair (pub + priv)
     * @returns Promise resolving to the signed challenge string
     */
    signChallenge(challenge: string, pair: {
        pub: string;
        priv: string;
    }): Promise<string>;
    /**
     * Verify a signed challenge against a public key.
     * This is a helper that can be used server-side or for
     * local verification in peer-to-peer scenarios.
     *
     * @param signedChallenge - The signed challenge data
     * @param pubKey - The signer's public key
     * @param expectedChallenge - The original challenge string
     * @returns Promise resolving to true if valid
     */
    verifyChallenge(signedChallenge: string, pubKey: string, expectedChallenge: string): Promise<boolean>;
    /**
     * Execute the full challenge-response login flow.
     *
     * 1. Request challenge from server
     * 2. Sign challenge locally with private key
     * 3. Send signature to server for verification
     * 4. Receive auth token on success
     *
     * @param serverUrl - Base URL of the auth server
     * @param username - Username to authenticate as
     * @param password - Password for initial verification
     * @param pair - The user's key pair
     * @returns Promise with authentication result
     */
    login(serverUrl: string, username: string, password: string, pair: {
        pub: string;
        priv: string;
    }): Promise<AuthResult>;
}
