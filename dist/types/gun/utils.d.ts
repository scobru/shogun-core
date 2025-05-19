/**
 * Extracts the ID of a Gun node
 * @param node - Gun node object containing metadata
 * @returns The node ID from the metadata
 */
export declare const getId: (node: {
    _: {
        [x: string]: any;
    };
}) => any;
/**
 * Extracts the public key from a Gun ID (e.g., ~pubKey)
 * @param id - Gun ID string containing public key
 * @returns Extracted public key or null if not found
 */
export declare const getPub: (id: string) => string | null;
/**
 * Extracts the final public key from a concatenated ID (e.g., trust chain)
 * @param id - Concatenated Gun ID string
 * @returns Final public key in the chain or null if not found
 */
export declare const getTargetPub: (id: string) => string | null;
/**
 * Generates a unique UUID from Gun configuration
 * @param gun - Gun instance containing UUID generator
 * @returns Generated UUID string
 */
export declare const getUUID: (gun: {
    opt: () => {
        (): any;
        new (): any;
        _: {
            (): any;
            new (): any;
            opt: {
                (): any;
                new (): any;
                uuid: {
                    (): any;
                    new (): any;
                };
            };
        };
    };
}) => any;
/**
 * Converts a Gun set into an array of nodes
 * @param data - Gun data object containing set
 * @param id - ID of the set to convert
 * @returns Array of nodes from the set
 */
export declare const getSet: (data: {
    [x: string]: any;
}, id: string | number) => any[];
/**
 * Serializes an object into a query string
 * @param o - Object to serialize
 * @param prefix - Optional prefix for query string (defaults to "?")
 * @returns Serialized query string
 */
export declare const qs: (o: {
    [s: string]: unknown;
} | ArrayLike<unknown>, prefix?: string) => string;
/**
 * Converts an array of objects into an indexed object using item IDs as keys
 * @param arr - Array of objects with ID properties
 * @returns Object indexed by item IDs
 */
export declare const getIndexedObjectFromArray: (arr: any[]) => any;
/**
 * Converts an indexed object back into an array
 * @param indexedObj - Object containing indexed values
 * @returns Array of values from the indexed object
 */
export declare const getArrayFromIndexedObject: (indexedObj: ArrayLike<unknown> | {
    [s: string]: unknown;
}) => unknown[];
