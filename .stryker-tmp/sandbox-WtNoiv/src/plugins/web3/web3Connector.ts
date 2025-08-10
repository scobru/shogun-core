/**
 * The MetaMaskAuth class provides functionality for connecting, signing up, and logging in using MetaMask.
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
import { ethers } from "ethers";
import { ErrorHandler, ErrorType } from "../../utils/errorHandler";
import { EventEmitter } from "../../utils/eventEmitter";
import { ConnectionResult, Web3ConnectorCredentials, EthereumProvider, SignatureCache, Web3Config } from "./types";
import { ISEAPair } from "gun";
import derive from "../../gundb/derive";

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: EthereumProvider;
    Web3Connector?: typeof Web3Connector;
    _ethereumProviders?: EthereumProvider[];
  }
}
declare global {
  namespace NodeJS {
    interface Global {
      web3Connector?: typeof Web3Connector;
    }
  }
}

/**
 * Class for MetaMask connection
 */
class Web3Connector extends EventEmitter {
  private readonly MESSAGE_TO_SIGN = stryMutAct_9fa48("4756") ? "" : (stryCov_9fa48("4756"), "I Love Shogun!");
  private readonly DEFAULT_CONFIG: Web3Config = stryMutAct_9fa48("4757") ? {} : (stryCov_9fa48("4757"), {
    cacheDuration: stryMutAct_9fa48("4758") ? 30 * 60 / 1000 : (stryCov_9fa48("4758"), (stryMutAct_9fa48("4759") ? 30 / 60 : (stryCov_9fa48("4759"), 30 * 60)) * 1000),
    // 30 minutes
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 60000
  });
  private readonly config: Web3Config;
  private readonly signatureCache: Map<string, SignatureCache> = new Map();
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
  private customProvider: ethers.JsonRpcProvider | null = null;
  private customWallet: ethers.Wallet | null = null;
  constructor(config: Partial<Web3Config> = {}) {
    super();
    this.config = stryMutAct_9fa48("4760") ? {} : (stryCov_9fa48("4760"), {
      ...this.DEFAULT_CONFIG,
      ...config
    });
    this.initProvider();
    this.setupEventListeners();
  }

  /**
   * Initialize the provider synchronously with fallback mechanisms
   * to handle conflicts between multiple wallet providers
   */
  private initProvider(): void {
    if (stryMutAct_9fa48("4761")) {
      {}
    } else {
      stryCov_9fa48("4761");
      if (stryMutAct_9fa48("4764") ? typeof window === "undefined" : stryMutAct_9fa48("4763") ? false : stryMutAct_9fa48("4762") ? true : (stryCov_9fa48("4762", "4763", "4764"), typeof window !== (stryMutAct_9fa48("4765") ? "" : (stryCov_9fa48("4765"), "undefined")))) {
        if (stryMutAct_9fa48("4766")) {
          {}
        } else {
          stryCov_9fa48("4766");
          try {
            if (stryMutAct_9fa48("4767")) {
              {}
            } else {
              stryCov_9fa48("4767");
              // Check if ethereum is available from any provider
              const ethereumProvider = this.getAvailableEthereumProvider();
              if (stryMutAct_9fa48("4769") ? false : stryMutAct_9fa48("4768") ? true : (stryCov_9fa48("4768", "4769"), ethereumProvider)) {
                if (stryMutAct_9fa48("4770")) {
                  {}
                } else {
                  stryCov_9fa48("4770");
                  this.provider = new ethers.BrowserProvider(ethereumProvider as ethers.Eip1193Provider);
                }
              } else {
                if (stryMutAct_9fa48("4771")) {
                  {}
                } else {
                  stryCov_9fa48("4771");
                  console.warn(stryMutAct_9fa48("4772") ? "" : (stryCov_9fa48("4772"), "No compatible Ethereum provider found"));
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("4773")) {
              {}
            } else {
              stryCov_9fa48("4773");
              console.error(stryMutAct_9fa48("4774") ? "" : (stryCov_9fa48("4774"), "Failed to initialize BrowserProvider"), error);
            }
          }
        }
      } else {
        if (stryMutAct_9fa48("4775")) {
          {}
        } else {
          stryCov_9fa48("4775");
          console.warn(stryMutAct_9fa48("4776") ? "" : (stryCov_9fa48("4776"), "Window object not available (non-browser environment)"));
        }
      }
    }
  }

  /**
   * Get available Ethereum provider from multiple possible sources
   */
  private getAvailableEthereumProvider(): EthereumProvider | undefined {
    if (stryMutAct_9fa48("4777")) {
      {}
    } else {
      stryCov_9fa48("4777");
      if (stryMutAct_9fa48("4780") ? typeof window !== "undefined" : stryMutAct_9fa48("4779") ? false : stryMutAct_9fa48("4778") ? true : (stryCov_9fa48("4778", "4779", "4780"), typeof window === (stryMutAct_9fa48("4781") ? "" : (stryCov_9fa48("4781"), "undefined")))) return undefined;

      // Define provider sources with priority order
      const providerSources = stryMutAct_9fa48("4782") ? [] : (stryCov_9fa48("4782"), [// Check if we have providers in the _ethereumProviders registry (from index.html)
      stryMutAct_9fa48("4783") ? {} : (stryCov_9fa48("4783"), {
        source: stryMutAct_9fa48("4784") ? () => undefined : (stryCov_9fa48("4784"), () => stryMutAct_9fa48("4787") ? window._ethereumProviders || window._ethereumProviders[0] : stryMutAct_9fa48("4786") ? false : stryMutAct_9fa48("4785") ? true : (stryCov_9fa48("4785", "4786", "4787"), window._ethereumProviders && window._ethereumProviders[0])),
        name: stryMutAct_9fa48("4788") ? "" : (stryCov_9fa48("4788"), "Registry Primary")
      }), stryMutAct_9fa48("4789") ? {} : (stryCov_9fa48("4789"), {
        source: stryMutAct_9fa48("4790") ? () => undefined : (stryCov_9fa48("4790"), () => window.ethereum),
        name: stryMutAct_9fa48("4791") ? "" : (stryCov_9fa48("4791"), "Standard ethereum")
      }), stryMutAct_9fa48("4792") ? {} : (stryCov_9fa48("4792"), {
        source: stryMutAct_9fa48("4793") ? () => undefined : (stryCov_9fa48("4793"), () => stryMutAct_9fa48("4794") ? (window as any).web3.currentProvider : (stryCov_9fa48("4794"), (window as any).web3?.currentProvider)),
        name: stryMutAct_9fa48("4795") ? "" : (stryCov_9fa48("4795"), "Legacy web3")
      }), stryMutAct_9fa48("4796") ? {} : (stryCov_9fa48("4796"), {
        source: stryMutAct_9fa48("4797") ? () => undefined : (stryCov_9fa48("4797"), () => (window as any).metamask),
        name: stryMutAct_9fa48("4798") ? "" : (stryCov_9fa48("4798"), "MetaMask specific")
      }), stryMutAct_9fa48("4799") ? {} : (stryCov_9fa48("4799"), {
        source: stryMutAct_9fa48("4800") ? () => undefined : (stryCov_9fa48("4800"), () => stryMutAct_9fa48("4802") ? (window as any).ethereum.providers?.find((p: any) => p.isMetaMask) : stryMutAct_9fa48("4801") ? (window as any).ethereum?.providers.find((p: any) => p.isMetaMask) : (stryCov_9fa48("4801", "4802"), (window as any).ethereum?.providers?.find(stryMutAct_9fa48("4803") ? () => undefined : (stryCov_9fa48("4803"), (p: any) => p.isMetaMask)))),
        name: stryMutAct_9fa48("4804") ? "" : (stryCov_9fa48("4804"), "MetaMask from providers array")
      }), stryMutAct_9fa48("4805") ? {} : (stryCov_9fa48("4805"), {
        source: stryMutAct_9fa48("4806") ? () => undefined : (stryCov_9fa48("4806"), () => stryMutAct_9fa48("4808") ? (window as any).ethereum.providers?.[0] : stryMutAct_9fa48("4807") ? (window as any).ethereum?.providers[0] : (stryCov_9fa48("4807", "4808"), (window as any).ethereum?.providers?.[0])),
        name: stryMutAct_9fa48("4809") ? "" : (stryCov_9fa48("4809"), "First provider in array")
      }), // Try known provider names
      stryMutAct_9fa48("4810") ? {} : (stryCov_9fa48("4810"), {
        source: stryMutAct_9fa48("4811") ? () => undefined : (stryCov_9fa48("4811"), () => stryMutAct_9fa48("4813") ? (window as any).enkrypt.providers?.ethereum : stryMutAct_9fa48("4812") ? (window as any).enkrypt?.providers.ethereum : (stryCov_9fa48("4812", "4813"), (window as any).enkrypt?.providers?.ethereum)),
        name: stryMutAct_9fa48("4814") ? "" : (stryCov_9fa48("4814"), "Enkrypt")
      }), stryMutAct_9fa48("4815") ? {} : (stryCov_9fa48("4815"), {
        source: stryMutAct_9fa48("4816") ? () => undefined : (stryCov_9fa48("4816"), () => (window as any).coinbaseWalletExtension),
        name: stryMutAct_9fa48("4817") ? "" : (stryCov_9fa48("4817"), "Coinbase")
      }), stryMutAct_9fa48("4818") ? {} : (stryCov_9fa48("4818"), {
        source: stryMutAct_9fa48("4819") ? () => undefined : (stryCov_9fa48("4819"), () => (window as any).trustWallet),
        name: stryMutAct_9fa48("4820") ? "" : (stryCov_9fa48("4820"), "Trust Wallet")
      }), // Use special registry if available
      stryMutAct_9fa48("4821") ? {} : (stryCov_9fa48("4821"), {
        source: stryMutAct_9fa48("4822") ? () => undefined : (stryCov_9fa48("4822"), () => Array.isArray(window._ethereumProviders) ? window._ethereumProviders.find(stryMutAct_9fa48("4823") ? () => undefined : (stryCov_9fa48("4823"), (p: any) => stryMutAct_9fa48("4824") ? p._isProxy : (stryCov_9fa48("4824"), !p._isProxy))) : undefined),
        name: stryMutAct_9fa48("4825") ? "" : (stryCov_9fa48("4825"), "Registry non-proxy")
      })]);

      // Try each provider source
      for (const {
        source,
        name
      } of providerSources) {
        if (stryMutAct_9fa48("4826")) {
          {}
        } else {
          stryCov_9fa48("4826");
          try {
            if (stryMutAct_9fa48("4827")) {
              {}
            } else {
              stryCov_9fa48("4827");
              const provider = source();
              if (stryMutAct_9fa48("4830") ? provider || typeof provider.request === "function" : stryMutAct_9fa48("4829") ? false : stryMutAct_9fa48("4828") ? true : (stryCov_9fa48("4828", "4829", "4830"), provider && (stryMutAct_9fa48("4832") ? typeof provider.request !== "function" : stryMutAct_9fa48("4831") ? true : (stryCov_9fa48("4831", "4832"), typeof provider.request === (stryMutAct_9fa48("4833") ? "" : (stryCov_9fa48("4833"), "function")))))) {
                if (stryMutAct_9fa48("4834")) {
                  {}
                } else {
                  stryCov_9fa48("4834");
                  return provider;
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("4835")) {
              {}
            } else {
              stryCov_9fa48("4835");
              // Continue to next provider source
              console.warn(stryMutAct_9fa48("4836") ? `` : (stryCov_9fa48("4836"), `Error checking provider ${name}:`), error);
              continue;
            }
          }
        }
      }

      // No provider found
      console.warn(stryMutAct_9fa48("4837") ? "" : (stryCov_9fa48("4837"), "No compatible Ethereum provider found"));
      return undefined;
    }
  }

  /**
   * Initialize the BrowserProvider (async method for explicit calls)
   */
  public async setupProvider(): Promise<void> {
    if (stryMutAct_9fa48("4838")) {
      {}
    } else {
      stryCov_9fa48("4838");
      try {
        if (stryMutAct_9fa48("4839")) {
          {}
        } else {
          stryCov_9fa48("4839");
          if (stryMutAct_9fa48("4842") ? typeof window === "undefined" : stryMutAct_9fa48("4841") ? false : stryMutAct_9fa48("4840") ? true : (stryCov_9fa48("4840", "4841", "4842"), typeof window !== (stryMutAct_9fa48("4843") ? "" : (stryCov_9fa48("4843"), "undefined")))) {
            if (stryMutAct_9fa48("4844")) {
              {}
            } else {
              stryCov_9fa48("4844");
              // Check if ethereum is available from any provider
              const ethereumProvider = this.getAvailableEthereumProvider();
              if (stryMutAct_9fa48("4846") ? false : stryMutAct_9fa48("4845") ? true : (stryCov_9fa48("4845", "4846"), ethereumProvider)) {
                if (stryMutAct_9fa48("4847")) {
                  {}
                } else {
                  stryCov_9fa48("4847");
                  this.provider = new ethers.BrowserProvider(ethereumProvider as ethers.Eip1193Provider);
                }
              } else {
                if (stryMutAct_9fa48("4848")) {
                  {}
                } else {
                  stryCov_9fa48("4848");
                  console.warn(stryMutAct_9fa48("4849") ? "" : (stryCov_9fa48("4849"), "No compatible Ethereum provider found"));
                }
              }
            }
          } else {
            if (stryMutAct_9fa48("4850")) {
              {}
            } else {
              stryCov_9fa48("4850");
              console.warn(stryMutAct_9fa48("4851") ? "" : (stryCov_9fa48("4851"), "Window object not available (non-browser environment)"));
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("4852")) {
          {}
        } else {
          stryCov_9fa48("4852");
          console.error(stryMutAct_9fa48("4853") ? "" : (stryCov_9fa48("4853"), "Failed to initialize BrowserProvider"), error);
        }
      }
    }
  }

  /**
   * Setup MetaMask event listeners using BrowserProvider
   */
  private setupEventListeners(): void {
    if (stryMutAct_9fa48("4854")) {
      {}
    } else {
      stryCov_9fa48("4854");
      if (stryMutAct_9fa48("4856") ? false : stryMutAct_9fa48("4855") ? true : (stryCov_9fa48("4855", "4856"), this.provider)) {
        if (stryMutAct_9fa48("4857")) {
          {}
        } else {
          stryCov_9fa48("4857");
          // Listen for network changes through ethers provider
          this.provider.on(stryMutAct_9fa48("4858") ? "" : (stryCov_9fa48("4858"), "network"), (newNetwork: any, oldNetwork: any) => {
            if (stryMutAct_9fa48("4859")) {
              {}
            } else {
              stryCov_9fa48("4859");
              this.emit(stryMutAct_9fa48("4860") ? "" : (stryCov_9fa48("4860"), "chainChanged"), newNetwork);
            }
          });

          // Listen for account changes through the detected provider
          try {
            if (stryMutAct_9fa48("4861")) {
              {}
            } else {
              stryCov_9fa48("4861");
              const ethereumProvider = this.getAvailableEthereumProvider();
              if (stryMutAct_9fa48("4864") ? ethereumProvider.on : stryMutAct_9fa48("4863") ? false : stryMutAct_9fa48("4862") ? true : (stryCov_9fa48("4862", "4863", "4864"), ethereumProvider?.on)) {
                if (stryMutAct_9fa48("4865")) {
                  {}
                } else {
                  stryCov_9fa48("4865");
                  ethereumProvider.on(stryMutAct_9fa48("4866") ? "" : (stryCov_9fa48("4866"), "accountsChanged"), (accounts: string[]) => {
                    if (stryMutAct_9fa48("4867")) {
                      {}
                    } else {
                      stryCov_9fa48("4867");
                      this.emit(stryMutAct_9fa48("4868") ? "" : (stryCov_9fa48("4868"), "accountsChanged"), accounts);
                    }
                  });

                  // Also listen for chainChanged events directly
                  ethereumProvider.on(stryMutAct_9fa48("4869") ? "" : (stryCov_9fa48("4869"), "chainChanged"), (chainId: string) => {
                    if (stryMutAct_9fa48("4870")) {
                      {}
                    } else {
                      stryCov_9fa48("4870");
                      this.emit(stryMutAct_9fa48("4871") ? "" : (stryCov_9fa48("4871"), "chainChanged"), stryMutAct_9fa48("4872") ? {} : (stryCov_9fa48("4872"), {
                        chainId
                      }));
                    }
                  });
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("4873")) {
              {}
            } else {
              stryCov_9fa48("4873");
              console.warn(stryMutAct_9fa48("4874") ? "" : (stryCov_9fa48("4874"), "Failed to setup account change listeners"), error);
            }
          }
        }
      }
    }
  }

  /**
   * Cleanup event listeners
   */
  public cleanup(): void {
    if (stryMutAct_9fa48("4875")) {
      {}
    } else {
      stryCov_9fa48("4875");
      if (stryMutAct_9fa48("4877") ? false : stryMutAct_9fa48("4876") ? true : (stryCov_9fa48("4876", "4877"), this.provider)) {
        if (stryMutAct_9fa48("4878")) {
          {}
        } else {
          stryCov_9fa48("4878");
          this.provider.removeAllListeners();
        }
      }
      this.removeAllListeners();
    }
  }

  /**
   * Get cached signature if valid
   */
  private getCachedSignature(address: string): string | null {
    if (stryMutAct_9fa48("4879")) {
      {}
    } else {
      stryCov_9fa48("4879");
      const cached = this.signatureCache.get(address);
      if (stryMutAct_9fa48("4882") ? false : stryMutAct_9fa48("4881") ? true : stryMutAct_9fa48("4880") ? cached : (stryCov_9fa48("4880", "4881", "4882"), !cached)) return null;
      const now = Date.now();
      if (stryMutAct_9fa48("4886") ? now - cached.timestamp <= this.config.cacheDuration! : stryMutAct_9fa48("4885") ? now - cached.timestamp >= this.config.cacheDuration! : stryMutAct_9fa48("4884") ? false : stryMutAct_9fa48("4883") ? true : (stryCov_9fa48("4883", "4884", "4885", "4886"), (stryMutAct_9fa48("4887") ? now + cached.timestamp : (stryCov_9fa48("4887"), now - cached.timestamp)) > this.config.cacheDuration!)) {
        if (stryMutAct_9fa48("4888")) {
          {}
        } else {
          stryCov_9fa48("4888");
          this.signatureCache.delete(address);
          return null;
        }
      }

      // Check for invalid/empty signature
      if (stryMutAct_9fa48("4891") ? (!cached.signature || typeof cached.signature !== "string") && cached.signature.length < 16 : stryMutAct_9fa48("4890") ? false : stryMutAct_9fa48("4889") ? true : (stryCov_9fa48("4889", "4890", "4891"), (stryMutAct_9fa48("4893") ? !cached.signature && typeof cached.signature !== "string" : stryMutAct_9fa48("4892") ? false : (stryCov_9fa48("4892", "4893"), (stryMutAct_9fa48("4894") ? cached.signature : (stryCov_9fa48("4894"), !cached.signature)) || (stryMutAct_9fa48("4896") ? typeof cached.signature === "string" : stryMutAct_9fa48("4895") ? false : (stryCov_9fa48("4895", "4896"), typeof cached.signature !== (stryMutAct_9fa48("4897") ? "" : (stryCov_9fa48("4897"), "string")))))) || (stryMutAct_9fa48("4900") ? cached.signature.length >= 16 : stryMutAct_9fa48("4899") ? cached.signature.length <= 16 : stryMutAct_9fa48("4898") ? false : (stryCov_9fa48("4898", "4899", "4900"), cached.signature.length < 16)))) {
        if (stryMutAct_9fa48("4901")) {
          {}
        } else {
          stryCov_9fa48("4901");
          console.warn(stryMutAct_9fa48("4902") ? `` : (stryCov_9fa48("4902"), `Invalid cached signature for address ${address} (length: ${cached.signature ? cached.signature.length : 0}), deleting from cache.`));
          this.signatureCache.delete(address);
          return null;
        }
      }
      return cached.signature;
    }
  }

  /**
   * Cache signature
   */
  private cacheSignature(address: string, signature: string): void {
    if (stryMutAct_9fa48("4903")) {
      {}
    } else {
      stryCov_9fa48("4903");
      this.signatureCache.set(address, stryMutAct_9fa48("4904") ? {} : (stryCov_9fa48("4904"), {
        signature,
        timestamp: Date.now(),
        address
      }));
    }
  }

  /**
   * Validates that the address is valid
   */
  private validateAddress(address: string | null | undefined): string {
    if (stryMutAct_9fa48("4905")) {
      {}
    } else {
      stryCov_9fa48("4905");
      if (stryMutAct_9fa48("4908") ? false : stryMutAct_9fa48("4907") ? true : stryMutAct_9fa48("4906") ? address : (stryCov_9fa48("4906", "4907", "4908"), !address)) {
        if (stryMutAct_9fa48("4909")) {
          {}
        } else {
          stryCov_9fa48("4909");
          throw new Error(stryMutAct_9fa48("4910") ? "" : (stryCov_9fa48("4910"), "Address not provided"));
        }
      }
      try {
        if (stryMutAct_9fa48("4911")) {
          {}
        } else {
          stryCov_9fa48("4911");
          const normalizedAddress = stryMutAct_9fa48("4913") ? String(address).toLowerCase() : stryMutAct_9fa48("4912") ? String(address).trim().toUpperCase() : (stryCov_9fa48("4912", "4913"), String(address).trim().toLowerCase());
          if (stryMutAct_9fa48("4916") ? false : stryMutAct_9fa48("4915") ? true : stryMutAct_9fa48("4914") ? ethers.isAddress(normalizedAddress) : (stryCov_9fa48("4914", "4915", "4916"), !ethers.isAddress(normalizedAddress))) {
            if (stryMutAct_9fa48("4917")) {
              {}
            } else {
              stryCov_9fa48("4917");
              throw new Error(stryMutAct_9fa48("4918") ? "" : (stryCov_9fa48("4918"), "Invalid address format"));
            }
          }
          return ethers.getAddress(normalizedAddress);
        }
      } catch (error) {
        if (stryMutAct_9fa48("4919")) {
          {}
        } else {
          stryCov_9fa48("4919");
          ErrorHandler.handle(ErrorType.VALIDATION, stryMutAct_9fa48("4920") ? "" : (stryCov_9fa48("4920"), "INVALID_ADDRESS"), stryMutAct_9fa48("4921") ? "" : (stryCov_9fa48("4921"), "Invalid Ethereum address provided"), error);
          throw error;
        }
      }
    }
  }

  /**
   * Connects to MetaMask with retry logic using BrowserProvider
   */
  async connectMetaMask(): Promise<ConnectionResult> {
    if (stryMutAct_9fa48("4922")) {
      {}
    } else {
      stryCov_9fa48("4922");
      try {
        if (stryMutAct_9fa48("4923")) {
          {}
        } else {
          stryCov_9fa48("4923");
          if (stryMutAct_9fa48("4926") ? false : stryMutAct_9fa48("4925") ? true : stryMutAct_9fa48("4924") ? this.provider : (stryCov_9fa48("4924", "4925", "4926"), !this.provider)) {
            if (stryMutAct_9fa48("4927")) {
              {}
            } else {
              stryCov_9fa48("4927");
              this.initProvider();
              if (stryMutAct_9fa48("4930") ? false : stryMutAct_9fa48("4929") ? true : stryMutAct_9fa48("4928") ? this.provider : (stryCov_9fa48("4928", "4929", "4930"), !this.provider)) {
                if (stryMutAct_9fa48("4931")) {
                  {}
                } else {
                  stryCov_9fa48("4931");
                  throw new Error(stryMutAct_9fa48("4932") ? "" : (stryCov_9fa48("4932"), "MetaMask is not available. Please install MetaMask extension."));
                }
              }
            }
          }

          // First check if we can get the provider
          const ethereumProvider = this.getAvailableEthereumProvider();
          if (stryMutAct_9fa48("4935") ? false : stryMutAct_9fa48("4934") ? true : stryMutAct_9fa48("4933") ? ethereumProvider : (stryCov_9fa48("4933", "4934", "4935"), !ethereumProvider)) {
            if (stryMutAct_9fa48("4936")) {
              {}
            } else {
              stryCov_9fa48("4936");
              throw new Error(stryMutAct_9fa48("4937") ? "" : (stryCov_9fa48("4937"), "No compatible Ethereum provider found"));
            }
          }

          // Richiedi esplicitamente l'accesso all'account MetaMask
          let accounts: string[] = stryMutAct_9fa48("4938") ? ["Stryker was here"] : (stryCov_9fa48("4938"), []);

          // Try multiple methods of requesting accounts for compatibility
          try {
            if (stryMutAct_9fa48("4939")) {
              {}
            } else {
              stryCov_9fa48("4939");
              // Try the provider we found first
              accounts = await ethereumProvider.request(stryMutAct_9fa48("4940") ? {} : (stryCov_9fa48("4940"), {
                method: stryMutAct_9fa48("4941") ? "" : (stryCov_9fa48("4941"), "eth_requestAccounts")
              }));
            }
          } catch (requestError) {
            if (stryMutAct_9fa48("4942")) {
              {}
            } else {
              stryCov_9fa48("4942");
              console.warn(stryMutAct_9fa48("4943") ? "" : (stryCov_9fa48("4943"), "First account request failed, trying window.ethereum:"), requestError);

              // Fallback to window.ethereum if available and different
              if (stryMutAct_9fa48("4946") ? window.ethereum || window.ethereum !== ethereumProvider : stryMutAct_9fa48("4945") ? false : stryMutAct_9fa48("4944") ? true : (stryCov_9fa48("4944", "4945", "4946"), window.ethereum && (stryMutAct_9fa48("4948") ? window.ethereum === ethereumProvider : stryMutAct_9fa48("4947") ? true : (stryCov_9fa48("4947", "4948"), window.ethereum !== ethereumProvider)))) {
                if (stryMutAct_9fa48("4949")) {
                  {}
                } else {
                  stryCov_9fa48("4949");
                  try {
                    if (stryMutAct_9fa48("4950")) {
                      {}
                    } else {
                      stryCov_9fa48("4950");
                      accounts = await window.ethereum.request(stryMutAct_9fa48("4951") ? {} : (stryCov_9fa48("4951"), {
                        method: stryMutAct_9fa48("4952") ? "" : (stryCov_9fa48("4952"), "eth_requestAccounts")
                      }));
                    }
                  } catch (fallbackError) {
                    if (stryMutAct_9fa48("4953")) {
                      {}
                    } else {
                      stryCov_9fa48("4953");
                      console.error(stryMutAct_9fa48("4954") ? "" : (stryCov_9fa48("4954"), "All account request methods failed"), fallbackError);
                      throw new Error(stryMutAct_9fa48("4955") ? "" : (stryCov_9fa48("4955"), "User denied account access"));
                    }
                  }
                }
              } else {
                if (stryMutAct_9fa48("4956")) {
                  {}
                } else {
                  stryCov_9fa48("4956");
                  throw new Error(stryMutAct_9fa48("4957") ? "" : (stryCov_9fa48("4957"), "User denied account access"));
                }
              }
            }
          }
          if (stryMutAct_9fa48("4960") ? !accounts && accounts.length === 0 : stryMutAct_9fa48("4959") ? false : stryMutAct_9fa48("4958") ? true : (stryCov_9fa48("4958", "4959", "4960"), (stryMutAct_9fa48("4961") ? accounts : (stryCov_9fa48("4961"), !accounts)) || (stryMutAct_9fa48("4963") ? accounts.length !== 0 : stryMutAct_9fa48("4962") ? false : (stryCov_9fa48("4962", "4963"), accounts.length === 0)))) {}
          for (let attempt = 1; stryMutAct_9fa48("4966") ? attempt > this.config.maxRetries! : stryMutAct_9fa48("4965") ? attempt < this.config.maxRetries! : stryMutAct_9fa48("4964") ? false : (stryCov_9fa48("4964", "4965", "4966"), attempt <= this.config.maxRetries!); stryMutAct_9fa48("4967") ? attempt-- : (stryCov_9fa48("4967"), attempt++)) {
            if (stryMutAct_9fa48("4968")) {
              {}
            } else {
              stryCov_9fa48("4968");
              try {
                if (stryMutAct_9fa48("4969")) {
                  {}
                } else {
                  stryCov_9fa48("4969");
                  const signer = await this.provider.getSigner();
                  const address = await signer.getAddress();
                  if (stryMutAct_9fa48("4972") ? false : stryMutAct_9fa48("4971") ? true : stryMutAct_9fa48("4970") ? address : (stryCov_9fa48("4970", "4971", "4972"), !address)) {
                    if (stryMutAct_9fa48("4973")) {
                      {}
                    } else {
                      stryCov_9fa48("4973");
                      console.error(stryMutAct_9fa48("4974") ? "" : (stryCov_9fa48("4974"), "No address returned from signer"));
                      throw new Error(stryMutAct_9fa48("4975") ? "" : (stryCov_9fa48("4975"), "No address returned from signer"));
                    }
                  }
                  this.emit(stryMutAct_9fa48("4976") ? "" : (stryCov_9fa48("4976"), "connected"), stryMutAct_9fa48("4977") ? {} : (stryCov_9fa48("4977"), {
                    address
                  }));
                  return stryMutAct_9fa48("4978") ? {} : (stryCov_9fa48("4978"), {
                    success: stryMutAct_9fa48("4979") ? false : (stryCov_9fa48("4979"), true),
                    address
                  });
                }
              } catch (error: any) {
                if (stryMutAct_9fa48("4980")) {
                  {}
                } else {
                  stryCov_9fa48("4980");
                  console.error(stryMutAct_9fa48("4981") ? `` : (stryCov_9fa48("4981"), `Attempt ${attempt} failed:`), error);
                  if (stryMutAct_9fa48("4984") ? attempt !== this.config.maxRetries! : stryMutAct_9fa48("4983") ? false : stryMutAct_9fa48("4982") ? true : (stryCov_9fa48("4982", "4983", "4984"), attempt === this.config.maxRetries!)) {
                    if (stryMutAct_9fa48("4985")) {
                      {}
                    } else {
                      stryCov_9fa48("4985");
                      throw error;
                    }
                  }

                  // Wait before retrying
                  await new Promise(stryMutAct_9fa48("4986") ? () => undefined : (stryCov_9fa48("4986"), resolve => setTimeout(resolve, this.config.retryDelay)));
                }
              }
            }
          }
          throw new Error(stryMutAct_9fa48("4987") ? "" : (stryCov_9fa48("4987"), "Failed to get signer after all attempts"));
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("4988")) {
          {}
        } else {
          stryCov_9fa48("4988");
          console.error(stryMutAct_9fa48("4989") ? "" : (stryCov_9fa48("4989"), "Failed to connect to MetaMask:"), error);
          ErrorHandler.handle(ErrorType.WEBAUTHN, stryMutAct_9fa48("4990") ? "" : (stryCov_9fa48("4990"), "METAMASK_CONNECTION_ERROR"), stryMutAct_9fa48("4991") ? error.message && "Unknown error while connecting to MetaMask" : (stryCov_9fa48("4991"), error.message ?? (stryMutAct_9fa48("4992") ? "" : (stryCov_9fa48("4992"), "Unknown error while connecting to MetaMask"))), error);
          return stryMutAct_9fa48("4993") ? {} : (stryCov_9fa48("4993"), {
            success: stryMutAct_9fa48("4994") ? true : (stryCov_9fa48("4994"), false),
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Generates credentials for the given address
   */
  async generateCredentials(address: string): Promise<ISEAPair> {
    if (stryMutAct_9fa48("4995")) {
      {}
    } else {
      stryCov_9fa48("4995");
      try {
        if (stryMutAct_9fa48("4996")) {
          {}
        } else {
          stryCov_9fa48("4996");
          const validAddress = this.validateAddress(address);

          // Check if we have a cached signature
          const cachedSignature = this.getCachedSignature(validAddress);
          if (stryMutAct_9fa48("4998") ? false : stryMutAct_9fa48("4997") ? true : (stryCov_9fa48("4997", "4998"), cachedSignature)) {
            if (stryMutAct_9fa48("4999")) {
              {}
            } else {
              stryCov_9fa48("4999");
              return this.generateCredentialsFromSignature(validAddress, cachedSignature);
            }
          }

          // Request signature with timeout
          let signature: string;
          try {
            if (stryMutAct_9fa48("5000")) {
              {}
            } else {
              stryCov_9fa48("5000");
              signature = await this.requestSignatureWithTimeout(validAddress, this.MESSAGE_TO_SIGN, this.config.timeout);
            }
          } catch (signingError: any) {
            if (stryMutAct_9fa48("5001")) {
              {}
            } else {
              stryCov_9fa48("5001");
              // Gestione del fallimento di firma
              console.warn(stryMutAct_9fa48("5002") ? `` : (stryCov_9fa48("5002"), `Failed to get signature: ${signingError}. Using fallback method.`));
              throw signingError;
            }
          }

          // Cache the signature
          this.cacheSignature(validAddress, signature);
          return this.generateCredentialsFromSignature(validAddress, signature);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5003")) {
          {}
        } else {
          stryCov_9fa48("5003");
          ErrorHandler.handle(ErrorType.WEBAUTHN, stryMutAct_9fa48("5004") ? "" : (stryCov_9fa48("5004"), "CREDENTIALS_GENERATION_ERROR"), stryMutAct_9fa48("5005") ? error.message && "Error generating MetaMask credentials" : (stryCov_9fa48("5005"), error.message ?? (stryMutAct_9fa48("5006") ? "" : (stryCov_9fa48("5006"), "Error generating MetaMask credentials"))), error);
          throw error;
        }
      }
    }
  }

  /**
   * Generates credentials from a signature
   */
  private async generateCredentialsFromSignature(address: string, signature: string): Promise<ISEAPair> {
    if (stryMutAct_9fa48("5007")) {
      {}
    } else {
      stryCov_9fa48("5007");
      const hashedAddress = ethers.keccak256(ethers.toUtf8Bytes(address));
      const salt = stryMutAct_9fa48("5008") ? `` : (stryCov_9fa48("5008"), `${address}_${signature}`);
      return await derive(hashedAddress, salt, stryMutAct_9fa48("5009") ? {} : (stryCov_9fa48("5009"), {
        includeP256: stryMutAct_9fa48("5010") ? false : (stryCov_9fa48("5010"), true)
      }));
    }
  }

  /**
   * Generates fallback credentials (for testing/development)
   */
  private generateFallbackCredentials(address: string): Web3ConnectorCredentials {
    if (stryMutAct_9fa48("5011")) {
      {}
    } else {
      stryCov_9fa48("5011");
      console.warn(stryMutAct_9fa48("5012") ? "" : (stryCov_9fa48("5012"), "Using fallback credentials generation for address:"), address);

      // Generate a deterministic but insecure fallback
      const fallbackSignature = ethers.keccak256(ethers.toUtf8Bytes(address + (stryMutAct_9fa48("5013") ? "" : (stryCov_9fa48("5013"), "fallback"))));
      return stryMutAct_9fa48("5014") ? {} : (stryCov_9fa48("5014"), {
        username: stryMutAct_9fa48("5015") ? address.toUpperCase() : (stryCov_9fa48("5015"), address.toLowerCase()),
        password: fallbackSignature,
        message: this.MESSAGE_TO_SIGN,
        signature: fallbackSignature
      });
    }
  }

  /**
   * Checks if MetaMask is available
   */
  public static isMetaMaskAvailable(): boolean {
    if (stryMutAct_9fa48("5016")) {
      {}
    } else {
      stryCov_9fa48("5016");
      if (stryMutAct_9fa48("5019") ? typeof window !== "undefined" : stryMutAct_9fa48("5018") ? false : stryMutAct_9fa48("5017") ? true : (stryCov_9fa48("5017", "5018", "5019"), typeof window === (stryMutAct_9fa48("5020") ? "" : (stryCov_9fa48("5020"), "undefined")))) {
        if (stryMutAct_9fa48("5021")) {
          {}
        } else {
          stryCov_9fa48("5021");
          return stryMutAct_9fa48("5022") ? true : (stryCov_9fa48("5022"), false);
        }
      }

      // Check multiple possible sources
      const sources = stryMutAct_9fa48("5023") ? [] : (stryCov_9fa48("5023"), [stryMutAct_9fa48("5024") ? () => undefined : (stryCov_9fa48("5024"), () => window.ethereum), stryMutAct_9fa48("5025") ? () => undefined : (stryCov_9fa48("5025"), () => stryMutAct_9fa48("5026") ? (window as any).web3.currentProvider : (stryCov_9fa48("5026"), (window as any).web3?.currentProvider)), stryMutAct_9fa48("5027") ? () => undefined : (stryCov_9fa48("5027"), () => (window as any).metamask), stryMutAct_9fa48("5028") ? () => undefined : (stryCov_9fa48("5028"), () => stryMutAct_9fa48("5029") ? window._ethereumProviders[0] : (stryCov_9fa48("5029"), window._ethereumProviders?.[0]))]);
      for (const source of sources) {
        if (stryMutAct_9fa48("5030")) {
          {}
        } else {
          stryCov_9fa48("5030");
          try {
            if (stryMutAct_9fa48("5031")) {
              {}
            } else {
              stryCov_9fa48("5031");
              const provider = source();
              if (stryMutAct_9fa48("5034") ? provider || typeof provider.request === "function" : stryMutAct_9fa48("5033") ? false : stryMutAct_9fa48("5032") ? true : (stryCov_9fa48("5032", "5033", "5034"), provider && (stryMutAct_9fa48("5036") ? typeof provider.request !== "function" : stryMutAct_9fa48("5035") ? true : (stryCov_9fa48("5035", "5036"), typeof provider.request === (stryMutAct_9fa48("5037") ? "" : (stryCov_9fa48("5037"), "function")))))) {
                if (stryMutAct_9fa48("5038")) {
                  {}
                } else {
                  stryCov_9fa48("5038");
                  return stryMutAct_9fa48("5039") ? false : (stryCov_9fa48("5039"), true);
                }
              }
            }
          } catch {
            // Continue to next source
          }
        }
      }
      return stryMutAct_9fa48("5040") ? true : (stryCov_9fa48("5040"), false);
    }
  }

  /**
   * Requests signature with timeout
   */
  private requestSignatureWithTimeout(address: string, message: string, timeout: number = 30000): Promise<string> {
    if (stryMutAct_9fa48("5041")) {
      {}
    } else {
      stryCov_9fa48("5041");
      return new Promise((resolve, reject) => {
        if (stryMutAct_9fa48("5042")) {
          {}
        } else {
          stryCov_9fa48("5042");
          const timeoutId = setTimeout(() => {
            if (stryMutAct_9fa48("5043")) {
              {}
            } else {
              stryCov_9fa48("5043");
              reject(new Error(stryMutAct_9fa48("5044") ? "" : (stryCov_9fa48("5044"), "Signature request timed out")));
            }
          }, timeout);
          const cleanup = () => {
            if (stryMutAct_9fa48("5045")) {
              {}
            } else {
              stryCov_9fa48("5045");
              clearTimeout(timeoutId);
            }
          };
          const errorHandler = (error: any) => {
            if (stryMutAct_9fa48("5046")) {
              {}
            } else {
              stryCov_9fa48("5046");
              cleanup();
              reject(error);
            }
          };
          const initializeAndSign = async () => {
            if (stryMutAct_9fa48("5047")) {
              {}
            } else {
              stryCov_9fa48("5047");
              try {
                if (stryMutAct_9fa48("5048")) {
                  {}
                } else {
                  stryCov_9fa48("5048");
                  const signer = await this.provider!.getSigner();
                  const signerAddress = await signer.getAddress();

                  // Verify the signer address matches the expected address
                  if (stryMutAct_9fa48("5051") ? signerAddress.toLowerCase() === address.toLowerCase() : stryMutAct_9fa48("5050") ? false : stryMutAct_9fa48("5049") ? true : (stryCov_9fa48("5049", "5050", "5051"), (stryMutAct_9fa48("5052") ? signerAddress.toUpperCase() : (stryCov_9fa48("5052"), signerAddress.toLowerCase())) !== (stryMutAct_9fa48("5053") ? address.toUpperCase() : (stryCov_9fa48("5053"), address.toLowerCase())))) {
                    if (stryMutAct_9fa48("5054")) {
                      {}
                    } else {
                      stryCov_9fa48("5054");
                      throw new Error(stryMutAct_9fa48("5055") ? `` : (stryCov_9fa48("5055"), `Signer address (${signerAddress}) does not match expected address (${address})`));
                    }
                  }
                  const signature = await signer.signMessage(message);
                  cleanup();
                  resolve(signature);
                }
              } catch (error: any) {
                if (stryMutAct_9fa48("5056")) {
                  {}
                } else {
                  stryCov_9fa48("5056");
                  console.error(stryMutAct_9fa48("5057") ? "" : (stryCov_9fa48("5057"), "Failed to request signature:"), error);
                  errorHandler(error);
                }
              }
            }
          };
          initializeAndSign();
        }
      });
    }
  }

  /**
   * Checks if the connector is available
   */
  isAvailable(): boolean {
    if (stryMutAct_9fa48("5058")) {
      {}
    } else {
      stryCov_9fa48("5058");
      return Web3Connector.isMetaMaskAvailable();
    }
  }

  /**
   * Sets a custom provider for testing/development
   */
  public setCustomProvider(rpcUrl: string, privateKey: string): void {
    if (stryMutAct_9fa48("5059")) {
      {}
    } else {
      stryCov_9fa48("5059");
      try {
        if (stryMutAct_9fa48("5060")) {
          {}
        } else {
          stryCov_9fa48("5060");
          this.customProvider = new ethers.JsonRpcProvider(rpcUrl);
          this.customWallet = new ethers.Wallet(privateKey, this.customProvider);
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5061")) {
          {}
        } else {
          stryCov_9fa48("5061");
          throw new Error(stryMutAct_9fa48("5062") ? `` : (stryCov_9fa48("5062"), `Error configuring provider: ${stryMutAct_9fa48("5063") ? error.message && "Unknown error" : (stryCov_9fa48("5063"), error.message ?? (stryMutAct_9fa48("5064") ? "" : (stryCov_9fa48("5064"), "Unknown error")))}`));
        }
      }
    }
  }

  /**
   * Get active signer instance using BrowserProvider
   */
  public async getSigner(): Promise<ethers.Signer> {
    if (stryMutAct_9fa48("5065")) {
      {}
    } else {
      stryCov_9fa48("5065");
      try {
        if (stryMutAct_9fa48("5066")) {
          {}
        } else {
          stryCov_9fa48("5066");
          if (stryMutAct_9fa48("5068") ? false : stryMutAct_9fa48("5067") ? true : (stryCov_9fa48("5067", "5068"), this.customWallet)) {
            if (stryMutAct_9fa48("5069")) {
              {}
            } else {
              stryCov_9fa48("5069");
              return this.customWallet;
            }
          }
          if (stryMutAct_9fa48("5072") ? false : stryMutAct_9fa48("5071") ? true : stryMutAct_9fa48("5070") ? this.provider : (stryCov_9fa48("5070", "5071", "5072"), !this.provider)) {
            if (stryMutAct_9fa48("5073")) {
              {}
            } else {
              stryCov_9fa48("5073");
              this.initProvider();
            }
          }
          if (stryMutAct_9fa48("5076") ? false : stryMutAct_9fa48("5075") ? true : stryMutAct_9fa48("5074") ? this.provider : (stryCov_9fa48("5074", "5075", "5076"), !this.provider)) {
            if (stryMutAct_9fa48("5077")) {
              {}
            } else {
              stryCov_9fa48("5077");
              throw new Error(stryMutAct_9fa48("5078") ? "" : (stryCov_9fa48("5078"), "Provider not initialized"));
            }
          }
          return await this.provider.getSigner();
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5079")) {
          {}
        } else {
          stryCov_9fa48("5079");
          throw new Error(stryMutAct_9fa48("5080") ? `` : (stryCov_9fa48("5080"), `Unable to get Ethereum signer: ${stryMutAct_9fa48("5083") ? error.message && "Unknown error" : stryMutAct_9fa48("5082") ? false : stryMutAct_9fa48("5081") ? true : (stryCov_9fa48("5081", "5082", "5083"), error.message || (stryMutAct_9fa48("5084") ? "" : (stryCov_9fa48("5084"), "Unknown error")))}`));
        }
      }
    }
  }

  /**
   * Get active provider instance using BrowserProvider
   */
  public async getProvider(): Promise<ethers.JsonRpcProvider | ethers.BrowserProvider> {
    if (stryMutAct_9fa48("5085")) {
      {}
    } else {
      stryCov_9fa48("5085");
      if (stryMutAct_9fa48("5087") ? false : stryMutAct_9fa48("5086") ? true : (stryCov_9fa48("5086", "5087"), this.customProvider)) {
        if (stryMutAct_9fa48("5088")) {
          {}
        } else {
          stryCov_9fa48("5088");
          return this.customProvider;
        }
      }
      if (stryMutAct_9fa48("5091") ? false : stryMutAct_9fa48("5090") ? true : stryMutAct_9fa48("5089") ? this.provider : (stryCov_9fa48("5089", "5090", "5091"), !this.provider)) {
        if (stryMutAct_9fa48("5092")) {
          {}
        } else {
          stryCov_9fa48("5092");
          this.initProvider();
        }
      }
      return this.provider as ethers.JsonRpcProvider | ethers.BrowserProvider;
    }
  }

  /**
   * Generate deterministic password from signature
   * @param signature - Cryptographic signature
   * @returns 64-character hex string
   * @throws {Error} For invalid signature
   */
  public async generatePassword(signature: string): Promise<string> {
    if (stryMutAct_9fa48("5093")) {
      {}
    } else {
      stryCov_9fa48("5093");
      if (stryMutAct_9fa48("5096") ? false : stryMutAct_9fa48("5095") ? true : stryMutAct_9fa48("5094") ? signature : (stryCov_9fa48("5094", "5095", "5096"), !signature)) {
        if (stryMutAct_9fa48("5097")) {
          {}
        } else {
          stryCov_9fa48("5097");
          throw new Error(stryMutAct_9fa48("5098") ? "" : (stryCov_9fa48("5098"), "Invalid signature"));
        }
      }
      const hash = ethers.keccak256(ethers.toUtf8Bytes(signature));
      return stryMutAct_9fa48("5099") ? hash : (stryCov_9fa48("5099"), hash.slice(2, 66)); // Remove 0x and use first 32 bytes
    }
  }

  /**
   * Verify message signature
   * @param message - Original signed message
   * @param signature - Cryptographic signature
   * @returns Recovered Ethereum address
   * @throws {Error} For invalid inputs
   */
  public async verifySignature(message: string, signature: string): Promise<string> {
    if (stryMutAct_9fa48("5100")) {
      {}
    } else {
      stryCov_9fa48("5100");
      if (stryMutAct_9fa48("5103") ? !message && !signature : stryMutAct_9fa48("5102") ? false : stryMutAct_9fa48("5101") ? true : (stryCov_9fa48("5101", "5102", "5103"), (stryMutAct_9fa48("5104") ? message : (stryCov_9fa48("5104"), !message)) || (stryMutAct_9fa48("5105") ? signature : (stryCov_9fa48("5105"), !signature)))) {
        if (stryMutAct_9fa48("5106")) {
          {}
        } else {
          stryCov_9fa48("5106");
          throw new Error(stryMutAct_9fa48("5107") ? "" : (stryCov_9fa48("5107"), "Invalid message or signature"));
        }
      }
      try {
        if (stryMutAct_9fa48("5108")) {
          {}
        } else {
          stryCov_9fa48("5108");
          return ethers.verifyMessage(message, signature);
        }
      } catch (error) {
        if (stryMutAct_9fa48("5109")) {
          {}
        } else {
          stryCov_9fa48("5109");
          throw new Error(stryMutAct_9fa48("5110") ? "" : (stryCov_9fa48("5110"), "Invalid message or signature"));
        }
      }
    }
  }

  /**
   * Get browser-based Ethereum signer
   * @returns Browser provider signer
   * @throws {Error} If MetaMask not detected
   */
  public async getEthereumSigner(): Promise<ethers.Signer> {
    if (stryMutAct_9fa48("5111")) {
      {}
    } else {
      stryCov_9fa48("5111");
      if (stryMutAct_9fa48("5114") ? false : stryMutAct_9fa48("5113") ? true : stryMutAct_9fa48("5112") ? Web3Connector.isMetaMaskAvailable() : (stryCov_9fa48("5112", "5113", "5114"), !Web3Connector.isMetaMaskAvailable())) {
        if (stryMutAct_9fa48("5115")) {
          {}
        } else {
          stryCov_9fa48("5115");
          throw new Error(stryMutAct_9fa48("5116") ? "" : (stryCov_9fa48("5116"), "MetaMask not found. Please install MetaMask to continue."));
        }
      }
      try {
        if (stryMutAct_9fa48("5117")) {
          {}
        } else {
          stryCov_9fa48("5117");
          const ethereum = window.ethereum as EthereumProvider;
          await ethereum.request(stryMutAct_9fa48("5118") ? {} : (stryCov_9fa48("5118"), {
            method: stryMutAct_9fa48("5119") ? "" : (stryCov_9fa48("5119"), "eth_requestAccounts")
          }));
          const provider = new ethers.BrowserProvider(ethereum);
          return provider.getSigner();
        }
      } catch (error: any) {
        if (stryMutAct_9fa48("5120")) {
          {}
        } else {
          stryCov_9fa48("5120");
          throw new Error(stryMutAct_9fa48("5121") ? `` : (stryCov_9fa48("5121"), `Error accessing MetaMask: ${stryMutAct_9fa48("5122") ? error.message && "Unknown error" : (stryCov_9fa48("5122"), error.message ?? (stryMutAct_9fa48("5123") ? "" : (stryCov_9fa48("5123"), "Unknown error")))}`));
        }
      }
    }
  }
}
if (stryMutAct_9fa48("5126") ? typeof window === "undefined" : stryMutAct_9fa48("5125") ? false : stryMutAct_9fa48("5124") ? true : (stryCov_9fa48("5124", "5125", "5126"), typeof window !== (stryMutAct_9fa48("5127") ? "" : (stryCov_9fa48("5127"), "undefined")))) {
  if (stryMutAct_9fa48("5128")) {
    {}
  } else {
    stryCov_9fa48("5128");
    window.Web3Connector = Web3Connector;
  }
} else if (stryMutAct_9fa48("5131") ? typeof global === "undefined" : stryMutAct_9fa48("5130") ? false : stryMutAct_9fa48("5129") ? true : (stryCov_9fa48("5129", "5130", "5131"), typeof global !== (stryMutAct_9fa48("5132") ? "" : (stryCov_9fa48("5132"), "undefined")))) {
  if (stryMutAct_9fa48("5133")) {
    {}
  } else {
    stryCov_9fa48("5133");
    (global as any).Web3Connector = Web3Connector;
  }
}
export { Web3Connector };