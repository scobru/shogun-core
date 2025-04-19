import { GunDB } from "./gun";
/**
 * Interfaccia per un nodo Gun con ID
 */
interface WithGunId {
    _?: {
        "#"?: string;
        [key: string]: any;
    };
    [key: string]: any;
}
/**
 * Interfaccia per coppia di chiavi estesa
 */
interface ExtendedPair {
    pub?: string;
    priv?: string;
    epriv?: string;
    oepriv?: string;
    [key: string]: any;
}
/**
 * Ottiene l'ID di un elemento Gun
 * @param element Elemento Gun con ID
 * @returns ID dell'elemento o undefined
 */
export declare const getId: (element: WithGunId) => string | undefined;
/**
 * Estrae la chiave pubblica da un ID
 * @param id ID da cui estrarre la chiave pubblica
 * @returns Chiave pubblica o undefined
 */
export declare const getPub: (id?: string) => string | undefined;
/**
 * Estrae la chiave pubblica di destinazione da un ID concatenato
 * @param id ID concatenato
 * @returns Chiave pubblica di destinazione o undefined
 */
export declare const getTargetPub: (id?: string) => string | undefined;
/**
 * Ottiene array di elementi da un set Gun
 * @param data Dati Gun
 * @param id ID del set
 * @returns Array di elementi
 */
export declare const getSet: (data: Record<string, any>, id: string) => any[];
/**
 * Configura un parser Markdown con supporto per WikiLinks e iFrame
 * @param options Opzioni di configurazione
 * @returns Parser markdown-it configurato
 */
export declare const getMd: ({ pub, base, hash, }: {
    pub?: string;
    base?: string;
    hash?: string;
}) => any;
/**
 * Hook personalizzato per usare Gun con React
 * @param gun Istanza Gun
 * @param useState Hook useState di React
 * @param pair Coppia di chiavi
 * @returns Tuple con dati, onData e funzione puts
 */
export declare const useGun: (gun: GunDB, useState: any, pair: ExtendedPair) => (Record<string, any> | ((element: WithGunId, key: string) => Promise<void>) | ((...values: [string, string, any, ExtendedPair | undefined][]) => Promise<void>))[];
/**
 * Memorizza un valore in Gun, con crittografia opzionale
 * @param gun Istanza Gun
 * @param id ID del nodo
 * @param key Chiave del valore
 * @param value Valore da memorizzare
 * @param pair Coppia di chiavi per crittografia
 */
export declare const putData: (gun: GunDB, id: string, key: string, value: any, pair: ExtendedPair) => Promise<void>;
/**
 * Decripta un nodo Gun
 * @param node Nodo da decriptare
 * @param pair Coppia di chiavi per decriptazione
 * @returns Nodo decriptato
 */
export declare const decryptNode: (node: WithGunId, pair?: ExtendedPair) => Promise<WithGunId>;
export {};
