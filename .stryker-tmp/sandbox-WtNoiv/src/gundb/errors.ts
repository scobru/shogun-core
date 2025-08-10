/**
 * Error classes for Gun and Auth
 */
// @ts-nocheck


/**
 * Base error for Gun
 */function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
export class GunError extends Error {
  constructor(message: string) {
    if (stryMutAct_9fa48("264")) {
      {}
    } else {
      stryCov_9fa48("264");
      super(message);
      this.name = stryMutAct_9fa48("265") ? "" : (stryCov_9fa48("265"), "GunError");
    }
  }
}

/**
 * Generic authentication error
 */
export class AuthError extends GunError {
  constructor(message: string) {
    if (stryMutAct_9fa48("266")) {
      {}
    } else {
      stryCov_9fa48("266");
      super(message);
      this.name = stryMutAct_9fa48("267") ? "" : (stryCov_9fa48("267"), "AuthError");
    }
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentials extends AuthError {
  constructor(message = stryMutAct_9fa48("268") ? "" : (stryCov_9fa48("268"), "Credenziali non valide")) {
    if (stryMutAct_9fa48("269")) {
      {}
    } else {
      stryCov_9fa48("269");
      super(message);
      this.name = stryMutAct_9fa48("270") ? "" : (stryCov_9fa48("270"), "InvalidCredentials");
    }
  }
}

/**
 * User already exists error
 */
export class UserExists extends AuthError {
  constructor(message = stryMutAct_9fa48("271") ? "" : (stryCov_9fa48("271"), "Utente già esistente")) {
    if (stryMutAct_9fa48("272")) {
      {}
    } else {
      stryCov_9fa48("272");
      super(message);
      this.name = stryMutAct_9fa48("273") ? "" : (stryCov_9fa48("273"), "UserExists");
    }
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends GunError {
  constructor(message = stryMutAct_9fa48("274") ? "" : (stryCov_9fa48("274"), "Timeout durante l'operazione")) {
    if (stryMutAct_9fa48("275")) {
      {}
    } else {
      stryCov_9fa48("275");
      super(message);
      this.name = stryMutAct_9fa48("276") ? "" : (stryCov_9fa48("276"), "TimeoutError");
    }
  }
}

/**
 * Multiple authentication error
 */
export class MultipleAuthError extends AuthError {
  constructor(message = stryMutAct_9fa48("277") ? "" : (stryCov_9fa48("277"), "Autenticazione multipla in corso")) {
    if (stryMutAct_9fa48("278")) {
      {}
    } else {
      stryCov_9fa48("278");
      super(message);
      this.name = stryMutAct_9fa48("279") ? "" : (stryCov_9fa48("279"), "MultipleAuthError");
    }
  }
}

/** Base error related to the network. */
export class NetworkError extends GunError {}
const withDefaultMessage = (args: any[], defaultMessage: string) => {
  if (stryMutAct_9fa48("280")) {
    {}
  } else {
    stryCov_9fa48("280");
    if (stryMutAct_9fa48("283") ? args.length === 0 && args.length === 1 && !args[0] : stryMutAct_9fa48("282") ? false : stryMutAct_9fa48("281") ? true : (stryCov_9fa48("281", "282", "283"), (stryMutAct_9fa48("285") ? args.length !== 0 : stryMutAct_9fa48("284") ? false : (stryCov_9fa48("284", "285"), args.length === 0)) || (stryMutAct_9fa48("287") ? args.length === 1 || !args[0] : stryMutAct_9fa48("286") ? false : (stryCov_9fa48("286", "287"), (stryMutAct_9fa48("289") ? args.length !== 1 : stryMutAct_9fa48("288") ? true : (stryCov_9fa48("288", "289"), args.length === 1)) && (stryMutAct_9fa48("290") ? args[0] : (stryCov_9fa48("290"), !args[0])))))) {
      if (stryMutAct_9fa48("291")) {
        {}
      } else {
        stryCov_9fa48("291");
        args = stryMutAct_9fa48("292") ? [] : (stryCov_9fa48("292"), [defaultMessage]);
      }
    }
    return args;
  }
};