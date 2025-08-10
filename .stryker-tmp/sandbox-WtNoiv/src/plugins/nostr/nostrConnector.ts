/**
 * The BitcoinWallet class provides functionality for connecting, signing up, and logging in using Bitcoin wallets.
 * Supports Alby and Nostr extensions, as well as manual key management.
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
import { ethers } from "ethers";
import { verifyEvent, finalizeEvent, utils as nostrUtils, getEventHash } from "nostr-tools";
import type { Event } from "nostr-tools";
import { EventEmitter } from "../../utils/eventEmitter";
import { ConnectionResult, AlbyProvider, NostrProvider, SignatureCache, NostrConnectorConfig, NostrConnectorKeyPair } from "./types";
import derive from "../../gundb/derive";
import { generateUsernameFromIdentity } from "../../utils/validation";

// Extend the Window interface to include bitcoin wallet providers
declare global {
  interface Window {
    alby?: AlbyProvider;
    nostr?: NostrProvider;
    NostrConnector?: typeof NostrConnector;
  }
}
export const MESSAGE_TO_SIGN = stryMutAct_9fa48("3029") ? "" : (stryCov_9fa48("3029"), "I Love Shogun!");

/**
 * Class for Bitcoin wallet connections and operations
 */
class NostrConnector extends EventEmitter {
  private readonly DEFAULT_CONFIG: NostrConnectorConfig = stryMutAct_9fa48("3030") ? {} : (stryCov_9fa48("3030"), {
    cacheDuration: stryMutAct_9fa48("3031") ? 24 * 60 * 60 / 1000 : (stryCov_9fa48("3031"), (stryMutAct_9fa48("3032") ? 24 * 60 / 60 : (stryCov_9fa48("3032"), (stryMutAct_9fa48("3033") ? 24 / 60 : (stryCov_9fa48("3033"), 24 * 60)) * 60)) * 1000),
    // 24 hours instead of 30 minutes for better UX
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 60000,
    network: stryMutAct_9fa48("3034") ? "" : (stryCov_9fa48("3034"), "mainnet"),
    useApi: stryMutAct_9fa48("3035") ? true : (stryCov_9fa48("3035"), false)
  });
  private readonly config: NostrConnectorConfig;
  private readonly signatureCache: Map<string, SignatureCache> = new Map();

  // Connection state
  private connectedAddress: string | null = null;
  private connectedType: "alby" | "nostr" | "manual" | null = null;
  private manualKeyPair: NostrConnectorKeyPair | null = null;
  constructor(config: Partial<NostrConnectorConfig> = {}) {
    super();
    this.config = stryMutAct_9fa48("3036") ? {} : (stryCov_9fa48("3036"), {
      ...this.DEFAULT_CONFIG,
      ...config
    });
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Currently no global events to listen to
    // This would be the place to add listeners for wallet connections/disconnections
  }

  /**
   * Clear signature cache for a specific address or all addresses
   */
  public clearSignatureCache(address?: string): void {
    if (stryMutAct_9fa48("3037")) {
      {}
    } else {
      stryCov_9fa48("3037");
      if (stryMutAct_9fa48("3039") ? false : stryMutAct_9fa48("3038") ? true : (stryCov_9fa48("3038", "3039"), address)) {
        if (stryMutAct_9fa48("3040")) {
          {}
        } else {
          stryCov_9fa48("3040");
          // Clear cache for specific address
          this.signatureCache.delete(address);
          try {
            if (stryMutAct_9fa48("3041")) {
              {}
            } else {
              stryCov_9fa48("3041");
              const localStorageKey = stryMutAct_9fa48("3042") ? `` : (stryCov_9fa48("3042"), `shogun_bitcoin_sig_${address}`);
              localStorage.removeItem(localStorageKey);
              console.log(stryMutAct_9fa48("3043") ? `` : (stryCov_9fa48("3043"), `Cleared signature cache for address: ${stryMutAct_9fa48("3044") ? address : (stryCov_9fa48("3044"), address.substring(0, 10))}...`));
            }
          } catch (error) {
            if (stryMutAct_9fa48("3045")) {
              {}
            } else {
              stryCov_9fa48("3045");
              console.error(stryMutAct_9fa48("3046") ? "" : (stryCov_9fa48("3046"), "Error clearing signature cache from localStorage:"), error);
            }
          }
        }
      } else {
        if (stryMutAct_9fa48("3047")) {
          {}
        } else {
          stryCov_9fa48("3047");
          // Clear all signature caches
          this.signatureCache.clear();
          try {
            if (stryMutAct_9fa48("3048")) {
              {}
            } else {
              stryCov_9fa48("3048");
              // Find and remove all shogun_bitcoin_sig_ keys
              const keysToRemove: string[] = stryMutAct_9fa48("3049") ? ["Stryker was here"] : (stryCov_9fa48("3049"), []);
              for (let i = 0; stryMutAct_9fa48("3052") ? i >= localStorage.length : stryMutAct_9fa48("3051") ? i <= localStorage.length : stryMutAct_9fa48("3050") ? false : (stryCov_9fa48("3050", "3051", "3052"), i < localStorage.length); stryMutAct_9fa48("3053") ? i-- : (stryCov_9fa48("3053"), i++)) {
                if (stryMutAct_9fa48("3054")) {
                  {}
                } else {
                  stryCov_9fa48("3054");
                  const key = localStorage.key(i);
                  if (stryMutAct_9fa48("3057") ? key || key.startsWith("shogun_bitcoin_sig_") : stryMutAct_9fa48("3056") ? false : stryMutAct_9fa48("3055") ? true : (stryCov_9fa48("3055", "3056", "3057"), key && (stryMutAct_9fa48("3058") ? key.endsWith("shogun_bitcoin_sig_") : (stryCov_9fa48("3058"), key.startsWith(stryMutAct_9fa48("3059") ? "" : (stryCov_9fa48("3059"), "shogun_bitcoin_sig_")))))) {
                    if (stryMutAct_9fa48("3060")) {
                      {}
                    } else {
                      stryCov_9fa48("3060");
                      keysToRemove.push(key);
                    }
                  }
                }
              }
              keysToRemove.forEach(stryMutAct_9fa48("3061") ? () => undefined : (stryCov_9fa48("3061"), key => localStorage.removeItem(key)));
              console.log(stryMutAct_9fa48("3062") ? `` : (stryCov_9fa48("3062"), `Cleared all signature caches (${keysToRemove.length} entries)`));
            }
          } catch (error) {
            if (stryMutAct_9fa48("3063")) {
              {}
            } else {
              stryCov_9fa48("3063");
              console.error(stryMutAct_9fa48("3064") ? "" : (stryCov_9fa48("3064"), "Error clearing all signature caches from localStorage:"), error);
            }
          }
        }
      }
    }
  }

  /**
   * Check if Nostr extension is available
   */
  public isNostrExtensionAvailable(): boolean {
    if (stryMutAct_9fa48("3065")) {
      {}
    } else {
      stryCov_9fa48("3065");
      return stryMutAct_9fa48("3068") ? typeof window !== "undefined" || !!window.nostr : stryMutAct_9fa48("3067") ? false : stryMutAct_9fa48("3066") ? true : (stryCov_9fa48("3066", "3067", "3068"), (stryMutAct_9fa48("3070") ? typeof window === "undefined" : stryMutAct_9fa48("3069") ? true : (stryCov_9fa48("3069", "3070"), typeof window !== (stryMutAct_9fa48("3071") ? "" : (stryCov_9fa48("3071"), "undefined")))) && (stryMutAct_9fa48("3072") ? !window.nostr : (stryCov_9fa48("3072"), !(stryMutAct_9fa48("3073") ? window.nostr : (stryCov_9fa48("3073"), !window.nostr)))));
    }
  }

  /**
   * Check if any Bitcoin wallet is available
   */
  public isAvailable(): boolean {
    if (stryMutAct_9fa48("3074")) {
      {}
    } else {
      stryCov_9fa48("3074");
      return stryMutAct_9fa48("3077") ? this.isNostrExtensionAvailable() && this.manualKeyPair !== null : stryMutAct_9fa48("3076") ? false : stryMutAct_9fa48("3075") ? true : (stryCov_9fa48("3075", "3076", "3077"), this.isNostrExtensionAvailable() || (stryMutAct_9fa48("3079") ? this.manualKeyPair === null : stryMutAct_9fa48("3078") ? false : (stryCov_9fa48("3078", "3079"), this.manualKeyPair !== null)));
    }
  }

  /**
   * Connect to a wallet type
   */
  async connectWallet(type: "alby" | "nostr" | "manual" = stryMutAct_9fa48("3080") ? "" : (stryCov_9fa48("3080"), "nostr")): Promise<ConnectionResult> {
    if (stryMutAct_9fa48("3081")) {
      {}
    } else {
      stryCov_9fa48("3081");
      console.log(stryMutAct_9fa48("3082") ? `` : (stryCov_9fa48("3082"), `Connecting to Bitcoin wallet via ${type}...`));
      try {
        if (stryMutAct_9fa48("3083")) {
          {}
        } else {
          stryCov_9fa48("3083");
          let result: ConnectionResult;

          // Attempt to connect to the specified wallet type
          switch (type) {
            case stryMutAct_9fa48("3085") ? "" : (stryCov_9fa48("3085"), "alby"):
              if (stryMutAct_9fa48("3084")) {} else {
                stryCov_9fa48("3084");
                console.log(stryMutAct_9fa48("3086") ? "" : (stryCov_9fa48("3086"), "[nostrConnector] Alby is deprecated, redirecting to Nostr"));
                result = await this.connectNostr();
                break;
              }
            case stryMutAct_9fa48("3088") ? "" : (stryCov_9fa48("3088"), "nostr"):
              if (stryMutAct_9fa48("3087")) {} else {
                stryCov_9fa48("3087");
                result = await this.connectNostr();
                break;
              }
            case stryMutAct_9fa48("3090") ? "" : (stryCov_9fa48("3090"), "manual"):
              if (stryMutAct_9fa48("3089")) {} else {
                stryCov_9fa48("3089");
                result = await this.connectManual();
                break;
              }
            default:
              if (stryMutAct_9fa48("3091")) {} else {
                stryCov_9fa48("3091");
                throw new Error(stryMutAct_9fa48("3092") ? `` : (stryCov_9fa48("3092"), `Unsupported wallet type: ${type}`));
              }
          }
          if (stryMutAct_9fa48("3095") ? result.success || result.address : stryMutAct_9fa48("3094") ? false : stryMutAct_9fa48("3093") ? true : (stryCov_9fa48("3093", "3094", "3095"), result.success && result.address)) {
            if (stryMutAct_9fa48("3096")) {
              {}
            } else {
              stryCov_9fa48("3096");
              this.connectedAddress = result.address;
              this.connectedType = type;
              console.log(stryMutAct_9fa48("3097") ? `` : (stryCov_9fa48("3097"), `Successfully connected to ${type} wallet: ${result.address}`));
              this.emit(stryMutAct_9fa48("3098") ? "" : (stryCov_9fa48("3098"), "wallet_connected"), stryMutAct_9fa48("3099") ? {} : (stryCov_9fa48("3099"), {
                address: result.address,
                type: this.connectedType
              }));
            }
          }
          return result;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3100")) {
          {}
        } else {
          stryCov_9fa48("3100");
          console.error(stryMutAct_9fa48("3101") ? `` : (stryCov_9fa48("3101"), `Error connecting to ${type} wallet:`), error);
          return stryMutAct_9fa48("3102") ? {} : (stryCov_9fa48("3102"), {
            success: stryMutAct_9fa48("3103") ? true : (stryCov_9fa48("3103"), false),
            error: stryMutAct_9fa48("3106") ? error.message && "Failed to connect to wallet" : stryMutAct_9fa48("3105") ? false : stryMutAct_9fa48("3104") ? true : (stryCov_9fa48("3104", "3105", "3106"), error.message || (stryMutAct_9fa48("3107") ? "" : (stryCov_9fa48("3107"), "Failed to connect to wallet")))
          });
        }
      }
    }
  }

  /**
   * Connect to Nostr extension
   */
  private async connectNostr(): Promise<ConnectionResult> {
    if (stryMutAct_9fa48("3108")) {
      {}
    } else {
      stryCov_9fa48("3108");
      if (stryMutAct_9fa48("3111") ? false : stryMutAct_9fa48("3110") ? true : stryMutAct_9fa48("3109") ? this.isNostrExtensionAvailable() : (stryCov_9fa48("3109", "3110", "3111"), !this.isNostrExtensionAvailable())) {
        if (stryMutAct_9fa48("3112")) {
          {}
        } else {
          stryCov_9fa48("3112");
          return stryMutAct_9fa48("3113") ? {} : (stryCov_9fa48("3113"), {
            success: stryMutAct_9fa48("3114") ? true : (stryCov_9fa48("3114"), false),
            error: stryMutAct_9fa48("3115") ? "" : (stryCov_9fa48("3115"), "Nostr extension is not available. Please install a Nostr compatible extension like nos2x, Alby, or Coracle.")
          });
        }
      }
      try {
        if (stryMutAct_9fa48("3116")) {
          {}
        } else {
          stryCov_9fa48("3116");
          console.log(stryMutAct_9fa48("3117") ? "" : (stryCov_9fa48("3117"), "[nostrConnector] Attempting to connect to Nostr extension..."));

          // Get public key from Nostr extension
          const pubKey = await window.nostr!.getPublicKey();
          if (stryMutAct_9fa48("3120") ? false : stryMutAct_9fa48("3119") ? true : stryMutAct_9fa48("3118") ? pubKey : (stryCov_9fa48("3118", "3119", "3120"), !pubKey)) {
            if (stryMutAct_9fa48("3121")) {
              {}
            } else {
              stryCov_9fa48("3121");
              throw new Error(stryMutAct_9fa48("3122") ? "" : (stryCov_9fa48("3122"), "Could not get public key from Nostr extension"));
            }
          }
          console.log(stryMutAct_9fa48("3123") ? `` : (stryCov_9fa48("3123"), `[nostrConnector] Successfully connected to Nostr extension: ${stryMutAct_9fa48("3124") ? pubKey : (stryCov_9fa48("3124"), pubKey.substring(0, 10))}...`));
          this.connectedAddress = pubKey;
          this.connectedType = stryMutAct_9fa48("3125") ? "" : (stryCov_9fa48("3125"), "nostr");

          // Emit connected event
          this.emit(stryMutAct_9fa48("3126") ? "" : (stryCov_9fa48("3126"), "connected"), stryMutAct_9fa48("3127") ? {} : (stryCov_9fa48("3127"), {
            address: pubKey,
            type: stryMutAct_9fa48("3128") ? "" : (stryCov_9fa48("3128"), "nostr")
          }));
          const username = stryMutAct_9fa48("3129") ? `` : (stryCov_9fa48("3129"), `nostr_${stryMutAct_9fa48("3130") ? pubKey : (stryCov_9fa48("3130"), pubKey.substring(0, 10))}`);
          return stryMutAct_9fa48("3131") ? {} : (stryCov_9fa48("3131"), {
            success: stryMutAct_9fa48("3132") ? false : (stryCov_9fa48("3132"), true),
            address: pubKey,
            username,
            extensionType: stryMutAct_9fa48("3133") ? "" : (stryCov_9fa48("3133"), "nostr")
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3134")) {
          {}
        } else {
          stryCov_9fa48("3134");
          console.error(stryMutAct_9fa48("3135") ? "" : (stryCov_9fa48("3135"), "[nostrConnector] Nostr connection error:"), error);

          // Provide more specific error messages
          if (stryMutAct_9fa48("3138") ? error.message || error.message.includes("User rejected") : stryMutAct_9fa48("3137") ? false : stryMutAct_9fa48("3136") ? true : (stryCov_9fa48("3136", "3137", "3138"), error.message && error.message.includes(stryMutAct_9fa48("3139") ? "" : (stryCov_9fa48("3139"), "User rejected")))) {
            if (stryMutAct_9fa48("3140")) {
              {}
            } else {
              stryCov_9fa48("3140");
              throw new Error(stryMutAct_9fa48("3141") ? "" : (stryCov_9fa48("3141"), "Nostr connection was rejected by the user"));
            }
          } else if (stryMutAct_9fa48("3144") ? error.message || error.message.includes("not available") : stryMutAct_9fa48("3143") ? false : stryMutAct_9fa48("3142") ? true : (stryCov_9fa48("3142", "3143", "3144"), error.message && error.message.includes(stryMutAct_9fa48("3145") ? "" : (stryCov_9fa48("3145"), "not available")))) {
            if (stryMutAct_9fa48("3146")) {
              {}
            } else {
              stryCov_9fa48("3146");
              throw new Error(stryMutAct_9fa48("3147") ? "" : (stryCov_9fa48("3147"), "Nostr extension is not available or not properly installed"));
            }
          } else {
            if (stryMutAct_9fa48("3148")) {
              {}
            } else {
              stryCov_9fa48("3148");
              throw new Error(stryMutAct_9fa48("3149") ? `` : (stryCov_9fa48("3149"), `Nostr connection error: ${error.message}`));
            }
          }
        }
      }
    }
  }

  /**
   * Set up manual key pair for connection
   */
  private async connectManual(): Promise<ConnectionResult> {
    if (stryMutAct_9fa48("3150")) {
      {}
    } else {
      stryCov_9fa48("3150");
      // For manual connection, we'd need to have a keypair set
      if (stryMutAct_9fa48("3153") ? false : stryMutAct_9fa48("3152") ? true : stryMutAct_9fa48("3151") ? this.manualKeyPair : (stryCov_9fa48("3151", "3152", "3153"), !this.manualKeyPair)) {
        if (stryMutAct_9fa48("3154")) {
          {}
        } else {
          stryCov_9fa48("3154");
          return stryMutAct_9fa48("3155") ? {} : (stryCov_9fa48("3155"), {
            success: stryMutAct_9fa48("3156") ? true : (stryCov_9fa48("3156"), false),
            error: stryMutAct_9fa48("3157") ? "" : (stryCov_9fa48("3157"), "No manual key pair configured. Use setKeyPair() first.")
          });
        }
      }
      this.connectedAddress = this.manualKeyPair.address;
      this.connectedType = stryMutAct_9fa48("3158") ? "" : (stryCov_9fa48("3158"), "manual");

      // Emit connected event
      this.emit(stryMutAct_9fa48("3159") ? "" : (stryCov_9fa48("3159"), "connected"), stryMutAct_9fa48("3160") ? {} : (stryCov_9fa48("3160"), {
        address: this.manualKeyPair.address,
        type: stryMutAct_9fa48("3161") ? "" : (stryCov_9fa48("3161"), "manual")
      }));
      const username = stryMutAct_9fa48("3162") ? `` : (stryCov_9fa48("3162"), `btc_${stryMutAct_9fa48("3163") ? this.manualKeyPair.address : (stryCov_9fa48("3163"), this.manualKeyPair.address.substring(0, 10))}`);
      return stryMutAct_9fa48("3164") ? {} : (stryCov_9fa48("3164"), {
        success: stryMutAct_9fa48("3165") ? false : (stryCov_9fa48("3165"), true),
        address: this.manualKeyPair.address,
        username,
        extensionType: stryMutAct_9fa48("3166") ? "" : (stryCov_9fa48("3166"), "manual")
      });
    }
  }

  /**
   * Set a manual key pair for use
   */
  public setKeyPair(keyPair: NostrConnectorKeyPair): void {
    if (stryMutAct_9fa48("3167")) {
      {}
    } else {
      stryCov_9fa48("3167");
      this.manualKeyPair = keyPair;
      if (stryMutAct_9fa48("3169") ? false : stryMutAct_9fa48("3168") ? true : (stryCov_9fa48("3168", "3169"), keyPair.address)) {
        if (stryMutAct_9fa48("3170")) {
          {}
        } else {
          stryCov_9fa48("3170");
          this.connectedAddress = keyPair.address;
          this.connectedType = stryMutAct_9fa48("3171") ? "" : (stryCov_9fa48("3171"), "manual");
        }
      }
    }
  }

  /**
   * Generate credentials using Nostr: username deterministico e chiave GunDB derivata dall'address
   */
  async generateCredentials(address: string, signature: string, message: string) {
    if (stryMutAct_9fa48("3172")) {
      {}
    } else {
      stryCov_9fa48("3172");
      const username = generateUsernameFromIdentity(stryMutAct_9fa48("3173") ? "" : (stryCov_9fa48("3173"), "nostr"), stryMutAct_9fa48("3174") ? {} : (stryCov_9fa48("3174"), {
        id: address
      }));
      // Usa un hashing robusto di address con keccak256
      const hashedAddress = ethers.keccak256(ethers.toUtf8Bytes(address));
      // Include la signature nel salt per aggiungere un ulteriore livello di sicurezza
      const salt = stryMutAct_9fa48("3175") ? `` : (stryCov_9fa48("3175"), `${username}_${address}_${message}_${signature}`);
      const key = await derive(hashedAddress, salt, stryMutAct_9fa48("3176") ? {} : (stryCov_9fa48("3176"), {
        includeP256: stryMutAct_9fa48("3177") ? false : (stryCov_9fa48("3177"), true)
      }));
      return stryMutAct_9fa48("3178") ? {} : (stryCov_9fa48("3178"), {
        username,
        key,
        message,
        signature
      });
    }
  }

  /**
   * Generate a password from a signature
   */
  public async generatePassword(signature: string): Promise<string> {
    if (stryMutAct_9fa48("3179")) {
      {}
    } else {
      stryCov_9fa48("3179");
      if (stryMutAct_9fa48("3182") ? false : stryMutAct_9fa48("3181") ? true : stryMutAct_9fa48("3180") ? signature : (stryCov_9fa48("3180", "3181", "3182"), !signature)) {
        if (stryMutAct_9fa48("3183")) {
          {}
        } else {
          stryCov_9fa48("3183");
          throw new Error(stryMutAct_9fa48("3184") ? "" : (stryCov_9fa48("3184"), "Invalid signature"));
        }
      }
      try {
        if (stryMutAct_9fa48("3185")) {
          {}
        } else {
          stryCov_9fa48("3185");
          // Create a deterministic hash from the signature using a secure algorithm
          const normalizedSig = stryMutAct_9fa48("3186") ? signature.toUpperCase().replace(/[^a-f0-9]/g, "") : (stryCov_9fa48("3186"), signature.toLowerCase().replace(stryMutAct_9fa48("3187") ? /[a-f0-9]/g : (stryCov_9fa48("3187"), /[^a-f0-9]/g), stryMutAct_9fa48("3188") ? "Stryker was here!" : (stryCov_9fa48("3188"), "")));
          const passwordHash = ethers.sha256(ethers.toUtf8Bytes(normalizedSig));
          return passwordHash;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3189")) {
          {}
        } else {
          stryCov_9fa48("3189");
          console.error(stryMutAct_9fa48("3190") ? "" : (stryCov_9fa48("3190"), "Error generating password:"), error);
          throw new Error(stryMutAct_9fa48("3191") ? "" : (stryCov_9fa48("3191"), "Failed to generate password from signature"));
        }
      }
    }
  }

  /**
   * Verify a signature
   */
  public async verifySignature(message: string, signature: string, address: any): Promise<boolean> {
    if (stryMutAct_9fa48("3192")) {
      {}
    } else {
      stryCov_9fa48("3192");
      try {
        if (stryMutAct_9fa48("3193")) {
          {}
        } else {
          stryCov_9fa48("3193");
          // Ensure address is a string
          const addressStr = (stryMutAct_9fa48("3196") ? typeof address !== "object" : stryMutAct_9fa48("3195") ? false : stryMutAct_9fa48("3194") ? true : (stryCov_9fa48("3194", "3195", "3196"), typeof address === (stryMutAct_9fa48("3197") ? "" : (stryCov_9fa48("3197"), "object")))) ? stryMutAct_9fa48("3200") ? address.address && JSON.stringify(address) : stryMutAct_9fa48("3199") ? false : stryMutAct_9fa48("3198") ? true : (stryCov_9fa48("3198", "3199", "3200"), address.address || JSON.stringify(address)) : String(address);
          console.log(stryMutAct_9fa48("3201") ? `` : (stryCov_9fa48("3201"), `Verifying signature for address: ${addressStr}`));
          if (stryMutAct_9fa48("3204") ? (!signature || !message) && !addressStr : stryMutAct_9fa48("3203") ? false : stryMutAct_9fa48("3202") ? true : (stryCov_9fa48("3202", "3203", "3204"), (stryMutAct_9fa48("3206") ? !signature && !message : stryMutAct_9fa48("3205") ? false : (stryCov_9fa48("3205", "3206"), (stryMutAct_9fa48("3207") ? signature : (stryCov_9fa48("3207"), !signature)) || (stryMutAct_9fa48("3208") ? message : (stryCov_9fa48("3208"), !message)))) || (stryMutAct_9fa48("3209") ? addressStr : (stryCov_9fa48("3209"), !addressStr)))) {
            if (stryMutAct_9fa48("3210")) {
              {}
            } else {
              stryCov_9fa48("3210");
              console.error(stryMutAct_9fa48("3211") ? "" : (stryCov_9fa48("3211"), "Invalid message, signature, or address for verification"));
              return stryMutAct_9fa48("3212") ? true : (stryCov_9fa48("3212"), false);
            }
          }

          // For Nostr wallet type, use nostr-tools for verification
          if (stryMutAct_9fa48("3215") ? this.connectedType === "nostr" && this.connectedType === "alby" : stryMutAct_9fa48("3214") ? false : stryMutAct_9fa48("3213") ? true : (stryCov_9fa48("3213", "3214", "3215"), (stryMutAct_9fa48("3217") ? this.connectedType !== "nostr" : stryMutAct_9fa48("3216") ? false : (stryCov_9fa48("3216", "3217"), this.connectedType === (stryMutAct_9fa48("3218") ? "" : (stryCov_9fa48("3218"), "nostr")))) || (stryMutAct_9fa48("3220") ? this.connectedType !== "alby" : stryMutAct_9fa48("3219") ? false : (stryCov_9fa48("3219", "3220"), this.connectedType === (stryMutAct_9fa48("3221") ? "" : (stryCov_9fa48("3221"), "alby")))))) {
            if (stryMutAct_9fa48("3222")) {
              {}
            } else {
              stryCov_9fa48("3222");
              try {
                if (stryMutAct_9fa48("3223")) {
                  {}
                } else {
                  stryCov_9fa48("3223");
                  // Reconstruct the exact event that was signed
                  const eventData = stryMutAct_9fa48("3224") ? {} : (stryCov_9fa48("3224"), {
                    kind: 1,
                    created_at: 0,
                    // IMPORTANT: Use the same fixed timestamp used for signing
                    tags: stryMutAct_9fa48("3225") ? ["Stryker was here"] : (stryCov_9fa48("3225"), []),
                    content: message,
                    pubkey: addressStr
                  });
                  const event: Event = stryMutAct_9fa48("3226") ? {} : (stryCov_9fa48("3226"), {
                    ...eventData,
                    id: getEventHash(eventData),
                    sig: signature
                  });
                  return verifyEvent(event);
                }
              } catch (verifyError) {
                if (stryMutAct_9fa48("3227")) {
                  {}
                } else {
                  stryCov_9fa48("3227");
                  console.error(stryMutAct_9fa48("3228") ? "" : (stryCov_9fa48("3228"), "Error in Nostr signature verification:"), verifyError);
                  return stryMutAct_9fa48("3229") ? true : (stryCov_9fa48("3229"), false);
                }
              }
            }
          } else if (stryMutAct_9fa48("3232") ? this.connectedType === "manual" || this.manualKeyPair : stryMutAct_9fa48("3231") ? false : stryMutAct_9fa48("3230") ? true : (stryCov_9fa48("3230", "3231", "3232"), (stryMutAct_9fa48("3234") ? this.connectedType !== "manual" : stryMutAct_9fa48("3233") ? true : (stryCov_9fa48("3233", "3234"), this.connectedType === (stryMutAct_9fa48("3235") ? "" : (stryCov_9fa48("3235"), "manual")))) && this.manualKeyPair)) {
            if (stryMutAct_9fa48("3236")) {
              {}
            } else {
              stryCov_9fa48("3236");
              console.log(stryMutAct_9fa48("3237") ? "" : (stryCov_9fa48("3237"), "[nostrConnector] Manual verification for keypair"));
              // For manual keypairs, we MUST use a secure verification method.
              if (stryMutAct_9fa48("3240") ? false : stryMutAct_9fa48("3239") ? true : stryMutAct_9fa48("3238") ? this.manualKeyPair.privateKey : (stryCov_9fa48("3238", "3239", "3240"), !this.manualKeyPair.privateKey)) {
                if (stryMutAct_9fa48("3241")) {
                  {}
                } else {
                  stryCov_9fa48("3241");
                  console.error(stryMutAct_9fa48("3242") ? "" : (stryCov_9fa48("3242"), "Manual verification failed: private key is missing."));
                  return stryMutAct_9fa48("3243") ? true : (stryCov_9fa48("3243"), false);
                }
              }
              try {
                if (stryMutAct_9fa48("3244")) {
                  {}
                } else {
                  stryCov_9fa48("3244");
                  const eventData = stryMutAct_9fa48("3245") ? {} : (stryCov_9fa48("3245"), {
                    kind: 1,
                    created_at: 0,
                    // IMPORTANT: Use the same fixed timestamp used for signing
                    tags: stryMutAct_9fa48("3246") ? ["Stryker was here"] : (stryCov_9fa48("3246"), []),
                    content: message,
                    pubkey: addressStr
                  });
                  const event: Event = stryMutAct_9fa48("3247") ? {} : (stryCov_9fa48("3247"), {
                    ...eventData,
                    id: getEventHash(eventData),
                    sig: signature
                  });
                  return verifyEvent(event);
                }
              } catch (manualVerifyError) {
                if (stryMutAct_9fa48("3248")) {
                  {}
                } else {
                  stryCov_9fa48("3248");
                  console.error(stryMutAct_9fa48("3249") ? "" : (stryCov_9fa48("3249"), "Error in manual signature verification:"), manualVerifyError);
                  return stryMutAct_9fa48("3250") ? true : (stryCov_9fa48("3250"), false);
                }
              }
            }
          }
          console.warn(stryMutAct_9fa48("3251") ? "" : (stryCov_9fa48("3251"), "No specific verification method available, signature cannot be fully verified"));
          return stryMutAct_9fa48("3252") ? true : (stryCov_9fa48("3252"), false);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3253")) {
          {}
        } else {
          stryCov_9fa48("3253");
          console.error(stryMutAct_9fa48("3254") ? "" : (stryCov_9fa48("3254"), "Error verifying signature:"), error);
          return stryMutAct_9fa48("3255") ? true : (stryCov_9fa48("3255"), false);
        }
      }
    }
  }

  /**
   * Get the currently connected address
   */
  public getConnectedAddress(): string | null {
    if (stryMutAct_9fa48("3256")) {
      {}
    } else {
      stryCov_9fa48("3256");
      return this.connectedAddress;
    }
  }

  /**
   * Get the currently connected wallet type
   */
  public getConnectedType(): "alby" | "nostr" | "manual" | null {
    if (stryMutAct_9fa48("3257")) {
      {}
    } else {
      stryCov_9fa48("3257");
      return this.connectedType;
    }
  }

  /**
   * Request a signature from the connected wallet
   */
  public async requestSignature(address: string, message: string): Promise<string> {
    if (stryMutAct_9fa48("3258")) {
      {}
    } else {
      stryCov_9fa48("3258");
      if (stryMutAct_9fa48("3261") ? false : stryMutAct_9fa48("3260") ? true : stryMutAct_9fa48("3259") ? this.connectedType : (stryCov_9fa48("3259", "3260", "3261"), !this.connectedType)) {
        if (stryMutAct_9fa48("3262")) {
          {}
        } else {
          stryCov_9fa48("3262");
          throw new Error(stryMutAct_9fa48("3263") ? "" : (stryCov_9fa48("3263"), "No wallet connected"));
        }
      }
      try {
        if (stryMutAct_9fa48("3264")) {
          {}
        } else {
          stryCov_9fa48("3264");
          switch (this.connectedType) {
            case stryMutAct_9fa48("3265") ? "" : (stryCov_9fa48("3265"), "alby"):
            case stryMutAct_9fa48("3267") ? "" : (stryCov_9fa48("3267"), "nostr"):
              if (stryMutAct_9fa48("3266")) {} else {
                stryCov_9fa48("3266");
                if (stryMutAct_9fa48("3270") ? this.connectedType !== "alby" : stryMutAct_9fa48("3269") ? false : stryMutAct_9fa48("3268") ? true : (stryCov_9fa48("3268", "3269", "3270"), this.connectedType === (stryMutAct_9fa48("3271") ? "" : (stryCov_9fa48("3271"), "alby")))) {
                  if (stryMutAct_9fa48("3272")) {
                    {}
                  } else {
                    stryCov_9fa48("3272");
                    console.warn(stryMutAct_9fa48("3273") ? "" : (stryCov_9fa48("3273"), "Alby is deprecated, using Nostr functionality for signature request"));
                  }
                }
                console.log(stryMutAct_9fa48("3274") ? "" : (stryCov_9fa48("3274"), "[nostrConnector] Requesting Nostr signature for message:"), message);
                if (stryMutAct_9fa48("3277") ? false : stryMutAct_9fa48("3276") ? true : stryMutAct_9fa48("3275") ? window.nostr : (stryCov_9fa48("3275", "3276", "3277"), !window.nostr)) {
                  if (stryMutAct_9fa48("3278")) {
                    {}
                  } else {
                    stryCov_9fa48("3278");
                    throw new Error(stryMutAct_9fa48("3279") ? "" : (stryCov_9fa48("3279"), "Nostr extension not available"));
                  }
                }

                // For Nostr, we need to create an event to sign with a fixed timestamp
                const eventData = stryMutAct_9fa48("3280") ? {} : (stryCov_9fa48("3280"), {
                  kind: 1,
                  created_at: 0,
                  // IMPORTANT: Use a fixed timestamp to make signatures verifiable
                  tags: stryMutAct_9fa48("3281") ? ["Stryker was here"] : (stryCov_9fa48("3281"), []),
                  content: message,
                  pubkey: address
                });
                const nostrEvent: Event = stryMutAct_9fa48("3282") ? {} : (stryCov_9fa48("3282"), {
                  ...eventData,
                  id: getEventHash(eventData),
                  sig: stryMutAct_9fa48("3283") ? "Stryker was here!" : (stryCov_9fa48("3283"), "") // This will be filled by window.nostr.signEvent
                });
                const signedEvent = await window.nostr!.signEvent(nostrEvent);
                console.log(stryMutAct_9fa48("3284") ? "" : (stryCov_9fa48("3284"), "Received Nostr signature:"), (stryMutAct_9fa48("3285") ? signedEvent.sig : (stryCov_9fa48("3285"), signedEvent.sig.substring(0, 20))) + (stryMutAct_9fa48("3286") ? "" : (stryCov_9fa48("3286"), "...")));
                return signedEvent.sig;
              }
            case stryMutAct_9fa48("3288") ? "" : (stryCov_9fa48("3288"), "manual"):
              if (stryMutAct_9fa48("3287")) {} else {
                stryCov_9fa48("3287");
                console.log(stryMutAct_9fa48("3289") ? "" : (stryCov_9fa48("3289"), "[nostrConnector] Using manual key pair for signature"));
                if (stryMutAct_9fa48("3292") ? !this.manualKeyPair && !this.manualKeyPair.privateKey : stryMutAct_9fa48("3291") ? false : stryMutAct_9fa48("3290") ? true : (stryCov_9fa48("3290", "3291", "3292"), (stryMutAct_9fa48("3293") ? this.manualKeyPair : (stryCov_9fa48("3293"), !this.manualKeyPair)) || (stryMutAct_9fa48("3294") ? this.manualKeyPair.privateKey : (stryCov_9fa48("3294"), !this.manualKeyPair.privateKey)))) {
                  if (stryMutAct_9fa48("3295")) {
                    {}
                  } else {
                    stryCov_9fa48("3295");
                    throw new Error(stryMutAct_9fa48("3296") ? "" : (stryCov_9fa48("3296"), "No manual key pair available or private key missing"));
                  }
                }
                // Use nostr-tools to sign securely
                const manualEventData = stryMutAct_9fa48("3297") ? {} : (stryCov_9fa48("3297"), {
                  kind: 1,
                  created_at: 0,
                  // IMPORTANT: Use a fixed timestamp
                  tags: stryMutAct_9fa48("3298") ? ["Stryker was here"] : (stryCov_9fa48("3298"), []),
                  content: message,
                  pubkey: this.manualKeyPair.address
                });
                const eventTemplate: Event = stryMutAct_9fa48("3299") ? {} : (stryCov_9fa48("3299"), {
                  ...manualEventData,
                  id: getEventHash(manualEventData),
                  sig: stryMutAct_9fa48("3300") ? "Stryker was here!" : (stryCov_9fa48("3300"), "") // This will be filled by finalizeEvent
                });
                const privateKeyBytes = nostrUtils.hexToBytes(this.manualKeyPair.privateKey);
                const signedEventManual = await finalizeEvent(eventTemplate, privateKeyBytes);
                console.log(stryMutAct_9fa48("3301") ? "" : (stryCov_9fa48("3301"), "Generated manual signature:"), (stryMutAct_9fa48("3302") ? signedEventManual.sig : (stryCov_9fa48("3302"), signedEventManual.sig.substring(0, 20))) + (stryMutAct_9fa48("3303") ? "" : (stryCov_9fa48("3303"), "...")));
                return signedEventManual.sig;
              }
            default:
              if (stryMutAct_9fa48("3304")) {} else {
                stryCov_9fa48("3304");
                throw new Error(stryMutAct_9fa48("3305") ? `` : (stryCov_9fa48("3305"), `Unsupported wallet type: ${this.connectedType}`));
              }
          }
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3306")) {
          {}
        } else {
          stryCov_9fa48("3306");
          console.error(stryMutAct_9fa48("3307") ? "" : (stryCov_9fa48("3307"), "Error requesting signature:"), error);
          throw new Error(stryMutAct_9fa48("3308") ? `` : (stryCov_9fa48("3308"), `Failed to get signature: ${error.message}`));
        }
      }
    }
  }

  /**
   * Cleanup event listeners
   */
  public cleanup(): void {
    if (stryMutAct_9fa48("3309")) {
      {}
    } else {
      stryCov_9fa48("3309");
      this.removeAllListeners();
      this.connectedAddress = null;
      this.connectedType = null;
      this.manualKeyPair = null;
    }
  }
}

// Funzione helper per derivare chiavi Nostr/Bitcoin (come per Web3/WebAuthn)
export async function deriveNostrKeys(address: string, signature: string, message: string) {
  if (stryMutAct_9fa48("3310")) {
    {}
  } else {
    stryCov_9fa48("3310");
    // Usa solo l'address per rendere le credenziali deterministiche
    const salt = stryMutAct_9fa48("3311") ? `` : (stryCov_9fa48("3311"), `${address}_${message}`);
    return await derive(address, salt, stryMutAct_9fa48("3312") ? {} : (stryCov_9fa48("3312"), {
      includeP256: stryMutAct_9fa48("3313") ? false : (stryCov_9fa48("3313"), true)
    }));
  }
}
if (stryMutAct_9fa48("3316") ? typeof window === "undefined" : stryMutAct_9fa48("3315") ? false : stryMutAct_9fa48("3314") ? true : (stryCov_9fa48("3314", "3315", "3316"), typeof window !== (stryMutAct_9fa48("3317") ? "" : (stryCov_9fa48("3317"), "undefined")))) {
  if (stryMutAct_9fa48("3318")) {
    {}
  } else {
    stryCov_9fa48("3318");
    window.NostrConnector = NostrConnector;
  }
} else if (stryMutAct_9fa48("3321") ? typeof global === "undefined" : stryMutAct_9fa48("3320") ? false : stryMutAct_9fa48("3319") ? true : (stryCov_9fa48("3319", "3320", "3321"), typeof global !== (stryMutAct_9fa48("3322") ? "" : (stryCov_9fa48("3322"), "undefined")))) {
  if (stryMutAct_9fa48("3323")) {
    {}
  } else {
    stryCov_9fa48("3323");
    (global as any).NostrConnector = NostrConnector;
  }
}
export { NostrConnector };