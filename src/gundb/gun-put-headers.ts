// Type definitions
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
  // Closure for token state
  const tokenState: TokenState = {
    value: undefined,
  };

  // Pure function to create a new token state
  const setToken = (newToken: string): string => {
    tokenState.value = newToken;
    setupTokenMiddleware();
    return tokenState.value;
  };

  // Pure function to retrieve token
  const getToken = (): string | undefined => tokenState.value;

  // Function to add token to headers
  const addTokenToHeaders = (msg: Message): Message => ({
    ...msg,
    headers: {
      ...msg.headers,
      token: tokenState.value,
    },
  });

  // Setup middleware
  const setupTokenMiddleware = (): void => {
    Gun.on("opt", function (this: any, ctx: GunContext) {
      if (ctx.once) return;

      ctx.on("out", function (this: GunMiddleware, msg: Message) {
        const to = this.to;
        // Apply pure function to add headers
        const msgWithHeaders = addTokenToHeaders(msg);
        //console.log('[PUT HEADERS]', msgWithHeaders)
        to.next(msgWithHeaders); // pass to next middleware
      });
    });
  };

  // Initialize middleware
  setupTokenMiddleware();

  // Expose public API
  return {
    setToken,
    getToken,
  };
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
  moduleInstance = gunHeaderModule(Gun);
  if (token) {
    moduleInstance.setToken(token);
  }
};

/**
 * Set the authentication token for Gun requests
 * @param newToken - Token to set
 */
export const setToken = (newToken: string): string => {
  if (!moduleInstance) {
    throw new Error(
      "Gun headers module not initialized. Call init(Gun, token) first.",
    );
  }
  return moduleInstance.setToken(newToken);
};

/**
 * Get the current authentication token
 */
export const getToken = (): string | undefined => {
  if (!moduleInstance) {
    throw new Error(
      "Gun headers module not initialized. Call init(Gun, token) first.",
    );
  }
  return moduleInstance.getToken();
};

// Export the functions to global window (if in browser environment)
if (typeof window !== "undefined") {
  (window as any).setToken = setToken;
  (window as any).getToken = getToken;
}
