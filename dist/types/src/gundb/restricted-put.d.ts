/**
 * Initialize the Gun headers module with Gun instance and optional token
 * @param Gun - Gun instance
 * @param token - Optional authentication token
 */
export declare const restrictedPut: (Gun: any, token?: string) => void;
/**
 * Set the authentication token for Gun requests
 * @param newToken - Token to set
 */
export declare const setToken: (newToken: string) => string;
/**
 * Get the current authentication token
 */
export declare const getToken: () => string | undefined;
