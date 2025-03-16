/**
 * Classi di errore per Gun e Auth
 */
/**
 * Errore di base per Gun
 */
export declare class GunError extends Error {
    constructor(message: string);
}
/**
 * Errore di autenticazione generico
 */
export declare class AuthError extends GunError {
    constructor(message: string);
}
/**
 * Errore di credenziali non valide
 */
export declare class InvalidCredentials extends AuthError {
    constructor(message?: string);
}
/**
 * Errore di utente già esistente
 */
export declare class UserExists extends AuthError {
    constructor(message?: string);
}
/**
 * Errore di timeout
 */
export declare class TimeoutError extends GunError {
    constructor(message?: string);
}
/**
 * Errore di multiple autenticazioni
 */
export declare class MultipleAuthError extends AuthError {
    constructor(message?: string);
}
/** Base error related to the network. */
export declare class NetworkError extends GunError {
}
