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
import { NostrConnector } from "./nostrConnector";
import derive from "../../gundb/derive";
import { ethers } from "ethers";

/**
 * Nostr Signing Credential for oneshot signing
 */
export interface NostrSigningCredential {
  address: string;
  signature: string;
  message: string;
  username: string; // For consistency with normal approach
  password: string; // For consistency with normal approach
  gunUserPub?: string; // The Gun user public key if created
}

/**
 * Nostr Signer - Provides oneshot signing functionality
 * Similar to webauthn.js but for Nostr/Bitcoin wallets
 * CONSISTENT with normal Nostr approach
 */
export class NostrSigner {
  private nostrConnector: NostrConnector;
  private credentials: Map<string, NostrSigningCredential> = new Map();
  private readonly MESSAGE_TO_SIGN = stryMutAct_9fa48("3575") ? "" : (stryCov_9fa48("3575"), "I Love Shogun!"); // Same as normal approach

  constructor(nostrConnector?: NostrConnector) {
    if (stryMutAct_9fa48("3576")) {
      {}
    } else {
      stryCov_9fa48("3576");
      this.nostrConnector = stryMutAct_9fa48("3579") ? nostrConnector && new NostrConnector() : stryMutAct_9fa48("3578") ? false : stryMutAct_9fa48("3577") ? true : (stryCov_9fa48("3577", "3578", "3579"), nostrConnector || new NostrConnector());
    }
  }

  /**
   * Creates a new Nostr signing credential
   * CONSISTENT with normal Nostr approach
   */
  async createSigningCredential(address: string): Promise<NostrSigningCredential> {
    if (stryMutAct_9fa48("3580")) {
      {}
    } else {
      stryCov_9fa48("3580");
      try {
        if (stryMutAct_9fa48("3581")) {
          {}
        } else {
          stryCov_9fa48("3581");
          // Validate address (same validation as normal approach)
          const validAddress = this.validateAddress(address);

          // Generate signature using the SAME approach as normal Nostr
          const signature = await this.generateDeterministicSignature(validAddress);

          // Generate credentials using the SAME logic as normal approach
          const username = stryMutAct_9fa48("3582") ? `` : (stryCov_9fa48("3582"), `${stryMutAct_9fa48("3583") ? validAddress.toUpperCase() : (stryCov_9fa48("3583"), validAddress.toLowerCase())}`);
          const password = await this.generatePassword(signature);
          const signingCredential: NostrSigningCredential = stryMutAct_9fa48("3584") ? {} : (stryCov_9fa48("3584"), {
            address: validAddress,
            signature,
            message: this.MESSAGE_TO_SIGN,
            username,
            password // This ensures consistency with normal approach
          });

          // Store credential for later use
          this.credentials.set(stryMutAct_9fa48("3585") ? validAddress.toUpperCase() : (stryCov_9fa48("3585"), validAddress.toLowerCase()), signingCredential);
          return signingCredential;
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3586")) {
          {}
        } else {
          stryCov_9fa48("3586");
          console.error(stryMutAct_9fa48("3587") ? "" : (stryCov_9fa48("3587"), "Error creating Nostr signing credential:"), error);
          throw new Error(stryMutAct_9fa48("3588") ? `` : (stryCov_9fa48("3588"), `Failed to create Nostr signing credential: ${error.message}`));
        }
      }
    }
  }

  /**
   * Validates address using the same logic as NostrConnector
   */
  private validateAddress(address: string | null | undefined): string {
    if (stryMutAct_9fa48("3589")) {
      {}
    } else {
      stryCov_9fa48("3589");
      if (stryMutAct_9fa48("3592") ? false : stryMutAct_9fa48("3591") ? true : stryMutAct_9fa48("3590") ? address : (stryCov_9fa48("3590", "3591", "3592"), !address)) {
        if (stryMutAct_9fa48("3593")) {
          {}
        } else {
          stryCov_9fa48("3593");
          throw new Error(stryMutAct_9fa48("3594") ? "" : (stryCov_9fa48("3594"), "Address not provided"));
        }
      }
      try {
        if (stryMutAct_9fa48("3595")) {
          {}
        } else {
          stryCov_9fa48("3595");
          const normalizedAddress = stryMutAct_9fa48("3596") ? String(address) : (stryCov_9fa48("3596"), String(address).trim());

          // Basic validation for Bitcoin addresses and Nostr pubkeys (same as normal approach)
          if (stryMutAct_9fa48("3599") ? false : stryMutAct_9fa48("3598") ? true : stryMutAct_9fa48("3597") ? /^(npub1|[0-9a-f]{64}|bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/.test(normalizedAddress) : (stryCov_9fa48("3597", "3598", "3599"), !(stryMutAct_9fa48("3606") ? /^(npub1|[0-9a-f]{64}|bc1|[13])[^a-zA-HJ-NP-Z0-9]{25,59}$/ : stryMutAct_9fa48("3605") ? /^(npub1|[0-9a-f]{64}|bc1|[13])[a-zA-HJ-NP-Z0-9]$/ : stryMutAct_9fa48("3604") ? /^(npub1|[0-9a-f]{64}|bc1|[^13])[a-zA-HJ-NP-Z0-9]{25,59}$/ : stryMutAct_9fa48("3603") ? /^(npub1|[^0-9a-f]{64}|bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/ : stryMutAct_9fa48("3602") ? /^(npub1|[0-9a-f]|bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/ : stryMutAct_9fa48("3601") ? /^(npub1|[0-9a-f]{64}|bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}/ : stryMutAct_9fa48("3600") ? /(npub1|[0-9a-f]{64}|bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/ : (stryCov_9fa48("3600", "3601", "3602", "3603", "3604", "3605", "3606"), /^(npub1|[0-9a-f]{64}|bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}$/)).test(normalizedAddress))) {
            if (stryMutAct_9fa48("3607")) {
              {}
            } else {
              stryCov_9fa48("3607");
              // More lenient validation for Nostr addresses
              if (stryMutAct_9fa48("3611") ? normalizedAddress.length >= 10 : stryMutAct_9fa48("3610") ? normalizedAddress.length <= 10 : stryMutAct_9fa48("3609") ? false : stryMutAct_9fa48("3608") ? true : (stryCov_9fa48("3608", "3609", "3610", "3611"), normalizedAddress.length < 10)) {
                if (stryMutAct_9fa48("3612")) {
                  {}
                } else {
                  stryCov_9fa48("3612");
                  throw new Error(stryMutAct_9fa48("3613") ? "" : (stryCov_9fa48("3613"), "Invalid Nostr/Bitcoin address format"));
                }
              }
            }
          }
          return normalizedAddress;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3614")) {
          {}
        } else {
          stryCov_9fa48("3614");
          throw new Error(stryMutAct_9fa48("3615") ? "" : (stryCov_9fa48("3615"), "Invalid Nostr/Bitcoin address provided"));
        }
      }
    }
  }

  /**
   * Generate deterministic signature using the SAME approach as NostrConnector
   */
  private async generateDeterministicSignature(address: string): Promise<string> {
    if (stryMutAct_9fa48("3616")) {
      {}
    } else {
      stryCov_9fa48("3616");
      // Create a deterministic signature based on the address and a fixed message
      // This ensures the same credentials are generated each time for the same address
      // SAME LOGIC as NostrConnector.generateDeterministicSignature
      const baseString = stryMutAct_9fa48("3617") ? `` : (stryCov_9fa48("3617"), `${address}_${this.MESSAGE_TO_SIGN}_shogun_deterministic`);

      // Simple hash function to create a deterministic signature
      let hash = stryMutAct_9fa48("3618") ? "Stryker was here!" : (stryCov_9fa48("3618"), "");
      let runningValue = 0;
      for (let i = 0; stryMutAct_9fa48("3621") ? i >= baseString.length : stryMutAct_9fa48("3620") ? i <= baseString.length : stryMutAct_9fa48("3619") ? false : (stryCov_9fa48("3619", "3620", "3621"), i < baseString.length); stryMutAct_9fa48("3622") ? i-- : (stryCov_9fa48("3622"), i++)) {
        if (stryMutAct_9fa48("3623")) {
          {}
        } else {
          stryCov_9fa48("3623");
          const charCode = baseString.charCodeAt(i);
          runningValue = (stryMutAct_9fa48("3624") ? runningValue * 31 - charCode : (stryCov_9fa48("3624"), (stryMutAct_9fa48("3625") ? runningValue / 31 : (stryCov_9fa48("3625"), runningValue * 31)) + charCode)) & 0xffffffff;
          if (stryMutAct_9fa48("3628") ? i % 4 !== 3 : stryMutAct_9fa48("3627") ? false : stryMutAct_9fa48("3626") ? true : (stryCov_9fa48("3626", "3627", "3628"), (stryMutAct_9fa48("3629") ? i * 4 : (stryCov_9fa48("3629"), i % 4)) === 3)) {
            if (stryMutAct_9fa48("3630")) {
              {}
            } else {
              stryCov_9fa48("3630");
              stryMutAct_9fa48("3631") ? hash -= runningValue.toString(16).padStart(8, "0") : (stryCov_9fa48("3631"), hash += runningValue.toString(16).padStart(8, stryMutAct_9fa48("3632") ? "" : (stryCov_9fa48("3632"), "0")));
            }
          }
        }
      }

      // Ensure we have exactly 128 characters (64 bytes in hex)
      while (stryMutAct_9fa48("3635") ? hash.length >= 128 : stryMutAct_9fa48("3634") ? hash.length <= 128 : stryMutAct_9fa48("3633") ? false : (stryCov_9fa48("3633", "3634", "3635"), hash.length < 128)) {
        if (stryMutAct_9fa48("3636")) {
          {}
        } else {
          stryCov_9fa48("3636");
          runningValue = (stryMutAct_9fa48("3637") ? runningValue * 31 - hash.length : (stryCov_9fa48("3637"), (stryMutAct_9fa48("3638") ? runningValue / 31 : (stryCov_9fa48("3638"), runningValue * 31)) + hash.length)) & 0xffffffff;
          stryMutAct_9fa48("3639") ? hash -= runningValue.toString(16).padStart(8, "0") : (stryCov_9fa48("3639"), hash += runningValue.toString(16).padStart(8, stryMutAct_9fa48("3640") ? "" : (stryCov_9fa48("3640"), "0")));
        }
      }

      // Ensure the result is exactly 128 characters and contains only valid hex characters
      let deterministicSignature = stryMutAct_9fa48("3641") ? hash : (stryCov_9fa48("3641"), hash.substring(0, 128));

      // Double-check that it's a valid hex string
      deterministicSignature = stryMutAct_9fa48("3642") ? deterministicSignature.toUpperCase().replace(/[^0-9a-f]/g, "0") : (stryCov_9fa48("3642"), deterministicSignature.toLowerCase().replace(stryMutAct_9fa48("3643") ? /[0-9a-f]/g : (stryCov_9fa48("3643"), /[^0-9a-f]/g), stryMutAct_9fa48("3644") ? "" : (stryCov_9fa48("3644"), "0")));

      // Ensure it's exactly 128 characters
      if (stryMutAct_9fa48("3648") ? deterministicSignature.length >= 128 : stryMutAct_9fa48("3647") ? deterministicSignature.length <= 128 : stryMutAct_9fa48("3646") ? false : stryMutAct_9fa48("3645") ? true : (stryCov_9fa48("3645", "3646", "3647", "3648"), deterministicSignature.length < 128)) {
        if (stryMutAct_9fa48("3649")) {
          {}
        } else {
          stryCov_9fa48("3649");
          deterministicSignature = deterministicSignature.padEnd(128, stryMutAct_9fa48("3650") ? "" : (stryCov_9fa48("3650"), "0"));
        }
      } else if (stryMutAct_9fa48("3654") ? deterministicSignature.length <= 128 : stryMutAct_9fa48("3653") ? deterministicSignature.length >= 128 : stryMutAct_9fa48("3652") ? false : stryMutAct_9fa48("3651") ? true : (stryCov_9fa48("3651", "3652", "3653", "3654"), deterministicSignature.length > 128)) {
        if (stryMutAct_9fa48("3655")) {
          {}
        } else {
          stryCov_9fa48("3655");
          deterministicSignature = stryMutAct_9fa48("3656") ? deterministicSignature : (stryCov_9fa48("3656"), deterministicSignature.substring(0, 128));
        }
      }
      return deterministicSignature;
    }
  }

  /**
   * Generate password using the SAME approach as NostrConnector
   */
  private async generatePassword(signature: string): Promise<string> {
    if (stryMutAct_9fa48("3657")) {
      {}
    } else {
      stryCov_9fa48("3657");
      if (stryMutAct_9fa48("3660") ? false : stryMutAct_9fa48("3659") ? true : stryMutAct_9fa48("3658") ? signature : (stryCov_9fa48("3658", "3659", "3660"), !signature)) {
        if (stryMutAct_9fa48("3661")) {
          {}
        } else {
          stryCov_9fa48("3661");
          throw new Error(stryMutAct_9fa48("3662") ? "" : (stryCov_9fa48("3662"), "Invalid signature"));
        }
      }
      try {
        if (stryMutAct_9fa48("3663")) {
          {}
        } else {
          stryCov_9fa48("3663");
          // SAME LOGIC as NostrConnector.generatePassword
          const normalizedSig = stryMutAct_9fa48("3664") ? signature.toUpperCase().replace(/[^a-f0-9]/g, "") : (stryCov_9fa48("3664"), signature.toLowerCase().replace(stryMutAct_9fa48("3665") ? /[a-f0-9]/g : (stryCov_9fa48("3665"), /[^a-f0-9]/g), stryMutAct_9fa48("3666") ? "Stryker was here!" : (stryCov_9fa48("3666"), "")));
          const passwordHash = ethers.sha256(ethers.toUtf8Bytes(normalizedSig));
          return passwordHash;
        }
      } catch (error) {
        if (stryMutAct_9fa48("3667")) {
          {}
        } else {
          stryCov_9fa48("3667");
          console.error(stryMutAct_9fa48("3668") ? "" : (stryCov_9fa48("3668"), "Error generating password:"), error);
          throw new Error(stryMutAct_9fa48("3669") ? "" : (stryCov_9fa48("3669"), "Failed to generate password from signature"));
        }
      }
    }
  }

  /**
   * Creates an authenticator function compatible with SEA.sign
   * This is the key function that makes it work like webauthn.js but for Nostr
   */
  createAuthenticator(address: string): (data: any) => Promise<string> {
    if (stryMutAct_9fa48("3670")) {
      {}
    } else {
      stryCov_9fa48("3670");
      const credential = this.credentials.get(stryMutAct_9fa48("3671") ? address.toUpperCase() : (stryCov_9fa48("3671"), address.toLowerCase()));
      if (stryMutAct_9fa48("3674") ? false : stryMutAct_9fa48("3673") ? true : stryMutAct_9fa48("3672") ? credential : (stryCov_9fa48("3672", "3673", "3674"), !credential)) {
        if (stryMutAct_9fa48("3675")) {
          {}
        } else {
          stryCov_9fa48("3675");
          throw new Error(stryMutAct_9fa48("3676") ? `` : (stryCov_9fa48("3676"), `Credential for address ${address} not found`));
        }
      }
      return async (data: any): Promise<string> => {
        if (stryMutAct_9fa48("3677")) {
          {}
        } else {
          stryCov_9fa48("3677");
          try {
            if (stryMutAct_9fa48("3678")) {
              {}
            } else {
              stryCov_9fa48("3678");
              // Verify the user by requesting a new signature for the data
              // In a real implementation, this would use the Nostr extension
              const dataToSign = JSON.stringify(data);

              // For now, create a deterministic signature based on the data and credential
              const signature = await this.signData(dataToSign, credential);
              return signature;
            }
          } catch (error: any) {
            if (stryMutAct_9fa48("3679")) {
              {}
            } else {
              stryCov_9fa48("3679");
              console.error(stryMutAct_9fa48("3680") ? "" : (stryCov_9fa48("3680"), "Nostr authentication error:"), error);
              throw error;
            }
          }
        }
      };
    }
  }

  /**
   * Sign data using the credential
   */
  private async signData(data: string, credential: NostrSigningCredential): Promise<string> {
    if (stryMutAct_9fa48("3681")) {
      {}
    } else {
      stryCov_9fa48("3681");
      // Create a deterministic signature for the data
      const signatureBase = stryMutAct_9fa48("3682") ? `` : (stryCov_9fa48("3682"), `${credential.signature}_${data}`);
      return this.generateDeterministicSignature(signatureBase);
    }
  }

  /**
   * Creates a derived key pair from Nostr credential
   * CONSISTENT with normal approach: uses password as seed
   */
  async createDerivedKeyPair(address: string, extra?: string[]): Promise<{
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  }> {
    if (stryMutAct_9fa48("3683")) {
      {}
    } else {
      stryCov_9fa48("3683");
      const credential = this.credentials.get(stryMutAct_9fa48("3684") ? address.toUpperCase() : (stryCov_9fa48("3684"), address.toLowerCase()));
      if (stryMutAct_9fa48("3687") ? false : stryMutAct_9fa48("3686") ? true : stryMutAct_9fa48("3685") ? credential : (stryCov_9fa48("3685", "3686", "3687"), !credential)) {
        if (stryMutAct_9fa48("3688")) {
          {}
        } else {
          stryCov_9fa48("3688");
          throw new Error(stryMutAct_9fa48("3689") ? `` : (stryCov_9fa48("3689"), `Credential for address ${address} not found`));
        }
      }
      try {
        if (stryMutAct_9fa48("3690")) {
          {}
        } else {
          stryCov_9fa48("3690");
          // CONSISTENCY: Use the same approach as normal Nostr
          // Use password as seed (same as normal approach)
          const derivedKeys = await derive(credential.password,
          // This is the key consistency point!
          extra, stryMutAct_9fa48("3691") ? {} : (stryCov_9fa48("3691"), {
            includeP256: stryMutAct_9fa48("3692") ? false : (stryCov_9fa48("3692"), true)
          }));
          return stryMutAct_9fa48("3693") ? {} : (stryCov_9fa48("3693"), {
            pub: derivedKeys.pub,
            priv: derivedKeys.priv,
            epub: derivedKeys.epub,
            epriv: derivedKeys.epriv
          });
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3694")) {
          {}
        } else {
          stryCov_9fa48("3694");
          console.error(stryMutAct_9fa48("3695") ? "" : (stryCov_9fa48("3695"), "Error deriving keys from Nostr credential:"), error);
          throw error;
        }
      }
    }
  }

  /**
   * Creates a Gun user from Nostr credential
   * This ensures the SAME user is created as with normal approach
   */
  async createGunUser(address: string, gunInstance: any): Promise<{
    success: boolean;
    userPub?: string;
    error?: string;
  }> {
    if (stryMutAct_9fa48("3696")) {
      {}
    } else {
      stryCov_9fa48("3696");
      const credential = this.credentials.get(stryMutAct_9fa48("3697") ? address.toUpperCase() : (stryCov_9fa48("3697"), address.toLowerCase()));
      if (stryMutAct_9fa48("3700") ? false : stryMutAct_9fa48("3699") ? true : stryMutAct_9fa48("3698") ? credential : (stryCov_9fa48("3698", "3699", "3700"), !credential)) {
        if (stryMutAct_9fa48("3701")) {
          {}
        } else {
          stryCov_9fa48("3701");
          throw new Error(stryMutAct_9fa48("3702") ? `` : (stryCov_9fa48("3702"), `Credential for address ${address} not found`));
        }
      }
      try {
        if (stryMutAct_9fa48("3703")) {
          {}
        } else {
          stryCov_9fa48("3703");
          // Use the SAME approach as normal Nostr
          return new Promise(resolve => {
            if (stryMutAct_9fa48("3704")) {
              {}
            } else {
              stryCov_9fa48("3704");
              gunInstance.user().create(credential.username, credential.password, (ack: any) => {
                if (stryMutAct_9fa48("3705")) {
                  {}
                } else {
                  stryCov_9fa48("3705");
                  if (stryMutAct_9fa48("3707") ? false : stryMutAct_9fa48("3706") ? true : (stryCov_9fa48("3706", "3707"), ack.err)) {
                    if (stryMutAct_9fa48("3708")) {
                      {}
                    } else {
                      stryCov_9fa48("3708");
                      // Try to login if user already exists
                      gunInstance.user().auth(credential.username, credential.password, (authAck: any) => {
                        if (stryMutAct_9fa48("3709")) {
                          {}
                        } else {
                          stryCov_9fa48("3709");
                          if (stryMutAct_9fa48("3711") ? false : stryMutAct_9fa48("3710") ? true : (stryCov_9fa48("3710", "3711"), authAck.err)) {
                            if (stryMutAct_9fa48("3712")) {
                              {}
                            } else {
                              stryCov_9fa48("3712");
                              resolve(stryMutAct_9fa48("3713") ? {} : (stryCov_9fa48("3713"), {
                                success: stryMutAct_9fa48("3714") ? true : (stryCov_9fa48("3714"), false),
                                error: authAck.err
                              }));
                            }
                          } else {
                            if (stryMutAct_9fa48("3715")) {
                              {}
                            } else {
                              stryCov_9fa48("3715");
                              const userPub = authAck.pub;
                              // Update credential with Gun user pub
                              credential.gunUserPub = userPub;
                              this.credentials.set(stryMutAct_9fa48("3716") ? address.toUpperCase() : (stryCov_9fa48("3716"), address.toLowerCase()), credential);
                              resolve(stryMutAct_9fa48("3717") ? {} : (stryCov_9fa48("3717"), {
                                success: stryMutAct_9fa48("3718") ? false : (stryCov_9fa48("3718"), true),
                                userPub
                              }));
                            }
                          }
                        }
                      });
                    }
                  } else {
                    if (stryMutAct_9fa48("3719")) {
                      {}
                    } else {
                      stryCov_9fa48("3719");
                      // User created, now login
                      gunInstance.user().auth(credential.username, credential.password, (authAck: any) => {
                        if (stryMutAct_9fa48("3720")) {
                          {}
                        } else {
                          stryCov_9fa48("3720");
                          if (stryMutAct_9fa48("3722") ? false : stryMutAct_9fa48("3721") ? true : (stryCov_9fa48("3721", "3722"), authAck.err)) {
                            if (stryMutAct_9fa48("3723")) {
                              {}
                            } else {
                              stryCov_9fa48("3723");
                              resolve(stryMutAct_9fa48("3724") ? {} : (stryCov_9fa48("3724"), {
                                success: stryMutAct_9fa48("3725") ? true : (stryCov_9fa48("3725"), false),
                                error: authAck.err
                              }));
                            }
                          } else {
                            if (stryMutAct_9fa48("3726")) {
                              {}
                            } else {
                              stryCov_9fa48("3726");
                              const userPub = authAck.pub;
                              // Update credential with Gun user pub
                              credential.gunUserPub = userPub;
                              this.credentials.set(stryMutAct_9fa48("3727") ? address.toUpperCase() : (stryCov_9fa48("3727"), address.toLowerCase()), credential);
                              resolve(stryMutAct_9fa48("3728") ? {} : (stryCov_9fa48("3728"), {
                                success: stryMutAct_9fa48("3729") ? false : (stryCov_9fa48("3729"), true),
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
        if (stryMutAct_9fa48("3730")) {
          {}
        } else {
          stryCov_9fa48("3730");
          console.error(stryMutAct_9fa48("3731") ? "" : (stryCov_9fa48("3731"), "Error creating Gun user:"), error);
          return stryMutAct_9fa48("3732") ? {} : (stryCov_9fa48("3732"), {
            success: stryMutAct_9fa48("3733") ? true : (stryCov_9fa48("3733"), false),
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Signs data using Nostr + derived keys
   * This provides a hybrid approach: Nostr for user verification + derived keys for actual signing
   * CONSISTENT with normal approach
   */
  async signWithDerivedKeys(data: any, address: string, extra?: string[]): Promise<string> {
    if (stryMutAct_9fa48("3734")) {
      {}
    } else {
      stryCov_9fa48("3734");
      try {
        if (stryMutAct_9fa48("3735")) {
          {}
        } else {
          stryCov_9fa48("3735");
          // First, verify user with Nostr
          const authenticator = this.createAuthenticator(address);
          await authenticator(data); // This verifies the user

          // Then use derived keys for actual signing (CONSISTENT approach)
          const keyPair = await this.createDerivedKeyPair(address, extra);

          // Create signature using the same approach as SEA
          const message = JSON.stringify(data);

          // Use a simple signing approach (in production, would use proper crypto)
          const signature = await this.generateDeterministicSignature(stryMutAct_9fa48("3736") ? `` : (stryCov_9fa48("3736"), `${keyPair.priv}_${message}`));

          // Format like SEA signature
          const seaSignature = stryMutAct_9fa48("3737") ? {} : (stryCov_9fa48("3737"), {
            m: message,
            s: signature
          });
          return (stryMutAct_9fa48("3738") ? "" : (stryCov_9fa48("3738"), "SEA")) + JSON.stringify(seaSignature);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("3739")) {
          {}
        } else {
          stryCov_9fa48("3739");
          console.error(stryMutAct_9fa48("3740") ? "" : (stryCov_9fa48("3740"), "Error signing with derived keys:"), error);
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
    if (stryMutAct_9fa48("3741")) {
      {}
    } else {
      stryCov_9fa48("3741");
      const credential = this.credentials.get(stryMutAct_9fa48("3742") ? address.toUpperCase() : (stryCov_9fa48("3742"), address.toLowerCase()));
      return stryMutAct_9fa48("3743") ? credential.gunUserPub : (stryCov_9fa48("3743"), credential?.gunUserPub);
    }
  }

  /**
   * Get the password (for consistency checking)
   */
  getPassword(address: string): string | undefined {
    if (stryMutAct_9fa48("3744")) {
      {}
    } else {
      stryCov_9fa48("3744");
      const credential = this.credentials.get(stryMutAct_9fa48("3745") ? address.toUpperCase() : (stryCov_9fa48("3745"), address.toLowerCase()));
      return stryMutAct_9fa48("3746") ? credential.password : (stryCov_9fa48("3746"), credential?.password);
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
    if (stryMutAct_9fa48("3747")) {
      {}
    } else {
      stryCov_9fa48("3747");
      const credential = this.credentials.get(stryMutAct_9fa48("3748") ? address.toUpperCase() : (stryCov_9fa48("3748"), address.toLowerCase()));
      if (stryMutAct_9fa48("3751") ? false : stryMutAct_9fa48("3750") ? true : stryMutAct_9fa48("3749") ? credential : (stryCov_9fa48("3749", "3750", "3751"), !credential)) {
        if (stryMutAct_9fa48("3752")) {
          {}
        } else {
          stryCov_9fa48("3752");
          return stryMutAct_9fa48("3753") ? {} : (stryCov_9fa48("3753"), {
            consistent: stryMutAct_9fa48("3754") ? true : (stryCov_9fa48("3754"), false)
          });
        }
      }

      // The derived keys should be the same as normal approach
      const derivedKeys = await this.createDerivedKeyPair(address);
      return stryMutAct_9fa48("3755") ? {} : (stryCov_9fa48("3755"), {
        consistent: expectedUserPub ? stryMutAct_9fa48("3758") ? derivedKeys.pub !== expectedUserPub : stryMutAct_9fa48("3757") ? false : stryMutAct_9fa48("3756") ? true : (stryCov_9fa48("3756", "3757", "3758"), derivedKeys.pub === expectedUserPub) : stryMutAct_9fa48("3759") ? false : (stryCov_9fa48("3759"), true),
        actualUserPub: derivedKeys.pub,
        expectedUserPub
      });
    }
  }

  /**
   * Get credential by address
   */
  getCredential(address: string): NostrSigningCredential | undefined {
    if (stryMutAct_9fa48("3760")) {
      {}
    } else {
      stryCov_9fa48("3760");
      return this.credentials.get(stryMutAct_9fa48("3761") ? address.toUpperCase() : (stryCov_9fa48("3761"), address.toLowerCase()));
    }
  }

  /**
   * List all stored credentials
   */
  listCredentials(): NostrSigningCredential[] {
    if (stryMutAct_9fa48("3762")) {
      {}
    } else {
      stryCov_9fa48("3762");
      return Array.from(this.credentials.values());
    }
  }

  /**
   * Remove a credential
   */
  removeCredential(address: string): boolean {
    if (stryMutAct_9fa48("3763")) {
      {}
    } else {
      stryCov_9fa48("3763");
      return this.credentials.delete(stryMutAct_9fa48("3764") ? address.toUpperCase() : (stryCov_9fa48("3764"), address.toLowerCase()));
    }
  }
}
export default NostrSigner;