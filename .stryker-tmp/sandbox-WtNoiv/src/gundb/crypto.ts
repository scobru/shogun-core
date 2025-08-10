/**
 * Cryptographic utilities for GunDB integration.
 * Based on GunDB's SEA (Security, Encryption, Authorization) module.
 * @see https://github.com/amark/gun/wiki/Snippets
 */
// @ts-nocheck
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
import { ISEAPair } from "gun";
import { SEA } from "gun";
import { v4 as uuidv4 } from "uuid";

/**
 * Checks if a string is a valid GunDB hash
 * @param str - String to check
 * @returns True if string matches GunDB hash format (44 chars ending with =)
 */
export function isHash(str: string) {
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    return stryMutAct_9fa48("3") ? typeof str === "string" && str.length === 44 || str.charAt(43) === "=" : stryMutAct_9fa48("2") ? false : stryMutAct_9fa48("1") ? true : (stryCov_9fa48("1", "2", "3"), (stryMutAct_9fa48("5") ? typeof str === "string" || str.length === 44 : stryMutAct_9fa48("4") ? true : (stryCov_9fa48("4", "5"), (stryMutAct_9fa48("7") ? typeof str !== "string" : stryMutAct_9fa48("6") ? true : (stryCov_9fa48("6", "7"), typeof str === (stryMutAct_9fa48("8") ? "" : (stryCov_9fa48("8"), "string")))) && (stryMutAct_9fa48("10") ? str.length !== 44 : stryMutAct_9fa48("9") ? true : (stryCov_9fa48("9", "10"), str.length === 44)))) && (stryMutAct_9fa48("12") ? str.charAt(43) !== "=" : stryMutAct_9fa48("11") ? true : (stryCov_9fa48("11", "12"), (stryMutAct_9fa48("13") ? str : (stryCov_9fa48("13"), str.charAt(43))) === (stryMutAct_9fa48("14") ? "" : (stryCov_9fa48("14"), "=")))));
  }
}

/**
 * Encrypts data with Gun.SEA
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Promise that resolves with the encrypted data
 */
export async function encrypt(data: any, key: string): Promise<string> {
  if (stryMutAct_9fa48("15")) {
    {}
  } else {
    stryCov_9fa48("15");
    if (stryMutAct_9fa48("18") ? !SEA && !SEA.encrypt : stryMutAct_9fa48("17") ? false : stryMutAct_9fa48("16") ? true : (stryCov_9fa48("16", "17", "18"), (stryMutAct_9fa48("19") ? SEA : (stryCov_9fa48("19"), !SEA)) || (stryMutAct_9fa48("20") ? SEA.encrypt : (stryCov_9fa48("20"), !SEA.encrypt)))) {
      if (stryMutAct_9fa48("21")) {
        {}
      } else {
        stryCov_9fa48("21");
        throw new Error(stryMutAct_9fa48("22") ? "" : (stryCov_9fa48("22"), "SEA is not available"));
      }
    }
    return SEA.encrypt(data, key);
  }
}

/**
 * Decrypts data with Gun.SEA
 * @param encryptedData Encrypted data
 * @param key Decryption key
 * @returns Promise that resolves with the decrypted data
 */
export async function decrypt(encryptedData: string, key: string): Promise<string | any> {
  if (stryMutAct_9fa48("23")) {
    {}
  } else {
    stryCov_9fa48("23");
    if (stryMutAct_9fa48("26") ? !SEA && !SEA.decrypt : stryMutAct_9fa48("25") ? false : stryMutAct_9fa48("24") ? true : (stryCov_9fa48("24", "25", "26"), (stryMutAct_9fa48("27") ? SEA : (stryCov_9fa48("27"), !SEA)) || (stryMutAct_9fa48("28") ? SEA.decrypt : (stryCov_9fa48("28"), !SEA.decrypt)))) {
      if (stryMutAct_9fa48("29")) {
        {}
      } else {
        stryCov_9fa48("29");
        throw new Error(stryMutAct_9fa48("30") ? "" : (stryCov_9fa48("30"), "SEA is not available"));
      }
    }
    return SEA.decrypt(encryptedData, key);
  }
}

/**
 * Encrypts data from a sender to a receiver using their public keys
 * @param data - Data to encrypt
 * @param sender - Sender's key pair
 * @param receiver - Receiver's public encryption key
 * @returns Promise resolving to encrypted data
 */
export async function encFor(data: any, sender: ISEAPair, receiver: {
  epub: string;
}) {
  if (stryMutAct_9fa48("31")) {
    {}
  } else {
    stryCov_9fa48("31");
    const secret = (await SEA.secret(receiver.epub, sender)) as string;
    const encryptedData = await SEA.encrypt(data, secret);
    return encryptedData;
  }
}

/**
 * Decrypts data from a sender using receiver's private key
 * @param data - Data to decrypt
 * @param sender - Sender's public encryption key
 * @param receiver - Receiver's key pair
 * @returns Promise resolving to decrypted data
 */
export async function decFrom(data: any, sender: {
  epub: string;
}, receiver: ISEAPair) {
  if (stryMutAct_9fa48("32")) {
    {}
  } else {
    stryCov_9fa48("32");
    const secret = (await SEA.secret(sender.epub, receiver)) as string;
    const decryptedData = await SEA.decrypt(data, secret);
    return decryptedData;
  }
}

/**
 * Creates a SHA-256 hash of text
 * @param text - Text to hash
 * @returns Promise resolving to hash string
 */
export async function hashText(text: string) {
  if (stryMutAct_9fa48("33")) {
    {}
  } else {
    stryCov_9fa48("33");
    if (stryMutAct_9fa48("36") ? !SEA && !SEA.work : stryMutAct_9fa48("35") ? false : stryMutAct_9fa48("34") ? true : (stryCov_9fa48("34", "35", "36"), (stryMutAct_9fa48("37") ? SEA : (stryCov_9fa48("37"), !SEA)) || (stryMutAct_9fa48("38") ? SEA.work : (stryCov_9fa48("38"), !SEA.work)))) {
      if (stryMutAct_9fa48("39")) {
        {}
      } else {
        stryCov_9fa48("39");
        throw new Error(stryMutAct_9fa48("40") ? "" : (stryCov_9fa48("40"), "SEA is not available"));
      }
    }
    let hash = await SEA.work(text, null, null, stryMutAct_9fa48("41") ? {} : (stryCov_9fa48("41"), {
      name: stryMutAct_9fa48("42") ? "" : (stryCov_9fa48("42"), "SHA-256")
    }));
    return hash;
  }
}

/**
 * Creates a hash of an object by stringifying it first
 * @param obj - Object to hash
 * @returns Promise resolving to hash and original stringified data
 */
export async function hashObj(obj: any) {
  if (stryMutAct_9fa48("43")) {
    {}
  } else {
    stryCov_9fa48("43");
    let hashed = (stryMutAct_9fa48("46") ? typeof obj !== "string" : stryMutAct_9fa48("45") ? false : stryMutAct_9fa48("44") ? true : (stryCov_9fa48("44", "45", "46"), typeof obj === (stryMutAct_9fa48("47") ? "" : (stryCov_9fa48("47"), "string")))) ? obj : JSON.stringify(obj);
    let hash = await hashText(hashed);
    return stryMutAct_9fa48("48") ? {} : (stryCov_9fa48("48"), {
      hash,
      hashed
    });
  }
}

/**
 * Generates a shared secret between two parties
 * @param epub - Public encryption key
 * @param pair - Key pair
 * @returns Promise resolving to shared secret
 */
export async function secret(epub: string, pair: ISEAPair) {
  if (stryMutAct_9fa48("49")) {
    {}
  } else {
    stryCov_9fa48("49");
    const secret = await SEA.secret(epub, pair);
    return secret;
  }
}

/**
 * Creates a short hash using PBKDF2
 * @param text - Text to hash
 * @param salt - Salt for hashing
 * @returns Promise resolving to hex-encoded hash
 */
export async function getShortHash(text: string, salt: string) {
  if (stryMutAct_9fa48("50")) {
    {}
  } else {
    stryCov_9fa48("50");
    return await SEA.work(text, null, null, stryMutAct_9fa48("51") ? {} : (stryCov_9fa48("51"), {
      name: stryMutAct_9fa48("52") ? "" : (stryCov_9fa48("52"), "PBKDF2"),
      encode: stryMutAct_9fa48("53") ? "" : (stryCov_9fa48("53"), "hex"),
      salt
    }));
  }
}

/**
 * Converts unsafe characters in hash to URL-safe versions
 * @param unsafe - String containing unsafe characters
 * @returns URL-safe string with encoded characters
 */
export function safeHash(unsafe: {
  replace: (arg0: RegExp, arg1: (c: any) => "-" | "." | "_" | undefined) => any;
}) {
  if (stryMutAct_9fa48("54")) {
    {}
  } else {
    stryCov_9fa48("54");
    if (stryMutAct_9fa48("57") ? false : stryMutAct_9fa48("56") ? true : stryMutAct_9fa48("55") ? unsafe : (stryCov_9fa48("55", "56", "57"), !unsafe)) return;
    const encode_regex = stryMutAct_9fa48("58") ? /[^+=/]/g : (stryCov_9fa48("58"), /[+=/]/g);
    return unsafe.replace(encode_regex, encodeChar);
  }
}

/**
 * Helper function to encode individual characters
 * @param c - Character to encode
 * @returns Encoded character
 */
//
function encodeChar(c: any) {
  if (stryMutAct_9fa48("59")) {
    {}
  } else {
    stryCov_9fa48("59");
    switch (c) {
      case stryMutAct_9fa48("61") ? "" : (stryCov_9fa48("61"), "+"):
        if (stryMutAct_9fa48("60")) {} else {
          stryCov_9fa48("60");
          return stryMutAct_9fa48("62") ? "" : (stryCov_9fa48("62"), "-");
        }
      case stryMutAct_9fa48("64") ? "" : (stryCov_9fa48("64"), "="):
        if (stryMutAct_9fa48("63")) {} else {
          stryCov_9fa48("63");
          return stryMutAct_9fa48("65") ? "" : (stryCov_9fa48("65"), ".");
        }
      case stryMutAct_9fa48("67") ? "" : (stryCov_9fa48("67"), "/"):
        if (stryMutAct_9fa48("66")) {} else {
          stryCov_9fa48("66");
          return stryMutAct_9fa48("68") ? "" : (stryCov_9fa48("68"), "_");
        }
    }
  }
}

/**
 * Converts URL-safe characters back to original hash characters
 * @param safe - URL-safe string
 * @returns Original string with decoded characters
 */
export function unsafeHash(safe: {
  replace: (arg0: RegExp, arg1: (c: any) => "=" | "+" | "/" | undefined) => any;
}) {
  if (stryMutAct_9fa48("69")) {
    {}
  } else {
    stryCov_9fa48("69");
    if (stryMutAct_9fa48("72") ? false : stryMutAct_9fa48("71") ? true : stryMutAct_9fa48("70") ? safe : (stryCov_9fa48("70", "71", "72"), !safe)) return;
    const decode_regex = stryMutAct_9fa48("73") ? /[^._-]/g : (stryCov_9fa48("73"), /[._-]/g);
    return safe.replace(decode_regex, decodeChar);
  }
}

/**
 * Helper function to decode individual characters
 * @param c - Character to decode
 * @returns Decoded character
 */
//
function decodeChar(c: any) {
  if (stryMutAct_9fa48("74")) {
    {}
  } else {
    stryCov_9fa48("74");
    switch (c) {
      case stryMutAct_9fa48("76") ? "" : (stryCov_9fa48("76"), "-"):
        if (stryMutAct_9fa48("75")) {} else {
          stryCov_9fa48("75");
          return stryMutAct_9fa48("77") ? "" : (stryCov_9fa48("77"), "+");
        }
      case stryMutAct_9fa48("79") ? "" : (stryCov_9fa48("79"), "."):
        if (stryMutAct_9fa48("78")) {} else {
          stryCov_9fa48("78");
          return stryMutAct_9fa48("80") ? "" : (stryCov_9fa48("80"), "=");
        }
      case stryMutAct_9fa48("82") ? "" : (stryCov_9fa48("82"), "_"):
        if (stryMutAct_9fa48("81")) {} else {
          stryCov_9fa48("81");
          return stryMutAct_9fa48("83") ? "" : (stryCov_9fa48("83"), "/");
        }
    }
  }
}

/**
 * Safely parses JSON with fallback to default value
 * @param input - String to parse as JSON
 * @param def - Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJSONParse(input: string, def = {}) {
  if (stryMutAct_9fa48("84")) {
    {}
  } else {
    stryCov_9fa48("84");
    if (stryMutAct_9fa48("87") ? false : stryMutAct_9fa48("86") ? true : stryMutAct_9fa48("85") ? input : (stryCov_9fa48("85", "86", "87"), !input)) {
      if (stryMutAct_9fa48("88")) {
        {}
      } else {
        stryCov_9fa48("88");
        return def;
      }
    } else if (stryMutAct_9fa48("91") ? typeof input !== "object" : stryMutAct_9fa48("90") ? false : stryMutAct_9fa48("89") ? true : (stryCov_9fa48("89", "90", "91"), typeof input === (stryMutAct_9fa48("92") ? "" : (stryCov_9fa48("92"), "object")))) {
      if (stryMutAct_9fa48("93")) {
        {}
      } else {
        stryCov_9fa48("93");
        return input;
      }
    }
    try {
      if (stryMutAct_9fa48("94")) {
        {}
      } else {
        stryCov_9fa48("94");
        return JSON.parse(input);
      }
    } catch (e) {
      if (stryMutAct_9fa48("95")) {
        {}
      } else {
        stryCov_9fa48("95");
        return def;
      }
    }
  }
}
export function randomUUID() {
  if (stryMutAct_9fa48("96")) {
    {}
  } else {
    stryCov_9fa48("96");
    const c = (globalThis as any)?.crypto as Crypto | undefined;
    if (stryMutAct_9fa48("99") ? c.randomUUID : stryMutAct_9fa48("98") ? false : stryMutAct_9fa48("97") ? true : (stryCov_9fa48("97", "98", "99"), c?.randomUUID)) return c.randomUUID();
    try {
      if (stryMutAct_9fa48("100")) {
        {}
      } else {
        stryCov_9fa48("100");
        if (stryMutAct_9fa48("103") ? c.getRandomValues : stryMutAct_9fa48("102") ? false : stryMutAct_9fa48("101") ? true : (stryCov_9fa48("101", "102", "103"), c?.getRandomValues)) {
          if (stryMutAct_9fa48("104")) {
            {}
          } else {
            stryCov_9fa48("104");
            const bytes = new Uint8Array(16);
            c.getRandomValues(bytes);
            bytes[6] = bytes[6] & 0x0f | 0x40; // version 4
            bytes[8] = bytes[8] & 0x3f | 0x80; // variant RFC4122
            const toHex = stryMutAct_9fa48("105") ? () => undefined : (stryCov_9fa48("105"), (() => {
              const toHex = (n: number) => n.toString(16).padStart(2, stryMutAct_9fa48("106") ? "" : (stryCov_9fa48("106"), "0"));
              return toHex;
            })());
            const b = Array.from(bytes).map(toHex).join(stryMutAct_9fa48("107") ? "Stryker was here!" : (stryCov_9fa48("107"), ""));
            return stryMutAct_9fa48("108") ? `` : (stryCov_9fa48("108"), `${stryMutAct_9fa48("109") ? b : (stryCov_9fa48("109"), b.slice(0, 8))}-${stryMutAct_9fa48("110") ? b : (stryCov_9fa48("110"), b.slice(8, 12))}-${stryMutAct_9fa48("111") ? b : (stryCov_9fa48("111"), b.slice(12, 16))}-${stryMutAct_9fa48("112") ? b : (stryCov_9fa48("112"), b.slice(16, 20))}-${stryMutAct_9fa48("113") ? b : (stryCov_9fa48("113"), b.slice(20))}`);
          }
        }
      }
    } catch {}
    return uuidv4();
  }
}