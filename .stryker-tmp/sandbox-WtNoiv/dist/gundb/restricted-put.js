// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToken = exports.setToken = exports.restrictedPut = void 0;
// Functional programming style implementation
const gunHeaderModule = (Gun) => {
    // Closure for token state
    const tokenState = {
        value: undefined,
    };
    // Pure function to create a new token state
    const setToken = (newToken) => {
        tokenState.value = newToken;
        setupTokenMiddleware();
        return tokenState.value;
    };
    // Pure function to retrieve token
    const getToken = () => tokenState.value;
    // Function to add token to headers
    const addTokenToHeaders = (msg) => ({
        ...msg,
        headers: {
            ...msg.headers,
            token: tokenState.value,
        },
    });
    // Setup middleware
    const setupTokenMiddleware = () => {
        Gun.on("opt", function (ctx) {
            if (ctx.once)
                return;
            ctx.on("out", function (msg) {
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
let moduleInstance;
/**
 * Initialize the Gun headers module with Gun instance and optional token
 * @param Gun - Gun instance
 * @param token - Optional authentication token
 */
const restrictedPut = (Gun, token) => {
    moduleInstance = gunHeaderModule(Gun);
    if (token) {
        moduleInstance.setToken(token);
    }
};
exports.restrictedPut = restrictedPut;
/**
 * Set the authentication token for Gun requests
 * @param newToken - Token to set
 */
const setToken = (newToken) => {
    if (!moduleInstance) {
        throw new Error("Gun headers module not initialized. Call init(Gun, token) first.");
    }
    return moduleInstance.setToken(newToken);
};
exports.setToken = setToken;
/**
 * Get the current authentication token
 */
const getToken = () => {
    if (!moduleInstance) {
        throw new Error("Gun headers module not initialized. Call init(Gun, token) first.");
    }
    return moduleInstance.getToken();
};
exports.getToken = getToken;
// Export the functions to global window (if in browser environment)
if (typeof window !== "undefined") {
    window.setToken = exports.setToken;
    window.getToken = exports.getToken;
}
