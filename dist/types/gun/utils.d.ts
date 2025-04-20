/**
 * Extracts the ID of a Gun node
 */
export declare const getId: (node: {
    _: {
        [x: string]: any;
    };
}) => any;
/**
 * Extracts the public key from a Gun ID (e.g., ~pubKey)
 */
export declare const getPub: (id: string) => string | null;
/**
 * Extracts the final public key from a concatenated ID (e.g., trust chain)
 */
export declare const getTargetPub: (id: string) => string | null;
/**
 * Generates a unique UUID from Gun configuration
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
 */
export declare const getSet: (data: {
    [x: string]: any;
}, id: string | number) => any[];
/**
 * Serializes an object into a query string
 */
export declare const qs: (o: {
    [s: string]: unknown;
} | ArrayLike<unknown>, prefix?: string) => string;
