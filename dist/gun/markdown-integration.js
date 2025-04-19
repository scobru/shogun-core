import { encrypt, decrypt, sign } from "./gun-encryption";
import MD from "markdown-it";
// Importa i plugin necessari per markdown-it
// Assicurati di installare questi pacchetti: npm install markdown-it markdown-it-wikilinks markdown-it-iframe
const WikiLinks = require("markdown-it-wikilinks");
const IFrame = require("markdown-it-iframe");
/**
 * Cache per valori decriptati
 */
const seaMemo = new Map();
const eprivsMemo = new Map();
const oeprivsMemo = new Map();
/**
 * Ottiene l'ID di un elemento Gun
 * @param element Elemento Gun con ID
 * @returns ID dell'elemento o undefined
 */
export const getId = (element) => {
    return element && element._?.["#"];
};
/**
 * Estrae la chiave pubblica da un ID
 * @param id ID da cui estrarre la chiave pubblica
 * @returns Chiave pubblica o undefined
 */
export const getPub = (id) => {
    if (!id)
        return undefined;
    const match = /~([^@][^\.]+\.[^\.]+)/.exec(id);
    return match ? match[1] : undefined;
};
/**
 * Estrae la chiave pubblica di destinazione da un ID concatenato
 * @param id ID concatenato
 * @returns Chiave pubblica di destinazione o undefined
 */
export const getTargetPub = (id) => {
    if (!id)
        return undefined;
    const match = /~[^@][^\.]+\.[^\.]+.*~([^@][^\.]+\.[^\.]+)$/.exec(id);
    return match ? match[1] : undefined;
};
/**
 * Ottiene array di elementi da un set Gun
 * @param data Dati Gun
 * @param id ID del set
 * @returns Array di elementi
 */
export const getSet = (data, id) => {
    const set = data[id];
    if (!set)
        return [];
    return Object.keys(set)
        .filter((key) => key !== "_")
        .map((key) => set[key])
        .filter((value) => !!value && typeof value === "object" && value["#"])
        .map((ref) => data[ref["#"]])
        .filter(Boolean);
};
/**
 * Verifica se un valore è un riferimento
 * @param value Valore da verificare
 * @returns True se è un riferimento
 */
const isRef = (value) => {
    return !!value && typeof value === "object" && "#" in value;
};
/**
 * Configura un parser Markdown con supporto per WikiLinks e iFrame
 * @param options Opzioni di configurazione
 * @returns Parser markdown-it configurato
 */
export const getMd = ({ pub, base, hash, }) => {
    return MD()
        .use(IFrame, {
        height: 300,
    })
        .use(WikiLinks({
        baseURL: `${base || ""}?id=`,
        uriSuffix: hash,
        makeAllLinksAbsolute: true,
        postProcessPageName: (pageName) => {
            pageName = pageName.trim();
            if (pageName === "/") {
                pageName = "";
            }
            else {
                pageName = `.${pageName}`;
            }
            return encodeURIComponent((pub ? `~${pub}` : "") + pageName);
        },
    }));
};
/**
 * Hook personalizzato per usare Gun con React
 * @param gun Istanza Gun
 * @param useState Hook useState di React
 * @param pair Coppia di chiavi
 * @returns Tuple con dati, onData e funzione puts
 */
export const useGun = (gun, useState, pair) => {
    const [data, setData] = useState({});
    const [debouncer] = useState(new Debouncer(setData));
    // Gestisce i dati ricevuti
    const onData = async (element, key) => {
        const id = getId(element) || key;
        const decrypted = await decryptNode(element, pair);
        debouncer.setData((data) => ({
            ...data,
            [id]: { ...data[id], ...decrypted },
        }));
    };
    // Invia dati a Gun
    const puts = async (...values) => {
        // Aggiorna lo stato locale
        setData((data) => values.reduce((data, [id, key, value]) => ({
            ...data,
            [id]: { _: { "#": id }, ...data[id], [key]: value },
        }), data));
        // Invia a Gun
        for (const [id, key, value, otherPair] of values) {
            await putData(gun, id, key, value, otherPair || pair);
        }
    };
    return [data, onData, puts];
};
/**
 * Memorizza un valore in Gun, con crittografia opzionale
 * @param gun Istanza Gun
 * @param id ID del nodo
 * @param key Chiave del valore
 * @param value Valore da memorizzare
 * @param pair Coppia di chiavi per crittografia
 */
export const putData = async (gun, id, key, value, pair) => {
    let processedValue = value;
    // Applica crittografia se disponibile
    if (pair) {
        if (value && typeof value !== "object") {
            const epriv = pair.oepriv && key === "priv" ? pair.oepriv : pair.epriv;
            if (epriv) {
                const encrypted = await encrypt(value, epriv);
                seaMemo.set(encrypted, value);
                processedValue = encrypted;
            }
        }
        // Firma i dati se c'è una chiave privata
        if (pair.priv) {
            processedValue = await sign({
                "#": id,
                ".": key,
                ":": processedValue,
                ">": Date.now(),
            }, pair);
        }
    }
    // Memorizza in Gun
    gun.get(id).get(key).put(processedValue);
};
/**
 * Decripta un nodo Gun
 * @param node Nodo da decriptare
 * @param pair Coppia di chiavi per decriptazione
 * @returns Nodo decriptato
 */
export const decryptNode = async (node, pair) => {
    if (!node)
        return node;
    // Memorizza le chiavi di criptazione
    if (pair) {
        if (pair.epriv && pair.pub) {
            eprivsMemo.set(pair.pub, pair.epriv);
        }
        if (pair.oepriv && pair.pub) {
            oeprivsMemo.set(pair.pub, pair.oepriv);
        }
    }
    // Clona il nodo per non modificare l'originale
    const result = { ...node };
    const id = getId(result);
    const pub = id ? getPub(id) : undefined;
    const targetPub = id ? getTargetPub(id) : undefined;
    // Processa ogni proprietà
    for (const key of Object.keys(result)) {
        const value = result[key];
        // Decripta valori SEA
        if (typeof value === "string" && value.startsWith("SEA{")) {
            if (seaMemo.has(value)) {
                result[key] = seaMemo.get(value);
            }
            else {
                try {
                    const epriv = key === "priv" && pub
                        ? oeprivsMemo.get(pub)
                        : pub
                            ? eprivsMemo.get(pub)
                            : undefined;
                    if (!epriv) {
                        throw new Error(`Nessuna chiave epriv nota per questa chiave pubblica`);
                    }
                    const decrypted = await decrypt(value, epriv);
                    if (decrypted === undefined) {
                        throw new Error("Decriptazione fallita");
                    }
                    else {
                        result[key] = decrypted;
                        seaMemo.set(value, decrypted);
                    }
                }
                catch (e) {
                    delete result[key];
                    continue;
                }
            }
        }
        // Memorizza epriv per uso futuro
        if (key === "epriv" && targetPub) {
            eprivsMemo.set(targetPub, result[key]);
        }
    }
    return result;
};
/**
 * Utility per gestire aggiornamenti debounced
 */
class Debouncer {
    constructor(callback) {
        this.callback = callback;
        this.handler = null;
        this.updates = [];
    }
    setData(update) {
        this.updates.push(update);
        if (!this.handler) {
            this.handler = setTimeout(() => {
                const updates = this.updates;
                this.callback((data) => updates.reduce((data, update) => update(data), data));
                this.updates = [];
                this.handler = null;
            }, 15);
        }
    }
}
