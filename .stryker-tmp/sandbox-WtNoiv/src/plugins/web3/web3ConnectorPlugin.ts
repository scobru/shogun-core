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
import { Web3Connector } from "./web3Connector";
import { Web3Signer, Web3SigningCredential } from "./web3Signer";
import { ConnectionResult, Web3ConectorPluginInterface } from "./types";
import { ethers } from "ethers";
import { AuthResult, SignUpResult } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";
import { ISEAPair } from "gun";

/**
 * Plugin per la gestione delle funzionalità Web3 in ShogunCore
 */
export class Web3ConnectorPlugin extends BasePlugin implements Web3ConectorPluginInterface {
  name = stryMutAct_9fa48("5134") ? "" : (stryCov_9fa48("5134"), "web3");
  version = stryMutAct_9fa48("5135") ? "" : (stryCov_9fa48("5135"), "1.0.0");
  description = stryMutAct_9fa48("5136") ? "" : (stryCov_9fa48("5136"), "Provides Ethereum wallet connection and authentication for ShogunCore");
  private Web3: Web3Connector | null = null;
  private signer: Web3Signer | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    if (stryMutAct_9fa48("5137")) {
      {}
    } else {
      stryCov_9fa48("5137");
      super.initialize(core);

      // Inizializziamo il modulo Web3
      this.Web3 = new Web3Connector();
      this.signer = new Web3Signer(this.Web3);

      // Rimuovo i console.log superflui
    }
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (stryMutAct_9fa48("5138")) {
      {}
    } else {
      stryCov_9fa48("5138");
      if (stryMutAct_9fa48("5140") ? false : stryMutAct_9fa48("5139") ? true : (stryCov_9fa48("5139", "5140"), this.Web3)) {
        if (stryMutAct_9fa48("5141")) {
          {}
        } else {
          stryCov_9fa48("5141");
          this.Web3.cleanup();
        }
      }
      this.Web3 = null;
      this.signer = null;
      super.destroy();
      // Linea 50
    }
  }

  /**
   * Assicura che il modulo Web3 sia inizializzato
   * @private
   */
  private assertMetaMask(): Web3Connector {
    if (stryMutAct_9fa48("5142")) {
      {}
    } else {
      stryCov_9fa48("5142");
      this.assertInitialized();
      if (stryMutAct_9fa48("5145") ? false : stryMutAct_9fa48("5144") ? true : stryMutAct_9fa48("5143") ? this.Web3 : (stryCov_9fa48("5143", "5144", "5145"), !this.Web3)) {
        if (stryMutAct_9fa48("5146")) {
          {}
        } else {
          stryCov_9fa48("5146");
          throw new Error(stryMutAct_9fa48("5147") ? "" : (stryCov_9fa48("5147"), "Web3 module not initialized"));
        }
      }
      return this.Web3;
    }
  }

  /**
   * Assicura che il signer sia inizializzato
   * @private
   */
  private assertSigner(): Web3Signer {
    if (stryMutAct_9fa48("5148")) {
      {}
    } else {
      stryCov_9fa48("5148");
      this.assertInitialized();
      if (stryMutAct_9fa48("5151") ? false : stryMutAct_9fa48("5150") ? true : stryMutAct_9fa48("5149") ? this.signer : (stryCov_9fa48("5149", "5150", "5151"), !this.signer)) {
        if (stryMutAct_9fa48("5152")) {
          {}
        } else {
          stryCov_9fa48("5152");
          throw new Error(stryMutAct_9fa48("5153") ? "" : (stryCov_9fa48("5153"), "Web3 signer not initialized"));
        }
      }
      return this.signer;
    }
  }

  /**
   * @inheritdoc
   */
  isAvailable(): boolean {
    if (stryMutAct_9fa48("5154")) {
      {}
    } else {
      stryCov_9fa48("5154");
      return this.assertMetaMask().isAvailable();
    }
  }

  /**
   * @inheritdoc
   */
  async connectMetaMask(): Promise<ConnectionResult> {
    if (stryMutAct_9fa48("5155")) {
      {}
    } else {
      stryCov_9fa48("5155");
      return this.assertMetaMask().connectMetaMask();
    }
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(address: string): Promise<ISEAPair> {
    if (stryMutAct_9fa48("5156")) {
      {}
    } else {
      stryCov_9fa48("5156");
      // Rimuovo i console.log superflui
      return this.assertMetaMask().generateCredentials(address);
    }
  }

  /**
   * @inheritdoc
   */
  cleanup(): void {
    if (stryMutAct_9fa48("5157")) {
      {}
    } else {
      stryCov_9fa48("5157");
      this.assertMetaMask().cleanup();
    }
  }

  /**
   * @inheritdoc
   */
  setCustomProvider(rpcUrl: string, privateKey: string): void {
    if (stryMutAct_9fa48("5158")) {
      {}
    } else {
      stryCov_9fa48("5158");
      this.assertMetaMask().setCustomProvider(rpcUrl, privateKey);
    }
  }

  /**
   * @inheritdoc
   */
  async getSigner(): Promise<ethers.Signer> {
    if (stryMutAct_9fa48("5159")) {
      {}
    } else {
      stryCov_9fa48("5159");
      return this.assertMetaMask().getSigner();
    }
  }

  /**
   * @inheritdoc
   */
  async getProvider(): Promise<ethers.JsonRpcProvider | ethers.BrowserProvider> {
    if (stryMutAct_9fa48("5160")) {
      {}
    } else {
      stryCov_9fa48("5160");
      return this.assertMetaMask().getProvider();
    }
  }

  /**
   * @inheritdoc
   */
  async generatePassword(signature: string): Promise<string> {
    if (stryMutAct_9fa48("5161")) {
      {}
    } else {
      stryCov_9fa48("5161");
      return this.assertMetaMask().generatePassword(signature);
    }
  }

  /**
   * @inheritdoc
   */
  async verifySignature(message: string, signature: string): Promise<string> {
    if (stryMutAct_9fa48("5162")) {
      {}
    } else {
      stryCov_9fa48("5162");
      return this.assertMetaMask().verifySignature(message, signature);
    }
  }

  // === WEB3 SIGNER METHODS ===

  /**
   * Creates a new Web3 signing credential
   * CONSISTENT with normal Web3 approach
   */
  async createSigningCredential(address: string): Promise<Web3SigningCredential> {
    if (stryMutAct_9fa48("5163")) {
      {}
    } else {
      stryCov_9fa48("5163");
      try {
        if (stryMutAct_9fa48("5164")) {
          {}
        } else {
          stryCov_9fa48("5164");
          return await this.assertSigner().createSigningCredential(address);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5165")) {
          {}
        } else {
          stryCov_9fa48("5165");
          console.error(stryMutAct_9fa48("5166") ? `` : (stryCov_9fa48("5166"), `Error creating Web3 signing credential: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Creates an authenticator function for Web3 signing
   */
  createAuthenticator(address: string): (data: any) => Promise<string> {
    if (stryMutAct_9fa48("5167")) {
      {}
    } else {
      stryCov_9fa48("5167");
      try {
        if (stryMutAct_9fa48("5168")) {
          {}
        } else {
          stryCov_9fa48("5168");
          return this.assertSigner().createAuthenticator(address);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5169")) {
          {}
        } else {
          stryCov_9fa48("5169");
          console.error(stryMutAct_9fa48("5170") ? `` : (stryCov_9fa48("5170"), `Error creating Web3 authenticator: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Creates a derived key pair from Web3 credential
   */
  async createDerivedKeyPair(address: string, extra?: string[]): Promise<{
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  }> {
    if (stryMutAct_9fa48("5171")) {
      {}
    } else {
      stryCov_9fa48("5171");
      try {
        if (stryMutAct_9fa48("5172")) {
          {}
        } else {
          stryCov_9fa48("5172");
          return await this.assertSigner().createDerivedKeyPair(address, extra);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5173")) {
          {}
        } else {
          stryCov_9fa48("5173");
          console.error(stryMutAct_9fa48("5174") ? `` : (stryCov_9fa48("5174"), `Error creating derived key pair: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Signs data with derived keys after Web3 verification
   */
  async signWithDerivedKeys(data: any, address: string, extra?: string[]): Promise<string> {
    if (stryMutAct_9fa48("5175")) {
      {}
    } else {
      stryCov_9fa48("5175");
      try {
        if (stryMutAct_9fa48("5176")) {
          {}
        } else {
          stryCov_9fa48("5176");
          return await this.assertSigner().signWithDerivedKeys(data, address, extra);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5177")) {
          {}
        } else {
          stryCov_9fa48("5177");
          console.error(stryMutAct_9fa48("5178") ? `` : (stryCov_9fa48("5178"), `Error signing with derived keys: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Get signing credential by address
   */
  getSigningCredential(address: string): Web3SigningCredential | undefined {
    if (stryMutAct_9fa48("5179")) {
      {}
    } else {
      stryCov_9fa48("5179");
      return this.assertSigner().getCredential(address);
    }
  }

  /**
   * List all signing credentials
   */
  listSigningCredentials(): Web3SigningCredential[] {
    if (stryMutAct_9fa48("5180")) {
      {}
    } else {
      stryCov_9fa48("5180");
      return this.assertSigner().listCredentials();
    }
  }

  /**
   * Remove a signing credential
   */
  removeSigningCredential(address: string): boolean {
    if (stryMutAct_9fa48("5181")) {
      {}
    } else {
      stryCov_9fa48("5181");
      return this.assertSigner().removeCredential(address);
    }
  }

  // === CONSISTENCY METHODS ===

  /**
   * Creates a Gun user from Web3 signing credential
   * This ensures the SAME user is created as with normal approach
   */
  async createGunUserFromSigningCredential(address: string): Promise<{
    success: boolean;
    userPub?: string;
    error?: string;
  }> {
    if (stryMutAct_9fa48("5182")) {
      {}
    } else {
      stryCov_9fa48("5182");
      try {
        if (stryMutAct_9fa48("5183")) {
          {}
        } else {
          stryCov_9fa48("5183");
          const core = this.assertInitialized();
          return await this.assertSigner().createGunUser(address, core.gun);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5184")) {
          {}
        } else {
          stryCov_9fa48("5184");
          console.error(stryMutAct_9fa48("5185") ? `` : (stryCov_9fa48("5185"), `Error creating Gun user from Web3 signing credential: ${error.message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Get the Gun user public key for a signing credential
   */
  getGunUserPubFromSigningCredential(address: string): string | undefined {
    if (stryMutAct_9fa48("5186")) {
      {}
    } else {
      stryCov_9fa48("5186");
      return this.assertSigner().getGunUserPub(address);
    }
  }

  /**
   * Get the password (for consistency checking)
   */
  getPassword(address: string): string | undefined {
    if (stryMutAct_9fa48("5187")) {
      {}
    } else {
      stryCov_9fa48("5187");
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
    if (stryMutAct_9fa48("5188")) {
      {}
    } else {
      stryCov_9fa48("5188");
      try {
        if (stryMutAct_9fa48("5189")) {
          {}
        } else {
          stryCov_9fa48("5189");
          return await this.assertSigner().verifyConsistency(address, expectedUserPub);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5190")) {
          {}
        } else {
          stryCov_9fa48("5190");
          console.error(stryMutAct_9fa48("5191") ? `` : (stryCov_9fa48("5191"), `Error verifying Web3 consistency: ${error.message}`));
          return stryMutAct_9fa48("5192") ? {} : (stryCov_9fa48("5192"), {
            consistent: stryMutAct_9fa48("5193") ? true : (stryCov_9fa48("5193"), false)
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
    credential: Web3SigningCredential;
    authenticator: (data: any) => Promise<string>;
    gunUser: {
      success: boolean;
      userPub?: string;
      error?: string;
    };
    username: string;
    password: string;
  }> {
    if (stryMutAct_9fa48("5194")) {
      {}
    } else {
      stryCov_9fa48("5194");
      try {
        if (stryMutAct_9fa48("5195")) {
          {}
        } else {
          stryCov_9fa48("5195");
          // 1. Create signing credential (with consistent password generation)
          const credential = await this.createSigningCredential(address);

          // 2. Create authenticator
          const authenticator = this.createAuthenticator(address);

          // 3. Create Gun user (same as normal approach)
          const gunUser = await this.createGunUserFromSigningCredential(address);
          return stryMutAct_9fa48("5196") ? {} : (stryCov_9fa48("5196"), {
            credential,
            authenticator,
            gunUser,
            username: credential.username,
            password: credential.password
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5197")) {
          {}
        } else {
          stryCov_9fa48("5197");
          console.error(stryMutAct_9fa48("5198") ? `` : (stryCov_9fa48("5198"), `Error setting up consistent Web3 oneshot signing: ${error.message}`));
          throw error;
        }
      }
    }
  }

  // === EXISTING METHODS ===

  /**
   * Login con Web3
   * @param address - Indirizzo Ethereum
   * @returns {Promise<AuthResult>} Risultato dell'autenticazione
   * @description Autentica l'utente usando le credenziali del wallet Web3 dopo la verifica della firma
   */
  async login(address: string): Promise<AuthResult> {
    if (stryMutAct_9fa48("5199")) {
      {}
    } else {
      stryCov_9fa48("5199");
      try {
        if (stryMutAct_9fa48("5200")) {
          {}
        } else {
          stryCov_9fa48("5200");
          const core = this.assertInitialized();
          if (stryMutAct_9fa48("5203") ? false : stryMutAct_9fa48("5202") ? true : stryMutAct_9fa48("5201") ? address : (stryCov_9fa48("5201", "5202", "5203"), !address)) {
            if (stryMutAct_9fa48("5204")) {
              {}
            } else {
              stryCov_9fa48("5204");
              throw createError(ErrorType.VALIDATION, stryMutAct_9fa48("5205") ? "" : (stryCov_9fa48("5205"), "ADDRESS_REQUIRED"), stryMutAct_9fa48("5206") ? "" : (stryCov_9fa48("5206"), "Ethereum address required for Web3 login"));
            }
          }
          if (stryMutAct_9fa48("5209") ? false : stryMutAct_9fa48("5208") ? true : stryMutAct_9fa48("5207") ? this.isAvailable() : (stryCov_9fa48("5207", "5208", "5209"), !this.isAvailable())) {
            if (stryMutAct_9fa48("5210")) {
              {}
            } else {
              stryCov_9fa48("5210");
              throw createError(ErrorType.ENVIRONMENT, stryMutAct_9fa48("5211") ? "" : (stryCov_9fa48("5211"), "WEB3_UNAVAILABLE"), stryMutAct_9fa48("5212") ? "" : (stryCov_9fa48("5212"), "Web3 is not available in the browser"));
            }
          }
          const k = await this.generateCredentials(address);
          const username = stryMutAct_9fa48("5213") ? address.toUpperCase() : (stryCov_9fa48("5213"), address.toLowerCase());
          if (stryMutAct_9fa48("5216") ? !k?.pub && !k?.priv : stryMutAct_9fa48("5215") ? false : stryMutAct_9fa48("5214") ? true : (stryCov_9fa48("5214", "5215", "5216"), (stryMutAct_9fa48("5217") ? k?.pub : (stryCov_9fa48("5217"), !(stryMutAct_9fa48("5218") ? k.pub : (stryCov_9fa48("5218"), k?.pub)))) || (stryMutAct_9fa48("5219") ? k?.priv : (stryCov_9fa48("5219"), !(stryMutAct_9fa48("5220") ? k.priv : (stryCov_9fa48("5220"), k?.priv)))))) {
            if (stryMutAct_9fa48("5221")) {
              {}
            } else {
              stryCov_9fa48("5221");
              throw createError(ErrorType.AUTHENTICATION, stryMutAct_9fa48("5222") ? "" : (stryCov_9fa48("5222"), "CREDENTIAL_GENERATION_FAILED"), stryMutAct_9fa48("5223") ? "" : (stryCov_9fa48("5223"), "Web3 credentials not generated correctly or signature missing"));
            }
          }

          // Set authentication method to web3 before login
          core.setAuthMethod(stryMutAct_9fa48("5224") ? "" : (stryCov_9fa48("5224"), "web3"));

          // Use core's login method with direct GunDB authentication
          const loginResult = await core.login(username, stryMutAct_9fa48("5225") ? "Stryker was here!" : (stryCov_9fa48("5225"), ""), k);
          if (stryMutAct_9fa48("5228") ? false : stryMutAct_9fa48("5227") ? true : stryMutAct_9fa48("5226") ? loginResult.success : (stryCov_9fa48("5226", "5227", "5228"), !loginResult.success)) {
            if (stryMutAct_9fa48("5229")) {
              {}
            } else {
              stryCov_9fa48("5229");
              throw createError(ErrorType.AUTHENTICATION, stryMutAct_9fa48("5230") ? "" : (stryCov_9fa48("5230"), "WEB3_LOGIN_FAILED"), stryMutAct_9fa48("5233") ? loginResult.error && "Failed to log in with Web3 credentials" : stryMutAct_9fa48("5232") ? false : stryMutAct_9fa48("5231") ? true : (stryCov_9fa48("5231", "5232", "5233"), loginResult.error || (stryMutAct_9fa48("5234") ? "" : (stryCov_9fa48("5234"), "Failed to log in with Web3 credentials"))));
            }
          }

          // Emit login event
          core.emit(stryMutAct_9fa48("5235") ? "" : (stryCov_9fa48("5235"), "auth:login"), stryMutAct_9fa48("5236") ? {} : (stryCov_9fa48("5236"), {
            userPub: stryMutAct_9fa48("5239") ? loginResult.userPub && "" : stryMutAct_9fa48("5238") ? false : stryMutAct_9fa48("5237") ? true : (stryCov_9fa48("5237", "5238", "5239"), loginResult.userPub || (stryMutAct_9fa48("5240") ? "Stryker was here!" : (stryCov_9fa48("5240"), ""))),
            username: address,
            method: stryMutAct_9fa48("5241") ? "" : (stryCov_9fa48("5241"), "web3")
          }));
          return loginResult;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5242")) {
          {}
        } else {
          stryCov_9fa48("5242");
          // Handle both ShogunError and generic errors
          const errorType = stryMutAct_9fa48("5245") ? error?.type && ErrorType.AUTHENTICATION : stryMutAct_9fa48("5244") ? false : stryMutAct_9fa48("5243") ? true : (stryCov_9fa48("5243", "5244", "5245"), (stryMutAct_9fa48("5246") ? error.type : (stryCov_9fa48("5246"), error?.type)) || ErrorType.AUTHENTICATION);
          const errorCode = stryMutAct_9fa48("5249") ? error?.code && "WEB3_LOGIN_ERROR" : stryMutAct_9fa48("5248") ? false : stryMutAct_9fa48("5247") ? true : (stryCov_9fa48("5247", "5248", "5249"), (stryMutAct_9fa48("5250") ? error.code : (stryCov_9fa48("5250"), error?.code)) || (stryMutAct_9fa48("5251") ? "" : (stryCov_9fa48("5251"), "WEB3_LOGIN_ERROR")));
          const errorMessage = stryMutAct_9fa48("5254") ? error?.message && "Unknown error during Web3 login" : stryMutAct_9fa48("5253") ? false : stryMutAct_9fa48("5252") ? true : (stryCov_9fa48("5252", "5253", "5254"), (stryMutAct_9fa48("5255") ? error.message : (stryCov_9fa48("5255"), error?.message)) || (stryMutAct_9fa48("5256") ? "" : (stryCov_9fa48("5256"), "Unknown error during Web3 login")));
          const handledError = ErrorHandler.handle(errorType, errorCode, errorMessage, error);
          return stryMutAct_9fa48("5257") ? {} : (stryCov_9fa48("5257"), {
            success: stryMutAct_9fa48("5258") ? true : (stryCov_9fa48("5258"), false),
            error: handledError.message
          });
        }
      }
    }
  }

  /**
   * Register new user with Web3 wallet
   * @param address - Ethereum address
   * @returns {Promise<SignUpResult>} Registration result
   */
  async signUp(address: string): Promise<SignUpResult> {
    if (stryMutAct_9fa48("5259")) {
      {}
    } else {
      stryCov_9fa48("5259");
      try {
        if (stryMutAct_9fa48("5260")) {
          {}
        } else {
          stryCov_9fa48("5260");
          const core = this.assertInitialized();
          if (stryMutAct_9fa48("5263") ? false : stryMutAct_9fa48("5262") ? true : stryMutAct_9fa48("5261") ? address : (stryCov_9fa48("5261", "5262", "5263"), !address)) {
            if (stryMutAct_9fa48("5264")) {
              {}
            } else {
              stryCov_9fa48("5264");
              throw createError(ErrorType.VALIDATION, stryMutAct_9fa48("5265") ? "" : (stryCov_9fa48("5265"), "ADDRESS_REQUIRED"), stryMutAct_9fa48("5266") ? "" : (stryCov_9fa48("5266"), "Ethereum address required for Web3 registration"));
            }
          }
          if (stryMutAct_9fa48("5269") ? false : stryMutAct_9fa48("5268") ? true : stryMutAct_9fa48("5267") ? this.isAvailable() : (stryCov_9fa48("5267", "5268", "5269"), !this.isAvailable())) {
            if (stryMutAct_9fa48("5270")) {
              {}
            } else {
              stryCov_9fa48("5270");
              throw createError(ErrorType.ENVIRONMENT, stryMutAct_9fa48("5271") ? "" : (stryCov_9fa48("5271"), "WEB3_UNAVAILABLE"), stryMutAct_9fa48("5272") ? "" : (stryCov_9fa48("5272"), "Web3 is not available in the browser"));
            }
          }
          const k = await this.generateCredentials(address);
          const username = stryMutAct_9fa48("5273") ? address.toUpperCase() : (stryCov_9fa48("5273"), address.toLowerCase());
          if (stryMutAct_9fa48("5276") ? !k?.pub && !k?.priv : stryMutAct_9fa48("5275") ? false : stryMutAct_9fa48("5274") ? true : (stryCov_9fa48("5274", "5275", "5276"), (stryMutAct_9fa48("5277") ? k?.pub : (stryCov_9fa48("5277"), !(stryMutAct_9fa48("5278") ? k.pub : (stryCov_9fa48("5278"), k?.pub)))) || (stryMutAct_9fa48("5279") ? k?.priv : (stryCov_9fa48("5279"), !(stryMutAct_9fa48("5280") ? k.priv : (stryCov_9fa48("5280"), k?.priv)))))) {
            if (stryMutAct_9fa48("5281")) {
              {}
            } else {
              stryCov_9fa48("5281");
              throw createError(ErrorType.AUTHENTICATION, stryMutAct_9fa48("5282") ? "" : (stryCov_9fa48("5282"), "CREDENTIAL_GENERATION_FAILED"), stryMutAct_9fa48("5283") ? "" : (stryCov_9fa48("5283"), "Web3 credentials not generated correctly or signature missing"));
            }
          }

          // Set authentication method to web3 before signup
          core.setAuthMethod(stryMutAct_9fa48("5284") ? "" : (stryCov_9fa48("5284"), "web3"));

          // Use core's signUp method with direct GunDB authentication
          const signupResult = await core.signUp(username, stryMutAct_9fa48("5285") ? "Stryker was here!" : (stryCov_9fa48("5285"), ""), stryMutAct_9fa48("5286") ? "Stryker was here!" : (stryCov_9fa48("5286"), ""), k);
          if (stryMutAct_9fa48("5289") ? false : stryMutAct_9fa48("5288") ? true : stryMutAct_9fa48("5287") ? signupResult.success : (stryCov_9fa48("5287", "5288", "5289"), !signupResult.success)) {
            if (stryMutAct_9fa48("5290")) {
              {}
            } else {
              stryCov_9fa48("5290");
              throw createError(ErrorType.AUTHENTICATION, stryMutAct_9fa48("5291") ? "" : (stryCov_9fa48("5291"), "WEB3_SIGNUP_FAILED"), stryMutAct_9fa48("5294") ? signupResult.error && "Failed to sign up with Web3 credentials" : stryMutAct_9fa48("5293") ? false : stryMutAct_9fa48("5292") ? true : (stryCov_9fa48("5292", "5293", "5294"), signupResult.error || (stryMutAct_9fa48("5295") ? "" : (stryCov_9fa48("5295"), "Failed to sign up with Web3 credentials"))));
            }
          }
          return signupResult;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5296")) {
          {}
        } else {
          stryCov_9fa48("5296");
          // Handle both ShogunError and generic errors
          const errorType = stryMutAct_9fa48("5299") ? error?.type && ErrorType.AUTHENTICATION : stryMutAct_9fa48("5298") ? false : stryMutAct_9fa48("5297") ? true : (stryCov_9fa48("5297", "5298", "5299"), (stryMutAct_9fa48("5300") ? error.type : (stryCov_9fa48("5300"), error?.type)) || ErrorType.AUTHENTICATION);
          const errorCode = stryMutAct_9fa48("5303") ? error?.code && "WEB3_SIGNUP_ERROR" : stryMutAct_9fa48("5302") ? false : stryMutAct_9fa48("5301") ? true : (stryCov_9fa48("5301", "5302", "5303"), (stryMutAct_9fa48("5304") ? error.code : (stryCov_9fa48("5304"), error?.code)) || (stryMutAct_9fa48("5305") ? "" : (stryCov_9fa48("5305"), "WEB3_SIGNUP_ERROR")));
          const errorMessage = stryMutAct_9fa48("5308") ? error?.message && "Unknown error during Web3 registration" : stryMutAct_9fa48("5307") ? false : stryMutAct_9fa48("5306") ? true : (stryCov_9fa48("5306", "5307", "5308"), (stryMutAct_9fa48("5309") ? error.message : (stryCov_9fa48("5309"), error?.message)) || (stryMutAct_9fa48("5310") ? "" : (stryCov_9fa48("5310"), "Unknown error during Web3 registration")));
          const handledError = ErrorHandler.handle(errorType, errorCode, errorMessage, error);
          return stryMutAct_9fa48("5311") ? {} : (stryCov_9fa48("5311"), {
            success: stryMutAct_9fa48("5312") ? true : (stryCov_9fa48("5312"), false),
            error: handledError.message
          });
        }
      }
    }
  }
}

// Export only the interface, not the plugin itself again
export type { Web3ConectorPluginInterface } from "./types";