import { stringify } from "qs";
/**
 * Estrae l'ID di un nodo Gun
 */
export const getId = (node) => node?._?.["#"];
/**
 * Estrae la chiave pubblica da un ID Gun (es: ~pubKey)
 */
export const getPub = (id) => {
    const match = /~([^@][^\.]+\.[^\.]+)/.exec(id);
    return match ? match[1] : null;
};
/**
 * Estrae la chiave pubblica finale da ID concatenato (es: trust chain)
 */
export const getTargetPub = (id) => {
    const match = /~[^@][^\.]+\.[^\.]+.*~([^@][^\.]+\.[^\.]+)$/.exec(id);
    return match ? match[1] : null;
};
/**
 * UUID unico generato dalla configurazione di Gun
 */
export const getUUID = (gun) => gun.opt()._.opt.uuid();
/**
 * Converte un set Gun in un array di nodi
 */
export const getSet = (data, id) => {
    const set = data[id];
    if (!set)
        return [];
    return Object.keys(set)
        .filter((key) => key !== "_")
        .map((key) => set[key])
        .filter((val) => val && typeof val === "object" && val["#"])
        .map((ref) => data[ref["#"]])
        .filter(Boolean);
};
/**
 * Serializza un oggetto in query string
 */
export const qs = (o, prefix = "?") => {
    const filtered = Object.fromEntries(Object.entries(o).filter(([_, v]) => v));
    const stringified = stringify(filtered);
    return stringified ? `${prefix}${stringified}` : "";
};
