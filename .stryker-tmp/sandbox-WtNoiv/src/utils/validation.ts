// @ts-nocheck
// Utility di validazione e generazione credenziali per ShogunCore
function stryNS_9fa48() {
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
import { OAuthProvider } from "../plugins/oauth/types";

// --- VALIDAZIONE ---

/**
 * Valida uno username secondo le regole comuni
 */
export function validateUsername(username: string): boolean {
  if (stryMutAct_9fa48("6374")) {
    {}
  } else {
    stryCov_9fa48("6374");
    if (stryMutAct_9fa48("6377") ? !username && typeof username !== "string" : stryMutAct_9fa48("6376") ? false : stryMutAct_9fa48("6375") ? true : (stryCov_9fa48("6375", "6376", "6377"), (stryMutAct_9fa48("6378") ? username : (stryCov_9fa48("6378"), !username)) || (stryMutAct_9fa48("6380") ? typeof username === "string" : stryMutAct_9fa48("6379") ? false : (stryCov_9fa48("6379", "6380"), typeof username !== (stryMutAct_9fa48("6381") ? "" : (stryCov_9fa48("6381"), "string")))))) return stryMutAct_9fa48("6382") ? true : (stryCov_9fa48("6382"), false);
    if (stryMutAct_9fa48("6385") ? username.length < 3 && username.length > 64 : stryMutAct_9fa48("6384") ? false : stryMutAct_9fa48("6383") ? true : (stryCov_9fa48("6383", "6384", "6385"), (stryMutAct_9fa48("6388") ? username.length >= 3 : stryMutAct_9fa48("6387") ? username.length <= 3 : stryMutAct_9fa48("6386") ? false : (stryCov_9fa48("6386", "6387", "6388"), username.length < 3)) || (stryMutAct_9fa48("6391") ? username.length <= 64 : stryMutAct_9fa48("6390") ? username.length >= 64 : stryMutAct_9fa48("6389") ? false : (stryCov_9fa48("6389", "6390", "6391"), username.length > 64)))) return stryMutAct_9fa48("6392") ? true : (stryCov_9fa48("6392"), false);
    if (stryMutAct_9fa48("6395") ? false : stryMutAct_9fa48("6394") ? true : stryMutAct_9fa48("6393") ? /^[a-zA-Z0-9._-]+$/.test(username) : (stryCov_9fa48("6393", "6394", "6395"), !(stryMutAct_9fa48("6399") ? /^[^a-zA-Z0-9._-]+$/ : stryMutAct_9fa48("6398") ? /^[a-zA-Z0-9._-]$/ : stryMutAct_9fa48("6397") ? /^[a-zA-Z0-9._-]+/ : stryMutAct_9fa48("6396") ? /[a-zA-Z0-9._-]+$/ : (stryCov_9fa48("6396", "6397", "6398", "6399"), /^[a-zA-Z0-9._-]+$/)).test(username))) return stryMutAct_9fa48("6400") ? true : (stryCov_9fa48("6400"), false);
    return stryMutAct_9fa48("6401") ? false : (stryCov_9fa48("6401"), true);
  }
}

/**
 * Valida una email
 */
export function validateEmail(email: string): boolean {
  if (stryMutAct_9fa48("6402")) {
    {}
  } else {
    stryCov_9fa48("6402");
    if (stryMutAct_9fa48("6405") ? !email && typeof email !== "string" : stryMutAct_9fa48("6404") ? false : stryMutAct_9fa48("6403") ? true : (stryCov_9fa48("6403", "6404", "6405"), (stryMutAct_9fa48("6406") ? email : (stryCov_9fa48("6406"), !email)) || (stryMutAct_9fa48("6408") ? typeof email === "string" : stryMutAct_9fa48("6407") ? false : (stryCov_9fa48("6407", "6408"), typeof email !== (stryMutAct_9fa48("6409") ? "" : (stryCov_9fa48("6409"), "string")))))) return stryMutAct_9fa48("6410") ? true : (stryCov_9fa48("6410"), false);
    // Regex semplice per email
    return (stryMutAct_9fa48("6421") ? /^[^@\s]+@[^@\s]+\.[^@\S]+$/ : stryMutAct_9fa48("6420") ? /^[^@\s]+@[^@\s]+\.[@\s]+$/ : stryMutAct_9fa48("6419") ? /^[^@\s]+@[^@\s]+\.[^@\s]$/ : stryMutAct_9fa48("6418") ? /^[^@\s]+@[^@\S]+\.[^@\s]+$/ : stryMutAct_9fa48("6417") ? /^[^@\s]+@[@\s]+\.[^@\s]+$/ : stryMutAct_9fa48("6416") ? /^[^@\s]+@[^@\s]\.[^@\s]+$/ : stryMutAct_9fa48("6415") ? /^[^@\S]+@[^@\s]+\.[^@\s]+$/ : stryMutAct_9fa48("6414") ? /^[@\s]+@[^@\s]+\.[^@\s]+$/ : stryMutAct_9fa48("6413") ? /^[^@\s]@[^@\s]+\.[^@\s]+$/ : stryMutAct_9fa48("6412") ? /^[^@\s]+@[^@\s]+\.[^@\s]+/ : stryMutAct_9fa48("6411") ? /[^@\s]+@[^@\s]+\.[^@\s]+$/ : (stryCov_9fa48("6411", "6412", "6413", "6414", "6415", "6416", "6417", "6418", "6419", "6420", "6421"), /^[^@\s]+@[^@\s]+\.[^@\s]+$/)).test(email);
  }
}

/**
 * Valida un provider OAuth supportato
 */
export function validateProvider(provider: string): provider is OAuthProvider {
  if (stryMutAct_9fa48("6422")) {
    {}
  } else {
    stryCov_9fa48("6422");
    return (stryMutAct_9fa48("6423") ? [] : (stryCov_9fa48("6423"), [stryMutAct_9fa48("6424") ? "" : (stryCov_9fa48("6424"), "google"), stryMutAct_9fa48("6425") ? "" : (stryCov_9fa48("6425"), "github"), stryMutAct_9fa48("6426") ? "" : (stryCov_9fa48("6426"), "discord"), stryMutAct_9fa48("6427") ? "" : (stryCov_9fa48("6427"), "twitter"), stryMutAct_9fa48("6428") ? "" : (stryCov_9fa48("6428"), "custom")])).includes(provider);
  }
}

// --- GENERAZIONE USERNAME ---

/**
 * Genera uno username uniforme a partire da provider e userInfo
 * Esempio: google_utente, github_12345, nostr_pubkey, web3_0xabc...
 */
export function generateUsernameFromIdentity(provider: string, userInfo: {
  id?: string;
  email?: string;
  name?: string;
}): string {
  if (stryMutAct_9fa48("6429")) {
    {}
  } else {
    stryCov_9fa48("6429");
    if (stryMutAct_9fa48("6432") ? provider === "web3" || userInfo.id : stryMutAct_9fa48("6431") ? false : stryMutAct_9fa48("6430") ? true : (stryCov_9fa48("6430", "6431", "6432"), (stryMutAct_9fa48("6434") ? provider !== "web3" : stryMutAct_9fa48("6433") ? true : (stryCov_9fa48("6433", "6434"), provider === (stryMutAct_9fa48("6435") ? "" : (stryCov_9fa48("6435"), "web3")))) && userInfo.id)) {
      if (stryMutAct_9fa48("6436")) {
        {}
      } else {
        stryCov_9fa48("6436");
        return stryMutAct_9fa48("6437") ? `` : (stryCov_9fa48("6437"), `web3_${stryMutAct_9fa48("6438") ? userInfo.id.toUpperCase() : (stryCov_9fa48("6438"), userInfo.id.toLowerCase())}`);
      }
    }
    if (stryMutAct_9fa48("6441") ? provider === "nostr" || userInfo.id : stryMutAct_9fa48("6440") ? false : stryMutAct_9fa48("6439") ? true : (stryCov_9fa48("6439", "6440", "6441"), (stryMutAct_9fa48("6443") ? provider !== "nostr" : stryMutAct_9fa48("6442") ? true : (stryCov_9fa48("6442", "6443"), provider === (stryMutAct_9fa48("6444") ? "" : (stryCov_9fa48("6444"), "nostr")))) && userInfo.id)) {
      if (stryMutAct_9fa48("6445")) {
        {}
      } else {
        stryCov_9fa48("6445");
        return stryMutAct_9fa48("6446") ? `` : (stryCov_9fa48("6446"), `nostr_${userInfo.id}`);
      }
    }
    if (stryMutAct_9fa48("6449") ? provider === "webauthn" || userInfo.id : stryMutAct_9fa48("6448") ? false : stryMutAct_9fa48("6447") ? true : (stryCov_9fa48("6447", "6448", "6449"), (stryMutAct_9fa48("6451") ? provider !== "webauthn" : stryMutAct_9fa48("6450") ? true : (stryCov_9fa48("6450", "6451"), provider === (stryMutAct_9fa48("6452") ? "" : (stryCov_9fa48("6452"), "webauthn")))) && userInfo.id)) {
      if (stryMutAct_9fa48("6453")) {
        {}
      } else {
        stryCov_9fa48("6453");
        return stryMutAct_9fa48("6454") ? `` : (stryCov_9fa48("6454"), `webauthn_${userInfo.id}`);
      }
    }
    if (stryMutAct_9fa48("6457") ? userInfo.email || validateEmail(userInfo.email) : stryMutAct_9fa48("6456") ? false : stryMutAct_9fa48("6455") ? true : (stryCov_9fa48("6455", "6456", "6457"), userInfo.email && validateEmail(userInfo.email))) {
      if (stryMutAct_9fa48("6458")) {
        {}
      } else {
        stryCov_9fa48("6458");
        return stryMutAct_9fa48("6459") ? `` : (stryCov_9fa48("6459"), `${provider}_${userInfo.email.split(stryMutAct_9fa48("6460") ? "" : (stryCov_9fa48("6460"), "@"))[0]}`);
      }
    }
    if (stryMutAct_9fa48("6462") ? false : stryMutAct_9fa48("6461") ? true : (stryCov_9fa48("6461", "6462"), userInfo.name)) {
      if (stryMutAct_9fa48("6463")) {
        {}
      } else {
        stryCov_9fa48("6463");
        return stryMutAct_9fa48("6464") ? `` : (stryCov_9fa48("6464"), `${provider}_${userInfo.name.replace(stryMutAct_9fa48("6466") ? /\S+/g : stryMutAct_9fa48("6465") ? /\s/g : (stryCov_9fa48("6465", "6466"), /\s+/g), stryMutAct_9fa48("6467") ? "" : (stryCov_9fa48("6467"), "_"))}`);
      }
    }
    if (stryMutAct_9fa48("6469") ? false : stryMutAct_9fa48("6468") ? true : (stryCov_9fa48("6468", "6469"), userInfo.id)) {
      if (stryMutAct_9fa48("6470")) {
        {}
      } else {
        stryCov_9fa48("6470");
        return stryMutAct_9fa48("6471") ? `` : (stryCov_9fa48("6471"), `${provider}_${userInfo.id}`);
      }
    }
    return stryMutAct_9fa48("6472") ? `` : (stryCov_9fa48("6472"), `${provider}_user`);
  }
}

// --- GENERAZIONE PASSWORD DETERMINISTICA ---

import { ethers } from "ethers";

/**
 * Genera una password deterministica sicura a partire da un salt
 * Usare per OAuth, Web3, Nostr, ecc.
 */
export function generateDeterministicPassword(salt: string): string {
  if (stryMutAct_9fa48("6473")) {
    {}
  } else {
    stryCov_9fa48("6473");
    // Restituisce una stringa hex di 32 caratteri
    return stryMutAct_9fa48("6474") ? ethers.keccak256(ethers.toUtf8Bytes(salt)) : (stryCov_9fa48("6474"), ethers.keccak256(ethers.toUtf8Bytes(salt)).slice(2, 34));
  }
}