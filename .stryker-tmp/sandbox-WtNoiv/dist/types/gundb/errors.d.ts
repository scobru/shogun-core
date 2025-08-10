/**
 * Error classes for Gun and Auth
 */
// @ts-nocheck

/**
 * Base error for Gun
 */
export declare class GunError extends Error {
    constructor(message: string);
}
/**
 * Generic authentication error
 */
export declare class AuthError extends GunError {
    constructor(message: string);
}
/**
 * Invalid credentials error
 */
export declare class InvalidCredentials extends AuthError {
    constructor(message?: string);
}
/**
 * User already exists error
 */
export declare class UserExists extends AuthError {
    constructor(message?: string);
}
/**
 * Timeout error
 */
export declare class TimeoutError extends GunError {
    constructor(message?: string);
}
/**
 * Multiple authentication error
 */
export declare class MultipleAuthError extends AuthError {
    constructor(message?: string);
}
/** Base error related to the network. */
export declare class NetworkError extends GunError {
}
