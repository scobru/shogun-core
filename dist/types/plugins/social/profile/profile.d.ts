import { EventEmitter } from "../../../utils/eventEmitter";
import { IGunInstance } from "gun";
import { UserProfile } from "../types";
/**
 * Service dedicato alla gestione dei profili utente
 */
export declare class Profile extends EventEmitter {
    private readonly gun;
    private readonly profileCache;
    private readonly cacheDuration;
    constructor(gunInstance: IGunInstance<any>);
    /**
     * Ottieni il profilo di un utente
     * @param pub Chiave pubblica dell'utente
     * @returns Profilo dell'utente
     */
    getProfile(pub: string): Promise<UserProfile>;
    /**
     * Aggiorna un campo del profilo
     * @param field Nome del campo da aggiornare
     * @param value Nuovo valore
     * @returns true se l'operazione è riuscita
     */
    updateProfile(field: string, value: string): Promise<boolean>;
    /**
     * Aggiorna campi multipli del profilo
     * @param fields Record di campo-valore da aggiornare
     * @returns true se l'operazione è riuscita
     */
    updateProfileFields(fields: Record<string, string>): Promise<boolean>;
    /**
     * Pulisce la cache dei profili
     */
    clearCache(): void;
}
