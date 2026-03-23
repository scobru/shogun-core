/**
 * Challenge-Response Authentication Plugin Types
 */
import { AuthResult } from '../../interfaces/shogun';
/**
 * Challenge data returned by the server
 */
export interface ChallengeData {
    /** Unique challenge identifier */
    challengeId: string;
    /** Random challenge string to sign */
    challenge: string;
    /** User's public key (from server lookup) */
    pub: string;
    /** Challenge expiration timestamp (ms) */
    expiresAt?: number;
}
/**
 * Configuration for the challenge plugin
 */
export interface ChallengeConfig {
    /** Base URL of the authentication server */
    serverUrl: string;
    /** Challenge request endpoint (default: /login-challenge) */
    challengeEndpoint?: string;
    /** Challenge verification endpoint (default: /login-verify) */
    verifyEndpoint?: string;
    /** Request timeout in ms (default: 10000) */
    timeout?: number;
}
/**
 * Challenge plugin public interface
 */
export interface ChallengePluginInterface {
    /** Request a challenge from the server */
    requestChallenge(serverUrl: string, username: string, password: string): Promise<ChallengeData>;
    /** Sign a challenge with the user's SEA key pair */
    signChallenge(challenge: string, pair: {
        pub: string;
        priv: string;
    }): Promise<string>;
    /** Verify a signed challenge against a public key (server-side helper) */
    verifyChallenge(signedChallenge: string, pubKey: string, expectedChallenge: string): Promise<boolean>;
    /** Full challenge-response login flow */
    login(serverUrl: string, username: string, password: string, pair: {
        pub: string;
        priv: string;
    }): Promise<AuthResult>;
}
