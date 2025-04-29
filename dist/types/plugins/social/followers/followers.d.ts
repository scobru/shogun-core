import { EventEmitter } from "../../../utils/eventEmitter";
import { IGunInstance } from "gun";
/**
 * Service dedicato alle operazioni di follow/unfollow tra utenti
 */
export declare class Followers extends EventEmitter {
    private readonly gun;
    constructor(gunInstance: IGunInstance<any>);
    /**
     * Segui un altro utente
     * @param targetPub Chiave pubblica dell'utente da seguire
     * @returns true se l'operazione è riuscita
     */
    follow(targetPub: string): Promise<boolean>;
    /**
     * Smetti di seguire un utente
     * @param targetPub Chiave pubblica dell'utente da smettere di seguire
     * @returns true se l'operazione è riuscita
     */
    unfollow(targetPub: string): Promise<boolean>;
    /**
     * Ottieni la lista dei follower di un utente
     * @param pub Chiave pubblica dell'utente
     * @returns Array di pub keys dei follower
     */
    getFollowers(pub: string): Promise<string[]>;
    /**
     * Ottieni la lista degli utenti seguiti da un utente
     * @param pub Chiave pubblica dell'utente
     * @returns Array di pub keys degli utenti seguiti
     */
    getFollowing(pub: string): Promise<string[]>;
}
