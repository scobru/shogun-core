"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qs = exports.getSet = exports.getUUID = exports.getTargetPub = exports.getPub = exports.getId = void 0;
/**
 * Extracts the ID of a Gun node
 */
const getId = (node) => node?._?.["#"];
exports.getId = getId;
/**
 * Extracts the public key from a Gun ID (e.g., ~pubKey)
 */
const getPub = (id) => {
    const match = /~([^@][^\.]+\.[^\.]+)/.exec(id);
    return match ? match[1] : null;
};
exports.getPub = getPub;
/**
 * Extracts the final public key from a concatenated ID (e.g., trust chain)
 */
const getTargetPub = (id) => {
    const match = /~[^@][^\.]+\.[^\.]+.*~([^@][^\.]+\.[^\.]+)$/.exec(id);
    return match ? match[1] : null;
};
exports.getTargetPub = getTargetPub;
/**
 * Generates a unique UUID from Gun configuration
 */
const getUUID = (gun) => gun.opt()._.opt.uuid();
exports.getUUID = getUUID;
/**
 * Converts a Gun set into an array of nodes
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
 * Serializes an object into a query string
 */
const qs = (o, prefix = "?") => {
    const filtered = Object.fromEntries(Object.entries(o).filter(([_, v]) => v));
    const stringified = JSON.stringify(filtered);
    return stringified ? `${prefix}${stringified}` : "";
};
exports.qs = qs;
