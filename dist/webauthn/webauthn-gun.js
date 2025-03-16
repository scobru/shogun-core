import { log, logError } from "../utils/logger";
import SEA from "gun/sea"; // Correzione: importazione corretta di SEA
class Webauthn {
    constructor(gunInstance) {
        this.rpId = window.location.hostname; // Sostituito con una chiamata diretta
        this.gunInstance = gunInstance;
        this.credential = null; // Inizializzazione della credenziale
    }
    async createCredential(username) {
        this.credential = await navigator.credentials.create({
            publicKey: {
                challenge: new Uint8Array(16),
                rp: { id: this.rpId, name: "Shogun Wallet" },
                user: {
                    id: new TextEncoder().encode(username),
                    name: username,
                    displayName: username,
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 }, // ECDSA, P-256 curve, for signing
                    { type: "public-key", alg: -25 }, // ECDH, P-256 curve, for creating shared secrets using SEA.secret
                    { type: "public-key", alg: -257 },
                ],
                authenticatorSelection: {
                    userVerification: "preferred",
                },
                timeout: 60000,
                attestation: "none",
            },
        });
        log("Credential:", this.credential);
        if (this.credential) {
            const publicKey = this.credential.response.getPublicKey();
            const rawKey = new Uint8Array(publicKey);
            log("Raw public key bytes:", rawKey);
            const xCoord = rawKey.slice(27, 59);
            const yCoord = rawKey.slice(59, 91);
            import('base64url').then(module => {
                const base64url = module.default;
                log("X coordinate (32 bytes):", base64url.encode(xCoord));
                log("Y coordinate (32 bytes):", base64url.encode(yCoord));
                const pub = `${base64url.encode(xCoord)}.${base64url.encode(yCoord)}`;
                log("Final pub format:", pub);
                // Salva l'associazione username -> pub in Gun
                if (this.gunInstance) {
                    this.gunInstance.get(`webauthn_${username}`).put({ pub });
                }
            });
        }
        else {
            logError("Impossibile creare la credenziale WebAuthn");
        }
    }
    async authenticator(data) {
        const challenge = new TextEncoder().encode(data);
        const options = {
            publicKey: {
                challenge,
                rpId: this.rpId,
                userVerification: "preferred",
                allowCredentials: this.credential
                    ? [
                        {
                            type: "public-key",
                            id: this.credential.rawId,
                        },
                    ]
                    : [],
                timeout: 60000,
            },
        };
        try {
            const assertion = await navigator.credentials.get(options);
            log("SIGNED:", { options, assertion });
            return assertion?.response || null;
        }
        catch (error) {
            logError("Errore durante l'autenticazione:", error);
            return null;
        }
    }
    async sign(data) {
        if (!this.credential) {
            logError("Create credential first");
            return null;
        }
        try {
            const signature = await SEA.sign(data, this.authenticator);
            log("Signature:", signature);
            return signature;
        }
        catch (err) {
            logError("Signing error:", err);
            return null;
        }
    }
    async verify(signature, pub) {
        if (!signature) {
            logError("Sign message first");
            return false;
        }
        try {
            const verified = await SEA.verify(signature, pub);
            log("Verified:", verified);
            return verified;
        }
        catch (err) {
            logError("Verification error:", err);
            return false;
        }
    }
    async setCredential(credential) {
        this.credential = credential;
    }
}
