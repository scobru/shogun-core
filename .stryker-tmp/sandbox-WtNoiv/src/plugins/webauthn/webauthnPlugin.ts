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
import { Webauthn } from "./webauthn";
import { WebAuthnSigner, WebAuthnSigningCredential } from "./webauthnSigner";
import { WebAuthnCredentials, CredentialResult, WebauthnPluginInterface, WebAuthnUniformCredentials } from "./types";
import { AuthResult, SignUpResult } from "../../types/shogun";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";

/**
 * Plugin per la gestione delle funzionalità WebAuthn in ShogunCore
 */
export class WebauthnPlugin extends BasePlugin implements WebauthnPluginInterface {
  name = stryMutAct_9fa48("5762") ? "" : (stryCov_9fa48("5762"), "webauthn");
  version = stryMutAct_9fa48("5763") ? "" : (stryCov_9fa48("5763"), "1.0.0");
  description = stryMutAct_9fa48("5764") ? "" : (stryCov_9fa48("5764"), "Provides WebAuthn authentication functionality for ShogunCore");
  private webauthn: Webauthn | null = null;
  private signer: WebAuthnSigner | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    if (stryMutAct_9fa48("5765")) {
      {}
    } else {
      stryCov_9fa48("5765");
      super.initialize(core);

      // Verifica se siamo in ambiente browser
      if (stryMutAct_9fa48("5768") ? typeof window !== "undefined" : stryMutAct_9fa48("5767") ? false : stryMutAct_9fa48("5766") ? true : (stryCov_9fa48("5766", "5767", "5768"), typeof window === (stryMutAct_9fa48("5769") ? "" : (stryCov_9fa48("5769"), "undefined")))) {
        if (stryMutAct_9fa48("5770")) {
          {}
        } else {
          stryCov_9fa48("5770");
          console.warn(stryMutAct_9fa48("5771") ? "" : (stryCov_9fa48("5771"), "[webauthnPlugin] WebAuthn plugin disabled - not in browser environment"));
          return;
        }
      }

      // Verifica se WebAuthn è supportato
      if (stryMutAct_9fa48("5774") ? false : stryMutAct_9fa48("5773") ? true : stryMutAct_9fa48("5772") ? this.isSupported() : (stryCov_9fa48("5772", "5773", "5774"), !this.isSupported())) {
        if (stryMutAct_9fa48("5775")) {
          {}
        } else {
          stryCov_9fa48("5775");
          console.warn(stryMutAct_9fa48("5776") ? "" : (stryCov_9fa48("5776"), "[webauthnPlugin] WebAuthn not supported in this environment"));
          return;
        }
      }

      // Inizializziamo il modulo WebAuthn
      this.webauthn = new Webauthn(core.gun);
      this.signer = new WebAuthnSigner(this.webauthn);
      console.log(stryMutAct_9fa48("5777") ? "" : (stryCov_9fa48("5777"), "[webauthnPlugin] WebAuthn plugin initialized with signer support"));
    }
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (stryMutAct_9fa48("5778")) {
      {}
    } else {
      stryCov_9fa48("5778");
      this.webauthn = null;
      this.signer = null;
      super.destroy();
      console.log(stryMutAct_9fa48("5779") ? "" : (stryCov_9fa48("5779"), "[webauthnPlugin] WebAuthn plugin destroyed"));
    }
  }

  /**
   * Assicura che il modulo Webauthn sia inizializzato
   * @private
   */
  private assertWebauthn(): Webauthn {
    if (stryMutAct_9fa48("5780")) {
      {}
    } else {
      stryCov_9fa48("5780");
      this.assertInitialized();
      if (stryMutAct_9fa48("5783") ? false : stryMutAct_9fa48("5782") ? true : stryMutAct_9fa48("5781") ? this.webauthn : (stryCov_9fa48("5781", "5782", "5783"), !this.webauthn)) {
        if (stryMutAct_9fa48("5784")) {
          {}
        } else {
          stryCov_9fa48("5784");
          throw new Error(stryMutAct_9fa48("5785") ? "" : (stryCov_9fa48("5785"), "WebAuthn module not initialized"));
        }
      }
      return this.webauthn;
    }
  }

  /**
   * Assicura che il signer sia inizializzato
   * @private
   */
  private assertSigner(): WebAuthnSigner {
    if (stryMutAct_9fa48("5786")) {
      {}
    } else {
      stryCov_9fa48("5786");
      this.assertInitialized();
      if (stryMutAct_9fa48("5789") ? false : stryMutAct_9fa48("5788") ? true : stryMutAct_9fa48("5787") ? this.signer : (stryCov_9fa48("5787", "5788", "5789"), !this.signer)) {
        if (stryMutAct_9fa48("5790")) {
          {}
        } else {
          stryCov_9fa48("5790");
          throw new Error(stryMutAct_9fa48("5791") ? "" : (stryCov_9fa48("5791"), "WebAuthn signer not initialized"));
        }
      }
      return this.signer;
    }
  }

  /**
   * @inheritdoc
   */
  isSupported(): boolean {
    if (stryMutAct_9fa48("5792")) {
      {}
    } else {
      stryCov_9fa48("5792");
      // Verifica se siamo in ambiente browser
      if (stryMutAct_9fa48("5795") ? typeof window !== "undefined" : stryMutAct_9fa48("5794") ? false : stryMutAct_9fa48("5793") ? true : (stryCov_9fa48("5793", "5794", "5795"), typeof window === (stryMutAct_9fa48("5796") ? "" : (stryCov_9fa48("5796"), "undefined")))) {
        if (stryMutAct_9fa48("5797")) {
          {}
        } else {
          stryCov_9fa48("5797");
          return stryMutAct_9fa48("5798") ? true : (stryCov_9fa48("5798"), false);
        }
      }

      // Se il plugin non è stato inizializzato, verifica direttamente il supporto
      if (stryMutAct_9fa48("5801") ? false : stryMutAct_9fa48("5800") ? true : stryMutAct_9fa48("5799") ? this.webauthn : (stryCov_9fa48("5799", "5800", "5801"), !this.webauthn)) {
        if (stryMutAct_9fa48("5802")) {
          {}
        } else {
          stryCov_9fa48("5802");
          return stryMutAct_9fa48("5805") ? typeof window.PublicKeyCredential === "undefined" : stryMutAct_9fa48("5804") ? false : stryMutAct_9fa48("5803") ? true : (stryCov_9fa48("5803", "5804", "5805"), typeof window.PublicKeyCredential !== (stryMutAct_9fa48("5806") ? "" : (stryCov_9fa48("5806"), "undefined")));
        }
      }
      return this.webauthn.isSupported();
    }
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(username: string, existingCredential?: WebAuthnCredentials | null, isLogin: boolean = stryMutAct_9fa48("5807") ? true : (stryCov_9fa48("5807"), false)): Promise<WebAuthnUniformCredentials> {
    if (stryMutAct_9fa48("5808")) {
      {}
    } else {
      stryCov_9fa48("5808");
      return this.assertWebauthn().generateCredentials(username, existingCredential, isLogin) as Promise<WebAuthnUniformCredentials>;
    }
  }

  /**
   * @inheritdoc
   */
  async createAccount(username: string, credentials: WebAuthnCredentials | null, isNewDevice: boolean = stryMutAct_9fa48("5809") ? true : (stryCov_9fa48("5809"), false)): Promise<CredentialResult> {
    if (stryMutAct_9fa48("5810")) {
      {}
    } else {
      stryCov_9fa48("5810");
      return this.assertWebauthn().createAccount(username, credentials, isNewDevice);
    }
  }

  /**
   * @inheritdoc
   */
  async authenticateUser(username: string, salt: string | null, options?: any): Promise<CredentialResult> {
    if (stryMutAct_9fa48("5811")) {
      {}
    } else {
      stryCov_9fa48("5811");
      return this.assertWebauthn().authenticateUser(username, salt, options);
    }
  }

  /**
   * @inheritdoc
   */
  abortAuthentication(): void {
    if (stryMutAct_9fa48("5812")) {
      {}
    } else {
      stryCov_9fa48("5812");
      this.assertWebauthn().abortAuthentication();
    }
  }

  /**
   * @inheritdoc
   */
  async removeDevice(username: string, credentialId: string, credentials: WebAuthnCredentials): Promise<{
    success: boolean;
    updatedCredentials?: WebAuthnCredentials;
  }> {
    if (stryMutAct_9fa48("5813")) {
      {}
    } else {
      stryCov_9fa48("5813");
      return this.assertWebauthn().removeDevice(username, credentialId, credentials);
    }
  }

  /**
   * @inheritdoc
   */
  async createSigningCredential(username: string): Promise<WebAuthnSigningCredential> {
    if (stryMutAct_9fa48("5814")) {
      {}
    } else {
      stryCov_9fa48("5814");
      try {
        if (stryMutAct_9fa48("5815")) {
          {}
        } else {
          stryCov_9fa48("5815");
          return await this.assertSigner().createSigningCredential(username);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5816")) {
          {}
        } else {
          stryCov_9fa48("5816");
          console.error(stryMutAct_9fa48("5817") ? `` : (stryCov_9fa48("5817"), `Error creating signing credential: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * @inheritdoc
   */
  createAuthenticator(credentialId: string): (data: any) => Promise<AuthenticatorAssertionResponse> {
    if (stryMutAct_9fa48("5818")) {
      {}
    } else {
      stryCov_9fa48("5818");
      try {
        if (stryMutAct_9fa48("5819")) {
          {}
        } else {
          stryCov_9fa48("5819");
          return this.assertSigner().createAuthenticator(credentialId);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5820")) {
          {}
        } else {
          stryCov_9fa48("5820");
          console.error(stryMutAct_9fa48("5821") ? `` : (stryCov_9fa48("5821"), `Error creating authenticator: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * @inheritdoc
   */
  async createDerivedKeyPair(credentialId: string, username: string, extra?: string[]): Promise<{
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  }> {
    if (stryMutAct_9fa48("5822")) {
      {}
    } else {
      stryCov_9fa48("5822");
      try {
        if (stryMutAct_9fa48("5823")) {
          {}
        } else {
          stryCov_9fa48("5823");
          return await this.assertSigner().createDerivedKeyPair(credentialId, username, extra);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5824")) {
          {}
        } else {
          stryCov_9fa48("5824");
          console.error(stryMutAct_9fa48("5825") ? `` : (stryCov_9fa48("5825"), `Error creating derived key pair: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * @inheritdoc
   */
  async signWithDerivedKeys(data: any, credentialId: string, username: string, extra?: string[]): Promise<string> {
    if (stryMutAct_9fa48("5826")) {
      {}
    } else {
      stryCov_9fa48("5826");
      try {
        if (stryMutAct_9fa48("5827")) {
          {}
        } else {
          stryCov_9fa48("5827");
          return await this.assertSigner().signWithDerivedKeys(data, credentialId, username, extra);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5828")) {
          {}
        } else {
          stryCov_9fa48("5828");
          console.error(stryMutAct_9fa48("5829") ? `` : (stryCov_9fa48("5829"), `Error signing with derived keys: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * @inheritdoc
   */
  getSigningCredential(credentialId: string): WebAuthnSigningCredential | undefined {
    if (stryMutAct_9fa48("5830")) {
      {}
    } else {
      stryCov_9fa48("5830");
      return this.assertSigner().getCredential(credentialId);
    }
  }

  /**
   * @inheritdoc
   */
  listSigningCredentials(): WebAuthnSigningCredential[] {
    if (stryMutAct_9fa48("5831")) {
      {}
    } else {
      stryCov_9fa48("5831");
      return this.assertSigner().listCredentials();
    }
  }

  /**
   * @inheritdoc
   */
  removeSigningCredential(credentialId: string): boolean {
    if (stryMutAct_9fa48("5832")) {
      {}
    } else {
      stryCov_9fa48("5832");
      return this.assertSigner().removeCredential(credentialId);
    }
  }

  // === CONSISTENCY METHODS ===

  /**
   * Creates a Gun user from WebAuthn signing credential
   * This ensures the SAME user is created as with normal approach
   */
  async createGunUserFromSigningCredential(credentialId: string, username: string): Promise<{
    success: boolean;
    userPub?: string;
    error?: string;
  }> {
    if (stryMutAct_9fa48("5833")) {
      {}
    } else {
      stryCov_9fa48("5833");
      try {
        if (stryMutAct_9fa48("5834")) {
          {}
        } else {
          stryCov_9fa48("5834");
          const core = this.assertInitialized();
          return await this.assertSigner().createGunUser(credentialId, username, core.gun);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5835")) {
          {}
        } else {
          stryCov_9fa48("5835");
          console.error(stryMutAct_9fa48("5836") ? `` : (stryCov_9fa48("5836"), `Error creating Gun user from signing credential: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Get the Gun user public key for a signing credential
   */
  getGunUserPubFromSigningCredential(credentialId: string): string | undefined {
    if (stryMutAct_9fa48("5837")) {
      {}
    } else {
      stryCov_9fa48("5837");
      return this.assertSigner().getGunUserPub(credentialId);
    }
  }

  /**
   * Get the hashed credential ID (for consistency checking)
   */
  getHashedCredentialId(credentialId: string): string | undefined {
    if (stryMutAct_9fa48("5838")) {
      {}
    } else {
      stryCov_9fa48("5838");
      return this.assertSigner().getHashedCredentialId(credentialId);
    }
  }

  /**
   * Verify consistency between oneshot and normal approaches
   * This ensures both approaches create the same Gun user
   */
  async verifyConsistency(credentialId: string, username: string, expectedUserPub?: string): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }> {
    if (stryMutAct_9fa48("5839")) {
      {}
    } else {
      stryCov_9fa48("5839");
      try {
        if (stryMutAct_9fa48("5840")) {
          {}
        } else {
          stryCov_9fa48("5840");
          return await this.assertSigner().verifyConsistency(credentialId, username, expectedUserPub);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5841")) {
          {}
        } else {
          stryCov_9fa48("5841");
          console.error(stryMutAct_9fa48("5842") ? `` : (stryCov_9fa48("5842"), `Error verifying consistency: ${error.message}`));
          return stryMutAct_9fa48("5843") ? {} : (stryCov_9fa48("5843"), {
            consistent: stryMutAct_9fa48("5844") ? true : (stryCov_9fa48("5844"), false)
          });
        }
      }
    }
  }

  /**
   * Complete oneshot workflow that creates the SAME Gun user as normal approach
   * This is the recommended method for oneshot signing with full consistency
   */
  async setupConsistentOneshotSigning(username: string): Promise<{
    credential: WebAuthnSigningCredential;
    authenticator: (data: any) => Promise<AuthenticatorAssertionResponse>;
    gunUser: {
      success: boolean;
      userPub?: string;
      error?: string;
    };
    pub: string;
    hashedCredentialId: string;
  }> {
    if (stryMutAct_9fa48("5845")) {
      {}
    } else {
      stryCov_9fa48("5845");
      try {
        if (stryMutAct_9fa48("5846")) {
          {}
        } else {
          stryCov_9fa48("5846");
          // 1. Create signing credential (with consistent hashing)
          const credential = await this.createSigningCredential(username);

          // 2. Create authenticator
          const authenticator = this.createAuthenticator(credential.id);

          // 3. Create Gun user (same as normal approach)
          const gunUser = await this.createGunUserFromSigningCredential(credential.id, username);
          return stryMutAct_9fa48("5847") ? {} : (stryCov_9fa48("5847"), {
            credential,
            authenticator,
            gunUser,
            pub: credential.pub,
            hashedCredentialId: credential.hashedCredentialId
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5848")) {
          {}
        } else {
          stryCov_9fa48("5848");
          console.error(stryMutAct_9fa48("5849") ? `` : (stryCov_9fa48("5849"), `Error setting up consistent oneshot signing: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Login with WebAuthn
   * This is the recommended method for WebAuthn authentication
   * @param username - Username
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates user using WebAuthn credentials.
   * Requires browser support for WebAuthn and existing credentials.
   */
  async login(username: string): Promise<AuthResult> {
    if (stryMutAct_9fa48("5850")) {
      {}
    } else {
      stryCov_9fa48("5850");
      try {
        if (stryMutAct_9fa48("5851")) {
          {}
        } else {
          stryCov_9fa48("5851");
          const core = this.assertInitialized();
          if (stryMutAct_9fa48("5854") ? false : stryMutAct_9fa48("5853") ? true : stryMutAct_9fa48("5852") ? username : (stryCov_9fa48("5852", "5853", "5854"), !username)) {
            if (stryMutAct_9fa48("5855")) {
              {}
            } else {
              stryCov_9fa48("5855");
              throw new Error(stryMutAct_9fa48("5856") ? "" : (stryCov_9fa48("5856"), "Username required for WebAuthn login"));
            }
          }
          if (stryMutAct_9fa48("5859") ? false : stryMutAct_9fa48("5858") ? true : stryMutAct_9fa48("5857") ? this.isSupported() : (stryCov_9fa48("5857", "5858", "5859"), !this.isSupported())) {
            if (stryMutAct_9fa48("5860")) {
              {}
            } else {
              stryCov_9fa48("5860");
              throw new Error(stryMutAct_9fa48("5861") ? "" : (stryCov_9fa48("5861"), "WebAuthn is not supported by this browser"));
            }
          }
          const credentials: WebAuthnUniformCredentials = await this.generateCredentials(username, null, stryMutAct_9fa48("5862") ? false : (stryCov_9fa48("5862"), true));
          if (stryMutAct_9fa48("5865") ? false : stryMutAct_9fa48("5864") ? true : stryMutAct_9fa48("5863") ? credentials?.success : (stryCov_9fa48("5863", "5864", "5865"), !(stryMutAct_9fa48("5866") ? credentials.success : (stryCov_9fa48("5866"), credentials?.success)))) {
            if (stryMutAct_9fa48("5867")) {
              {}
            } else {
              stryCov_9fa48("5867");
              throw new Error(stryMutAct_9fa48("5870") ? credentials?.error && "WebAuthn verification failed" : stryMutAct_9fa48("5869") ? false : stryMutAct_9fa48("5868") ? true : (stryCov_9fa48("5868", "5869", "5870"), (stryMutAct_9fa48("5871") ? credentials.error : (stryCov_9fa48("5871"), credentials?.error)) || (stryMutAct_9fa48("5872") ? "" : (stryCov_9fa48("5872"), "WebAuthn verification failed"))));
            }
          }

          // Usa le chiavi derivate per login
          core.setAuthMethod(stryMutAct_9fa48("5873") ? "" : (stryCov_9fa48("5873"), "webauthn"));
          const loginResult = await core.login(username, stryMutAct_9fa48("5874") ? "Stryker was here!" : (stryCov_9fa48("5874"), ""), credentials.key);
          if (stryMutAct_9fa48("5876") ? false : stryMutAct_9fa48("5875") ? true : (stryCov_9fa48("5875", "5876"), loginResult.success)) {
            if (stryMutAct_9fa48("5877")) {
              {}
            } else {
              stryCov_9fa48("5877");
              return stryMutAct_9fa48("5878") ? {} : (stryCov_9fa48("5878"), {
                ...loginResult
              });
            }
          } else {
            if (stryMutAct_9fa48("5879")) {
              {}
            } else {
              stryCov_9fa48("5879");
              return loginResult;
            }
          }
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5880")) {
          {}
        } else {
          stryCov_9fa48("5880");
          console.error(stryMutAct_9fa48("5881") ? `` : (stryCov_9fa48("5881"), `Error during WebAuthn login: ${error}`));
          ErrorHandler.handle(ErrorType.WEBAUTHN, stryMutAct_9fa48("5882") ? "" : (stryCov_9fa48("5882"), "WEBAUTHN_LOGIN_ERROR"), stryMutAct_9fa48("5885") ? error.message && "Error during WebAuthn login" : stryMutAct_9fa48("5884") ? false : stryMutAct_9fa48("5883") ? true : (stryCov_9fa48("5883", "5884", "5885"), error.message || (stryMutAct_9fa48("5886") ? "" : (stryCov_9fa48("5886"), "Error during WebAuthn login"))), error);
          return stryMutAct_9fa48("5887") ? {} : (stryCov_9fa48("5887"), {
            success: stryMutAct_9fa48("5888") ? true : (stryCov_9fa48("5888"), false),
            error: stryMutAct_9fa48("5891") ? error.message && "Error during WebAuthn login" : stryMutAct_9fa48("5890") ? false : stryMutAct_9fa48("5889") ? true : (stryCov_9fa48("5889", "5890", "5891"), error.message || (stryMutAct_9fa48("5892") ? "" : (stryCov_9fa48("5892"), "Error during WebAuthn login")))
          });
        }
      }
    }
  }

  /**
   * Register new user with WebAuthn
   * This is the recommended method for WebAuthn registration
   * @param username - Username
   * @returns {Promise<SignUpResult>} Registration result
   * @description Creates a new user account using WebAuthn credentials.
   * Requires browser support for WebAuthn.
   */
  async signUp(username: string): Promise<SignUpResult> {
    if (stryMutAct_9fa48("5893")) {
      {}
    } else {
      stryCov_9fa48("5893");
      try {
        if (stryMutAct_9fa48("5894")) {
          {}
        } else {
          stryCov_9fa48("5894");
          const core = this.assertInitialized();
          if (stryMutAct_9fa48("5897") ? false : stryMutAct_9fa48("5896") ? true : stryMutAct_9fa48("5895") ? username : (stryCov_9fa48("5895", "5896", "5897"), !username)) {
            if (stryMutAct_9fa48("5898")) {
              {}
            } else {
              stryCov_9fa48("5898");
              throw new Error(stryMutAct_9fa48("5899") ? "" : (stryCov_9fa48("5899"), "Username required for WebAuthn registration"));
            }
          }
          if (stryMutAct_9fa48("5902") ? false : stryMutAct_9fa48("5901") ? true : stryMutAct_9fa48("5900") ? this.isSupported() : (stryCov_9fa48("5900", "5901", "5902"), !this.isSupported())) {
            if (stryMutAct_9fa48("5903")) {
              {}
            } else {
              stryCov_9fa48("5903");
              throw new Error(stryMutAct_9fa48("5904") ? "" : (stryCov_9fa48("5904"), "WebAuthn is not supported by this browser"));
            }
          }
          const credentials: WebAuthnUniformCredentials = await this.generateCredentials(username, null, stryMutAct_9fa48("5905") ? true : (stryCov_9fa48("5905"), false));
          if (stryMutAct_9fa48("5908") ? false : stryMutAct_9fa48("5907") ? true : stryMutAct_9fa48("5906") ? credentials?.success : (stryCov_9fa48("5906", "5907", "5908"), !(stryMutAct_9fa48("5909") ? credentials.success : (stryCov_9fa48("5909"), credentials?.success)))) {
            if (stryMutAct_9fa48("5910")) {
              {}
            } else {
              stryCov_9fa48("5910");
              throw new Error(stryMutAct_9fa48("5913") ? credentials?.error && "Unable to generate WebAuthn credentials" : stryMutAct_9fa48("5912") ? false : stryMutAct_9fa48("5911") ? true : (stryCov_9fa48("5911", "5912", "5913"), (stryMutAct_9fa48("5914") ? credentials.error : (stryCov_9fa48("5914"), credentials?.error)) || (stryMutAct_9fa48("5915") ? "" : (stryCov_9fa48("5915"), "Unable to generate WebAuthn credentials"))));
            }
          }

          // Usa le chiavi derivate per signup
          core.setAuthMethod(stryMutAct_9fa48("5916") ? "" : (stryCov_9fa48("5916"), "webauthn"));
          const signupResult = await core.signUp(username, stryMutAct_9fa48("5917") ? "Stryker was here!" : (stryCov_9fa48("5917"), ""), stryMutAct_9fa48("5918") ? "Stryker was here!" : (stryCov_9fa48("5918"), ""), credentials.key);
          if (stryMutAct_9fa48("5920") ? false : stryMutAct_9fa48("5919") ? true : (stryCov_9fa48("5919", "5920"), signupResult.success)) {
            if (stryMutAct_9fa48("5921")) {
              {}
            } else {
              stryCov_9fa48("5921");
              return stryMutAct_9fa48("5922") ? {} : (stryCov_9fa48("5922"), {
                ...signupResult
              });
            }
          } else {
            if (stryMutAct_9fa48("5923")) {
              {}
            } else {
              stryCov_9fa48("5923");
              return signupResult;
            }
          }
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5924")) {
          {}
        } else {
          stryCov_9fa48("5924");
          console.error(stryMutAct_9fa48("5925") ? `` : (stryCov_9fa48("5925"), `Error during WebAuthn registration: ${error}`));
          ErrorHandler.handle(ErrorType.WEBAUTHN, stryMutAct_9fa48("5926") ? "" : (stryCov_9fa48("5926"), "WEBAUTHN_SIGNUP_ERROR"), stryMutAct_9fa48("5929") ? error.message && "Error during WebAuthn registration" : stryMutAct_9fa48("5928") ? false : stryMutAct_9fa48("5927") ? true : (stryCov_9fa48("5927", "5928", "5929"), error.message || (stryMutAct_9fa48("5930") ? "" : (stryCov_9fa48("5930"), "Error during WebAuthn registration"))), error);
          return stryMutAct_9fa48("5931") ? {} : (stryCov_9fa48("5931"), {
            success: stryMutAct_9fa48("5932") ? true : (stryCov_9fa48("5932"), false),
            error: stryMutAct_9fa48("5935") ? error.message && "Error during WebAuthn registration" : stryMutAct_9fa48("5934") ? false : stryMutAct_9fa48("5933") ? true : (stryCov_9fa48("5933", "5934", "5935"), error.message || (stryMutAct_9fa48("5936") ? "" : (stryCov_9fa48("5936"), "Error during WebAuthn registration")))
          });
        }
      }
    }
  }
}

// Export only the interface, not the plugin itself again
export type { WebauthnPluginInterface } from "./types";