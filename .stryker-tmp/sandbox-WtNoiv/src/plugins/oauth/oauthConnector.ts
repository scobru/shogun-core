/**
 * OAuth Connector - Secure version for GunDB user creation
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
import { EventEmitter } from "../../utils/eventEmitter";
import { OAuthConfig, OAuthProvider, OAuthUserInfo, OAuthCredentials, OAuthConnectionResult, OAuthCache, OAuthProviderConfig } from "./types";
import derive from "../../gundb/derive";
import { generateUsernameFromIdentity, generateDeterministicPassword } from "../../utils/validation";
import { ethers } from "ethers";

/**
 * OAuth Connector
 */
export class OAuthConnector extends EventEmitter {
  private readonly DEFAULT_CONFIG: Partial<OAuthConfig> = stryMutAct_9fa48("3765") ? {} : (stryCov_9fa48("3765"), {
    providers: stryMutAct_9fa48("3766") ? {} : (stryCov_9fa48("3766"), {
      google: stryMutAct_9fa48("3767") ? {} : (stryCov_9fa48("3767"), {
        clientId: stryMutAct_9fa48("3768") ? "Stryker was here!" : (stryCov_9fa48("3768"), ""),
        redirectUri: stryMutAct_9fa48("3769") ? `` : (stryCov_9fa48("3769"), `${this.getOrigin()}/auth/callback`),
        scope: stryMutAct_9fa48("3770") ? [] : (stryCov_9fa48("3770"), [stryMutAct_9fa48("3771") ? "" : (stryCov_9fa48("3771"), "openid"), stryMutAct_9fa48("3772") ? "" : (stryCov_9fa48("3772"), "email"), stryMutAct_9fa48("3773") ? "" : (stryCov_9fa48("3773"), "profile")]),
        authUrl: stryMutAct_9fa48("3774") ? "" : (stryCov_9fa48("3774"), "https://accounts.google.com/o/oauth2/v2/auth"),
        tokenUrl: stryMutAct_9fa48("3775") ? "" : (stryCov_9fa48("3775"), "https://oauth2.googleapis.com/token"),
        userInfoUrl: stryMutAct_9fa48("3776") ? "" : (stryCov_9fa48("3776"), "https://www.googleapis.com/oauth2/v2/userinfo"),
        usePKCE: stryMutAct_9fa48("3777") ? false : (stryCov_9fa48("3777"), true) // Forza PKCE per Google
      }),
      github: stryMutAct_9fa48("3778") ? {} : (stryCov_9fa48("3778"), {
        clientId: stryMutAct_9fa48("3779") ? "Stryker was here!" : (stryCov_9fa48("3779"), ""),
        redirectUri: stryMutAct_9fa48("3780") ? `` : (stryCov_9fa48("3780"), `${this.getOrigin()}/auth/callback`),
        scope: stryMutAct_9fa48("3781") ? [] : (stryCov_9fa48("3781"), [stryMutAct_9fa48("3782") ? "" : (stryCov_9fa48("3782"), "user:email")]),
        authUrl: stryMutAct_9fa48("3783") ? "" : (stryCov_9fa48("3783"), "https://github.com/login/oauth/authorize"),
        tokenUrl: stryMutAct_9fa48("3784") ? "" : (stryCov_9fa48("3784"), "https://github.com/login/oauth/access_token"),
        userInfoUrl: stryMutAct_9fa48("3785") ? "" : (stryCov_9fa48("3785"), "https://api.github.com/user"),
        usePKCE: stryMutAct_9fa48("3786") ? false : (stryCov_9fa48("3786"), true)
      }),
      discord: stryMutAct_9fa48("3787") ? {} : (stryCov_9fa48("3787"), {
        clientId: stryMutAct_9fa48("3788") ? "Stryker was here!" : (stryCov_9fa48("3788"), ""),
        redirectUri: stryMutAct_9fa48("3789") ? `` : (stryCov_9fa48("3789"), `${this.getOrigin()}/auth/callback`),
        scope: stryMutAct_9fa48("3790") ? [] : (stryCov_9fa48("3790"), [stryMutAct_9fa48("3791") ? "" : (stryCov_9fa48("3791"), "identify"), stryMutAct_9fa48("3792") ? "" : (stryCov_9fa48("3792"), "email")]),
        authUrl: stryMutAct_9fa48("3793") ? "" : (stryCov_9fa48("3793"), "https://discord.com/api/oauth2/authorize"),
        tokenUrl: stryMutAct_9fa48("3794") ? "" : (stryCov_9fa48("3794"), "https://discord.com/api/oauth2/token"),
        userInfoUrl: stryMutAct_9fa48("3795") ? "" : (stryCov_9fa48("3795"), "https://discord.com/api/users/@me"),
        usePKCE: stryMutAct_9fa48("3796") ? false : (stryCov_9fa48("3796"), true)
      }),
      twitter: stryMutAct_9fa48("3797") ? {} : (stryCov_9fa48("3797"), {
        clientId: stryMutAct_9fa48("3798") ? "Stryker was here!" : (stryCov_9fa48("3798"), ""),
        redirectUri: stryMutAct_9fa48("3799") ? `` : (stryCov_9fa48("3799"), `${this.getOrigin()}/auth/callback`),
        scope: stryMutAct_9fa48("3800") ? [] : (stryCov_9fa48("3800"), [stryMutAct_9fa48("3801") ? "" : (stryCov_9fa48("3801"), "tweet.read"), stryMutAct_9fa48("3802") ? "" : (stryCov_9fa48("3802"), "users.read")]),
        authUrl: stryMutAct_9fa48("3803") ? "" : (stryCov_9fa48("3803"), "https://twitter.com/i/oauth2/authorize"),
        tokenUrl: stryMutAct_9fa48("3804") ? "" : (stryCov_9fa48("3804"), "https://api.twitter.com/2/oauth2/token"),
        userInfoUrl: stryMutAct_9fa48("3805") ? "" : (stryCov_9fa48("3805"), "https://api.twitter.com/2/users/me"),
        usePKCE: stryMutAct_9fa48("3806") ? false : (stryCov_9fa48("3806"), true)
      }),
      custom: stryMutAct_9fa48("3807") ? {} : (stryCov_9fa48("3807"), {
        clientId: stryMutAct_9fa48("3808") ? "Stryker was here!" : (stryCov_9fa48("3808"), ""),
        redirectUri: stryMutAct_9fa48("3809") ? "Stryker was here!" : (stryCov_9fa48("3809"), ""),
        scope: stryMutAct_9fa48("3810") ? ["Stryker was here"] : (stryCov_9fa48("3810"), []),
        authUrl: stryMutAct_9fa48("3811") ? "Stryker was here!" : (stryCov_9fa48("3811"), ""),
        tokenUrl: stryMutAct_9fa48("3812") ? "Stryker was here!" : (stryCov_9fa48("3812"), ""),
        userInfoUrl: stryMutAct_9fa48("3813") ? "Stryker was here!" : (stryCov_9fa48("3813"), ""),
        usePKCE: stryMutAct_9fa48("3814") ? false : (stryCov_9fa48("3814"), true)
      })
    }),
    usePKCE: stryMutAct_9fa48("3815") ? false : (stryCov_9fa48("3815"), true),
    // PKCE abilitato di default per sicurezza
    cacheDuration: stryMutAct_9fa48("3816") ? 24 * 60 * 60 / 1000 : (stryCov_9fa48("3816"), (stryMutAct_9fa48("3817") ? 24 * 60 / 60 : (stryCov_9fa48("3817"), (stryMutAct_9fa48("3818") ? 24 / 60 : (stryCov_9fa48("3818"), 24 * 60)) * 60)) * 1000),
    // 24 hours
    timeout: 60000,
    maxRetries: 3,
    retryDelay: 1000,
    allowUnsafeClientSecret: stryMutAct_9fa48("3819") ? true : (stryCov_9fa48("3819"), false),
    // Disabilitato per sicurezza
    stateTimeout: stryMutAct_9fa48("3820") ? 10 * 60 / 1000 : (stryCov_9fa48("3820"), (stryMutAct_9fa48("3821") ? 10 / 60 : (stryCov_9fa48("3821"), 10 * 60)) * 1000) // 10 minuti per il timeout dello state
  });
  private config: Partial<OAuthConfig>;
  private readonly userCache: Map<string, OAuthCache> = new Map();
  // Fallback storage for Node.js environment
  private readonly memoryStorage: Map<string, string> = new Map();
  constructor(config: Partial<OAuthConfig> = {}) {
    super();
    this.config = stryMutAct_9fa48("3822") ? {} : (stryCov_9fa48("3822"), {
      ...this.DEFAULT_CONFIG,
      ...config,
      providers: stryMutAct_9fa48("3823") ? {} : (stryCov_9fa48("3823"), {
        ...(stryMutAct_9fa48("3826") ? this.DEFAULT_CONFIG.providers && {} : stryMutAct_9fa48("3825") ? false : stryMutAct_9fa48("3824") ? true : (stryCov_9fa48("3824", "3825", "3826"), this.DEFAULT_CONFIG.providers || {})),
        ...(stryMutAct_9fa48("3829") ? config.providers && {} : stryMutAct_9fa48("3828") ? false : stryMutAct_9fa48("3827") ? true : (stryCov_9fa48("3827", "3828", "3829"), config.providers || {}))
      })
    });

    // Validazione di sicurezza post-costruzione
    this.validateSecurityConfig();
  }

  /**
   * Validates security configuration
   */
  private validateSecurityConfig(): void {
    if (stryMutAct_9fa48("3830")) {
      {}
    } else {
      stryCov_9fa48("3830");
      const providers = stryMutAct_9fa48("3833") ? this.config.providers && {} : stryMutAct_9fa48("3832") ? false : stryMutAct_9fa48("3831") ? true : (stryCov_9fa48("3831", "3832", "3833"), this.config.providers || {});
      for (const [providerName, providerConfig] of Object.entries(providers)) {
        if (stryMutAct_9fa48("3834")) {
          {}
        } else {
          stryCov_9fa48("3834");
          if (stryMutAct_9fa48("3837") ? false : stryMutAct_9fa48("3836") ? true : stryMutAct_9fa48("3835") ? providerConfig : (stryCov_9fa48("3835", "3836", "3837"), !providerConfig)) continue;

          // Verify that PKCE is enabled for all providers in browser
          if (stryMutAct_9fa48("3840") ? typeof window !== "undefined" || !providerConfig.usePKCE : stryMutAct_9fa48("3839") ? false : stryMutAct_9fa48("3838") ? true : (stryCov_9fa48("3838", "3839", "3840"), (stryMutAct_9fa48("3842") ? typeof window === "undefined" : stryMutAct_9fa48("3841") ? true : (stryCov_9fa48("3841", "3842"), typeof window !== (stryMutAct_9fa48("3843") ? "" : (stryCov_9fa48("3843"), "undefined")))) && (stryMutAct_9fa48("3844") ? providerConfig.usePKCE : (stryCov_9fa48("3844"), !providerConfig.usePKCE)))) {
            if (stryMutAct_9fa48("3845")) {
              {}
            } else {
              stryCov_9fa48("3845");
              console.warn(stryMutAct_9fa48("3846") ? `` : (stryCov_9fa48("3846"), `Provider ${providerName} does not have PKCE enabled - not secure for browser`));
              // Force PKCE for all providers in browser, except if already configured differently
              providerConfig.usePKCE = stryMutAct_9fa48("3847") ? false : (stryCov_9fa48("3847"), true);
            }
          }

          // Verify that there is no client_secret in browser (except Google with PKCE)
          if (stryMutAct_9fa48("3850") ? typeof window !== "undefined" || providerConfig.clientSecret : stryMutAct_9fa48("3849") ? false : stryMutAct_9fa48("3848") ? true : (stryCov_9fa48("3848", "3849", "3850"), (stryMutAct_9fa48("3852") ? typeof window === "undefined" : stryMutAct_9fa48("3851") ? true : (stryCov_9fa48("3851", "3852"), typeof window !== (stryMutAct_9fa48("3853") ? "" : (stryCov_9fa48("3853"), "undefined")))) && providerConfig.clientSecret)) {
            if (stryMutAct_9fa48("3854")) {
              {}
            } else {
              stryCov_9fa48("3854");
              if (stryMutAct_9fa48("3857") ? providerName === "google" || providerConfig.usePKCE : stryMutAct_9fa48("3856") ? false : stryMutAct_9fa48("3855") ? true : (stryCov_9fa48("3855", "3856", "3857"), (stryMutAct_9fa48("3859") ? providerName !== "google" : stryMutAct_9fa48("3858") ? true : (stryCov_9fa48("3858", "3859"), providerName === (stryMutAct_9fa48("3860") ? "" : (stryCov_9fa48("3860"), "google")))) && providerConfig.usePKCE)) {
                if (stryMutAct_9fa48("3861")) {
                  {}
                } else {
                  stryCov_9fa48("3861");
                  console.log(stryMutAct_9fa48("3862") ? `` : (stryCov_9fa48("3862"), `Provider ${providerName} has client_secret configured - OK for Google with PKCE`));
                }
              } else {
                if (stryMutAct_9fa48("3863")) {
                  {}
                } else {
                  stryCov_9fa48("3863");
                  console.error(stryMutAct_9fa48("3864") ? `` : (stryCov_9fa48("3864"), `Provider ${providerName} has client_secret configured in browser - REMOVE IMMEDIATELY`));
                  // Remove client_secret for security in browser
                  delete providerConfig.clientSecret;
                  console.log(stryMutAct_9fa48("3865") ? `` : (stryCov_9fa48("3865"), `Provider ${providerName} client_secret removed for security in browser`));
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Update the connector configuration
   * @param config - New configuration options
   */
  updateConfig(config: Partial<OAuthConfig>): void {
    if (stryMutAct_9fa48("3866")) {
      {}
    } else {
      stryCov_9fa48("3866");
      this.config = stryMutAct_9fa48("3867") ? {} : (stryCov_9fa48("3867"), {
        ...this.config,
        ...config,
        providers: stryMutAct_9fa48("3868") ? {} : (stryCov_9fa48("3868"), {
          ...(stryMutAct_9fa48("3871") ? this.config.providers && {} : stryMutAct_9fa48("3870") ? false : stryMutAct_9fa48("3869") ? true : (stryCov_9fa48("3869", "3870", "3871"), this.config.providers || {})),
          ...(stryMutAct_9fa48("3874") ? config.providers && {} : stryMutAct_9fa48("3873") ? false : stryMutAct_9fa48("3872") ? true : (stryCov_9fa48("3872", "3873", "3874"), config.providers || {}))
        })
      });
      console.log(stryMutAct_9fa48("3875") ? "" : (stryCov_9fa48("3875"), "OAuthConnector configuration updated"), this.config);
    }
  }

  /**
   * Get origin URL (browser or Node.js compatible)
   */
  private getOrigin(): string {
    if (stryMutAct_9fa48("3876")) {
      {}
    } else {
      stryCov_9fa48("3876");
      if (stryMutAct_9fa48("3879") ? typeof window !== "undefined" || window.location : stryMutAct_9fa48("3878") ? false : stryMutAct_9fa48("3877") ? true : (stryCov_9fa48("3877", "3878", "3879"), (stryMutAct_9fa48("3881") ? typeof window === "undefined" : stryMutAct_9fa48("3880") ? true : (stryCov_9fa48("3880", "3881"), typeof window !== (stryMutAct_9fa48("3882") ? "" : (stryCov_9fa48("3882"), "undefined")))) && window.location)) {
        if (stryMutAct_9fa48("3883")) {
          {}
        } else {
          stryCov_9fa48("3883");
          return window.location.origin;
        }
      }
      // Fallback for Node.js environment
      return stryMutAct_9fa48("3884") ? "" : (stryCov_9fa48("3884"), "http://localhost:3000");
    }
  }

  /**
   * Storage abstraction (browser sessionStorage or Node.js Map)
   */
  private setItem(key: string, value: string): void {
    if (stryMutAct_9fa48("3885")) {
      {}
    } else {
      stryCov_9fa48("3885");
      if (stryMutAct_9fa48("3888") ? typeof window !== "undefined" || typeof sessionStorage !== "undefined" : stryMutAct_9fa48("3887") ? false : stryMutAct_9fa48("3886") ? true : (stryCov_9fa48("3886", "3887", "3888"), (stryMutAct_9fa48("3890") ? typeof window === "undefined" : stryMutAct_9fa48("3889") ? true : (stryCov_9fa48("3889", "3890"), typeof window !== (stryMutAct_9fa48("3891") ? "" : (stryCov_9fa48("3891"), "undefined")))) && (stryMutAct_9fa48("3893") ? typeof sessionStorage === "undefined" : stryMutAct_9fa48("3892") ? true : (stryCov_9fa48("3892", "3893"), typeof sessionStorage !== (stryMutAct_9fa48("3894") ? "" : (stryCov_9fa48("3894"), "undefined")))))) {
        if (stryMutAct_9fa48("3895")) {
          {}
        } else {
          stryCov_9fa48("3895");
          sessionStorage.setItem(key, value);
        }
      } else {
        if (stryMutAct_9fa48("3896")) {
          {}
        } else {
          stryCov_9fa48("3896");
          this.memoryStorage.set(key, value);
        }
      }
    }
  }
  private getItem(key: string): string | null {
    if (stryMutAct_9fa48("3897")) {
      {}
    } else {
      stryCov_9fa48("3897");
      if (stryMutAct_9fa48("3900") ? typeof window !== "undefined" || typeof sessionStorage !== "undefined" : stryMutAct_9fa48("3899") ? false : stryMutAct_9fa48("3898") ? true : (stryCov_9fa48("3898", "3899", "3900"), (stryMutAct_9fa48("3902") ? typeof window === "undefined" : stryMutAct_9fa48("3901") ? true : (stryCov_9fa48("3901", "3902"), typeof window !== (stryMutAct_9fa48("3903") ? "" : (stryCov_9fa48("3903"), "undefined")))) && (stryMutAct_9fa48("3905") ? typeof sessionStorage === "undefined" : stryMutAct_9fa48("3904") ? true : (stryCov_9fa48("3904", "3905"), typeof sessionStorage !== (stryMutAct_9fa48("3906") ? "" : (stryCov_9fa48("3906"), "undefined")))))) {
        if (stryMutAct_9fa48("3907")) {
          {}
        } else {
          stryCov_9fa48("3907");
          return sessionStorage.getItem(key);
        }
      } else {
        if (stryMutAct_9fa48("3908")) {
          {}
        } else {
          stryCov_9fa48("3908");
          return stryMutAct_9fa48("3911") ? this.memoryStorage.get(key) && null : stryMutAct_9fa48("3910") ? false : stryMutAct_9fa48("3909") ? true : (stryCov_9fa48("3909", "3910", "3911"), this.memoryStorage.get(key) || null);
        }
      }
    }
  }
  private removeItem(key: string): void {
    if (stryMutAct_9fa48("3912")) {
      {}
    } else {
      stryCov_9fa48("3912");
      if (stryMutAct_9fa48("3915") ? typeof window !== "undefined" || typeof sessionStorage !== "undefined" : stryMutAct_9fa48("3914") ? false : stryMutAct_9fa48("3913") ? true : (stryCov_9fa48("3913", "3914", "3915"), (stryMutAct_9fa48("3917") ? typeof window === "undefined" : stryMutAct_9fa48("3916") ? true : (stryCov_9fa48("3916", "3917"), typeof window !== (stryMutAct_9fa48("3918") ? "" : (stryCov_9fa48("3918"), "undefined")))) && (stryMutAct_9fa48("3920") ? typeof sessionStorage === "undefined" : stryMutAct_9fa48("3919") ? true : (stryCov_9fa48("3919", "3920"), typeof sessionStorage !== (stryMutAct_9fa48("3921") ? "" : (stryCov_9fa48("3921"), "undefined")))))) {
        if (stryMutAct_9fa48("3922")) {
          {}
        } else {
          stryCov_9fa48("3922");
          sessionStorage.removeItem(key);
        }
      } else {
        if (stryMutAct_9fa48("3923")) {
          {}
        } else {
          stryCov_9fa48("3923");
          this.memoryStorage.delete(key);
        }
      }
    }
  }

  /**
   * Check if OAuth is supported
   */
  isSupported(): boolean {
    if (stryMutAct_9fa48("3924")) {
      {}
    } else {
      stryCov_9fa48("3924");
      // In Node.js, we can still demonstrate the functionality
      return stryMutAct_9fa48("3927") ? typeof URLSearchParams === "undefined" : stryMutAct_9fa48("3926") ? false : stryMutAct_9fa48("3925") ? true : (stryCov_9fa48("3925", "3926", "3927"), typeof URLSearchParams !== (stryMutAct_9fa48("3928") ? "" : (stryCov_9fa48("3928"), "undefined")));
    }
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): OAuthProvider[] {
    if (stryMutAct_9fa48("3929")) {
      {}
    } else {
      stryCov_9fa48("3929");
      return Object.keys(this.config.providers || {}).filter(provider => this.config.providers![provider as OAuthProvider]?.clientId) as OAuthProvider[];
    }
  }

  /**
   * Generate PKCE challenge for secure OAuth flow
   */
  private async generatePKCEChallenge(): Promise<{
    codeVerifier: string;
    codeChallenge: string;
  }> {
    if (stryMutAct_9fa48("3930")) {
      {}
    } else {
      stryCov_9fa48("3930");
      const codeVerifier = this.generateRandomString(128);
      const codeChallenge = await this.calculatePKCECodeChallenge(codeVerifier);
      return stryMutAct_9fa48("3931") ? {} : (stryCov_9fa48("3931"), {
        codeVerifier,
        codeChallenge
      });
    }
  }

  /**
   * Calculate the PKCE code challenge from a code verifier.
   * Hashes the verifier using SHA-256 and then base64url encodes it.
   * @param verifier The code verifier string.
   * @returns The base64url-encoded SHA-256 hash of the verifier.
   */
  private async calculatePKCECodeChallenge(verifier: string): Promise<string> {
    if (stryMutAct_9fa48("3932")) {
      {}
    } else {
      stryCov_9fa48("3932");
      if (stryMutAct_9fa48("3935") ? typeof window !== "undefined" && window.crypto || window.crypto.subtle : stryMutAct_9fa48("3934") ? false : stryMutAct_9fa48("3933") ? true : (stryCov_9fa48("3933", "3934", "3935"), (stryMutAct_9fa48("3937") ? typeof window !== "undefined" || window.crypto : stryMutAct_9fa48("3936") ? true : (stryCov_9fa48("3936", "3937"), (stryMutAct_9fa48("3939") ? typeof window === "undefined" : stryMutAct_9fa48("3938") ? true : (stryCov_9fa48("3938", "3939"), typeof window !== (stryMutAct_9fa48("3940") ? "" : (stryCov_9fa48("3940"), "undefined")))) && window.crypto)) && window.crypto.subtle)) {
        if (stryMutAct_9fa48("3941")) {
          {}
        } else {
          stryCov_9fa48("3941");
          // Browser environment
          const encoder = new TextEncoder();
          const data = encoder.encode(verifier);
          const hashBuffer = await window.crypto.subtle.digest(stryMutAct_9fa48("3942") ? "" : (stryCov_9fa48("3942"), "SHA-256"), data);
          return this.base64urlEncode(hashBuffer);
        }
      } else {
        if (stryMutAct_9fa48("3943")) {
          {}
        } else {
          stryCov_9fa48("3943");
          // Node.js environment
          const crypto = require("crypto");
          const hash = crypto.createHash(stryMutAct_9fa48("3944") ? "" : (stryCov_9fa48("3944"), "sha256")).update(verifier).digest();
          return this.base64urlEncode(hash);
        }
      }
    }
  }

  /**
   * Encodes a buffer into a Base64URL-encoded string.
   * @param buffer The buffer to encode.
   * @returns The Base64URL-encoded string.
   */
  private base64urlEncode(buffer: ArrayBuffer | Buffer): string {
    if (stryMutAct_9fa48("3945")) {
      {}
    } else {
      stryCov_9fa48("3945");
      let base64string: string;

      // In Node.js, we can use the Buffer object. In the browser, we need a different approach.
      if (stryMutAct_9fa48("3948") ? typeof Buffer !== "undefined" || Buffer.isBuffer(buffer) : stryMutAct_9fa48("3947") ? false : stryMutAct_9fa48("3946") ? true : (stryCov_9fa48("3946", "3947", "3948"), (stryMutAct_9fa48("3950") ? typeof Buffer === "undefined" : stryMutAct_9fa48("3949") ? true : (stryCov_9fa48("3949", "3950"), typeof Buffer !== (stryMutAct_9fa48("3951") ? "" : (stryCov_9fa48("3951"), "undefined")))) && Buffer.isBuffer(buffer))) {
        if (stryMutAct_9fa48("3952")) {
          {}
        } else {
          stryCov_9fa48("3952");
          // Node.js path
          base64string = buffer.toString(stryMutAct_9fa48("3953") ? "" : (stryCov_9fa48("3953"), "base64"));
        }
      } else {
        if (stryMutAct_9fa48("3954")) {
          {}
        } else {
          stryCov_9fa48("3954");
          // Browser path (assuming ArrayBuffer)
          const bytes = new Uint8Array(buffer as ArrayBuffer);
          let binary = stryMutAct_9fa48("3955") ? "Stryker was here!" : (stryCov_9fa48("3955"), "");
          for (let i = 0; stryMutAct_9fa48("3958") ? i >= bytes.length : stryMutAct_9fa48("3957") ? i <= bytes.length : stryMutAct_9fa48("3956") ? false : (stryCov_9fa48("3956", "3957", "3958"), i < bytes.length); stryMutAct_9fa48("3959") ? i-- : (stryCov_9fa48("3959"), i++)) {
            if (stryMutAct_9fa48("3960")) {
              {}
            } else {
              stryCov_9fa48("3960");
              stryMutAct_9fa48("3961") ? binary -= String.fromCharCode(bytes[i]) : (stryCov_9fa48("3961"), binary += String.fromCharCode(bytes[i]));
            }
          }
          base64string = window.btoa(binary);
        }
      }
      return base64string.replace(/\+/g, stryMutAct_9fa48("3962") ? "" : (stryCov_9fa48("3962"), "-")).replace(/\//g, stryMutAct_9fa48("3963") ? "" : (stryCov_9fa48("3963"), "_")).replace(/=/g, stryMutAct_9fa48("3964") ? "Stryker was here!" : (stryCov_9fa48("3964"), ""));
    }
  }

  /**
   * Generate cryptographically secure random string
   */
  private generateRandomString(length: number): string {
    if (stryMutAct_9fa48("3965")) {
      {}
    } else {
      stryCov_9fa48("3965");
      const charset = stryMutAct_9fa48("3966") ? "" : (stryCov_9fa48("3966"), "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~");
      let randomValues: Uint8Array;
      if (stryMutAct_9fa48("3969") ? typeof window !== "undefined" || window.crypto : stryMutAct_9fa48("3968") ? false : stryMutAct_9fa48("3967") ? true : (stryCov_9fa48("3967", "3968", "3969"), (stryMutAct_9fa48("3971") ? typeof window === "undefined" : stryMutAct_9fa48("3970") ? true : (stryCov_9fa48("3970", "3971"), typeof window !== (stryMutAct_9fa48("3972") ? "" : (stryCov_9fa48("3972"), "undefined")))) && window.crypto)) {
        if (stryMutAct_9fa48("3973")) {
          {}
        } else {
          stryCov_9fa48("3973");
          // Browser environment
          randomValues = new Uint8Array(length);
          window.crypto.getRandomValues(randomValues);
        }
      } else {
        if (stryMutAct_9fa48("3974")) {
          {}
        } else {
          stryCov_9fa48("3974");
          // Node.js environment
          const crypto = require("crypto");
          randomValues = new Uint8Array(crypto.randomBytes(length));
        }
      }
      return Array.from(randomValues).map(stryMutAct_9fa48("3975") ? () => undefined : (stryCov_9fa48("3975"), value => charset[stryMutAct_9fa48("3976") ? value * charset.length : (stryCov_9fa48("3976"), value % charset.length)])).join(stryMutAct_9fa48("3977") ? "Stryker was here!" : (stryCov_9fa48("3977"), ""));
    }
  }

  /**
   * Initiate OAuth flow
   */
  async initiateOAuth(provider: OAuthProvider): Promise<OAuthConnectionResult> {
    if (stryMutAct_9fa48("3978")) {
      {}
    } else {
      stryCov_9fa48("3978");
      const providerConfig = stryMutAct_9fa48("3979") ? this.config.providers[provider] : (stryCov_9fa48("3979"), this.config.providers?.[provider]);
      if (stryMutAct_9fa48("3982") ? false : stryMutAct_9fa48("3981") ? true : stryMutAct_9fa48("3980") ? providerConfig : (stryCov_9fa48("3980", "3981", "3982"), !providerConfig)) {
        if (stryMutAct_9fa48("3983")) {
          {}
        } else {
          stryCov_9fa48("3983");
          const errorMsg = stryMutAct_9fa48("3984") ? `` : (stryCov_9fa48("3984"), `Provider '${provider}' is not configured.`);
          console.error(errorMsg);
          return stryMutAct_9fa48("3985") ? {} : (stryCov_9fa48("3985"), {
            success: stryMutAct_9fa48("3986") ? true : (stryCov_9fa48("3986"), false),
            error: errorMsg
          });
        }
      }

      // Validazione di sicurezza pre-inizializzazione
      if (stryMutAct_9fa48("3989") ? typeof window !== "undefined" || providerConfig.clientSecret : stryMutAct_9fa48("3988") ? false : stryMutAct_9fa48("3987") ? true : (stryCov_9fa48("3987", "3988", "3989"), (stryMutAct_9fa48("3991") ? typeof window === "undefined" : stryMutAct_9fa48("3990") ? true : (stryCov_9fa48("3990", "3991"), typeof window !== (stryMutAct_9fa48("3992") ? "" : (stryCov_9fa48("3992"), "undefined")))) && providerConfig.clientSecret)) {
        if (stryMutAct_9fa48("3993")) {
          {}
        } else {
          stryCov_9fa48("3993");
          // Google OAuth richiede client_secret anche con PKCE
          if (stryMutAct_9fa48("3996") ? provider === "google" || providerConfig.usePKCE : stryMutAct_9fa48("3995") ? false : stryMutAct_9fa48("3994") ? true : (stryCov_9fa48("3994", "3995", "3996"), (stryMutAct_9fa48("3998") ? provider !== "google" : stryMutAct_9fa48("3997") ? true : (stryCov_9fa48("3997", "3998"), provider === (stryMutAct_9fa48("3999") ? "" : (stryCov_9fa48("3999"), "google")))) && providerConfig.usePKCE)) {
            if (stryMutAct_9fa48("4000")) {
              {}
            } else {
              stryCov_9fa48("4000");
              console.log(stryMutAct_9fa48("4001") ? `` : (stryCov_9fa48("4001"), `Provider ${provider} has client_secret configured - OK for Google with PKCE`));
            }
          } else {
            if (stryMutAct_9fa48("4002")) {
              {}
            } else {
              stryCov_9fa48("4002");
              const errorMsg = stryMutAct_9fa48("4003") ? `` : (stryCov_9fa48("4003"), `Client secret cannot be used in browser for ${provider}`);
              console.error(errorMsg);
              return stryMutAct_9fa48("4004") ? {} : (stryCov_9fa48("4004"), {
                success: stryMutAct_9fa48("4005") ? true : (stryCov_9fa48("4005"), false),
                error: errorMsg
              });
            }
          }
        }
      }
      try {
        if (stryMutAct_9fa48("4006")) {
          {}
        } else {
          stryCov_9fa48("4006");
          const state = this.generateRandomString(32);
          const stateTimestamp = Date.now();

          // Salva state con timestamp per validazione timeout
          this.setItem(stryMutAct_9fa48("4007") ? `` : (stryCov_9fa48("4007"), `oauth_state_${provider}`), state);
          this.setItem(stryMutAct_9fa48("4008") ? `` : (stryCov_9fa48("4008"), `oauth_state_timestamp_${provider}`), stateTimestamp.toString());
          let authUrl = providerConfig.authUrl;
          const authParams = new URLSearchParams(stryMutAct_9fa48("4009") ? {} : (stryCov_9fa48("4009"), {
            client_id: providerConfig.clientId,
            redirect_uri: providerConfig.redirectUri,
            response_type: stryMutAct_9fa48("4010") ? "" : (stryCov_9fa48("4010"), "code"),
            state
          }));

          // Add scope if configured
          if (stryMutAct_9fa48("4013") ? providerConfig.scope || providerConfig.scope.length > 0 : stryMutAct_9fa48("4012") ? false : stryMutAct_9fa48("4011") ? true : (stryCov_9fa48("4011", "4012", "4013"), providerConfig.scope && (stryMutAct_9fa48("4016") ? providerConfig.scope.length <= 0 : stryMutAct_9fa48("4015") ? providerConfig.scope.length >= 0 : stryMutAct_9fa48("4014") ? true : (stryCov_9fa48("4014", "4015", "4016"), providerConfig.scope.length > 0)))) {
            if (stryMutAct_9fa48("4017")) {
              {}
            } else {
              stryCov_9fa48("4017");
              authParams.set(stryMutAct_9fa48("4018") ? "" : (stryCov_9fa48("4018"), "scope"), providerConfig.scope.join(stryMutAct_9fa48("4019") ? "" : (stryCov_9fa48("4019"), " ")));
            }
          }

          // Add Google-specific parameters for better UX
          if (stryMutAct_9fa48("4022") ? provider !== "google" : stryMutAct_9fa48("4021") ? false : stryMutAct_9fa48("4020") ? true : (stryCov_9fa48("4020", "4021", "4022"), provider === (stryMutAct_9fa48("4023") ? "" : (stryCov_9fa48("4023"), "google")))) {
            if (stryMutAct_9fa48("4024")) {
              {}
            } else {
              stryCov_9fa48("4024");
              authParams.set(stryMutAct_9fa48("4025") ? "" : (stryCov_9fa48("4025"), "prompt"), stryMutAct_9fa48("4026") ? "" : (stryCov_9fa48("4026"), "select_account")); // Force account selection
              authParams.set(stryMutAct_9fa48("4027") ? "" : (stryCov_9fa48("4027"), "access_type"), stryMutAct_9fa48("4028") ? "" : (stryCov_9fa48("4028"), "offline")); // Get refresh token
              authParams.set(stryMutAct_9fa48("4029") ? "" : (stryCov_9fa48("4029"), "include_granted_scopes"), stryMutAct_9fa48("4030") ? "" : (stryCov_9fa48("4030"), "true")); // Include previously granted scopes
            }
          }

          // PKCE è obbligatorio per sicurezza
          const isPKCEEnabled = stryMutAct_9fa48("4031") ? (providerConfig.usePKCE ?? this.config.usePKCE) && true : (stryCov_9fa48("4031"), (stryMutAct_9fa48("4032") ? providerConfig.usePKCE && this.config.usePKCE : (stryCov_9fa48("4032"), providerConfig.usePKCE ?? this.config.usePKCE)) ?? (stryMutAct_9fa48("4033") ? false : (stryCov_9fa48("4033"), true)));
          if (stryMutAct_9fa48("4036") ? !isPKCEEnabled || typeof window !== "undefined" : stryMutAct_9fa48("4035") ? false : stryMutAct_9fa48("4034") ? true : (stryCov_9fa48("4034", "4035", "4036"), (stryMutAct_9fa48("4037") ? isPKCEEnabled : (stryCov_9fa48("4037"), !isPKCEEnabled)) && (stryMutAct_9fa48("4039") ? typeof window === "undefined" : stryMutAct_9fa48("4038") ? true : (stryCov_9fa48("4038", "4039"), typeof window !== (stryMutAct_9fa48("4040") ? "" : (stryCov_9fa48("4040"), "undefined")))))) {
            if (stryMutAct_9fa48("4041")) {
              {}
            } else {
              stryCov_9fa48("4041");
              const errorMsg = stryMutAct_9fa48("4042") ? `` : (stryCov_9fa48("4042"), `PKCE is required for ${provider} in browser for security reasons`);
              console.error(errorMsg);
              return stryMutAct_9fa48("4043") ? {} : (stryCov_9fa48("4043"), {
                success: stryMutAct_9fa48("4044") ? true : (stryCov_9fa48("4044"), false),
                error: errorMsg
              });
            }
          }
          if (stryMutAct_9fa48("4046") ? false : stryMutAct_9fa48("4045") ? true : (stryCov_9fa48("4045", "4046"), isPKCEEnabled)) {
            if (stryMutAct_9fa48("4047")) {
              {}
            } else {
              stryCov_9fa48("4047");
              console.log(stryMutAct_9fa48("4048") ? "" : (stryCov_9fa48("4048"), "PKCE is enabled, generating challenge..."));
              const {
                codeVerifier,
                codeChallenge
              } = await this.generatePKCEChallenge();
              console.log(stryMutAct_9fa48("4049") ? `` : (stryCov_9fa48("4049"), `Generated code verifier: ${stryMutAct_9fa48("4050") ? codeVerifier : (stryCov_9fa48("4050"), codeVerifier.substring(0, 10))}... (length: ${codeVerifier.length})`));
              console.log(stryMutAct_9fa48("4051") ? `` : (stryCov_9fa48("4051"), `Generated code challenge: ${stryMutAct_9fa48("4052") ? codeChallenge : (stryCov_9fa48("4052"), codeChallenge.substring(0, 10))}... (length: ${codeChallenge.length})`));
              this.setItem(stryMutAct_9fa48("4053") ? `` : (stryCov_9fa48("4053"), `oauth_verifier_${provider}`), codeVerifier);
              this.setItem(stryMutAct_9fa48("4054") ? `` : (stryCov_9fa48("4054"), `oauth_verifier_timestamp_${provider}`), stateTimestamp.toString());
              console.log(stryMutAct_9fa48("4055") ? `` : (stryCov_9fa48("4055"), `Saved code verifier to storage with key: oauth_verifier_${provider}`));
              authParams.set(stryMutAct_9fa48("4056") ? "" : (stryCov_9fa48("4056"), "code_challenge"), codeChallenge);
              authParams.set(stryMutAct_9fa48("4057") ? "" : (stryCov_9fa48("4057"), "code_challenge_method"), stryMutAct_9fa48("4058") ? "" : (stryCov_9fa48("4058"), "S256"));
              console.log(stryMutAct_9fa48("4059") ? "" : (stryCov_9fa48("4059"), "Added PKCE parameters to auth URL"));
            }
          }

          // If the authorization URL already contains query parameters, add the new parameters
          if (stryMutAct_9fa48("4061") ? false : stryMutAct_9fa48("4060") ? true : (stryCov_9fa48("4060", "4061"), authUrl.includes(stryMutAct_9fa48("4062") ? "" : (stryCov_9fa48("4062"), "?")))) {
            if (stryMutAct_9fa48("4063")) {
              {}
            } else {
              stryCov_9fa48("4063");
              authUrl = stryMutAct_9fa48("4064") ? `` : (stryCov_9fa48("4064"), `${authUrl}&${authParams.toString()}`);
            }
          } else {
            if (stryMutAct_9fa48("4065")) {
              {}
            } else {
              stryCov_9fa48("4065");
              authUrl = stryMutAct_9fa48("4066") ? `` : (stryCov_9fa48("4066"), `${authUrl}?${authParams.toString()}`);
            }
          }
          this.emit(stryMutAct_9fa48("4067") ? "" : (stryCov_9fa48("4067"), "oauth_initiated"), stryMutAct_9fa48("4068") ? {} : (stryCov_9fa48("4068"), {
            provider,
            authUrl
          }));
          return stryMutAct_9fa48("4069") ? {} : (stryCov_9fa48("4069"), {
            success: stryMutAct_9fa48("4070") ? false : (stryCov_9fa48("4070"), true),
            provider,
            authUrl
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("4071")) {
          {}
        } else {
          stryCov_9fa48("4071");
          console.error(stryMutAct_9fa48("4072") ? `` : (stryCov_9fa48("4072"), `Error initiating OAuth with ${provider}:`), error);
          return stryMutAct_9fa48("4073") ? {} : (stryCov_9fa48("4073"), {
            success: stryMutAct_9fa48("4074") ? true : (stryCov_9fa48("4074"), false),
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Complete OAuth flow
   */
  async completeOAuth(provider: OAuthProvider, authCode: string, state?: string): Promise<OAuthConnectionResult> {
    if (stryMutAct_9fa48("4075")) {
      {}
    } else {
      stryCov_9fa48("4075");
      const providerConfig = stryMutAct_9fa48("4076") ? this.config.providers[provider] : (stryCov_9fa48("4076"), this.config.providers?.[provider]);
      if (stryMutAct_9fa48("4079") ? false : stryMutAct_9fa48("4078") ? true : stryMutAct_9fa48("4077") ? providerConfig : (stryCov_9fa48("4077", "4078", "4079"), !providerConfig)) {
        if (stryMutAct_9fa48("4080")) {
          {}
        } else {
          stryCov_9fa48("4080");
          const errorMsg = stryMutAct_9fa48("4081") ? `` : (stryCov_9fa48("4081"), `Provider '${provider}' is not configured.`);
          console.error(errorMsg);
          return stryMutAct_9fa48("4082") ? {} : (stryCov_9fa48("4082"), {
            success: stryMutAct_9fa48("4083") ? true : (stryCov_9fa48("4083"), false),
            error: errorMsg
          });
        }
      }
      try {
        if (stryMutAct_9fa48("4084")) {
          {}
        } else {
          stryCov_9fa48("4084");
          const tokenData = await this.exchangeCodeForToken(provider, providerConfig, authCode, state);
          if (stryMutAct_9fa48("4087") ? false : stryMutAct_9fa48("4086") ? true : stryMutAct_9fa48("4085") ? tokenData.access_token : (stryCov_9fa48("4085", "4086", "4087"), !tokenData.access_token)) {
            if (stryMutAct_9fa48("4088")) {
              {}
            } else {
              stryCov_9fa48("4088");
              const errorMsg = stryMutAct_9fa48("4089") ? "" : (stryCov_9fa48("4089"), "No access token received from provider");
              console.error(errorMsg, tokenData);
              return stryMutAct_9fa48("4090") ? {} : (stryCov_9fa48("4090"), {
                success: stryMutAct_9fa48("4091") ? true : (stryCov_9fa48("4091"), false),
                error: errorMsg
              });
            }
          }
          const userInfo = await this.fetchUserInfo(provider, providerConfig, tokenData.access_token);

          // Cache user info
          this.cacheUserInfo(userInfo.id, provider, userInfo);

          // Generate credentials
          const credentials = await this.generateCredentials(userInfo, provider);
          this.emit(stryMutAct_9fa48("4092") ? "" : (stryCov_9fa48("4092"), "oauth_completed"), stryMutAct_9fa48("4093") ? {} : (stryCov_9fa48("4093"), {
            provider,
            userInfo,
            credentials
          }));
          return stryMutAct_9fa48("4094") ? {} : (stryCov_9fa48("4094"), {
            success: stryMutAct_9fa48("4095") ? false : (stryCov_9fa48("4095"), true),
            provider,
            userInfo
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("4096")) {
          {}
        } else {
          stryCov_9fa48("4096");
          console.error(stryMutAct_9fa48("4097") ? `` : (stryCov_9fa48("4097"), `Error completing OAuth with ${provider}:`), error);
          return stryMutAct_9fa48("4098") ? {} : (stryCov_9fa48("4098"), {
            success: stryMutAct_9fa48("4099") ? true : (stryCov_9fa48("4099"), false),
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Generate credentials from OAuth user info
   * Ora restituisce anche la chiave GunDB derivata (key)
   */
  async generateCredentials(userInfo: OAuthUserInfo, provider: OAuthProvider): Promise<OAuthCredentials & {
    key: any;
  }> {
    if (stryMutAct_9fa48("4100")) {
      {}
    } else {
      stryCov_9fa48("4100");
      const providerConfig = stryMutAct_9fa48("4101") ? this.config.providers[provider] : (stryCov_9fa48("4101"), this.config.providers?.[provider]);
      if (stryMutAct_9fa48("4104") ? false : stryMutAct_9fa48("4103") ? true : stryMutAct_9fa48("4102") ? providerConfig : (stryCov_9fa48("4102", "4103", "4104"), !providerConfig)) {
        if (stryMutAct_9fa48("4105")) {
          {}
        } else {
          stryCov_9fa48("4105");
          throw new Error(stryMutAct_9fa48("4106") ? `` : (stryCov_9fa48("4106"), `Provider ${provider} is not configured.`));
        }
      }

      // Username uniforme
      const username = generateUsernameFromIdentity(provider, userInfo);
      try {
        if (stryMutAct_9fa48("4107")) {
          {}
        } else {
          stryCov_9fa48("4107");
          console.log(stryMutAct_9fa48("4108") ? `` : (stryCov_9fa48("4108"), `Generating credentials for ${provider} user: ${userInfo.id}`));
          const saltData = stryMutAct_9fa48("4109") ? `` : (stryCov_9fa48("4109"), `${userInfo.id}_${provider}_${stryMutAct_9fa48("4112") ? userInfo.email && "no-email" : stryMutAct_9fa48("4111") ? false : stryMutAct_9fa48("4110") ? true : (stryCov_9fa48("4110", "4111", "4112"), userInfo.email || (stryMutAct_9fa48("4113") ? "" : (stryCov_9fa48("4113"), "no-email")))}`);
          const salt = ethers.keccak256(ethers.toUtf8Bytes(saltData));
          // Password deterministica (compatibilità)
          const password = generateDeterministicPassword(salt);
          // Deriva la chiave GunDB
          const key = await derive(password, salt, stryMutAct_9fa48("4114") ? {} : (stryCov_9fa48("4114"), {
            includeP256: stryMutAct_9fa48("4115") ? false : (stryCov_9fa48("4115"), true)
          }));
          const credentials: OAuthCredentials & {
            key: any;
          } = stryMutAct_9fa48("4116") ? {} : (stryCov_9fa48("4116"), {
            username,
            password,
            provider,
            key
          });
          this.cacheUserInfo(userInfo.id, provider, userInfo);
          console.log(stryMutAct_9fa48("4117") ? "" : (stryCov_9fa48("4117"), "OAuth credentials generated successfully"));
          return credentials;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("4118")) {
          {}
        } else {
          stryCov_9fa48("4118");
          console.error(stryMutAct_9fa48("4119") ? "" : (stryCov_9fa48("4119"), "Error generating OAuth credentials:"), error);
          throw error;
        }
      }
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(provider: OAuthProvider, providerConfig: OAuthProviderConfig, code: string, state?: string): Promise<any> {
    if (stryMutAct_9fa48("4120")) {
      {}
    } else {
      stryCov_9fa48("4120");
      const storedState = this.getItem(stryMutAct_9fa48("4121") ? `` : (stryCov_9fa48("4121"), `oauth_state_${provider}`));
      const storedStateTimestamp = this.getItem(stryMutAct_9fa48("4122") ? `` : (stryCov_9fa48("4122"), `oauth_state_timestamp_${provider}`));
      if (stryMutAct_9fa48("4125") ? (!state || !storedState) && state !== storedState : stryMutAct_9fa48("4124") ? false : stryMutAct_9fa48("4123") ? true : (stryCov_9fa48("4123", "4124", "4125"), (stryMutAct_9fa48("4127") ? !state && !storedState : stryMutAct_9fa48("4126") ? false : (stryCov_9fa48("4126", "4127"), (stryMutAct_9fa48("4128") ? state : (stryCov_9fa48("4128"), !state)) || (stryMutAct_9fa48("4129") ? storedState : (stryCov_9fa48("4129"), !storedState)))) || (stryMutAct_9fa48("4131") ? state === storedState : stryMutAct_9fa48("4130") ? false : (stryCov_9fa48("4130", "4131"), state !== storedState)))) {
        if (stryMutAct_9fa48("4132")) {
          {}
        } else {
          stryCov_9fa48("4132");
          this.removeItem(stryMutAct_9fa48("4133") ? `` : (stryCov_9fa48("4133"), `oauth_state_${provider}`));
          this.removeItem(stryMutAct_9fa48("4134") ? `` : (stryCov_9fa48("4134"), `oauth_state_timestamp_${provider}`));
          throw new Error(stryMutAct_9fa48("4135") ? "" : (stryCov_9fa48("4135"), "Invalid state parameter or expired"));
        }
      }

      // Validazione del timestamp dello state
      if (stryMutAct_9fa48("4137") ? false : stryMutAct_9fa48("4136") ? true : (stryCov_9fa48("4136", "4137"), storedStateTimestamp)) {
        if (stryMutAct_9fa48("4138")) {
          {}
        } else {
          stryCov_9fa48("4138");
          const stateTimestamp = parseInt(storedStateTimestamp, 10);
          const stateTimeout = stryMutAct_9fa48("4141") ? this.config.stateTimeout && 10 * 60 * 1000 : stryMutAct_9fa48("4140") ? false : stryMutAct_9fa48("4139") ? true : (stryCov_9fa48("4139", "4140", "4141"), this.config.stateTimeout || (stryMutAct_9fa48("4142") ? 10 * 60 / 1000 : (stryCov_9fa48("4142"), (stryMutAct_9fa48("4143") ? 10 / 60 : (stryCov_9fa48("4143"), 10 * 60)) * 1000))); // Default 10 minuti
          if (stryMutAct_9fa48("4147") ? Date.now() - stateTimestamp <= stateTimeout : stryMutAct_9fa48("4146") ? Date.now() - stateTimestamp >= stateTimeout : stryMutAct_9fa48("4145") ? false : stryMutAct_9fa48("4144") ? true : (stryCov_9fa48("4144", "4145", "4146", "4147"), (stryMutAct_9fa48("4148") ? Date.now() + stateTimestamp : (stryCov_9fa48("4148"), Date.now() - stateTimestamp)) > stateTimeout)) {
            if (stryMutAct_9fa48("4149")) {
              {}
            } else {
              stryCov_9fa48("4149");
              this.removeItem(stryMutAct_9fa48("4150") ? `` : (stryCov_9fa48("4150"), `oauth_state_${provider}`));
              this.removeItem(stryMutAct_9fa48("4151") ? `` : (stryCov_9fa48("4151"), `oauth_state_timestamp_${provider}`));
              throw new Error(stryMutAct_9fa48("4152") ? "" : (stryCov_9fa48("4152"), "State parameter expired"));
            }
          }
        }
      }
      this.removeItem(stryMutAct_9fa48("4153") ? `` : (stryCov_9fa48("4153"), `oauth_state_${provider}`));
      this.removeItem(stryMutAct_9fa48("4154") ? `` : (stryCov_9fa48("4154"), `oauth_state_timestamp_${provider}`));
      const tokenParams: Record<string, string> = stryMutAct_9fa48("4155") ? {} : (stryCov_9fa48("4155"), {
        client_id: providerConfig.clientId,
        code: code,
        redirect_uri: providerConfig.redirectUri,
        grant_type: stryMutAct_9fa48("4156") ? "" : (stryCov_9fa48("4156"), "authorization_code")
      });

      // Check for PKCE first
      const isPKCEEnabled = stryMutAct_9fa48("4157") ? providerConfig.usePKCE && this.config.usePKCE : (stryCov_9fa48("4157"), providerConfig.usePKCE ?? this.config.usePKCE);
      if (stryMutAct_9fa48("4159") ? false : stryMutAct_9fa48("4158") ? true : (stryCov_9fa48("4158", "4159"), isPKCEEnabled)) {
        if (stryMutAct_9fa48("4160")) {
          {}
        } else {
          stryCov_9fa48("4160");
          console.log(stryMutAct_9fa48("4161") ? "" : (stryCov_9fa48("4161"), "PKCE enabled, retrieving code verifier..."));

          // Debug: Show all oauth-related keys in sessionStorage
          if (stryMutAct_9fa48("4164") ? typeof sessionStorage === "undefined" : stryMutAct_9fa48("4163") ? false : stryMutAct_9fa48("4162") ? true : (stryCov_9fa48("4162", "4163", "4164"), typeof sessionStorage !== (stryMutAct_9fa48("4165") ? "" : (stryCov_9fa48("4165"), "undefined")))) {
            if (stryMutAct_9fa48("4166")) {
              {}
            } else {
              stryCov_9fa48("4166");
              const oauthKeys = stryMutAct_9fa48("4167") ? ["Stryker was here"] : (stryCov_9fa48("4167"), []);
              for (let i = 0; stryMutAct_9fa48("4170") ? i >= sessionStorage.length : stryMutAct_9fa48("4169") ? i <= sessionStorage.length : stryMutAct_9fa48("4168") ? false : (stryCov_9fa48("4168", "4169", "4170"), i < sessionStorage.length); stryMutAct_9fa48("4171") ? i-- : (stryCov_9fa48("4171"), i++)) {
                if (stryMutAct_9fa48("4172")) {
                  {}
                } else {
                  stryCov_9fa48("4172");
                  const key = sessionStorage.key(i);
                  if (stryMutAct_9fa48("4175") ? key || key.startsWith("oauth_") : stryMutAct_9fa48("4174") ? false : stryMutAct_9fa48("4173") ? true : (stryCov_9fa48("4173", "4174", "4175"), key && (stryMutAct_9fa48("4176") ? key.endsWith("oauth_") : (stryCov_9fa48("4176"), key.startsWith(stryMutAct_9fa48("4177") ? "" : (stryCov_9fa48("4177"), "oauth_")))))) {
                    if (stryMutAct_9fa48("4178")) {
                      {}
                    } else {
                      stryCov_9fa48("4178");
                      oauthKeys.push(key);
                    }
                  }
                }
              }
              console.log(stryMutAct_9fa48("4179") ? "" : (stryCov_9fa48("4179"), "OAuth keys in sessionStorage:"), oauthKeys);
            }
          }
          const verifier = this.getItem(stryMutAct_9fa48("4180") ? `` : (stryCov_9fa48("4180"), `oauth_verifier_${provider}`));
          const verifierTimestamp = this.getItem(stryMutAct_9fa48("4181") ? `` : (stryCov_9fa48("4181"), `oauth_verifier_timestamp_${provider}`));
          console.log(stryMutAct_9fa48("4182") ? `` : (stryCov_9fa48("4182"), `Looking for key: oauth_verifier_${provider}, found:`), stryMutAct_9fa48("4183") ? !verifier : (stryCov_9fa48("4183"), !(stryMutAct_9fa48("4184") ? verifier : (stryCov_9fa48("4184"), !verifier))));
          if (stryMutAct_9fa48("4187") ? verifier || verifierTimestamp : stryMutAct_9fa48("4186") ? false : stryMutAct_9fa48("4185") ? true : (stryCov_9fa48("4185", "4186", "4187"), verifier && verifierTimestamp)) {
            if (stryMutAct_9fa48("4188")) {
              {}
            } else {
              stryCov_9fa48("4188");
              const verifierTimestampInt = parseInt(verifierTimestamp, 10);
              const stateTimeout = stryMutAct_9fa48("4191") ? this.config.stateTimeout && 10 * 60 * 1000 : stryMutAct_9fa48("4190") ? false : stryMutAct_9fa48("4189") ? true : (stryCov_9fa48("4189", "4190", "4191"), this.config.stateTimeout || (stryMutAct_9fa48("4192") ? 10 * 60 / 1000 : (stryCov_9fa48("4192"), (stryMutAct_9fa48("4193") ? 10 / 60 : (stryCov_9fa48("4193"), 10 * 60)) * 1000))); // Default 10 minuti
              if (stryMutAct_9fa48("4197") ? Date.now() - verifierTimestampInt <= stateTimeout : stryMutAct_9fa48("4196") ? Date.now() - verifierTimestampInt >= stateTimeout : stryMutAct_9fa48("4195") ? false : stryMutAct_9fa48("4194") ? true : (stryCov_9fa48("4194", "4195", "4196", "4197"), (stryMutAct_9fa48("4198") ? Date.now() + verifierTimestampInt : (stryCov_9fa48("4198"), Date.now() - verifierTimestampInt)) > stateTimeout)) {
                if (stryMutAct_9fa48("4199")) {
                  {}
                } else {
                  stryCov_9fa48("4199");
                  console.warn(stryMutAct_9fa48("4200") ? `` : (stryCov_9fa48("4200"), `Code verifier expired for PKCE flow for ${provider}`));
                  this.removeItem(stryMutAct_9fa48("4201") ? `` : (stryCov_9fa48("4201"), `oauth_verifier_${provider}`));
                  this.removeItem(stryMutAct_9fa48("4202") ? `` : (stryCov_9fa48("4202"), `oauth_verifier_timestamp_${provider}`));
                  throw new Error(stryMutAct_9fa48("4203") ? "" : (stryCov_9fa48("4203"), "Code verifier expired"));
                }
              }
              console.log(stryMutAct_9fa48("4204") ? `` : (stryCov_9fa48("4204"), `Found code verifier for PKCE flow: ${stryMutAct_9fa48("4205") ? verifier : (stryCov_9fa48("4205"), verifier.substring(0, 10))}... (length: ${verifier.length})`));
              tokenParams.code_verifier = verifier;
            }
          } else {
            if (stryMutAct_9fa48("4206")) {
              {}
            } else {
              stryCov_9fa48("4206");
              // Fallback: prova a generare un nuovo verifier (non ideale ma funziona per test)
              console.warn(stryMutAct_9fa48("4207") ? "" : (stryCov_9fa48("4207"), "PKCE enabled but no code verifier found. Attempting fallback..."));
              try {
                if (stryMutAct_9fa48("4208")) {
                  {}
                } else {
                  stryCov_9fa48("4208");
                  const {
                    codeVerifier
                  } = await this.generatePKCEChallenge();
                  tokenParams.code_verifier = codeVerifier;
                  console.log(stryMutAct_9fa48("4209") ? "" : (stryCov_9fa48("4209"), "Generated fallback code verifier"));
                }
              } catch (fallbackError) {
                if (stryMutAct_9fa48("4210")) {
                  {}
                } else {
                  stryCov_9fa48("4210");
                  throw new Error(stryMutAct_9fa48("4211") ? "" : (stryCov_9fa48("4211"), "PKCE enabled but no code verifier found and fallback failed"));
                }
              }
            }
          }
        }
      } else {
        if (stryMutAct_9fa48("4212")) {
          {}
        } else {
          stryCov_9fa48("4212");
          // PKCE non abilitato - non sicuro per browser
          if (stryMutAct_9fa48("4215") ? typeof window === "undefined" : stryMutAct_9fa48("4214") ? false : stryMutAct_9fa48("4213") ? true : (stryCov_9fa48("4213", "4214", "4215"), typeof window !== (stryMutAct_9fa48("4216") ? "" : (stryCov_9fa48("4216"), "undefined")))) {
            if (stryMutAct_9fa48("4217")) {
              {}
            } else {
              stryCov_9fa48("4217");
              throw new Error(stryMutAct_9fa48("4218") ? "" : (stryCov_9fa48("4218"), "PKCE is required for browser applications. Client secret cannot be used in browser."));
            }
          }

          // Solo per ambiente Node.js con client_secret
          if (stryMutAct_9fa48("4221") ? providerConfig.clientSecret || providerConfig.clientSecret.trim() !== "" : stryMutAct_9fa48("4220") ? false : stryMutAct_9fa48("4219") ? true : (stryCov_9fa48("4219", "4220", "4221"), providerConfig.clientSecret && (stryMutAct_9fa48("4223") ? providerConfig.clientSecret.trim() === "" : stryMutAct_9fa48("4222") ? true : (stryCov_9fa48("4222", "4223"), (stryMutAct_9fa48("4224") ? providerConfig.clientSecret : (stryCov_9fa48("4224"), providerConfig.clientSecret.trim())) !== (stryMutAct_9fa48("4225") ? "Stryker was here!" : (stryCov_9fa48("4225"), "")))))) {
            if (stryMutAct_9fa48("4226")) {
              {}
            } else {
              stryCov_9fa48("4226");
              tokenParams.client_secret = providerConfig.clientSecret;
              console.log(stryMutAct_9fa48("4227") ? "" : (stryCov_9fa48("4227"), "Using client_secret for server-side OAuth flow"));
            }
          } else {
            if (stryMutAct_9fa48("4228")) {
              {}
            } else {
              stryCov_9fa48("4228");
              throw new Error(stryMutAct_9fa48("4229") ? "" : (stryCov_9fa48("4229"), "Client secret is required when PKCE is not enabled for server-side flows."));
            }
          }
        }
      }

      // Google OAuth richiede client_secret anche con PKCE
      // Questo è un comportamento specifico di Google, non una vulnerabilità
      if (stryMutAct_9fa48("4232") ? provider === "google" && providerConfig.clientSecret || providerConfig.clientSecret.trim() !== "" : stryMutAct_9fa48("4231") ? false : stryMutAct_9fa48("4230") ? true : (stryCov_9fa48("4230", "4231", "4232"), (stryMutAct_9fa48("4234") ? provider === "google" || providerConfig.clientSecret : stryMutAct_9fa48("4233") ? true : (stryCov_9fa48("4233", "4234"), (stryMutAct_9fa48("4236") ? provider !== "google" : stryMutAct_9fa48("4235") ? true : (stryCov_9fa48("4235", "4236"), provider === (stryMutAct_9fa48("4237") ? "" : (stryCov_9fa48("4237"), "google")))) && providerConfig.clientSecret)) && (stryMutAct_9fa48("4239") ? providerConfig.clientSecret.trim() === "" : stryMutAct_9fa48("4238") ? true : (stryCov_9fa48("4238", "4239"), (stryMutAct_9fa48("4240") ? providerConfig.clientSecret : (stryCov_9fa48("4240"), providerConfig.clientSecret.trim())) !== (stryMutAct_9fa48("4241") ? "Stryker was here!" : (stryCov_9fa48("4241"), "")))))) {
        if (stryMutAct_9fa48("4242")) {
          {}
        } else {
          stryCov_9fa48("4242");
          tokenParams.client_secret = providerConfig.clientSecret;
          console.log(stryMutAct_9fa48("4243") ? "" : (stryCov_9fa48("4243"), "Adding client_secret for Google OAuth (required even with PKCE)"));
        }
      }

      // Clean up verifier
      this.removeItem(stryMutAct_9fa48("4244") ? `` : (stryCov_9fa48("4244"), `oauth_verifier_${provider}`));
      this.removeItem(stryMutAct_9fa48("4245") ? `` : (stryCov_9fa48("4245"), `oauth_verifier_timestamp_${provider}`));
      const urlParams = new URLSearchParams(tokenParams);
      console.log(stryMutAct_9fa48("4246") ? "" : (stryCov_9fa48("4246"), "Request body keys:"), Array.from(urlParams.keys()));
      const response = await fetch(providerConfig.tokenUrl, stryMutAct_9fa48("4247") ? {} : (stryCov_9fa48("4247"), {
        method: stryMutAct_9fa48("4248") ? "" : (stryCov_9fa48("4248"), "POST"),
        headers: stryMutAct_9fa48("4249") ? {} : (stryCov_9fa48("4249"), {
          "Content-Type": stryMutAct_9fa48("4250") ? "" : (stryCov_9fa48("4250"), "application/x-www-form-urlencoded")
        }),
        body: urlParams.toString()
      }));
      if (stryMutAct_9fa48("4253") ? false : stryMutAct_9fa48("4252") ? true : stryMutAct_9fa48("4251") ? response.ok : (stryCov_9fa48("4251", "4252", "4253"), !response.ok)) {
        if (stryMutAct_9fa48("4254")) {
          {}
        } else {
          stryCov_9fa48("4254");
          const errorData = await response.json().catch(stryMutAct_9fa48("4255") ? () => undefined : (stryCov_9fa48("4255"), () => ({})));
          throw new Error(stryMutAct_9fa48("4256") ? `` : (stryCov_9fa48("4256"), `Token exchange failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`));
        }
      }
      return await response.json();
    }
  }

  /**
   * Fetch user info from provider
   */
  private async fetchUserInfo(provider: OAuthProvider, providerConfig: OAuthProviderConfig, accessToken: string): Promise<OAuthUserInfo> {
    if (stryMutAct_9fa48("4257")) {
      {}
    } else {
      stryCov_9fa48("4257");
      const response = await fetch(providerConfig.userInfoUrl, stryMutAct_9fa48("4258") ? {} : (stryCov_9fa48("4258"), {
        headers: stryMutAct_9fa48("4259") ? {} : (stryCov_9fa48("4259"), {
          Authorization: stryMutAct_9fa48("4260") ? `` : (stryCov_9fa48("4260"), `Bearer ${accessToken}`)
        })
      }));
      if (stryMutAct_9fa48("4263") ? false : stryMutAct_9fa48("4262") ? true : stryMutAct_9fa48("4261") ? response.ok : (stryCov_9fa48("4261", "4262", "4263"), !response.ok)) {
        if (stryMutAct_9fa48("4264")) {
          {}
        } else {
          stryCov_9fa48("4264");
          throw new Error(stryMutAct_9fa48("4265") ? `` : (stryCov_9fa48("4265"), `Failed to fetch user info: ${response.status} ${response.statusText}`));
        }
      }
      const userData = await response.json();
      return this.normalizeUserInfo(userData, provider);
    }
  }

  /**
   * Normalize user info from different providers
   */
  private normalizeUserInfo(userData: any, provider: OAuthProvider): OAuthUserInfo {
    if (stryMutAct_9fa48("4266")) {
      {}
    } else {
      stryCov_9fa48("4266");
      switch (provider) {
        case stryMutAct_9fa48("4268") ? "" : (stryCov_9fa48("4268"), "google"):
          if (stryMutAct_9fa48("4267")) {} else {
            stryCov_9fa48("4267");
            return stryMutAct_9fa48("4269") ? {} : (stryCov_9fa48("4269"), {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              picture: userData.picture,
              provider
            });
          }
        case stryMutAct_9fa48("4271") ? "" : (stryCov_9fa48("4271"), "github"):
          if (stryMutAct_9fa48("4270")) {} else {
            stryCov_9fa48("4270");
            return stryMutAct_9fa48("4272") ? {} : (stryCov_9fa48("4272"), {
              id: userData.id.toString(),
              email: userData.email,
              name: stryMutAct_9fa48("4275") ? userData.name && userData.login : stryMutAct_9fa48("4274") ? false : stryMutAct_9fa48("4273") ? true : (stryCov_9fa48("4273", "4274", "4275"), userData.name || userData.login),
              picture: userData.avatar_url,
              provider
            });
          }
        case stryMutAct_9fa48("4277") ? "" : (stryCov_9fa48("4277"), "discord"):
          if (stryMutAct_9fa48("4276")) {} else {
            stryCov_9fa48("4276");
            return stryMutAct_9fa48("4278") ? {} : (stryCov_9fa48("4278"), {
              id: userData.id,
              email: userData.email,
              name: userData.username,
              picture: stryMutAct_9fa48("4279") ? `` : (stryCov_9fa48("4279"), `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`),
              provider
            });
          }
        case stryMutAct_9fa48("4281") ? "" : (stryCov_9fa48("4281"), "twitter"):
          if (stryMutAct_9fa48("4280")) {} else {
            stryCov_9fa48("4280");
            return stryMutAct_9fa48("4282") ? {} : (stryCov_9fa48("4282"), {
              id: userData.data.id,
              email: userData.data.email,
              name: userData.data.name,
              picture: userData.data.profile_image_url,
              provider
            });
          }
        default:
          if (stryMutAct_9fa48("4283")) {} else {
            stryCov_9fa48("4283");
            return stryMutAct_9fa48("4284") ? {} : (stryCov_9fa48("4284"), {
              id: stryMutAct_9fa48("4287") ? userData.id?.toString() && "" : stryMutAct_9fa48("4286") ? false : stryMutAct_9fa48("4285") ? true : (stryCov_9fa48("4285", "4286", "4287"), (stryMutAct_9fa48("4288") ? userData.id.toString() : (stryCov_9fa48("4288"), userData.id?.toString())) || (stryMutAct_9fa48("4289") ? "Stryker was here!" : (stryCov_9fa48("4289"), ""))),
              email: stryMutAct_9fa48("4292") ? userData.email && "" : stryMutAct_9fa48("4291") ? false : stryMutAct_9fa48("4290") ? true : (stryCov_9fa48("4290", "4291", "4292"), userData.email || (stryMutAct_9fa48("4293") ? "Stryker was here!" : (stryCov_9fa48("4293"), ""))),
              name: stryMutAct_9fa48("4296") ? userData.name && "" : stryMutAct_9fa48("4295") ? false : stryMutAct_9fa48("4294") ? true : (stryCov_9fa48("4294", "4295", "4296"), userData.name || (stryMutAct_9fa48("4297") ? "Stryker was here!" : (stryCov_9fa48("4297"), ""))),
              picture: stryMutAct_9fa48("4300") ? (userData.picture || userData.avatar_url) && "" : stryMutAct_9fa48("4299") ? false : stryMutAct_9fa48("4298") ? true : (stryCov_9fa48("4298", "4299", "4300"), (stryMutAct_9fa48("4302") ? userData.picture && userData.avatar_url : stryMutAct_9fa48("4301") ? false : (stryCov_9fa48("4301", "4302"), userData.picture || userData.avatar_url)) || (stryMutAct_9fa48("4303") ? "Stryker was here!" : (stryCov_9fa48("4303"), ""))),
              provider
            });
          }
      }
    }
  }

  /**
   * Cache user info
   */
  private cacheUserInfo(userId: string, provider: OAuthProvider, userInfo: OAuthUserInfo): void {
    if (stryMutAct_9fa48("4304")) {
      {}
    } else {
      stryCov_9fa48("4304");
      const cacheKey = stryMutAct_9fa48("4305") ? `` : (stryCov_9fa48("4305"), `${provider}_${userId}`);
      const cacheEntry: OAuthCache = stryMutAct_9fa48("4306") ? {} : (stryCov_9fa48("4306"), {
        data: userInfo,
        provider,
        userId,
        timestamp: Date.now()
      });
      this.userCache.set(cacheKey, cacheEntry);

      // Salva solo dati minimi in localStorage (solo se disponibile)
      try {
        if (stryMutAct_9fa48("4307")) {
          {}
        } else {
          stryCov_9fa48("4307");
          if (stryMutAct_9fa48("4310") ? typeof window !== "undefined" || typeof localStorage !== "undefined" : stryMutAct_9fa48("4309") ? false : stryMutAct_9fa48("4308") ? true : (stryCov_9fa48("4308", "4309", "4310"), (stryMutAct_9fa48("4312") ? typeof window === "undefined" : stryMutAct_9fa48("4311") ? true : (stryCov_9fa48("4311", "4312"), typeof window !== (stryMutAct_9fa48("4313") ? "" : (stryCov_9fa48("4313"), "undefined")))) && (stryMutAct_9fa48("4315") ? typeof localStorage === "undefined" : stryMutAct_9fa48("4314") ? true : (stryCov_9fa48("4314", "4315"), typeof localStorage !== (stryMutAct_9fa48("4316") ? "" : (stryCov_9fa48("4316"), "undefined")))))) {
            if (stryMutAct_9fa48("4317")) {
              {}
            } else {
              stryCov_9fa48("4317");
              const minimalCacheEntry = stryMutAct_9fa48("4318") ? {} : (stryCov_9fa48("4318"), {
                userId: userInfo.id,
                provider,
                timestamp: Date.now()
              });
              localStorage.setItem(stryMutAct_9fa48("4319") ? `` : (stryCov_9fa48("4319"), `shogun_oauth_user_${cacheKey}`), JSON.stringify(minimalCacheEntry));
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("4320")) {
          {}
        } else {
          stryCov_9fa48("4320");
          console.warn(stryMutAct_9fa48("4321") ? "" : (stryCov_9fa48("4321"), "Failed to persist user info in localStorage:"), error);
        }
      }
    }
  }

  /**
   * Get cached user info
   */
  getCachedUserInfo(userId: string, provider: OAuthProvider): OAuthUserInfo | null {
    if (stryMutAct_9fa48("4322")) {
      {}
    } else {
      stryCov_9fa48("4322");
      const cacheKey = stryMutAct_9fa48("4323") ? `` : (stryCov_9fa48("4323"), `${provider}_${userId}`);

      // First check memory cache
      const cached = this.userCache.get(cacheKey);
      if (stryMutAct_9fa48("4325") ? false : stryMutAct_9fa48("4324") ? true : (stryCov_9fa48("4324", "4325"), cached)) {
        if (stryMutAct_9fa48("4326")) {
          {}
        } else {
          stryCov_9fa48("4326");
          // Check if cache is still valid
          if (stryMutAct_9fa48("4329") ? this.config.cacheDuration || Date.now() - cached.timestamp <= this.config.cacheDuration : stryMutAct_9fa48("4328") ? false : stryMutAct_9fa48("4327") ? true : (stryCov_9fa48("4327", "4328", "4329"), this.config.cacheDuration && (stryMutAct_9fa48("4332") ? Date.now() - cached.timestamp > this.config.cacheDuration : stryMutAct_9fa48("4331") ? Date.now() - cached.timestamp < this.config.cacheDuration : stryMutAct_9fa48("4330") ? true : (stryCov_9fa48("4330", "4331", "4332"), (stryMutAct_9fa48("4333") ? Date.now() + cached.timestamp : (stryCov_9fa48("4333"), Date.now() - cached.timestamp)) <= this.config.cacheDuration)))) {
            if (stryMutAct_9fa48("4334")) {
              {}
            } else {
              stryCov_9fa48("4334");
              return stryMutAct_9fa48("4337") ? cached.data && null : stryMutAct_9fa48("4336") ? false : stryMutAct_9fa48("4335") ? true : (stryCov_9fa48("4335", "4336", "4337"), cached.data || null);
            }
          }
        }
      }

      // Then check localStorage (solo se disponibile)
      try {
        if (stryMutAct_9fa48("4338")) {
          {}
        } else {
          stryCov_9fa48("4338");
          if (stryMutAct_9fa48("4341") ? typeof window !== "undefined" || typeof localStorage !== "undefined" : stryMutAct_9fa48("4340") ? false : stryMutAct_9fa48("4339") ? true : (stryCov_9fa48("4339", "4340", "4341"), (stryMutAct_9fa48("4343") ? typeof window === "undefined" : stryMutAct_9fa48("4342") ? true : (stryCov_9fa48("4342", "4343"), typeof window !== (stryMutAct_9fa48("4344") ? "" : (stryCov_9fa48("4344"), "undefined")))) && (stryMutAct_9fa48("4346") ? typeof localStorage === "undefined" : stryMutAct_9fa48("4345") ? true : (stryCov_9fa48("4345", "4346"), typeof localStorage !== (stryMutAct_9fa48("4347") ? "" : (stryCov_9fa48("4347"), "undefined")))))) {
            if (stryMutAct_9fa48("4348")) {
              {}
            } else {
              stryCov_9fa48("4348");
              const localCached = localStorage.getItem(stryMutAct_9fa48("4349") ? `` : (stryCov_9fa48("4349"), `shogun_oauth_user_${cacheKey}`));
              if (stryMutAct_9fa48("4351") ? false : stryMutAct_9fa48("4350") ? true : (stryCov_9fa48("4350", "4351"), localCached)) {
                if (stryMutAct_9fa48("4352")) {
                  {}
                } else {
                  stryCov_9fa48("4352");
                  const parsedCache = JSON.parse(localCached);
                  if (stryMutAct_9fa48("4355") ? this.config.cacheDuration || Date.now() - parsedCache.timestamp <= this.config.cacheDuration : stryMutAct_9fa48("4354") ? false : stryMutAct_9fa48("4353") ? true : (stryCov_9fa48("4353", "4354", "4355"), this.config.cacheDuration && (stryMutAct_9fa48("4358") ? Date.now() - parsedCache.timestamp > this.config.cacheDuration : stryMutAct_9fa48("4357") ? Date.now() - parsedCache.timestamp < this.config.cacheDuration : stryMutAct_9fa48("4356") ? true : (stryCov_9fa48("4356", "4357", "4358"), (stryMutAct_9fa48("4359") ? Date.now() + parsedCache.timestamp : (stryCov_9fa48("4359"), Date.now() - parsedCache.timestamp)) <= this.config.cacheDuration)))) {
                    if (stryMutAct_9fa48("4360")) {
                      {}
                    } else {
                      stryCov_9fa48("4360");
                      // Update memory cache
                      this.userCache.set(cacheKey, parsedCache);
                      return parsedCache.userInfo;
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("4361")) {
          {}
        } else {
          stryCov_9fa48("4361");
          console.warn(stryMutAct_9fa48("4362") ? "" : (stryCov_9fa48("4362"), "Failed to read user info from localStorage:"), error);
        }
      }
      return null;
    }
  }

  /**
   * Clear user cache
   */
  clearUserCache(userId?: string, provider?: OAuthProvider): void {
    if (stryMutAct_9fa48("4363")) {
      {}
    } else {
      stryCov_9fa48("4363");
      if (stryMutAct_9fa48("4366") ? userId || provider : stryMutAct_9fa48("4365") ? false : stryMutAct_9fa48("4364") ? true : (stryCov_9fa48("4364", "4365", "4366"), userId && provider)) {
        if (stryMutAct_9fa48("4367")) {
          {}
        } else {
          stryCov_9fa48("4367");
          const cacheKey = stryMutAct_9fa48("4368") ? `` : (stryCov_9fa48("4368"), `${provider}_${userId}`);
          this.userCache.delete(cacheKey);
          try {
            if (stryMutAct_9fa48("4369")) {
              {}
            } else {
              stryCov_9fa48("4369");
              if (stryMutAct_9fa48("4372") ? typeof window !== "undefined" || typeof localStorage !== "undefined" : stryMutAct_9fa48("4371") ? false : stryMutAct_9fa48("4370") ? true : (stryCov_9fa48("4370", "4371", "4372"), (stryMutAct_9fa48("4374") ? typeof window === "undefined" : stryMutAct_9fa48("4373") ? true : (stryCov_9fa48("4373", "4374"), typeof window !== (stryMutAct_9fa48("4375") ? "" : (stryCov_9fa48("4375"), "undefined")))) && (stryMutAct_9fa48("4377") ? typeof localStorage === "undefined" : stryMutAct_9fa48("4376") ? true : (stryCov_9fa48("4376", "4377"), typeof localStorage !== (stryMutAct_9fa48("4378") ? "" : (stryCov_9fa48("4378"), "undefined")))))) {
                if (stryMutAct_9fa48("4379")) {
                  {}
                } else {
                  stryCov_9fa48("4379");
                  localStorage.removeItem(stryMutAct_9fa48("4380") ? `` : (stryCov_9fa48("4380"), `shogun_oauth_user_${cacheKey}`));
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("4381")) {
              {}
            } else {
              stryCov_9fa48("4381");
              console.warn(stryMutAct_9fa48("4382") ? "" : (stryCov_9fa48("4382"), "Failed to remove user info from localStorage:"), error);
            }
          }
        }
      } else {
        if (stryMutAct_9fa48("4383")) {
          {}
        } else {
          stryCov_9fa48("4383");
          // Clear all cache
          this.userCache.clear();
          try {
            if (stryMutAct_9fa48("4384")) {
              {}
            } else {
              stryCov_9fa48("4384");
              if (stryMutAct_9fa48("4387") ? typeof window !== "undefined" || typeof localStorage !== "undefined" : stryMutAct_9fa48("4386") ? false : stryMutAct_9fa48("4385") ? true : (stryCov_9fa48("4385", "4386", "4387"), (stryMutAct_9fa48("4389") ? typeof window === "undefined" : stryMutAct_9fa48("4388") ? true : (stryCov_9fa48("4388", "4389"), typeof window !== (stryMutAct_9fa48("4390") ? "" : (stryCov_9fa48("4390"), "undefined")))) && (stryMutAct_9fa48("4392") ? typeof localStorage === "undefined" : stryMutAct_9fa48("4391") ? true : (stryCov_9fa48("4391", "4392"), typeof localStorage !== (stryMutAct_9fa48("4393") ? "" : (stryCov_9fa48("4393"), "undefined")))))) {
                if (stryMutAct_9fa48("4394")) {
                  {}
                } else {
                  stryCov_9fa48("4394");
                  const keysToRemove = stryMutAct_9fa48("4395") ? ["Stryker was here"] : (stryCov_9fa48("4395"), []);
                  for (let i = 0; stryMutAct_9fa48("4398") ? i >= localStorage.length : stryMutAct_9fa48("4397") ? i <= localStorage.length : stryMutAct_9fa48("4396") ? false : (stryCov_9fa48("4396", "4397", "4398"), i < localStorage.length); stryMutAct_9fa48("4399") ? i-- : (stryCov_9fa48("4399"), i++)) {
                    if (stryMutAct_9fa48("4400")) {
                      {}
                    } else {
                      stryCov_9fa48("4400");
                      const key = localStorage.key(i);
                      if (stryMutAct_9fa48("4403") ? key || key.startsWith("shogun_oauth_user_") : stryMutAct_9fa48("4402") ? false : stryMutAct_9fa48("4401") ? true : (stryCov_9fa48("4401", "4402", "4403"), key && (stryMutAct_9fa48("4404") ? key.endsWith("shogun_oauth_user_") : (stryCov_9fa48("4404"), key.startsWith(stryMutAct_9fa48("4405") ? "" : (stryCov_9fa48("4405"), "shogun_oauth_user_")))))) {
                        if (stryMutAct_9fa48("4406")) {
                          {}
                        } else {
                          stryCov_9fa48("4406");
                          keysToRemove.push(key);
                        }
                      }
                    }
                  }
                  keysToRemove.forEach(stryMutAct_9fa48("4407") ? () => undefined : (stryCov_9fa48("4407"), key => localStorage.removeItem(key)));
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("4408")) {
              {}
            } else {
              stryCov_9fa48("4408");
              console.warn(stryMutAct_9fa48("4409") ? "" : (stryCov_9fa48("4409"), "Failed to clear user info from localStorage:"), error);
            }
          }
        }
      }
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (stryMutAct_9fa48("4410")) {
      {}
    } else {
      stryCov_9fa48("4410");
      this.removeAllListeners();
      this.userCache.clear();
      this.cleanupExpiredOAuthData();
    }
  }

  /**
   * Clean up expired OAuth data from storage
   */
  private cleanupExpiredOAuthData(): void {
    if (stryMutAct_9fa48("4411")) {
      {}
    } else {
      stryCov_9fa48("4411");
      const stateTimeout = stryMutAct_9fa48("4414") ? this.config.stateTimeout && 10 * 60 * 1000 : stryMutAct_9fa48("4413") ? false : stryMutAct_9fa48("4412") ? true : (stryCov_9fa48("4412", "4413", "4414"), this.config.stateTimeout || (stryMutAct_9fa48("4415") ? 10 * 60 / 1000 : (stryCov_9fa48("4415"), (stryMutAct_9fa48("4416") ? 10 / 60 : (stryCov_9fa48("4416"), 10 * 60)) * 1000)));
      const currentTime = Date.now();

      // Clean sessionStorage
      if (stryMutAct_9fa48("4419") ? typeof sessionStorage === "undefined" : stryMutAct_9fa48("4418") ? false : stryMutAct_9fa48("4417") ? true : (stryCov_9fa48("4417", "4418", "4419"), typeof sessionStorage !== (stryMutAct_9fa48("4420") ? "" : (stryCov_9fa48("4420"), "undefined")))) {
        if (stryMutAct_9fa48("4421")) {
          {}
        } else {
          stryCov_9fa48("4421");
          const keysToRemove: string[] = stryMutAct_9fa48("4422") ? ["Stryker was here"] : (stryCov_9fa48("4422"), []);
          for (let i = 0; stryMutAct_9fa48("4425") ? i >= sessionStorage.length : stryMutAct_9fa48("4424") ? i <= sessionStorage.length : stryMutAct_9fa48("4423") ? false : (stryCov_9fa48("4423", "4424", "4425"), i < sessionStorage.length); stryMutAct_9fa48("4426") ? i-- : (stryCov_9fa48("4426"), i++)) {
            if (stryMutAct_9fa48("4427")) {
              {}
            } else {
              stryCov_9fa48("4427");
              const key = sessionStorage.key(i);
              if (stryMutAct_9fa48("4430") ? key || key.startsWith("oauth_state_timestamp_") : stryMutAct_9fa48("4429") ? false : stryMutAct_9fa48("4428") ? true : (stryCov_9fa48("4428", "4429", "4430"), key && (stryMutAct_9fa48("4431") ? key.endsWith("oauth_state_timestamp_") : (stryCov_9fa48("4431"), key.startsWith(stryMutAct_9fa48("4432") ? "" : (stryCov_9fa48("4432"), "oauth_state_timestamp_")))))) {
                if (stryMutAct_9fa48("4433")) {
                  {}
                } else {
                  stryCov_9fa48("4433");
                  const timestamp = sessionStorage.getItem(key);
                  if (stryMutAct_9fa48("4435") ? false : stryMutAct_9fa48("4434") ? true : (stryCov_9fa48("4434", "4435"), timestamp)) {
                    if (stryMutAct_9fa48("4436")) {
                      {}
                    } else {
                      stryCov_9fa48("4436");
                      const stateTime = parseInt(timestamp, 10);
                      if (stryMutAct_9fa48("4440") ? currentTime - stateTime <= stateTimeout : stryMutAct_9fa48("4439") ? currentTime - stateTime >= stateTimeout : stryMutAct_9fa48("4438") ? false : stryMutAct_9fa48("4437") ? true : (stryCov_9fa48("4437", "4438", "4439", "4440"), (stryMutAct_9fa48("4441") ? currentTime + stateTime : (stryCov_9fa48("4441"), currentTime - stateTime)) > stateTimeout)) {
                        if (stryMutAct_9fa48("4442")) {
                          {}
                        } else {
                          stryCov_9fa48("4442");
                          const stateKey = key.replace(stryMutAct_9fa48("4443") ? "" : (stryCov_9fa48("4443"), "_timestamp"), stryMutAct_9fa48("4444") ? "Stryker was here!" : (stryCov_9fa48("4444"), ""));
                          keysToRemove.push(key, stateKey);
                        }
                      }
                    }
                  }
                }
              }
              if (stryMutAct_9fa48("4447") ? key || key.startsWith("oauth_verifier_timestamp_") : stryMutAct_9fa48("4446") ? false : stryMutAct_9fa48("4445") ? true : (stryCov_9fa48("4445", "4446", "4447"), key && (stryMutAct_9fa48("4448") ? key.endsWith("oauth_verifier_timestamp_") : (stryCov_9fa48("4448"), key.startsWith(stryMutAct_9fa48("4449") ? "" : (stryCov_9fa48("4449"), "oauth_verifier_timestamp_")))))) {
                if (stryMutAct_9fa48("4450")) {
                  {}
                } else {
                  stryCov_9fa48("4450");
                  const timestamp = sessionStorage.getItem(key);
                  if (stryMutAct_9fa48("4452") ? false : stryMutAct_9fa48("4451") ? true : (stryCov_9fa48("4451", "4452"), timestamp)) {
                    if (stryMutAct_9fa48("4453")) {
                      {}
                    } else {
                      stryCov_9fa48("4453");
                      const verifierTime = parseInt(timestamp, 10);
                      if (stryMutAct_9fa48("4457") ? currentTime - verifierTime <= stateTimeout : stryMutAct_9fa48("4456") ? currentTime - verifierTime >= stateTimeout : stryMutAct_9fa48("4455") ? false : stryMutAct_9fa48("4454") ? true : (stryCov_9fa48("4454", "4455", "4456", "4457"), (stryMutAct_9fa48("4458") ? currentTime + verifierTime : (stryCov_9fa48("4458"), currentTime - verifierTime)) > stateTimeout)) {
                        if (stryMutAct_9fa48("4459")) {
                          {}
                        } else {
                          stryCov_9fa48("4459");
                          const verifierKey = key.replace(stryMutAct_9fa48("4460") ? "" : (stryCov_9fa48("4460"), "_timestamp"), stryMutAct_9fa48("4461") ? "Stryker was here!" : (stryCov_9fa48("4461"), ""));
                          keysToRemove.push(key, verifierKey);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          keysToRemove.forEach(stryMutAct_9fa48("4462") ? () => undefined : (stryCov_9fa48("4462"), key => sessionStorage.removeItem(key)));
          if (stryMutAct_9fa48("4466") ? keysToRemove.length <= 0 : stryMutAct_9fa48("4465") ? keysToRemove.length >= 0 : stryMutAct_9fa48("4464") ? false : stryMutAct_9fa48("4463") ? true : (stryCov_9fa48("4463", "4464", "4465", "4466"), keysToRemove.length > 0)) {
            if (stryMutAct_9fa48("4467")) {
              {}
            } else {
              stryCov_9fa48("4467");
              console.log(stryMutAct_9fa48("4468") ? `` : (stryCov_9fa48("4468"), `Cleaned up ${keysToRemove.length} expired OAuth entries`));
            }
          }
        }
      }

      // Clean memoryStorage (Node.js)
      const memoryKeysToRemove: string[] = stryMutAct_9fa48("4469") ? ["Stryker was here"] : (stryCov_9fa48("4469"), []);
      for (const [key, value] of this.memoryStorage.entries()) {
        if (stryMutAct_9fa48("4470")) {
          {}
        } else {
          stryCov_9fa48("4470");
          if (stryMutAct_9fa48("4473") ? key.startsWith("oauth_state_timestamp_") && key.startsWith("oauth_verifier_timestamp_") : stryMutAct_9fa48("4472") ? false : stryMutAct_9fa48("4471") ? true : (stryCov_9fa48("4471", "4472", "4473"), (stryMutAct_9fa48("4474") ? key.endsWith("oauth_state_timestamp_") : (stryCov_9fa48("4474"), key.startsWith(stryMutAct_9fa48("4475") ? "" : (stryCov_9fa48("4475"), "oauth_state_timestamp_")))) || (stryMutAct_9fa48("4476") ? key.endsWith("oauth_verifier_timestamp_") : (stryCov_9fa48("4476"), key.startsWith(stryMutAct_9fa48("4477") ? "" : (stryCov_9fa48("4477"), "oauth_verifier_timestamp_")))))) {
            if (stryMutAct_9fa48("4478")) {
              {}
            } else {
              stryCov_9fa48("4478");
              const timestamp = parseInt(value, 10);
              if (stryMutAct_9fa48("4482") ? currentTime - timestamp <= stateTimeout : stryMutAct_9fa48("4481") ? currentTime - timestamp >= stateTimeout : stryMutAct_9fa48("4480") ? false : stryMutAct_9fa48("4479") ? true : (stryCov_9fa48("4479", "4480", "4481", "4482"), (stryMutAct_9fa48("4483") ? currentTime + timestamp : (stryCov_9fa48("4483"), currentTime - timestamp)) > stateTimeout)) {
                if (stryMutAct_9fa48("4484")) {
                  {}
                } else {
                  stryCov_9fa48("4484");
                  const baseKey = key.replace(stryMutAct_9fa48("4485") ? "" : (stryCov_9fa48("4485"), "_timestamp"), stryMutAct_9fa48("4486") ? "Stryker was here!" : (stryCov_9fa48("4486"), ""));
                  memoryKeysToRemove.push(key, baseKey);
                }
              }
            }
          }
        }
      }
      memoryKeysToRemove.forEach(stryMutAct_9fa48("4487") ? () => undefined : (stryCov_9fa48("4487"), key => this.memoryStorage.delete(key)));
      if (stryMutAct_9fa48("4491") ? memoryKeysToRemove.length <= 0 : stryMutAct_9fa48("4490") ? memoryKeysToRemove.length >= 0 : stryMutAct_9fa48("4489") ? false : stryMutAct_9fa48("4488") ? true : (stryCov_9fa48("4488", "4489", "4490", "4491"), memoryKeysToRemove.length > 0)) {
        if (stryMutAct_9fa48("4492")) {
          {}
        } else {
          stryCov_9fa48("4492");
          console.log(stryMutAct_9fa48("4493") ? `` : (stryCov_9fa48("4493"), `Cleaned up ${memoryKeysToRemove.length} expired OAuth entries from memory`));
        }
      }
    }
  }
}