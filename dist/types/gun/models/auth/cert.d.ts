import type { IPolicy, ISEAPair } from "gun";
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
export declare function make_certificate(grantees: {
    pub: string;
}[], policies: IPolicy[], issuer?: ISEAPair): Promise<string>;
/** Some premade policies */
export declare const policies: {
    /** Path must be prefixed with the string: "public" */
    prefix_path_public: {
        "#": {
            "*": string;
        };
    };
    /** Key must be prefixed with the string: "public" */
    prefix_key_public: {
        ".": {
            "*": string;
        };
    };
    /** Path or key must contain the public key of the user using the certificate */
    contains_pub: {
        "+": "*";
    };
    prefix_path_x: (path: string) => {
        "#": {
            "*": string;
        };
    };
    prefix_key_x: (key: string) => {
        ".": {
            "*": string;
        };
    };
};
