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
import { Web3Connector } from "./web3Connector";
import { ethers } from "ethers";
import derive from "../../gundb/derive";

/**
 * Web3 Signing Credential for oneshot signing
 */
export interface Web3SigningCredential {
  address: string;
  signature: string;
  message: string;
  username: string; // For consistency with normal approach
  password: string; // For consistency with normal approach
  gunUserPub?: string; // The Gun user public key if created
}

/**
 * Web3 Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but for Web3/MetaMask
 * CONSISTENT with normal Web3 approach
 */
export class Web3Signer {
  private web3Connector: Web3Connector;
  private credentials: Map<string, Web3SigningCredential> = new Map();
  private readonly MESSAGE_TO_SIGN = stryMutAct_9fa48("5313") ? "" : (stryCov_9fa48("5313"), "I Love Shogun!"); // Same as normal approach

  constructor(web3Connector?: Web3Connector) {
    if (stryMutAct_9fa48("5314")) {
      {}
    } else {
      stryCov_9fa48("5314");
      this.web3Connector = stryMutAct_9fa48("5317") ? web3Connector && new Web3Connector() : stryMutAct_9fa48("5316") ? false : stryMutAct_9fa48("5315") ? true : (stryCov_9fa48("5315", "5316", "5317"), web3Connector || new Web3Connector());
    }
  }

  /**
   * Creates a new Web3 signing credential
   * CONSISTENT with normal Web3 approach
   */
  async createSigningCredential(address: string): Promise<Web3SigningCredential> {
    if (stryMutAct_9fa48("5318")) {
      {}
    } else {
      stryCov_9fa48("5318");
      try {
        if (stryMutAct_9fa48("5319")) {
          {}
        } else {
          stryCov_9fa48("5319");
          // Validate address
          const validAddress = ethers.getAddress(stryMutAct_9fa48("5320") ? address.toUpperCase() : (stryCov_9fa48("5320"), address.toLowerCase()));

          // Request signature using the same approach as normal Web3
          const signature = await this.requestSignature(validAddress);

          // Generate credentials using the SAME logic as normal approach
          const username = stryMutAct_9fa48("5321") ? `` : (stryCov_9fa48("5321"), `${stryMutAct_9fa48("5322") ? validAddress.toUpperCase() : (stryCov_9fa48("5322"), validAddress.toLowerCase())}`);
          const password = ethers.keccak256(ethers.toUtf8Bytes(stryMutAct_9fa48("5323") ? `` : (stryCov_9fa48("5323"), `${signature}:${stryMutAct_9fa48("5324") ? validAddress.toUpperCase() : (stryCov_9fa48("5324"), validAddress.toLowerCase())}`)));
          const signingCredential: Web3SigningCredential = stryMutAct_9fa48("5325") ? {} : (stryCov_9fa48("5325"), {
            address: validAddress,
            signature,
            message: this.MESSAGE_TO_SIGN,
            username,
            password // This ensures consistency with normal approach
          });

          // Store credential for later use
          this.credentials.set(stryMutAct_9fa48("5326") ? validAddress.toUpperCase() : (stryCov_9fa48("5326"), validAddress.toLowerCase()), signingCredential);
          return signingCredential;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5327")) {
          {}
        } else {
          stryCov_9fa48("5327");
          console.error(stryMutAct_9fa48("5328") ? "" : (stryCov_9fa48("5328"), "Error creating Web3 signing credential:"), error);
          throw new Error(stryMutAct_9fa48("5329") ? `` : (stryCov_9fa48("5329"), `Failed to create Web3 signing credential: ${error.message}`));
        }
      }
    }
  }

  /**
   * Request signature from MetaMask
   * Uses the same approach as normal Web3Connector
   */
  private async requestSignature(address: string): Promise<string> {
    if (stryMutAct_9fa48("5330")) {
      {}
    } else {
      stryCov_9fa48("5330");
      try {
        if (stryMutAct_9fa48("5331")) {
          {}
        } else {
          stryCov_9fa48("5331");
          const signer = await this.web3Connector.getSigner();
          const signerAddress = await signer.getAddress();
          if (stryMutAct_9fa48("5334") ? signerAddress.toLowerCase() === address.toLowerCase() : stryMutAct_9fa48("5333") ? false : stryMutAct_9fa48("5332") ? true : (stryCov_9fa48("5332", "5333", "5334"), (stryMutAct_9fa48("5335") ? signerAddress.toUpperCase() : (stryCov_9fa48("5335"), signerAddress.toLowerCase())) !== (stryMutAct_9fa48("5336") ? address.toUpperCase() : (stryCov_9fa48("5336"), address.toLowerCase())))) {
            if (stryMutAct_9fa48("5337")) {
              {}
            } else {
              stryCov_9fa48("5337");
              throw new Error(stryMutAct_9fa48("5338") ? `` : (stryCov_9fa48("5338"), `Signer address (${signerAddress}) does not match expected address (${address})`));
            }
          }
          const signature = await signer.signMessage(this.MESSAGE_TO_SIGN);
          return signature;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5339")) {
          {}
        } else {
          stryCov_9fa48("5339");
          console.error(stryMutAct_9fa48("5340") ? "" : (stryCov_9fa48("5340"), "Failed to request signature:"), error);
          throw error;
        }
      }
    }
  }

  /**
   * Creates an authenticator function compatible with SEA.sign
   * This is the key function that makes it work like webauthn.js but for Web3
   */
  createAuthenticator(address: string): (data: any) => Promise<string> {
    if (stryMutAct_9fa48("5341")) {
      {}
    } else {
      stryCov_9fa48("5341");
      const credential = this.credentials.get(stryMutAct_9fa48("5342") ? address.toUpperCase() : (stryCov_9fa48("5342"), address.toLowerCase()));
      if (stryMutAct_9fa48("5345") ? false : stryMutAct_9fa48("5344") ? true : stryMutAct_9fa48("5343") ? credential : (stryCov_9fa48("5343", "5344", "5345"), !credential)) {
        if (stryMutAct_9fa48("5346")) {
          {}
        } else {
          stryCov_9fa48("5346");
          throw new Error(stryMutAct_9fa48("5347") ? `` : (stryCov_9fa48("5347"), `Credential for address ${address} not found`));
        }
      }
      return async (data: any): Promise<string> => {
        if (stryMutAct_9fa48("5348")) {
          {}
        } else {
          stryCov_9fa48("5348");
          try {
            if (stryMutAct_9fa48("5349")) {
              {}
            } else {
              stryCov_9fa48("5349");
              // Verify the user by requesting a new signature for the data
              const signer = await this.web3Connector.getSigner();
              const signerAddress = await signer.getAddress();
              if (stryMutAct_9fa48("5352") ? signerAddress.toLowerCase() === address.toLowerCase() : stryMutAct_9fa48("5351") ? false : stryMutAct_9fa48("5350") ? true : (stryCov_9fa48("5350", "5351", "5352"), (stryMutAct_9fa48("5353") ? signerAddress.toUpperCase() : (stryCov_9fa48("5353"), signerAddress.toLowerCase())) !== (stryMutAct_9fa48("5354") ? address.toUpperCase() : (stryCov_9fa48("5354"), address.toLowerCase())))) {
                if (stryMutAct_9fa48("5355")) {
                  {}
                } else {
                  stryCov_9fa48("5355");
                  throw new Error(stryMutAct_9fa48("5356") ? "" : (stryCov_9fa48("5356"), "Address mismatch during authentication"));
                }
              }

              // Sign the data
              const dataToSign = JSON.stringify(data);
              const signature = await signer.signMessage(dataToSign);
              return signature;
            }
          } catch (error: any) {
            if (stryMutAct_9fa48("5357")) {
              {}
            } else {
              stryCov_9fa48("5357");
              console.error(stryMutAct_9fa48("5358") ? "" : (stryCov_9fa48("5358"), "Web3 authentication error:"), error);
              throw error;
            }
          }
        }
      };
    }
  }

  /**
   * Creates a derived key pair from Web3 credential
   * CONSISTENT with normal approach: uses password as seed
   */
  async createDerivedKeyPair(address: string, extra?: string[]): Promise<{
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  }> {
    if (stryMutAct_9fa48("5359")) {
      {}
    } else {
      stryCov_9fa48("5359");
      const credential = this.credentials.get(stryMutAct_9fa48("5360") ? address.toUpperCase() : (stryCov_9fa48("5360"), address.toLowerCase()));
      if (stryMutAct_9fa48("5363") ? false : stryMutAct_9fa48("5362") ? true : stryMutAct_9fa48("5361") ? credential : (stryCov_9fa48("5361", "5362", "5363"), !credential)) {
        if (stryMutAct_9fa48("5364")) {
          {}
        } else {
          stryCov_9fa48("5364");
          throw new Error(stryMutAct_9fa48("5365") ? `` : (stryCov_9fa48("5365"), `Credential for address ${address} not found`));
        }
      }
      try {
        if (stryMutAct_9fa48("5366")) {
          {}
        } else {
          stryCov_9fa48("5366");
          // CONSISTENCY: Use the same approach as normal Web3
          // Use password as seed (same as normal approach)
          const derivedKeys = await derive(credential.password,
          // This is the key consistency point!
          extra, stryMutAct_9fa48("5367") ? {} : (stryCov_9fa48("5367"), {
            includeP256: stryMutAct_9fa48("5368") ? false : (stryCov_9fa48("5368"), true)
          }));
          return stryMutAct_9fa48("5369") ? {} : (stryCov_9fa48("5369"), {
            pub: derivedKeys.pub,
            priv: derivedKeys.priv,
            epub: derivedKeys.epub,
            epriv: derivedKeys.epriv
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5370")) {
          {}
        } else {
          stryCov_9fa48("5370");
          console.error(stryMutAct_9fa48("5371") ? "" : (stryCov_9fa48("5371"), "Error deriving keys from Web3 credential:"), error);
          throw error;
        }
      }
    }
  }

  /**
   * Creates a Gun user from Web3 credential
   * This ensures the SAME user is created as with normal approach
   */
  async createGunUser(address: string, gunInstance: any): Promise<{
    success: boolean;
    userPub?: string;
    error?: string;
  }> {
    if (stryMutAct_9fa48("5372")) {
      {}
    } else {
      stryCov_9fa48("5372");
      const credential = this.credentials.get(stryMutAct_9fa48("5373") ? address.toUpperCase() : (stryCov_9fa48("5373"), address.toLowerCase()));
      if (stryMutAct_9fa48("5376") ? false : stryMutAct_9fa48("5375") ? true : stryMutAct_9fa48("5374") ? credential : (stryCov_9fa48("5374", "5375", "5376"), !credential)) {
        if (stryMutAct_9fa48("5377")) {
          {}
        } else {
          stryCov_9fa48("5377");
          throw new Error(stryMutAct_9fa48("5378") ? `` : (stryCov_9fa48("5378"), `Credential for address ${address} not found`));
        }
      }
      try {
        if (stryMutAct_9fa48("5379")) {
          {}
        } else {
          stryCov_9fa48("5379");
          // Use the SAME approach as normal Web3
          return new Promise(resolve => {
            if (stryMutAct_9fa48("5380")) {
              {}
            } else {
              stryCov_9fa48("5380");
              gunInstance.user().create(credential.username, credential.password, (ack: any) => {
                if (stryMutAct_9fa48("5381")) {
                  {}
                } else {
                  stryCov_9fa48("5381");
                  if (stryMutAct_9fa48("5383") ? false : stryMutAct_9fa48("5382") ? true : (stryCov_9fa48("5382", "5383"), ack.err)) {
                    if (stryMutAct_9fa48("5384")) {
                      {}
                    } else {
                      stryCov_9fa48("5384");
                      // Try to login if user already exists
                      gunInstance.user().auth(credential.username, credential.password, (authAck: any) => {
                        if (stryMutAct_9fa48("5385")) {
                          {}
                        } else {
                          stryCov_9fa48("5385");
                          if (stryMutAct_9fa48("5387") ? false : stryMutAct_9fa48("5386") ? true : (stryCov_9fa48("5386", "5387"), authAck.err)) {
                            if (stryMutAct_9fa48("5388")) {
                              {}
                            } else {
                              stryCov_9fa48("5388");
                              resolve(stryMutAct_9fa48("5389") ? {} : (stryCov_9fa48("5389"), {
                                success: stryMutAct_9fa48("5390") ? true : (stryCov_9fa48("5390"), false),
                                error: authAck.err
                              }));
                            }
                          } else {
                            if (stryMutAct_9fa48("5391")) {
                              {}
                            } else {
                              stryCov_9fa48("5391");
                              const userPub = authAck.pub;
                              // Update credential with Gun user pub
                              credential.gunUserPub = userPub;
                              this.credentials.set(stryMutAct_9fa48("5392") ? address.toUpperCase() : (stryCov_9fa48("5392"), address.toLowerCase()), credential);
                              resolve(stryMutAct_9fa48("5393") ? {} : (stryCov_9fa48("5393"), {
                                success: stryMutAct_9fa48("5394") ? false : (stryCov_9fa48("5394"), true),
                                userPub
                              }));
                            }
                          }
                        }
                      });
                    }
                  } else {
                    if (stryMutAct_9fa48("5395")) {
                      {}
                    } else {
                      stryCov_9fa48("5395");
                      // User created, now login
                      gunInstance.user().auth(credential.username, credential.password, (authAck: any) => {
                        if (stryMutAct_9fa48("5396")) {
                          {}
                        } else {
                          stryCov_9fa48("5396");
                          if (stryMutAct_9fa48("5398") ? false : stryMutAct_9fa48("5397") ? true : (stryCov_9fa48("5397", "5398"), authAck.err)) {
                            if (stryMutAct_9fa48("5399")) {
                              {}
                            } else {
                              stryCov_9fa48("5399");
                              resolve(stryMutAct_9fa48("5400") ? {} : (stryCov_9fa48("5400"), {
                                success: stryMutAct_9fa48("5401") ? true : (stryCov_9fa48("5401"), false),
                                error: authAck.err
                              }));
                            }
                          } else {
                            if (stryMutAct_9fa48("5402")) {
                              {}
                            } else {
                              stryCov_9fa48("5402");
                              const userPub = authAck.pub;
                              // Update credential with Gun user pub
                              credential.gunUserPub = userPub;
                              this.credentials.set(stryMutAct_9fa48("5403") ? address.toUpperCase() : (stryCov_9fa48("5403"), address.toLowerCase()), credential);
                              resolve(stryMutAct_9fa48("5404") ? {} : (stryCov_9fa48("5404"), {
                                success: stryMutAct_9fa48("5405") ? false : (stryCov_9fa48("5405"), true),
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
        if (stryMutAct_9fa48("5406")) {
          {}
        } else {
          stryCov_9fa48("5406");
          console.error(stryMutAct_9fa48("5407") ? "" : (stryCov_9fa48("5407"), "Error creating Gun user:"), error);
          return stryMutAct_9fa48("5408") ? {} : (stryCov_9fa48("5408"), {
            success: stryMutAct_9fa48("5409") ? true : (stryCov_9fa48("5409"), false),
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Signs data using Web3 + derived keys
   * This provides a hybrid approach: Web3 for user verification + derived keys for actual signing
   * CONSISTENT with normal approach
   */
  async signWithDerivedKeys(data: any, address: string, extra?: string[]): Promise<string> {
    if (stryMutAct_9fa48("5410")) {
      {}
    } else {
      stryCov_9fa48("5410");
      try {
        if (stryMutAct_9fa48("5411")) {
          {}
        } else {
          stryCov_9fa48("5411");
          // First, verify user with Web3
          const authenticator = this.createAuthenticator(address);
          await authenticator(data); // This verifies the user

          // Then use derived keys for actual signing (CONSISTENT approach)
          const keyPair = await this.createDerivedKeyPair(address, extra);

          // Create signature using the same approach as SEA
          const message = JSON.stringify(data);
          const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));

          // Use ethers for signing (compatible with SEA)
          const wallet = new ethers.Wallet(keyPair.priv);
          const signature = await wallet.signMessage(message);

          // Format like SEA signature
          const seaSignature = stryMutAct_9fa48("5412") ? {} : (stryCov_9fa48("5412"), {
            m: message,
            s: signature
          });
          return (stryMutAct_9fa48("5413") ? "" : (stryCov_9fa48("5413"), "SEA")) + JSON.stringify(seaSignature);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5414")) {
          {}
        } else {
          stryCov_9fa48("5414");
          console.error(stryMutAct_9fa48("5415") ? "" : (stryCov_9fa48("5415"), "Error signing with derived keys:"), error);
          throw error;
        }
      }
    }
  }

  /**
   * Get the Gun user public key for a credential
   * This allows checking if the same user would be created
   */
  getGunUserPub(address: string): string | undefined {
    if (stryMutAct_9fa48("5416")) {
      {}
    } else {
      stryCov_9fa48("5416");
      const credential = this.credentials.get(stryMutAct_9fa48("5417") ? address.toUpperCase() : (stryCov_9fa48("5417"), address.toLowerCase()));
      return stryMutAct_9fa48("5418") ? credential.gunUserPub : (stryCov_9fa48("5418"), credential?.gunUserPub);
    }
  }

  /**
   * Get the password (for consistency checking)
   */
  getPassword(address: string): string | undefined {
    if (stryMutAct_9fa48("5419")) {
      {}
    } else {
      stryCov_9fa48("5419");
      const credential = this.credentials.get(stryMutAct_9fa48("5420") ? address.toUpperCase() : (stryCov_9fa48("5420"), address.toLowerCase()));
      return stryMutAct_9fa48("5421") ? credential.password : (stryCov_9fa48("5421"), credential?.password);
    }
  }

  /**
   * Check if this credential would create the same Gun user as normal approach
   */
  async verifyConsistency(address: string, expectedUserPub?: string): Promise<{
    consistent: boolean;
    actualUserPub?: string;
    expectedUserPub?: string;
  }> {
    if (stryMutAct_9fa48("5422")) {
      {}
    } else {
      stryCov_9fa48("5422");
      const credential = this.credentials.get(stryMutAct_9fa48("5423") ? address.toUpperCase() : (stryCov_9fa48("5423"), address.toLowerCase()));
      if (stryMutAct_9fa48("5426") ? false : stryMutAct_9fa48("5425") ? true : stryMutAct_9fa48("5424") ? credential : (stryCov_9fa48("5424", "5425", "5426"), !credential)) {
        if (stryMutAct_9fa48("5427")) {
          {}
        } else {
          stryCov_9fa48("5427");
          return stryMutAct_9fa48("5428") ? {} : (stryCov_9fa48("5428"), {
            consistent: stryMutAct_9fa48("5429") ? true : (stryCov_9fa48("5429"), false)
          });
        }
      }

      // The derived keys should be the same as normal approach
      const derivedKeys = await this.createDerivedKeyPair(address);
      return stryMutAct_9fa48("5430") ? {} : (stryCov_9fa48("5430"), {
        consistent: expectedUserPub ? stryMutAct_9fa48("5433") ? derivedKeys.pub !== expectedUserPub : stryMutAct_9fa48("5432") ? false : stryMutAct_9fa48("5431") ? true : (stryCov_9fa48("5431", "5432", "5433"), derivedKeys.pub === expectedUserPub) : stryMutAct_9fa48("5434") ? false : (stryCov_9fa48("5434"), true),
        actualUserPub: derivedKeys.pub,
        expectedUserPub
      });
    }
  }

  /**
   * Get credential by address
   */
  getCredential(address: string): Web3SigningCredential | undefined {
    if (stryMutAct_9fa48("5435")) {
      {}
    } else {
      stryCov_9fa48("5435");
      return this.credentials.get(stryMutAct_9fa48("5436") ? address.toUpperCase() : (stryCov_9fa48("5436"), address.toLowerCase()));
    }
  }

  /**
   * List all stored credentials
   */
  listCredentials(): Web3SigningCredential[] {
    if (stryMutAct_9fa48("5437")) {
      {}
    } else {
      stryCov_9fa48("5437");
      return Array.from(this.credentials.values());
    }
  }

  /**
   * Remove a credential
   */
  removeCredential(address: string): boolean {
    if (stryMutAct_9fa48("5438")) {
      {}
    } else {
      stryCov_9fa48("5438");
      return this.credentials.delete(stryMutAct_9fa48("5439") ? address.toUpperCase() : (stryCov_9fa48("5439"), address.toLowerCase()));
    }
  }
}
export default Web3Signer;