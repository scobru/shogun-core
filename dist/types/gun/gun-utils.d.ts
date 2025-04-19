/**
 * Estrae l'ID di un nodo Gun
 */
export declare const getId: (node: {
    _: {
        [x: string]: any;
    };
}) => any;
/**
 * Estrae la chiave pubblica da un ID Gun (es: ~pubKey)
 */
export declare const getPub: (id: string) => string | null;
/**
 * Estrae la chiave pubblica finale da ID concatenato (es: trust chain)
 */
export declare const getTargetPub: (id: string) => string | null;
/**
 * UUID unico generato dalla configurazione di Gun
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
 * Converte un set Gun in un array di nodi
 */
export declare const getSet: (data: {
    [x: string]: any;
}, id: string | number) => any[];
/**
 * Serializza un oggetto in query string
 */
export declare const qs: (o: {
    [s: string]: unknown;
} | ArrayLike<unknown>, prefix?: string) => string;
