"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qs = exports.getSet = exports.getUUID = exports.getTargetPub = exports.getPub = exports.getId = void 0;
const qs_1 = require("qs");
/**
 * Estrae l'ID di un nodo Gun
 */
const getId = (node) => node?._?.["#"];
exports.getId = getId;
/**
 * Estrae la chiave pubblica da un ID Gun (es: ~pubKey)
 */
const getPub = (id) => {
    const match = /~([^@][^\.]+\.[^\.]+)/.exec(id);
    return match ? match[1] : null;
};
exports.getPub = getPub;
/**
 * Estrae la chiave pubblica finale da ID concatenato (es: trust chain)
 */
const getTargetPub = (id) => {
    const match = /~[^@][^\.]+\.[^\.]+.*~([^@][^\.]+\.[^\.]+)$/.exec(id);
    return match ? match[1] : null;
};
exports.getTargetPub = getTargetPub;
/**
 * UUID unico generato dalla configurazione di Gun
 */
const getUUID = (gun) => gun.opt()._.opt.uuid();
exports.getUUID = getUUID;
/**
 * Converte un set Gun in un array di nodi
 */
const getSet = (data, id) => {
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
exports.getSet = getSet;
/**
 * Serializza un oggetto in query string
 */
const qs = (o, prefix = "?") => {
    const filtered = Object.fromEntries(Object.entries(o).filter(([_, v]) => v));
    const stringified = (0, qs_1.stringify)(filtered);
    return stringified ? `${prefix}${stringified}` : "";
};
exports.qs = qs;
