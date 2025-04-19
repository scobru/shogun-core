import Gun from "gun";
import "gun/sea";
/**
 * Rilascia un certificato utilizzando l'API SEA
 * @param options Opzioni per il certificato
 * @param options.pair Coppia di chiavi
 * @param options.tag Tag del certificato (default: "word")
 * @param options.dot Percorso permesso (default: "")
 * @param options.users Utenti destinatari (default: "*")
 * @param options.personal Se il certificato è personale (default: false)
 * @returns Certificato generato
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
 * Genera più certificati contemporaneamente
 * @param options Opzioni per la generazione
 * @param options.pair Coppia di chiavi
 * @param options.list Lista di configurazioni dei certificati
 * @returns Oggetto con tutti i certificati generati
 */
export async function generateCerts({ pair, list = [], }) {
    const all = {};
    for (const opt of list) {
        all[opt.tag] = await issueCert({ ...opt, pair });
    }
    return all;
}
/**
 * Verifica un certificato
 * @param cert Certificato da verificare
 * @param pub Chiave pubblica dell'emittente
 * @returns Risultato della verifica
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
 * Estrae la politica da un certificato
 * @param cert Certificato da analizzare
 * @returns Politica estratta o null in caso di errore
 */
export async function extractCertPolicy(cert) {
    if (!cert)
        return null;
    try {
        // Decodifica il certificato
        const json = JSON.parse(cert);
        if (json && json.m) {
            // Estrae la politica dal campo 'm'
            return json.m;
        }
        return null;
    }
    catch (e) {
        console.log("Errore estrazione politica: ", e);
        return null;
    }
}
