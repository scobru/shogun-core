"use strict";
/**
 * Error classes for Gun and Auth
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.MultipleAuthError = exports.TimeoutError = exports.UserExists = exports.InvalidCredentials = exports.AuthError = exports.GunError = void 0;
/**
 * Base error for Gun
 */
class GunError extends Error {
    constructor(message) {
        super(message);
        this.name = "GunError";
    }
}
exports.GunError = GunError;
/**
 * Generic authentication error
 */
class AuthError extends GunError {
    constructor(message) {
        super(message);
        this.name = "AuthError";
    }
}
exports.AuthError = AuthError;
/**
 * Invalid credentials error
 */
class InvalidCredentials extends AuthError {
    constructor(message = "Credenziali non valide") {
        super(message);
        this.name = "InvalidCredentials";
    }
}
exports.InvalidCredentials = InvalidCredentials;
/**
 * User already exists error
 */
class UserExists extends AuthError {
    constructor(message = "Utente già esistente") {
        super(message);
        this.name = "UserExists";
    }
}
exports.UserExists = UserExists;
/**
 * Timeout error
 */
class TimeoutError extends GunError {
    constructor(message = "Timeout durante l'operazione") {
        super(message);
        this.name = "TimeoutError";
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Multiple authentication error
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
