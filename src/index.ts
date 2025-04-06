import { GunDB } from "./gun/gun";
import { Webauthn } from "./webauthn/webauthn";
import { MetaMask } from "./connector/metamask";
import { Stealth } from "./stealth/stealth";
import { EventEmitter } from "events";
import { Storage } from "./storage/storage";
import {
  IShogunCore,
  ShogunSDKConfig,
  AuthResult,
  SignUpResult,
  WalletInfo,
  LoggingConfig,
} from "./types/shogun";
import { IGunInstance } from "gun/types/gun";
import { log, logError, configureLogging, logWarn } from "./utils/logger";
import { WalletManager } from "./wallet/walletManager";
import { ethers } from "ethers";
import { ShogunDID } from "./did/DID";
import { ErrorHandler, ErrorType, ShogunError, createError } from "./utils/errorHandler";
import { DIDCreateOptions } from "./types/did";

export {
  ShogunDID,
  DIDDocument,
  DIDResolutionResult,
  DIDCreateOptions,
} from "./did/DID";

// Esportare anche i tipi per la gestione degli errori
export { ErrorHandler, ErrorType, ShogunError } from "./utils/errorHandler";

let gun: any;

export class ShogunCore implements IShogunCore {
  public gun: IGunInstance<any>;
  public gundb: GunDB;
  public webauthn?: Webauthn;
  public metamask?: MetaMask;
  public stealth?: Stealth;
  public did?: ShogunDID;
  private storage: Storage;
  private eventEmitter: EventEmitter;
  public walletManager?: WalletManager;
  private provider?: ethers.Provider;
  private config: ShogunSDKConfig;

  /**
   * Initialize the Shogun SDK
   * @param config - SDK Configuration object
   * @description Creates a new instance of ShogunCore with the provided configuration.
   * Initializes all required components including storage, event emitter, GunDB connection,
   * authentication methods (WebAuthn, MetaMask), and wallet management.
   */
  constructor(config: ShogunSDKConfig) {
    log("Initializing ShogunSDK");

    // Salviamo la configurazione
    this.config = config;

    // Inizializza la configurazione del logging
    if (config.logging) {
      configureLogging(config.logging);
      log("Logging configured with custom settings");
    }

    this.storage = new Storage();
    this.eventEmitter = new EventEmitter();

    // Configura l'error handler per emettere eventi tramite EventEmitter
    ErrorHandler.addListener((error: ShogunError) => {
      this.eventEmitter.emit("error", {
        action: error.code,
        message: error.message,
        type: error.type,
      });
    });

    // Assicuriamoci che la configurazione di GunDB esista
    if (!config.gundb) {
      config.gundb = {};
      log("No GunDB configuration provided, using defaults");
    }

    // Logghiamo il token di autenticazione se presente
    if (config.gundb.authToken) {
      const tokenPreview = config.gundb.authToken;
      log(`Auth token from config: ${tokenPreview}`);
    } else {
      log("No auth token in config");
    }

    const gundbConfig = {
      peers: config.gundb?.peers,
      websocket: config.gundb?.websocket ?? false,
      localStorage: config.gundb?.localStorage ?? false,
      radisk: config.gundb?.radisk ?? false,
      authToken: config.gundb?.authToken,
      multicast: config.gundb?.multicast ?? false,
      axe: config.gundb?.axe ?? false,
    };

    this.gundb = new GunDB(gundbConfig);
    this.gun = this.gundb.getGun();

    if (config.webauthn?.enabled) {
      this.webauthn = new Webauthn();
    }

    if (config.metamask?.enabled) {
      this.metamask = new MetaMask();
    }

    if (config.stealth?.enabled) {
      this.stealth = new Stealth(this.storage);
    }

    if (config.did?.enabled) {
      this.did = new ShogunDID(this);
    }

    // Initialize Ethereum provider
    if (config.providerUrl) {
      this.provider = new ethers.JsonRpcProvider(config.providerUrl);
      log(`Using configured provider URL: ${config.providerUrl}`);
    } else {
      // Default provider (can be replaced as needed)
      this.provider = ethers.getDefaultProvider("mainnet");
      log(
        "WARNING: Using default Ethereum provider. For production use, configure a specific provider URL."
      );
    }

    if (config.walletManager?.enabled) {
      this.walletManager = new WalletManager(
        this.gundb,
        this.gun,
        this.storage,
        {
          balanceCacheTTL: config.walletManager?.balanceCacheTTL,
          rpcUrl: config.providerUrl,
        }
      );

      if (config.providerUrl) {
        this.walletManager.setRpcUrl(config.providerUrl);
      }
    }

    log("ShogunSDK initialized!");
  }

  /**
   * Recupera gli errori recenti registrati dal sistema
   * @param count - Numero di errori da recuperare
   * @returns Lista degli errori più recenti
   */
  getRecentErrors(count: number = 10): ShogunError[] {
    return ErrorHandler.getRecentErrors(count);
  }

  /**
   * Check if user is logged in
   * @returns {boolean} True if user is logged in, false otherwise
   * @description Verifies authentication status by checking GunDB login state
   * and presence of authentication credentials in storage
   */
  isLoggedIn(): boolean {
    const gunLoggedIn = this.gundb.isLoggedIn();
    const gunUser = this.gun.user();

    if (gunLoggedIn) {
      return true;
    }

    // @ts-ignore - Accessing internal Gun property that is not fully typed
    const hasPair = gunUser && gunUser._ && gunUser._.sea;
    const hasLocalPair = this.storage.getItem("pair");

    return !!hasPair || !!hasLocalPair;
  }

  /**
   * Perform user logout
   * @description Logs out the current user from GunDB and emits logout event.
   * If user is not authenticated, the logout operation is ignored.
   */
  logout(): void {
    try {
      if (!this.isLoggedIn()) {
        log("Logout ignored: user not authenticated");
        return;
      }

      this.gundb.logout();
      this.eventEmitter.emit("auth:logout", {});
      log("Logout completed successfully");
    } catch (error) {
      // Usa il gestore errori centralizzato
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "LOGOUT_FAILED",
        error instanceof Error ? error.message : "Error during logout",
        error
      );
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
  async login(username: string, password: string): Promise<AuthResult> {
    log("Login");
    try {
      log(`Login attempt for user: ${username}`);

      // Verify parameters
      if (!username || !password) {
        return {
          success: false,
          error: "Username and password are required",
        };
      }

      // Set timeout to avoid infinite blocks
      const loginPromise = new Promise<AuthResult>((resolve) => {
        this.gundb.gun.user().auth(username, password, (ack: any) => {
          if (ack.err) {
            log(`Login error: ${ack.err}`);
            resolve({
              success: false,
              error: ack.err,
            });
          } else {
            const user = this.gundb.gun.user();
            if (!user.is) {
              resolve({
                success: false,
                error: "Login failed: user not authenticated",
              });
            } else {
              log("Login completed successfully");
              const userPub = user.is?.pub || "";
              resolve({
                success: true,
                userPub,
                username,
              });
            }
          }
        });
      });

      // Timeout dopo un intervallo configurabile (default 15 secondi)
      const timeoutDuration = this.config?.timeouts?.login || 15000;
      const timeoutPromise = new Promise<AuthResult>((resolve) => {
        setTimeout(() => {
          resolve({
            success: false,
            error: "Login timeout",
          });
        }, timeoutDuration);
      });

      // Use Promise.race to handle timeout
      const result = await Promise.race([loginPromise, timeoutPromise]);

      if (result.success) {
        this.eventEmitter.emit("auth:login", {
          userPub: result.userPub || "",
        });

        // Assicuriamoci che l'utente abbia un DID dopo il login
        try {
          const did = await this.ensureUserHasDID();
          if (did) {
            result.did = did;
          }
        } catch (didError) {
          logError("Error ensuring DID after login:", didError);
        }
      }

      return result;
    } catch (error: any) {
      // Usa il gestore errori centralizzato
      ErrorHandler.handle(
        ErrorType.AUTHENTICATION,
        "LOGIN_FAILED",
        error.message || "Unknown error during login",
        error
      );

      return {
        success: false,
        error: error.message || "Unknown error during login",
      };
    }
  }

  /**
   * Register a new user with provided credentials
   * @param username - Username
   * @param password - Password
   * @param passwordConfirmation - Password confirmation
   * @returns {Promise<SignUpResult>} Registration result
   * @description Creates a new user account with the provided credentials.
   * Validates password requirements and emits signup event on success.
   */
  async signUp(
    username: string,
    password: string,
    passwordConfirmation?: string
  ): Promise<SignUpResult> {
    log("Sign up");
    try {
      // Input validation
      if (!username || !password) {
        return {
          success: false,
          error: "Username and password are required",
        };
      }

      // Validate passwords match if confirmation provided
      if (
        passwordConfirmation !== undefined &&
        password !== passwordConfirmation
      ) {
        return {
          success: false,
          error: "Passwords do not match",
        };
      }

      // Validate password length
      if (password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters long",
        };
      }

      // Set registration timeout
      const signupPromise = new Promise<SignUpResult>((resolve) => {
        this.gundb.gun.user().create(username, password, (ack: any) => {
          if (ack.err) {
            resolve({
              success: false,
              error: ack.err,
            });
          } else {
            // Auto-login after registration
            this.gundb.gun.user().auth(username, password, (loginAck: any) => {
              if (loginAck.err) {
                resolve({
                  success: false,
                  error: "Registration completed but login failed",
                });
              } else {
                const user = this.gundb.gun.user();
                if (!user.is) {
                  resolve({
                    success: false,
                    error: "Registration completed but user not authenticated",
                  });
                } else {
                  resolve({
                    success: true,
                    userPub: user.is?.pub || "",
                    username: username || "",
                  });
                }
              }
            });
          }
        });
      });

      // Timeout dopo un intervallo configurabile (default 20 secondi)
      const timeoutDuration = this.config?.timeouts?.signup || 20000;
      const timeoutPromise = new Promise<SignUpResult>((resolve) => {
        setTimeout(() => {
          resolve({
            success: false,
            error: "Registration timeout",
          });
        }, timeoutDuration);
      });

      // Use Promise.race to handle timeout
      const result = await Promise.race([signupPromise, timeoutPromise]);

      if (result.success) {
        this.eventEmitter.emit("auth:signup", {
          userPub: result.userPub || "",
          username,
        });

        // Creare automaticamente un DID per il nuovo utente
        try {
          const did = await this.ensureUserHasDID();

          if (did) {
            log(`Created DID for new user: ${did}`);

            // Aggiungiamo l'informazione sul DID al risultato
            result.did = did;
          }
        } catch (didError) {
          // Se la creazione del DID fallisce, logghiamo l'errore ma non facciamo fallire la registrazione
          logError("Error creating DID for new user:", didError);
        }
      }

      return result;
    } catch (error: any) {
      logError(`Error during registration for user ${username}:`, error);
      return {
        success: false,
        error: error.message || "Unknown error during registration",
      };
    }
  }

  /**
   * Check if WebAuthn is supported by the browser
   * @returns {boolean} True if WebAuthn is supported, false otherwise
   * @description Verifies if the current browser environment supports WebAuthn authentication
   */
  isWebAuthnSupported(): boolean {
    return this.webauthn?.isSupported() || false;
  }

  /**
   * Perform WebAuthn login
   * @param username - Username
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates user using WebAuthn credentials.
   * Requires browser support for WebAuthn and existing credentials.
   */
  async loginWithWebAuthn(username: string): Promise<AuthResult> {
    log("Login with WebAuthn");

    try {
      log(`Attempting WebAuthn login for user: ${username}`);

      if (!username) {
        throw new Error("Username required for WebAuthn login");
      }

      if (!this.isWebAuthnSupported()) {
        throw new Error("WebAuthn is not supported by this browser");
      }

      // Verify WebAuthn credentials
      const assertionResult = await this.webauthn?.generateCredentials(
        username,
        null,
        true
      );

      if (!assertionResult?.success) {
        throw new Error(
          assertionResult?.error || "WebAuthn verification failed"
        );
      }

      // Use the credential ID as the password
      const hashedCredentialId = ethers.keccak256(
        ethers.toUtf8Bytes(assertionResult.credentialId || "")
      );

      // Login with verified credentials
      const result = await this.login(username, hashedCredentialId);

      if (result.success) {
        log(`WebAuthn login completed successfully for user: ${username}`);

        // Assicuriamo che l'utente abbia un DID associato
        if (!result.did) {
          try {
            const did = await this.ensureUserHasDID();
            if (did) {
              result.did = did;
            }
          } catch (didError) {
            logError("Error ensuring DID for WebAuthn user:", didError);
          }
        }

        return {
          ...result,
          username,
          password: hashedCredentialId,
          credentialId: assertionResult.credentialId,
        };
      } else {
        return result;
      }
    } catch (error: any) {
      logError(`Error during WebAuthn login: ${error}`);
      return {
        success: false,
        error: error.message || "Error during WebAuthn login",
      };
    }
  }

  /**
   * Register new user with WebAuthn
   * @param username - Username
   * @returns {Promise<AuthResult>} Registration result
   * @description Creates a new user account using WebAuthn credentials.
   * Requires browser support for WebAuthn.
   */
  async signUpWithWebAuthn(username: string): Promise<AuthResult> {
    log("Sign up with WebAuthn");

    try {
      log(`Attempting WebAuthn registration for user: ${username}`);

      if (!username) {
        throw new Error("Username required for WebAuthn registration");
      }

      if (!this.isWebAuthnSupported()) {
        throw new Error("WebAuthn is not supported by this browser");
      }

      // Generate new WebAuthn credentials
      const attestationResult = await this.webauthn?.generateCredentials(
        username,
        null,
        false
      );

      if (!attestationResult?.success) {
        throw new Error(
          attestationResult?.error || "Unable to generate WebAuthn credentials"
        );
      }

      // Use credential ID as password
      const hashedCredentialId = ethers.keccak256(
        ethers.toUtf8Bytes(attestationResult.credentialId || "")
      );

      // Perform registration
      const result = await this.signUp(username, hashedCredentialId);

      if (result.success) {
        log(
          `WebAuthn registration completed successfully for user: ${username}`
        );

        // Assicuriamo che l'utente abbia un DID con informazioni WebAuthn
        if (!result.did) {
          try {
            const did = await this.ensureUserHasDID({
              services: [
                {
                  type: "WebAuthnVerification",
                  endpoint: `webauthn:${username}`,
                },
              ],
            });

            if (did) {
              result.did = did;
            }
          } catch (didError) {
            logError("Error creating DID for WebAuthn user:", didError);
          }
        }

        return {
          ...result,
          username,
          password: hashedCredentialId,
          credentialId: attestationResult.credentialId,
        };
      } else {
        return result;
      }
    } catch (error: any) {
      logError(`Error during WebAuthn registration: ${error}`);
      return {
        success: false,
        error: error.message || "Error during WebAuthn registration",
      };
    }
  }

  /**
   * Login with MetaMask
   * @param address - Ethereum address
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates user using MetaMask wallet credentials after signature verification
   */
  async loginWithMetaMask(address: string): Promise<AuthResult> {
    log("Login with MetaMask");

    try {
      log(`MetaMask login attempt for address: ${address}`);

      if (!address) {
        throw createError(
          ErrorType.VALIDATION,
          "ADDRESS_REQUIRED",
          "Ethereum address required for MetaMask login"
        );
      }

      if (!this.metamask?.isAvailable()) {
        throw createError(
          ErrorType.ENVIRONMENT,
          "METAMASK_UNAVAILABLE",
          "MetaMask is not available in the browser"
        );
      }

      log("Generating credentials for MetaMask login...");
      const credentials = await this.metamask?.generateCredentials(address);
      if (!credentials?.username || !credentials?.password || !credentials.signature || !credentials.message) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "CREDENTIAL_GENERATION_FAILED",
          "MetaMask credentials not generated correctly or signature missing"
        );
      }

      log(
        `Credentials generated successfully. Username: ${credentials.username}`
      );

      // --- Verifica della Firma --- 
      log("Verifying MetaMask signature...");
      const recoveredAddress = ethers.verifyMessage(credentials.message, credentials.signature);
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
         logError(`Signature verification failed. Expected: ${address}, Got: ${recoveredAddress}`);
         throw createError(
            ErrorType.SECURITY,
            "SIGNATURE_VERIFICATION_FAILED",
            "MetaMask signature verification failed. Address mismatch."
         );
      }
      log("MetaMask signature verified successfully.");
      // --- Fine Verifica Firma ---

      // Utilizziamo il metodo refactored per gestire login/creazione
      log("Attempting login or user creation with verified credentials...");
      const result = await this.createUserWithGunDB(
        credentials.username,
        credentials.password
      );

      if (!result.success || !result.userPub) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "LOGIN_CREATE_FAILED",
          result.error || "Login or user creation failed after signature verification"
        );
      }

      log(`Login/Creation successful: ${result.userPub}`);

      // Assicuriamo che l'utente abbia un DID associato
      let did: string | null = null;
      try {
        log("Ensuring user has a DID...");
        did = await this.ensureUserHasDID({
           services: [
              { 
                type: "EcdsaSecp256k1VerificationKey2019", // Tipo più specifico
                endpoint: `ethereum:${address}` 
              }
           ]
        });
        if (did) {
          log(`DID assigned/verified: ${did}`);
        } else {
          logWarn("Could not ensure DID for user after MetaMask login.");
        }
      } catch (didError) {
        // Non bloccare il login se il DID fallisce, ma logga l'errore
        ErrorHandler.handle(
          ErrorType.DID,
          "DID_ENSURE_FAILED",
          "Error ensuring DID for MetaMask user",
          didError
        );
      }

      // Emettiamo un evento di login
      this.eventEmitter.emit("auth:login", {
        userPub: result.userPub,
        username: credentials.username,
        method: "metamask",
        did: did || undefined,
      });

      return {
        success: true,
        userPub: result.userPub,
        username: credentials.username,
        password: credentials.password, // Potrebbe non essere sicuro restituirlo
        did: did || undefined,
      };

    } catch (error: any) {
      // Cattura sia errori conformi a ShogunError che generici
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "METAMASK_LOGIN_ERROR";
      const errorMessage = error?.message || "Unknown error during MetaMask login";

      const handledError = ErrorHandler.handle(
          errorType,
          errorCode,
          errorMessage,
          error
        );

      return {
        success: false,
        error: handledError.message, // Ora handledError è ShogunError e ha .message
      };
    }
  }

  /**
   * Register new user with MetaMask
   * @param address - Ethereum address
   * @returns {Promise<AuthResult>} Registration result
   * @description Creates a new user account using MetaMask wallet credentials after signature verification
   */
  async signUpWithMetaMask(address: string): Promise<AuthResult> {
    log("Sign up with MetaMask");

    try {
      log(`MetaMask registration attempt for address: ${address}`);

       if (!address) {
        throw createError(
          ErrorType.VALIDATION,
          "ADDRESS_REQUIRED",
          "Ethereum address required for MetaMask registration"
        );
      }

      if (!this.metamask?.isAvailable()) {
         throw createError(
          ErrorType.ENVIRONMENT,
          "METAMASK_UNAVAILABLE",
          "MetaMask is not available in the browser"
        );
      }

      log("Generating credentials for MetaMask registration...");
      const credentials = await this.metamask?.generateCredentials(address);
      if (!credentials?.username || !credentials?.password || !credentials.signature || !credentials.message) {
         throw createError(
          ErrorType.AUTHENTICATION,
          "CREDENTIAL_GENERATION_FAILED",
          "MetaMask credentials not generated correctly or signature missing"
        );
      }

      log(
        `Credentials generated successfully. Username: ${credentials.username}`
      );

       // --- Verifica della Firma --- 
      log("Verifying MetaMask signature...");
      const recoveredAddress = ethers.verifyMessage(credentials.message, credentials.signature);
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
         logError(`Signature verification failed. Expected: ${address}, Got: ${recoveredAddress}`);
         throw createError(
            ErrorType.SECURITY,
            "SIGNATURE_VERIFICATION_FAILED",
            "MetaMask signature verification failed. Address mismatch."
         );
      }
      log("MetaMask signature verified successfully.");
      // --- Fine Verifica Firma ---

      // Utilizziamo il metodo refactored per creare l'utente (o loggare se esiste già)
      log("Attempting user creation (or login if exists) with verified credentials...");
      const result = await this.createUserWithGunDB(
        credentials.username,
        credentials.password
      );

      if (!result.success || !result.userPub) {
        throw createError(
          ErrorType.AUTHENTICATION,
          "USER_CREATE_LOGIN_FAILED",
          result.error || "User creation or login failed after signature verification"
        );
      }

      log(`User creation/login successful: ${result.userPub}`);

      // Assicuriamo che l'utente abbia un DID associato
      let did: string | null = null;
      try {
        log("Creating/Ensuring DID with MetaMask verification service...");
        did = await this.ensureUserHasDID({
          services: [
            {
              type: "EcdsaSecp256k1VerificationKey2019", // Tipo più specifico
              endpoint: `ethereum:${address}`,
            },
          ],
        });
        if (did) {
            log(`DID created/verified: ${did}`);
        } else {
             logWarn("Could not ensure DID for user after MetaMask signup.");
        }
      } catch (didError) {
         // Non bloccare la registrazione se il DID fallisce, ma logga l'errore
         ErrorHandler.handle(
           ErrorType.DID,
           "DID_ENSURE_FAILED",
           "Error ensuring DID for MetaMask user during signup",
           didError
        );
      }

      // Emettiamo un evento di registrazione (o login se l'utente esisteva già)
      this.eventEmitter.emit("auth:signup", { // Potrebbe essere logico emettere "auth:login" se l'utente esisteva già?
        userPub: result.userPub,
        username: credentials.username,
        method: "metamask",
        did: did || undefined,
      });

      return {
        success: true,
        userPub: result.userPub,
        username: credentials.username,
        password: credentials.password, // Potrebbe non essere sicuro restituirlo
        did: did || undefined,
      };

    } catch (error: any) {
       // Cattura sia errori conformi a ShogunError che generici
      const errorType = error?.type || ErrorType.AUTHENTICATION;
      const errorCode = error?.code || "METAMASK_SIGNUP_ERROR";
      const errorMessage = error?.message || "Unknown error during MetaMask registration";

      const handledError = ErrorHandler.handle(
          errorType,
          errorCode,
          errorMessage,
          error
        );

      return {
        success: false,
        error: handledError.message, // Ora handledError è ShogunError e ha .message
      };
    }
  }

  /**
   * Create a new user with GunDB
   * @param username - Username
   * @param password - Password
   * @returns {Promise<{success: boolean, userPub?: string, error?: string}>} Promise with success status and user public key
   * @description Creates a new user in GunDB with error handling
   */
  private createUserWithGunDB(
    username: string,
    password: string
  ): Promise<{ success: boolean; userPub?: string; error?: string }> {
    log(`Ensuring user exists with GunDB: ${username}`);

    return new Promise(async (resolve) => {
      try {
        // Helper per l'autenticazione
        const authUser = (): Promise<{ err?: string; pub?: string }> => {
          return new Promise((resolveAuth) => {
            // Assicurati che l'utente sia sloggato prima di autenticare
            try {
              this.gundb.logout();
            } catch(e) { /* ignore logout errors */ }

            this.gundb.gun.user().auth(username, password, (ack: any) => {
              if (ack.err) {
                resolveAuth({ err: ack.err });
              } else {
                const user = this.gundb.gun.user();
                const userPub = user.is?.pub || "";
                if (!user.is || !userPub) {
                   resolveAuth({ err: "Authentication failed after apparent success." });
                } else {
                   resolveAuth({ pub: userPub });
                }
              }
            });
          });
        };

        // Helper per la creazione utente
        const createUser = (): Promise<{ err?: string; pub?: string }> => {
          return new Promise((resolveCreate) => {
             // Assicurati che l'utente sia sloggato prima di creare
            try {
              this.gundb.logout();
            } catch(e) { /* ignore logout errors */ }

            this.gundb.gun.user().create(username, password, (ack: any) => {
              resolveCreate({ err: ack.err, pub: ack.pub }); // pub might be present on success
            });
          });
        };

        // --- Flusso Principale ---
        log(`Attempting login first for ${username}...`);
        let loginResult = await authUser();

        if (loginResult.pub) {
          // Login riuscito, utente esiste già
          log(`Login successful for existing user. Pub: ${loginResult.pub}`);
          resolve({
            success: true,
            userPub: loginResult.pub,
          });
          return;
        }

        // Login fallito, proviamo a creare l'utente
        log(`Login failed (${loginResult.err || 'unknown reason'}), attempting user creation...`);
        const createResult = await createUser();

        if (createResult.err) {
          // Creazione fallita
          log(`User creation error: ${createResult.err}`);
          resolve({
            success: false,
            error: `User creation failed: ${createResult.err}`,
          });
          return;
        }

        // Creazione riuscita, tentiamo di nuovo il login per conferma e per ottenere userPub
        log(`User created successfully, attempting login again for confirmation...`);
        loginResult = await authUser();

        if (loginResult.pub) {
           log(`Post-creation login successful! User pub: ${loginResult.pub}`);
           resolve({
             success: true,
             userPub: loginResult.pub,
           });
        } else {
           // Questo non dovrebbe accadere se la creazione è andata a buon fine
           logError(`Post-creation login failed unexpectedly: ${loginResult.err}`);
           resolve({
             success: false,
             error: `User created, but subsequent login failed: ${loginResult.err}`,
           });
        }

      } catch (error: any) {
        const errorMsg = error.message || "Unknown error during user existence check";
        logError(`Error in createUserWithGunDB: ${errorMsg}`, error);
        resolve({
          success: false,
          error: errorMsg,
        });
      }
    });
  }

  // ----------------------------------------------------------------
  // WALLET MANAGER -------------------------------------------------
  // ----------------------------------------------------------------

  /**
   * Get main wallet
   * @returns {ethers.Wallet | null} Main wallet instance or null if not available
   * @description Retrieves the primary wallet associated with the user
   */
  getMainWallet(): ethers.Wallet | null {
    return this.walletManager?.getMainWallet() || null;
  }

  /**
   * Create new wallet
   * @returns {Promise<WalletInfo>} Created wallet information
   * @description Generates a new wallet and associates it with the user
   */
  async createWallet(): Promise<WalletInfo> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.createWallet();
  }

  /**
   * Load wallets
   * @returns {Promise<WalletInfo[]>} Array of wallet information
   * @description Retrieves all wallets associated with the authenticated user
   */
  async loadWallets(): Promise<WalletInfo[]> {
    try {
      if (!this.isLoggedIn()) {
        log("Cannot load wallets: user not authenticated");

        // Segnaliamo l'errore con il gestore centralizzato ma non interrompiamo il flusso
        ErrorHandler.handle(
          ErrorType.AUTHENTICATION,
          "AUTH_REQUIRED",
          "User authentication required to load wallets",
          null
        );

        return [];
      }

      try {
        if (!this.walletManager) {
          throw new Error("Wallet manager not initialized");
        }
        return await this.walletManager.loadWallets();
      } catch (walletError) {
        // Gestiamo l'errore in modo più dettagliato
        ErrorHandler.handle(
          ErrorType.WALLET,
          "LOAD_WALLETS_ERROR",
          `Error loading wallets: ${walletError instanceof Error ? walletError.message : String(walletError)}`,
          walletError
        );

        // Ritorniamo un array vuoto ma non interrompiamo l'applicazione
        return [];
      }
    } catch (error) {
      // Catturiamo errori generici imprevisti
      ErrorHandler.handle(
        ErrorType.UNKNOWN,
        "UNEXPECTED_ERROR",
        `Unexpected error loading wallets: ${error instanceof Error ? error.message : String(error)}`,
        error
      );

      return [];
    }
  }

  /**
   * Sign message
   * @param wallet - Wallet for signing
   * @param message - Message to sign
   * @returns {Promise<string>} Message signature
   * @description Signs a message using the provided wallet
   */
  async signMessage(
    wallet: ethers.Wallet,
    message: string | Uint8Array
  ): Promise<string> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.signMessage(wallet, message);
  }

  /**
   * Verify signature
   * @param message - Signed message
   * @param signature - Signature to verify
   * @returns {string} Address that signed the message
   * @description Recovers the address that signed a message from its signature
   */
  verifySignature(message: string | Uint8Array, signature: string): string {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.verifySignature(message, signature);
  }

  /**
   * Sign transaction
   * @param wallet - Wallet for signing
   * @param toAddress - Recipient address
   * @param value - Amount to send
   * @returns {Promise<string>} Signed transaction
   * @description Signs a transaction using the provided wallet
   */
  async signTransaction(
    wallet: ethers.Wallet,
    toAddress: string,
    value: string
  ): Promise<string> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.signTransaction(wallet, toAddress, value);
  }

  /**
   * Export user's mnemonic phrase
   * @param password Optional password to encrypt exported data
   * @returns {Promise<string>} Exported mnemonic data
   * @description Exports the mnemonic phrase used to generate user's wallets
   */
  async exportMnemonic(password?: string): Promise<string> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.exportMnemonic(password);
  }

  /**
   * Export private keys of all wallets
   * @param password Optional password to encrypt exported data
   * @returns {Promise<string>} Exported wallet keys
   * @description Exports private keys for all user's wallets
   */
  async exportWalletKeys(password?: string): Promise<string> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.exportWalletKeys(password);
  }

  /**
   * Export user's Gun pair
   * @param password Optional password to encrypt exported data
   * @returns {Promise<string>} Exported Gun pair
   * @description Exports the user's Gun authentication pair
   */
  async exportGunPair(password?: string): Promise<string> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.exportGunPair(password);
  }

  /**
   * Export all user data in a single file
   * @param password Required password to encrypt exported data
   * @returns {Promise<string>} Exported user data
   * @description Exports all user data including mnemonic, wallets and Gun pair
   */
  async exportAllUserData(password: string): Promise<string> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.exportAllUserData(password);
  }

  /**
   * Import mnemonic phrase
   * @param mnemonicData Mnemonic or encrypted JSON to import
   * @param password Optional password to decrypt mnemonic if encrypted
   * @returns {Promise<boolean>} Import success status
   * @description Imports a mnemonic phrase to generate wallets
   */
  async importMnemonic(
    mnemonicData: string,
    password?: string
  ): Promise<boolean> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.importMnemonic(mnemonicData, password);
  }

  /**
   * Import wallet private keys
   * @param walletsData JSON containing wallet data or encrypted JSON
   * @param password Optional password to decrypt data if encrypted
   * @returns {Promise<number>} Number of imported wallets
   * @description Imports wallet private keys from exported data
   */
  async importWalletKeys(
    walletsData: string,
    password?: string
  ): Promise<number> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.importWalletKeys(walletsData, password);
  }

  /**
   * Import Gun pair
   * @param pairData JSON containing Gun pair or encrypted JSON
   * @param password Optional password to decrypt data if encrypted
   * @returns {Promise<boolean>} Import success status
   * @description Imports a Gun authentication pair
   */
  async importGunPair(pairData: string, password?: string): Promise<boolean> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.importGunPair(pairData, password);
  }

  /**
   * Import complete backup
   * @param backupData Encrypted JSON containing all user data
   * @param password Password to decrypt backup
   * @param options Import options (which data to import)
   * @returns {Promise<Object>} Import results for each data type
   * @description Imports a complete user data backup including mnemonic,
   * wallets and Gun pair
   */
  async importAllUserData(
    backupData: string,
    password: string,
    options: {
      importMnemonic?: boolean;
      importWallets?: boolean;
      importGunPair?: boolean;
    } = { importMnemonic: true, importWallets: true, importGunPair: true }
  ): Promise<{
    success: boolean;
    mnemonicImported?: boolean;
    walletsImported?: number;
    gunPairImported?: boolean;
  }> {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.importAllUserData(backupData, password, options);
  }

  /**
   * Get addresses that would be derived from a mnemonic using BIP-44 standard
   * @param mnemonic The mnemonic phrase to derive addresses from
   * @param count The number of addresses to derive
   * @returns An array of Ethereum addresses
   * @description This method is useful for verifying compatibility with other wallets
   */
  getStandardBIP44Addresses(mnemonic: string, count: number = 5): string[] {
    if (!this.walletManager) {
      throw new Error("Wallet manager not initialized");
    }
    return this.walletManager.getStandardBIP44Addresses(mnemonic, count);
  }

  /**
   * Generate a new BIP-39 mnemonic phrase
   * @returns {string} A new random mnemonic phrase
   * @description Generates a cryptographically secure random mnemonic phrase
   * that can be used to derive HD wallets
   */
  generateNewMnemonic(): string {
    try {
      // Generate a new mnemonic phrase using ethers.js
      const mnemonic = ethers.Wallet.createRandom().mnemonic;
      if (!mnemonic || !mnemonic.phrase) {
        throw new Error("Failed to generate mnemonic phrase");
      }
      return mnemonic.phrase;
    } catch (error) {
      logError("Error generating mnemonic:", error);
      throw new Error("Failed to generate mnemonic phrase");
    }
  }

  /**
   * Set the RPC URL used for Ethereum network connections
   * @param rpcUrl The RPC provider URL to use
   * @returns True if the URL was successfully set
   */
  setRpcUrl(rpcUrl: string): boolean {
    try {
      if (!rpcUrl) {
        log("Invalid RPC URL provided");
        return false;
      }

      if (this.walletManager) {
        this.walletManager.setRpcUrl(rpcUrl);
      }

      // Update the provider if it's already initialized
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      log(`RPC URL updated to: ${rpcUrl}`);
      return true;
    } catch (error) {
      logError("Failed to set RPC URL", error);
      return false;
    }
  }

  /**
   * Get the currently configured RPC URL
   * @returns The current provider URL or null if not set
   */
  getRpcUrl(): string | null {
    // Access the provider URL if available
    return this.provider instanceof ethers.JsonRpcProvider
      ? (this.provider as any).connection?.url || null
      : null;
  }

  /**
   * Ensure the current user has a DID associated, creating one if needed
   * @param {DIDCreateOptions} [options] - Optional configuration for DID creation including:
   *   - network: The network to use (default: 'main')
   *   - controller: The controller of the DID (default: user's public key)
   *   - services: Array of service definitions to add to the DID document
   * @returns {Promise<string|null>} The DID identifier string or null if operation fails
   * @description Checks if the authenticated user already has a DID. If not, creates a new one.
   * If the user already has a DID and options are provided, updates the DID document accordingly.
   * @private
   */
  private async ensureUserHasDID(
    options?: DIDCreateOptions
  ): Promise<string | null> {
    try {
      if (!this.isLoggedIn()) {
        logError("Cannot ensure DID: user not authenticated");
        return null;
      }

      // Verifica se l'utente ha già un DID
      let did = await this.did?.getCurrentUserDID();

      // Se l'utente ha già un DID, lo restituiamo
      if (did) {
        log(`User already has DID: ${did}`);

        // Se sono state fornite opzioni, aggiorniamo il documento DID
        if (options && Object.keys(options).length > 0) {
          try {
            const updated = await this.did?.updateDIDDocument(did, {
              service: options.services?.map((service, index) => ({
                id: `${did}#service-${index + 1}`,
                type: service.type,
                serviceEndpoint: service.endpoint,
              })),
            });

            if (updated) {
              log(`Updated DID document for: ${did}`);
            }
          } catch (updateError) {
            logError("Error updating DID document:", updateError);
          }
        }

        return did;
      }

      // Se l'utente non ha un DID, ne creiamo uno nuovo
      log("Creating new DID for authenticated user");
      const userPub = this.gundb.gun.user().is?.pub || "";

      const mergedOptions: DIDCreateOptions = {
        network: "main",
        controller: userPub,
        ...options,
      };

      did = await this.did?.createDID(mergedOptions);

      // Emetti evento di creazione DID
      this.eventEmitter.emit("did:created", { did, userPub });

      log(`Created new DID for user: ${did}`);
      return did || null;
    } catch (error) {
      logError("Error ensuring user has DID:", error);
      return null;
    }
  }

  /**
   * Configure logging behavior for the Shogun SDK
   * @param {LoggingConfig} config - Logging configuration object containing:
   *   - level: The minimum log level to display (error, warn, info, debug, trace)
   *   - logToConsole: Whether to output logs to the console (default: true)
   *   - customLogger: Optional custom logger implementation
   *   - logTimestamps: Whether to include timestamps in logs (default: true)
   * @returns {void}
   * @description Updates the logging configuration for the SDK. Changes take effect immediately
   * for all subsequent log operations.
   */
  configureLogging(config: LoggingConfig): void {
    configureLogging(config);
    log("Logging reconfigured with new settings");
  }
}

// Export all types
export * from "./types/shogun";

// Export classes
export { GunDB } from "./gun/gun";
export { MetaMask } from "./connector/metamask";
export { Stealth } from "./stealth/stealth";
export {
  EphemeralKeyPair,
  StealthData,
  StealthAddressResult,
  LogLevel,
  LogMessage,
} from "./types/stealth";
export { Webauthn } from "./webauthn/webauthn";
export { Storage } from "./storage/storage";
export { ShogunEventEmitter } from "./events";
export { WalletManager } from "./wallet/walletManager";
