// Type definitions
interface TokenState {
  value: string | undefined;
}

interface Message {
  headers?: Record<string, any>;
  [key: string]: any;
}

interface HolsterContext {
  once?: boolean;
  on: (event: string, callback: Function) => void;
}

interface HolsterMiddleware {
  to: {
    next: (msg: Message) => void;
  };
}

// Functional programming style implementation
const holsterHeaderModule = (Holster: any) => {
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
    console.warn("Holster does not support custom headers middleware.");
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
 * Initialize the Holster headers module with Holster instance and optional token
 * @param Holster - Holster instance
 * @param token - Optional authentication token
 */
export const restrictedPut = (Holster: any, token?: string): void => {
  moduleInstance = holsterHeaderModule(Holster);
  if (token) {
    moduleInstance.setToken(token);
  }
};

/**
 * Set the authentication token for Holster requests
 * @param newToken - Token to set
 */
export const setToken = (newToken: string): string => {
  if (!moduleInstance) {
    throw new Error(
      "Holster headers module not initialized. Call init(Holster, token) first.",
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
      "Holster headers module not initialized. Call init(Holster, token) first.",
    );
  }
  return moduleInstance.getToken();
};

// Export the functions to global window (if in browser environment)
if (typeof window !== "undefined") {
  (window as any).setToken = setToken;
  (window as any).getToken = getToken;
}
