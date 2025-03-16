/**
 * Classi di errore per Gun e Auth
 */

/**
 * Errore di base per Gun
 */
export class GunError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GunError";
  }
}

/**
 * Errore di autenticazione generico
 */
export class AuthError extends GunError {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Errore di credenziali non valide
 */
export class InvalidCredentials extends AuthError {
  constructor(message = "Credenziali non valide") {
    super(message);
    this.name = "InvalidCredentials";
  }
}

/**
 * Errore di utente già esistente
 */
export class UserExists extends AuthError {
  constructor(message = "Utente già esistente") {
    super(message);
    this.name = "UserExists";
  }
}

/**
 * Errore di timeout
 */
export class TimeoutError extends GunError {
  constructor(message = "Timeout durante l'operazione") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Errore di multiple autenticazioni
 */
export class MultipleAuthError extends AuthError {
  constructor(message = "Autenticazione multipla in corso") {
    super(message);
    this.name = "MultipleAuthError";
  }
}

/** Base error related to the network. */
export class NetworkError extends GunError {}

const withDefaultMessage = (args: any[], defaultMessage: string) => {
  if (args.length === 0 || (args.length === 1 && !args[0])) {
    args = [defaultMessage];
  }
  return args;
};
