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
import { Webauthn } from "./webauthn";
import { p256 } from "@noble/curves/p256";
import { sha256 } from "@noble/hashes/sha256";
import derive from "../../gundb/derive";
import { ethers } from "ethers";

/**
 * Base64URL encoding utilities
 */
const base64url = stryMutAct_9fa48("5937") ? {} : (stryCov_9fa48("5937"), {
  encode: function (buffer: ArrayBuffer | Uint8Array): string {
    if (stryMutAct_9fa48("5938")) {
      {}
    } else {
      stryCov_9fa48("5938");
      const bytes = new Uint8Array(buffer);
      return btoa(String.fromCharCode(...bytes)).replace(/\+/g, stryMutAct_9fa48("5939") ? "" : (stryCov_9fa48("5939"), "-")).replace(/\//g, stryMutAct_9fa48("5940") ? "" : (stryCov_9fa48("5940"), "_")).replace(/=/g, stryMutAct_9fa48("5941") ? "Stryker was here!" : (stryCov_9fa48("5941"), ""));
    }
  },
  decode: function (str: string): Uint8Array {
    if (stryMutAct_9fa48("5942")) {
      {}
    } else {
      stryCov_9fa48("5942");
      str = str.replace(/-/g, stryMutAct_9fa48("5943") ? "" : (stryCov_9fa48("5943"), "+")).replace(/_/g, stryMutAct_9fa48("5944") ? "" : (stryCov_9fa48("5944"), "/"));
      while (stryMutAct_9fa48("5946") ? false : stryMutAct_9fa48("5945") ? str.length * 4 : (stryCov_9fa48("5945", "5946"), str.length % 4)) str += stryMutAct_9fa48("5947") ? "" : (stryCov_9fa48("5947"), "=");
      const binary = atob(str);
      return new Uint8Array(binary.split(stryMutAct_9fa48("5948") ? "Stryker was here!" : (stryCov_9fa48("5948"), "")).map(stryMutAct_9fa48("5949") ? () => undefined : (stryCov_9fa48("5949"), c => c.charCodeAt(0))));
    }
  }
});

/**
 * WebAuthn Credential for oneshot signing
 */
export interface WebAuthnSigningCredential {
  id: string;
  rawId: ArrayBuffer;
  publicKey: {
    x: string; // base64url encoded
    y: string; // base64url encoded
  };
  pub: string; // x.y format for SEA compatibility
  hashedCredentialId: string; // For consistency with normal approach
  gunUserPub?: string; // The Gun user public key if created
}

/**
 * WebAuthn Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but integrated with our architecture
 * CONSISTENT with normal WebAuthn approach
 */
export class WebAuthnSigner {
  private webauthn: Webauthn;
  private credentials: Map<string, WebAuthnSigningCredential> = new Map();
  constructor(webauthn?: Webauthn) {
    if (stryMutAct_9fa48("5950")) {
      {}
    } else {
      stryCov_9fa48("5950");
      this.webauthn = stryMutAct_9fa48("5953") ? webauthn && new Webauthn() : stryMutAct_9fa48("5952") ? false : stryMutAct_9fa48("5951") ? true : (stryCov_9fa48("5951", "5952", "5953"), webauthn || new Webauthn());
    }
  }

  /**
   * Creates a new WebAuthn credential for signing
   * Similar to webauthn.js create functionality but CONSISTENT with normal approach
   */
  async createSigningCredential(username: string): Promise<WebAuthnSigningCredential> {
    if (stryMutAct_9fa48("5954")) {
      {}
    } else {
      stryCov_9fa48("5954");
      try {
        if (stryMutAct_9fa48("5955")) {
          {}
        } else {
          stryCov_9fa48("5955");
          const credential = (await navigator.credentials.create({
            publicKey: {
              challenge: crypto.getRandomValues(new Uint8Array(32)),
              rp: {
                id: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
                name: "Shogun Wallet"
              },
              user: {
                id: new TextEncoder().encode(username),
                name: username,
                displayName: username
              },
              // Use the same algorithms as webauthn.js for SEA compatibility
              pubKeyCredParams: [{
                type: "public-key",
                alg: -7
              },
              // ECDSA, P-256 curve, for signing
              {
                type: "public-key",
                alg: -25
              },
              // ECDH, P-256 curve, for creating shared secrets
              {
                type: "public-key",
                alg: -257
              }],
              authenticatorSelection: {
                userVerification: "preferred"
              },
              timeout: 60000,
              attestation: "none"
            }
          })) as PublicKeyCredential;
          if (stryMutAct_9fa48("5958") ? false : stryMutAct_9fa48("5957") ? true : stryMutAct_9fa48("5956") ? credential : (stryCov_9fa48("5956", "5957", "5958"), !credential)) {
            if (stryMutAct_9fa48("5959")) {
              {}
            } else {
              stryCov_9fa48("5959");
              throw new Error(stryMutAct_9fa48("5960") ? "" : (stryCov_9fa48("5960"), "Failed to create WebAuthn credential"));
            }
          }

          // Extract public key in the same way as webauthn.js
          const response = credential.response as AuthenticatorAttestationResponse;
          const publicKey = response.getPublicKey();
          if (stryMutAct_9fa48("5963") ? false : stryMutAct_9fa48("5962") ? true : stryMutAct_9fa48("5961") ? publicKey : (stryCov_9fa48("5961", "5962", "5963"), !publicKey)) {
            if (stryMutAct_9fa48("5964")) {
              {}
            } else {
              stryCov_9fa48("5964");
              throw new Error(stryMutAct_9fa48("5965") ? "" : (stryCov_9fa48("5965"), "Failed to get public key from credential"));
            }
          }
          const rawKey = new Uint8Array(publicKey);

          // Extract coordinates like webauthn.js (slice positions may need adjustment)
          const xCoord = stryMutAct_9fa48("5966") ? rawKey : (stryCov_9fa48("5966"), rawKey.slice(27, 59));
          const yCoord = stryMutAct_9fa48("5967") ? rawKey : (stryCov_9fa48("5967"), rawKey.slice(59, 91));
          const x = base64url.encode(xCoord);
          const y = base64url.encode(yCoord);
          const pub = stryMutAct_9fa48("5968") ? `` : (stryCov_9fa48("5968"), `${x}.${y}`);

          // CONSISTENCY: Use the same hashing approach as normal WebAuthn
          const hashedCredentialId = ethers.keccak256(ethers.toUtf8Bytes(credential.id));
          const signingCredential: WebAuthnSigningCredential = stryMutAct_9fa48("5969") ? {} : (stryCov_9fa48("5969"), {
            id: credential.id,
            rawId: credential.rawId,
            publicKey: stryMutAct_9fa48("5970") ? {} : (stryCov_9fa48("5970"), {
              x,
              y
            }),
            pub,
            hashedCredentialId // This ensures consistency
          });

          // Store credential for later use
          this.credentials.set(credential.id, signingCredential);
          return signingCredential;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5971")) {
          {}
        } else {
          stryCov_9fa48("5971");
          console.error(stryMutAct_9fa48("5972") ? "" : (stryCov_9fa48("5972"), "Error creating signing credential:"), error);
          throw new Error(stryMutAct_9fa48("5973") ? `` : (stryCov_9fa48("5973"), `Failed to create signing credential: ${error.message}`));
        }
      }
    }
  }

  /**
   * Creates an authenticator function compatible with SEA.sign
   * This is the key function that makes it work like webauthn.js
   */
  createAuthenticator(credentialId: string): (data: any) => Promise<AuthenticatorAssertionResponse> {
    if (stryMutAct_9fa48("5974")) {
      {}
    } else {
      stryCov_9fa48("5974");
      const credential = this.credentials.get(credentialId);
      if (stryMutAct_9fa48("5977") ? false : stryMutAct_9fa48("5976") ? true : stryMutAct_9fa48("5975") ? credential : (stryCov_9fa48("5975", "5976", "5977"), !credential)) {
        if (stryMutAct_9fa48("5978")) {
          {}
        } else {
          stryCov_9fa48("5978");
          throw new Error(stryMutAct_9fa48("5979") ? `` : (stryCov_9fa48("5979"), `Credential ${credentialId} not found`));
        }
      }
      return async (data: any): Promise<AuthenticatorAssertionResponse> => {
        if (stryMutAct_9fa48("5980")) {
          {}
        } else {
          stryCov_9fa48("5980");
          try {
            if (stryMutAct_9fa48("5981")) {
              {}
            } else {
              stryCov_9fa48("5981");
              const challenge = new TextEncoder().encode(JSON.stringify(data));
              const options: PublicKeyCredentialRequestOptions = stryMutAct_9fa48("5982") ? {} : (stryCov_9fa48("5982"), {
                challenge,
                rpId: (stryMutAct_9fa48("5985") ? window.location.hostname !== "localhost" : stryMutAct_9fa48("5984") ? false : stryMutAct_9fa48("5983") ? true : (stryCov_9fa48("5983", "5984", "5985"), window.location.hostname === (stryMutAct_9fa48("5986") ? "" : (stryCov_9fa48("5986"), "localhost")))) ? stryMutAct_9fa48("5987") ? "" : (stryCov_9fa48("5987"), "localhost") : window.location.hostname,
                userVerification: stryMutAct_9fa48("5988") ? "" : (stryCov_9fa48("5988"), "preferred"),
                allowCredentials: stryMutAct_9fa48("5989") ? [] : (stryCov_9fa48("5989"), [stryMutAct_9fa48("5990") ? {} : (stryCov_9fa48("5990"), {
                  type: stryMutAct_9fa48("5991") ? "" : (stryCov_9fa48("5991"), "public-key"),
                  id: credential.rawId
                })]),
                timeout: 60000
              });
              const assertion = (await navigator.credentials.get({
                publicKey: options
              })) as PublicKeyCredential;
              if (stryMutAct_9fa48("5994") ? false : stryMutAct_9fa48("5993") ? true : stryMutAct_9fa48("5992") ? assertion : (stryCov_9fa48("5992", "5993", "5994"), !assertion)) {
                if (stryMutAct_9fa48("5995")) {
                  {}
                } else {
                  stryCov_9fa48("5995");
                  throw new Error(stryMutAct_9fa48("5996") ? "" : (stryCov_9fa48("5996"), "WebAuthn assertion failed"));
                }
              }
              return assertion.response as AuthenticatorAssertionResponse;
            }
          } catch (error: any) {
            if (stryMutAct_9fa48("5997")) {
              {}
            } else {
              stryCov_9fa48("5997");
              console.error(stryMutAct_9fa48("5998") ? "" : (stryCov_9fa48("5998"), "WebAuthn assertion error:"), error);
              throw error;
            }
          }
        }
      };
    }
  }

  /**
   * Creates a derived key pair from WebAuthn credential
   * CONSISTENT with normal approach: uses hashedCredentialId as password
   */
  async createDerivedKeyPair(credentialId: string, username: string, extra?: string[]): Promise<{
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  }> {
    if (stryMutAct_9fa48("5999")) {
      {}
    } else {
      stryCov_9fa48("5999");
      const credential = this.credentials.get(credentialId);
      if (stryMutAct_9fa48("6002") ? false : stryMutAct_9fa48("6001") ? true : stryMutAct_9fa48("6000") ? credential : (stryCov_9fa48("6000", "6001", "6002"), !credential)) {
        if (stryMutAct_9fa48("6003")) {
          {}
        } else {
          stryCov_9fa48("6003");
          throw new Error(stryMutAct_9fa48("6004") ? `` : (stryCov_9fa48("6004"), `Credential ${credentialId} not found`));
        }
      }
      try {
        if (stryMutAct_9fa48("6005")) {
          {}
        } else {
          stryCov_9fa48("6005");
          // CONSISTENCY: Use the same approach as normal WebAuthn
          // Use hashedCredentialId as password (same as normal approach)
          const derivedKeys = await derive(credential.hashedCredentialId,
          // This is the key change!
          extra, stryMutAct_9fa48("6006") ? {} : (stryCov_9fa48("6006"), {
            includeP256: stryMutAct_9fa48("6007") ? false : (stryCov_9fa48("6007"), true)
          }));
          return stryMutAct_9fa48("6008") ? {} : (stryCov_9fa48("6008"), {
            pub: derivedKeys.pub,
            priv: derivedKeys.priv,
            epub: derivedKeys.epub,
            epriv: derivedKeys.epriv
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("6009")) {
          {}
        } else {
          stryCov_9fa48("6009");
          console.error(stryMutAct_9fa48("6010") ? "" : (stryCov_9fa48("6010"), "Error deriving keys from WebAuthn credential:"), error);
          throw error;
        }
      }
    }
  }

  /**
   * Creates a Gun user from WebAuthn credential
   * This ensures the SAME user is created as with normal approach
   */
  async createGunUser(credentialId: string, username: string, gunInstance: any): Promise<{
    success: boolean;
    userPub?: string;
    error?: string;
  }> {
    if (stryMutAct_9fa48("6011")) {
      {}
    } else {
      stryCov_9fa48("6011");
      const credential = this.credentials.get(credentialId);
      if (stryMutAct_9fa48("6014") ? false : stryMutAct_9fa48("6013") ? true : stryMutAct_9fa48("6012") ? credential : (stryCov_9fa48("6012", "6013", "6014"), !credential)) {
        if (stryMutAct_9fa48("6015")) {
          {}
        } else {
          stryCov_9fa48("6015");
          throw new Error(stryMutAct_9fa48("6016") ? `` : (stryCov_9fa48("6016"), `Credential ${credentialId} not found`));
        }
      }
      try {
        if (stryMutAct_9fa48("6017")) {
          {}
        } else {
          stryCov_9fa48("6017");
          // Use the SAME approach as normal WebAuthn
          return new Promise(resolve => {
            if (stryMutAct_9fa48("6018")) {
              {}
            } else {
              stryCov_9fa48("6018");
              gunInstance.user().create(username, credential.hashedCredentialId, (ack: any) => {
                if (stryMutAct_9fa48("6019")) {
                  {}
                } else {
                  stryCov_9fa48("6019");
                  if (stryMutAct_9fa48("6021") ? false : stryMutAct_9fa48("6020") ? true : (stryCov_9fa48("6020", "6021"), ack.err)) {
                    if (stryMutAct_9fa48("6022")) {
                      {}
                    } else {
                      stryCov_9fa48("6022");
                      // Try to login if user already exists
                      gunInstance.user().auth(username, credential.hashedCredentialId, (authAck: any) => {
                        if (stryMutAct_9fa48("6023")) {
                          {}
                        } else {
                          stryCov_9fa48("6023");
                          if (stryMutAct_9fa48("6025") ? false : stryMutAct_9fa48("6024") ? true : (stryCov_9fa48("6024", "6025"), authAck.err)) {
                            if (stryMutAct_9fa48("6026")) {
                              {}
                            } else {
                              stryCov_9fa48("6026");
                              resolve(stryMutAct_9fa48("6027") ? {} : (stryCov_9fa48("6027"), {
                                success: stryMutAct_9fa48("6028") ? true : (stryCov_9fa48("6028"), false),
                                error: authAck.err
                              }));
                            }
                          } else {
                            if (stryMutAct_9fa48("6029")) {
                              {}
                            } else {
                              stryCov_9fa48("6029");
                              const userPub = authAck.pub;
                              // Update credential with Gun user pub
                              credential.gunUserPub = userPub;
                              this.credentials.set(credentialId, credential);
                              resolve(stryMutAct_9fa48("6030") ? {} : (stryCov_9fa48("6030"), {
                                success: stryMutAct_9fa48("6031") ? false : (stryCov_9fa48("6031"), true),
                                userPub
                              }));
                            }
                          }
                        }
                      });
                    }
                  } else {
                    if (stryMutAct_9fa48("6032")) {
                      {}
                    } else {
                      stryCov_9fa48("6032");
                      // User created, now login
                      gunInstance.user().auth(username, credential.hashedCredentialId, (authAck: any) => {
                        if (stryMutAct_9fa48("6033")) {
                          {}
                        } else {
                          stryCov_9fa48("6033");
                          if (stryMutAct_9fa48("6035") ? false : stryMutAct_9fa48("6034") ? true : (stryCov_9fa48("6034", "6035"), authAck.err)) {
                            if (stryMutAct_9fa48("6036")) {
                              {}
                            } else {
                              stryCov_9fa48("6036");
                              resolve(stryMutAct_9fa48("6037") ? {} : (stryCov_9fa48("6037"), {
                                success: stryMutAct_9fa48("6038") ? true : (stryCov_9fa48("6038"), false),
                                error: authAck.err
                              }));
                            }
                          } else {
                            if (stryMutAct_9fa48("6039")) {
                              {}
                            } else {
                              stryCov_9fa48("6039");
                              const userPub = authAck.pub;
                              // Update credential with Gun user pub
                              credential.gunUserPub = userPub;
                              this.credentials.set(credentialId, credential);
                              resolve(stryMutAct_9fa48("6040") ? {} : (stryCov_9fa48("6040"), {
                                success: stryMutAct_9fa48("6041") ? false : (stryCov_9fa48("6041"), true),
                                userPub
                              }));
                            }
                          }
                        }
                      });
                    }
                  }
                }
              });
            }
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("6042")) {
          {}
        } else {
          stryCov_9fa48("6042");
          console.error(stryMutAct_9fa48("6043") ? "" : (stryCov_9fa48("6043"), "Error creating Gun user:"), error);
          return stryMutAct_9fa48("6044") ? {} : (stryCov_9fa48("6044"), {
            success: stryMutAct_9fa48("6045") ? true : (stryCov_9fa48("6045"), false),
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Signs data using WebAuthn + derived keys
   * This provides a hybrid approach: WebAuthn for user verification + derived keys for actual signing
   * CONSISTENT with normal approach
   */
  async signWithDerivedKeys(data: any, credentialId: string, username: string, extra?: string[]): Promise<string> {
    if (stryMutAct_9fa48("6046")) {
      {}
    } else {
      stryCov_9fa48("6046");
      try {
        if (stryMutAct_9fa48("6047")) {
          {}
        } else {
          stryCov_9fa48("6047");
          // First, verify user with WebAuthn
          const authenticator = this.createAuthenticator(credentialId);
          await authenticator(data); // This verifies the user

          // Then use derived keys for actual signing (CONSISTENT approach)
          const keyPair = await this.createDerivedKeyPair(credentialId, username, extra);

          // Create signature using P-256 (same as SEA)
          const message = JSON.stringify(data);
          const messageHash = sha256(new TextEncoder().encode(message));

          // Convert base64url private key to bytes
          const privKeyBytes = base64url.decode(keyPair.priv);

          // Sign with P-256
          const signature = p256.sign(messageHash, privKeyBytes);

          // Format like SEA signature
          const seaSignature = stryMutAct_9fa48("6048") ? {} : (stryCov_9fa48("6048"), {
            m: message,
            s: base64url.encode(signature.toCompactRawBytes())
          });
          return (stryMutAct_9fa48("6049") ? "" : (stryCov_9fa48("6049"), "SEA")) + JSON.stringify(seaSignature);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("6050")) {
          {}
        } else {
          stryCov_9fa48("6050");
          console.error(stryMutAct_9fa48("6051") ? "" : (stryCov_9fa48("6051"), "Error signing with derived keys:"), error);
          throw error;
        }
      }
    }
  }

  /**
   * Get the Gun user public key for a credential
   * This allows checking if the same user would be created
   */
  getGunUserPub(credentialId: string): string | undefined {
    if (stryMutAct_9fa48("6052")) {
      {}
    } else {
      stryCov_9fa48("6052");
      const credential = this.credentials.get(credentialId);
      return stryMutAct_9fa48("6053") ? credential.gunUserPub : (stryCov_9fa48("6053"), credential?.gunUserPub);
    }
  }

  /**
   * Get the hashed credential ID (for consistency checking)
   */
  getHashedCredentialId(credentialId: string): string | undefined {
    if (stryMutAct_9fa48("6054")) {
      {}
    } else {
      stryCov_9fa48("6054");
      const credential = this.credentials.get(credentialId);
      return stryMutAct_9fa48("6055") ? credential.hashedCredentialId : (stryCov_9fa48("6055"), credential?.hashedCredentialId);
    }
  }

  /**
   * Check if this credential would create the same Gun user as normal approach
   */
  async verifyConsistency(credentialId: string, username: string, expectedUserPub?: string): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }> {
    if (stryMutAct_9fa48("6056")) {
      {}
    } else {
      stryCov_9fa48("6056");
      const credential = this.credentials.get(credentialId);
      if (stryMutAct_9fa48("6059") ? false : stryMutAct_9fa48("6058") ? true : stryMutAct_9fa48("6057") ? credential : (stryCov_9fa48("6057", "6058", "6059"), !credential)) {
        if (stryMutAct_9fa48("6060")) {
          {}
        } else {
          stryCov_9fa48("6060");
          return stryMutAct_9fa48("6061") ? {} : (stryCov_9fa48("6061"), {
            consistent: stryMutAct_9fa48("6062") ? true : (stryCov_9fa48("6062"), false)
          });
        }
      }

      // The derived keys should be the same as normal approach
      const derivedKeys = await this.createDerivedKeyPair(credentialId, username);
      return stryMutAct_9fa48("6063") ? {} : (stryCov_9fa48("6063"), {
        consistent: expectedUserPub ? stryMutAct_9fa48("6066") ? derivedKeys.pub !== expectedUserPub : stryMutAct_9fa48("6065") ? false : stryMutAct_9fa48("6064") ? true : (stryCov_9fa48("6064", "6065", "6066"), derivedKeys.pub === expectedUserPub) : stryMutAct_9fa48("6067") ? false : (stryCov_9fa48("6067"), true),
        actualUserPub: derivedKeys.pub,
        expectedUserPub
      });
    }
  }

  /**
   * Get credential by ID
   */
  getCredential(credentialId: string): WebAuthnSigningCredential | undefined {
    if (stryMutAct_9fa48("6068")) {
      {}
    } else {
      stryCov_9fa48("6068");
      return this.credentials.get(credentialId);
    }
  }

  /**
   * List all stored credentials
   */
  listCredentials(): WebAuthnSigningCredential[] {
    if (stryMutAct_9fa48("6069")) {
      {}
    } else {
      stryCov_9fa48("6069");
      return Array.from(this.credentials.values());
    }
  }

  /**
   * Remove a credential
   */
  removeCredential(credentialId: string): boolean {
    if (stryMutAct_9fa48("6070")) {
      {}
    } else {
      stryCov_9fa48("6070");
      return this.credentials.delete(credentialId);
    }
  }
}
export default WebAuthnSigner;