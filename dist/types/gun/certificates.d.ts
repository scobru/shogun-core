import "gun/sea";
/**
 * Issues a certificate using the SEA API
 * @param options Certificate options
 * @param options.pair Key pair
 * @param options.tag Certificate tag (default: "word")
 * @param options.dot Allowed path (default: "")
 * @param options.users Target users (default: "*")
 * @param options.personal Whether certificate is personal (default: false)
 * @returns Generated certificate
 */
export declare function issueCert({ pair, tag, dot, users, personal, }: {
    pair: any;
    tag?: string;
    dot?: string;
    users?: string;
    personal?: boolean;
}): Promise<string>;
/**
 * Generates multiple certificates simultaneously
 * @param options Generation options
 * @param options.pair Key pair
 * @param options.list List of certificate configurations
 * @returns Object containing all generated certificates
 */
export declare function generateCerts({ pair, list, }: {
    pair: any;
    list: Array<{
        tag: string;
        dot?: string;
        users?: string;
        personal?: boolean;
    }>;
}): Promise<Record<string, string>>;
/**
 * Verifies a certificate
 * @param cert Certificate to verify
 * @param pub Issuer's public key
 * @returns Verification result
 */
export declare function verifyCert(cert: string, pub: string | {
    pub: string;
}): Promise<any>;
/**
 * Extracts policy from a certificate
 * @param cert Certificate to analyze
 * @returns Extracted policy or null if error
 */
export declare function extractCertPolicy(cert: string): Promise<any>;
