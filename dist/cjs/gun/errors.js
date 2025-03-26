"use strict";
/**
 * Classi di errore per Gun e Auth
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.MultipleAuthError = exports.TimeoutError = exports.UserExists = exports.InvalidCredentials = exports.AuthError = exports.GunError = void 0;
/**
 * Errore di base per Gun
 */
class GunError extends Error {
    constructor(message) {
        super(message);
        this.name = "GunError";
    }
}
exports.GunError = GunError;
/**
 * Errore di autenticazione generico
 */
class AuthError extends GunError {
    constructor(message) {
        super(message);
        this.name = "AuthError";
    }
}
exports.AuthError = AuthError;
/**
 * Errore di credenziali non valide
 */
class InvalidCredentials extends AuthError {
    constructor(message = "Credenziali non valide") {
        super(message);
        this.name = "InvalidCredentials";
    }
}
exports.InvalidCredentials = InvalidCredentials;
/**
 * Errore di utente già esistente
 */
class UserExists extends AuthError {
    constructor(message = "Utente già esistente") {
        super(message);
        this.name = "UserExists";
    }
}
exports.UserExists = UserExists;
/**
 * Errore di timeout
 */
class TimeoutError extends GunError {
    constructor(message = "Timeout durante l'operazione") {
        super(message);
        this.name = "TimeoutError";
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Errore di multiple autenticazioni
 */
class MultipleAuthError extends AuthError {
    constructor(message = "Autenticazione multipla in corso") {
        super(message);
        this.name = "MultipleAuthError";
    }
}
exports.MultipleAuthError = MultipleAuthError;
/** Base error related to the network. */
class NetworkError extends GunError {
}
exports.NetworkError = NetworkError;
const withDefaultMessage = (args, defaultMessage) => {
    if (args.length === 0 || (args.length === 1 && !args[0])) {
        args = [defaultMessage];
    }
    return args;
};
