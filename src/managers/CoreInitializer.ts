import { IShogunCore, ShogunCoreConfig } from '../interfaces/shogun';
import { ShogunStorage } from '../storage/storage';
import { ErrorHandler, ShogunError } from '../utils/errorHandler';
import { WebauthnPlugin } from '../plugins/webauthn/webauthnPlugin';
import { Web3ConnectorPlugin } from '../plugins/web3/web3ConnectorPlugin';
import { NostrConnectorPlugin } from '../plugins/nostr/nostrConnectorPlugin';
import { ZkProofPlugin } from '../plugins/zkproof/zkProofPlugin';
import { DataBase, RxJS, derive } from '../gundb/db';
import { DataBaseHolster } from '../gundb/db-holster';
import { RxJSHolster } from '../gundb/rxjs-holster';

/**
 * Handles initialization of ShogunCore components
 */
export class CoreInitializer {
  private core: IShogunCore;

  constructor(core: IShogunCore) {
    this.core = core;
  }

  /**
   * Initialize the Shogun SDK
   * @param config - SDK Configuration object
   * @description Creates a new instance of ShogunCore with the provided configuration.
   * Initializes all required components including storage, event emitter, GunInstance connection,
   * and plugin system.
   */
  async initialize(config: ShogunCoreConfig): Promise<void> {
    // Polyfill console for environments where it might be missing
    if (typeof console === 'undefined') {
      (global as any).console = {
        log: () => {},
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {},
      };
    }

    // Initialize storage
    this.core.storage = new ShogunStorage(config.silent);

    // Setup error handler
    ErrorHandler.addListener((error: ShogunError) => {
      this.core.emit('error', {
        action: error.code,
        message: error.message,
        type: error.type,
      });
    });

    // Setup Gun instance
    this.initializeGun(config);

    // Setup Gun user
    this.initializeGunUser();

    // Setup Gun event forwarding
    this.setupGunEventForwarding();

    // Setup wallet derivation
    this.setupWalletDerivation();

    // Initialize RxJS (use appropriate implementation based on instance type)
    if (config.holsterInstance) {
      this.core.rx = new RxJSHolster(this.core.gun) as any;
    } else {
      this.core.rx = new RxJS(this.core.gun);
    }

    // Register built-in plugins
    this.registerBuiltinPlugins(config);

    // Initialize async components
    this.initializeDb();
  }

  /**
   * Initialize Gun or Holster instance
   */
  private initializeGun(config: ShogunCoreConfig): boolean {
    // Check if Holster instance is provided
    if (config.holsterInstance) {
      return this.initializeHolster(config);
    }

    // Otherwise, use Gun instance
    try {
      if (!config.gunInstance) {
        throw new Error(
          'Either gunInstance or holsterInstance is required but neither was provided',
        );
      }

      // Validate Gun instance
      if (typeof config.gunInstance !== 'object') {
        throw new Error(
          `Gun instance must be an object, received: ${typeof config.gunInstance}`,
        );
      }

      if (typeof config.gunInstance.user !== 'function') {
        throw new Error(
          `Gun instance is invalid: gun.user is not a function. Received gun.user type: ${typeof config.gunInstance.user}`,
        );
      }

      if (typeof config.gunInstance.get !== 'function') {
        throw new Error(
          `Gun instance is invalid: gun.get is not a function. Received gun.get type: ${typeof config.gunInstance.get}`,
        );
      }

      if (typeof config.gunInstance.on !== 'function') {
        throw new Error(
          `Gun instance is invalid: gun.on is not a function. Received gun.on type: ${typeof config.gunInstance.on}`,
        );
      }

      console.log('Using provided Gun instance:', config.gunInstance);
      this.core._gun = config.gunInstance;
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Error validating Gun instance:', error);
      }
      throw new Error(`Failed to validate Gun instance: ${error}`);
    }

    try {
      // Resolve SEA
      const sea = this.resolveSEA(this.core._gun, false);

      this.core.db = new DataBase(this.core._gun, this.core, sea);
      return true;
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Error initializing DataBase:', error);
      }
      throw new Error(`Failed to initialize DataBase: ${error}`);
    }
  }

  /**
   * Resolve SEA from Gun/Holster instance or global scope
   * @param instance - Gun or Holster instance
   * @param isHolster - Whether we are using Holster
   * @returns SEA module or null
   */
  private resolveSEA(instance: any, isHolster: boolean): any {
    // Get SEA from instance
    let sea = (instance as any).SEA || null;
    if (sea) return sea;

    // Try to find SEA in various global locations
    const namespace = isHolster ? 'Holster' : 'Gun';
    const g = globalThis as any;
    const w = (typeof window !== 'undefined' ? window : {}) as any;
    const glob = (typeof global !== 'undefined' ? global : {}) as any;

    if (w[namespace] && w[namespace].SEA) {
      sea = w[namespace].SEA;
    } else if (g[namespace] && g[namespace].SEA) {
      sea = g[namespace].SEA;
    } else if (glob[namespace] && glob[namespace].SEA) {
      sea = glob[namespace].SEA;
    } else if (g.SEA) {
      sea = g.SEA;
    } else if (w.SEA) {
      sea = w.SEA;
    }

    return sea;
  }

  /**
   * Initialize Holster instance
   */
  private initializeHolster(config: ShogunCoreConfig): boolean {
    try {
      if (!config.holsterInstance) {
        throw new Error('Holster instance is required but was not provided');
      }

      // Validate Holster instance
      if (typeof config.holsterInstance !== 'object') {
        throw new Error(
          `Holster instance must be an object, received: ${typeof config.holsterInstance}`,
        );
      }

      if (typeof config.holsterInstance.user !== 'function') {
        throw new Error(
          `Holster instance is invalid: holster.user is not a function. Received holster.user type: ${typeof config.holsterInstance.user}`,
        );
      }

      if (typeof config.holsterInstance.get !== 'function') {
        throw new Error(
          `Holster instance is invalid: holster.get is not a function. Received holster.get type: ${typeof config.holsterInstance.get}`,
        );
      }

      console.log('Using provided Holster instance:', config.holsterInstance);
      // Store holster instance in _gun for compatibility
      this.core._gun = config.holsterInstance as any;
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Error validating Holster instance:', error);
      }
      throw new Error(`Failed to validate Holster instance: ${error}`);
    }

    try {
      // Resolve SEA
      const sea = this.resolveSEA(this.core._gun, true);

      this.core.db = new DataBaseHolster(this.core._gun, this.core, sea);
      return true;
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Error initializing DataBaseHolster:', error);
      }
      throw new Error(`Failed to initialize DataBaseHolster: ${error}`);
    }
  }

  /**
   * Check if we're using Holster instead of Gun
   * Holster has a 'next' method that Gun doesn't have
   */
  private isHolster(): boolean {
    // Check if gun has 'next' method (Holster-specific)
    if (typeof (this.core.gun as any).next === 'function') {
      return true;
    }
    // Check if db is DataBaseHolster instance
    if (this.core.db && this.core.db.constructor.name === 'DataBaseHolster') {
      return true;
    }
    return false;
  }

  /**
   * Initialize Gun/Holster user
   */
  private initializeGunUser(): void {
    try {
      const userInstance = this.core.gun.user();
      // Holster's recall() doesn't take options, Gun's does
      if (typeof userInstance.recall === 'function') {
        if (userInstance.recall.length > 0) {
          // Gun API: recall takes options
          this.core._user = userInstance.recall({ sessionStorage: true });
        } else {
          // Holster API: recall takes no arguments
          (userInstance.recall as () => void)();
          this.core._user = userInstance.is ? userInstance : null;
        }
      } else {
        this.core._user = userInstance;
      }
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Error initializing user:', error);
      }
      throw new Error(`Failed to initialize user: ${error}`);
    }

    // Setup auth event listener
    // Gun has native "auth" events, but Holster doesn't support global events
    // Holster uses polling in DataBaseHolster.subscribeToAuthEvents() instead
    if (this.isHolster()) {
      // Holster doesn't support global "auth" events
      // Auth events are handled via polling in DataBaseHolster
      // The DataBaseHolster will emit auth events via its onAuth callbacks
      if (typeof console !== 'undefined' && console.log) {
        console.log(
          '[CoreInitializer] Using Holster - auth events handled via DataBaseHolster polling',
        );
      }
    } else if (typeof this.core.gun.on === 'function') {
      // Gun has native "auth" events
      try {
        this.core.gun.on('auth', (user: any) => {
          const userInstance = this.core.gun.user();
          if (typeof userInstance.recall === 'function') {
            if (userInstance.recall.length > 0) {
              this.core._user = userInstance.recall({ sessionStorage: true });
            } else {
              (userInstance.recall as () => void)();
              this.core._user = userInstance.is ? userInstance : null;
            }
          } else {
            this.core._user = userInstance;
          }
          this.core.emit('auth:login', {
            userPub: user.pub || user.is?.pub,
            method: 'password' as const,
          });
        });
      } catch (error) {
        // If gun.on("auth") fails, it might be because we're using Holster
        // but the detection didn't work. Log and continue.
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(
            '[CoreInitializer] Failed to register auth event listener:',
            error,
          );
        }
      }
    }
  }

  /**
   * Setup Gun event forwarding
   */
  private setupGunEventForwarding(): void {
    const gunEvents = ['gun:put', 'gun:get', 'gun:set', 'gun:remove'] as const;
    gunEvents.forEach((eventName) => {
      this.core.db.on(eventName, (data: any) => {
        this.core.emit(eventName, data);
      });
    });

    const peerEvents = [
      'gun:peer:add',
      'gun:peer:remove',
      'gun:peer:connect',
      'gun:peer:disconnect',
    ] as const;

    peerEvents.forEach((eventName) => {
      this.core.db.on(eventName, (data: any) => {
        this.core.emit(eventName, data);
      });
    });
  }

  /**
   * Setup wallet derivation
   */
  private setupWalletDerivation(): void {
    if (this.isHolster()) {
      // For Holster, wallet derivation is handled via onAuth callbacks in DataBaseHolster
      if (this.core.db && typeof (this.core.db as any).onAuth === 'function') {
        this.core.db.onAuth(async (user: any) => {
          if (!user.is) return;
          const priv = user.is?.epriv;
          const pub = user.is?.epub;
          if (priv && pub) {
            this.core.wallets = await derive(priv, pub, {
              includeSecp256k1Bitcoin: true,
              includeSecp256k1Ethereum: true,
            });
          }
        });
      }
    } else if (typeof this.core.gun.on === 'function') {
      // Gun has native "auth" events
      try {
        this.core.gun.on('auth', async (user: any) => {
          if (!user.is) return;
          const priv = user._?.sea?.epriv || user.is?.epriv;
          const pub = user._?.sea?.epub || user.is?.epub;
          if (priv && pub) {
            this.core.wallets = await derive(priv, pub, {
              includeSecp256k1Bitcoin: true,
              includeSecp256k1Ethereum: true,
            });
          }
        });
      } catch (error) {
        // If gun.on("auth") fails, log and continue
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(
            '[CoreInitializer] Failed to register wallet derivation listener:',
            error,
          );
        }
      }
    }
  }

  /**
   * Register built-in plugins based on configuration
   */
  private registerBuiltinPlugins(config: ShogunCoreConfig): void {
    try {
      // Register WebAuthn plugin if configuration is provided
      if (config.webauthn) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(
            'WebAuthn plugin will be registered with provided configuration',
          );
        }

        const webauthnPlugin = new WebauthnPlugin();
        if (typeof (webauthnPlugin as any).configure === 'function') {
          (webauthnPlugin as any).configure(config.webauthn);
        }
        this.core.pluginManager.register(webauthnPlugin);
      }

      // Register Web3 plugin if configuration is provided
      if (config.web3) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(
            'Web3 plugin will be registered with provided configuration',
          );
        }

        const web3Plugin = new Web3ConnectorPlugin();
        if (typeof (web3Plugin as any).configure === 'function') {
          (web3Plugin as any).configure(config.web3);
        }
        this.core.pluginManager.register(web3Plugin);
      }

      // Register Nostr plugin if configuration is provided
      if (config.nostr) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(
            'Nostr plugin will be registered with provided configuration',
          );
        }

        const nostrPlugin = new NostrConnectorPlugin();
        if (typeof (nostrPlugin as any).configure === 'function') {
          (nostrPlugin as any).configure(config.nostr);
        }
        this.core.pluginManager.register(nostrPlugin);
      }

      // Register ZK-Proof plugin if configuration is provided
      if (config.zkproof) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(
            'ZK-Proof plugin will be registered with provided configuration',
          );
        }

        const zkproofPlugin = new ZkProofPlugin(config.zkproof);
        this.core.pluginManager.register(zkproofPlugin);
      }
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Error registering builtin plugins:', error);
      }
    }
  }

  /**
   * Initialize async components
   */
  private initializeDb(): boolean {
    try {
      this.core.db.initialize();

      this.core.emit('debug', {
        action: 'core_initialized',
        timestamp: Date.now(),
      });
      return true;
    } catch (error) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('Error during Shogun Core initialization:', error);
      }
      return false;
    }
  }
}
