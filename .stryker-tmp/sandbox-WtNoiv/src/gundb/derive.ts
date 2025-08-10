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
import { p256 } from "@noble/curves/p256";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { keccak_256 } from "@noble/hashes/sha3";
import { ripemd160 } from "@noble/hashes/ripemd160";
export interface DeriveOptions {
  includeSecp256k1Bitcoin?: boolean; // Bitcoin P2PKH using secp256k1
  includeSecp256k1Ethereum?: boolean; // Ethereum using secp256k1 + Keccak256
  includeP256?: boolean; // Default existing behavior (P-256)
}
export default async function (pwd: any, extra: any, options: DeriveOptions = {}): Promise<{
  pub: string;
  priv: string;
  epub: string;
  epriv: string;
  secp256k1Bitcoin: {
    privateKey: string;
    publicKey: string;
    address: string;
  };
  secp256k1Ethereum: {
    privateKey: string;
    publicKey: string;
    address: string;
  };
}> {
  if (stryMutAct_9fa48("114")) {
    {}
  } else {
    stryCov_9fa48("114");
    const TEXT_ENCODER = new TextEncoder();
    const pwdBytes = pwd ? (stryMutAct_9fa48("117") ? typeof pwd !== "string" : stryMutAct_9fa48("116") ? false : stryMutAct_9fa48("115") ? true : (stryCov_9fa48("115", "116", "117"), typeof pwd === (stryMutAct_9fa48("118") ? "" : (stryCov_9fa48("118"), "string")))) ? TEXT_ENCODER.encode(normalizeString(pwd)) : pwd : crypto.getRandomValues(new Uint8Array(32));
    const extras = extra ? (Array.isArray(extra) ? extra : stryMutAct_9fa48("119") ? [] : (stryCov_9fa48("119"), [extra])).map(stryMutAct_9fa48("120") ? () => undefined : (stryCov_9fa48("120"), e => normalizeString(e.toString()))) : stryMutAct_9fa48("121") ? ["Stryker was here"] : (stryCov_9fa48("121"), []);
    const extraBuf = TEXT_ENCODER.encode(extras.join(stryMutAct_9fa48("122") ? "" : (stryCov_9fa48("122"), "|")));
    const combinedInput = new Uint8Array(stryMutAct_9fa48("123") ? pwdBytes.length - extraBuf.length : (stryCov_9fa48("123"), pwdBytes.length + extraBuf.length));
    combinedInput.set(pwdBytes);
    combinedInput.set(extraBuf, pwdBytes.length);
    if (stryMutAct_9fa48("127") ? combinedInput.length >= 16 : stryMutAct_9fa48("126") ? combinedInput.length <= 16 : stryMutAct_9fa48("125") ? false : stryMutAct_9fa48("124") ? true : (stryCov_9fa48("124", "125", "126", "127"), combinedInput.length < 16)) {
      if (stryMutAct_9fa48("128")) {
        {}
      } else {
        stryCov_9fa48("128");
        throw new Error(stryMutAct_9fa48("129") ? `` : (stryCov_9fa48("129"), `Insufficient input entropy (${combinedInput.length})`));
      }
    }
    const version = stryMutAct_9fa48("130") ? "" : (stryCov_9fa48("130"), "v1");
    const result: any = {};

    // Mantieni comportamento esistente (P-256) come default
    const {
      includeP256 = stryMutAct_9fa48("131") ? false : (stryCov_9fa48("131"), true),
      includeSecp256k1Bitcoin = stryMutAct_9fa48("132") ? true : (stryCov_9fa48("132"), false),
      includeSecp256k1Ethereum = stryMutAct_9fa48("133") ? true : (stryCov_9fa48("133"), false)
    } = options;
    if (stryMutAct_9fa48("135") ? false : stryMutAct_9fa48("134") ? true : (stryCov_9fa48("134", "135"), includeP256)) {
      if (stryMutAct_9fa48("136")) {
        {}
      } else {
        stryCov_9fa48("136");
        const salts = stryMutAct_9fa48("137") ? [] : (stryCov_9fa48("137"), [stryMutAct_9fa48("138") ? {} : (stryCov_9fa48("138"), {
          label: stryMutAct_9fa48("139") ? "" : (stryCov_9fa48("139"), "signing"),
          type: stryMutAct_9fa48("140") ? "" : (stryCov_9fa48("140"), "pub/priv")
        }), stryMutAct_9fa48("141") ? {} : (stryCov_9fa48("141"), {
          label: stryMutAct_9fa48("142") ? "" : (stryCov_9fa48("142"), "encryption"),
          type: stryMutAct_9fa48("143") ? "" : (stryCov_9fa48("143"), "epub/epriv")
        })]);
        const [signingKeys, encryptionKeys] = await Promise.all(salts.map(async ({
          label
        }) => {
          if (stryMutAct_9fa48("144")) {
            {}
          } else {
            stryCov_9fa48("144");
            const salt = TEXT_ENCODER.encode(stryMutAct_9fa48("145") ? `` : (stryCov_9fa48("145"), `${label}-${version}`));
            const privateKey = await stretchKey(combinedInput, salt);
            if (stryMutAct_9fa48("148") ? false : stryMutAct_9fa48("147") ? true : stryMutAct_9fa48("146") ? p256.utils.isValidPrivateKey(privateKey) : (stryCov_9fa48("146", "147", "148"), !p256.utils.isValidPrivateKey(privateKey))) {
              if (stryMutAct_9fa48("149")) {
                {}
              } else {
                stryCov_9fa48("149");
                throw new Error(stryMutAct_9fa48("150") ? `` : (stryCov_9fa48("150"), `Invalid private key for ${label}`));
              }
            }
            const publicKey = p256.getPublicKey(privateKey, stryMutAct_9fa48("151") ? true : (stryCov_9fa48("151"), false));
            return stryMutAct_9fa48("152") ? {} : (stryCov_9fa48("152"), {
              pub: keyBufferToJwk(publicKey),
              priv: arrayBufToBase64UrlEncode(privateKey)
            });
          }
        }));

        // Chiavi P-256 esistenti
        result.pub = signingKeys.pub;
        result.priv = signingKeys.priv;
        result.epub = encryptionKeys.pub;
        result.epriv = encryptionKeys.priv;
      }
    }

    // Derivazione Bitcoin P2PKH (secp256k1 + SHA256 + RIPEMD160 + Base58)
    if (stryMutAct_9fa48("154") ? false : stryMutAct_9fa48("153") ? true : (stryCov_9fa48("153", "154"), includeSecp256k1Bitcoin)) {
      if (stryMutAct_9fa48("155")) {
        {}
      } else {
        stryCov_9fa48("155");
        const bitcoinSalt = TEXT_ENCODER.encode(stryMutAct_9fa48("156") ? `` : (stryCov_9fa48("156"), `secp256k1-bitcoin-${version}`));
        const bitcoinPrivateKey = await stretchKey(combinedInput, bitcoinSalt);
        if (stryMutAct_9fa48("159") ? false : stryMutAct_9fa48("158") ? true : stryMutAct_9fa48("157") ? secp256k1.utils.isValidPrivateKey(bitcoinPrivateKey) : (stryCov_9fa48("157", "158", "159"), !secp256k1.utils.isValidPrivateKey(bitcoinPrivateKey))) {
          if (stryMutAct_9fa48("160")) {
            {}
          } else {
            stryCov_9fa48("160");
            throw new Error(stryMutAct_9fa48("161") ? "" : (stryCov_9fa48("161"), "Invalid secp256k1 private key for Bitcoin"));
          }
        }
        const bitcoinPublicKey = secp256k1.getPublicKey(bitcoinPrivateKey, stryMutAct_9fa48("162") ? false : (stryCov_9fa48("162"), true)); // Compressed
        result.secp256k1Bitcoin = stryMutAct_9fa48("163") ? {} : (stryCov_9fa48("163"), {
          privateKey: bytesToHex(bitcoinPrivateKey),
          publicKey: bytesToHex(bitcoinPublicKey),
          address: deriveP2PKHAddress(bitcoinPublicKey)
        });
      }
    }

    // Derivazione Ethereum (secp256k1 + Keccak256)
    if (stryMutAct_9fa48("165") ? false : stryMutAct_9fa48("164") ? true : (stryCov_9fa48("164", "165"), includeSecp256k1Ethereum)) {
      if (stryMutAct_9fa48("166")) {
        {}
      } else {
        stryCov_9fa48("166");
        const ethereumSalt = TEXT_ENCODER.encode(stryMutAct_9fa48("167") ? `` : (stryCov_9fa48("167"), `secp256k1-ethereum-${version}`));
        const ethereumPrivateKey = await stretchKey(combinedInput, ethereumSalt);
        if (stryMutAct_9fa48("170") ? false : stryMutAct_9fa48("169") ? true : stryMutAct_9fa48("168") ? secp256k1.utils.isValidPrivateKey(ethereumPrivateKey) : (stryCov_9fa48("168", "169", "170"), !secp256k1.utils.isValidPrivateKey(ethereumPrivateKey))) {
          if (stryMutAct_9fa48("171")) {
            {}
          } else {
            stryCov_9fa48("171");
            throw new Error(stryMutAct_9fa48("172") ? "" : (stryCov_9fa48("172"), "Invalid secp256k1 private key for Ethereum"));
          }
        }
        const ethereumPublicKey = secp256k1.getPublicKey(ethereumPrivateKey, stryMutAct_9fa48("173") ? true : (stryCov_9fa48("173"), false)); // Uncompressed
        result.secp256k1Ethereum = stryMutAct_9fa48("174") ? {} : (stryCov_9fa48("174"), {
          privateKey: (stryMutAct_9fa48("175") ? "" : (stryCov_9fa48("175"), "0x")) + bytesToHex(ethereumPrivateKey),
          publicKey: (stryMutAct_9fa48("176") ? "" : (stryCov_9fa48("176"), "0x")) + bytesToHex(ethereumPublicKey),
          address: deriveKeccak256Address(ethereumPublicKey)
        });
      }
    }
    return result;
  }
}
function arrayBufToBase64UrlEncode(buf: Uint8Array) {
  if (stryMutAct_9fa48("177")) {
    {}
  } else {
    stryCov_9fa48("177");
    return btoa(String.fromCharCode(...buf)).replace(/\//g, stryMutAct_9fa48("178") ? "" : (stryCov_9fa48("178"), "_")).replace(/=/g, stryMutAct_9fa48("179") ? "Stryker was here!" : (stryCov_9fa48("179"), "")).replace(/\+/g, stryMutAct_9fa48("180") ? "" : (stryCov_9fa48("180"), "-"));
  }
}
function keyBufferToJwk(publicKeyBuffer: Uint8Array) {
  if (stryMutAct_9fa48("181")) {
    {}
  } else {
    stryCov_9fa48("181");
    if (stryMutAct_9fa48("184") ? publicKeyBuffer[0] === 4 : stryMutAct_9fa48("183") ? false : stryMutAct_9fa48("182") ? true : (stryCov_9fa48("182", "183", "184"), publicKeyBuffer[0] !== 4)) throw new Error(stryMutAct_9fa48("185") ? "" : (stryCov_9fa48("185"), "Invalid uncompressed public key format"));
    return (stryMutAct_9fa48("186") ? [] : (stryCov_9fa48("186"), [arrayBufToBase64UrlEncode(stryMutAct_9fa48("187") ? publicKeyBuffer : (stryCov_9fa48("187"), publicKeyBuffer.slice(1, 33))),
    // x
    arrayBufToBase64UrlEncode(stryMutAct_9fa48("188") ? publicKeyBuffer : (stryCov_9fa48("188"), publicKeyBuffer.slice(33, 65))) // y
    ])).join(stryMutAct_9fa48("189") ? "" : (stryCov_9fa48("189"), "."));
  }
}
function normalizeString(str: string) {
  if (stryMutAct_9fa48("190")) {
    {}
  } else {
    stryCov_9fa48("190");
    return stryMutAct_9fa48("191") ? str.normalize("NFC") : (stryCov_9fa48("191"), str.normalize(stryMutAct_9fa48("192") ? "" : (stryCov_9fa48("192"), "NFC")).trim());
  }
}
async function stretchKey(input: BufferSource, salt: Uint8Array, iterations = 300_000) {
  if (stryMutAct_9fa48("193")) {
    {}
  } else {
    stryCov_9fa48("193");
    const baseKey = await crypto.subtle.importKey(stryMutAct_9fa48("194") ? "" : (stryCov_9fa48("194"), "raw"), input, stryMutAct_9fa48("195") ? {} : (stryCov_9fa48("195"), {
      name: stryMutAct_9fa48("196") ? "" : (stryCov_9fa48("196"), "PBKDF2")
    }), stryMutAct_9fa48("197") ? true : (stryCov_9fa48("197"), false), stryMutAct_9fa48("198") ? [] : (stryCov_9fa48("198"), [stryMutAct_9fa48("199") ? "" : (stryCov_9fa48("199"), "deriveBits")]));
    const keyBits = await crypto.subtle.deriveBits(stryMutAct_9fa48("200") ? {} : (stryCov_9fa48("200"), {
      name: stryMutAct_9fa48("201") ? "" : (stryCov_9fa48("201"), "PBKDF2"),
      salt: salt as BufferSource,
      iterations,
      hash: stryMutAct_9fa48("202") ? "" : (stryCov_9fa48("202"), "SHA-256")
    }), baseKey, 256);
    return new Uint8Array(keyBits);
  }
}
function bytesToHex(bytes: Uint8Array): string {
  if (stryMutAct_9fa48("203")) {
    {}
  } else {
    stryCov_9fa48("203");
    return Array.from(bytes).map(stryMutAct_9fa48("204") ? () => undefined : (stryCov_9fa48("204"), b => b.toString(16).padStart(2, stryMutAct_9fa48("205") ? "" : (stryCov_9fa48("205"), "0")))).join(stryMutAct_9fa48("206") ? "Stryker was here!" : (stryCov_9fa48("206"), ""));
  }
}

// Base58 encoding per Bitcoin
const BASE58_ALPHABET = stryMutAct_9fa48("207") ? "" : (stryCov_9fa48("207"), "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
function base58Encode(bytes: Uint8Array): string {
  if (stryMutAct_9fa48("208")) {
    {}
  } else {
    stryCov_9fa48("208");
    if (stryMutAct_9fa48("211") ? bytes.length !== 0 : stryMutAct_9fa48("210") ? false : stryMutAct_9fa48("209") ? true : (stryCov_9fa48("209", "210", "211"), bytes.length === 0)) return stryMutAct_9fa48("212") ? "Stryker was here!" : (stryCov_9fa48("212"), "");

    // Count leading zeros
    let zeros = 0;
    for (let i = 0; stryMutAct_9fa48("214") ? i < bytes.length || bytes[i] === 0 : stryMutAct_9fa48("213") ? false : (stryCov_9fa48("213", "214"), (stryMutAct_9fa48("217") ? i >= bytes.length : stryMutAct_9fa48("216") ? i <= bytes.length : stryMutAct_9fa48("215") ? true : (stryCov_9fa48("215", "216", "217"), i < bytes.length)) && (stryMutAct_9fa48("219") ? bytes[i] !== 0 : stryMutAct_9fa48("218") ? true : (stryCov_9fa48("218", "219"), bytes[i] === 0))); stryMutAct_9fa48("220") ? i-- : (stryCov_9fa48("220"), i++)) {
      if (stryMutAct_9fa48("221")) {
        {}
      } else {
        stryCov_9fa48("221");
        stryMutAct_9fa48("222") ? zeros-- : (stryCov_9fa48("222"), zeros++);
      }
    }

    // Convert to base58
    const digits = stryMutAct_9fa48("223") ? [] : (stryCov_9fa48("223"), [0]);
    for (let i = zeros; stryMutAct_9fa48("226") ? i >= bytes.length : stryMutAct_9fa48("225") ? i <= bytes.length : stryMutAct_9fa48("224") ? false : (stryCov_9fa48("224", "225", "226"), i < bytes.length); stryMutAct_9fa48("227") ? i-- : (stryCov_9fa48("227"), i++)) {
      if (stryMutAct_9fa48("228")) {
        {}
      } else {
        stryCov_9fa48("228");
        let carry = bytes[i];
        for (let j = 0; stryMutAct_9fa48("231") ? j >= digits.length : stryMutAct_9fa48("230") ? j <= digits.length : stryMutAct_9fa48("229") ? false : (stryCov_9fa48("229", "230", "231"), j < digits.length); stryMutAct_9fa48("232") ? j-- : (stryCov_9fa48("232"), j++)) {
          if (stryMutAct_9fa48("233")) {
            {}
          } else {
            stryCov_9fa48("233");
            stryMutAct_9fa48("234") ? carry -= digits[j] << 8 : (stryCov_9fa48("234"), carry += digits[j] << 8);
            digits[j] = stryMutAct_9fa48("235") ? carry * 58 : (stryCov_9fa48("235"), carry % 58);
            carry = (stryMutAct_9fa48("236") ? carry * 58 : (stryCov_9fa48("236"), carry / 58)) | 0;
          }
        }
        while (stryMutAct_9fa48("239") ? carry <= 0 : stryMutAct_9fa48("238") ? carry >= 0 : stryMutAct_9fa48("237") ? false : (stryCov_9fa48("237", "238", "239"), carry > 0)) {
          if (stryMutAct_9fa48("240")) {
            {}
          } else {
            stryCov_9fa48("240");
            digits.push(stryMutAct_9fa48("241") ? carry * 58 : (stryCov_9fa48("241"), carry % 58));
            carry = (stryMutAct_9fa48("242") ? carry * 58 : (stryCov_9fa48("242"), carry / 58)) | 0;
          }
        }
      }
    }

    // Convert to string
    let result = stryMutAct_9fa48("243") ? "Stryker was here!" : (stryCov_9fa48("243"), "");
    for (let i = 0; stryMutAct_9fa48("246") ? i >= zeros : stryMutAct_9fa48("245") ? i <= zeros : stryMutAct_9fa48("244") ? false : (stryCov_9fa48("244", "245", "246"), i < zeros); stryMutAct_9fa48("247") ? i-- : (stryCov_9fa48("247"), i++)) {
      if (stryMutAct_9fa48("248")) {
        {}
      } else {
        stryCov_9fa48("248");
        stryMutAct_9fa48("249") ? result -= BASE58_ALPHABET[0] : (stryCov_9fa48("249"), result += BASE58_ALPHABET[0]);
      }
    }
    for (let i = stryMutAct_9fa48("250") ? digits.length + 1 : (stryCov_9fa48("250"), digits.length - 1); stryMutAct_9fa48("253") ? i < 0 : stryMutAct_9fa48("252") ? i > 0 : stryMutAct_9fa48("251") ? false : (stryCov_9fa48("251", "252", "253"), i >= 0); stryMutAct_9fa48("254") ? i++ : (stryCov_9fa48("254"), i--)) {
      if (stryMutAct_9fa48("255")) {
        {}
      } else {
        stryCov_9fa48("255");
        stryMutAct_9fa48("256") ? result -= BASE58_ALPHABET[digits[i]] : (stryCov_9fa48("256"), result += BASE58_ALPHABET[digits[i]]);
      }
    }
    return result;
  }
}
function deriveP2PKHAddress(publicKey: Uint8Array): string {
  if (stryMutAct_9fa48("257")) {
    {}
  } else {
    stryCov_9fa48("257");
    // Bitcoin P2PKH address derivation
    // 1. SHA256 hash del public key
    const sha256Hash = sha256(publicKey);

    // 2. RIPEMD160 hash del risultato
    const ripemd160Hash = ripemd160(sha256Hash);

    // 3. Aggiungi version byte (0x00 per mainnet P2PKH)
    const versionedHash = new Uint8Array(21);
    versionedHash[0] = 0x00; // Mainnet P2PKH version
    versionedHash.set(ripemd160Hash, 1);

    // 4. Double SHA256 per checksum
    const checksum = sha256(sha256(versionedHash));

    // 5. Aggiungi i primi 4 byte del checksum
    const addressBytes = new Uint8Array(25);
    addressBytes.set(versionedHash);
    addressBytes.set(stryMutAct_9fa48("258") ? checksum : (stryCov_9fa48("258"), checksum.slice(0, 4)), 21);

    // 6. Base58 encode
    return base58Encode(addressBytes);
  }
}
function deriveKeccak256Address(publicKey: Uint8Array): string {
  if (stryMutAct_9fa48("259")) {
    {}
  } else {
    stryCov_9fa48("259");
    // Ethereum address derivation usando Keccak256
    // 1. Rimuovi il prefix byte (0x04) dalla chiave pubblica non compressa
    const publicKeyWithoutPrefix = stryMutAct_9fa48("260") ? publicKey : (stryCov_9fa48("260"), publicKey.slice(1));

    // 2. Calcola Keccak256 hash
    const hash = keccak_256(publicKeyWithoutPrefix);

    // 3. Prendi gli ultimi 20 byte
    const address = stryMutAct_9fa48("261") ? hash : (stryCov_9fa48("261"), hash.slice(stryMutAct_9fa48("262") ? +20 : (stryCov_9fa48("262"), -20)));

    // 4. Aggiungi '0x' prefix e converti in hex
    return (stryMutAct_9fa48("263") ? "" : (stryCov_9fa48("263"), "0x")) + bytesToHex(address);
  }
}