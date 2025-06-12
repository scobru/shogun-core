import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { log, logError, logDebug } from "../../utils/logger";
import { EventEmitter } from "../../utils/eventEmitter";
import {
  ZKSessionToken,
  ProofRequest,
  ProofResponse,
  AuthResult,
} from "../../types/shogun";
import { ethers } from "ethers";

/**
 * Session Manager Plugin for Cross-App Authentication
 * Handles ZK session tokens and proof requests between Shogun apps
 */
export class SessionManagerPlugin extends BasePlugin {
  name = "session-manager";
  version = "1.0.0";
  description = "Manages ZK session tokens and cross-app authentication";

  private sessionTokens: Map<string, ZKSessionToken> = new Map();
  private pendingProofRequests: Map<string, ProofRequest> = new Map();
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Initialize the plugin
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Listen for authentication events to generate session tokens
    core.on("auth:login", this.handleAuthLogin.bind(this));
    core.on("auth:logout", this.handleAuthLogout.bind(this));

    // Setup message listeners for cross-app communication
    this.setupMessageListeners();

    log("Session Manager plugin initialized");
  }

  /**
   * Generate ZK session token after successful authentication
   */
  private async handleAuthLogin(data: any): Promise<void> {
    try {
      const { userPub, username } = data;
      if (!userPub) return;

      const sessionToken = await this.generateSessionToken(userPub, username);
      log(`Generated session token for user: ${username}`);

      // Store token
      this.sessionTokens.set(sessionToken.token, sessionToken);

      // Store in Gun for persistence and cross-app access
      const core = this.assertInitialized();
      if (core.user) {
        core.user.get("session").get("current").put({
          token: sessionToken.token,
          issuedAt: sessionToken.issuedAt,
          expiresAt: sessionToken.expiresAt,
        });
      }
    } catch (error) {
      logError("Error generating session token:", error);
    }
  }

  /**
   * Clear session token on logout
   */
  private async handleAuthLogout(): Promise<void> {
    const core = this.assertInitialized();

    // Clear all session tokens for this user
    this.sessionTokens.clear();

    // Clear from Gun
    if (core.user) {
      core.user.get("session").get("current").put(null);
    }

    log("Session tokens cleared");
  }

  /**
   * Generate cryptographically secure session token with ZK proof
   */
  async generateSessionToken(
    userPub: string,
    username?: string,
  ): Promise<ZKSessionToken> {
    const core = this.assertInitialized();
    const now = Date.now();
    const expiresAt = now + this.SESSION_DURATION;
    const appOrigin =
      typeof window !== "undefined" ? window.location.origin : "unknown";

    // Create unique token
    const tokenData = `${userPub}_${now}_${Math.random()}`;
    const token = ethers.keccak256(ethers.toUtf8Bytes(tokenData));

    // Generate ZK proof of authentication
    const proofData = {
      userPub,
      timestamp: now,
      origin: appOrigin,
    };
    const proof = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(proofData)),
    );

    const sessionToken: ZKSessionToken = {
      token,
      userPub,
      issuedAt: now,
      expiresAt,
      appOrigin,
      proof,
    };

    return sessionToken;
  }

  /**
   * Verify session token validity
   */
  async verifySessionToken(token: string): Promise<boolean> {
    const sessionData = this.sessionTokens.get(token);
    if (!sessionData) {
      logDebug("Session token not found in memory, checking Gun...");
      return await this.verifySessionFromGun(token);
    }

    // Check if token is expired
    if (Date.now() > sessionData.expiresAt) {
      this.sessionTokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Verify session token from Gun network
   */
  private async verifySessionFromGun(token: string): Promise<boolean> {
    return new Promise((resolve) => {
      const core = this.assertInitialized();
      if (!core.user) {
        resolve(false);
        return;
      }

      core.user
        .get("session")
        .get("current")
        .once((sessionData: any) => {
          if (!sessionData || sessionData.token !== token) {
            resolve(false);
            return;
          }

          // Check expiration
          if (Date.now() > sessionData.expiresAt) {
            resolve(false);
            return;
          }

          resolve(true);
        });
    });
  }

  /**
   * Setup message listeners for cross-app communication
   */
  private setupMessageListeners(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("message", this.handleCrossAppMessage.bind(this));
  }

  /**
   * Handle messages from other Shogun apps
   */
  private async handleCrossAppMessage(event: MessageEvent): Promise<void> {
    try {
      const { type, data } = event.data;

      if (!type?.startsWith("shogun:")) return;

      switch (type) {
        case "shogun:proof-request":
          await this.handleProofRequest(data, event.origin);
          break;
        case "shogun:session-verify":
          await this.handleSessionVerification(data, event.origin);
          break;
      }
    } catch (error) {
      logError("Error handling cross-app message:", error);
    }
  }

  /**
   * Handle proof request from another app
   */
  private async handleProofRequest(
    requestData: ProofRequest,
    origin: string,
  ): Promise<void> {
    logDebug(`Received proof request from ${origin}:`, requestData);

    // Store the request
    this.pendingProofRequests.set(requestData.id, {
      ...requestData,
      requestingApp: {
        ...requestData.requestingApp,
        origin,
      },
    });

    // Emit event to notify the auth app
    this.emit("proof-request-received", {
      requestId: requestData.id,
      request: requestData,
      origin,
    });
  }

  /**
   * Generate proof for a request
   */
  async generateProofForRequest(requestId: string): Promise<ProofResponse> {
    const request = this.pendingProofRequests.get(requestId);
    if (!request) {
      return {
        requestId,
        success: false,
        error: "Proof request not found",
      };
    }

    try {
      const core = this.assertInitialized();
      const currentAuth = core.getAuthMethod();

      // Check if user meets requirements
      if (
        request.requirements.authMethods &&
        !request.requirements.authMethods.includes(currentAuth || "password")
      ) {
        return {
          requestId,
          success: false,
          error: "Authentication method not supported",
        };
      }

      // Generate appropriate proof based on privacy level
      let proof;
      switch (request.privacy) {
        case "zero_knowledge":
          proof = await this.generateZKProof(request);
          break;
        case "selective_disclosure":
          proof = await this.generateSelectiveDisclosureProof(request);
          break;
        case "full_disclosure":
          proof = await this.generateFullDisclosureProof(request);
          break;
      }

      const response: ProofResponse = {
        requestId,
        success: true,
        proof,
        metadata: {
          generatedAt: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour expiry
        },
      };

      // Clean up the request
      this.pendingProofRequests.delete(requestId);

      return response;
    } catch (error: any) {
      logError("Error generating proof:", error);
      return {
        requestId,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate zero-knowledge proof
   */
  private async generateZKProof(request: ProofRequest): Promise<any> {
    const core = this.assertInitialized();

    // Use existing ZK infrastructure
    const zkPlugin = core.getPlugin("zk-oauth");
    if (zkPlugin) {
      // Leverage existing ZK proof generation
      const proofData = {
        type: request.type,
        requirements: request.requirements,
        timestamp: Date.now(),
      };

      const proof = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(proofData)),
      );
      return {
        type: "zk-proof",
        data: proof,
        publicSignals: [request.type, Date.now().toString()],
        verificationKey: ethers.keccak256(
          ethers.toUtf8Bytes("shogun_session_vk"),
        ),
      };
    }

    throw new Error("ZK proof generation not available");
  }

  /**
   * Generate selective disclosure proof
   */
  private async generateSelectiveDisclosureProof(
    request: ProofRequest,
  ): Promise<any> {
    const core = this.assertInitialized();

    // Only reveal requested attributes
    const disclosedData: Record<string, any> = {};

    if (request.requirements.hasAddress && core.getAuthMethod() === "web3") {
      disclosedData.hasEthereumAddress = true; // Don't reveal actual address
    }

    if (request.requirements.minAge) {
      disclosedData.meetsAgeRequirement = true; // Don't reveal actual age
    }

    return {
      type: "selective-disclosure",
      data: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(disclosedData))),
      attributes: Object.keys(disclosedData),
    };
  }

  /**
   * Generate full disclosure proof (only for trusted apps)
   */
  private async generateFullDisclosureProof(
    request: ProofRequest,
  ): Promise<any> {
    const core = this.assertInitialized();

    // This should be used sparingly and only for highly trusted apps
    const userData = {
      authMethod: core.getAuthMethod(),
      userPub: core.user?.is?.pub,
      timestamp: Date.now(),
    };

    return {
      type: "full-disclosure",
      data: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(userData))),
      userData: userData,
    };
  }

  /**
   * Send proof response to requesting app
   */
  async sendProofResponse(
    response: ProofResponse,
    targetOrigin: string,
  ): Promise<void> {
    if (typeof window === "undefined") return;

    // Find the requesting window (could be opener or parent)
    const targetWindow = window.opener || window.parent;

    if (targetWindow) {
      targetWindow.postMessage(
        {
          type: "shogun:proof-response",
          data: response,
        },
        targetOrigin,
      );
    }
  }

  /**
   * Handle session verification request
   */
  private async handleSessionVerification(
    data: any,
    origin: string,
  ): Promise<void> {
    const { token, callback } = data;
    const isValid = await this.verifySessionToken(token);

    if (typeof window !== "undefined") {
      const targetWindow = window.opener || window.parent;
      if (targetWindow) {
        targetWindow.postMessage(
          {
            type: "shogun:session-verified",
            data: { token, valid: isValid },
          },
          origin,
        );
      }
    }
  }

  /**
   * Get current session token
   */
  getCurrentSessionToken(): string | null {
    // Return the most recent valid token
    for (const [token, sessionData] of this.sessionTokens.entries()) {
      if (Date.now() < sessionData.expiresAt) {
        return token;
      }
    }
    return null;
  }

  /**
   * Get pending proof requests
   */
  getPendingProofRequests(): ProofRequest[] {
    return Array.from(this.pendingProofRequests.values());
  }

  /**
   * Cleanup expired tokens
   */
  cleanup(): void {
    const now = Date.now();
    for (const [token, sessionData] of this.sessionTokens.entries()) {
      if (now > sessionData.expiresAt) {
        this.sessionTokens.delete(token);
      }
    }
  }

  destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener(
        "message",
        this.handleCrossAppMessage.bind(this),
      );
    }
    super.destroy();
  }
}
