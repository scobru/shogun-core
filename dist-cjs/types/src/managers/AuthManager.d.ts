import { IShogunCore, AuthResult, SignUpResult, AuthMethod } from "../interfaces/shogun";
import { ISEAPair } from "gun";
/**
 * Manages authentication operations for ShogunCore
 */
export declare class AuthManager {
    private core;
    private currentAuthMethod?;
    constructor(core: IShogunCore);
    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in, false otherwise
     * @description Verifies authentication status by checking GunInstance login state
     * and presence of authentication credentials in storage
     */
    isLoggedIn(): boolean;
    /**
     * Perform user logout
     * @description Logs out the current user from GunInstance and emits logout event.
     * If user is not authenticated, the logout operation is ignored.
     */
    logout(): void;
    /**
     * Authenticate user with username and password
     * @param username - Username
     * @param password - User password
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Attempts to log in user with provided credentials.
     * Emits login event on success.
     */
    login(username: string, password: string, pair?: ISEAPair | null): Promise<AuthResult>;
    /**
     * Login with GunDB pair directly
     * @param pair - GunDB SEA pair for authentication
     * @returns {Promise<AuthResult>} Promise with authentication result
     * @description Authenticates user using a GunDB pair directly.
     * Emits login event on success.
     */
    loginWithPair(username: string, pair: ISEAPair): Promise<AuthResult>;
    /**
     * Register a new user with provided credentials
     * @param username - Username
     * @param password - Password
     * @param email - Email (optional)
     * @param pair - Pair of keys
     * @returns {Promise<SignUpResult>} Registration result
     * @description Creates a new user account with the provided credentials.
     * Validates password requirements and emits signup event on success.
     */
    signUp(username: string, password?: string, pair?: ISEAPair | null): Promise<SignUpResult>;
    /**
     * Set the current authentication method
     * This is used by plugins to indicate which authentication method was used
     * @param method The authentication method used
     */
    setAuthMethod(method: AuthMethod): void;
    /**
     * Get the current authentication method
     * @returns The current authentication method or undefined if not set
     */
    getAuthMethod(): AuthMethod | undefined;
    /**
     * Get an authentication method plugin by type
     * @param type The type of authentication method
     * @returns The authentication plugin or undefined if not available
     * This is a more modern approach to accessing authentication methods
     */
    getAuthenticationMethod(type: AuthMethod): import("..").ShogunPlugin | {
        login: (username: string, password: string) => Promise<AuthResult>;
        signUp: (username: string, password: string, confirm?: string) => Promise<SignUpResult>;
    } | undefined;
}
