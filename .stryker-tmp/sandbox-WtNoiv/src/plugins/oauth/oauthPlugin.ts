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
import { OAuthConnector } from "./oauthConnector";
import { OAuthPluginInterface, OAuthConfig, OAuthProvider, OAuthConnectionResult, OAuthCredentials, OAuthUserInfo } from "./types";
import { AuthResult, SignUpResult, AuthMethod } from "../../types/shogun";
import { ErrorHandler, ErrorType, createError } from "../../utils/errorHandler";
import { ShogunStorage } from "../../storage/storage";
import { ISEAPair } from "gun";

/**
 * OAuth Plugin for ShogunCore
 * Provides authentication with external OAuth providers
 */
export class OAuthPlugin extends BasePlugin implements OAuthPluginInterface {
  name = stryMutAct_9fa48("4494") ? "" : (stryCov_9fa48("4494"), "oauth");
  version = stryMutAct_9fa48("4495") ? "" : (stryCov_9fa48("4495"), "1.0.0");
  description = stryMutAct_9fa48("4496") ? "" : (stryCov_9fa48("4496"), "Provides OAuth authentication with external providers for ShogunCore");
  private oauthConnector: OAuthConnector | null = null;
  private config: Partial<OAuthConfig> = {};
  private storage: ShogunStorage | null = null;

  /**
   * Constructor for OAuthPlugin
   * @param config - Initial configuration for OAuth
   */
  constructor(config?: Partial<OAuthConfig>) {
    super();
    if (stryMutAct_9fa48("4498") ? false : stryMutAct_9fa48("4497") ? true : (stryCov_9fa48("4497", "4498"), config)) {
      if (stryMutAct_9fa48("4499")) {
        {}
      } else {
        stryCov_9fa48("4499");
        this.config = config;
      }
    }
  }

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    if (stryMutAct_9fa48("4500")) {
      {}
    } else {
      stryCov_9fa48("4500");
      this.core = core;
      this.storage = new ShogunStorage();

      // Inizializziamo il connector OAuth con la configurazione già presente
      this.oauthConnector = new OAuthConnector(this.config);

      // Valida la configurazione di sicurezza dopo l'inizializzazione
      this.validateOAuthSecurity();
    }
  }

  /**
   * Valida la configurazione di sicurezza OAuth
   */
  private validateOAuthSecurity(): void {
    if (stryMutAct_9fa48("4501")) {
      {}
    } else {
      stryCov_9fa48("4501");
      if (stryMutAct_9fa48("4504") ? false : stryMutAct_9fa48("4503") ? true : stryMutAct_9fa48("4502") ? this.oauthConnector : (stryCov_9fa48("4502", "4503", "4504"), !this.oauthConnector)) return;
      const providers = this.oauthConnector.getAvailableProviders();
      for (const provider of providers) {
        if (stryMutAct_9fa48("4505")) {
          {}
        } else {
          stryCov_9fa48("4505");
          const providerConfig = stryMutAct_9fa48("4506") ? this.config.providers[provider] : (stryCov_9fa48("4506"), this.config.providers?.[provider]);
          if (stryMutAct_9fa48("4509") ? false : stryMutAct_9fa48("4508") ? true : stryMutAct_9fa48("4507") ? providerConfig : (stryCov_9fa48("4507", "4508", "4509"), !providerConfig)) continue;

          // Verifica che PKCE sia abilitato per tutti i provider
          if (stryMutAct_9fa48("4512") ? !providerConfig.usePKCE || typeof window !== "undefined" : stryMutAct_9fa48("4511") ? false : stryMutAct_9fa48("4510") ? true : (stryCov_9fa48("4510", "4511", "4512"), (stryMutAct_9fa48("4513") ? providerConfig.usePKCE : (stryCov_9fa48("4513"), !providerConfig.usePKCE)) && (stryMutAct_9fa48("4515") ? typeof window === "undefined" : stryMutAct_9fa48("4514") ? true : (stryCov_9fa48("4514", "4515"), typeof window !== (stryMutAct_9fa48("4516") ? "" : (stryCov_9fa48("4516"), "undefined")))))) {
            if (stryMutAct_9fa48("4517")) {
              {}
            } else {
              stryCov_9fa48("4517");
              console.warn(stryMutAct_9fa48("4518") ? `` : (stryCov_9fa48("4518"), `[oauthPlugin] Provider ${provider} non ha PKCE abilitato - non sicuro per browser`));
            }
          }

          // Verifica che non ci sia client_secret nel browser (eccetto Google con PKCE)
          if (stryMutAct_9fa48("4521") ? providerConfig.clientSecret || typeof window !== "undefined" : stryMutAct_9fa48("4520") ? false : stryMutAct_9fa48("4519") ? true : (stryCov_9fa48("4519", "4520", "4521"), providerConfig.clientSecret && (stryMutAct_9fa48("4523") ? typeof window === "undefined" : stryMutAct_9fa48("4522") ? true : (stryCov_9fa48("4522", "4523"), typeof window !== (stryMutAct_9fa48("4524") ? "" : (stryCov_9fa48("4524"), "undefined")))))) {
            if (stryMutAct_9fa48("4525")) {
              {}
            } else {
              stryCov_9fa48("4525");
              if (stryMutAct_9fa48("4528") ? provider === "google" || providerConfig.usePKCE : stryMutAct_9fa48("4527") ? false : stryMutAct_9fa48("4526") ? true : (stryCov_9fa48("4526", "4527", "4528"), (stryMutAct_9fa48("4530") ? provider !== "google" : stryMutAct_9fa48("4529") ? true : (stryCov_9fa48("4529", "4530"), provider === (stryMutAct_9fa48("4531") ? "" : (stryCov_9fa48("4531"), "google")))) && providerConfig.usePKCE)) {
                if (stryMutAct_9fa48("4532")) {
                  {}
                } else {
                  stryCov_9fa48("4532");
                  // Non lanciare errore per Google con PKCE
                  continue;
                }
              } else {
                if (stryMutAct_9fa48("4533")) {
                  {}
                } else {
                  stryCov_9fa48("4533");
                  console.error(stryMutAct_9fa48("4534") ? `` : (stryCov_9fa48("4534"), `[oauthPlugin] Provider ${provider} ha client_secret configurato nel browser - RIMUOVERE`));
                  throw new Error(stryMutAct_9fa48("4535") ? `` : (stryCov_9fa48("4535"), `Client secret non può essere usato nel browser per ${provider}`));
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Configure the OAuth plugin with provider settings
   * @param config - Configuration options for OAuth
   */
  configure(config: Partial<OAuthConfig>): void {
    if (stryMutAct_9fa48("4536")) {
      {}
    } else {
      stryCov_9fa48("4536");
      this.config = stryMutAct_9fa48("4537") ? {} : (stryCov_9fa48("4537"), {
        ...this.config,
        ...config
      });

      // Inizializza il connector se non è già stato fatto
      if (stryMutAct_9fa48("4540") ? false : stryMutAct_9fa48("4539") ? true : stryMutAct_9fa48("4538") ? this.oauthConnector : (stryCov_9fa48("4538", "4539", "4540"), !this.oauthConnector)) {
        if (stryMutAct_9fa48("4541")) {
          {}
        } else {
          stryCov_9fa48("4541");
          this.oauthConnector = new OAuthConnector(this.config);
        }
      } else {
        if (stryMutAct_9fa48("4542")) {
          {}
        } else {
          stryCov_9fa48("4542");
          // Update connector configuration se già inizializzato
          this.oauthConnector.updateConfig(this.config);
        }
      }

      // Validate security settings
      this.validateOAuthSecurity();
    }
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (stryMutAct_9fa48("4543")) {
      {}
    } else {
      stryCov_9fa48("4543");
      if (stryMutAct_9fa48("4545") ? false : stryMutAct_9fa48("4544") ? true : (stryCov_9fa48("4544", "4545"), this.oauthConnector)) {
        if (stryMutAct_9fa48("4546")) {
          {}
        } else {
          stryCov_9fa48("4546");
          this.oauthConnector.cleanup();
        }
      }
      this.oauthConnector = null;
      this.storage = null;
      super.destroy();
    }
  }

  /**
   * Ensure that the OAuth connector is initialized
   * @private
   */
  private assertOAuthConnector(): OAuthConnector {
    if (stryMutAct_9fa48("4547")) {
      {}
    } else {
      stryCov_9fa48("4547");
      this.assertInitialized();
      if (stryMutAct_9fa48("4550") ? false : stryMutAct_9fa48("4549") ? true : stryMutAct_9fa48("4548") ? this.oauthConnector : (stryCov_9fa48("4548", "4549", "4550"), !this.oauthConnector)) {
        if (stryMutAct_9fa48("4551")) {
          {}
        } else {
          stryCov_9fa48("4551");
          throw new Error(stryMutAct_9fa48("4552") ? "" : (stryCov_9fa48("4552"), "OAuth connector not initialized"));
        }
      }
      return this.oauthConnector;
    }
  }

  /**
   * @inheritdoc
   */
  isSupported(): boolean {
    if (stryMutAct_9fa48("4553")) {
      {}
    } else {
      stryCov_9fa48("4553");
      return this.assertOAuthConnector().isSupported();
    }
  }

  /**
   * @inheritdoc
   */
  getAvailableProviders(): OAuthProvider[] {
    if (stryMutAct_9fa48("4554")) {
      {}
    } else {
      stryCov_9fa48("4554");
      return this.assertOAuthConnector().getAvailableProviders();
    }
  }

  /**
   * @inheritdoc
   */
  async initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult> {
    if (stryMutAct_9fa48("4555")) {
      {}
    } else {
      stryCov_9fa48("4555");
      return this.assertOAuthConnector().initiateOAuth(provider);
    }
  }

  /**
   * @inheritdoc
   */
  async completeOAuth(provider: OAuthProvider, authCode: string, state?: string): Promise<OAuthConnectionResult> {
    if (stryMutAct_9fa48("4556")) {
      {}
    } else {
      stryCov_9fa48("4556");
      return this.assertOAuthConnector().completeOAuth(provider, authCode, state);
    }
  }

  /**
   * @inheritdoc
   */
  async generateCredentials(userInfo: OAuthUserInfo, provider: OAuthProvider): Promise<OAuthCredentials> {
    if (stryMutAct_9fa48("4557")) {
      {}
    } else {
      stryCov_9fa48("4557");
      return this.assertOAuthConnector().generateCredentials(userInfo, provider);
    }
  }

  /**
   * Login with OAuth
   * @param provider - OAuth provider to use
   * @returns {Promise<AuthResult>} Authentication result
   * @description Authenticates user using OAuth with external providers
   * NOTE: This method only initiates the OAuth flow. The actual authentication
   * happens in handleOAuthCallback when the provider redirects back.
   */
  async login(provider: OAuthProvider): Promise<AuthResult> {
    if (stryMutAct_9fa48("4558")) {
      {}
    } else {
      stryCov_9fa48("4558");
      try {
        if (stryMutAct_9fa48("4559")) {
          {}
        } else {
          stryCov_9fa48("4559");
          const core = this.assertInitialized();
          if (stryMutAct_9fa48("4562") ? false : stryMutAct_9fa48("4561") ? true : stryMutAct_9fa48("4560") ? provider : (stryCov_9fa48("4560", "4561", "4562"), !provider)) {
            if (stryMutAct_9fa48("4563")) {
              {}
            } else {
              stryCov_9fa48("4563");
              throw createError(ErrorType.VALIDATION, stryMutAct_9fa48("4564") ? "" : (stryCov_9fa48("4564"), "PROVIDER_REQUIRED"), stryMutAct_9fa48("4565") ? "" : (stryCov_9fa48("4565"), "OAuth provider required for OAuth login"));
            }
          }
          if (stryMutAct_9fa48("4568") ? false : stryMutAct_9fa48("4567") ? true : stryMutAct_9fa48("4566") ? this.isSupported() : (stryCov_9fa48("4566", "4567", "4568"), !this.isSupported())) {
            if (stryMutAct_9fa48("4569")) {
              {}
            } else {
              stryCov_9fa48("4569");
              throw createError(ErrorType.ENVIRONMENT, stryMutAct_9fa48("4570") ? "" : (stryCov_9fa48("4570"), "OAUTH_UNAVAILABLE"), stryMutAct_9fa48("4571") ? "" : (stryCov_9fa48("4571"), "OAuth is not supported in this environment"));
            }
          }

          // Check if provider is available
          const availableProviders = this.getAvailableProviders();
          if (stryMutAct_9fa48("4574") ? false : stryMutAct_9fa48("4573") ? true : stryMutAct_9fa48("4572") ? availableProviders.includes(provider) : (stryCov_9fa48("4572", "4573", "4574"), !availableProviders.includes(provider))) {
            if (stryMutAct_9fa48("4575")) {
              {}
            } else {
              stryCov_9fa48("4575");
              throw createError(ErrorType.VALIDATION, stryMutAct_9fa48("4576") ? "" : (stryCov_9fa48("4576"), "PROVIDER_NOT_CONFIGURED"), stryMutAct_9fa48("4577") ? `` : (stryCov_9fa48("4577"), `Provider ${provider} is not configured or available`));
            }
          }

          // Initiate OAuth flow with the provider
          const oauthResult = await this.initiateOAuth(provider);
          if (stryMutAct_9fa48("4580") ? false : stryMutAct_9fa48("4579") ? true : stryMutAct_9fa48("4578") ? oauthResult.success : (stryCov_9fa48("4578", "4579", "4580"), !oauthResult.success)) {
            if (stryMutAct_9fa48("4581")) {
              {}
            } else {
              stryCov_9fa48("4581");
              throw createError(ErrorType.AUTHENTICATION, stryMutAct_9fa48("4582") ? "" : (stryCov_9fa48("4582"), "OAUTH_INITIATION_FAILED"), stryMutAct_9fa48("4585") ? oauthResult.error && "Failed to initiate OAuth flow" : stryMutAct_9fa48("4584") ? false : stryMutAct_9fa48("4583") ? true : (stryCov_9fa48("4583", "4584", "4585"), oauthResult.error || (stryMutAct_9fa48("4586") ? "" : (stryCov_9fa48("4586"), "Failed to initiate OAuth flow"))));
            }
          }

          // In a browser environment, this would redirect to the OAuth provider
          // The frontend should handle the redirect and then call handleOAuthCallback
          // with the received code and state when the provider redirects back

          // Return early with the auth URL that the frontend should use for redirection
          return stryMutAct_9fa48("4587") ? {} : (stryCov_9fa48("4587"), {
            success: stryMutAct_9fa48("4588") ? false : (stryCov_9fa48("4588"), true),
            redirectUrl: oauthResult.authUrl,
            pendingAuth: stryMutAct_9fa48("4589") ? false : (stryCov_9fa48("4589"), true),
            message: stryMutAct_9fa48("4590") ? "" : (stryCov_9fa48("4590"), "Redirect to OAuth provider required to complete authentication"),
            provider,
            authMethod: stryMutAct_9fa48("4591") ? "" : (stryCov_9fa48("4591"), "oauth")
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("4592")) {
          {}
        } else {
          stryCov_9fa48("4592");
          // Handle both ShogunError and generic errors
          const errorType = stryMutAct_9fa48("4595") ? error?.type && ErrorType.AUTHENTICATION : stryMutAct_9fa48("4594") ? false : stryMutAct_9fa48("4593") ? true : (stryCov_9fa48("4593", "4594", "4595"), (stryMutAct_9fa48("4596") ? error.type : (stryCov_9fa48("4596"), error?.type)) || ErrorType.AUTHENTICATION);
          const errorCode = stryMutAct_9fa48("4599") ? error?.code && "OAUTH_LOGIN_ERROR" : stryMutAct_9fa48("4598") ? false : stryMutAct_9fa48("4597") ? true : (stryCov_9fa48("4597", "4598", "4599"), (stryMutAct_9fa48("4600") ? error.code : (stryCov_9fa48("4600"), error?.code)) || (stryMutAct_9fa48("4601") ? "" : (stryCov_9fa48("4601"), "OAUTH_LOGIN_ERROR")));
          const errorMessage = stryMutAct_9fa48("4604") ? error?.message && "Unknown error during OAuth login" : stryMutAct_9fa48("4603") ? false : stryMutAct_9fa48("4602") ? true : (stryCov_9fa48("4602", "4603", "4604"), (stryMutAct_9fa48("4605") ? error.message : (stryCov_9fa48("4605"), error?.message)) || (stryMutAct_9fa48("4606") ? "" : (stryCov_9fa48("4606"), "Unknown error during OAuth login")));
          const handledError = ErrorHandler.handle(errorType, errorCode, errorMessage, error);
          return stryMutAct_9fa48("4607") ? {} : (stryCov_9fa48("4607"), {
            success: stryMutAct_9fa48("4608") ? true : (stryCov_9fa48("4608"), false),
            error: handledError.message
          });
        }
      }
    }
  }

  /**
   * Register new user with OAuth provider
   * @param provider - OAuth provider
   * @returns {Promise<SignUpResult>} Registration result
   */
  async signUp(provider: OAuthProvider): Promise<SignUpResult> {
    if (stryMutAct_9fa48("4609")) {
      {}
    } else {
      stryCov_9fa48("4609");
      try {
        if (stryMutAct_9fa48("4610")) {
          {}
        } else {
          stryCov_9fa48("4610");
          const core = this.assertInitialized();
          if (stryMutAct_9fa48("4613") ? false : stryMutAct_9fa48("4612") ? true : stryMutAct_9fa48("4611") ? provider : (stryCov_9fa48("4611", "4612", "4613"), !provider)) {
            if (stryMutAct_9fa48("4614")) {
              {}
            } else {
              stryCov_9fa48("4614");
              throw createError(ErrorType.VALIDATION, stryMutAct_9fa48("4615") ? "" : (stryCov_9fa48("4615"), "PROVIDER_REQUIRED"), stryMutAct_9fa48("4616") ? "" : (stryCov_9fa48("4616"), "OAuth provider required for OAuth signup"));
            }
          }
          if (stryMutAct_9fa48("4619") ? false : stryMutAct_9fa48("4618") ? true : stryMutAct_9fa48("4617") ? this.isSupported() : (stryCov_9fa48("4617", "4618", "4619"), !this.isSupported())) {
            if (stryMutAct_9fa48("4620")) {
              {}
            } else {
              stryCov_9fa48("4620");
              throw createError(ErrorType.ENVIRONMENT, stryMutAct_9fa48("4621") ? "" : (stryCov_9fa48("4621"), "OAUTH_UNAVAILABLE"), stryMutAct_9fa48("4622") ? "" : (stryCov_9fa48("4622"), "OAuth is not supported in this environment"));
            }
          }

          // Check if provider is available
          const availableProviders = this.getAvailableProviders();
          if (stryMutAct_9fa48("4625") ? false : stryMutAct_9fa48("4624") ? true : stryMutAct_9fa48("4623") ? availableProviders.includes(provider) : (stryCov_9fa48("4623", "4624", "4625"), !availableProviders.includes(provider))) {
            if (stryMutAct_9fa48("4626")) {
              {}
            } else {
              stryCov_9fa48("4626");
              throw createError(ErrorType.VALIDATION, stryMutAct_9fa48("4627") ? "" : (stryCov_9fa48("4627"), "PROVIDER_NOT_CONFIGURED"), stryMutAct_9fa48("4628") ? `` : (stryCov_9fa48("4628"), `Provider ${provider} is not configured or available`));
            }
          }

          // Initiate OAuth flow with the provider
          const oauthResult = await this.initiateOAuth(provider);
          if (stryMutAct_9fa48("4631") ? false : stryMutAct_9fa48("4630") ? true : stryMutAct_9fa48("4629") ? oauthResult.success : (stryCov_9fa48("4629", "4630", "4631"), !oauthResult.success)) {
            if (stryMutAct_9fa48("4632")) {
              {}
            } else {
              stryCov_9fa48("4632");
              throw createError(ErrorType.AUTHENTICATION, stryMutAct_9fa48("4633") ? "" : (stryCov_9fa48("4633"), "OAUTH_INITIATION_FAILED"), stryMutAct_9fa48("4636") ? oauthResult.error && "Failed to initiate OAuth flow" : stryMutAct_9fa48("4635") ? false : stryMutAct_9fa48("4634") ? true : (stryCov_9fa48("4634", "4635", "4636"), oauthResult.error || (stryMutAct_9fa48("4637") ? "" : (stryCov_9fa48("4637"), "Failed to initiate OAuth flow"))));
            }
          }

          // In a browser environment, this would redirect to the OAuth provider
          // The frontend should handle the redirect and then call handleOAuthCallback
          // with the received code and state when the provider redirects back

          // Return early with the auth URL that the frontend should use for redirection
          return stryMutAct_9fa48("4638") ? {} : (stryCov_9fa48("4638"), {
            success: stryMutAct_9fa48("4639") ? false : (stryCov_9fa48("4639"), true),
            redirectUrl: oauthResult.authUrl,
            pendingAuth: stryMutAct_9fa48("4640") ? false : (stryCov_9fa48("4640"), true),
            message: stryMutAct_9fa48("4641") ? "" : (stryCov_9fa48("4641"), "Redirect to OAuth provider required to complete registration"),
            provider,
            authMethod: stryMutAct_9fa48("4642") ? "" : (stryCov_9fa48("4642"), "oauth")
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("4643")) {
          {}
        } else {
          stryCov_9fa48("4643");
          // Handle both ShogunError and generic errors
          const errorType = stryMutAct_9fa48("4646") ? error?.type && ErrorType.AUTHENTICATION : stryMutAct_9fa48("4645") ? false : stryMutAct_9fa48("4644") ? true : (stryCov_9fa48("4644", "4645", "4646"), (stryMutAct_9fa48("4647") ? error.type : (stryCov_9fa48("4647"), error?.type)) || ErrorType.AUTHENTICATION);
          const errorCode = stryMutAct_9fa48("4650") ? error?.code && "OAUTH_SIGNUP_ERROR" : stryMutAct_9fa48("4649") ? false : stryMutAct_9fa48("4648") ? true : (stryCov_9fa48("4648", "4649", "4650"), (stryMutAct_9fa48("4651") ? error.code : (stryCov_9fa48("4651"), error?.code)) || (stryMutAct_9fa48("4652") ? "" : (stryCov_9fa48("4652"), "OAUTH_SIGNUP_ERROR")));
          const errorMessage = stryMutAct_9fa48("4655") ? error?.message && "Unknown error during OAuth signup" : stryMutAct_9fa48("4654") ? false : stryMutAct_9fa48("4653") ? true : (stryCov_9fa48("4653", "4654", "4655"), (stryMutAct_9fa48("4656") ? error.message : (stryCov_9fa48("4656"), error?.message)) || (stryMutAct_9fa48("4657") ? "" : (stryCov_9fa48("4657"), "Unknown error during OAuth signup")));
          const handledError = ErrorHandler.handle(errorType, errorCode, errorMessage, error);
          return stryMutAct_9fa48("4658") ? {} : (stryCov_9fa48("4658"), {
            success: stryMutAct_9fa48("4659") ? true : (stryCov_9fa48("4659"), false),
            error: handledError.message
          });
        }
      }
    }
  }

  /**
   * Handle OAuth callback (for frontend integration)
   * This method would be called when the OAuth provider redirects back
   */
  async handleOAuthCallback(provider: OAuthProvider, authCode: string, state: string): Promise<AuthResult> {
    if (stryMutAct_9fa48("4660")) {
      {}
    } else {
      stryCov_9fa48("4660");
      try {
        if (stryMutAct_9fa48("4661")) {
          {}
        } else {
          stryCov_9fa48("4661");
          const core = this.assertInitialized();

          // Validazione di sicurezza pre-callback
          if (stryMutAct_9fa48("4664") ? !authCode && !state : stryMutAct_9fa48("4663") ? false : stryMutAct_9fa48("4662") ? true : (stryCov_9fa48("4662", "4663", "4664"), (stryMutAct_9fa48("4665") ? authCode : (stryCov_9fa48("4665"), !authCode)) || (stryMutAct_9fa48("4666") ? state : (stryCov_9fa48("4666"), !state)))) {
            if (stryMutAct_9fa48("4667")) {
              {}
            } else {
              stryCov_9fa48("4667");
              throw new Error(stryMutAct_9fa48("4668") ? "" : (stryCov_9fa48("4668"), "Authorization code and state parameter are required"));
            }
          }

          // Complete the OAuth flow
          const result = await this.completeOAuth(provider, authCode, state);
          if (stryMutAct_9fa48("4671") ? !result.success && !result.userInfo : stryMutAct_9fa48("4670") ? false : stryMutAct_9fa48("4669") ? true : (stryCov_9fa48("4669", "4670", "4671"), (stryMutAct_9fa48("4672") ? result.success : (stryCov_9fa48("4672"), !result.success)) || (stryMutAct_9fa48("4673") ? result.userInfo : (stryCov_9fa48("4673"), !result.userInfo)))) {
            if (stryMutAct_9fa48("4674")) {
              {}
            } else {
              stryCov_9fa48("4674");
              throw new Error(stryMutAct_9fa48("4677") ? result.error && "Failed to complete OAuth flow" : stryMutAct_9fa48("4676") ? false : stryMutAct_9fa48("4675") ? true : (stryCov_9fa48("4675", "4676", "4677"), result.error || (stryMutAct_9fa48("4678") ? "" : (stryCov_9fa48("4678"), "Failed to complete OAuth flow"))));
            }
          }

          // Genera credenziali da user info
          const credentials = await this.generateCredentials(result.userInfo, provider);

          // Set authentication method
          core.setAuthMethod("oauth" as AuthMethod);

          // Login o signup usando la chiave derivata
          const authResult = await this._loginOrSignUp(credentials.username, credentials.key);
          if (stryMutAct_9fa48("4680") ? false : stryMutAct_9fa48("4679") ? true : (stryCov_9fa48("4679", "4680"), authResult.success)) {
            if (stryMutAct_9fa48("4681")) {
              {}
            } else {
              stryCov_9fa48("4681");
              // Store user info in user metadata
              if (stryMutAct_9fa48("4683") ? false : stryMutAct_9fa48("4682") ? true : (stryCov_9fa48("4682", "4683"), core.user)) {
                if (stryMutAct_9fa48("4684")) {
                  {}
                } else {
                  stryCov_9fa48("4684");
                  await core.user.put(stryMutAct_9fa48("4685") ? {} : (stryCov_9fa48("4685"), {
                    oauth: {
                      provider,
                      id: result.userInfo.id,
                      email: result.userInfo.email,
                      name: result.userInfo.name,
                      picture: result.userInfo.picture,
                      lastLogin: Date.now()
                    } as any
                  }));
                }
              }

              // Emit appropriate event
              const eventType = authResult.isNewUser ? stryMutAct_9fa48("4686") ? "" : (stryCov_9fa48("4686"), "auth:signup") : stryMutAct_9fa48("4687") ? "" : (stryCov_9fa48("4687"), "auth:login");
              core.emit(eventType, stryMutAct_9fa48("4688") ? {} : (stryCov_9fa48("4688"), {
                userPub: stryMutAct_9fa48("4691") ? authResult.userPub && "" : stryMutAct_9fa48("4690") ? false : stryMutAct_9fa48("4689") ? true : (stryCov_9fa48("4689", "4690", "4691"), authResult.userPub || (stryMutAct_9fa48("4692") ? "Stryker was here!" : (stryCov_9fa48("4692"), ""))),
                username: credentials.username,
                method: stryMutAct_9fa48("4693") ? "" : (stryCov_9fa48("4693"), "oauth"),
                provider
              }));

              // Pulisci i dati OAuth scaduti dopo un login riuscito
              this.cleanupExpiredOAuthData();

              // Return auth result with OAuth user data included
              return stryMutAct_9fa48("4694") ? {} : (stryCov_9fa48("4694"), {
                ...authResult,
                sea: authResult.sea,
                // Include SEA pair from core
                user: stryMutAct_9fa48("4695") ? {} : (stryCov_9fa48("4695"), {
                  userPub: authResult.userPub,
                  username: credentials.username,
                  email: result.userInfo.email,
                  name: stryMutAct_9fa48("4698") ? (result.userInfo.name || result.userInfo.email) && `OAuth User (${provider})` : stryMutAct_9fa48("4697") ? false : stryMutAct_9fa48("4696") ? true : (stryCov_9fa48("4696", "4697", "4698"), (stryMutAct_9fa48("4700") ? result.userInfo.name && result.userInfo.email : stryMutAct_9fa48("4699") ? false : (stryCov_9fa48("4699", "4700"), result.userInfo.name || result.userInfo.email)) || (stryMutAct_9fa48("4701") ? `` : (stryCov_9fa48("4701"), `OAuth User (${provider})`))),
                  picture: result.userInfo.picture,
                  oauth: stryMutAct_9fa48("4702") ? {} : (stryCov_9fa48("4702"), {
                    provider,
                    id: result.userInfo.id,
                    email: result.userInfo.email,
                    name: result.userInfo.name,
                    picture: result.userInfo.picture,
                    lastLogin: Date.now()
                  })
                })
              });
            }
          }
          return authResult;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("4703")) {
          {}
        } else {
          stryCov_9fa48("4703");
          // Pulisci i dati OAuth anche in caso di errore
          this.cleanupExpiredOAuthData();
          return stryMutAct_9fa48("4704") ? {} : (stryCov_9fa48("4704"), {
            success: stryMutAct_9fa48("4705") ? true : (stryCov_9fa48("4705"), false),
            error: stryMutAct_9fa48("4708") ? error.message && "Failed to handle OAuth callback" : stryMutAct_9fa48("4707") ? false : stryMutAct_9fa48("4706") ? true : (stryCov_9fa48("4706", "4707", "4708"), error.message || (stryMutAct_9fa48("4709") ? "" : (stryCov_9fa48("4709"), "Failed to handle OAuth callback")))
          });
        }
      }
    }
  }

  /**
   * Pulisce i dati OAuth scaduti
   */
  private cleanupExpiredOAuthData(): void {
    if (stryMutAct_9fa48("4710")) {
      {}
    } else {
      stryCov_9fa48("4710");
      if (stryMutAct_9fa48("4712") ? false : stryMutAct_9fa48("4711") ? true : (stryCov_9fa48("4711", "4712"), this.oauthConnector)) {
        if (stryMutAct_9fa48("4713")) {
          {}
        } else {
          stryCov_9fa48("4713");
          // Il metodo cleanupExpiredOAuthData è privato nel connector
          // quindi usiamo il metodo pubblico clearUserCache
          this.oauthConnector.clearUserCache();
        }
      }
    }
  }

  /**
   * Private helper to login or sign up a user
   */
  private async _loginOrSignUp(username: string, k: ISEAPair | null): Promise<AuthResult> {
    if (stryMutAct_9fa48("4714")) {
      {}
    } else {
      stryCov_9fa48("4714");
      if (stryMutAct_9fa48("4717") ? false : stryMutAct_9fa48("4716") ? true : stryMutAct_9fa48("4715") ? this.core : (stryCov_9fa48("4715", "4716", "4717"), !this.core)) {
        if (stryMutAct_9fa48("4718")) {
          {}
        } else {
          stryCov_9fa48("4718");
          return stryMutAct_9fa48("4719") ? {} : (stryCov_9fa48("4719"), {
            success: stryMutAct_9fa48("4720") ? true : (stryCov_9fa48("4720"), false),
            error: stryMutAct_9fa48("4721") ? "" : (stryCov_9fa48("4721"), "Shogun core not available")
          });
        }
      }

      // Try login first
      const loginResult = await this.core.login(username, stryMutAct_9fa48("4722") ? "Stryker was here!" : (stryCov_9fa48("4722"), ""), k);
      if (stryMutAct_9fa48("4724") ? false : stryMutAct_9fa48("4723") ? true : (stryCov_9fa48("4723", "4724"), loginResult.success)) {
        if (stryMutAct_9fa48("4725")) {
          {}
        } else {
          stryCov_9fa48("4725");
          // Session is automatically saved by the login method
          loginResult.isNewUser = stryMutAct_9fa48("4726") ? true : (stryCov_9fa48("4726"), false);
          // Include SEA pair from core
          if (stryMutAct_9fa48("4729") ? this.core.user || (this.core.user._ as any)?.sea : stryMutAct_9fa48("4728") ? false : stryMutAct_9fa48("4727") ? true : (stryCov_9fa48("4727", "4728", "4729"), this.core.user && (stryMutAct_9fa48("4730") ? (this.core.user._ as any).sea : (stryCov_9fa48("4730"), (this.core.user._ as any)?.sea)))) {
            if (stryMutAct_9fa48("4731")) {
              {}
            } else {
              stryCov_9fa48("4731");
              loginResult.sea = (this.core.user._ as any).sea;
            }
          }
          return loginResult;
        }
      }

      // If login fails, try signup
      const signupResult = await this.core.signUp(username, stryMutAct_9fa48("4732") ? "Stryker was here!" : (stryCov_9fa48("4732"), ""), stryMutAct_9fa48("4733") ? "Stryker was here!" : (stryCov_9fa48("4733"), ""), k);
      if (stryMutAct_9fa48("4735") ? false : stryMutAct_9fa48("4734") ? true : (stryCov_9fa48("4734", "4735"), signupResult.success)) {
        if (stryMutAct_9fa48("4736")) {
          {}
        } else {
          stryCov_9fa48("4736");
          // Immediately login after signup
          const postSignupLogin = await this.core.login(username, stryMutAct_9fa48("4737") ? "Stryker was here!" : (stryCov_9fa48("4737"), ""), k);
          if (stryMutAct_9fa48("4739") ? false : stryMutAct_9fa48("4738") ? true : (stryCov_9fa48("4738", "4739"), postSignupLogin.success)) {
            if (stryMutAct_9fa48("4740")) {
              {}
            } else {
              stryCov_9fa48("4740");
              // Session is automatically saved by the login method
              postSignupLogin.isNewUser = stryMutAct_9fa48("4741") ? false : (stryCov_9fa48("4741"), true);
              // Include SEA pair from core
              if (stryMutAct_9fa48("4744") ? this.core.user || (this.core.user._ as any)?.sea : stryMutAct_9fa48("4743") ? false : stryMutAct_9fa48("4742") ? true : (stryCov_9fa48("4742", "4743", "4744"), this.core.user && (stryMutAct_9fa48("4745") ? (this.core.user._ as any).sea : (stryCov_9fa48("4745"), (this.core.user._ as any)?.sea)))) {
                if (stryMutAct_9fa48("4746")) {
                  {}
                } else {
                  stryCov_9fa48("4746");
                  postSignupLogin.sea = (this.core.user._ as any).sea;
                }
              }
              return postSignupLogin;
            }
          }
          return stryMutAct_9fa48("4747") ? {} : (stryCov_9fa48("4747"), {
            success: stryMutAct_9fa48("4748") ? true : (stryCov_9fa48("4748"), false),
            error: stryMutAct_9fa48("4751") ? postSignupLogin.error && "Login failed after successful signup." : stryMutAct_9fa48("4750") ? false : stryMutAct_9fa48("4749") ? true : (stryCov_9fa48("4749", "4750", "4751"), postSignupLogin.error || (stryMutAct_9fa48("4752") ? "" : (stryCov_9fa48("4752"), "Login failed after successful signup.")))
          });
        }
      }

      // Return the original signup error for other failures
      return signupResult;
    }
  }

  /**
   * Alias for handleOAuthCallback for backward compatibility
   * @deprecated Use handleOAuthCallback instead
   */
  async handleSimpleOAuth(provider: OAuthProvider, authCode: string, state: string): Promise<AuthResult> {
    if (stryMutAct_9fa48("4753")) {
      {}
    } else {
      stryCov_9fa48("4753");
      return this.handleOAuthCallback(provider, authCode, state);
    }
  }

  /**
   * Get cached user info for a user
   */
  getCachedUserInfo(userId: string, provider: OAuthProvider): OAuthUserInfo | null {
    if (stryMutAct_9fa48("4754")) {
      {}
    } else {
      stryCov_9fa48("4754");
      return this.assertOAuthConnector().getCachedUserInfo(userId, provider);
    }
  }

  /**
   * Clear user info cache
   */
  clearUserCache(userId?: string, provider?: OAuthProvider): void {
    if (stryMutAct_9fa48("4755")) {
      {}
    } else {
      stryCov_9fa48("4755");
      this.assertOAuthConnector().clearUserCache(userId, provider);
    }
  }
}