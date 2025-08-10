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
import { ShogunEventEmitter, ShogunEventMap } from "./types/events";
import { ErrorHandler, ErrorType, ShogunError } from "./utils/errorHandler";
import { ShogunStorage } from "./storage/storage";
import { IShogunCore, ShogunSDKConfig, AuthResult, SignUpResult, PluginCategory, CorePlugins, AuthMethod, Wallets } from "./types/shogun";
import { ethers } from "ethers";
import { ShogunPlugin } from "./types/plugin";
import { WebauthnPlugin } from "./plugins/webauthn/webauthnPlugin";
import { Web3ConnectorPlugin } from "./plugins/web3/web3ConnectorPlugin";
import { NostrConnectorPlugin } from "./plugins/nostr/nostrConnectorPlugin";
import { OAuthPlugin } from "./plugins/oauth/oauthPlugin";
import { Gun, SEA, restrictedPut, IGunUserInstance, IGunInstance, GunInstance, DeriveOptions, GunDataEventData, GunPeerEventData, GunRxJS, crypto, derive, GunErrors } from "./gundb";
import { ISEAPair } from "gun";
import { LogLevel } from "./types/common";
export type { IGunUserInstance, IGunInstance, GunDataEventData, GunPeerEventData, DeriveOptions };
export { SEA, Gun, GunRxJS, crypto, derive, GunErrors, GunInstance };
export * from "./utils/errorHandler";
export * from "./plugins";
export * from "./types/shogun";
export type * from "./types/plugin";

/**
 * Main ShogunCore class - implements the IShogunCore interface
 *
 * This is the primary entry point for the Shogun SDK, providing access to:
 * - Decentralized database (GunInstance)
 * - Authentication methods (traditional, WebAuthn, MetaMask)
 * - Plugin system for extensibility
 * - RxJS integration for reactive programming
 *
 * @since 2.0.0
 */
export class ShogunCore implements IShogunCore {
  public static readonly API_VERSION = stryMutAct_9fa48("2329") ? "" : (stryCov_9fa48("2329"), "^1.6.6");
  public db: GunInstance;
  public storage: ShogunStorage;
  public provider?: ethers.Provider;
  public config: ShogunSDKConfig;
  public rx!: GunRxJS;
  private _gun!: IGunInstance<any>;
  private _user: IGunUserInstance<any> | null = null;
  private readonly eventEmitter: ShogunEventEmitter;
  private readonly plugins: Map<string, ShogunPlugin> = new Map();
  private currentAuthMethod?: AuthMethod;
  public wallets: Wallets | undefined;

  /**
   * Initialize the Shogun SDK
   * @param config - SDK Configuration object
   * @description Creates a new instance of ShogunCore with the provided configuration.
   * Initializes all required components including storage, event emitter, GunInstance connection,
   * and plugin system.
   */
  constructor(config: ShogunSDKConfig) {
    if (stryMutAct_9fa48("2330")) {
      {}
    } else {
      stryCov_9fa48("2330");
      // Polyfill console for environments where it might be missing
      if (stryMutAct_9fa48("2333") ? typeof console !== "undefined" : stryMutAct_9fa48("2332") ? false : stryMutAct_9fa48("2331") ? true : (stryCov_9fa48("2331", "2332", "2333"), typeof console === (stryMutAct_9fa48("2334") ? "" : (stryCov_9fa48("2334"), "undefined")))) {
        if (stryMutAct_9fa48("2335")) {
          {}
        } else {
          stryCov_9fa48("2335");
          (global as any).console = stryMutAct_9fa48("2336") ? {} : (stryCov_9fa48("2336"), {
            log: () => {},
            warn: () => {},
            error: () => {},
            info: () => {},
            debug: () => {}
          });
        }
      }
      this.config = config;
      this.storage = new ShogunStorage();
      this.eventEmitter = new ShogunEventEmitter();
      ErrorHandler.addListener((error: ShogunError) => {
        if (stryMutAct_9fa48("2337")) {
          {}
        } else {
          stryCov_9fa48("2337");
          this.eventEmitter.emit(stryMutAct_9fa48("2338") ? "" : (stryCov_9fa48("2338"), "error"), stryMutAct_9fa48("2339") ? {} : (stryCov_9fa48("2339"), {
            action: error.code,
            message: error.message,
            type: error.type
          }));
        }
      });
      if (stryMutAct_9fa48("2341") ? false : stryMutAct_9fa48("2340") ? true : (stryCov_9fa48("2340", "2341"), config.authToken)) {
        if (stryMutAct_9fa48("2342")) {
          {}
        } else {
          stryCov_9fa48("2342");
          restrictedPut(Gun, config.authToken);
        }
      }
      try {
        if (stryMutAct_9fa48("2343")) {
          {}
        } else {
          stryCov_9fa48("2343");
          if (stryMutAct_9fa48("2345") ? false : stryMutAct_9fa48("2344") ? true : (stryCov_9fa48("2344", "2345"), config.gunInstance)) {
            if (stryMutAct_9fa48("2346")) {
              {}
            } else {
              stryCov_9fa48("2346");
              this._gun = config.gunInstance;
            }
          } else {
            if (stryMutAct_9fa48("2347")) {
              {}
            } else {
              stryCov_9fa48("2347");
              this._gun = Gun(stryMutAct_9fa48("2348") ? {} : (stryCov_9fa48("2348"), {
                peers: stryMutAct_9fa48("2351") ? config.peers && [] : stryMutAct_9fa48("2350") ? false : stryMutAct_9fa48("2349") ? true : (stryCov_9fa48("2349", "2350", "2351"), config.peers || (stryMutAct_9fa48("2352") ? ["Stryker was here"] : (stryCov_9fa48("2352"), []))),
                radisk: stryMutAct_9fa48("2353") ? true : (stryCov_9fa48("2353"), false),
                localStorage: stryMutAct_9fa48("2354") ? true : (stryCov_9fa48("2354"), false)
              }));
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("2355")) {
          {}
        } else {
          stryCov_9fa48("2355");
          if (stryMutAct_9fa48("2358") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2357") ? false : stryMutAct_9fa48("2356") ? true : (stryCov_9fa48("2356", "2357", "2358"), (stryMutAct_9fa48("2360") ? typeof console === "undefined" : stryMutAct_9fa48("2359") ? true : (stryCov_9fa48("2359", "2360"), typeof console !== (stryMutAct_9fa48("2361") ? "" : (stryCov_9fa48("2361"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2362")) {
              {}
            } else {
              stryCov_9fa48("2362");
              console.error(stryMutAct_9fa48("2363") ? "" : (stryCov_9fa48("2363"), "Error creating Gun instance:"), error);
            }
          }
          throw new Error(stryMutAct_9fa48("2364") ? `` : (stryCov_9fa48("2364"), `Failed to create Gun instance: ${error}`));
        }
      }
      try {
        if (stryMutAct_9fa48("2365")) {
          {}
        } else {
          stryCov_9fa48("2365");
          this.db = new GunInstance(this._gun, stryMutAct_9fa48("2368") ? config.scope && "" : stryMutAct_9fa48("2367") ? false : stryMutAct_9fa48("2366") ? true : (stryCov_9fa48("2366", "2367", "2368"), config.scope || (stryMutAct_9fa48("2369") ? "Stryker was here!" : (stryCov_9fa48("2369"), ""))));
          this._gun = this.db.gun;
          this.setupGunEventForwarding();
        }
      } catch (error) {
        if (stryMutAct_9fa48("2370")) {
          {}
        } else {
          stryCov_9fa48("2370");
          if (stryMutAct_9fa48("2373") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2372") ? false : stryMutAct_9fa48("2371") ? true : (stryCov_9fa48("2371", "2372", "2373"), (stryMutAct_9fa48("2375") ? typeof console === "undefined" : stryMutAct_9fa48("2374") ? true : (stryCov_9fa48("2374", "2375"), typeof console !== (stryMutAct_9fa48("2376") ? "" : (stryCov_9fa48("2376"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2377")) {
              {}
            } else {
              stryCov_9fa48("2377");
              console.error(stryMutAct_9fa48("2378") ? "" : (stryCov_9fa48("2378"), "Error initializing GunInstance:"), error);
            }
          }
          throw new Error(stryMutAct_9fa48("2379") ? `` : (stryCov_9fa48("2379"), `Failed to initialize GunInstance: ${error}`));
        }
      }
      try {
        if (stryMutAct_9fa48("2380")) {
          {}
        } else {
          stryCov_9fa48("2380");
          this._user = this._gun.user().recall(stryMutAct_9fa48("2381") ? {} : (stryCov_9fa48("2381"), {
            sessionStorage: stryMutAct_9fa48("2382") ? false : (stryCov_9fa48("2382"), true)
          }));
        }
      } catch (error) {
        if (stryMutAct_9fa48("2383")) {
          {}
        } else {
          stryCov_9fa48("2383");
          if (stryMutAct_9fa48("2386") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2385") ? false : stryMutAct_9fa48("2384") ? true : (stryCov_9fa48("2384", "2385", "2386"), (stryMutAct_9fa48("2388") ? typeof console === "undefined" : stryMutAct_9fa48("2387") ? true : (stryCov_9fa48("2387", "2388"), typeof console !== (stryMutAct_9fa48("2389") ? "" : (stryCov_9fa48("2389"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2390")) {
              {}
            } else {
              stryCov_9fa48("2390");
              console.error(stryMutAct_9fa48("2391") ? "" : (stryCov_9fa48("2391"), "Error initializing Gun user:"), error);
            }
          }
          throw new Error(stryMutAct_9fa48("2392") ? `` : (stryCov_9fa48("2392"), `Failed to initialize Gun user: ${error}`));
        }
      }
      this._gun.on(stryMutAct_9fa48("2393") ? "" : (stryCov_9fa48("2393"), "auth"), user => {
        if (stryMutAct_9fa48("2394")) {
          {}
        } else {
          stryCov_9fa48("2394");
          this._user = this._gun.user().recall(stryMutAct_9fa48("2395") ? {} : (stryCov_9fa48("2395"), {
            sessionStorage: stryMutAct_9fa48("2396") ? false : (stryCov_9fa48("2396"), true)
          }));
          this.eventEmitter.emit(stryMutAct_9fa48("2397") ? "" : (stryCov_9fa48("2397"), "auth:login"), stryMutAct_9fa48("2398") ? {} : (stryCov_9fa48("2398"), {
            userPub: user.pub,
            method: "password" as const
          }));
        }
      });
      this.rx = new GunRxJS(this._gun);
      this.registerBuiltinPlugins(config);

      // Initialize async components
      this.initialize().catch((error: any) => {
        if (stryMutAct_9fa48("2399")) {
          {}
        } else {
          stryCov_9fa48("2399");
          if (stryMutAct_9fa48("2402") ? typeof console !== "undefined" || console.warn : stryMutAct_9fa48("2401") ? false : stryMutAct_9fa48("2400") ? true : (stryCov_9fa48("2400", "2401", "2402"), (stryMutAct_9fa48("2404") ? typeof console === "undefined" : stryMutAct_9fa48("2403") ? true : (stryCov_9fa48("2403", "2404"), typeof console !== (stryMutAct_9fa48("2405") ? "" : (stryCov_9fa48("2405"), "undefined")))) && console.warn)) {
            if (stryMutAct_9fa48("2406")) {
              {}
            } else {
              stryCov_9fa48("2406");
              console.warn(stryMutAct_9fa48("2407") ? "" : (stryCov_9fa48("2407"), "Error during async initialization:"), error);
            }
          }
        }
      });
    }
  }

  /**
   * Initialize the Shogun SDK asynchronously
   * This method handles initialization tasks that require async operations
   */
  async initialize(): Promise<void> {
    if (stryMutAct_9fa48("2408")) {
      {}
    } else {
      stryCov_9fa48("2408");
      try {
        if (stryMutAct_9fa48("2409")) {
          {}
        } else {
          stryCov_9fa48("2409");
          await this.db.initialize();
          this.eventEmitter.emit(stryMutAct_9fa48("2410") ? "" : (stryCov_9fa48("2410"), "debug"), stryMutAct_9fa48("2411") ? {} : (stryCov_9fa48("2411"), {
            action: stryMutAct_9fa48("2412") ? "" : (stryCov_9fa48("2412"), "core_initialized"),
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        if (stryMutAct_9fa48("2413")) {
          {}
        } else {
          stryCov_9fa48("2413");
          if (stryMutAct_9fa48("2416") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2415") ? false : stryMutAct_9fa48("2414") ? true : (stryCov_9fa48("2414", "2415", "2416"), (stryMutAct_9fa48("2418") ? typeof console === "undefined" : stryMutAct_9fa48("2417") ? true : (stryCov_9fa48("2417", "2418"), typeof console !== (stryMutAct_9fa48("2419") ? "" : (stryCov_9fa48("2419"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2420")) {
              {}
            } else {
              stryCov_9fa48("2420");
              console.error(stryMutAct_9fa48("2421") ? "" : (stryCov_9fa48("2421"), "Error during Shogun Core initialization:"), error);
            }
          }
          throw error;
        }
      }
    }
  }

  /**
   * Access to the Gun instance
   * @returns The Gun instance
   */
  get gun(): IGunInstance<any> {
    if (stryMutAct_9fa48("2422")) {
      {}
    } else {
      stryCov_9fa48("2422");
      return this._gun;
    }
  }

  /**
   * Access to the current user
   * @returns The current Gun user instance
   */
  get user(): IGunUserInstance<any> | null {
    if (stryMutAct_9fa48("2423")) {
      {}
    } else {
      stryCov_9fa48("2423");
      return this._user;
    }
  }

  /**
   * Gets the current user information
   * @returns Current user object or null
   */
  getCurrentUser(): {
    pub: string;
    user?: any;
  } | null {
    if (stryMutAct_9fa48("2424")) {
      {}
    } else {
      stryCov_9fa48("2424");
      if (stryMutAct_9fa48("2427") ? false : stryMutAct_9fa48("2426") ? true : stryMutAct_9fa48("2425") ? this.db : (stryCov_9fa48("2425", "2426", "2427"), !this.db)) {
        if (stryMutAct_9fa48("2428")) {
          {}
        } else {
          stryCov_9fa48("2428");
          return null;
        }
      }
      return this.db.getCurrentUser();
    }
  }

  /**
   * Setup event forwarding from GunInstance to main event emitter
   * @private
   */
  private setupGunEventForwarding(): void {
    if (stryMutAct_9fa48("2429")) {
      {}
    } else {
      stryCov_9fa48("2429");
      const gunEvents = ["gun:put", "gun:get", "gun:set", "gun:remove"] as const;
      gunEvents.forEach(eventName => {
        if (stryMutAct_9fa48("2430")) {
          {}
        } else {
          stryCov_9fa48("2430");
          this.db.on(eventName, (data: any) => {
            if (stryMutAct_9fa48("2431")) {
              {}
            } else {
              stryCov_9fa48("2431");
              this.eventEmitter.emit(eventName, data);
            }
          });
        }
      });
      const peerEvents = ["gun:peer:add", "gun:peer:remove", "gun:peer:connect", "gun:peer:disconnect"] as const;
      peerEvents.forEach(eventName => {
        if (stryMutAct_9fa48("2432")) {
          {}
        } else {
          stryCov_9fa48("2432");
          this.db.on(eventName, (data: any) => {
            if (stryMutAct_9fa48("2433")) {
              {}
            } else {
              stryCov_9fa48("2433");
              this.eventEmitter.emit(eventName, data);
            }
          });
        }
      });
    }
  }

  /**
   * Register built-in plugins based on configuration
   * @private
   */
  private registerBuiltinPlugins(config: ShogunSDKConfig): void {
    if (stryMutAct_9fa48("2434")) {
      {}
    } else {
      stryCov_9fa48("2434");
      try {
        if (stryMutAct_9fa48("2435")) {
          {}
        } else {
          stryCov_9fa48("2435");
          // Register OAuth plugin if configuration is provided
          if (stryMutAct_9fa48("2437") ? false : stryMutAct_9fa48("2436") ? true : (stryCov_9fa48("2436", "2437"), config.oauth)) {
            if (stryMutAct_9fa48("2438")) {
              {}
            } else {
              stryCov_9fa48("2438");
              if (stryMutAct_9fa48("2441") ? typeof console !== "undefined" || console.warn : stryMutAct_9fa48("2440") ? false : stryMutAct_9fa48("2439") ? true : (stryCov_9fa48("2439", "2440", "2441"), (stryMutAct_9fa48("2443") ? typeof console === "undefined" : stryMutAct_9fa48("2442") ? true : (stryCov_9fa48("2442", "2443"), typeof console !== (stryMutAct_9fa48("2444") ? "" : (stryCov_9fa48("2444"), "undefined")))) && console.warn)) {
                if (stryMutAct_9fa48("2445")) {
                  {}
                } else {
                  stryCov_9fa48("2445");
                  console.warn(stryMutAct_9fa48("2446") ? "" : (stryCov_9fa48("2446"), "OAuth plugin will be registered with provided configuration"));
                }
              }
              const oauthPlugin = new OAuthPlugin();
              if (stryMutAct_9fa48("2449") ? typeof (oauthPlugin as any).configure !== "function" : stryMutAct_9fa48("2448") ? false : stryMutAct_9fa48("2447") ? true : (stryCov_9fa48("2447", "2448", "2449"), typeof (oauthPlugin as any).configure === (stryMutAct_9fa48("2450") ? "" : (stryCov_9fa48("2450"), "function")))) {
                if (stryMutAct_9fa48("2451")) {
                  {}
                } else {
                  stryCov_9fa48("2451");
                  (oauthPlugin as any).configure(config.oauth);
                }
              }
              this.registerPlugin(oauthPlugin);
            }
          }

          // Register WebAuthn plugin if configuration is provided
          if (stryMutAct_9fa48("2453") ? false : stryMutAct_9fa48("2452") ? true : (stryCov_9fa48("2452", "2453"), config.webauthn)) {
            if (stryMutAct_9fa48("2454")) {
              {}
            } else {
              stryCov_9fa48("2454");
              if (stryMutAct_9fa48("2457") ? typeof console !== "undefined" || console.warn : stryMutAct_9fa48("2456") ? false : stryMutAct_9fa48("2455") ? true : (stryCov_9fa48("2455", "2456", "2457"), (stryMutAct_9fa48("2459") ? typeof console === "undefined" : stryMutAct_9fa48("2458") ? true : (stryCov_9fa48("2458", "2459"), typeof console !== (stryMutAct_9fa48("2460") ? "" : (stryCov_9fa48("2460"), "undefined")))) && console.warn)) {
                if (stryMutAct_9fa48("2461")) {
                  {}
                } else {
                  stryCov_9fa48("2461");
                  console.warn(stryMutAct_9fa48("2462") ? "" : (stryCov_9fa48("2462"), "WebAuthn plugin will be registered with provided configuration"));
                }
              }
              const webauthnPlugin = new WebauthnPlugin();
              if (stryMutAct_9fa48("2465") ? typeof (webauthnPlugin as any).configure !== "function" : stryMutAct_9fa48("2464") ? false : stryMutAct_9fa48("2463") ? true : (stryCov_9fa48("2463", "2464", "2465"), typeof (webauthnPlugin as any).configure === (stryMutAct_9fa48("2466") ? "" : (stryCov_9fa48("2466"), "function")))) {
                if (stryMutAct_9fa48("2467")) {
                  {}
                } else {
                  stryCov_9fa48("2467");
                  (webauthnPlugin as any).configure(config.webauthn);
                }
              }
              this.registerPlugin(webauthnPlugin);
            }
          }

          // Register Web3 plugin if configuration is provided
          if (stryMutAct_9fa48("2469") ? false : stryMutAct_9fa48("2468") ? true : (stryCov_9fa48("2468", "2469"), config.web3)) {
            if (stryMutAct_9fa48("2470")) {
              {}
            } else {
              stryCov_9fa48("2470");
              if (stryMutAct_9fa48("2473") ? typeof console !== "undefined" || console.warn : stryMutAct_9fa48("2472") ? false : stryMutAct_9fa48("2471") ? true : (stryCov_9fa48("2471", "2472", "2473"), (stryMutAct_9fa48("2475") ? typeof console === "undefined" : stryMutAct_9fa48("2474") ? true : (stryCov_9fa48("2474", "2475"), typeof console !== (stryMutAct_9fa48("2476") ? "" : (stryCov_9fa48("2476"), "undefined")))) && console.warn)) {
                if (stryMutAct_9fa48("2477")) {
                  {}
                } else {
                  stryCov_9fa48("2477");
                  console.warn(stryMutAct_9fa48("2478") ? "" : (stryCov_9fa48("2478"), "Web3 plugin will be registered with provided configuration"));
                }
              }
              const web3Plugin = new Web3ConnectorPlugin();
              if (stryMutAct_9fa48("2481") ? typeof (web3Plugin as any).configure !== "function" : stryMutAct_9fa48("2480") ? false : stryMutAct_9fa48("2479") ? true : (stryCov_9fa48("2479", "2480", "2481"), typeof (web3Plugin as any).configure === (stryMutAct_9fa48("2482") ? "" : (stryCov_9fa48("2482"), "function")))) {
                if (stryMutAct_9fa48("2483")) {
                  {}
                } else {
                  stryCov_9fa48("2483");
                  (web3Plugin as any).configure(config.web3);
                }
              }
              this.registerPlugin(web3Plugin);
            }
          }

          // Register Nostr plugin if configuration is provided
          if (stryMutAct_9fa48("2485") ? false : stryMutAct_9fa48("2484") ? true : (stryCov_9fa48("2484", "2485"), config.nostr)) {
            if (stryMutAct_9fa48("2486")) {
              {}
            } else {
              stryCov_9fa48("2486");
              if (stryMutAct_9fa48("2489") ? typeof console !== "undefined" || console.warn : stryMutAct_9fa48("2488") ? false : stryMutAct_9fa48("2487") ? true : (stryCov_9fa48("2487", "2488", "2489"), (stryMutAct_9fa48("2491") ? typeof console === "undefined" : stryMutAct_9fa48("2490") ? true : (stryCov_9fa48("2490", "2491"), typeof console !== (stryMutAct_9fa48("2492") ? "" : (stryCov_9fa48("2492"), "undefined")))) && console.warn)) {
                if (stryMutAct_9fa48("2493")) {
                  {}
                } else {
                  stryCov_9fa48("2493");
                  console.warn(stryMutAct_9fa48("2494") ? "" : (stryCov_9fa48("2494"), "Nostr plugin will be registered with provided configuration"));
                }
              }
              const nostrPlugin = new NostrConnectorPlugin();
              if (stryMutAct_9fa48("2497") ? typeof (nostrPlugin as any).configure !== "function" : stryMutAct_9fa48("2496") ? false : stryMutAct_9fa48("2495") ? true : (stryCov_9fa48("2495", "2496", "2497"), typeof (nostrPlugin as any).configure === (stryMutAct_9fa48("2498") ? "" : (stryCov_9fa48("2498"), "function")))) {
                if (stryMutAct_9fa48("2499")) {
                  {}
                } else {
                  stryCov_9fa48("2499");
                  (nostrPlugin as any).configure(config.nostr);
                }
              }
              this.registerPlugin(nostrPlugin);
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("2500")) {
          {}
        } else {
          stryCov_9fa48("2500");
          if (stryMutAct_9fa48("2503") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2502") ? false : stryMutAct_9fa48("2501") ? true : (stryCov_9fa48("2501", "2502", "2503"), (stryMutAct_9fa48("2505") ? typeof console === "undefined" : stryMutAct_9fa48("2504") ? true : (stryCov_9fa48("2504", "2505"), typeof console !== (stryMutAct_9fa48("2506") ? "" : (stryCov_9fa48("2506"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2507")) {
              {}
            } else {
              stryCov_9fa48("2507");
              console.error(stryMutAct_9fa48("2508") ? "" : (stryCov_9fa48("2508"), "Error registering builtin plugins:"), error);
            }
          }
        }
      }
    }
  }

  /**
   * Registers a plugin with the Shogun SDK
   * @param plugin Plugin instance to register
   * @throws Error if a plugin with the same name is already registered
   */
  register(plugin: ShogunPlugin): void {
    if (stryMutAct_9fa48("2509")) {
      {}
    } else {
      stryCov_9fa48("2509");
      this.registerPlugin(plugin);
    }
  }

  /**
   * Unregisters a plugin from the Shogun SDK
   * @param pluginName Name of the plugin to unregister
   */
  unregister(pluginName: string): void {
    if (stryMutAct_9fa48("2510")) {
      {}
    } else {
      stryCov_9fa48("2510");
      this.unregisterPlugin(pluginName);
    }
  }

  /**
   * Internal method to register a plugin
   * @param plugin Plugin instance to register
   */
  private registerPlugin(plugin: ShogunPlugin): void {
    if (stryMutAct_9fa48("2511")) {
      {}
    } else {
      stryCov_9fa48("2511");
      try {
        if (stryMutAct_9fa48("2512")) {
          {}
        } else {
          stryCov_9fa48("2512");
          if (stryMutAct_9fa48("2515") ? false : stryMutAct_9fa48("2514") ? true : stryMutAct_9fa48("2513") ? plugin.name : (stryCov_9fa48("2513", "2514", "2515"), !plugin.name)) {
            if (stryMutAct_9fa48("2516")) {
              {}
            } else {
              stryCov_9fa48("2516");
              if (stryMutAct_9fa48("2519") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2518") ? false : stryMutAct_9fa48("2517") ? true : (stryCov_9fa48("2517", "2518", "2519"), (stryMutAct_9fa48("2521") ? typeof console === "undefined" : stryMutAct_9fa48("2520") ? true : (stryCov_9fa48("2520", "2521"), typeof console !== (stryMutAct_9fa48("2522") ? "" : (stryCov_9fa48("2522"), "undefined")))) && console.error)) {
                if (stryMutAct_9fa48("2523")) {
                  {}
                } else {
                  stryCov_9fa48("2523");
                  console.error(stryMutAct_9fa48("2524") ? "" : (stryCov_9fa48("2524"), "Plugin registration failed: Plugin must have a name"));
                }
              }
              return;
            }
          }
          if (stryMutAct_9fa48("2526") ? false : stryMutAct_9fa48("2525") ? true : (stryCov_9fa48("2525", "2526"), this.plugins.has(plugin.name))) {
            if (stryMutAct_9fa48("2527")) {
              {}
            } else {
              stryCov_9fa48("2527");
              if (stryMutAct_9fa48("2530") ? typeof console !== "undefined" || console.warn : stryMutAct_9fa48("2529") ? false : stryMutAct_9fa48("2528") ? true : (stryCov_9fa48("2528", "2529", "2530"), (stryMutAct_9fa48("2532") ? typeof console === "undefined" : stryMutAct_9fa48("2531") ? true : (stryCov_9fa48("2531", "2532"), typeof console !== (stryMutAct_9fa48("2533") ? "" : (stryCov_9fa48("2533"), "undefined")))) && console.warn)) {
                if (stryMutAct_9fa48("2534")) {
                  {}
                } else {
                  stryCov_9fa48("2534");
                  console.warn(stryMutAct_9fa48("2535") ? `` : (stryCov_9fa48("2535"), `Plugin "${plugin.name}" is already registered. Skipping.`));
                }
              }
              return;
            }
          }

          // Initialize plugin with core instance
          plugin.initialize(this);
          this.plugins.set(plugin.name, plugin);
          this.eventEmitter.emit(stryMutAct_9fa48("2536") ? "" : (stryCov_9fa48("2536"), "plugin:registered"), stryMutAct_9fa48("2537") ? {} : (stryCov_9fa48("2537"), {
            name: plugin.name,
            version: stryMutAct_9fa48("2540") ? plugin.version && "unknown" : stryMutAct_9fa48("2539") ? false : stryMutAct_9fa48("2538") ? true : (stryCov_9fa48("2538", "2539", "2540"), plugin.version || (stryMutAct_9fa48("2541") ? "" : (stryCov_9fa48("2541"), "unknown"))),
            category: stryMutAct_9fa48("2544") ? plugin._category && "unknown" : stryMutAct_9fa48("2543") ? false : stryMutAct_9fa48("2542") ? true : (stryCov_9fa48("2542", "2543", "2544"), plugin._category || (stryMutAct_9fa48("2545") ? "" : (stryCov_9fa48("2545"), "unknown")))
          }));
        }
      } catch (error) {
        if (stryMutAct_9fa48("2546")) {
          {}
        } else {
          stryCov_9fa48("2546");
          if (stryMutAct_9fa48("2549") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2548") ? false : stryMutAct_9fa48("2547") ? true : (stryCov_9fa48("2547", "2548", "2549"), (stryMutAct_9fa48("2551") ? typeof console === "undefined" : stryMutAct_9fa48("2550") ? true : (stryCov_9fa48("2550", "2551"), typeof console !== (stryMutAct_9fa48("2552") ? "" : (stryCov_9fa48("2552"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2553")) {
              {}
            } else {
              stryCov_9fa48("2553");
              console.error(stryMutAct_9fa48("2554") ? `` : (stryCov_9fa48("2554"), `Error registering plugin "${plugin.name}":`), error);
            }
          }
        }
      }
    }
  }

  /**
   * Internal method to unregister a plugin
   * @param name Name of the plugin to unregister
   */
  private unregisterPlugin(name: string): boolean {
    if (stryMutAct_9fa48("2555")) {
      {}
    } else {
      stryCov_9fa48("2555");
      try {
        if (stryMutAct_9fa48("2556")) {
          {}
        } else {
          stryCov_9fa48("2556");
          const plugin = this.plugins.get(name);
          if (stryMutAct_9fa48("2559") ? false : stryMutAct_9fa48("2558") ? true : stryMutAct_9fa48("2557") ? plugin : (stryCov_9fa48("2557", "2558", "2559"), !plugin)) {
            if (stryMutAct_9fa48("2560")) {
              {}
            } else {
              stryCov_9fa48("2560");
              if (stryMutAct_9fa48("2563") ? typeof console !== "undefined" || console.warn : stryMutAct_9fa48("2562") ? false : stryMutAct_9fa48("2561") ? true : (stryCov_9fa48("2561", "2562", "2563"), (stryMutAct_9fa48("2565") ? typeof console === "undefined" : stryMutAct_9fa48("2564") ? true : (stryCov_9fa48("2564", "2565"), typeof console !== (stryMutAct_9fa48("2566") ? "" : (stryCov_9fa48("2566"), "undefined")))) && console.warn)) {
                if (stryMutAct_9fa48("2567")) {
                  {}
                } else {
                  stryCov_9fa48("2567");
                  console.warn(stryMutAct_9fa48("2568") ? `` : (stryCov_9fa48("2568"), `Plugin "${name}" not found for unregistration`));
                }
              }
              return stryMutAct_9fa48("2569") ? true : (stryCov_9fa48("2569"), false);
            }
          }

          // Destroy plugin if it has a destroy method
          if (stryMutAct_9fa48("2572") ? typeof (plugin as any).destroy !== "function" : stryMutAct_9fa48("2571") ? false : stryMutAct_9fa48("2570") ? true : (stryCov_9fa48("2570", "2571", "2572"), typeof (plugin as any).destroy === (stryMutAct_9fa48("2573") ? "" : (stryCov_9fa48("2573"), "function")))) {
            if (stryMutAct_9fa48("2574")) {
              {}
            } else {
              stryCov_9fa48("2574");
              try {
                if (stryMutAct_9fa48("2575")) {
                  {}
                } else {
                  stryCov_9fa48("2575");
                  (plugin as any).destroy();
                }
              } catch (destroyError) {
                if (stryMutAct_9fa48("2576")) {
                  {}
                } else {
                  stryCov_9fa48("2576");
                  if (stryMutAct_9fa48("2579") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2578") ? false : stryMutAct_9fa48("2577") ? true : (stryCov_9fa48("2577", "2578", "2579"), (stryMutAct_9fa48("2581") ? typeof console === "undefined" : stryMutAct_9fa48("2580") ? true : (stryCov_9fa48("2580", "2581"), typeof console !== (stryMutAct_9fa48("2582") ? "" : (stryCov_9fa48("2582"), "undefined")))) && console.error)) {
                    if (stryMutAct_9fa48("2583")) {
                      {}
                    } else {
                      stryCov_9fa48("2583");
                      console.error(stryMutAct_9fa48("2584") ? `` : (stryCov_9fa48("2584"), `Error destroying plugin "${name}":`), destroyError);
                    }
                  }
                }
              }
            }
          }
          this.plugins.delete(name);
          this.eventEmitter.emit(stryMutAct_9fa48("2585") ? "" : (stryCov_9fa48("2585"), "plugin:unregistered"), {
            name: plugin.name
          } as any);
          return stryMutAct_9fa48("2586") ? false : (stryCov_9fa48("2586"), true);
        }
      } catch (error) {
        if (stryMutAct_9fa48("2587")) {
          {}
        } else {
          stryCov_9fa48("2587");
          if (stryMutAct_9fa48("2590") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2589") ? false : stryMutAct_9fa48("2588") ? true : (stryCov_9fa48("2588", "2589", "2590"), (stryMutAct_9fa48("2592") ? typeof console === "undefined" : stryMutAct_9fa48("2591") ? true : (stryCov_9fa48("2591", "2592"), typeof console !== (stryMutAct_9fa48("2593") ? "" : (stryCov_9fa48("2593"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2594")) {
              {}
            } else {
              stryCov_9fa48("2594");
              console.error(stryMutAct_9fa48("2595") ? `` : (stryCov_9fa48("2595"), `Error unregistering plugin "${name}":`), error);
            }
          }
          return stryMutAct_9fa48("2596") ? true : (stryCov_9fa48("2596"), false);
        }
      }
    }
  }

  /**
   * Retrieve a registered plugin by name
   * @param name Name of the plugin
   * @returns The requested plugin or undefined if not found
   * @template T Type of the plugin or its public interface
   */
  getPlugin<T = ShogunPlugin>(name: string): T | undefined {
    if (stryMutAct_9fa48("2597")) {
      {}
    } else {
      stryCov_9fa48("2597");
      if (stryMutAct_9fa48("2600") ? !name && typeof name !== "string" : stryMutAct_9fa48("2599") ? false : stryMutAct_9fa48("2598") ? true : (stryCov_9fa48("2598", "2599", "2600"), (stryMutAct_9fa48("2601") ? name : (stryCov_9fa48("2601"), !name)) || (stryMutAct_9fa48("2603") ? typeof name === "string" : stryMutAct_9fa48("2602") ? false : (stryCov_9fa48("2602", "2603"), typeof name !== (stryMutAct_9fa48("2604") ? "" : (stryCov_9fa48("2604"), "string")))))) {
        if (stryMutAct_9fa48("2605")) {
          {}
        } else {
          stryCov_9fa48("2605");
          if (stryMutAct_9fa48("2608") ? typeof console !== "undefined" || console.warn : stryMutAct_9fa48("2607") ? false : stryMutAct_9fa48("2606") ? true : (stryCov_9fa48("2606", "2607", "2608"), (stryMutAct_9fa48("2610") ? typeof console === "undefined" : stryMutAct_9fa48("2609") ? true : (stryCov_9fa48("2609", "2610"), typeof console !== (stryMutAct_9fa48("2611") ? "" : (stryCov_9fa48("2611"), "undefined")))) && console.warn)) {
            if (stryMutAct_9fa48("2612")) {
              {}
            } else {
              stryCov_9fa48("2612");
              console.warn(stryMutAct_9fa48("2613") ? "" : (stryCov_9fa48("2613"), "Invalid plugin name provided to getPlugin"));
            }
          }
          return undefined;
        }
      }
      const plugin = this.plugins.get(name);
      if (stryMutAct_9fa48("2616") ? false : stryMutAct_9fa48("2615") ? true : stryMutAct_9fa48("2614") ? plugin : (stryCov_9fa48("2614", "2615", "2616"), !plugin)) {
        if (stryMutAct_9fa48("2617")) {
          {}
        } else {
          stryCov_9fa48("2617");
          if (stryMutAct_9fa48("2620") ? typeof console !== "undefined" || console.warn : stryMutAct_9fa48("2619") ? false : stryMutAct_9fa48("2618") ? true : (stryCov_9fa48("2618", "2619", "2620"), (stryMutAct_9fa48("2622") ? typeof console === "undefined" : stryMutAct_9fa48("2621") ? true : (stryCov_9fa48("2621", "2622"), typeof console !== (stryMutAct_9fa48("2623") ? "" : (stryCov_9fa48("2623"), "undefined")))) && console.warn)) {
            if (stryMutAct_9fa48("2624")) {
              {}
            } else {
              stryCov_9fa48("2624");
              console.warn(stryMutAct_9fa48("2625") ? `` : (stryCov_9fa48("2625"), `Plugin "${name}" not found`));
            }
          }
          return undefined;
        }
      }
      return plugin as T;
    }
  }

  /**
   * Get information about all registered plugins
   * @returns Array of plugin information objects
   */
  getPluginsInfo(): Array<{
    name: string;
    version: string;
    category?: PluginCategory;
    description?: string;
  }> {
    if (stryMutAct_9fa48("2626")) {
      {}
    } else {
      stryCov_9fa48("2626");
      const pluginsInfo: Array<{
        name: string;
        version: string;
        category?: PluginCategory;
        description?: string;
      }> = stryMutAct_9fa48("2627") ? ["Stryker was here"] : (stryCov_9fa48("2627"), []);
      this.plugins.forEach(plugin => {
        if (stryMutAct_9fa48("2628")) {
          {}
        } else {
          stryCov_9fa48("2628");
          pluginsInfo.push(stryMutAct_9fa48("2629") ? {} : (stryCov_9fa48("2629"), {
            name: plugin.name,
            version: stryMutAct_9fa48("2632") ? plugin.version && "unknown" : stryMutAct_9fa48("2631") ? false : stryMutAct_9fa48("2630") ? true : (stryCov_9fa48("2630", "2631", "2632"), plugin.version || (stryMutAct_9fa48("2633") ? "" : (stryCov_9fa48("2633"), "unknown"))),
            category: plugin._category,
            description: plugin.description
          }));
        }
      });
      return pluginsInfo;
    }
  }

  /**
   * Get the total number of registered plugins
   * @returns Number of registered plugins
   */
  getPluginCount(): number {
    if (stryMutAct_9fa48("2634")) {
      {}
    } else {
      stryCov_9fa48("2634");
      return this.plugins.size;
    }
  }

  /**
   * Check if all plugins are properly initialized
   * @returns Object with initialization status for each plugin
   */
  getPluginsInitializationStatus(): Record<string, {
    initialized: boolean;
    error?: string;
  }> {
    if (stryMutAct_9fa48("2635")) {
      {}
    } else {
      stryCov_9fa48("2635");
      const status: Record<string, {
        initialized: boolean;
        error?: string;
      }> = {};
      this.plugins.forEach((plugin, name) => {
        if (stryMutAct_9fa48("2636")) {
          {}
        } else {
          stryCov_9fa48("2636");
          try {
            if (stryMutAct_9fa48("2637")) {
              {}
            } else {
              stryCov_9fa48("2637");
              // Verifica se il plugin ha un metodo per controllare l'inizializzazione
              if (stryMutAct_9fa48("2640") ? typeof (plugin as any).assertInitialized !== "function" : stryMutAct_9fa48("2639") ? false : stryMutAct_9fa48("2638") ? true : (stryCov_9fa48("2638", "2639", "2640"), typeof (plugin as any).assertInitialized === (stryMutAct_9fa48("2641") ? "" : (stryCov_9fa48("2641"), "function")))) {
                if (stryMutAct_9fa48("2642")) {
                  {}
                } else {
                  stryCov_9fa48("2642");
                  (plugin as any).assertInitialized();
                  status[name] = stryMutAct_9fa48("2643") ? {} : (stryCov_9fa48("2643"), {
                    initialized: stryMutAct_9fa48("2644") ? false : (stryCov_9fa48("2644"), true)
                  });
                }
              } else {
                if (stryMutAct_9fa48("2645")) {
                  {}
                } else {
                  stryCov_9fa48("2645");
                  // Fallback: verifica se il plugin ha un riferimento al core
                  status[name] = stryMutAct_9fa48("2646") ? {} : (stryCov_9fa48("2646"), {
                    initialized: stryMutAct_9fa48("2647") ? !(plugin as any).core : (stryCov_9fa48("2647"), !(stryMutAct_9fa48("2648") ? (plugin as any).core : (stryCov_9fa48("2648"), !(plugin as any).core))),
                    error: (stryMutAct_9fa48("2649") ? (plugin as any).core : (stryCov_9fa48("2649"), !(plugin as any).core)) ? stryMutAct_9fa48("2650") ? "" : (stryCov_9fa48("2650"), "No core reference found") : undefined
                  });
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("2651")) {
              {}
            } else {
              stryCov_9fa48("2651");
              status[name] = stryMutAct_9fa48("2652") ? {} : (stryCov_9fa48("2652"), {
                initialized: stryMutAct_9fa48("2653") ? true : (stryCov_9fa48("2653"), false),
                error: error instanceof Error ? error.message : String(error)
              });
            }
          }
        }
      });
      return status;
    }
  }

  /**
   * Validate plugin system integrity
   * @returns Object with validation results
   */
  validatePluginSystem(): {
    totalPlugins: number;
    initializedPlugins: number;
    failedPlugins: string[];
    warnings: string[];
  } {
    if (stryMutAct_9fa48("2654")) {
      {}
    } else {
      stryCov_9fa48("2654");
      const status = this.getPluginsInitializationStatus();
      const totalPlugins = Object.keys(status).length;
      const initializedPlugins = stryMutAct_9fa48("2655") ? Object.values(status).length : (stryCov_9fa48("2655"), Object.values(status).filter(stryMutAct_9fa48("2656") ? () => undefined : (stryCov_9fa48("2656"), s => s.initialized)).length);
      const failedPlugins = stryMutAct_9fa48("2657") ? Object.entries(status).map(([name, _]) => name) : (stryCov_9fa48("2657"), Object.entries(status).filter(stryMutAct_9fa48("2658") ? () => undefined : (stryCov_9fa48("2658"), ([_, s]) => stryMutAct_9fa48("2659") ? s.initialized : (stryCov_9fa48("2659"), !s.initialized))).map(stryMutAct_9fa48("2660") ? () => undefined : (stryCov_9fa48("2660"), ([name, _]) => name)));
      const warnings: string[] = stryMutAct_9fa48("2661") ? ["Stryker was here"] : (stryCov_9fa48("2661"), []);
      if (stryMutAct_9fa48("2664") ? totalPlugins !== 0 : stryMutAct_9fa48("2663") ? false : stryMutAct_9fa48("2662") ? true : (stryCov_9fa48("2662", "2663", "2664"), totalPlugins === 0)) {
        if (stryMutAct_9fa48("2665")) {
          {}
        } else {
          stryCov_9fa48("2665");
          warnings.push(stryMutAct_9fa48("2666") ? "" : (stryCov_9fa48("2666"), "No plugins registered"));
        }
      }
      if (stryMutAct_9fa48("2670") ? failedPlugins.length <= 0 : stryMutAct_9fa48("2669") ? failedPlugins.length >= 0 : stryMutAct_9fa48("2668") ? false : stryMutAct_9fa48("2667") ? true : (stryCov_9fa48("2667", "2668", "2669", "2670"), failedPlugins.length > 0)) {
        if (stryMutAct_9fa48("2671")) {
          {}
        } else {
          stryCov_9fa48("2671");
          warnings.push(stryMutAct_9fa48("2672") ? `` : (stryCov_9fa48("2672"), `Failed plugins: ${failedPlugins.join(stryMutAct_9fa48("2673") ? "" : (stryCov_9fa48("2673"), ", "))}`));
        }
      }
      return stryMutAct_9fa48("2674") ? {} : (stryCov_9fa48("2674"), {
        totalPlugins,
        initializedPlugins,
        failedPlugins,
        warnings
      });
    }
  }

  /**
   * Attempt to reinitialize failed plugins
   * @returns Object with reinitialization results
   */
  reinitializeFailedPlugins(): {
    success: string[];
    failed: Array<{
      name: string;
      error: string;
    }>;
  } {
    if (stryMutAct_9fa48("2675")) {
      {}
    } else {
      stryCov_9fa48("2675");
      const status = this.getPluginsInitializationStatus();
      const failedPlugins = stryMutAct_9fa48("2676") ? Object.entries(status).map(([name, _]) => name) : (stryCov_9fa48("2676"), Object.entries(status).filter(stryMutAct_9fa48("2677") ? () => undefined : (stryCov_9fa48("2677"), ([_, s]) => stryMutAct_9fa48("2678") ? s.initialized : (stryCov_9fa48("2678"), !s.initialized))).map(stryMutAct_9fa48("2679") ? () => undefined : (stryCov_9fa48("2679"), ([name, _]) => name)));
      const success: string[] = stryMutAct_9fa48("2680") ? ["Stryker was here"] : (stryCov_9fa48("2680"), []);
      const failed: Array<{
        name: string;
        error: string;
      }> = stryMutAct_9fa48("2681") ? ["Stryker was here"] : (stryCov_9fa48("2681"), []);
      failedPlugins.forEach(pluginName => {
        if (stryMutAct_9fa48("2682")) {
          {}
        } else {
          stryCov_9fa48("2682");
          try {
            if (stryMutAct_9fa48("2683")) {
              {}
            } else {
              stryCov_9fa48("2683");
              const plugin = this.plugins.get(pluginName);
              if (stryMutAct_9fa48("2686") ? false : stryMutAct_9fa48("2685") ? true : stryMutAct_9fa48("2684") ? plugin : (stryCov_9fa48("2684", "2685", "2686"), !plugin)) {
                if (stryMutAct_9fa48("2687")) {
                  {}
                } else {
                  stryCov_9fa48("2687");
                  failed.push(stryMutAct_9fa48("2688") ? {} : (stryCov_9fa48("2688"), {
                    name: pluginName,
                    error: stryMutAct_9fa48("2689") ? "" : (stryCov_9fa48("2689"), "Plugin not found")
                  }));
                  return;
                }
              }

              // Reinizializza il plugin
              if (stryMutAct_9fa48("2692") ? pluginName !== CorePlugins.OAuth : stryMutAct_9fa48("2691") ? false : stryMutAct_9fa48("2690") ? true : (stryCov_9fa48("2690", "2691", "2692"), pluginName === CorePlugins.OAuth)) {
                if (stryMutAct_9fa48("2693")) {
                  {}
                } else {
                  stryCov_9fa48("2693");
                  // Rimuovo la chiamata a initialize
                  plugin.initialize(this);
                }
              } else {
                if (stryMutAct_9fa48("2694")) {
                  {}
                } else {
                  stryCov_9fa48("2694");
                  // Rimuovo la chiamata a initialize
                  plugin.initialize(this);
                }
              }
              success.push(pluginName);
            }
          } catch (error) {
            if (stryMutAct_9fa48("2695")) {
              {}
            } else {
              stryCov_9fa48("2695");
              const errorMessage = error instanceof Error ? error.message : String(error);
              failed.push(stryMutAct_9fa48("2696") ? {} : (stryCov_9fa48("2696"), {
                name: pluginName,
                error: errorMessage
              }));
              if (stryMutAct_9fa48("2699") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2698") ? false : stryMutAct_9fa48("2697") ? true : (stryCov_9fa48("2697", "2698", "2699"), (stryMutAct_9fa48("2701") ? typeof console === "undefined" : stryMutAct_9fa48("2700") ? true : (stryCov_9fa48("2700", "2701"), typeof console !== (stryMutAct_9fa48("2702") ? "" : (stryCov_9fa48("2702"), "undefined")))) && console.error)) {
                if (stryMutAct_9fa48("2703")) {
                  {}
                } else {
                  stryCov_9fa48("2703");
                  console.error(stryMutAct_9fa48("2704") ? `` : (stryCov_9fa48("2704"), `[ShogunCore] Failed to reinitialize plugin ${pluginName}:`), error);
                }
              }
            }
          }
        }
      });
      return stryMutAct_9fa48("2705") ? {} : (stryCov_9fa48("2705"), {
        success,
        failed
      });
    }
  }

  /**
   * Check plugin compatibility with current ShogunCore version
   * @returns Object with compatibility information
   */
  checkPluginCompatibility(): {
    compatible: Array<{
      name: string;
      version: string;
    }>;
    incompatible: Array<{
      name: string;
      version: string;
      reason: string;
    }>;
    unknown: Array<{
      name: string;
      version: string;
    }>;
  } {
    if (stryMutAct_9fa48("2706")) {
      {}
    } else {
      stryCov_9fa48("2706");
      const compatible: Array<{
        name: string;
        version: string;
      }> = stryMutAct_9fa48("2707") ? ["Stryker was here"] : (stryCov_9fa48("2707"), []);
      const incompatible: Array<{
        name: string;
        version: string;
        reason: string;
      }> = stryMutAct_9fa48("2708") ? ["Stryker was here"] : (stryCov_9fa48("2708"), []);
      const unknown: Array<{
        name: string;
        version: string;
      }> = stryMutAct_9fa48("2709") ? ["Stryker was here"] : (stryCov_9fa48("2709"), []);
      this.plugins.forEach(plugin => {
        if (stryMutAct_9fa48("2710")) {
          {}
        } else {
          stryCov_9fa48("2710");
          const pluginInfo = stryMutAct_9fa48("2711") ? {} : (stryCov_9fa48("2711"), {
            name: plugin.name,
            version: stryMutAct_9fa48("2714") ? plugin.version && "unknown" : stryMutAct_9fa48("2713") ? false : stryMutAct_9fa48("2712") ? true : (stryCov_9fa48("2712", "2713", "2714"), plugin.version || (stryMutAct_9fa48("2715") ? "" : (stryCov_9fa48("2715"), "unknown")))
          });

          // Verifica se il plugin ha informazioni di compatibilità
          if (stryMutAct_9fa48("2718") ? typeof (plugin as any).getCompatibilityInfo !== "function" : stryMutAct_9fa48("2717") ? false : stryMutAct_9fa48("2716") ? true : (stryCov_9fa48("2716", "2717", "2718"), typeof (plugin as any).getCompatibilityInfo === (stryMutAct_9fa48("2719") ? "" : (stryCov_9fa48("2719"), "function")))) {
            if (stryMutAct_9fa48("2720")) {
              {}
            } else {
              stryCov_9fa48("2720");
              try {
                if (stryMutAct_9fa48("2721")) {
                  {}
                } else {
                  stryCov_9fa48("2721");
                  const compatibilityInfo = (plugin as any).getCompatibilityInfo();
                  if (stryMutAct_9fa48("2724") ? compatibilityInfo || compatibilityInfo.compatible : stryMutAct_9fa48("2723") ? false : stryMutAct_9fa48("2722") ? true : (stryCov_9fa48("2722", "2723", "2724"), compatibilityInfo && compatibilityInfo.compatible)) {
                    if (stryMutAct_9fa48("2725")) {
                      {}
                    } else {
                      stryCov_9fa48("2725");
                      compatible.push(pluginInfo);
                    }
                  } else {
                    if (stryMutAct_9fa48("2726")) {
                      {}
                    } else {
                      stryCov_9fa48("2726");
                      incompatible.push(stryMutAct_9fa48("2727") ? {} : (stryCov_9fa48("2727"), {
                        ...pluginInfo,
                        reason: stryMutAct_9fa48("2730") ? compatibilityInfo?.reason && "Unknown compatibility issue" : stryMutAct_9fa48("2729") ? false : stryMutAct_9fa48("2728") ? true : (stryCov_9fa48("2728", "2729", "2730"), (stryMutAct_9fa48("2731") ? compatibilityInfo.reason : (stryCov_9fa48("2731"), compatibilityInfo?.reason)) || (stryMutAct_9fa48("2732") ? "" : (stryCov_9fa48("2732"), "Unknown compatibility issue")))
                      }));
                    }
                  }
                }
              } catch (error) {
                if (stryMutAct_9fa48("2733")) {
                  {}
                } else {
                  stryCov_9fa48("2733");
                  unknown.push(pluginInfo);
                }
              }
            }
          } else {
            if (stryMutAct_9fa48("2734")) {
              {}
            } else {
              stryCov_9fa48("2734");
              // Se non ha informazioni di compatibilità, considera sconosciuto
              unknown.push(pluginInfo);
            }
          }
        }
      });
      return stryMutAct_9fa48("2735") ? {} : (stryCov_9fa48("2735"), {
        compatible,
        incompatible,
        unknown
      });
    }
  }

  /**
   * Get comprehensive debug information about the plugin system
   * @returns Complete plugin system debug information
   */
  getPluginSystemDebugInfo(): {
    shogunCoreVersion: string;
    totalPlugins: number;
    plugins: Array<{
      name: string;
      version: string;
      category?: PluginCategory;
      description?: string;
      initialized: boolean;
      error?: string;
    }>;
    initializationStatus: Record<string, {
      initialized: boolean;
      error?: string;
    }>;
    validation: {
      totalPlugins: number;
      initializedPlugins: number;
      failedPlugins: string[];
      warnings: string[];
    };
    compatibility: {
      compatible: Array<{
        name: string;
        version: string;
      }>;
      incompatible: Array<{
        name: string;
        version: string;
        reason: string;
      }>;
      unknown: Array<{
        name: string;
        version: string;
      }>;
    };
  } {
    if (stryMutAct_9fa48("2736")) {
      {}
    } else {
      stryCov_9fa48("2736");
      const pluginsInfo = this.getPluginsInfo();
      const initializationStatus = this.getPluginsInitializationStatus();
      const plugins = pluginsInfo.map(stryMutAct_9fa48("2737") ? () => undefined : (stryCov_9fa48("2737"), info => stryMutAct_9fa48("2738") ? {} : (stryCov_9fa48("2738"), {
        ...info,
        initialized: stryMutAct_9fa48("2741") ? initializationStatus[info.name]?.initialized && false : stryMutAct_9fa48("2740") ? false : stryMutAct_9fa48("2739") ? true : (stryCov_9fa48("2739", "2740", "2741"), (stryMutAct_9fa48("2742") ? initializationStatus[info.name].initialized : (stryCov_9fa48("2742"), initializationStatus[info.name]?.initialized)) || (stryMutAct_9fa48("2743") ? true : (stryCov_9fa48("2743"), false))),
        error: stryMutAct_9fa48("2744") ? initializationStatus[info.name].error : (stryCov_9fa48("2744"), initializationStatus[info.name]?.error)
      })));
      return stryMutAct_9fa48("2745") ? {} : (stryCov_9fa48("2745"), {
        shogunCoreVersion: ShogunCore.API_VERSION,
        totalPlugins: this.getPluginCount(),
        plugins,
        initializationStatus,
        validation: this.validatePluginSystem(),
        compatibility: this.checkPluginCompatibility()
      });
    }
  }

  /**
   * Check if a plugin is registered
   * @param name Name of the plugin to check
   * @returns true if the plugin is registered, false otherwise
   */
  hasPlugin(name: string): boolean {
    if (stryMutAct_9fa48("2746")) {
      {}
    } else {
      stryCov_9fa48("2746");
      return this.plugins.has(name);
    }
  }

  /**
   * Get all plugins of a specific category
   * @param category Category of plugins to filter
   * @returns Array of plugins in the specified category
   */
  getPluginsByCategory(category: PluginCategory): ShogunPlugin[] {
    if (stryMutAct_9fa48("2747")) {
      {}
    } else {
      stryCov_9fa48("2747");
      const result: ShogunPlugin[] = stryMutAct_9fa48("2748") ? ["Stryker was here"] : (stryCov_9fa48("2748"), []);
      this.plugins.forEach(plugin => {
        if (stryMutAct_9fa48("2749")) {
          {}
        } else {
          stryCov_9fa48("2749");
          if (stryMutAct_9fa48("2752") ? plugin._category !== category : stryMutAct_9fa48("2751") ? false : stryMutAct_9fa48("2750") ? true : (stryCov_9fa48("2750", "2751", "2752"), plugin._category === category)) {
            if (stryMutAct_9fa48("2753")) {
              {}
            } else {
              stryCov_9fa48("2753");
              result.push(plugin);
            }
          }
        }
      });
      return result;
    }
  }

  /**
   * Get an authentication method plugin by type
   * @param type The type of authentication method
   * @returns The authentication plugin or undefined if not available
   * This is a more modern approach to accessing authentication methods
   */
  getAuthenticationMethod(type: AuthMethod) {
    if (stryMutAct_9fa48("2754")) {
      {}
    } else {
      stryCov_9fa48("2754");
      switch (type) {
        case stryMutAct_9fa48("2756") ? "" : (stryCov_9fa48("2756"), "webauthn"):
          if (stryMutAct_9fa48("2755")) {} else {
            stryCov_9fa48("2755");
            return this.getPlugin(CorePlugins.WebAuthn);
          }
        case stryMutAct_9fa48("2758") ? "" : (stryCov_9fa48("2758"), "web3"):
          if (stryMutAct_9fa48("2757")) {} else {
            stryCov_9fa48("2757");
            return this.getPlugin(CorePlugins.Web3);
          }
        case stryMutAct_9fa48("2760") ? "" : (stryCov_9fa48("2760"), "nostr"):
          if (stryMutAct_9fa48("2759")) {} else {
            stryCov_9fa48("2759");
            return this.getPlugin(CorePlugins.Nostr);
          }
        case stryMutAct_9fa48("2762") ? "" : (stryCov_9fa48("2762"), "oauth"):
          if (stryMutAct_9fa48("2761")) {} else {
            stryCov_9fa48("2761");
            return this.getPlugin(CorePlugins.OAuth);
          }
        case stryMutAct_9fa48("2763") ? "" : (stryCov_9fa48("2763"), "password"):
        default:
          if (stryMutAct_9fa48("2764")) {} else {
            stryCov_9fa48("2764");
            return stryMutAct_9fa48("2765") ? {} : (stryCov_9fa48("2765"), {
              login: async (username: string, password: string): Promise<AuthResult> => {
                if (stryMutAct_9fa48("2766")) {
                  {}
                } else {
                  stryCov_9fa48("2766");
                  return await this.login(username, password);
                }
              },
              signUp: async (username: string, password: string, confirm?: string): Promise<SignUpResult> => {
                if (stryMutAct_9fa48("2767")) {
                  {}
                } else {
                  stryCov_9fa48("2767");
                  return await this.signUp(username, password, confirm);
                }
              }
            });
          }
      }
    }
  }

  // *********************************************************************************************************
  // 🔐 ERROR HANDLER 🔐
  // *********************************************************************************************************

  /**
   * Retrieve recent errors logged by the system
   * @param count - Number of errors to retrieve (default: 10)
   * @returns List of most recent errors
   */
  getRecentErrors(count: number = 10): ShogunError[] {
    if (stryMutAct_9fa48("2768")) {
      {}
    } else {
      stryCov_9fa48("2768");
      return ErrorHandler.getRecentErrors(count);
    }
  }

  // *********************************************************************************************************
  // 🔐 AUTHENTICATION
  // *********************************************************************************************************

  /**
   * Check if user is logged in
   * @returns {boolean} True if user is logged in, false otherwise
   * @description Verifies authentication status by checking GunInstance login state
   * and presence of authentication credentials in storage
   */
  isLoggedIn(): boolean {
    if (stryMutAct_9fa48("2769")) {
      {}
    } else {
      stryCov_9fa48("2769");
      return this.db.isLoggedIn();
    }
  }

  /**
   * Perform user logout
   * @description Logs out the current user from GunInstance and emits logout event.
   * If user is not authenticated, the logout operation is ignored.
   */
  logout(): void {
    if (stryMutAct_9fa48("2770")) {
      {}
    } else {
      stryCov_9fa48("2770");
      try {
        if (stryMutAct_9fa48("2771")) {
          {}
        } else {
          stryCov_9fa48("2771");
          if (stryMutAct_9fa48("2774") ? false : stryMutAct_9fa48("2773") ? true : stryMutAct_9fa48("2772") ? this.isLoggedIn() : (stryCov_9fa48("2772", "2773", "2774"), !this.isLoggedIn())) {
            if (stryMutAct_9fa48("2775")) {
              {}
            } else {
              stryCov_9fa48("2775");
              return;
            }
          }
          this.db.logout();
          this.eventEmitter.emit(stryMutAct_9fa48("2776") ? "" : (stryCov_9fa48("2776"), "auth:logout"));
        }
      } catch (error) {
        if (stryMutAct_9fa48("2777")) {
          {}
        } else {
          stryCov_9fa48("2777");
          ErrorHandler.handle(ErrorType.AUTHENTICATION, stryMutAct_9fa48("2778") ? "" : (stryCov_9fa48("2778"), "LOGOUT_FAILED"), error instanceof Error ? error.message : stryMutAct_9fa48("2779") ? "" : (stryCov_9fa48("2779"), "Error during logout"), error);
        }
      }
    }
  }

  /**
   * Authenticate user with username and password
   * @param username - Username
   * @param password - User password
   * @returns {Promise<AuthResult>} Promise with authentication result
   * @description Attempts to log in user with provided credentials.
   * Emits login event on success.
   */
  async login(username: string, password: string, pair?: ISEAPair | null): Promise<AuthResult> {
    if (stryMutAct_9fa48("2780")) {
      {}
    } else {
      stryCov_9fa48("2780");
      try {
        if (stryMutAct_9fa48("2781")) {
          {}
        } else {
          stryCov_9fa48("2781");
          if (stryMutAct_9fa48("2784") ? false : stryMutAct_9fa48("2783") ? true : stryMutAct_9fa48("2782") ? this.currentAuthMethod : (stryCov_9fa48("2782", "2783", "2784"), !this.currentAuthMethod)) {
            if (stryMutAct_9fa48("2785")) {
              {}
            } else {
              stryCov_9fa48("2785");
              this.currentAuthMethod = stryMutAct_9fa48("2786") ? "" : (stryCov_9fa48("2786"), "password");
            }
          }
          const result = await this.db.login(username, password, pair);
          if (stryMutAct_9fa48("2788") ? false : stryMutAct_9fa48("2787") ? true : (stryCov_9fa48("2787", "2788"), result.success)) {
            if (stryMutAct_9fa48("2789")) {
              {}
            } else {
              stryCov_9fa48("2789");
              // Include SEA pair in the response
              const seaPair = stryMutAct_9fa48("2790") ? (this.user?._ as any).sea : (stryCov_9fa48("2790"), (this.user?._ as any)?.sea);
              if (stryMutAct_9fa48("2792") ? false : stryMutAct_9fa48("2791") ? true : (stryCov_9fa48("2791", "2792"), seaPair)) {
                if (stryMutAct_9fa48("2793")) {
                  {}
                } else {
                  stryCov_9fa48("2793");
                  (result as any).sea = seaPair;
                }
              }
              this.eventEmitter.emit(stryMutAct_9fa48("2794") ? "" : (stryCov_9fa48("2794"), "auth:login"), stryMutAct_9fa48("2795") ? {} : (stryCov_9fa48("2795"), {
                userPub: stryMutAct_9fa48("2796") ? result.userPub && "" : (stryCov_9fa48("2796"), result.userPub ?? (stryMutAct_9fa48("2797") ? "Stryker was here!" : (stryCov_9fa48("2797"), ""))),
                method: (stryMutAct_9fa48("2800") ? this.currentAuthMethod !== "pair" : stryMutAct_9fa48("2799") ? false : stryMutAct_9fa48("2798") ? true : (stryCov_9fa48("2798", "2799", "2800"), this.currentAuthMethod === (stryMutAct_9fa48("2801") ? "" : (stryCov_9fa48("2801"), "pair")))) ? stryMutAct_9fa48("2802") ? "" : (stryCov_9fa48("2802"), "password") : stryMutAct_9fa48("2805") ? this.currentAuthMethod && "password" : stryMutAct_9fa48("2804") ? false : stryMutAct_9fa48("2803") ? true : (stryCov_9fa48("2803", "2804", "2805"), this.currentAuthMethod || (stryMutAct_9fa48("2806") ? "" : (stryCov_9fa48("2806"), "password")))
              }));
            }
          } else {
            if (stryMutAct_9fa48("2807")) {
              {}
            } else {
              stryCov_9fa48("2807");
              result.error = stryMutAct_9fa48("2810") ? result.error && "Wrong user or password" : stryMutAct_9fa48("2809") ? false : stryMutAct_9fa48("2808") ? true : (stryCov_9fa48("2808", "2809", "2810"), result.error || (stryMutAct_9fa48("2811") ? "" : (stryCov_9fa48("2811"), "Wrong user or password")));
            }
          }
          return result;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("2812")) {
          {}
        } else {
          stryCov_9fa48("2812");
          ErrorHandler.handle(ErrorType.AUTHENTICATION, stryMutAct_9fa48("2813") ? "" : (stryCov_9fa48("2813"), "LOGIN_FAILED"), stryMutAct_9fa48("2814") ? error.message && "Unknown error during login" : (stryCov_9fa48("2814"), error.message ?? (stryMutAct_9fa48("2815") ? "" : (stryCov_9fa48("2815"), "Unknown error during login"))), error);
          return stryMutAct_9fa48("2816") ? {} : (stryCov_9fa48("2816"), {
            success: stryMutAct_9fa48("2817") ? true : (stryCov_9fa48("2817"), false),
            error: stryMutAct_9fa48("2818") ? error.message && "Unknown error during login" : (stryCov_9fa48("2818"), error.message ?? (stryMutAct_9fa48("2819") ? "" : (stryCov_9fa48("2819"), "Unknown error during login")))
          });
        }
      }
    }
  }

  /**
   * Login with GunDB pair directly
   * @param pair - GunDB SEA pair for authentication
   * @returns {Promise<AuthResult>} Promise with authentication result
   * @description Authenticates user using a GunDB pair directly.
   * Emits login event on success.
   */
  async loginWithPair(pair: ISEAPair): Promise<AuthResult> {
    if (stryMutAct_9fa48("2820")) {
      {}
    } else {
      stryCov_9fa48("2820");
      try {
        if (stryMutAct_9fa48("2821")) {
          {}
        } else {
          stryCov_9fa48("2821");
          if (stryMutAct_9fa48("2824") ? (!pair || !pair.pub || !pair.priv || !pair.epub) && !pair.epriv : stryMutAct_9fa48("2823") ? false : stryMutAct_9fa48("2822") ? true : (stryCov_9fa48("2822", "2823", "2824"), (stryMutAct_9fa48("2826") ? (!pair || !pair.pub || !pair.priv) && !pair.epub : stryMutAct_9fa48("2825") ? false : (stryCov_9fa48("2825", "2826"), (stryMutAct_9fa48("2828") ? (!pair || !pair.pub) && !pair.priv : stryMutAct_9fa48("2827") ? false : (stryCov_9fa48("2827", "2828"), (stryMutAct_9fa48("2830") ? !pair && !pair.pub : stryMutAct_9fa48("2829") ? false : (stryCov_9fa48("2829", "2830"), (stryMutAct_9fa48("2831") ? pair : (stryCov_9fa48("2831"), !pair)) || (stryMutAct_9fa48("2832") ? pair.pub : (stryCov_9fa48("2832"), !pair.pub)))) || (stryMutAct_9fa48("2833") ? pair.priv : (stryCov_9fa48("2833"), !pair.priv)))) || (stryMutAct_9fa48("2834") ? pair.epub : (stryCov_9fa48("2834"), !pair.epub)))) || (stryMutAct_9fa48("2835") ? pair.epriv : (stryCov_9fa48("2835"), !pair.epriv)))) {
            if (stryMutAct_9fa48("2836")) {
              {}
            } else {
              stryCov_9fa48("2836");
              return stryMutAct_9fa48("2837") ? {} : (stryCov_9fa48("2837"), {
                success: stryMutAct_9fa48("2838") ? true : (stryCov_9fa48("2838"), false),
                error: stryMutAct_9fa48("2839") ? "" : (stryCov_9fa48("2839"), "Invalid pair structure - missing required keys")
              });
            }
          }

          // Use the new loginWithPair method from GunInstance
          const result = await this.db.login(stryMutAct_9fa48("2840") ? "Stryker was here!" : (stryCov_9fa48("2840"), ""), stryMutAct_9fa48("2841") ? "Stryker was here!" : (stryCov_9fa48("2841"), ""), pair);
          if (stryMutAct_9fa48("2843") ? false : stryMutAct_9fa48("2842") ? true : (stryCov_9fa48("2842", "2843"), result.success)) {
            if (stryMutAct_9fa48("2844")) {
              {}
            } else {
              stryCov_9fa48("2844");
              // Include SEA pair in the response
              const seaPair = stryMutAct_9fa48("2845") ? (this.user?._ as any).sea : (stryCov_9fa48("2845"), (this.user?._ as any)?.sea);
              if (stryMutAct_9fa48("2847") ? false : stryMutAct_9fa48("2846") ? true : (stryCov_9fa48("2846", "2847"), seaPair)) {
                if (stryMutAct_9fa48("2848")) {
                  {}
                } else {
                  stryCov_9fa48("2848");
                  (result as any).sea = seaPair;
                }
              }
              this.currentAuthMethod = stryMutAct_9fa48("2849") ? "" : (stryCov_9fa48("2849"), "pair");
              this.eventEmitter.emit(stryMutAct_9fa48("2850") ? "" : (stryCov_9fa48("2850"), "auth:login"), stryMutAct_9fa48("2851") ? {} : (stryCov_9fa48("2851"), {
                userPub: stryMutAct_9fa48("2852") ? result.userPub && "" : (stryCov_9fa48("2852"), result.userPub ?? (stryMutAct_9fa48("2853") ? "Stryker was here!" : (stryCov_9fa48("2853"), ""))),
                method: stryMutAct_9fa48("2854") ? "" : (stryCov_9fa48("2854"), "password")
              }));
            }
          } else {
            if (stryMutAct_9fa48("2855")) {
              {}
            } else {
              stryCov_9fa48("2855");
              result.error = stryMutAct_9fa48("2858") ? result.error && "Authentication failed with provided pair" : stryMutAct_9fa48("2857") ? false : stryMutAct_9fa48("2856") ? true : (stryCov_9fa48("2856", "2857", "2858"), result.error || (stryMutAct_9fa48("2859") ? "" : (stryCov_9fa48("2859"), "Authentication failed with provided pair")));
            }
          }
          return result;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("2860")) {
          {}
        } else {
          stryCov_9fa48("2860");
          ErrorHandler.handle(ErrorType.AUTHENTICATION, stryMutAct_9fa48("2861") ? "" : (stryCov_9fa48("2861"), "PAIR_LOGIN_FAILED"), stryMutAct_9fa48("2862") ? error.message && "Unknown error during pair login" : (stryCov_9fa48("2862"), error.message ?? (stryMutAct_9fa48("2863") ? "" : (stryCov_9fa48("2863"), "Unknown error during pair login"))), error);
          return stryMutAct_9fa48("2864") ? {} : (stryCov_9fa48("2864"), {
            success: stryMutAct_9fa48("2865") ? true : (stryCov_9fa48("2865"), false),
            error: stryMutAct_9fa48("2866") ? error.message && "Unknown error during pair login" : (stryCov_9fa48("2866"), error.message ?? (stryMutAct_9fa48("2867") ? "" : (stryCov_9fa48("2867"), "Unknown error during pair login")))
          });
        }
      }
    }
  }

  /**
   * Register a new user with provided credentials
   * @param username - Username
   * @param password - Password
   * @param passwordConfirmation - Password confirmation
   * @param pair - Pair of keys
   * @returns {Promise<SignUpResult>} Registration result
   * @description Creates a new user account with the provided credentials.
   * Validates password requirements and emits signup event on success.
   */
  async signUp(username: string, password: string = stryMutAct_9fa48("2868") ? "Stryker was here!" : (stryCov_9fa48("2868"), ""), email: string = stryMutAct_9fa48("2869") ? "Stryker was here!" : (stryCov_9fa48("2869"), ""), pair?: ISEAPair | null): Promise<SignUpResult> {
    if (stryMutAct_9fa48("2870")) {
      {}
    } else {
      stryCov_9fa48("2870");
      try {
        if (stryMutAct_9fa48("2871")) {
          {}
        } else {
          stryCov_9fa48("2871");
          if (stryMutAct_9fa48("2874") ? false : stryMutAct_9fa48("2873") ? true : stryMutAct_9fa48("2872") ? this.db : (stryCov_9fa48("2872", "2873", "2874"), !this.db)) {
            if (stryMutAct_9fa48("2875")) {
              {}
            } else {
              stryCov_9fa48("2875");
              throw new Error(stryMutAct_9fa48("2876") ? "" : (stryCov_9fa48("2876"), "Database not initialized"));
            }
          }
          const result = await this.db.signUp(username, password, pair);
          if (stryMutAct_9fa48("2878") ? false : stryMutAct_9fa48("2877") ? true : (stryCov_9fa48("2877", "2878"), result.success)) {
            if (stryMutAct_9fa48("2879")) {
              {}
            } else {
              stryCov_9fa48("2879");
              // Update current authentication method
              this.currentAuthMethod = pair ? stryMutAct_9fa48("2880") ? "" : (stryCov_9fa48("2880"), "web3") : stryMutAct_9fa48("2881") ? "" : (stryCov_9fa48("2881"), "password");
              this.eventEmitter.emit(stryMutAct_9fa48("2882") ? "" : (stryCov_9fa48("2882"), "auth:signup"), stryMutAct_9fa48("2883") ? {} : (stryCov_9fa48("2883"), {
                userPub: result.userPub!,
                username,
                method: this.currentAuthMethod
              }));
              this.eventEmitter.emit(stryMutAct_9fa48("2884") ? "" : (stryCov_9fa48("2884"), "debug"), stryMutAct_9fa48("2885") ? {} : (stryCov_9fa48("2885"), {
                action: stryMutAct_9fa48("2886") ? "" : (stryCov_9fa48("2886"), "signup_success"),
                userPub: result.userPub,
                method: this.currentAuthMethod
              }));
            }
          } else {
            if (stryMutAct_9fa48("2887")) {
              {}
            } else {
              stryCov_9fa48("2887");
              this.eventEmitter.emit(stryMutAct_9fa48("2888") ? "" : (stryCov_9fa48("2888"), "debug"), stryMutAct_9fa48("2889") ? {} : (stryCov_9fa48("2889"), {
                action: stryMutAct_9fa48("2890") ? "" : (stryCov_9fa48("2890"), "signup_failed"),
                error: result.error,
                username
              }));
            }
          }
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("2891")) {
          {}
        } else {
          stryCov_9fa48("2891");
          if (stryMutAct_9fa48("2894") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2893") ? false : stryMutAct_9fa48("2892") ? true : (stryCov_9fa48("2892", "2893", "2894"), (stryMutAct_9fa48("2896") ? typeof console === "undefined" : stryMutAct_9fa48("2895") ? true : (stryCov_9fa48("2895", "2896"), typeof console !== (stryMutAct_9fa48("2897") ? "" : (stryCov_9fa48("2897"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2898")) {
              {}
            } else {
              stryCov_9fa48("2898");
              console.error(stryMutAct_9fa48("2899") ? `` : (stryCov_9fa48("2899"), `Error during registration for user ${username}:`), error);
            }
          }
          this.eventEmitter.emit(stryMutAct_9fa48("2900") ? "" : (stryCov_9fa48("2900"), "debug"), stryMutAct_9fa48("2901") ? {} : (stryCov_9fa48("2901"), {
            action: stryMutAct_9fa48("2902") ? "" : (stryCov_9fa48("2902"), "signup_error"),
            error: error instanceof Error ? error.message : String(error),
            username
          }));
          return stryMutAct_9fa48("2903") ? {} : (stryCov_9fa48("2903"), {
            success: stryMutAct_9fa48("2904") ? true : (stryCov_9fa48("2904"), false),
            error: stryMutAct_9fa48("2905") ? `` : (stryCov_9fa48("2905"), `Registration failed: ${error instanceof Error ? error.message : String(error)}`)
          });
        }
      }
    }
  }

  // 📢 EVENT EMITTER 📢

  /**
   * Emits an event through the core's event emitter.
   * Plugins should use this method to emit events instead of accessing the private eventEmitter directly.
   * @param eventName The name of the event to emit.
   * @param data The data to pass with the event.
   * @returns {boolean} Indicates if the event had listeners.
   */
  emit<K extends keyof ShogunEventMap>(eventName: K, data?: ShogunEventMap[K] extends void ? never : ShogunEventMap[K]): boolean {
    if (stryMutAct_9fa48("2906")) {
      {}
    } else {
      stryCov_9fa48("2906");
      return this.eventEmitter.emit(eventName, data);
    }
  }

  /**
   * Add an event listener
   * @param eventName The name of the event to listen for
   * @param listener The callback function to execute when the event is emitted
   * @returns {this} Returns this instance for method chaining
   */
  on<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this {
    if (stryMutAct_9fa48("2907")) {
      {}
    } else {
      stryCov_9fa48("2907");
      this.eventEmitter.on(eventName, listener as any);
      return this;
    }
  }

  /**
   * Add a one-time event listener
   * @param eventName The name of the event to listen for
   * @param listener The callback function to execute when the event is emitted
   * @returns {this} Returns this instance for method chaining
   */
  once<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this {
    if (stryMutAct_9fa48("2908")) {
      {}
    } else {
      stryCov_9fa48("2908");
      this.eventEmitter.once(eventName, listener as any);
      return this;
    }
  }

  /**
   * Remove an event listener
   * @param eventName The name of the event to stop listening for
   * @param listener The callback function to remove
   * @returns {this} Returns this instance for method chaining
   */
  off<K extends keyof ShogunEventMap>(eventName: K, listener: ShogunEventMap[K] extends void ? () => void : (data: ShogunEventMap[K]) => void): this {
    if (stryMutAct_9fa48("2909")) {
      {}
    } else {
      stryCov_9fa48("2909");
      this.eventEmitter.off(eventName, listener as any);
      return this;
    }
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param eventName Optional. The name of the event to remove listeners for.
   * If not provided, all listeners for all events are removed.
   * @returns {this} Returns this instance for method chaining
   */
  removeAllListeners(eventName?: string | symbol): this {
    if (stryMutAct_9fa48("2910")) {
      {}
    } else {
      stryCov_9fa48("2910");
      this.eventEmitter.removeAllListeners(eventName);
      return this;
    }
  }

  /**
   * Set the current authentication method
   * This is used by plugins to indicate which authentication method was used
   * @param method The authentication method used
   */
  setAuthMethod(method: AuthMethod): void {
    if (stryMutAct_9fa48("2911")) {
      {}
    } else {
      stryCov_9fa48("2911");
      this.currentAuthMethod = method;
    }
  }

  /**
   * Get the current authentication method
   * @returns The current authentication method or undefined if not set
   */
  getAuthMethod(): AuthMethod | undefined {
    if (stryMutAct_9fa48("2912")) {
      {}
    } else {
      stryCov_9fa48("2912");
      return this.currentAuthMethod;
    }
  }

  /**
   * Clears all Gun-related data from local and session storage
   * This is useful for debugging and testing purposes
   */
  clearAllStorageData(): void {
    if (stryMutAct_9fa48("2913")) {
      {}
    } else {
      stryCov_9fa48("2913");
      this.db.clearGunStorage();
    }
  }

  /**
   * Updates the user's alias (username) in Gun and saves the updated credentials
   * @param newAlias New alias/username to set
   * @returns Promise resolving to update result
   */
  async updateUserAlias(newAlias: string): Promise<boolean> {
    if (stryMutAct_9fa48("2914")) {
      {}
    } else {
      stryCov_9fa48("2914");
      try {
        if (stryMutAct_9fa48("2915")) {
          {}
        } else {
          stryCov_9fa48("2915");
          if (stryMutAct_9fa48("2918") ? false : stryMutAct_9fa48("2917") ? true : stryMutAct_9fa48("2916") ? this.db : (stryCov_9fa48("2916", "2917", "2918"), !this.db)) {
            if (stryMutAct_9fa48("2919")) {
              {}
            } else {
              stryCov_9fa48("2919");
              return stryMutAct_9fa48("2920") ? true : (stryCov_9fa48("2920"), false);
            }
          }
          const result = await this.db.updateUserAlias(newAlias);
          return result.success;
        }
      } catch (error) {
        if (stryMutAct_9fa48("2921")) {
          {}
        } else {
          stryCov_9fa48("2921");
          if (stryMutAct_9fa48("2924") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2923") ? false : stryMutAct_9fa48("2922") ? true : (stryCov_9fa48("2922", "2923", "2924"), (stryMutAct_9fa48("2926") ? typeof console === "undefined" : stryMutAct_9fa48("2925") ? true : (stryCov_9fa48("2925", "2926"), typeof console !== (stryMutAct_9fa48("2927") ? "" : (stryCov_9fa48("2927"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2928")) {
              {}
            } else {
              stryCov_9fa48("2928");
              console.error(stryMutAct_9fa48("2929") ? `` : (stryCov_9fa48("2929"), `Error updating user alias:`), error);
            }
          }
          return stryMutAct_9fa48("2930") ? true : (stryCov_9fa48("2930"), false);
        }
      }
    }
  }

  /**
   * Saves the current user credentials to storage
   */
  async saveCredentials(credentials: any): Promise<void> {
    if (stryMutAct_9fa48("2931")) {
      {}
    } else {
      stryCov_9fa48("2931");
      try {
        if (stryMutAct_9fa48("2932")) {
          {}
        } else {
          stryCov_9fa48("2932");
          this.storage.setItem(stryMutAct_9fa48("2933") ? "" : (stryCov_9fa48("2933"), "userCredentials"), JSON.stringify(credentials));
        }
      } catch (error) {
        if (stryMutAct_9fa48("2934")) {
          {}
        } else {
          stryCov_9fa48("2934");
          if (stryMutAct_9fa48("2937") ? typeof console !== "undefined" || console.warn : stryMutAct_9fa48("2936") ? false : stryMutAct_9fa48("2935") ? true : (stryCov_9fa48("2935", "2936", "2937"), (stryMutAct_9fa48("2939") ? typeof console === "undefined" : stryMutAct_9fa48("2938") ? true : (stryCov_9fa48("2938", "2939"), typeof console !== (stryMutAct_9fa48("2940") ? "" : (stryCov_9fa48("2940"), "undefined")))) && console.warn)) {
            if (stryMutAct_9fa48("2941")) {
              {}
            } else {
              stryCov_9fa48("2941");
              console.warn(stryMutAct_9fa48("2942") ? "" : (stryCov_9fa48("2942"), "Failed to save credentials to storage"));
            }
          }
          if (stryMutAct_9fa48("2945") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2944") ? false : stryMutAct_9fa48("2943") ? true : (stryCov_9fa48("2943", "2944", "2945"), (stryMutAct_9fa48("2947") ? typeof console === "undefined" : stryMutAct_9fa48("2946") ? true : (stryCov_9fa48("2946", "2947"), typeof console !== (stryMutAct_9fa48("2948") ? "" : (stryCov_9fa48("2948"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2949")) {
              {}
            } else {
              stryCov_9fa48("2949");
              console.error(stryMutAct_9fa48("2950") ? `` : (stryCov_9fa48("2950"), `Error saving credentials:`), error);
            }
          }
        }
      }
    }
  }

  // esporta la coppia utente come json
  /**
   * Esporta la coppia di chiavi dell'utente corrente come stringa JSON.
   * Utile per backup o migrazione dell'account.
   * @returns {string} La coppia SEA serializzata in formato JSON, oppure stringa vuota se non disponibile.
   */
  exportPair(): string {
    if (stryMutAct_9fa48("2951")) {
      {}
    } else {
      stryCov_9fa48("2951");
      if (stryMutAct_9fa48("2954") ? (!this.user || !this.user._) && typeof (this.user._ as any).sea === "undefined" : stryMutAct_9fa48("2953") ? false : stryMutAct_9fa48("2952") ? true : (stryCov_9fa48("2952", "2953", "2954"), (stryMutAct_9fa48("2956") ? !this.user && !this.user._ : stryMutAct_9fa48("2955") ? false : (stryCov_9fa48("2955", "2956"), (stryMutAct_9fa48("2957") ? this.user : (stryCov_9fa48("2957"), !this.user)) || (stryMutAct_9fa48("2958") ? this.user._ : (stryCov_9fa48("2958"), !this.user._)))) || (stryMutAct_9fa48("2960") ? typeof (this.user._ as any).sea !== "undefined" : stryMutAct_9fa48("2959") ? false : (stryCov_9fa48("2959", "2960"), typeof (this.user._ as any).sea === (stryMutAct_9fa48("2961") ? "" : (stryCov_9fa48("2961"), "undefined")))))) {
        if (stryMutAct_9fa48("2962")) {
          {}
        } else {
          stryCov_9fa48("2962");
          return stryMutAct_9fa48("2963") ? "Stryker was here!" : (stryCov_9fa48("2963"), "");
        }
      }
      return JSON.stringify((this.user._ as any).sea);
    }
  }
  public getIsLoggedIn(): boolean {
    if (stryMutAct_9fa48("2964")) {
      {}
    } else {
      stryCov_9fa48("2964");
      return stryMutAct_9fa48("2965") ? !(this.user && this.user.is) : (stryCov_9fa48("2965"), !(stryMutAct_9fa48("2966") ? this.user && this.user.is : (stryCov_9fa48("2966"), !(stryMutAct_9fa48("2969") ? this.user || this.user.is : stryMutAct_9fa48("2968") ? false : stryMutAct_9fa48("2967") ? true : (stryCov_9fa48("2967", "2968", "2969"), this.user && this.user.is)))));
    }
  }

  /**
   * Changes the username for the currently authenticated user
   * @param newUsername New username to set
   * @returns Promise resolving to the operation result
   */
  async changeUsername(newUsername: string): Promise<{
    success: boolean;
    error?: string;
    oldUsername?: string;
    newUsername?: string;
  }> {
    if (stryMutAct_9fa48("2970")) {
      {}
    } else {
      stryCov_9fa48("2970");
      try {
        if (stryMutAct_9fa48("2971")) {
          {}
        } else {
          stryCov_9fa48("2971");
          if (stryMutAct_9fa48("2974") ? false : stryMutAct_9fa48("2973") ? true : stryMutAct_9fa48("2972") ? this.db : (stryCov_9fa48("2972", "2973", "2974"), !this.db)) {
            if (stryMutAct_9fa48("2975")) {
              {}
            } else {
              stryCov_9fa48("2975");
              throw new Error(stryMutAct_9fa48("2976") ? "" : (stryCov_9fa48("2976"), "Database not initialized"));
            }
          }
          const result = await this.db.changeUsername(newUsername);
          if (stryMutAct_9fa48("2978") ? false : stryMutAct_9fa48("2977") ? true : (stryCov_9fa48("2977", "2978"), result.success)) {
            if (stryMutAct_9fa48("2979")) {
              {}
            } else {
              stryCov_9fa48("2979");
              this.eventEmitter.emit(stryMutAct_9fa48("2980") ? "" : (stryCov_9fa48("2980"), "auth:username_changed"), stryMutAct_9fa48("2981") ? {} : (stryCov_9fa48("2981"), {
                oldUsername: result.oldUsername,
                newUsername: result.newUsername,
                userPub: stryMutAct_9fa48("2982") ? this.getCurrentUser().pub : (stryCov_9fa48("2982"), this.getCurrentUser()?.pub)
              }));
              this.eventEmitter.emit(stryMutAct_9fa48("2983") ? "" : (stryCov_9fa48("2983"), "debug"), stryMutAct_9fa48("2984") ? {} : (stryCov_9fa48("2984"), {
                action: stryMutAct_9fa48("2985") ? "" : (stryCov_9fa48("2985"), "username_changed"),
                oldUsername: result.oldUsername,
                newUsername: result.newUsername
              }));
            }
          } else {
            if (stryMutAct_9fa48("2986")) {
              {}
            } else {
              stryCov_9fa48("2986");
              this.eventEmitter.emit(stryMutAct_9fa48("2987") ? "" : (stryCov_9fa48("2987"), "debug"), stryMutAct_9fa48("2988") ? {} : (stryCov_9fa48("2988"), {
                action: stryMutAct_9fa48("2989") ? "" : (stryCov_9fa48("2989"), "username_change_failed"),
                error: result.error,
                newUsername
              }));
            }
          }
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("2990")) {
          {}
        } else {
          stryCov_9fa48("2990");
          if (stryMutAct_9fa48("2993") ? typeof console !== "undefined" || console.error : stryMutAct_9fa48("2992") ? false : stryMutAct_9fa48("2991") ? true : (stryCov_9fa48("2991", "2992", "2993"), (stryMutAct_9fa48("2995") ? typeof console === "undefined" : stryMutAct_9fa48("2994") ? true : (stryCov_9fa48("2994", "2995"), typeof console !== (stryMutAct_9fa48("2996") ? "" : (stryCov_9fa48("2996"), "undefined")))) && console.error)) {
            if (stryMutAct_9fa48("2997")) {
              {}
            } else {
              stryCov_9fa48("2997");
              console.error(stryMutAct_9fa48("2998") ? `` : (stryCov_9fa48("2998"), `Error changing username to ${newUsername}:`), error);
            }
          }
          this.eventEmitter.emit(stryMutAct_9fa48("2999") ? "" : (stryCov_9fa48("2999"), "debug"), stryMutAct_9fa48("3000") ? {} : (stryCov_9fa48("3000"), {
            action: stryMutAct_9fa48("3001") ? "" : (stryCov_9fa48("3001"), "username_change_error"),
            error: error instanceof Error ? error.message : String(error),
            newUsername
          }));
          return stryMutAct_9fa48("3002") ? {} : (stryCov_9fa48("3002"), {
            success: stryMutAct_9fa48("3003") ? true : (stryCov_9fa48("3003"), false),
            error: stryMutAct_9fa48("3004") ? `` : (stryCov_9fa48("3004"), `Username change failed: ${error instanceof Error ? error.message : String(error)}`)
          });
        }
      }
    }
  }
}
export default ShogunCore;
declare global {
  interface Window {
    initShogun: (config: ShogunSDKConfig) => ShogunCore;
    ShogunCore: ShogunCore;
    ShogunCoreClass: typeof ShogunCore;
  }
}
if (stryMutAct_9fa48("3007") ? typeof window === "undefined" : stryMutAct_9fa48("3006") ? false : stryMutAct_9fa48("3005") ? true : (stryCov_9fa48("3005", "3006", "3007"), typeof window !== (stryMutAct_9fa48("3008") ? "" : (stryCov_9fa48("3008"), "undefined")))) {
  if (stryMutAct_9fa48("3009")) {
    {}
  } else {
    stryCov_9fa48("3009");
    window.ShogunCoreClass = ShogunCore;
  }
}
if (stryMutAct_9fa48("3012") ? typeof window === "undefined" : stryMutAct_9fa48("3011") ? false : stryMutAct_9fa48("3010") ? true : (stryCov_9fa48("3010", "3011", "3012"), typeof window !== (stryMutAct_9fa48("3013") ? "" : (stryCov_9fa48("3013"), "undefined")))) {
  if (stryMutAct_9fa48("3014")) {
    {}
  } else {
    stryCov_9fa48("3014");
    window.initShogun = (config: ShogunSDKConfig): ShogunCore => {
      if (stryMutAct_9fa48("3015")) {
        {}
      } else {
        stryCov_9fa48("3015");
        const instance = new ShogunCore(config);
        window.ShogunCore = instance;
        return instance;
      }
    };
  }
}