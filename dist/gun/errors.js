/**
 * Error classes for Gun and Auth
 */
/**
 * Base error for Gun
 */
export class GunError extends Error {
    constructor(message) {
        super(message);
        this.name = "GunError";
    }
}
/**
 * Generic authentication error
 */
export class AuthError extends GunError {
    constructor(message) {
        super(message);
        this.name = "AuthError";
    }
}
/**
 * Invalid credentials error
 */
export class InvalidCredentials extends AuthError {
    constructor(message = "Credenziali non valide") {
        super(message);
        this.name = "InvalidCredentials";
    }
}
/**
 * User already exists error
 */
export class UserExists extends AuthError {
    constructor(message = "Utente già esistente") {
        super(message);
        this.name = "UserExists";
    }
}
/**
 * Timeout error
 */
export class TimeoutError extends GunError {
    constructor(message = "Timeout durante l'operazione") {
        super(message);
        this.name = "TimeoutError";
    }
}
/**
 * Multiple authentication error
 */
export class MultipleAuthError extends AuthError {
    constructor(message = "Autenticazione multipla in corso") {
        super(message);
        this.name = "MultipleAuthError";
    }
}
/** Base error related to the network. */
export class NetworkError extends GunError {
}
const withDefaultMessage = (args, defaultMessage) => {
    if (args.length === 0 || (args.length === 1 && !args[0])) {
        args = [defaultMessage];
    }
    return args;
};
