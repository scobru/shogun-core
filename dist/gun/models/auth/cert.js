"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.policies = void 0;
exports.make_certificate = make_certificate;
const gun_plus_1 = __importDefault(require("../../gun_plus"));
/**
 * Makes a certificate that can be used to write to another users graph.
 *
 * @param issuer - The sea pair of the user who will allow access. Defaults to currently logged in user.
 * @param grantees - The public keys of the users who will have access through the certificate.
 * @param policies - The LEX policy of the certificate
 * @example
   const issuer = user_1._.sea;
   ...
   const grantee = {pub: user_2.is.pub};
   make_certificate(grantee, {"*": ["public"]}) // path must be prefixed `public`.
 
 * @returns The certificate.
 */
async function make_certificate(grantees, policies, issuer) {
    const SEA = gun_plus_1.default?.instance?.SEA;
    if (!SEA)
        throw { err: "SEA is not available. Failed to make certificate." };
    const pair = issuer
        ? issuer
        : gun_plus_1.default.instance.user.pair() || { pub: "", priv: "" };
    if (!pair.pub) {
        throw new Error("Failed to make certificate. No issuer available.");
    }
    const certificate = await SEA.certify(grantees, policies, pair);
    return certificate;
}
/** Some premade policies */
exports.policies = {
    /** Path must be prefixed with the string: "public" */
    prefix_path_public: { "#": { "*": "public" } },
    /** Key must be prefixed with the string: "public" */
    prefix_key_public: { ".": { "*": "public" } },
    /** Path or key must contain the public key of the user using the certificate */
    contains_pub: { "+": "*" },
    prefix_path_x: (path) => {
        return { "#": { "*": path } };
    },
    prefix_key_x: (key) => {
        return { ".": { "*": key } };
    },
};
