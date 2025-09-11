/**
 * Error classes for Holster and Auth
 */

/**
 * Base error for Holster
 */
export class HolsterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HolsterError";
  }
}

/**
 * Generic authentication error
 */
export class AuthError extends HolsterError {
  constructor(message: string) {
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
export class TimeoutError extends HolsterError {
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
export class NetworkError extends HolsterError {}

const withDefaultMessage = (args: any[], defaultMessage: string) => {
  if (args.length === 0 || (args.length === 1 && !args[0])) {
    args = [defaultMessage];
  }
  return args;
};
