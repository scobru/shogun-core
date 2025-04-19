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
export declare function issueCert({ pair, tag, dot, users, personal, }: {
    pair: any;
    tag?: string;
    dot?: string;
    users?: string;
    personal?: boolean;
}): Promise<string>;
/**
 * Genera più certificati contemporaneamente
 * @param options Opzioni per la generazione
 * @param options.pair Coppia di chiavi
 * @param options.list Lista di configurazioni dei certificati
 * @returns Oggetto con tutti i certificati generati
 */
export declare function generateCerts({ pair, list, }: {
    pair: any;
    list: Array<{
        tag: string;
        dot?: string;
        users?: string;
        personal?: boolean;
    }>;
}): Promise<Record<string, string>>;
/**
 * Verifica un certificato
 * @param cert Certificato da verificare
 * @param pub Chiave pubblica dell'emittente
 * @returns Risultato della verifica
 */
export declare function verifyCert(cert: string, pub: string | {
    pub: string;
}): Promise<any>;
/**
 * Estrae la politica da un certificato
 * @param cert Certificato da analizzare
 * @returns Politica estratta o null in caso di errore
 */
export declare function extractCertPolicy(cert: string): Promise<any>;
