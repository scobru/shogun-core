import Gun from "gun";
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
export async function issueCert({ pair, tag = "word", dot = "", users = "*", personal = false, }) {
    const policy = { "*": `${tag}` };
    if (dot) {
        policy["."] = dot;
    }
    if (personal) {
        policy["+"] = "*";
    }
    try {
        const cert = await Gun.SEA.certify(users, policy, pair, null);
        return cert || "";
    }
    catch (e) {
        console.log("Errore certificato: ", e);
        return "";
    }
}
/**
 * Generates multiple certificates simultaneously
 * @param options Generation options
 * @param options.pair Key pair
 * @param options.list List of certificate configurations
 * @returns Object containing all generated certificates
 */
export async function generateCerts({ pair, list = [], }) {
    const all = {};
    for (const opt of list) {
        all[opt.tag] = await issueCert({ ...opt, pair });
    }
    return all;
}
/**
 * Verifies a certificate
 * @param cert Certificate to verify
 * @param pub Issuer's public key
 * @returns Verification result
 */
export async function verifyCert(cert, pub) {
    if (!cert)
        return null;
    try {
        return await Gun.SEA.verify(cert, pub);
    }
    catch (e) {
        console.log("Errore verifica certificato: ", e);
        return null;
    }
}
/**
 * Extracts policy from a certificate
 * @param cert Certificate to analyze
 * @returns Extracted policy or null if error
 */
export async function extractCertPolicy(cert) {
    if (!cert)
        return null;
    try {
        // Decode certificate
        const json = JSON.parse(cert);
        if (json && json.m) {
            // Extract policy from 'm' field
            return json.m;
        }
        return null;
    }
    catch (e) {
        console.log("Errore estrazione politica: ", e);
        return null;
    }
}
