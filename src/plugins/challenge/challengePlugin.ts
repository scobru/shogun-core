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
import type {
  ChallengeData,
  ChallengeConfig,
  ChallengePluginInterface,
} from './types';

export class ChallengePlugin
  extends BasePlugin
  implements ChallengePluginInterface
{
  name = 'challenge';
  version = '1.0.0';
  description = 'Challenge-response authentication using Gun SEA signatures';
  _category = PluginCategory.Authentication;

  private config: ChallengeConfig = {
    serverUrl: '',
    challengeEndpoint: '/login-challenge',
    verifyEndpoint: '/login-verify',
    timeout: 10000,
  };

  /**
   * Configure the challenge plugin
   * @param config - Challenge configuration
   */
  configure(config: Partial<ChallengeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get SEA safely from various sources
   */
  private getSEA(): any {
    const core = this.core;
    if (core) {
      const sea = (core as any).db?.sea;
      if (sea) return sea;
    }
    if ((globalThis as any).Gun?.SEA) return (globalThis as any).Gun.SEA;
    if ((globalThis as any).SEA) return (globalThis as any).SEA;
    return null;
  }

  /**
   * Request an authentication challenge from the server.
   *
   * @param serverUrl - Base URL of the auth server
   * @param username - Username to authenticate as
   * @param password - Password for initial server-side verification
   * @returns Promise resolving to ChallengeData
   * @throws Error if server rejects the request
   */
  async requestChallenge(
    serverUrl: string,
    username: string,
    password: string,
  ): Promise<ChallengeData> {
    const endpoint = this.config.challengeEndpoint || '/login-challenge';
    const url = `${serverUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout || 10000,
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: 'Request failed' }));
        throw new Error(
          err.error || `Challenge request failed: ${response.status}`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Challenge request rejected by server');
      }

      return {
        challengeId: result.challengeId,
        challenge: result.challenge,
        pub: result.pub,
        expiresAt: result.expiresAt,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Challenge request timed out');
      }
      throw error;
    }
  }

  /**
   * Sign a challenge string with the user's SEA private key.
   * The private key NEVER leaves the client.
   *
   * @param challenge - The challenge string to sign
   * @param pair - The user's key pair (pub + priv)
   * @returns Promise resolving to the signed challenge string
   */
  async signChallenge(
    challenge: string,
    pair: { pub: string; priv: string },
  ): Promise<string> {
    const sea = this.getSEA();
    if (!sea || !sea.sign) {
      throw new Error('SEA not available for challenge signing');
    }

    const signed = await sea.sign(challenge, pair);
    if (!signed) {
      throw new Error('Failed to sign challenge');
    }

    return signed;
  }

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
  async verifyChallenge(
    signedChallenge: string,
    pubKey: string,
    expectedChallenge: string,
  ): Promise<boolean> {
    const sea = this.getSEA();
    if (!sea || !sea.verify) {
      throw new Error('SEA not available for challenge verification');
    }

    const verified = await sea.verify(signedChallenge, pubKey);
    return verified === expectedChallenge;
  }

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
  async login(
    serverUrl: string,
    username: string,
    password: string,
    pair: { pub: string; priv: string },
  ): Promise<AuthResult> {
    try {
      // Step 1: Request challenge
      const challengeData = await this.requestChallenge(
        serverUrl,
        username,
        password,
      );

      // Step 2: Sign challenge locally
      const signedChallenge = await this.signChallenge(
        challengeData.challenge,
        pair,
      );

      // Step 3: Send signed challenge for verification
      const verifyEndpoint = this.config.verifyEndpoint || '/login-verify';
      const url = `${serverUrl}${verifyEndpoint}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout || 10000,
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challengeData.challengeId,
          signedChallenge,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Challenge verification failed',
        };
      }

      // Step 4: Return auth result with token
      const authResult: AuthResult = {
        success: true,
        userPub: result.pub,
        username: result.username || username,
        sessionToken: result.token,
        authMethod: 'challenge' as any,
      };

      // Emit login event if core is available
      if (this.core) {
        this.core.emit('auth:login', {
          userPub: result.pub,
          method: 'password' as const,
          username: result.username || username,
        });
      }

      return authResult;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Challenge-response login failed',
      };
    }
  }
}
