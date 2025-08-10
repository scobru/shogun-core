/**
 * Storage implementation based on StorageMock
 * Provides a unified storage interface that works in both browser and non-browser environments
 * In browser environments, data is persisted to localStorage as a backup
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
export class ShogunStorage {
  private store: Map<string, any>;
  private isTestMode: boolean;
  private useLocalStorage: boolean;

  /**
   * Initializes storage and loads any existing keypair from localStorage if available
   */
  constructor() {
    if (stryMutAct_9fa48("6071")) {
      {}
    } else {
      stryCov_9fa48("6071");
      this.store = new Map<string, any>();
      this.isTestMode = stryMutAct_9fa48("6074") ? process.env.NODE_ENV !== "test" : stryMutAct_9fa48("6073") ? false : stryMutAct_9fa48("6072") ? true : (stryCov_9fa48("6072", "6073", "6074"), process.env.NODE_ENV === (stryMutAct_9fa48("6075") ? "" : (stryCov_9fa48("6075"), "test")));
      this.useLocalStorage = stryMutAct_9fa48("6076") ? true : (stryCov_9fa48("6076"), false);
      if (stryMutAct_9fa48("6079") ? typeof localStorage !== "undefined" || !this.isTestMode : stryMutAct_9fa48("6078") ? false : stryMutAct_9fa48("6077") ? true : (stryCov_9fa48("6077", "6078", "6079"), (stryMutAct_9fa48("6081") ? typeof localStorage === "undefined" : stryMutAct_9fa48("6080") ? true : (stryCov_9fa48("6080", "6081"), typeof localStorage !== (stryMutAct_9fa48("6082") ? "" : (stryCov_9fa48("6082"), "undefined")))) && (stryMutAct_9fa48("6083") ? this.isTestMode : (stryCov_9fa48("6083"), !this.isTestMode)))) {
        if (stryMutAct_9fa48("6084")) {
          {}
        } else {
          stryCov_9fa48("6084");
          try {
            if (stryMutAct_9fa48("6085")) {
              {}
            } else {
              stryCov_9fa48("6085");
              localStorage.setItem(stryMutAct_9fa48("6086") ? "" : (stryCov_9fa48("6086"), "_shogun_test"), stryMutAct_9fa48("6087") ? "" : (stryCov_9fa48("6087"), "_shogun_test"));
              localStorage.removeItem(stryMutAct_9fa48("6088") ? "" : (stryCov_9fa48("6088"), "_shogun_test"));
              this.useLocalStorage = stryMutAct_9fa48("6089") ? false : (stryCov_9fa48("6089"), true);
              const storedPair = localStorage.getItem(stryMutAct_9fa48("6090") ? "" : (stryCov_9fa48("6090"), "shogun_keypair"));
              if (stryMutAct_9fa48("6092") ? false : stryMutAct_9fa48("6091") ? true : (stryCov_9fa48("6091", "6092"), storedPair)) {
                if (stryMutAct_9fa48("6093")) {
                  {}
                } else {
                  stryCov_9fa48("6093");
                  this.store.set(stryMutAct_9fa48("6094") ? "" : (stryCov_9fa48("6094"), "keypair"), JSON.parse(storedPair));
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("6095")) {
              {}
            } else {
              stryCov_9fa48("6095");
              this.useLocalStorage = stryMutAct_9fa48("6096") ? true : (stryCov_9fa48("6096"), false);
              if (stryMutAct_9fa48("6099") ? false : stryMutAct_9fa48("6098") ? true : stryMutAct_9fa48("6097") ? this.isTestMode : (stryCov_9fa48("6097", "6098", "6099"), !this.isTestMode)) {
                if (stryMutAct_9fa48("6100")) {
                  {}
                } else {
                  stryCov_9fa48("6100");
                  console.error(stryMutAct_9fa48("6101") ? "" : (stryCov_9fa48("6101"), "localStorage not available:"), error);
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Gets the stored keypair asynchronously
   * @returns Promise resolving to the keypair or null if not found
   */
  async getPair(): Promise<any> {
    if (stryMutAct_9fa48("6102")) {
      {}
    } else {
      stryCov_9fa48("6102");
      return this.getPairSync();
    }
  }

  /**
   * Gets the stored keypair synchronously
   * @returns The keypair or null if not found
   */
  getPairSync(): any {
    if (stryMutAct_9fa48("6103")) {
      {}
    } else {
      stryCov_9fa48("6103");
      return stryMutAct_9fa48("6106") ? this.store.get("keypair") && null : stryMutAct_9fa48("6105") ? false : stryMutAct_9fa48("6104") ? true : (stryCov_9fa48("6104", "6105", "6106"), this.store.get(stryMutAct_9fa48("6107") ? "" : (stryCov_9fa48("6107"), "keypair")) || null);
    }
  }

  /**
   * Stores a keypair both in memory and localStorage if available
   * @param pair - The keypair to store
   */
  async setPair(pair: any): Promise<void> {
    if (stryMutAct_9fa48("6108")) {
      {}
    } else {
      stryCov_9fa48("6108");
      this.store.set(stryMutAct_9fa48("6109") ? "" : (stryCov_9fa48("6109"), "keypair"), pair);

      // Also save to localStorage in browser environments
      if (stryMutAct_9fa48("6111") ? false : stryMutAct_9fa48("6110") ? true : (stryCov_9fa48("6110", "6111"), this.useLocalStorage)) {
        if (stryMutAct_9fa48("6112")) {
          {}
        } else {
          stryCov_9fa48("6112");
          try {
            if (stryMutAct_9fa48("6113")) {
              {}
            } else {
              stryCov_9fa48("6113");
              localStorage.setItem(stryMutAct_9fa48("6114") ? "" : (stryCov_9fa48("6114"), "shogun_keypair"), JSON.stringify(pair));
            }
          } catch (error) {
            if (stryMutAct_9fa48("6115")) {
              {}
            } else {
              stryCov_9fa48("6115");
              if (stryMutAct_9fa48("6118") ? false : stryMutAct_9fa48("6117") ? true : stryMutAct_9fa48("6116") ? this.isTestMode : (stryCov_9fa48("6116", "6117", "6118"), !this.isTestMode)) {
                if (stryMutAct_9fa48("6119")) {
                  {}
                } else {
                  stryCov_9fa48("6119");
                  console.error(stryMutAct_9fa48("6120") ? "" : (stryCov_9fa48("6120"), "Error saving data to localStorage:"), error);
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Clears all stored data from both memory and localStorage
   */
  clearAll(): void {
    if (stryMutAct_9fa48("6121")) {
      {}
    } else {
      stryCov_9fa48("6121");
      this.store.clear();

      // Also clear localStorage in browser environments
      if (stryMutAct_9fa48("6123") ? false : stryMutAct_9fa48("6122") ? true : (stryCov_9fa48("6122", "6123"), this.useLocalStorage)) {
        if (stryMutAct_9fa48("6124")) {
          {}
        } else {
          stryCov_9fa48("6124");
          try {
            if (stryMutAct_9fa48("6125")) {
              {}
            } else {
              stryCov_9fa48("6125");
              localStorage.removeItem(stryMutAct_9fa48("6126") ? "" : (stryCov_9fa48("6126"), "shogun_keypair"));
            }
          } catch (error) {
            if (stryMutAct_9fa48("6127")) {
              {}
            } else {
              stryCov_9fa48("6127");
              if (stryMutAct_9fa48("6130") ? false : stryMutAct_9fa48("6129") ? true : stryMutAct_9fa48("6128") ? this.isTestMode : (stryCov_9fa48("6128", "6129", "6130"), !this.isTestMode)) {
                if (stryMutAct_9fa48("6131")) {
                  {}
                } else {
                  stryCov_9fa48("6131");
                  console.error(stryMutAct_9fa48("6132") ? "" : (stryCov_9fa48("6132"), "Error removing data from localStorage:"), error);
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Gets an item from storage
   * @param key - The key to retrieve
   * @returns The stored value as a string, or null if not found
   */
  getItem(key: string): string | null {
    if (stryMutAct_9fa48("6133")) {
      {}
    } else {
      stryCov_9fa48("6133");
      const value = this.store.get(key);
      if (stryMutAct_9fa48("6136") ? value !== undefined : stryMutAct_9fa48("6135") ? false : stryMutAct_9fa48("6134") ? true : (stryCov_9fa48("6134", "6135", "6136"), value === undefined)) {
        if (stryMutAct_9fa48("6137")) {
          {}
        } else {
          stryCov_9fa48("6137");
          return null;
        }
      }
      // If the stored value is already a string, return it directly.
      // This handles the case where a non-JSON string was set.
      if (stryMutAct_9fa48("6140") ? typeof value !== "string" : stryMutAct_9fa48("6139") ? false : stryMutAct_9fa48("6138") ? true : (stryCov_9fa48("6138", "6139", "6140"), typeof value === (stryMutAct_9fa48("6141") ? "" : (stryCov_9fa48("6141"), "string")))) {
        if (stryMutAct_9fa48("6142")) {
          {}
        } else {
          stryCov_9fa48("6142");
          return value;
        }
      }
      return JSON.stringify(value);
    }
  }

  /**
   * Stores an item in both memory and localStorage if available
   * @param key - The key to store under
   * @param value - The value to store (must be JSON stringifiable)
   */
  setItem(key: string, value: string): void {
    if (stryMutAct_9fa48("6143")) {
      {}
    } else {
      stryCov_9fa48("6143");
      try {
        if (stryMutAct_9fa48("6144")) {
          {}
        } else {
          stryCov_9fa48("6144");
          const parsedValue = JSON.parse(value);
          this.store.set(key, parsedValue);
          if (stryMutAct_9fa48("6146") ? false : stryMutAct_9fa48("6145") ? true : (stryCov_9fa48("6145", "6146"), this.useLocalStorage)) {
            if (stryMutAct_9fa48("6147")) {
              {}
            } else {
              stryCov_9fa48("6147");
              try {
                if (stryMutAct_9fa48("6148")) {
                  {}
                } else {
                  stryCov_9fa48("6148");
                  localStorage.setItem(key, value);
                }
              } catch (error) {
                if (stryMutAct_9fa48("6149")) {
                  {}
                } else {
                  stryCov_9fa48("6149");
                  if (stryMutAct_9fa48("6152") ? false : stryMutAct_9fa48("6151") ? true : stryMutAct_9fa48("6150") ? this.isTestMode : (stryCov_9fa48("6150", "6151", "6152"), !this.isTestMode)) {
                    if (stryMutAct_9fa48("6153")) {
                      {}
                    } else {
                      stryCov_9fa48("6153");
                      console.error(stryMutAct_9fa48("6154") ? `` : (stryCov_9fa48("6154"), `Error saving ${key} to localStorage:`), error);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("6155")) {
          {}
        } else {
          stryCov_9fa48("6155");
          this.store.set(key, value);
          if (stryMutAct_9fa48("6157") ? false : stryMutAct_9fa48("6156") ? true : (stryCov_9fa48("6156", "6157"), this.useLocalStorage)) {
            if (stryMutAct_9fa48("6158")) {
              {}
            } else {
              stryCov_9fa48("6158");
              try {
                if (stryMutAct_9fa48("6159")) {
                  {}
                } else {
                  stryCov_9fa48("6159");
                  localStorage.setItem(key, value);
                }
              } catch (error) {
                if (stryMutAct_9fa48("6160")) {
                  {}
                } else {
                  stryCov_9fa48("6160");
                  if (stryMutAct_9fa48("6163") ? false : stryMutAct_9fa48("6162") ? true : stryMutAct_9fa48("6161") ? this.isTestMode : (stryCov_9fa48("6161", "6162", "6163"), !this.isTestMode)) {
                    if (stryMutAct_9fa48("6164")) {
                      {}
                    } else {
                      stryCov_9fa48("6164");
                      console.error(stryMutAct_9fa48("6165") ? `` : (stryCov_9fa48("6165"), `Error saving ${key} to localStorage:`), error);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Removes an item from both memory and localStorage if available
   * @param key - The key to remove
   */
  removeItem(key: string): void {
    if (stryMutAct_9fa48("6166")) {
      {}
    } else {
      stryCov_9fa48("6166");
      this.store.delete(key);
      if (stryMutAct_9fa48("6168") ? false : stryMutAct_9fa48("6167") ? true : (stryCov_9fa48("6167", "6168"), this.useLocalStorage)) {
        if (stryMutAct_9fa48("6169")) {
          {}
        } else {
          stryCov_9fa48("6169");
          try {
            if (stryMutAct_9fa48("6170")) {
              {}
            } else {
              stryCov_9fa48("6170");
              localStorage.removeItem(key);
            }
          } catch (error) {
            if (stryMutAct_9fa48("6171")) {
              {}
            } else {
              stryCov_9fa48("6171");
              if (stryMutAct_9fa48("6174") ? false : stryMutAct_9fa48("6173") ? true : stryMutAct_9fa48("6172") ? this.isTestMode : (stryCov_9fa48("6172", "6173", "6174"), !this.isTestMode)) {
                if (stryMutAct_9fa48("6175")) {
                  {}
                } else {
                  stryCov_9fa48("6175");
                  console.error(stryMutAct_9fa48("6176") ? `` : (stryCov_9fa48("6176"), `Error removing ${key} from localStorage:`), error);
                }
              }
            }
          }
        }
      }
    }
  }
}