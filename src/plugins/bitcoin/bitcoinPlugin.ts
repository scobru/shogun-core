import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { BitcoinWallet } from "./bitcoinWallet";
import {
  BitcoinCredentials,
  ConnectionResult,
  BitcoinPluginInterface,
} from "./types";
import { log, logError, logWarn } from "../../utils/logger";
import { AuthResult } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";

/**
 * Plugin for managing Bitcoin wallet functionality in ShogunCore
 * Supports Alby, Nostr extensions, or direct key management
 */
export class BitcoinWalletPlugin
  extends BasePlugin
  implements BitcoinPluginInterface
{
  name = "bitcoin-wallet";
  version = "1.0.0";
  description =
    "Provides Bitcoin wallet connection and authentication for ShogunCore";

  private bitcoinWallet: BitcoinWallet | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Initialize the Bitcoin wallet module
    this.bitcoinWallet = new BitcoinWallet();

    log("Bitcoin wallet plugin initialized");
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (this.bitcoinWallet) {
      this.bitcoinWallet.cleanup();
    }
    this.bitcoinWallet = null;
    super.destroy();
    log("Bitcoin wallet plugin destroyed");
  }

  /**
   * Ensure that the Bitcoin wallet module is initialized
   * @private
   */
  private assertBitcoinWallet(): BitcoinWallet {
    this.assertInitialized();
    if (!this.bitcoinWallet) {
      throw new Error("Bitcoin wallet module not initialized");
    }
    return this.bitcoinWallet;
  }

  /**
   * @inheritdoc
   */
  isAvailable(): boolean {
    return this.assertBitcoinWallet().isAvailable();
  }

  /**
   * Check if Alby extension is available
   * Note: Alby is deprecated in favor of Nostr
   */
  isAlbyAvailable(): boolean {
    log("Alby is deprecated, using Nostr instead");
    return this.isNostrExtensionAvailable();
  }

  /**
   * Check if Nostr extension is available
   */
  isNostrExtensionAvailable(): boolean {
    return this.assertBitcoinWallet().isNostrExtensionAvailable();
  }

  /**
   * @inheritdoc
   */
  async connectWallet(
    type: "alby" | "nostr" | "manual" = "nostr",
  ): Promise<ConnectionResult> {
    // Prioritize nostr over alby (since they are functionally identical)
    // If type is alby, try to use nostr instead
    if (type === "alby") {
      log("Alby is deprecated, using Nostr instead");
      type = "nostr";
    }
    return this.assertBitcoinWallet().connectWallet(type);
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(address: string): Promise<BitcoinCredentials> {
    log("Calling credential generation for Bitcoin wallet");
    return this.assertBitcoinWallet().generateCredentials(address);
  }

  /**
   * @inheritdoc
   */
  cleanup(): void {
    this.assertBitcoinWallet().cleanup();
  }

  /**
   * @inheritdoc
   */
  async verifySignature(
    message: string,
    signature: string,
    address: string,
  ): Promise<boolean> {
    return this.assertBitcoinWallet().verifySignature(
      message,
      signature,
      address,
    );
  }

  /**
   * @inheritdoc
   */
  async generatePassword(signature: string): Promise<string> {
    return this.assertBitcoinWallet().generatePassword(signature);
  }

  /**
   * Login with Bitcoin wallet
   * @param address - Bitcoin address
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates the user using Bitcoin wallet credentials after signature verification
   */
  async login(address: string): Promise<AuthResult> {
    log("Login with Bitcoin wallet");

    try {
      const core = this.assertInitialized();
      log(`Bitcoin wallet login attempt for address: ${address}`);

      if (!address) {
        throw createError(
          ErrorType.VALIDATION,
          "ADDRESS_REQUIRED",
          "Bitcoin address required for login",
        );
      }

      if (!this.isAvailable()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "BITCOIN_WALLET_UNAVAILABLE",
          "No Bitcoin wallet available in the browser",
        );
      }

      log("Generating credentials for Bitcoin wallet login...");
      const credentials = await this.generateCredentials(address);
      if (
        !credentials?.username ||
        !credentials?.password ||
        !credentials.signature ||
        !credentials.message
      ) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "CREDENTIAL_GENERATION_FAILED",
          "Bitcoin wallet credentials not generated correctly or signature missing",
        );
      }

      log(
        `Credentials generated successfully. Username: ${credentials.username}`,
      );

      log("Verifying Bitcoin wallet signature...");
      const isValid = await this.verifySignature(
        credentials.message,
        credentials.signature,
        address,
      );

      if (!isValid) {
        logError(`Signature verification failed for address: ${address}`);
        throw createError(
          ErrorType.SECURITY,
          "SIGNATURE_VERIFICATION_FAILED",
          "Bitcoin wallet signature verification failed",
        );
      }
      log("Bitcoin wallet signature verified successfully.");

      // For Bitcoin wallet authentication, we'll use a direct approach rather than using createUserWithGunDB
      log("Attempting direct auth with GunDB for Bitcoin wallet account...");

      // Try to authenticate directly first
      try {
        const gun = core.gun;
        let authSuccess = false;

        await new Promise<void>((resolve) => {
          // Clear any previous auth state
          try {
            if (gun.user && gun.user()._ && (gun.user()._ as any).sea) {
              (gun.user()._ as any).sea = null;
            }
          } catch (e) {
            // Ignore reset errors
          }

          // Try direct authentication
          gun
            .user()
            .auth(credentials.username, credentials.password, (ack: any) => {
              if (ack.err) {
                log(
                  `Direct auth failed: ${ack.err}, will try creating user first`,
                );
                resolve();
              } else {
                authSuccess = true;
                log("Direct auth successful");
                resolve();
              }
            });
        });

        // If direct auth succeeded, we're done
        if (authSuccess) {
          const userPub = core.gun.user().is?.pub || "";

          // Emit login event
          core.emit("auth:login", {
            userPub: userPub,
            username: credentials.username,
            method: "bitcoin",
          });

          return {
            success: true,
            userPub: userPub,
            username: credentials.username,
          };
        }

        // If direct auth failed, try to create the user first
        log("Creating Bitcoin wallet user account...");
        let createSuccess = false;
        let createError = "";

        await new Promise<void>((resolve) => {
          core.gun
            .user()
            .create(credentials.username, credentials.password, (ack: any) => {
              if (ack.err) {
                createError = ack.err;
                log(`User creation failed: ${ack.err}`);
                // Don't immediately consider this a failure - the user might already exist
                if (ack.err === "User already created!") {
                  log(
                    "User already exists, will try different authentication approach",
                  );
                  createSuccess = false;
                } else {
                  createSuccess = false;
                }
              } else {
                createSuccess = true;
                log("User created successfully");
              }
              resolve();
            });
        });

        // Special handling for "User already created!" error
        // This is a common case that we should try to handle gracefully
        if (!createSuccess && createError === "User already created!") {
          log(
            "User exists but authentication failed. Trying alternative approach...",
          );

          // Try one more time with a forced reset
          authSuccess = false;
          await new Promise<void>((resolveRetry) => {
            // More aggressive state reset
            try {
              const gunUser = core.gun.user();
              if (gunUser) {
                // Force a leave/recall cycle
                gunUser.leave();
                setTimeout(() => {
                  // Try authentication again after a short delay
                  core.gun
                    .user()
                    .auth(
                      credentials.username,
                      credentials.password,
                      (retryAck: any) => {
                        if (retryAck.err) {
                          log(`Retry auth failed: ${retryAck.err}`);
                          resolveRetry();
                        } else {
                          authSuccess = true;
                          log("Retry auth successful");
                          resolveRetry();
                        }
                      },
                    );
                }, 100);
              } else {
                resolveRetry();
              }
            } catch (e) {
              log(`Error during retry setup: ${e}`);
              resolveRetry();
            }
          });

          if (authSuccess) {
            const userPub = core.gun.user().is?.pub || "";

            // Emit login event
            core.emit("auth:login", {
              userPub: userPub,
              username: credentials.username,
              method: "bitcoin",
            });

            return {
              success: true,
              userPub: userPub,
              username: credentials.username,
            };
          }

          // If we still can't authenticate, try a last resort approach
          log("Authentication still failing. Using emergency fallback...");
          try {
            // Generate slightly modified credentials as a last resort
            // This adds a small random suffix to the password
            const emergencyPassword = `${credentials.password}_${Date.now() % 1000}`;

            let emergencyCreateSuccess = false;
            await new Promise<void>((resolveEmergency) => {
              core.gun
                .user()
                .create(
                  credentials.username,
                  emergencyPassword,
                  (emergencyAck: any) => {
                    if (!emergencyAck.err) {
                      emergencyCreateSuccess = true;
                      log("Emergency user creation successful");
                    } else {
                      log(
                        `Emergency user creation failed: ${emergencyAck.err}`,
                      );
                    }
                    resolveEmergency();
                  },
                );
            });

            if (emergencyCreateSuccess) {
              // Try to authenticate with the emergency credentials
              let emergencyAuthSuccess = false;
              await new Promise<void>((resolveEmergencyAuth) => {
                core.gun
                  .user()
                  .auth(
                    credentials.username,
                    emergencyPassword,
                    (emergencyAuthAck: any) => {
                      if (!emergencyAuthAck.err) {
                        emergencyAuthSuccess = true;
                        log("Emergency authentication successful");
                      } else {
                        log(
                          `Emergency authentication failed: ${emergencyAuthAck.err}`,
                        );
                      }
                      resolveEmergencyAuth();
                    },
                  );
              });

              if (emergencyAuthSuccess) {
                const userPub = core.gun.user().is?.pub || "";

                // Emit login event
                core.emit("auth:login", {
                  userPub: userPub,
                  username: credentials.username,
                  method: "bitcoin",
                });

                return {
                  success: true,
                  userPub: userPub,
                  username: credentials.username,
                };
              }
            }
          } catch (emergencyError) {
            log(`Emergency fallback failed: ${emergencyError}`);
          }

          // If all else fails, throw a more descriptive error
          throw new Error(
            "User account exists but authentication failed. Try using a different wallet type or address.",
          );
        }

        if (!createSuccess) {
          throw new Error("Failed to create user account");
        }

        // Now try to authenticate again
        authSuccess = false;
        await new Promise<void>((resolve) => {
          core.gun
            .user()
            .auth(credentials.username, credentials.password, (ack: any) => {
              if (ack.err) {
                log(`Auth after creation failed: ${ack.err}`);
              } else {
                authSuccess = true;
                log("Auth after creation successful");
              }
              resolve();
            });
        });

        if (!authSuccess) {
          throw new Error("Failed to authenticate after user creation");
        }

        const userPub = core.gun.user().is?.pub || "";

        // Emit login event
        core.emit("auth:login", {
          userPub: userPub,
          username: credentials.username,
          method: "bitcoin",
        });

        return {
          success: true,
          userPub: userPub,
          username: credentials.username,
        };
      } catch (error: any) {
        logError("Error during Bitcoin wallet authentication:", error);
        throw error;
      }
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "BITCOIN_LOGIN_FAILED",
        error.message ?? "Unknown error during Bitcoin wallet login",
        error,
      );

      return {
        success: false,
        error: error.message ?? "Unknown error during Bitcoin wallet login",
      };
    }
  }

  /**
   * Register a new user with Bitcoin wallet
   * @param address - Bitcoin address
   * @returns {Promise<AuthResult>} Registration result
   * @description Creates a new user account with Bitcoin wallet credentials
   */
  async signUp(address: string): Promise<AuthResult> {
    log("Sign up with Bitcoin wallet");

    try {
      const core = this.assertInitialized();
      log(`Bitcoin wallet signup attempt for address: ${address}`);

      if (!address) {
        throw createError(
          ErrorType.VALIDATION,
          "ADDRESS_REQUIRED",
          "Bitcoin address required for signup",
        );
      }

      if (!this.isAvailable()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "BITCOIN_WALLET_UNAVAILABLE",
          "No Bitcoin wallet available in the browser",
        );
      }

      // Generate credentials similar to login
      log("Generating credentials for Bitcoin wallet signup...");
      const credentials = await this.generateCredentials(address);
      if (
        !credentials?.username ||
        !credentials?.password ||
        !credentials.signature ||
        !credentials.message
      ) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "CREDENTIAL_GENERATION_FAILED",
          "Bitcoin wallet credentials not generated correctly or signature missing",
        );
      }

      log(
        `Credentials generated successfully. Username: ${credentials.username}`,
      );

      // Verify signature
      log("Verifying Bitcoin wallet signature...");
      const isValid = await this.verifySignature(
        credentials.message,
        credentials.signature,
        address,
      );

      if (!isValid) {
        logError(`Signature verification failed for address: ${address}`);
        throw createError(
          ErrorType.SECURITY,
          "SIGNATURE_VERIFICATION_FAILED",
          "Bitcoin wallet signature verification failed",
        );
      }
      log("Bitcoin wallet signature verified successfully.");

      // For Bitcoin wallet registration, try to create user directly
      log("Creating Bitcoin wallet user account...");
      let createSuccess = false;
      let userCreationError = "";

      await new Promise<void>((resolve) => {
        core.gun
          .user()
          .create(credentials.username, credentials.password, (ack: any) => {
            if (ack.err) {
              userCreationError = ack.err;
              log(`User creation failed: ${ack.err}`);
              createSuccess = false;
            } else {
              createSuccess = true;
              log("User created successfully");
            }
            resolve();
          });
      });

      // If user already exists, we'll try to authenticate anyway
      // This handles cases where the user was previously created
      if (!createSuccess && userCreationError === "User already created!") {
        log("User already exists, trying to authenticate...");
      } else if (!createSuccess) {
        throw new Error(`User creation failed: ${userCreationError}`);
      }

      // Now authenticate with the credentials
      let authSuccess = false;
      await new Promise<void>((resolve) => {
        core.gun
          .user()
          .auth(credentials.username, credentials.password, (ack: any) => {
            if (ack.err) {
              log(`Auth failed: ${ack.err}`);
            } else {
              authSuccess = true;
              log("Auth successful");
            }
            resolve();
          });
      });

      if (!authSuccess) {
        // If authentication failed but user exists, try the same recovery flow as in login
        if (userCreationError === "User already created!") {
          log(
            "Authentication failed for existing user. Trying alternative approach...",
          );

          // Try with a forced reset
          await new Promise<void>((resolveRetry) => {
            try {
              const gunUser = core.gun.user();
              if (gunUser) {
                // Force a leave/recall cycle
                gunUser.leave();
                setTimeout(() => {
                  // Try authentication again after a short delay
                  core.gun
                    .user()
                    .auth(
                      credentials.username,
                      credentials.password,
                      (retryAck: any) => {
                        if (retryAck.err) {
                          log(`Retry auth failed: ${retryAck.err}`);
                          resolveRetry();
                        } else {
                          authSuccess = true;
                          log("Retry auth successful");
                          resolveRetry();
                        }
                      },
                    );
                }, 100);
              } else {
                resolveRetry();
              }
            } catch (e) {
              log(`Error during retry setup: ${e}`);
              resolveRetry();
            }
          });

          if (authSuccess) {
            const userPub = core.gun.user().is?.pub || "";

            // Emit signup/login event
            core.emit("auth:signup", {
              userPub: userPub,
              username: credentials.username,
              method: "bitcoin",
            });
            core.emit("auth:login", {
              userPub: userPub,
              username: credentials.username,
              method: "bitcoin",
            });

            return {
              success: true,
              userPub: userPub,
              username: credentials.username,
            };
          }
        }

        throw new Error("Failed to authenticate after user creation");
      }

      const userPub = core.gun.user().is?.pub || "";

      // Emit events
      core.emit("auth:signup", {
        userPub: userPub,
        username: credentials.username,
        method: "bitcoin",
      });
      core.emit("auth:login", {
        userPub: userPub,
        username: credentials.username,
        method: "bitcoin",
      });

      return {
        success: true,
        userPub: userPub,
        username: credentials.username,
      };
    } catch (error: any) {
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "BITCOIN_SIGNUP_FAILED",
        error.message ?? "Unknown error during Bitcoin wallet signup",
        error,
      );

      return {
        success: false,
        error: error.message ?? "Unknown error during Bitcoin wallet signup",
      };
    }
  }

  /**
   * Convenience method that matches the interface pattern
   */
  async loginWithBitcoinWallet(address: string): Promise<AuthResult> {
    return this.login(address);
  }

  /**
   * Convenience method that matches the interface pattern
   */
  async signUpWithBitcoinWallet(address: string): Promise<AuthResult> {
    return this.signUp(address);
  }
}
