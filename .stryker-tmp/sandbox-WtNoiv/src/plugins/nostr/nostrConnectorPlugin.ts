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
import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { NostrConnector, MESSAGE_TO_SIGN, deriveNostrKeys } from "./nostrConnector";
import { NostrSigner, NostrSigningCredential } from "./nostrSigner";
import { NostrConnectorCredentials, ConnectionResult, NostrConnectorPluginInterface } from "./types";
import { AuthResult, SignUpResult } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";

/**
 * Plugin for managing Bitcoin wallet functionality in ShogunCore
 * Supports Alby, Nostr extensions, or direct key management
 */
export class NostrConnectorPlugin extends BasePlugin implements NostrConnectorPluginInterface {
  name = stryMutAct_9fa48("3324") ? "" : (stryCov_9fa48("3324"), "nostr");
  version = stryMutAct_9fa48("3325") ? "" : (stryCov_9fa48("3325"), "1.0.0");
  description = stryMutAct_9fa48("3326") ? "" : (stryCov_9fa48("3326"), "Provides Bitcoin wallet connection and authentication for ShogunCore");
  private bitcoinConnector: NostrConnector | null = null;
  private signer: NostrSigner | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    if (stryMutAct_9fa48("3327")) {
      {}
    } else {
      stryCov_9fa48("3327");
      super.initialize(core);

      // Initialize the Bitcoin wallet module
      this.bitcoinConnector = new NostrConnector();
      this.signer = new NostrSigner(this.bitcoinConnector);
    }
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (stryMutAct_9fa48("3328")) {
      {}
    } else {
      stryCov_9fa48("3328");
      if (stryMutAct_9fa48("3330") ? false : stryMutAct_9fa48("3329") ? true : (stryCov_9fa48("3329", "3330"), this.bitcoinConnector)) {
        if (stryMutAct_9fa48("3331")) {
          {}
        } else {
          stryCov_9fa48("3331");
          this.bitcoinConnector.cleanup();
        }
      }
      this.bitcoinConnector = null;
      this.signer = null;
      super.destroy();
    }
  }

  /**
   * Ensure that the Bitcoin wallet module is initialized
   * @private
   */
  private assertBitcoinConnector(): NostrConnector {
    if (stryMutAct_9fa48("3332")) {
      {}
    } else {
      stryCov_9fa48("3332");
      this.assertInitialized();
      if (stryMutAct_9fa48("3335") ? false : stryMutAct_9fa48("3334") ? true : stryMutAct_9fa48("3333") ? this.bitcoinConnector : (stryCov_9fa48("3333", "3334", "3335"), !this.bitcoinConnector)) {
        if (stryMutAct_9fa48("3336")) {
          {}
        } else {
          stryCov_9fa48("3336");
          throw new Error(stryMutAct_9fa48("3337") ? "" : (stryCov_9fa48("3337"), "Bitcoin wallet module not initialized"));
        }
      }
      return this.bitcoinConnector;
    }
  }

  /**
   * Assicura che il signer sia inizializzato
   * @private
   */
  private assertSigner(): NostrSigner {
    if (stryMutAct_9fa48("3338")) {
      {}
    } else {
      stryCov_9fa48("3338");
      this.assertInitialized();
      if (stryMutAct_9fa48("3341") ? false : stryMutAct_9fa48("3340") ? true : stryMutAct_9fa48("3339") ? this.signer : (stryCov_9fa48("3339", "3340", "3341"), !this.signer)) {
        if (stryMutAct_9fa48("3342")) {
          {}
        } else {
          stryCov_9fa48("3342");
          throw new Error(stryMutAct_9fa48("3343") ? "" : (stryCov_9fa48("3343"), "Nostr signer not initialized"));
        }
      }
      return this.signer;
    }
  }

  /**
   * @inheritdoc
   */
  isAvailable(): boolean {
    if (stryMutAct_9fa48("3344")) {
      {}
    } else {
      stryCov_9fa48("3344");
      return this.assertBitcoinConnector().isAvailable();
    }
  }

  /**
   * Check if Alby extension is available
   * Note: Alby is deprecated in favor of Nostr
   */
  isAlbyAvailable(): boolean {
    if (stryMutAct_9fa48("3345")) {
      {}
    } else {
      stryCov_9fa48("3345");
      return this.isNostrExtensionAvailable();
    }
  }

  /**
   * Check if Nostr extension is available
   */
  isNostrExtensionAvailable(): boolean {
    if (stryMutAct_9fa48("3346")) {
      {}
    } else {
      stryCov_9fa48("3346");
      return this.assertBitcoinConnector().isNostrExtensionAvailable();
    }
  }

  /**
   * Connect to Nostr wallet automatically
   * This is a convenience method for easy wallet connection
   */
  async connectNostrWallet(): Promise<ConnectionResult> {
    if (stryMutAct_9fa48("3347")) {
      {}
    } else {
      stryCov_9fa48("3347");
      try {
        if (stryMutAct_9fa48("3348")) {
          {}
        } else {
          stryCov_9fa48("3348");
          if (stryMutAct_9fa48("3351") ? false : stryMutAct_9fa48("3350") ? true : stryMutAct_9fa48("3349") ? this.isNostrExtensionAvailable() : (stryCov_9fa48("3349", "3350", "3351"), !this.isNostrExtensionAvailable())) {
            if (stryMutAct_9fa48("3352")) {
              {}
            } else {
              stryCov_9fa48("3352");
              return stryMutAct_9fa48("3353") ? {} : (stryCov_9fa48("3353"), {
                success: stryMutAct_9fa48("3354") ? true : (stryCov_9fa48("3354"), false),
                error: stryMutAct_9fa48("3355") ? "" : (stryCov_9fa48("3355"), "Nostr extension not available. Please install a Nostr extension like nos2x, Alby, or Coracle.")
              });
            }
          }
          const result = await this.connectBitcoinWallet(stryMutAct_9fa48("3356") ? "" : (stryCov_9fa48("3356"), "nostr"));
          if (stryMutAct_9fa48("3358") ? false : stryMutAct_9fa48("3357") ? true : (stryCov_9fa48("3357", "3358"), result.success)) {}
          return result;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3359")) {
          {}
        } else {
          stryCov_9fa48("3359");
          console.error(stryMutAct_9fa48("3360") ? "" : (stryCov_9fa48("3360"), "[nostrConnectorPlugin] Error connecting to Nostr wallet:"), error);
          return stryMutAct_9fa48("3361") ? {} : (stryCov_9fa48("3361"), {
            success: stryMutAct_9fa48("3362") ? true : (stryCov_9fa48("3362"), false),
            error: stryMutAct_9fa48("3365") ? error.message && "Unknown error connecting to Nostr wallet" : stryMutAct_9fa48("3364") ? false : stryMutAct_9fa48("3363") ? true : (stryCov_9fa48("3363", "3364", "3365"), error.message || (stryMutAct_9fa48("3366") ? "" : (stryCov_9fa48("3366"), "Unknown error connecting to Nostr wallet")))
          });
        }
      }
    }
  }

  /**
   * @inheritdoc
   */
  async connectBitcoinWallet(type: "alby" | "nostr" | "manual" = stryMutAct_9fa48("3367") ? "" : (stryCov_9fa48("3367"), "nostr")): Promise<ConnectionResult> {
    if (stryMutAct_9fa48("3368")) {
      {}
    } else {
      stryCov_9fa48("3368");
      // Prioritize nostr over alby (since they are functionally identical)
      // If type is alby, try to use nostr instead
      if (stryMutAct_9fa48("3371") ? type !== "alby" : stryMutAct_9fa48("3370") ? false : stryMutAct_9fa48("3369") ? true : (stryCov_9fa48("3369", "3370", "3371"), type === (stryMutAct_9fa48("3372") ? "" : (stryCov_9fa48("3372"), "alby")))) {
        if (stryMutAct_9fa48("3373")) {
          {}
        } else {
          stryCov_9fa48("3373");
          type = stryMutAct_9fa48("3374") ? "" : (stryCov_9fa48("3374"), "nostr");
        }
      }
      return this.assertBitcoinConnector().connectWallet(type);
    }
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(address: string, signature: string, message: string): Promise<NostrConnectorCredentials> {
    if (stryMutAct_9fa48("3375")) {
      {}
    } else {
      stryCov_9fa48("3375");
      return this.assertBitcoinConnector().generateCredentials(address, signature, message);
    }
  }

  /**
   * @inheritdoc
   */
  cleanup(): void {
    if (stryMutAct_9fa48("3376")) {
      {}
    } else {
      stryCov_9fa48("3376");
      this.assertBitcoinConnector().cleanup();
    }
  }

  /**
   * Clear signature cache for better user recovery
   * @param address - Optional specific address to clear, or clear all if not provided
   */
  clearSignatureCache(address?: string): void {
    if (stryMutAct_9fa48("3377")) {
      {}
    } else {
      stryCov_9fa48("3377");
      this.assertBitcoinConnector().clearSignatureCache(address);
    }
  }

  /**
   * @inheritdoc
   */
  async verifySignature(message: string, signature: string, address: string): Promise<boolean> {
    if (stryMutAct_9fa48("3378")) {
      {}
    } else {
      stryCov_9fa48("3378");
      return this.assertBitcoinConnector().verifySignature(message, signature, address);
    }
  }

  /**
   * @inheritdoc
   */
  async generatePassword(signature: string): Promise<string> {
    if (stryMutAct_9fa48("3379")) {
      {}
    } else {
      stryCov_9fa48("3379");
      return this.assertBitcoinConnector().generatePassword(signature);
    }
  }

  // === NOSTR SIGNER METHODS ===

  /**
   * Creates a new Nostr signing credential
   * CONSISTENT with normal Nostr approach
   */
  async createSigningCredential(address: string): Promise<NostrSigningCredential> {
    if (stryMutAct_9fa48("3380")) {
      {}
    } else {
      stryCov_9fa48("3380");
      try {
        if (stryMutAct_9fa48("3381")) {
          {}
        } else {
          stryCov_9fa48("3381");
          return await this.assertSigner().createSigningCredential(address);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3382")) {
          {}
        } else {
          stryCov_9fa48("3382");
          console.error(stryMutAct_9fa48("3383") ? `` : (stryCov_9fa48("3383"), `Error creating Nostr signing credential: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Creates an authenticator function for Nostr signing
   */
  createAuthenticator(address: string): (data: any) => Promise<string> {
    if (stryMutAct_9fa48("3384")) {
      {}
    } else {
      stryCov_9fa48("3384");
      try {
        if (stryMutAct_9fa48("3385")) {
          {}
        } else {
          stryCov_9fa48("3385");
          return this.assertSigner().createAuthenticator(address);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3386")) {
          {}
        } else {
          stryCov_9fa48("3386");
          console.error(stryMutAct_9fa48("3387") ? `` : (stryCov_9fa48("3387"), `Error creating Nostr authenticator: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Creates a derived key pair from Nostr credential
   */
  async createDerivedKeyPair(address: string, extra?: string[]): Promise<{
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  }> {
    if (stryMutAct_9fa48("3388")) {
      {}
    } else {
      stryCov_9fa48("3388");
      try {
        if (stryMutAct_9fa48("3389")) {
          {}
        } else {
          stryCov_9fa48("3389");
          return await this.assertSigner().createDerivedKeyPair(address, extra);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3390")) {
          {}
        } else {
          stryCov_9fa48("3390");
          console.error(stryMutAct_9fa48("3391") ? `` : (stryCov_9fa48("3391"), `Error creating derived key pair: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Signs data with derived keys after Nostr verification
   */
  async signWithDerivedKeys(data: any, address: string, extra?: string[]): Promise<string> {
    if (stryMutAct_9fa48("3392")) {
      {}
    } else {
      stryCov_9fa48("3392");
      try {
        if (stryMutAct_9fa48("3393")) {
          {}
        } else {
          stryCov_9fa48("3393");
          return await this.assertSigner().signWithDerivedKeys(data, address, extra);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3394")) {
          {}
        } else {
          stryCov_9fa48("3394");
          console.error(stryMutAct_9fa48("3395") ? `` : (stryCov_9fa48("3395"), `Error signing with derived keys: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Get signing credential by address
   */
  getSigningCredential(address: string): NostrSigningCredential | undefined {
    if (stryMutAct_9fa48("3396")) {
      {}
    } else {
      stryCov_9fa48("3396");
      return this.assertSigner().getCredential(address);
    }
  }

  /**
   * List all signing credentials
   */
  listSigningCredentials(): NostrSigningCredential[] {
    if (stryMutAct_9fa48("3397")) {
      {}
    } else {
      stryCov_9fa48("3397");
      return this.assertSigner().listCredentials();
    }
  }

  /**
   * Remove a signing credential
   */
  removeSigningCredential(address: string): boolean {
    if (stryMutAct_9fa48("3398")) {
      {}
    } else {
      stryCov_9fa48("3398");
      return this.assertSigner().removeCredential(address);
    }
  }

  // === CONSISTENCY METHODS ===

  /**
   * Creates a Gun user from Nostr signing credential
   * This ensures the SAME user is created as with normal approach
   */
  async createGunUserFromSigningCredential(address: string): Promise<{
    success: boolean;
    userPub?: string;
    error?: string;
  }> {
    if (stryMutAct_9fa48("3399")) {
      {}
    } else {
      stryCov_9fa48("3399");
      try {
        if (stryMutAct_9fa48("3400")) {
          {}
        } else {
          stryCov_9fa48("3400");
          const core = this.assertInitialized();
          return await this.assertSigner().createGunUser(address, core.gun);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3401")) {
          {}
        } else {
          stryCov_9fa48("3401");
          console.error(stryMutAct_9fa48("3402") ? `` : (stryCov_9fa48("3402"), `Error creating Gun user from Nostr signing credential: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Get the Gun user public key for a signing credential
   */
  getGunUserPubFromSigningCredential(address: string): string | undefined {
    if (stryMutAct_9fa48("3403")) {
      {}
    } else {
      stryCov_9fa48("3403");
      return this.assertSigner().getGunUserPub(address);
    }
  }

  /**
   * Get the password (for consistency checking)
   */
  getPassword(address: string): string | undefined {
    if (stryMutAct_9fa48("3404")) {
      {}
    } else {
      stryCov_9fa48("3404");
      return this.assertSigner().getPassword(address);
    }
  }

  /**
   * Verify consistency between oneshot and normal approaches
   * This ensures both approaches create the same Gun user
   */
  async verifyConsistency(address: string, expectedUserPub?: string): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }> {
    if (stryMutAct_9fa48("3405")) {
      {}
    } else {
      stryCov_9fa48("3405");
      try {
        if (stryMutAct_9fa48("3406")) {
          {}
        } else {
          stryCov_9fa48("3406");
          return await this.assertSigner().verifyConsistency(address, expectedUserPub);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3407")) {
          {}
        } else {
          stryCov_9fa48("3407");
          console.error(stryMutAct_9fa48("3408") ? `` : (stryCov_9fa48("3408"), `Error verifying Nostr consistency: ${error.message}`));
          return stryMutAct_9fa48("3409") ? {} : (stryCov_9fa48("3409"), {
            consistent: stryMutAct_9fa48("3410") ? true : (stryCov_9fa48("3410"), false)
          });
        }
      }
    }
  }

  /**
   * Complete oneshot workflow that creates the SAME Gun user as normal approach
   * This is the recommended method for oneshot signing with full consistency
   */
  async setupConsistentOneshotSigning(address: string): Promise<{
    credential: NostrSigningCredential;
    authenticator: (data: any) => Promise<string>;
    gunUser: {
      success: boolean;
      userPub?: string;
      error?: string;
    };
    username: string;
    password: string;
  }> {
    if (stryMutAct_9fa48("3411")) {
      {}
    } else {
      stryCov_9fa48("3411");
      try {
        if (stryMutAct_9fa48("3412")) {
          {}
        } else {
          stryCov_9fa48("3412");
          // 1. Create signing credential (with consistent password generation)
          const credential = await this.createSigningCredential(address);

          // 2. Create authenticator
          const authenticator = this.createAuthenticator(address);

          // 3. Create Gun user (same as normal approach)
          const gunUser = await this.createGunUserFromSigningCredential(address);
          return stryMutAct_9fa48("3413") ? {} : (stryCov_9fa48("3413"), {
            credential,
            authenticator,
            gunUser,
            username: credential.username,
            password: credential.password
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3414")) {
          {}
        } else {
          stryCov_9fa48("3414");
          console.error(stryMutAct_9fa48("3415") ? `` : (stryCov_9fa48("3415"), `Error setting up consistent Nostr oneshot signing: ${error.message}`));
          throw error;
        }
      }
    }
  }

  // === EXISTING METHODS ===

  /**
   * Login with Bitcoin wallet
   * @param address - Bitcoin address
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates the user using Bitcoin wallet credentials after signature verification
   */
  async login(address: string): Promise<AuthResult> {
    if (stryMutAct_9fa48("3416")) {
      {}
    } else {
      stryCov_9fa48("3416");
      try {
        if (stryMutAct_9fa48("3417")) {
          {}
        } else {
          stryCov_9fa48("3417");
          const core = this.assertInitialized();
          if (stryMutAct_9fa48("3420") ? false : stryMutAct_9fa48("3419") ? true : stryMutAct_9fa48("3418") ? address : (stryCov_9fa48("3418", "3419", "3420"), !address)) {
            if (stryMutAct_9fa48("3421")) {
              {}
            } else {
              stryCov_9fa48("3421");
              throw createError(ErrorType.VALIDATION, stryMutAct_9fa48("3422") ? "" : (stryCov_9fa48("3422"), "ADDRESS_REQUIRED"), stryMutAct_9fa48("3423") ? "" : (stryCov_9fa48("3423"), "Bitcoin address required for login"));
            }
          }
          if (stryMutAct_9fa48("3426") ? false : stryMutAct_9fa48("3425") ? true : stryMutAct_9fa48("3424") ? this.isAvailable() : (stryCov_9fa48("3424", "3425", "3426"), !this.isAvailable())) {
            if (stryMutAct_9fa48("3427")) {
              {}
            } else {
              stryCov_9fa48("3427");
              throw createError(ErrorType.ENVIRONMENT, stryMutAct_9fa48("3428") ? "" : (stryCov_9fa48("3428"), "BITCOIN_WALLET_UNAVAILABLE"), stryMutAct_9fa48("3429") ? "" : (stryCov_9fa48("3429"), "No Bitcoin wallet available in the browser"));
            }
          }
          const message = MESSAGE_TO_SIGN;
          const signature = await this.assertBitcoinConnector().requestSignature(address, message);
          const credentials = await this.generateCredentials(address, signature, message);
          if (stryMutAct_9fa48("3432") ? (!credentials?.username || !credentials?.key || !credentials.message) && !credentials.signature : stryMutAct_9fa48("3431") ? false : stryMutAct_9fa48("3430") ? true : (stryCov_9fa48("3430", "3431", "3432"), (stryMutAct_9fa48("3434") ? (!credentials?.username || !credentials?.key) && !credentials.message : stryMutAct_9fa48("3433") ? false : (stryCov_9fa48("3433", "3434"), (stryMutAct_9fa48("3436") ? !credentials?.username && !credentials?.key : stryMutAct_9fa48("3435") ? false : (stryCov_9fa48("3435", "3436"), (stryMutAct_9fa48("3437") ? credentials?.username : (stryCov_9fa48("3437"), !(stryMutAct_9fa48("3438") ? credentials.username : (stryCov_9fa48("3438"), credentials?.username)))) || (stryMutAct_9fa48("3439") ? credentials?.key : (stryCov_9fa48("3439"), !(stryMutAct_9fa48("3440") ? credentials.key : (stryCov_9fa48("3440"), credentials?.key)))))) || (stryMutAct_9fa48("3441") ? credentials.message : (stryCov_9fa48("3441"), !credentials.message)))) || (stryMutAct_9fa48("3442") ? credentials.signature : (stryCov_9fa48("3442"), !credentials.signature)))) {
            if (stryMutAct_9fa48("3443")) {
              {}
            } else {
              stryCov_9fa48("3443");
              throw createError(ErrorType.AUTHENTICATION, stryMutAct_9fa48("3444") ? "" : (stryCov_9fa48("3444"), "CREDENTIAL_GENERATION_FAILED"), stryMutAct_9fa48("3445") ? "" : (stryCov_9fa48("3445"), "Bitcoin wallet credentials not generated correctly or signature missing"));
            }
          }
          const isValid = await this.verifySignature(credentials.message, credentials.signature, address);
          if (stryMutAct_9fa48("3448") ? false : stryMutAct_9fa48("3447") ? true : stryMutAct_9fa48("3446") ? isValid : (stryCov_9fa48("3446", "3447", "3448"), !isValid)) {
            if (stryMutAct_9fa48("3449")) {
              {}
            } else {
              stryCov_9fa48("3449");
              console.error(stryMutAct_9fa48("3450") ? `` : (stryCov_9fa48("3450"), `Signature verification failed for address: ${address}`));
              throw createError(ErrorType.SECURITY, stryMutAct_9fa48("3451") ? "" : (stryCov_9fa48("3451"), "SIGNATURE_VERIFICATION_FAILED"), stryMutAct_9fa48("3452") ? "" : (stryCov_9fa48("3452"), "Bitcoin wallet signature verification failed"));
            }
          }

          // Deriva le chiavi da address, signature, message
          const k = await deriveNostrKeys(address, signature, message);

          // Set authentication method to nostr before login
          core.setAuthMethod(stryMutAct_9fa48("3453") ? "" : (stryCov_9fa48("3453"), "nostr"));

          // Usa le chiavi derivate per login
          const loginResult = await core.login(credentials.username, stryMutAct_9fa48("3454") ? "Stryker was here!" : (stryCov_9fa48("3454"), ""), k);
          if (stryMutAct_9fa48("3457") ? false : stryMutAct_9fa48("3456") ? true : stryMutAct_9fa48("3455") ? loginResult.success : (stryCov_9fa48("3455", "3456", "3457"), !loginResult.success)) {
            if (stryMutAct_9fa48("3458")) {
              {}
            } else {
              stryCov_9fa48("3458");
              throw createError(ErrorType.AUTHENTICATION, stryMutAct_9fa48("3459") ? "" : (stryCov_9fa48("3459"), "BITCOIN_LOGIN_FAILED"), stryMutAct_9fa48("3462") ? loginResult.error && "Failed to log in with Bitcoin credentials" : stryMutAct_9fa48("3461") ? false : stryMutAct_9fa48("3460") ? true : (stryCov_9fa48("3460", "3461", "3462"), loginResult.error || (stryMutAct_9fa48("3463") ? "" : (stryCov_9fa48("3463"), "Failed to log in with Bitcoin credentials"))));
            }
          }

          // Emit login event
          core.emit(stryMutAct_9fa48("3464") ? "" : (stryCov_9fa48("3464"), "auth:login"), stryMutAct_9fa48("3465") ? {} : (stryCov_9fa48("3465"), {
            userPub: stryMutAct_9fa48("3468") ? loginResult.userPub && "" : stryMutAct_9fa48("3467") ? false : stryMutAct_9fa48("3466") ? true : (stryCov_9fa48("3466", "3467", "3468"), loginResult.userPub || (stryMutAct_9fa48("3469") ? "Stryker was here!" : (stryCov_9fa48("3469"), ""))),
            username: credentials.username,
            method: stryMutAct_9fa48("3470") ? "" : (stryCov_9fa48("3470"), "bitcoin")
          }));
          return loginResult;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3471")) {
          {}
        } else {
          stryCov_9fa48("3471");
          // Handle both ShogunError and generic errors
          const errorType = stryMutAct_9fa48("3474") ? error?.type && ErrorType.AUTHENTICATION : stryMutAct_9fa48("3473") ? false : stryMutAct_9fa48("3472") ? true : (stryCov_9fa48("3472", "3473", "3474"), (stryMutAct_9fa48("3475") ? error.type : (stryCov_9fa48("3475"), error?.type)) || ErrorType.AUTHENTICATION);
          const errorCode = stryMutAct_9fa48("3478") ? error?.code && "BITCOIN_LOGIN_ERROR" : stryMutAct_9fa48("3477") ? false : stryMutAct_9fa48("3476") ? true : (stryCov_9fa48("3476", "3477", "3478"), (stryMutAct_9fa48("3479") ? error.code : (stryCov_9fa48("3479"), error?.code)) || (stryMutAct_9fa48("3480") ? "" : (stryCov_9fa48("3480"), "BITCOIN_LOGIN_ERROR")));
          const errorMessage = stryMutAct_9fa48("3483") ? error?.message && "Unknown error during Bitcoin wallet login" : stryMutAct_9fa48("3482") ? false : stryMutAct_9fa48("3481") ? true : (stryCov_9fa48("3481", "3482", "3483"), (stryMutAct_9fa48("3484") ? error.message : (stryCov_9fa48("3484"), error?.message)) || (stryMutAct_9fa48("3485") ? "" : (stryCov_9fa48("3485"), "Unknown error during Bitcoin wallet login")));
          const handledError = ErrorHandler.handle(errorType, errorCode, errorMessage, error);
          return stryMutAct_9fa48("3486") ? {} : (stryCov_9fa48("3486"), {
            success: stryMutAct_9fa48("3487") ? true : (stryCov_9fa48("3487"), false),
            error: handledError.message
          });
        }
      }
    }
  }

  /**
   * Register new user with Nostr wallet
   * @param address - Nostr address
   * @returns {Promise<SignUpResult>} Registration result
   */
  async signUp(address: string): Promise<SignUpResult> {
    if (stryMutAct_9fa48("3488")) {
      {}
    } else {
      stryCov_9fa48("3488");
      try {
        if (stryMutAct_9fa48("3489")) {
          {}
        } else {
          stryCov_9fa48("3489");
          const core = this.assertInitialized();
          if (stryMutAct_9fa48("3492") ? false : stryMutAct_9fa48("3491") ? true : stryMutAct_9fa48("3490") ? address : (stryCov_9fa48("3490", "3491", "3492"), !address)) {
            if (stryMutAct_9fa48("3493")) {
              {}
            } else {
              stryCov_9fa48("3493");
              throw createError(ErrorType.VALIDATION, stryMutAct_9fa48("3494") ? "" : (stryCov_9fa48("3494"), "ADDRESS_REQUIRED"), stryMutAct_9fa48("3495") ? "" : (stryCov_9fa48("3495"), "Bitcoin address required for signup"));
            }
          }
          if (stryMutAct_9fa48("3498") ? false : stryMutAct_9fa48("3497") ? true : stryMutAct_9fa48("3496") ? this.isAvailable() : (stryCov_9fa48("3496", "3497", "3498"), !this.isAvailable())) {
            if (stryMutAct_9fa48("3499")) {
              {}
            } else {
              stryCov_9fa48("3499");
              throw createError(ErrorType.ENVIRONMENT, stryMutAct_9fa48("3500") ? "" : (stryCov_9fa48("3500"), "BITCOIN_WALLET_UNAVAILABLE"), stryMutAct_9fa48("3501") ? "" : (stryCov_9fa48("3501"), "No Bitcoin wallet available in the browser"));
            }
          }
          const message = MESSAGE_TO_SIGN;
          const signature = await this.assertBitcoinConnector().requestSignature(address, message);
          const credentials = await this.generateCredentials(address, signature, message);
          if (stryMutAct_9fa48("3504") ? (!credentials?.username || !credentials?.key || !credentials.message) && !credentials.signature : stryMutAct_9fa48("3503") ? false : stryMutAct_9fa48("3502") ? true : (stryCov_9fa48("3502", "3503", "3504"), (stryMutAct_9fa48("3506") ? (!credentials?.username || !credentials?.key) && !credentials.message : stryMutAct_9fa48("3505") ? false : (stryCov_9fa48("3505", "3506"), (stryMutAct_9fa48("3508") ? !credentials?.username && !credentials?.key : stryMutAct_9fa48("3507") ? false : (stryCov_9fa48("3507", "3508"), (stryMutAct_9fa48("3509") ? credentials?.username : (stryCov_9fa48("3509"), !(stryMutAct_9fa48("3510") ? credentials.username : (stryCov_9fa48("3510"), credentials?.username)))) || (stryMutAct_9fa48("3511") ? credentials?.key : (stryCov_9fa48("3511"), !(stryMutAct_9fa48("3512") ? credentials.key : (stryCov_9fa48("3512"), credentials?.key)))))) || (stryMutAct_9fa48("3513") ? credentials.message : (stryCov_9fa48("3513"), !credentials.message)))) || (stryMutAct_9fa48("3514") ? credentials.signature : (stryCov_9fa48("3514"), !credentials.signature)))) {
            if (stryMutAct_9fa48("3515")) {
              {}
            } else {
              stryCov_9fa48("3515");
              throw createError(ErrorType.AUTHENTICATION, stryMutAct_9fa48("3516") ? "" : (stryCov_9fa48("3516"), "CREDENTIAL_GENERATION_FAILED"), stryMutAct_9fa48("3517") ? "" : (stryCov_9fa48("3517"), "Bitcoin wallet credentials not generated correctly or signature missing"));
            }
          }

          // Verify signature
          const isValid = await this.verifySignature(credentials.message, credentials.signature, address);
          if (stryMutAct_9fa48("3520") ? false : stryMutAct_9fa48("3519") ? true : stryMutAct_9fa48("3518") ? isValid : (stryCov_9fa48("3518", "3519", "3520"), !isValid)) {
            if (stryMutAct_9fa48("3521")) {
              {}
            } else {
              stryCov_9fa48("3521");
              console.error(stryMutAct_9fa48("3522") ? `` : (stryCov_9fa48("3522"), `Signature verification failed for address: ${address}`));
              throw createError(ErrorType.SECURITY, stryMutAct_9fa48("3523") ? "" : (stryCov_9fa48("3523"), "SIGNATURE_VERIFICATION_FAILED"), stryMutAct_9fa48("3524") ? "" : (stryCov_9fa48("3524"), "Bitcoin wallet signature verification failed"));
            }
          }

          // Deriva le chiavi da address, signature, message
          const k = await deriveNostrKeys(address, signature, message);

          // Set authentication method to nostr before signup
          core.setAuthMethod(stryMutAct_9fa48("3525") ? "" : (stryCov_9fa48("3525"), "nostr"));

          // Usa le chiavi derivate per signup
          const signupResult = await core.signUp(credentials.username, stryMutAct_9fa48("3526") ? "Stryker was here!" : (stryCov_9fa48("3526"), ""), stryMutAct_9fa48("3527") ? "Stryker was here!" : (stryCov_9fa48("3527"), ""), k);
          if (stryMutAct_9fa48("3529") ? false : stryMutAct_9fa48("3528") ? true : (stryCov_9fa48("3528", "3529"), signupResult.success)) {
            if (stryMutAct_9fa48("3530")) {
              {}
            } else {
              stryCov_9fa48("3530");
              // Dopo la creazione, autentica subito
              const authResult = await core.login(credentials.username, stryMutAct_9fa48("3531") ? "Stryker was here!" : (stryCov_9fa48("3531"), ""), k);
              if (stryMutAct_9fa48("3533") ? false : stryMutAct_9fa48("3532") ? true : (stryCov_9fa48("3532", "3533"), authResult.success)) {
                if (stryMutAct_9fa48("3534")) {
                  {}
                } else {
                  stryCov_9fa48("3534");
                  console.log(stryMutAct_9fa48("3535") ? `` : (stryCov_9fa48("3535"), `Bitcoin wallet registration and login completed for user: ${credentials.username}`));
                  // Emetti eventi
                  core.emit(stryMutAct_9fa48("3536") ? "" : (stryCov_9fa48("3536"), "auth:signup"), stryMutAct_9fa48("3537") ? {} : (stryCov_9fa48("3537"), {
                    userPub: stryMutAct_9fa48("3540") ? authResult.userPub && "" : stryMutAct_9fa48("3539") ? false : stryMutAct_9fa48("3538") ? true : (stryCov_9fa48("3538", "3539", "3540"), authResult.userPub || (stryMutAct_9fa48("3541") ? "Stryker was here!" : (stryCov_9fa48("3541"), ""))),
                    username: credentials.username,
                    method: stryMutAct_9fa48("3542") ? "" : (stryCov_9fa48("3542"), "bitcoin")
                  }));
                  return stryMutAct_9fa48("3543") ? {} : (stryCov_9fa48("3543"), {
                    ...authResult
                  });
                }
              } else {
                if (stryMutAct_9fa48("3544")) {
                  {}
                } else {
                  stryCov_9fa48("3544");
                  return stryMutAct_9fa48("3545") ? {} : (stryCov_9fa48("3545"), {
                    ...signupResult,
                    error: stryMutAct_9fa48("3546") ? "" : (stryCov_9fa48("3546"), "User created but login failed")
                  });
                }
              }
            }
          } else {
            if (stryMutAct_9fa48("3547")) {
              {}
            } else {
              stryCov_9fa48("3547");
              // Se l'errore è che l'utente esiste già, prova direttamente l'auth
              if (stryMutAct_9fa48("3550") ? signupResult.error || signupResult.error.toLowerCase().includes("exist") : stryMutAct_9fa48("3549") ? false : stryMutAct_9fa48("3548") ? true : (stryCov_9fa48("3548", "3549", "3550"), signupResult.error && (stryMutAct_9fa48("3551") ? signupResult.error.toUpperCase().includes("exist") : (stryCov_9fa48("3551"), signupResult.error.toLowerCase().includes(stryMutAct_9fa48("3552") ? "" : (stryCov_9fa48("3552"), "exist")))))) {
                if (stryMutAct_9fa48("3553")) {
                  {}
                } else {
                  stryCov_9fa48("3553");
                  const authResult = await core.login(credentials.username, stryMutAct_9fa48("3554") ? "Stryker was here!" : (stryCov_9fa48("3554"), ""), k);
                  return stryMutAct_9fa48("3555") ? {} : (stryCov_9fa48("3555"), {
                    ...authResult
                  });
                }
              }
              return signupResult;
            }
          }
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3556")) {
          {}
        } else {
          stryCov_9fa48("3556");
          // Handle both ShogunError and generic errors
          const errorType = stryMutAct_9fa48("3559") ? error?.type && ErrorType.AUTHENTICATION : stryMutAct_9fa48("3558") ? false : stryMutAct_9fa48("3557") ? true : (stryCov_9fa48("3557", "3558", "3559"), (stryMutAct_9fa48("3560") ? error.type : (stryCov_9fa48("3560"), error?.type)) || ErrorType.AUTHENTICATION);
          const errorCode = stryMutAct_9fa48("3563") ? error?.code && "BITCOIN_SIGNUP_ERROR" : stryMutAct_9fa48("3562") ? false : stryMutAct_9fa48("3561") ? true : (stryCov_9fa48("3561", "3562", "3563"), (stryMutAct_9fa48("3564") ? error.code : (stryCov_9fa48("3564"), error?.code)) || (stryMutAct_9fa48("3565") ? "" : (stryCov_9fa48("3565"), "BITCOIN_SIGNUP_ERROR")));
          const errorMessage = stryMutAct_9fa48("3568") ? error?.message && "Unknown error during Bitcoin wallet signup" : stryMutAct_9fa48("3567") ? false : stryMutAct_9fa48("3566") ? true : (stryCov_9fa48("3566", "3567", "3568"), (stryMutAct_9fa48("3569") ? error.message : (stryCov_9fa48("3569"), error?.message)) || (stryMutAct_9fa48("3570") ? "" : (stryCov_9fa48("3570"), "Unknown error during Bitcoin wallet signup")));
          const handledError = ErrorHandler.handle(errorType, errorCode, errorMessage, error);
          return stryMutAct_9fa48("3571") ? {} : (stryCov_9fa48("3571"), {
            success: stryMutAct_9fa48("3572") ? true : (stryCov_9fa48("3572"), false),
            error: handledError.message
          });
        }
      }
    }
  }

  /**
   * Convenience method that matches the interface pattern
   */
  async loginWithBitcoinWallet(address: string): Promise<AuthResult> {
    if (stryMutAct_9fa48("3573")) {
      {}
    } else {
      stryCov_9fa48("3573");
      return this.login(address);
    }
  }

  /**
   * Convenience method that matches the interface pattern
   */
  async signUpWithBitcoinWallet(address: string): Promise<AuthResult> {
    if (stryMutAct_9fa48("3574")) {
      {}
    } else {
      stryCov_9fa48("3574");
      return this.signUp(address);
    }
  }
}