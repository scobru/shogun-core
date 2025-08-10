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
import { Observable } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { IGunInstance, IGunUserInstance } from "gun";

/**
 * RxJS Integration for GunDB
 * Provides reactive programming capabilities for GunDB data
 */
export class GunRxJS {
  private readonly gun: IGunInstance<any>;
  private readonly user: IGunUserInstance<any>;

  /**
   * Initialize GunRxJS with a GunDB instance
   * @param gun - GunDB instance
   */
  constructor(gun: IGunInstance<any>) {
    if (stryMutAct_9fa48("2107")) {
      {}
    } else {
      stryCov_9fa48("2107");
      this.gun = gun;
      this.user = gun.user();
    }
  }

  /**
   * Get the current user
   * @returns The current user
   */
  getUser(): IGunUserInstance<any> {
    if (stryMutAct_9fa48("2108")) {
      {}
    } else {
      stryCov_9fa48("2108");
      return this.user;
    }
  }

  /**
   * Get the current user's public key
   * @returns The current user's public key
   */
  getUserPub(): string | undefined {
    if (stryMutAct_9fa48("2109")) {
      {}
    } else {
      stryCov_9fa48("2109");
      return stryMutAct_9fa48("2110") ? this.user.is.pub : (stryCov_9fa48("2110"), this.user.is?.pub);
    }
  }

  /**
   * Observe a Gun node for changes
   * @param path - Path to observe (can be a string or a Gun chain)
   * @returns Observable that emits whenever the node changes
   */
  observe<T>(path: string | any): Observable<T> {
    if (stryMutAct_9fa48("2111")) {
      {}
    } else {
      stryCov_9fa48("2111");
      return new Observable<T>(subscriber => {
        if (stryMutAct_9fa48("2112")) {
          {}
        } else {
          stryCov_9fa48("2112");
          const node = (stryMutAct_9fa48("2115") ? typeof path !== "string" : stryMutAct_9fa48("2114") ? false : stryMutAct_9fa48("2113") ? true : (stryCov_9fa48("2113", "2114", "2115"), typeof path === (stryMutAct_9fa48("2116") ? "" : (stryCov_9fa48("2116"), "string")))) ? this.gun.get(path) : path;

          // Subscribe to changes
          const unsub = node.on((data: T, key: string) => {
            if (stryMutAct_9fa48("2117")) {
              {}
            } else {
              stryCov_9fa48("2117");
              if (stryMutAct_9fa48("2120") ? data === null && data === undefined : stryMutAct_9fa48("2119") ? false : stryMutAct_9fa48("2118") ? true : (stryCov_9fa48("2118", "2119", "2120"), (stryMutAct_9fa48("2122") ? data !== null : stryMutAct_9fa48("2121") ? false : (stryCov_9fa48("2121", "2122"), data === null)) || (stryMutAct_9fa48("2124") ? data !== undefined : stryMutAct_9fa48("2123") ? false : (stryCov_9fa48("2123", "2124"), data === undefined)))) {
                if (stryMutAct_9fa48("2125")) {
                  {}
                } else {
                  stryCov_9fa48("2125");
                  subscriber.next(null as unknown as T);
                  return;
                }
              }

              // Remove Gun metadata before emitting
              if (stryMutAct_9fa48("2128") ? typeof data === "object" || data !== null : stryMutAct_9fa48("2127") ? false : stryMutAct_9fa48("2126") ? true : (stryCov_9fa48("2126", "2127", "2128"), (stryMutAct_9fa48("2130") ? typeof data !== "object" : stryMutAct_9fa48("2129") ? true : (stryCov_9fa48("2129", "2130"), typeof data === (stryMutAct_9fa48("2131") ? "" : (stryCov_9fa48("2131"), "object")))) && (stryMutAct_9fa48("2133") ? data === null : stryMutAct_9fa48("2132") ? true : (stryCov_9fa48("2132", "2133"), data !== null)))) {
                if (stryMutAct_9fa48("2134")) {
                  {}
                } else {
                  stryCov_9fa48("2134");
                  const cleanData = this.removeGunMeta(data);
                  subscriber.next(cleanData as T);
                }
              } else {
                if (stryMutAct_9fa48("2135")) {
                  {}
                } else {
                  stryCov_9fa48("2135");
                  subscriber.next(data);
                }
              }
            }
          });

          // Return teardown logic
          return () => {
            if (stryMutAct_9fa48("2136")) {
              {}
            } else {
              stryCov_9fa48("2136");
              if (stryMutAct_9fa48("2139") ? unsub || typeof unsub === "function" : stryMutAct_9fa48("2138") ? false : stryMutAct_9fa48("2137") ? true : (stryCov_9fa48("2137", "2138", "2139"), unsub && (stryMutAct_9fa48("2141") ? typeof unsub !== "function" : stryMutAct_9fa48("2140") ? true : (stryCov_9fa48("2140", "2141"), typeof unsub === (stryMutAct_9fa48("2142") ? "" : (stryCov_9fa48("2142"), "function")))))) {
                if (stryMutAct_9fa48("2143")) {
                  {}
                } else {
                  stryCov_9fa48("2143");
                  unsub();
                }
              }
              node.off();
            }
          };
        }
      }).pipe(distinctUntilChanged((prev, curr) => {
        if (stryMutAct_9fa48("2144")) {
          {}
        } else {
          stryCov_9fa48("2144");
          return stryMutAct_9fa48("2147") ? JSON.stringify(prev) !== JSON.stringify(curr) : stryMutAct_9fa48("2146") ? false : stryMutAct_9fa48("2145") ? true : (stryCov_9fa48("2145", "2146", "2147"), JSON.stringify(prev) === JSON.stringify(curr));
        }
      }));
    }
  }

  /**
   * Match data based on Gun's '.map()' and convert to Observable
   * @param path - Path to the collection
   * @param matchFn - Optional function to filter results
   * @returns Observable array of matched items
   */
  match<T>(path: string | any, matchFn?: (data: any) => boolean): Observable<T[]> {
    if (stryMutAct_9fa48("2148")) {
      {}
    } else {
      stryCov_9fa48("2148");
      return new Observable<T[]>(subscriber => {
        if (stryMutAct_9fa48("2149")) {
          {}
        } else {
          stryCov_9fa48("2149");
          const node = (stryMutAct_9fa48("2152") ? typeof path !== "string" : stryMutAct_9fa48("2151") ? false : stryMutAct_9fa48("2150") ? true : (stryCov_9fa48("2150", "2151", "2152"), typeof path === (stryMutAct_9fa48("2153") ? "" : (stryCov_9fa48("2153"), "string")))) ? this.gun.get(path) : path;
          const results: Record<string, T> = {};
          const unsub = node.map().on((data: T, key: string) => {
            if (stryMutAct_9fa48("2154")) {
              {}
            } else {
              stryCov_9fa48("2154");
              // Skip soul key which is Gun's internal reference
              if (stryMutAct_9fa48("2157") ? key === "_" && !data : stryMutAct_9fa48("2156") ? false : stryMutAct_9fa48("2155") ? true : (stryCov_9fa48("2155", "2156", "2157"), (stryMutAct_9fa48("2159") ? key !== "_" : stryMutAct_9fa48("2158") ? false : (stryCov_9fa48("2158", "2159"), key === (stryMutAct_9fa48("2160") ? "" : (stryCov_9fa48("2160"), "_")))) || (stryMutAct_9fa48("2161") ? data : (stryCov_9fa48("2161"), !data)))) return;
              if (stryMutAct_9fa48("2164") ? matchFn || !matchFn(data) : stryMutAct_9fa48("2163") ? false : stryMutAct_9fa48("2162") ? true : (stryCov_9fa48("2162", "2163", "2164"), matchFn && (stryMutAct_9fa48("2165") ? matchFn(data) : (stryCov_9fa48("2165"), !matchFn(data))))) {
                if (stryMutAct_9fa48("2166")) {
                  {}
                } else {
                  stryCov_9fa48("2166");
                  // If matchFn is provided and returns false, remove item
                  if (stryMutAct_9fa48("2168") ? false : stryMutAct_9fa48("2167") ? true : (stryCov_9fa48("2167", "2168"), results[key])) {
                    if (stryMutAct_9fa48("2169")) {
                      {}
                    } else {
                      stryCov_9fa48("2169");
                      delete results[key];
                      subscriber.next(Object.values(results));
                    }
                  }
                  return;
                }
              }
              const cleanData = (stryMutAct_9fa48("2172") ? typeof data !== "object" : stryMutAct_9fa48("2171") ? false : stryMutAct_9fa48("2170") ? true : (stryCov_9fa48("2170", "2171", "2172"), typeof data === (stryMutAct_9fa48("2173") ? "" : (stryCov_9fa48("2173"), "object")))) ? this.removeGunMeta(data) : data;
              results[key] = cleanData as T;
              subscriber.next(Object.values(results));
            }
          });

          // Return teardown logic
          return () => {
            if (stryMutAct_9fa48("2174")) {
              {}
            } else {
              stryCov_9fa48("2174");
              if (stryMutAct_9fa48("2177") ? unsub || typeof unsub === "function" : stryMutAct_9fa48("2176") ? false : stryMutAct_9fa48("2175") ? true : (stryCov_9fa48("2175", "2176", "2177"), unsub && (stryMutAct_9fa48("2179") ? typeof unsub !== "function" : stryMutAct_9fa48("2178") ? true : (stryCov_9fa48("2178", "2179"), typeof unsub === (stryMutAct_9fa48("2180") ? "" : (stryCov_9fa48("2180"), "function")))))) {
                if (stryMutAct_9fa48("2181")) {
                  {}
                } else {
                  stryCov_9fa48("2181");
                  unsub();
                }
              }
              node.off();
            }
          };
        }
      });
    }
  }

  /**
   * Put data and return an Observable
   * @param path - Path where to put the data
   * @param data - Data to put
   * @returns Observable that completes when the put is acknowledged
   */
  put<T>(path: string | any, data: T): Observable<T> {
    if (stryMutAct_9fa48("2182")) {
      {}
    } else {
      stryCov_9fa48("2182");
      const node = (stryMutAct_9fa48("2185") ? typeof path !== "string" : stryMutAct_9fa48("2184") ? false : stryMutAct_9fa48("2183") ? true : (stryCov_9fa48("2183", "2184", "2185"), typeof path === (stryMutAct_9fa48("2186") ? "" : (stryCov_9fa48("2186"), "string")))) ? this.gun.get(path) : path;
      return new Observable<T>(subscriber => {
        if (stryMutAct_9fa48("2187")) {
          {}
        } else {
          stryCov_9fa48("2187");
          node.put(data, (ack: any) => {
            if (stryMutAct_9fa48("2188")) {
              {}
            } else {
              stryCov_9fa48("2188");
              if (stryMutAct_9fa48("2190") ? false : stryMutAct_9fa48("2189") ? true : (stryCov_9fa48("2189", "2190"), ack.err)) {
                if (stryMutAct_9fa48("2191")) {
                  {}
                } else {
                  stryCov_9fa48("2191");
                  subscriber.error(new Error(ack.err));
                }
              } else {
                if (stryMutAct_9fa48("2192")) {
                  {}
                } else {
                  stryCov_9fa48("2192");
                  subscriber.next(data);
                  subscriber.complete();
                }
              }
            }
          });
        }
      });
    }
  }

  /**
   * Set data on a node and return an Observable
   * @param path - Path to the collection
   * @param data - Data to set
   * @returns Observable that completes when the set is acknowledged
   */
  set<T>(path: string | any, data: T): Observable<T> {
    if (stryMutAct_9fa48("2193")) {
      {}
    } else {
      stryCov_9fa48("2193");
      const node = (stryMutAct_9fa48("2196") ? typeof path !== "string" : stryMutAct_9fa48("2195") ? false : stryMutAct_9fa48("2194") ? true : (stryCov_9fa48("2194", "2195", "2196"), typeof path === (stryMutAct_9fa48("2197") ? "" : (stryCov_9fa48("2197"), "string")))) ? this.gun.get(path) : path;
      return new Observable<T>(subscriber => {
        if (stryMutAct_9fa48("2198")) {
          {}
        } else {
          stryCov_9fa48("2198");
          node.set(data, (ack: any) => {
            if (stryMutAct_9fa48("2199")) {
              {}
            } else {
              stryCov_9fa48("2199");
              if (stryMutAct_9fa48("2201") ? false : stryMutAct_9fa48("2200") ? true : (stryCov_9fa48("2200", "2201"), ack.err)) {
                if (stryMutAct_9fa48("2202")) {
                  {}
                } else {
                  stryCov_9fa48("2202");
                  subscriber.error(new Error(ack.err));
                }
              } else {
                if (stryMutAct_9fa48("2203")) {
                  {}
                } else {
                  stryCov_9fa48("2203");
                  subscriber.next(data);
                  subscriber.complete();
                }
              }
            }
          });
        }
      });
    }
  }

  /**
   * Get data once and return as Observable
   * @param path - Path to get data from
   * @returns Observable that emits the data once
   */
  once<T>(path: string | any): Observable<T> {
    if (stryMutAct_9fa48("2204")) {
      {}
    } else {
      stryCov_9fa48("2204");
      const node = (stryMutAct_9fa48("2207") ? typeof path !== "string" : stryMutAct_9fa48("2206") ? false : stryMutAct_9fa48("2205") ? true : (stryCov_9fa48("2205", "2206", "2207"), typeof path === (stryMutAct_9fa48("2208") ? "" : (stryCov_9fa48("2208"), "string")))) ? this.gun.get(path) : path;
      return new Observable<T>(subscriber => {
        if (stryMutAct_9fa48("2209")) {
          {}
        } else {
          stryCov_9fa48("2209");
          node.once((data: T) => {
            if (stryMutAct_9fa48("2210")) {
              {}
            } else {
              stryCov_9fa48("2210");
              if (stryMutAct_9fa48("2213") ? data === undefined && data === null : stryMutAct_9fa48("2212") ? false : stryMutAct_9fa48("2211") ? true : (stryCov_9fa48("2211", "2212", "2213"), (stryMutAct_9fa48("2215") ? data !== undefined : stryMutAct_9fa48("2214") ? false : (stryCov_9fa48("2214", "2215"), data === undefined)) || (stryMutAct_9fa48("2217") ? data !== null : stryMutAct_9fa48("2216") ? false : (stryCov_9fa48("2216", "2217"), data === null)))) {
                if (stryMutAct_9fa48("2218")) {
                  {}
                } else {
                  stryCov_9fa48("2218");
                  subscriber.next(null as unknown as T);
                  subscriber.complete();
                  return;
                }
              }
              const cleanData = (stryMutAct_9fa48("2221") ? typeof data !== "object" : stryMutAct_9fa48("2220") ? false : stryMutAct_9fa48("2219") ? true : (stryCov_9fa48("2219", "2220", "2221"), typeof data === (stryMutAct_9fa48("2222") ? "" : (stryCov_9fa48("2222"), "object")))) ? this.removeGunMeta(data) : data;
              subscriber.next(cleanData as T);
              subscriber.complete();
            }
          });
        }
      });
    }
  }

  /**
   * Compute derived values from gun data
   * @param sources - Array of paths or observables to compute from
   * @param computeFn - Function that computes a new value from the sources
   * @returns Observable of computed values
   */
  compute<T, R>(sources: Array<string | Observable<any>>, computeFn: (...values: T[]) => R): Observable<R> {
    if (stryMutAct_9fa48("2223")) {
      {}
    } else {
      stryCov_9fa48("2223");
      // Convert all sources to observables
      const observables = sources.map(source => {
        if (stryMutAct_9fa48("2224")) {
          {}
        } else {
          stryCov_9fa48("2224");
          if (stryMutAct_9fa48("2227") ? typeof source !== "string" : stryMutAct_9fa48("2226") ? false : stryMutAct_9fa48("2225") ? true : (stryCov_9fa48("2225", "2226", "2227"), typeof source === (stryMutAct_9fa48("2228") ? "" : (stryCov_9fa48("2228"), "string")))) {
            if (stryMutAct_9fa48("2229")) {
              {}
            } else {
              stryCov_9fa48("2229");
              return this.observe<T>(source);
            }
          }
          return source as Observable<T>;
        }
      });

      // Combine the latest values from all sources
      return new Observable<R>(subscriber => {
        if (stryMutAct_9fa48("2230")) {
          {}
        } else {
          stryCov_9fa48("2230");
          let values: T[] = (stryMutAct_9fa48("2231") ? new Array() : (stryCov_9fa48("2231"), new Array(sources.length))).fill(undefined);
          let completed = (stryMutAct_9fa48("2232") ? new Array() : (stryCov_9fa48("2232"), new Array(sources.length))).fill(stryMutAct_9fa48("2233") ? true : (stryCov_9fa48("2233"), false));
          const subscriptions = observables.map((obs, index) => {
            if (stryMutAct_9fa48("2234")) {
              {}
            } else {
              stryCov_9fa48("2234");
              return obs.subscribe(stryMutAct_9fa48("2235") ? {} : (stryCov_9fa48("2235"), {
                next: value => {
                  if (stryMutAct_9fa48("2236")) {
                    {}
                  } else {
                    stryCov_9fa48("2236");
                    values[index] = value;

                    // Only compute if we have all values
                    if (stryMutAct_9fa48("2239") ? values.some(v => v !== undefined) : stryMutAct_9fa48("2238") ? false : stryMutAct_9fa48("2237") ? true : (stryCov_9fa48("2237", "2238", "2239"), values.every(stryMutAct_9fa48("2240") ? () => undefined : (stryCov_9fa48("2240"), v => stryMutAct_9fa48("2243") ? v === undefined : stryMutAct_9fa48("2242") ? false : stryMutAct_9fa48("2241") ? true : (stryCov_9fa48("2241", "2242", "2243"), v !== undefined))))) {
                      if (stryMutAct_9fa48("2244")) {
                        {}
                      } else {
                        stryCov_9fa48("2244");
                        try {
                          if (stryMutAct_9fa48("2245")) {
                            {}
                          } else {
                            stryCov_9fa48("2245");
                            const result = computeFn(...values);
                            subscriber.next(result);
                          }
                        } catch (error) {
                          if (stryMutAct_9fa48("2246")) {
                            {}
                          } else {
                            stryCov_9fa48("2246");
                            subscriber.error(error);
                          }
                        }
                      }
                    }
                  }
                },
                error: stryMutAct_9fa48("2247") ? () => undefined : (stryCov_9fa48("2247"), err => subscriber.error(err)),
                complete: () => {
                  if (stryMutAct_9fa48("2248")) {
                    {}
                  } else {
                    stryCov_9fa48("2248");
                    completed[index] = stryMutAct_9fa48("2249") ? false : (stryCov_9fa48("2249"), true);
                    if (stryMutAct_9fa48("2252") ? completed.some(c => c) : stryMutAct_9fa48("2251") ? false : stryMutAct_9fa48("2250") ? true : (stryCov_9fa48("2250", "2251", "2252"), completed.every(stryMutAct_9fa48("2253") ? () => undefined : (stryCov_9fa48("2253"), c => c)))) {
                      if (stryMutAct_9fa48("2254")) {
                        {}
                      } else {
                        stryCov_9fa48("2254");
                        subscriber.complete();
                      }
                    }
                  }
                }
              }));
            }
          });

          // Return teardown logic
          return () => {
            if (stryMutAct_9fa48("2255")) {
              {}
            } else {
              stryCov_9fa48("2255");
              subscriptions.forEach(stryMutAct_9fa48("2256") ? () => undefined : (stryCov_9fa48("2256"), sub => sub.unsubscribe()));
            }
          };
        }
      });
    }
  }

  /**
   * User put data and return an Observable (for authenticated users)
   * @param path - Path where to put the data
   * @param data - Data to put
   * @returns Observable that completes when the put is acknowledged
   */
  userPut<T>(path: string, data: T): Observable<T> {
    if (stryMutAct_9fa48("2257")) {
      {}
    } else {
      stryCov_9fa48("2257");
      return new Observable<T>(subscriber => {
        if (stryMutAct_9fa48("2258")) {
          {}
        } else {
          stryCov_9fa48("2258");
          this.gun.user().get(path).put(data, (ack: any) => {
            if (stryMutAct_9fa48("2259")) {
              {}
            } else {
              stryCov_9fa48("2259");
              if (stryMutAct_9fa48("2261") ? false : stryMutAct_9fa48("2260") ? true : (stryCov_9fa48("2260", "2261"), ack.err)) {
                if (stryMutAct_9fa48("2262")) {
                  {}
                } else {
                  stryCov_9fa48("2262");
                  subscriber.error(new Error(ack.err));
                }
              } else {
                if (stryMutAct_9fa48("2263")) {
                  {}
                } else {
                  stryCov_9fa48("2263");
                  subscriber.next(data);
                  subscriber.complete();
                }
              }
            }
          });
        }
      });
    }
  }

  /**
   * Get user data
   * @param path - Path to get data from
   * @returns Observable that emits the data once
   */
  userGet<T>(path: string): Observable<T> {
    if (stryMutAct_9fa48("2264")) {
      {}
    } else {
      stryCov_9fa48("2264");
      return this.observe<T>(this.gun.user().get(path));
    }
  }

  /**
   * Observe user data
   * @param path - Path to observe in user space
   * @returns Observable that emits whenever the user data changes
   */
  observeUser<T>(path: string): Observable<T> {
    if (stryMutAct_9fa48("2265")) {
      {}
    } else {
      stryCov_9fa48("2265");
      return this.observe<T>(this.gun.user().get(path));
    }
  }

  /**
   * Remove Gun metadata from an object
   * @param obj - Object to clean
   * @returns Cleaned object without Gun metadata
   */
  private removeGunMeta<T>(obj: T): T {
    if (stryMutAct_9fa48("2266")) {
      {}
    } else {
      stryCov_9fa48("2266");
      if (stryMutAct_9fa48("2269") ? !obj && typeof obj !== "object" : stryMutAct_9fa48("2268") ? false : stryMutAct_9fa48("2267") ? true : (stryCov_9fa48("2267", "2268", "2269"), (stryMutAct_9fa48("2270") ? obj : (stryCov_9fa48("2270"), !obj)) || (stryMutAct_9fa48("2272") ? typeof obj === "object" : stryMutAct_9fa48("2271") ? false : (stryCov_9fa48("2271", "2272"), typeof obj !== (stryMutAct_9fa48("2273") ? "" : (stryCov_9fa48("2273"), "object")))))) return obj;

      // Create a clean copy
      const cleanObj: any = Array.isArray(obj) ? stryMutAct_9fa48("2274") ? ["Stryker was here"] : (stryCov_9fa48("2274"), []) : {};

      // Copy properties, skipping Gun metadata
      Object.keys(obj).forEach(key => {
        if (stryMutAct_9fa48("2275")) {
          {}
        } else {
          stryCov_9fa48("2275");
          // Skip Gun metadata
          if (stryMutAct_9fa48("2278") ? key === "_" && key === "#" : stryMutAct_9fa48("2277") ? false : stryMutAct_9fa48("2276") ? true : (stryCov_9fa48("2276", "2277", "2278"), (stryMutAct_9fa48("2280") ? key !== "_" : stryMutAct_9fa48("2279") ? false : (stryCov_9fa48("2279", "2280"), key === (stryMutAct_9fa48("2281") ? "" : (stryCov_9fa48("2281"), "_")))) || (stryMutAct_9fa48("2283") ? key !== "#" : stryMutAct_9fa48("2282") ? false : (stryCov_9fa48("2282", "2283"), key === (stryMutAct_9fa48("2284") ? "" : (stryCov_9fa48("2284"), "#")))))) return;
          const val = (obj as any)[key];
          if (stryMutAct_9fa48("2287") ? val || typeof val === "object" : stryMutAct_9fa48("2286") ? false : stryMutAct_9fa48("2285") ? true : (stryCov_9fa48("2285", "2286", "2287"), val && (stryMutAct_9fa48("2289") ? typeof val !== "object" : stryMutAct_9fa48("2288") ? true : (stryCov_9fa48("2288", "2289"), typeof val === (stryMutAct_9fa48("2290") ? "" : (stryCov_9fa48("2290"), "object")))))) {
            if (stryMutAct_9fa48("2291")) {
              {}
            } else {
              stryCov_9fa48("2291");
              cleanObj[key] = this.removeGunMeta(val);
            }
          } else {
            if (stryMutAct_9fa48("2292")) {
              {}
            } else {
              stryCov_9fa48("2292");
              cleanObj[key] = val;
            }
          }
        }
      });
      return cleanObj as T;
    }
  }
}