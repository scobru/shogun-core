"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArrayFromIndexedObject = exports.getIndexedObjectFromArray = exports.qs = exports.getSet = exports.getUUID = exports.getTargetPub = exports.getPub = exports.getId = void 0;
/**
 * Extracts the ID of a Gun node
 * @param node - Gun node object containing metadata
 * @returns The node ID from the metadata
 */
const getId = (node) => node?._?.["#"];
exports.getId = getId;
/**
 * Extracts the public key from a Gun ID (e.g., ~pubKey)
 * @param id - Gun ID string containing public key
 * @returns Extracted public key or null if not found
 */
const getPub = (id) => {
    const match = /~([^@][^\.]+\.[^\.]+)/.exec(id);
    return match ? match[1] : null;
};
exports.getPub = getPub;
/**
 * Extracts the final public key from a concatenated ID (e.g., trust chain)
 * @param id - Concatenated Gun ID string
 * @returns Final public key in the chain or null if not found
 */
const getTargetPub = (id) => {
    const match = /~[^@][^\.]+\.[^\.]+.*~([^@][^\.]+\.[^\.]+)$/.exec(id);
    return match ? match[1] : null;
};
exports.getTargetPub = getTargetPub;
/**
 * Generates a unique UUID from Gun configuration
 * @param gun - Gun instance containing UUID generator
 * @returns Generated UUID string
 */
const getUUID = (gun) => gun.opt()._.opt.uuid();
exports.getUUID = getUUID;
/**
 * Converts a Gun set into an array of nodes
 * @param data - Gun data object containing set
 * @param id - ID of the set to convert
 * @returns Array of nodes from the set
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
 * @param o - Object to serialize
 * @param prefix - Optional prefix for query string (defaults to "?")
 * @returns Serialized query string
 */
const qs = (o, prefix = "?") => {
    const filtered = Object.fromEntries(Object.entries(o).filter(([_, v]) => v));
    const stringified = JSON.stringify(filtered);
    return stringified ? `${prefix}${stringified}` : "";
};
exports.qs = qs;
/**
 * Converts an array of objects into an indexed object using item IDs as keys
 * @param arr - Array of objects with ID properties
 * @returns Object indexed by item IDs
 */
const getIndexedObjectFromArray = (arr) => {
    return arr.reduce((acc, item) => {
        return {
            ...acc,
            [item.id]: item,
        };
    }, {});
};
exports.getIndexedObjectFromArray = getIndexedObjectFromArray;
/**
 * Converts an indexed object back into an array
 * @param indexedObj - Object containing indexed values
 * @returns Array of values from the indexed object
 */
const getArrayFromIndexedObject = (indexedObj) => {
    return Object.values(indexedObj);
};
exports.getArrayFromIndexedObject = getArrayFromIndexedObject;
