// @ts-nocheck
// Type definitions
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
interface TokenState {
  value: string | undefined;
}
interface Message {
  headers?: Record<string, any>;
  [key: string]: any;
}
interface GunContext {
  once?: boolean;
  on: (event: string, callback: Function) => void;
}
interface GunMiddleware {
  to: {
    next: (msg: Message) => void;
  };
}

// Functional programming style implementation
const gunHeaderModule = (Gun: any) => {
  if (stryMutAct_9fa48("2293")) {
    {}
  } else {
    stryCov_9fa48("2293");
    // Closure for token state
    const tokenState: TokenState = stryMutAct_9fa48("2294") ? {} : (stryCov_9fa48("2294"), {
      value: undefined
    });

    // Pure function to create a new token state
    const setToken = (newToken: string): string => {
      if (stryMutAct_9fa48("2295")) {
        {}
      } else {
        stryCov_9fa48("2295");
        tokenState.value = newToken;
        setupTokenMiddleware();
        return tokenState.value;
      }
    };

    // Pure function to retrieve token
    const getToken = stryMutAct_9fa48("2296") ? () => undefined : (stryCov_9fa48("2296"), (() => {
      const getToken = (): string | undefined => tokenState.value;
      return getToken;
    })());

    // Function to add token to headers
    const addTokenToHeaders = stryMutAct_9fa48("2297") ? () => undefined : (stryCov_9fa48("2297"), (() => {
      const addTokenToHeaders = (msg: Message): Message => stryMutAct_9fa48("2298") ? {} : (stryCov_9fa48("2298"), {
        ...msg,
        headers: stryMutAct_9fa48("2299") ? {} : (stryCov_9fa48("2299"), {
          ...msg.headers,
          token: tokenState.value
        })
      });
      return addTokenToHeaders;
    })());

    // Setup middleware
    const setupTokenMiddleware = (): void => {
      if (stryMutAct_9fa48("2300")) {
        {}
      } else {
        stryCov_9fa48("2300");
        Gun.on(stryMutAct_9fa48("2301") ? "" : (stryCov_9fa48("2301"), "opt"), function (this: any, ctx: GunContext) {
          if (stryMutAct_9fa48("2302")) {
            {}
          } else {
            stryCov_9fa48("2302");
            if (stryMutAct_9fa48("2304") ? false : stryMutAct_9fa48("2303") ? true : (stryCov_9fa48("2303", "2304"), ctx.once)) return;
            ctx.on(stryMutAct_9fa48("2305") ? "" : (stryCov_9fa48("2305"), "out"), function (this: GunMiddleware, msg: Message) {
              if (stryMutAct_9fa48("2306")) {
                {}
              } else {
                stryCov_9fa48("2306");
                const to = this.to;
                // Apply pure function to add headers
                const msgWithHeaders = addTokenToHeaders(msg);
                //console.log('[PUT HEADERS]', msgWithHeaders)
                to.next(msgWithHeaders); // pass to next middleware
              }
            });
          }
        });
      }
    };

    // Initialize middleware
    setupTokenMiddleware();

    // Expose public API
    return stryMutAct_9fa48("2307") ? {} : (stryCov_9fa48("2307"), {
      setToken,
      getToken
    });
  }
};

// Module instance and exports
let moduleInstance: {
  setToken: (newToken: string) => string;
  getToken: () => string | undefined;
};

/**
 * Initialize the Gun headers module with Gun instance and optional token
 * @param Gun - Gun instance
 * @param token - Optional authentication token
 */
export const restrictedPut = (Gun: any, token?: string): void => {
  if (stryMutAct_9fa48("2308")) {
    {}
  } else {
    stryCov_9fa48("2308");
    moduleInstance = gunHeaderModule(Gun);
    if (stryMutAct_9fa48("2310") ? false : stryMutAct_9fa48("2309") ? true : (stryCov_9fa48("2309", "2310"), token)) {
      if (stryMutAct_9fa48("2311")) {
        {}
      } else {
        stryCov_9fa48("2311");
        moduleInstance.setToken(token);
      }
    }
  }
};

/**
 * Set the authentication token for Gun requests
 * @param newToken - Token to set
 */
export const setToken = (newToken: string): string => {
  if (stryMutAct_9fa48("2312")) {
    {}
  } else {
    stryCov_9fa48("2312");
    if (stryMutAct_9fa48("2315") ? false : stryMutAct_9fa48("2314") ? true : stryMutAct_9fa48("2313") ? moduleInstance : (stryCov_9fa48("2313", "2314", "2315"), !moduleInstance)) {
      if (stryMutAct_9fa48("2316")) {
        {}
      } else {
        stryCov_9fa48("2316");
        throw new Error(stryMutAct_9fa48("2317") ? "" : (stryCov_9fa48("2317"), "Gun headers module not initialized. Call init(Gun, token) first."));
      }
    }
    return moduleInstance.setToken(newToken);
  }
};

/**
 * Get the current authentication token
 */
export const getToken = (): string | undefined => {
  if (stryMutAct_9fa48("2318")) {
    {}
  } else {
    stryCov_9fa48("2318");
    if (stryMutAct_9fa48("2321") ? false : stryMutAct_9fa48("2320") ? true : stryMutAct_9fa48("2319") ? moduleInstance : (stryCov_9fa48("2319", "2320", "2321"), !moduleInstance)) {
      if (stryMutAct_9fa48("2322")) {
        {}
      } else {
        stryCov_9fa48("2322");
        throw new Error(stryMutAct_9fa48("2323") ? "" : (stryCov_9fa48("2323"), "Gun headers module not initialized. Call init(Gun, token) first."));
      }
    }
    return moduleInstance.getToken();
  }
};

// Export the functions to global window (if in browser environment)
if (stryMutAct_9fa48("2326") ? typeof window === "undefined" : stryMutAct_9fa48("2325") ? false : stryMutAct_9fa48("2324") ? true : (stryCov_9fa48("2324", "2325", "2326"), typeof window !== (stryMutAct_9fa48("2327") ? "" : (stryCov_9fa48("2327"), "undefined")))) {
  if (stryMutAct_9fa48("2328")) {
    {}
  } else {
    stryCov_9fa48("2328");
    (window as any).setToken = setToken;
    (window as any).getToken = getToken;
  }
}