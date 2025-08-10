/**
 * Constants for WebAuthn configuration
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 64;
import { ethers } from "ethers";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";
import { EventEmitter } from "../../utils/eventEmitter";
import { DeviceInfo, WebAuthnCredentials, CredentialResult, WebAuthnConfig, WebAuthnEventType, WebAuthnOperationOptions, WebAuthnCredentialData, WebAuthnVerificationResult } from "./types";
import { IGunInstance } from "gun";
import derive from "../../gundb/derive";

/**
 * Extends Window interface to include WebauthnAuth
 */
declare global {
  interface Window {
    Webauthn?: typeof Webauthn;
  }
}

/**
 * Extends NodeJS Global interface to include WebauthnAuth
 */
declare global {
  namespace NodeJS {
    interface Global {
      Webauthn?: typeof Webauthn;
    }
  }
}

/**
 * Constants for WebAuthn configuration
 */
const DEFAULT_CONFIG: WebAuthnConfig = stryMutAct_9fa48("5440") ? {} : (stryCov_9fa48("5440"), {
  rpName: stryMutAct_9fa48("5441") ? "" : (stryCov_9fa48("5441"), "Shogun Wallet"),
  timeout: 60000,
  userVerification: stryMutAct_9fa48("5442") ? "" : (stryCov_9fa48("5442"), "preferred"),
  attestation: stryMutAct_9fa48("5443") ? "" : (stryCov_9fa48("5443"), "none"),
  authenticatorAttachment: stryMutAct_9fa48("5444") ? "" : (stryCov_9fa48("5444"), "platform"),
  requireResidentKey: stryMutAct_9fa48("5445") ? true : (stryCov_9fa48("5445"), false)
});

/**
 * Main WebAuthn class for authentication management
 */
export class Webauthn extends EventEmitter {
  private readonly config: WebAuthnConfig;
  private readonly gunInstance?: IGunInstance;
  private credential: WebAuthnCredentialData | null;
  private abortController: AbortController | null = null;

  /**
   * Creates a new WebAuthn instance
   */
  constructor(gunInstance?: IGunInstance, config?: Partial<WebAuthnConfig>) {
    super();
    this.gunInstance = gunInstance;
    this.credential = null;

    // Merge default config with provided config
    this.config = stryMutAct_9fa48("5446") ? {} : (stryCov_9fa48("5446"), {
      ...DEFAULT_CONFIG,
      ...config,
      rpId: stryMutAct_9fa48("5447") ? config?.rpId && (typeof window !== "undefined" ? window.location.hostname.split(":")[0] : "localhost") : (stryCov_9fa48("5447"), (stryMutAct_9fa48("5448") ? config.rpId : (stryCov_9fa48("5448"), config?.rpId)) ?? ((stryMutAct_9fa48("5451") ? typeof window === "undefined" : stryMutAct_9fa48("5450") ? false : stryMutAct_9fa48("5449") ? true : (stryCov_9fa48("5449", "5450", "5451"), typeof window !== (stryMutAct_9fa48("5452") ? "" : (stryCov_9fa48("5452"), "undefined")))) ? window.location.hostname.split(stryMutAct_9fa48("5453") ? "" : (stryCov_9fa48("5453"), ":"))[0] : stryMutAct_9fa48("5454") ? "" : (stryCov_9fa48("5454"), "localhost")))
    });
  }

  /**
   * Validates a username
   */
  validateUsername(username: string): void {
    if (stryMutAct_9fa48("5455")) {
      {}
    } else {
      stryCov_9fa48("5455");
      if (stryMutAct_9fa48("5458") ? !username && typeof username !== "string" : stryMutAct_9fa48("5457") ? false : stryMutAct_9fa48("5456") ? true : (stryCov_9fa48("5456", "5457", "5458"), (stryMutAct_9fa48("5459") ? username : (stryCov_9fa48("5459"), !username)) || (stryMutAct_9fa48("5461") ? typeof username === "string" : stryMutAct_9fa48("5460") ? false : (stryCov_9fa48("5460", "5461"), typeof username !== (stryMutAct_9fa48("5462") ? "" : (stryCov_9fa48("5462"), "string")))))) {
        if (stryMutAct_9fa48("5463")) {
          {}
        } else {
          stryCov_9fa48("5463");
          throw new Error(stryMutAct_9fa48("5464") ? "" : (stryCov_9fa48("5464"), "Username must be a non-empty string"));
        }
      }
      if (stryMutAct_9fa48("5467") ? username.length < MIN_USERNAME_LENGTH && username.length > MAX_USERNAME_LENGTH : stryMutAct_9fa48("5466") ? false : stryMutAct_9fa48("5465") ? true : (stryCov_9fa48("5465", "5466", "5467"), (stryMutAct_9fa48("5470") ? username.length >= MIN_USERNAME_LENGTH : stryMutAct_9fa48("5469") ? username.length <= MIN_USERNAME_LENGTH : stryMutAct_9fa48("5468") ? false : (stryCov_9fa48("5468", "5469", "5470"), username.length < MIN_USERNAME_LENGTH)) || (stryMutAct_9fa48("5473") ? username.length <= MAX_USERNAME_LENGTH : stryMutAct_9fa48("5472") ? username.length >= MAX_USERNAME_LENGTH : stryMutAct_9fa48("5471") ? false : (stryCov_9fa48("5471", "5472", "5473"), username.length > MAX_USERNAME_LENGTH)))) {
        if (stryMutAct_9fa48("5474")) {
          {}
        } else {
          stryCov_9fa48("5474");
          throw new Error(stryMutAct_9fa48("5475") ? `` : (stryCov_9fa48("5475"), `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`));
        }
      }
      if (stryMutAct_9fa48("5478") ? false : stryMutAct_9fa48("5477") ? true : stryMutAct_9fa48("5476") ? /^[a-zA-Z0-9_-]+$/.test(username) : (stryCov_9fa48("5476", "5477", "5478"), !(stryMutAct_9fa48("5482") ? /^[^a-zA-Z0-9_-]+$/ : stryMutAct_9fa48("5481") ? /^[a-zA-Z0-9_-]$/ : stryMutAct_9fa48("5480") ? /^[a-zA-Z0-9_-]+/ : stryMutAct_9fa48("5479") ? /[a-zA-Z0-9_-]+$/ : (stryCov_9fa48("5479", "5480", "5481", "5482"), /^[a-zA-Z0-9_-]+$/)).test(username))) {
        if (stryMutAct_9fa48("5483")) {
          {}
        } else {
          stryCov_9fa48("5483");
          throw new Error(stryMutAct_9fa48("5484") ? "" : (stryCov_9fa48("5484"), "Username can only contain letters, numbers, underscores and hyphens"));
        }
      }
    }
  }

  /**
   * Creates a new WebAuthn account with retry logic
   */
  async createAccount(username: string, credentials: WebAuthnCredentials | null, isNewDevice = stryMutAct_9fa48("5485") ? true : (stryCov_9fa48("5485"), false)): Promise<CredentialResult> {
    if (stryMutAct_9fa48("5486")) {
      {}
    } else {
      stryCov_9fa48("5486");
      try {
        if (stryMutAct_9fa48("5487")) {
          {}
        } else {
          stryCov_9fa48("5487");
          this.validateUsername(username);
          const maxRetries = 3;
          let lastError: Error | null = null;
          for (let attempt = 1; stryMutAct_9fa48("5490") ? attempt > maxRetries : stryMutAct_9fa48("5489") ? attempt < maxRetries : stryMutAct_9fa48("5488") ? false : (stryCov_9fa48("5488", "5489", "5490"), attempt <= maxRetries); stryMutAct_9fa48("5491") ? attempt-- : (stryCov_9fa48("5491"), attempt++)) {
            if (stryMutAct_9fa48("5492")) {
              {}
            } else {
              stryCov_9fa48("5492");
              try {
                if (stryMutAct_9fa48("5493")) {
                  {}
                } else {
                  stryCov_9fa48("5493");
                  const result = await this.generateCredentials(username, credentials, isNewDevice);
                  if (stryMutAct_9fa48("5495") ? false : stryMutAct_9fa48("5494") ? true : (stryCov_9fa48("5494", "5495"), result.success)) {
                    if (stryMutAct_9fa48("5496")) {
                      {}
                    } else {
                      stryCov_9fa48("5496");
                      this.emit(WebAuthnEventType.DEVICE_REGISTERED, stryMutAct_9fa48("5497") ? {} : (stryCov_9fa48("5497"), {
                        type: WebAuthnEventType.DEVICE_REGISTERED,
                        data: stryMutAct_9fa48("5498") ? {} : (stryCov_9fa48("5498"), {
                          username
                        }),
                        timestamp: Date.now()
                      }));
                      return result;
                    }
                  }
                  lastError = new Error(stryMutAct_9fa48("5499") ? result.error && "Unknown error" : (stryCov_9fa48("5499"), result.error ?? (stryMutAct_9fa48("5500") ? "" : (stryCov_9fa48("5500"), "Unknown error"))));
                }
              } catch (error: any) {
                if (stryMutAct_9fa48("5501")) {
                  {}
                } else {
                  stryCov_9fa48("5501");
                  lastError = error;
                  if (stryMutAct_9fa48("5505") ? attempt >= maxRetries : stryMutAct_9fa48("5504") ? attempt <= maxRetries : stryMutAct_9fa48("5503") ? false : stryMutAct_9fa48("5502") ? true : (stryCov_9fa48("5502", "5503", "5504", "5505"), attempt < maxRetries)) {
                    if (stryMutAct_9fa48("5506")) {
                      {}
                    } else {
                      stryCov_9fa48("5506");
                      await new Promise(stryMutAct_9fa48("5507") ? () => undefined : (stryCov_9fa48("5507"), resolve => setTimeout(resolve, stryMutAct_9fa48("5508") ? 1000 / attempt : (stryCov_9fa48("5508"), 1000 * attempt))));
                      continue;
                    }
                  }
                }
              }
            }
          }
          throw stryMutAct_9fa48("5511") ? lastError && new Error("Failed to create account after retries") : stryMutAct_9fa48("5510") ? false : stryMutAct_9fa48("5509") ? true : (stryCov_9fa48("5509", "5510", "5511"), lastError || new Error(stryMutAct_9fa48("5512") ? "" : (stryCov_9fa48("5512"), "Failed to create account after retries")));
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5513")) {
          {}
        } else {
          stryCov_9fa48("5513");
          this.emit(WebAuthnEventType.ERROR, stryMutAct_9fa48("5514") ? {} : (stryCov_9fa48("5514"), {
            type: WebAuthnEventType.ERROR,
            data: stryMutAct_9fa48("5515") ? {} : (stryCov_9fa48("5515"), {
              error: error.message
            }),
            timestamp: Date.now()
          }));
          throw error;
        }
      }
    }
  }

  /**
   * Authenticates a user with timeout and abort handling
   */
  async authenticateUser(username: string, salt: string | null, options: WebAuthnOperationOptions = {}): Promise<CredentialResult> {
    if (stryMutAct_9fa48("5516")) {
      {}
    } else {
      stryCov_9fa48("5516");
      try {
        if (stryMutAct_9fa48("5517")) {
          {}
        } else {
          stryCov_9fa48("5517");
          this.validateUsername(username);
          if (stryMutAct_9fa48("5520") ? false : stryMutAct_9fa48("5519") ? true : stryMutAct_9fa48("5518") ? salt : (stryCov_9fa48("5518", "5519", "5520"), !salt)) {
            if (stryMutAct_9fa48("5521")) {
              {}
            } else {
              stryCov_9fa48("5521");
              const error = new Error(stryMutAct_9fa48("5522") ? "" : (stryCov_9fa48("5522"), "No WebAuthn credentials found for this username"));
              ErrorHandler.handle(ErrorType.WEBAUTHN, stryMutAct_9fa48("5523") ? "" : (stryCov_9fa48("5523"), "NO_CREDENTIALS"), error.message, error);
              return stryMutAct_9fa48("5524") ? {} : (stryCov_9fa48("5524"), {
                success: stryMutAct_9fa48("5525") ? true : (stryCov_9fa48("5525"), false),
                error: error.message
              });
            }
          }

          // Cancel any existing authentication attempt
          this.abortAuthentication();

          // Create new abort controller
          this.abortController = new AbortController();
          const timeout = stryMutAct_9fa48("5528") ? options.timeout && this.config.timeout : stryMutAct_9fa48("5527") ? false : stryMutAct_9fa48("5526") ? true : (stryCov_9fa48("5526", "5527", "5528"), options.timeout || this.config.timeout);
          const timeoutId = setTimeout(stryMutAct_9fa48("5529") ? () => undefined : (stryCov_9fa48("5529"), () => stryMutAct_9fa48("5530") ? this.abortController.abort() : (stryCov_9fa48("5530"), this.abortController?.abort())), timeout);
          try {
            if (stryMutAct_9fa48("5531")) {
              {}
            } else {
              stryCov_9fa48("5531");
              const challenge = this.generateChallenge(username);
              const assertionOptions: PublicKeyCredentialRequestOptions = stryMutAct_9fa48("5532") ? {} : (stryCov_9fa48("5532"), {
                challenge,
                allowCredentials: stryMutAct_9fa48("5533") ? ["Stryker was here"] : (stryCov_9fa48("5533"), []),
                timeout,
                userVerification: stryMutAct_9fa48("5536") ? options.userVerification && this.config.userVerification : stryMutAct_9fa48("5535") ? false : stryMutAct_9fa48("5534") ? true : (stryCov_9fa48("5534", "5535", "5536"), options.userVerification || this.config.userVerification),
                rpId: this.config.rpId
              });
              const assertion = (await navigator.credentials.get({
                publicKey: assertionOptions,
                signal: this.abortController.signal
              })) as PublicKeyCredential;
              if (stryMutAct_9fa48("5539") ? false : stryMutAct_9fa48("5538") ? true : stryMutAct_9fa48("5537") ? assertion : (stryCov_9fa48("5537", "5538", "5539"), !assertion)) {
                if (stryMutAct_9fa48("5540")) {
                  {}
                } else {
                  stryCov_9fa48("5540");
                  throw new Error(stryMutAct_9fa48("5541") ? "" : (stryCov_9fa48("5541"), "WebAuthn verification failed"));
                }
              }
              const {
                password
              } = this.generateCredentialsFromSalt(username, salt);
              const deviceInfo = this.getDeviceInfo(assertion.id);
              const result: CredentialResult = stryMutAct_9fa48("5542") ? {} : (stryCov_9fa48("5542"), {
                success: stryMutAct_9fa48("5543") ? false : (stryCov_9fa48("5543"), true),
                username,
                password,
                credentialId: this.bufferToBase64(assertion.rawId),
                deviceInfo
              });
              this.emit(WebAuthnEventType.AUTHENTICATION_SUCCESS, stryMutAct_9fa48("5544") ? {} : (stryCov_9fa48("5544"), {
                type: WebAuthnEventType.AUTHENTICATION_SUCCESS,
                data: stryMutAct_9fa48("5545") ? {} : (stryCov_9fa48("5545"), {
                  username,
                  deviceInfo
                }),
                timestamp: Date.now()
              }));
              return result;
            }
          } finally {
            if (stryMutAct_9fa48("5546")) {
              {}
            } else {
              stryCov_9fa48("5546");
              clearTimeout(timeoutId);
              this.abortController = null;
            }
          }
        }
      } catch (error: unknown) {
        if (stryMutAct_9fa48("5547")) {
          {}
        } else {
          stryCov_9fa48("5547");
          const errorMessage = error instanceof Error ? error.message : stryMutAct_9fa48("5548") ? "" : (stryCov_9fa48("5548"), "Unknown WebAuthn error");
          this.emit(WebAuthnEventType.AUTHENTICATION_FAILED, stryMutAct_9fa48("5549") ? {} : (stryCov_9fa48("5549"), {
            type: WebAuthnEventType.AUTHENTICATION_FAILED,
            data: stryMutAct_9fa48("5550") ? {} : (stryCov_9fa48("5550"), {
              username,
              error: errorMessage
            }),
            timestamp: Date.now()
          }));
          ErrorHandler.handle(ErrorType.WEBAUTHN, stryMutAct_9fa48("5551") ? "" : (stryCov_9fa48("5551"), "AUTH_ERROR"), errorMessage, error);
          return stryMutAct_9fa48("5552") ? {} : (stryCov_9fa48("5552"), {
            success: stryMutAct_9fa48("5553") ? true : (stryCov_9fa48("5553"), false),
            error: errorMessage
          });
        }
      }
    }
  }

  /**
   * Aborts current authentication attempt
   */
  abortAuthentication(): void {
    if (stryMutAct_9fa48("5554")) {
      {}
    } else {
      stryCov_9fa48("5554");
      if (stryMutAct_9fa48("5556") ? false : stryMutAct_9fa48("5555") ? true : (stryCov_9fa48("5555", "5556"), this.abortController)) {
        if (stryMutAct_9fa48("5557")) {
          {}
        } else {
          stryCov_9fa48("5557");
          this.abortController.abort();
          this.abortController = null;
        }
      }
    }
  }

  /**
   * Gets device information
   */
  private getDeviceInfo(credentialId: string): DeviceInfo {
    if (stryMutAct_9fa48("5558")) {
      {}
    } else {
      stryCov_9fa48("5558");
      const platformInfo = this.getPlatformInfo();
      return stryMutAct_9fa48("5559") ? {} : (stryCov_9fa48("5559"), {
        deviceId: credentialId,
        timestamp: Date.now(),
        name: platformInfo.name,
        platform: platformInfo.platform,
        lastUsed: Date.now()
      });
    }
  }

  /**
   * Gets platform information
   */
  private getPlatformInfo(): {
    name: string;
    platform: string;
  } {
    if (stryMutAct_9fa48("5560")) {
      {}
    } else {
      stryCov_9fa48("5560");
      if (stryMutAct_9fa48("5563") ? typeof navigator !== "undefined" : stryMutAct_9fa48("5562") ? false : stryMutAct_9fa48("5561") ? true : (stryCov_9fa48("5561", "5562", "5563"), typeof navigator === (stryMutAct_9fa48("5564") ? "" : (stryCov_9fa48("5564"), "undefined")))) {
        if (stryMutAct_9fa48("5565")) {
          {}
        } else {
          stryCov_9fa48("5565");
          return stryMutAct_9fa48("5566") ? {} : (stryCov_9fa48("5566"), {
            name: stryMutAct_9fa48("5567") ? "" : (stryCov_9fa48("5567"), "unknown"),
            platform: stryMutAct_9fa48("5568") ? "" : (stryCov_9fa48("5568"), "unknown")
          });
        }
      }
      const platform = navigator.platform;
      const userAgent = navigator.userAgent;
      if (stryMutAct_9fa48("5570") ? false : stryMutAct_9fa48("5569") ? true : (stryCov_9fa48("5569", "5570"), /iPhone|iPad|iPod/.test(platform))) {
        if (stryMutAct_9fa48("5571")) {
          {}
        } else {
          stryCov_9fa48("5571");
          return stryMutAct_9fa48("5572") ? {} : (stryCov_9fa48("5572"), {
            name: stryMutAct_9fa48("5573") ? "" : (stryCov_9fa48("5573"), "iOS Device"),
            platform
          });
        }
      }
      if (stryMutAct_9fa48("5575") ? false : stryMutAct_9fa48("5574") ? true : (stryCov_9fa48("5574", "5575"), /Android/.test(userAgent))) {
        if (stryMutAct_9fa48("5576")) {
          {}
        } else {
          stryCov_9fa48("5576");
          return stryMutAct_9fa48("5577") ? {} : (stryCov_9fa48("5577"), {
            name: stryMutAct_9fa48("5578") ? "" : (stryCov_9fa48("5578"), "Android Device"),
            platform
          });
        }
      }
      if (stryMutAct_9fa48("5580") ? false : stryMutAct_9fa48("5579") ? true : (stryCov_9fa48("5579", "5580"), /Win/.test(platform))) {
        if (stryMutAct_9fa48("5581")) {
          {}
        } else {
          stryCov_9fa48("5581");
          return stryMutAct_9fa48("5582") ? {} : (stryCov_9fa48("5582"), {
            name: stryMutAct_9fa48("5583") ? "" : (stryCov_9fa48("5583"), "Windows Device"),
            platform
          });
        }
      }
      if (stryMutAct_9fa48("5585") ? false : stryMutAct_9fa48("5584") ? true : (stryCov_9fa48("5584", "5585"), /Mac/.test(platform))) {
        if (stryMutAct_9fa48("5586")) {
          {}
        } else {
          stryCov_9fa48("5586");
          return stryMutAct_9fa48("5587") ? {} : (stryCov_9fa48("5587"), {
            name: stryMutAct_9fa48("5588") ? "" : (stryCov_9fa48("5588"), "Mac Device"),
            platform
          });
        }
      }
      if (stryMutAct_9fa48("5590") ? false : stryMutAct_9fa48("5589") ? true : (stryCov_9fa48("5589", "5590"), /Linux/.test(platform))) {
        if (stryMutAct_9fa48("5591")) {
          {}
        } else {
          stryCov_9fa48("5591");
          return stryMutAct_9fa48("5592") ? {} : (stryCov_9fa48("5592"), {
            name: stryMutAct_9fa48("5593") ? "" : (stryCov_9fa48("5593"), "Linux Device"),
            platform
          });
        }
      }
      return stryMutAct_9fa48("5594") ? {} : (stryCov_9fa48("5594"), {
        name: stryMutAct_9fa48("5595") ? "" : (stryCov_9fa48("5595"), "Unknown Device"),
        platform
      });
    }
  }

  /**
   * Generates a challenge for WebAuthn operations
   */
  private generateChallenge(username: string): Uint8Array {
    if (stryMutAct_9fa48("5596")) {
      {}
    } else {
      stryCov_9fa48("5596");
      const timestamp = Date.now().toString();
      const randomBytes = this.getRandomBytes(32);
      const challengeData = stryMutAct_9fa48("5597") ? `` : (stryCov_9fa48("5597"), `${username}-${timestamp}-${this.uint8ArrayToHex(randomBytes)}`);
      return new TextEncoder().encode(challengeData);
    }
  }

  /**
   * Gets cryptographically secure random bytes
   */
  private getRandomBytes(length: number): Uint8Array {
    if (stryMutAct_9fa48("5598")) {
      {}
    } else {
      stryCov_9fa48("5598");
      if (stryMutAct_9fa48("5601") ? typeof window !== "undefined" || window.crypto : stryMutAct_9fa48("5600") ? false : stryMutAct_9fa48("5599") ? true : (stryCov_9fa48("5599", "5600", "5601"), (stryMutAct_9fa48("5603") ? typeof window === "undefined" : stryMutAct_9fa48("5602") ? true : (stryCov_9fa48("5602", "5603"), typeof window !== (stryMutAct_9fa48("5604") ? "" : (stryCov_9fa48("5604"), "undefined")))) && window.crypto)) {
        if (stryMutAct_9fa48("5605")) {
          {}
        } else {
          stryCov_9fa48("5605");
          return window.crypto.getRandomValues(new Uint8Array(length));
        }
      }
      throw new Error(stryMutAct_9fa48("5606") ? "" : (stryCov_9fa48("5606"), "No cryptographic implementation available"));
    }
  }

  /**
   * Converts Uint8Array to hexadecimal string
   */
  private uint8ArrayToHex(arr: Uint8Array): string {
    if (stryMutAct_9fa48("5607")) {
      {}
    } else {
      stryCov_9fa48("5607");
      return Array.from(arr).map(stryMutAct_9fa48("5608") ? () => undefined : (stryCov_9fa48("5608"), b => b.toString(16).padStart(2, stryMutAct_9fa48("5609") ? "" : (stryCov_9fa48("5609"), "0")))).join(stryMutAct_9fa48("5610") ? "Stryker was here!" : (stryCov_9fa48("5610"), ""));
    }
  }

  /**
   * Converts ArrayBuffer to URL-safe base64 string
   */
  private bufferToBase64(buffer: ArrayBuffer): string {
    if (stryMutAct_9fa48("5611")) {
      {}
    } else {
      stryCov_9fa48("5611");
      const bytes = new Uint8Array(buffer);
      const binary = bytes.reduce(stryMutAct_9fa48("5612") ? () => undefined : (stryCov_9fa48("5612"), (str, byte) => stryMutAct_9fa48("5613") ? str - String.fromCharCode(byte) : (stryCov_9fa48("5613"), str + String.fromCharCode(byte))), stryMutAct_9fa48("5614") ? "Stryker was here!" : (stryCov_9fa48("5614"), ""));
      return btoa(binary).replace(/\+/g, stryMutAct_9fa48("5615") ? "" : (stryCov_9fa48("5615"), "-")).replace(/\//g, stryMutAct_9fa48("5616") ? "" : (stryCov_9fa48("5616"), "_")).replace(/=/g, stryMutAct_9fa48("5617") ? "Stryker was here!" : (stryCov_9fa48("5617"), ""));
    }
  }

  /**
   * Generates credentials from username and salt
   */
  private generateCredentialsFromSalt(username: string, salt: string): {
    password: string;
  } {
    if (stryMutAct_9fa48("5618")) {
      {}
    } else {
      stryCov_9fa48("5618");
      const data = ethers.toUtf8Bytes(stryMutAct_9fa48("5619") ? username - salt : (stryCov_9fa48("5619"), username + salt));
      return stryMutAct_9fa48("5620") ? {} : (stryCov_9fa48("5620"), {
        password: ethers.sha256(data)
      });
    }
  }

  /**
   * Checks if WebAuthn is supported
   */
  isSupported(): boolean {
    if (stryMutAct_9fa48("5621")) {
      {}
    } else {
      stryCov_9fa48("5621");
      return stryMutAct_9fa48("5624") ? typeof window !== "undefined" || window.PublicKeyCredential !== undefined : stryMutAct_9fa48("5623") ? false : stryMutAct_9fa48("5622") ? true : (stryCov_9fa48("5622", "5623", "5624"), (stryMutAct_9fa48("5626") ? typeof window === "undefined" : stryMutAct_9fa48("5625") ? true : (stryCov_9fa48("5625", "5626"), typeof window !== (stryMutAct_9fa48("5627") ? "" : (stryCov_9fa48("5627"), "undefined")))) && (stryMutAct_9fa48("5629") ? window.PublicKeyCredential === undefined : stryMutAct_9fa48("5628") ? true : (stryCov_9fa48("5628", "5629"), window.PublicKeyCredential !== undefined)));
    }
  }

  /**
   * Creates a WebAuthn credential for registration
   */
  private async createCredential(username: string): Promise<WebAuthnCredentialData> {
    if (stryMutAct_9fa48("5630")) {
      {}
    } else {
      stryCov_9fa48("5630");
      try {
        if (stryMutAct_9fa48("5631")) {
          {}
        } else {
          stryCov_9fa48("5631");
          const challenge = crypto.getRandomValues(new Uint8Array(32));
          const userId = new TextEncoder().encode(username);
          const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = stryMutAct_9fa48("5632") ? {} : (stryCov_9fa48("5632"), {
            challenge,
            rp: stryMutAct_9fa48("5633") ? {} : (stryCov_9fa48("5633"), {
              name: stryMutAct_9fa48("5634") ? "" : (stryCov_9fa48("5634"), "Shogun Wallet"),
              ...(stryMutAct_9fa48("5637") ? this.config.rpId !== "localhost" || {
                id: this.config.rpId
              } : stryMutAct_9fa48("5636") ? false : stryMutAct_9fa48("5635") ? true : (stryCov_9fa48("5635", "5636", "5637"), (stryMutAct_9fa48("5639") ? this.config.rpId === "localhost" : stryMutAct_9fa48("5638") ? true : (stryCov_9fa48("5638", "5639"), this.config.rpId !== (stryMutAct_9fa48("5640") ? "" : (stryCov_9fa48("5640"), "localhost")))) && (stryMutAct_9fa48("5641") ? {} : (stryCov_9fa48("5641"), {
                id: this.config.rpId
              }))))
            }),
            user: stryMutAct_9fa48("5642") ? {} : (stryCov_9fa48("5642"), {
              id: userId,
              name: username,
              displayName: username
            }),
            pubKeyCredParams: stryMutAct_9fa48("5643") ? [] : (stryCov_9fa48("5643"), [stryMutAct_9fa48("5644") ? {} : (stryCov_9fa48("5644"), {
              type: stryMutAct_9fa48("5645") ? "" : (stryCov_9fa48("5645"), "public-key"),
              alg: stryMutAct_9fa48("5646") ? +7 : (stryCov_9fa48("5646"), -7)
            })]),
            timeout: this.config.timeout,
            attestation: this.config.attestation,
            authenticatorSelection: stryMutAct_9fa48("5647") ? {} : (stryCov_9fa48("5647"), {
              authenticatorAttachment: this.config.authenticatorAttachment,
              userVerification: this.config.userVerification,
              requireResidentKey: this.config.requireResidentKey
            })
          });
          const credential = await navigator.credentials.create(stryMutAct_9fa48("5648") ? {} : (stryCov_9fa48("5648"), {
            publicKey: publicKeyCredentialCreationOptions
          }));
          if (stryMutAct_9fa48("5651") ? false : stryMutAct_9fa48("5650") ? true : stryMutAct_9fa48("5649") ? credential : (stryCov_9fa48("5649", "5650", "5651"), !credential)) {
            if (stryMutAct_9fa48("5652")) {
              {}
            } else {
              stryCov_9fa48("5652");
              throw new Error(stryMutAct_9fa48("5653") ? "" : (stryCov_9fa48("5653"), "Credential creation failed"));
            }
          }
          const webAuthnCredential = credential as PublicKeyCredential;

          // Convert to WebAuthnCredentialData
          const credentialData: WebAuthnCredentialData = stryMutAct_9fa48("5654") ? {} : (stryCov_9fa48("5654"), {
            id: webAuthnCredential.id,
            rawId: webAuthnCredential.rawId,
            type: webAuthnCredential.type,
            response: stryMutAct_9fa48("5655") ? {} : (stryCov_9fa48("5655"), {
              clientDataJSON: webAuthnCredential.response.clientDataJSON
            }),
            getClientExtensionResults: webAuthnCredential.getClientExtensionResults
          });

          // Add additional response properties if available
          if (stryMutAct_9fa48("5657") ? false : stryMutAct_9fa48("5656") ? true : (stryCov_9fa48("5656", "5657"), (stryMutAct_9fa48("5658") ? "" : (stryCov_9fa48("5658"), "attestationObject")) in webAuthnCredential.response)) {
            if (stryMutAct_9fa48("5659")) {
              {}
            } else {
              stryCov_9fa48("5659");
              credentialData.response.attestationObject = (webAuthnCredential.response as AuthenticatorAttestationResponse).attestationObject;
            }
          }
          this.credential = credentialData;
          return credentialData;
        }
      } catch (error: unknown) {
        if (stryMutAct_9fa48("5660")) {
          {}
        } else {
          stryCov_9fa48("5660");
          console.error(stryMutAct_9fa48("5661") ? "" : (stryCov_9fa48("5661"), "Detailed error in credential creation:"), error);
          const errorMessage = error instanceof Error ? error.message : stryMutAct_9fa48("5662") ? "" : (stryCov_9fa48("5662"), "Unknown error");
          throw new Error(stryMutAct_9fa48("5663") ? `` : (stryCov_9fa48("5663"), `Error creating credentials: ${errorMessage}`));
        }
      }
    }
  }

  /**
   * Generates WebAuthn credentials (uniforme con altri plugin)
   */
  async generateCredentials(username: string, existingCredential?: WebAuthnCredentials | null, isLogin = stryMutAct_9fa48("5664") ? true : (stryCov_9fa48("5664"), false)): Promise<{
    success: boolean;
    username: string;
    key: any;
    credentialId: string;
    publicKey?: ArrayBuffer | null;
    error?: string;
  }> {
    if (stryMutAct_9fa48("5665")) {
      {}
    } else {
      stryCov_9fa48("5665");
      try {
        if (stryMutAct_9fa48("5666")) {
          {}
        } else {
          stryCov_9fa48("5666");
          if (stryMutAct_9fa48("5668") ? false : stryMutAct_9fa48("5667") ? true : (stryCov_9fa48("5667", "5668"), isLogin)) {
            if (stryMutAct_9fa48("5669")) {
              {}
            } else {
              stryCov_9fa48("5669");
              const verificationResult = await this.verifyCredential(username);
              if (stryMutAct_9fa48("5672") ? !verificationResult.success && !verificationResult.credentialId : stryMutAct_9fa48("5671") ? false : stryMutAct_9fa48("5670") ? true : (stryCov_9fa48("5670", "5671", "5672"), (stryMutAct_9fa48("5673") ? verificationResult.success : (stryCov_9fa48("5673"), !verificationResult.success)) || (stryMutAct_9fa48("5674") ? verificationResult.credentialId : (stryCov_9fa48("5674"), !verificationResult.credentialId)))) {
                if (stryMutAct_9fa48("5675")) {
                  {}
                } else {
                  stryCov_9fa48("5675");
                  return stryMutAct_9fa48("5676") ? {} : (stryCov_9fa48("5676"), {
                    success: stryMutAct_9fa48("5677") ? true : (stryCov_9fa48("5677"), false),
                    username,
                    key: undefined,
                    credentialId: stryMutAct_9fa48("5678") ? "Stryker was here!" : (stryCov_9fa48("5678"), ""),
                    error: verificationResult.error,
                    publicKey: null
                  });
                }
              }
              // Deriva la chiave GunDB
              const key = await deriveWebauthnKeys(username, verificationResult.credentialId);
              return stryMutAct_9fa48("5679") ? {} : (stryCov_9fa48("5679"), {
                success: stryMutAct_9fa48("5680") ? false : (stryCov_9fa48("5680"), true),
                username,
                key,
                credentialId: verificationResult.credentialId,
                publicKey: null
              });
            }
          } else {
            if (stryMutAct_9fa48("5681")) {
              {}
            } else {
              stryCov_9fa48("5681");
              const credential = await this.createCredential(username);
              const credentialId = credential.id;
              let publicKey: ArrayBuffer | null = null;
              if (stryMutAct_9fa48("5685") ? credential.response?.getPublicKey : stryMutAct_9fa48("5684") ? credential?.response.getPublicKey : stryMutAct_9fa48("5683") ? false : stryMutAct_9fa48("5682") ? true : (stryCov_9fa48("5682", "5683", "5684", "5685"), credential?.response?.getPublicKey)) {
                if (stryMutAct_9fa48("5686")) {
                  {}
                } else {
                  stryCov_9fa48("5686");
                  publicKey = credential.response.getPublicKey();
                }
              }
              // Deriva la chiave GunDB
              const key = await deriveWebauthnKeys(username, credentialId);
              return stryMutAct_9fa48("5687") ? {} : (stryCov_9fa48("5687"), {
                success: stryMutAct_9fa48("5688") ? false : (stryCov_9fa48("5688"), true),
                username,
                key,
                credentialId,
                publicKey
              });
            }
          }
        }
      } catch (error: unknown) {
        if (stryMutAct_9fa48("5689")) {
          {}
        } else {
          stryCov_9fa48("5689");
          console.error(stryMutAct_9fa48("5690") ? "" : (stryCov_9fa48("5690"), "Error in generateCredentials:"), error);
          const errorMessage = error instanceof Error ? error.message : stryMutAct_9fa48("5691") ? "" : (stryCov_9fa48("5691"), "Unknown error during WebAuthn operation");
          return stryMutAct_9fa48("5692") ? {} : (stryCov_9fa48("5692"), {
            success: stryMutAct_9fa48("5693") ? true : (stryCov_9fa48("5693"), false),
            username,
            key: undefined,
            credentialId: stryMutAct_9fa48("5694") ? "Stryker was here!" : (stryCov_9fa48("5694"), ""),
            error: errorMessage,
            publicKey: null
          });
        }
      }
    }
  }

  /**
   * Verifies a credential
   */
  private async verifyCredential(username: string): Promise<WebAuthnVerificationResult> {
    if (stryMutAct_9fa48("5695")) {
      {}
    } else {
      stryCov_9fa48("5695");
      try {
        if (stryMutAct_9fa48("5696")) {
          {}
        } else {
          stryCov_9fa48("5696");
          const challenge = crypto.getRandomValues(new Uint8Array(32));
          const options: PublicKeyCredentialRequestOptions = stryMutAct_9fa48("5697") ? {} : (stryCov_9fa48("5697"), {
            challenge,
            timeout: this.config.timeout,
            userVerification: this.config.userVerification,
            ...(stryMutAct_9fa48("5700") ? this.config.rpId !== "localhost" || {
              rpId: this.config.rpId
            } : stryMutAct_9fa48("5699") ? false : stryMutAct_9fa48("5698") ? true : (stryCov_9fa48("5698", "5699", "5700"), (stryMutAct_9fa48("5702") ? this.config.rpId === "localhost" : stryMutAct_9fa48("5701") ? true : (stryCov_9fa48("5701", "5702"), this.config.rpId !== (stryMutAct_9fa48("5703") ? "" : (stryCov_9fa48("5703"), "localhost")))) && (stryMutAct_9fa48("5704") ? {} : (stryCov_9fa48("5704"), {
              rpId: this.config.rpId
            }))))
          });
          if (stryMutAct_9fa48("5707") ? this.credential.rawId : stryMutAct_9fa48("5706") ? false : stryMutAct_9fa48("5705") ? true : (stryCov_9fa48("5705", "5706", "5707"), this.credential?.rawId)) {
            if (stryMutAct_9fa48("5708")) {
              {}
            } else {
              stryCov_9fa48("5708");
              options.allowCredentials = stryMutAct_9fa48("5709") ? [] : (stryCov_9fa48("5709"), [stryMutAct_9fa48("5710") ? {} : (stryCov_9fa48("5710"), {
                id: this.credential.rawId,
                type: stryMutAct_9fa48("5711") ? "" : (stryCov_9fa48("5711"), "public-key")
              })]);
            }
          }
          const assertion = await navigator.credentials.get(stryMutAct_9fa48("5712") ? {} : (stryCov_9fa48("5712"), {
            publicKey: options
          }));
          if (stryMutAct_9fa48("5715") ? false : stryMutAct_9fa48("5714") ? true : stryMutAct_9fa48("5713") ? assertion : (stryCov_9fa48("5713", "5714", "5715"), !assertion)) {
            if (stryMutAct_9fa48("5716")) {
              {}
            } else {
              stryCov_9fa48("5716");
              return stryMutAct_9fa48("5717") ? {} : (stryCov_9fa48("5717"), {
                success: stryMutAct_9fa48("5718") ? true : (stryCov_9fa48("5718"), false),
                error: stryMutAct_9fa48("5719") ? "" : (stryCov_9fa48("5719"), "Credential verification failed")
              });
            }
          }
          return stryMutAct_9fa48("5720") ? {} : (stryCov_9fa48("5720"), {
            success: stryMutAct_9fa48("5721") ? false : (stryCov_9fa48("5721"), true),
            credentialId: (assertion as PublicKeyCredential).id,
            username
          });
        }
      } catch (error: unknown) {
        if (stryMutAct_9fa48("5722")) {
          {}
        } else {
          stryCov_9fa48("5722");
          console.error(stryMutAct_9fa48("5723") ? "" : (stryCov_9fa48("5723"), "Error verifying credentials:"), error);
          const errorMessage = error instanceof Error ? error.message : stryMutAct_9fa48("5724") ? "" : (stryCov_9fa48("5724"), "Unknown error verifying credentials");
          return stryMutAct_9fa48("5725") ? {} : (stryCov_9fa48("5725"), {
            success: stryMutAct_9fa48("5726") ? true : (stryCov_9fa48("5726"), false),
            error: errorMessage
          });
        }
      }
    }
  }

  /**
   * Removes device credentials
   */
  async removeDevice(username: string, credentialId: string, credentials: WebAuthnCredentials): Promise<{
    success: boolean;
    updatedCredentials?: WebAuthnCredentials;
  }> {
    if (stryMutAct_9fa48("5727")) {
      {}
    } else {
      stryCov_9fa48("5727");
      if (stryMutAct_9fa48("5730") ? (!credentials || !credentials.credentials) && !credentials.credentials[credentialId] : stryMutAct_9fa48("5729") ? false : stryMutAct_9fa48("5728") ? true : (stryCov_9fa48("5728", "5729", "5730"), (stryMutAct_9fa48("5732") ? !credentials && !credentials.credentials : stryMutAct_9fa48("5731") ? false : (stryCov_9fa48("5731", "5732"), (stryMutAct_9fa48("5733") ? credentials : (stryCov_9fa48("5733"), !credentials)) || (stryMutAct_9fa48("5734") ? credentials.credentials : (stryCov_9fa48("5734"), !credentials.credentials)))) || (stryMutAct_9fa48("5735") ? credentials.credentials[credentialId] : (stryCov_9fa48("5735"), !credentials.credentials[credentialId])))) {
        if (stryMutAct_9fa48("5736")) {
          {}
        } else {
          stryCov_9fa48("5736");
          return stryMutAct_9fa48("5737") ? {} : (stryCov_9fa48("5737"), {
            success: stryMutAct_9fa48("5738") ? true : (stryCov_9fa48("5738"), false)
          });
        }
      }
      const updatedCreds = stryMutAct_9fa48("5739") ? {} : (stryCov_9fa48("5739"), {
        ...credentials
      });
      // Make sure credentials exists before modifying it
      if (stryMutAct_9fa48("5741") ? false : stryMutAct_9fa48("5740") ? true : (stryCov_9fa48("5740", "5741"), updatedCreds.credentials)) {
        if (stryMutAct_9fa48("5742")) {
          {}
        } else {
          stryCov_9fa48("5742");
          delete updatedCreds.credentials[credentialId];
        }
      }
      return stryMutAct_9fa48("5743") ? {} : (stryCov_9fa48("5743"), {
        success: stryMutAct_9fa48("5744") ? false : (stryCov_9fa48("5744"), true),
        updatedCredentials: updatedCreds
      });
    }
  }

  /**
   * Signs data with the credential
   */
  async sign(data: Record<string, unknown>): Promise<unknown> {
    if (stryMutAct_9fa48("5745")) {
      {}
    } else {
      stryCov_9fa48("5745");
      const signature = await navigator.credentials.get(stryMutAct_9fa48("5746") ? {} : (stryCov_9fa48("5746"), {
        publicKey: stryMutAct_9fa48("5747") ? {} : (stryCov_9fa48("5747"), {
          challenge: new Uint8Array(16),
          rpId: this.config.rpId
        })
      }));
      return signature;
    }
  }
}

// Add to global scope if available
if (stryMutAct_9fa48("5750") ? typeof window === "undefined" : stryMutAct_9fa48("5749") ? false : stryMutAct_9fa48("5748") ? true : (stryCov_9fa48("5748", "5749", "5750"), typeof window !== (stryMutAct_9fa48("5751") ? "" : (stryCov_9fa48("5751"), "undefined")))) {
  if (stryMutAct_9fa48("5752")) {
    {}
  } else {
    stryCov_9fa48("5752");
    window.Webauthn = Webauthn;
  }
} else if (stryMutAct_9fa48("5755") ? typeof global === "undefined" : stryMutAct_9fa48("5754") ? false : stryMutAct_9fa48("5753") ? true : (stryCov_9fa48("5753", "5754", "5755"), typeof global !== (stryMutAct_9fa48("5756") ? "" : (stryCov_9fa48("5756"), "undefined")))) {
  if (stryMutAct_9fa48("5757")) {
    {}
  } else {
    stryCov_9fa48("5757");
    (global as any).Webauthn = Webauthn;
  }
}
export type { WebAuthnCredentials, DeviceInfo, CredentialResult };

// Funzione helper per derivare chiavi WebAuthn (come per Web3)
export async function deriveWebauthnKeys(username: string, credentialId: string) {
  if (stryMutAct_9fa48("5758")) {
    {}
  } else {
    stryCov_9fa48("5758");
    const hashedCredentialId = ethers.keccak256(ethers.toUtf8Bytes(credentialId));
    const salt = stryMutAct_9fa48("5759") ? `` : (stryCov_9fa48("5759"), `${username}_${credentialId}`);
    return await derive(hashedCredentialId, salt, stryMutAct_9fa48("5760") ? {} : (stryCov_9fa48("5760"), {
      includeP256: stryMutAct_9fa48("5761") ? false : (stryCov_9fa48("5761"), true)
    }));
  }
}