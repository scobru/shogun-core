import { IGunInstance } from "gun";
import { EventEmitter } from "../../utils/eventEmitter";
import { Post, Comment, UserProfile, TimelineResult, Message } from "../../types/social";
import { Observable } from "rxjs";
/**
 * Plugin Social semplificato che utilizza direttamente Gun DB
 */
export declare class Social extends EventEmitter {
    private readonly gun;
    user: any;
    private readonly profileCache;
    private readonly cacheDuration;
    private readonly gunRx;
    constructor(gunInstance: IGunInstance<any>);
    /**
     * Metodo per loggare messaggi di debug
     */
    private debug;
    /**
     * Metodo per loggare errori
     */
    private error;
    /**
     * Genera un ID univoco (UUID v4)
     */
    private generateUUID;
    /**
     * Pulisce le cache e i listener
     */
    cleanup(): void;
    /**
     * Estrae gli hashtag dal testo
     * @param text Testo da analizzare
     * @returns Array di hashtag trovati
     */
    private extractHashtags;
    /**
     * Indicizza un post per hashtag
     * @param postId ID del post
     * @param hashtags Array di hashtag da indicizzare
     */
    private indexPostByHashtags;
    /**
     * Crea un nuovo post
     * @param content Contenuto del post
     * @param imageData Dati dell'immagine (Base64 o URL)
     * @returns Dati del post creato o null in caso di errore
     */
    post(content: string, imageData?: string): Promise<Post | null>;
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
     * Ottieni la timeline (post propri e di chi segui)
     * @returns Risultato della timeline
     */
    getTimeline(limit?: number, options?: {
        includeLikes: boolean;
        timeout?: number;
    }): Promise<TimelineResult>;
    /**
     * Ottieni l'oggetto dei like di un post
     * @private
     * @param postId ID del post
     * @returns Oggetto con i like
     */
    private getLikesObject;
    /**
     * Aggiungi un commento a un post
     * @param postId ID del post
     * @param content Contenuto del commento
     * @returns Dati del commento o null in caso di errore
     */
    addComment(postId: string, content: string): Promise<Comment | null>;
    /**
     * Ottieni i commenti di un post
     * @param postId ID del post
     * @returns Array di commenti
     */
    getComments(postId: string): Promise<Comment[]>;
    /**
     * Metti like a un post
     * @param postId ID del post
     * @returns true se l'operazione è riuscita
     */
    likePost(postId: string): Promise<boolean>;
    /**
     * Rimuovi like da un post
     * @param postId ID del post
     * @returns true se l'operazione è riuscita
     */
    unlikePost(postId: string): Promise<boolean>;
    /**
     * Ottieni gli utenti che hanno messo like a un post
     * @param postId ID del post
     * @returns Array di ID utenti che hanno messo like
     */
    getLikes(postId: string): Promise<string[]>;
    /**
     * Ottieni il conteggio dei like di un post
     * @param postId ID del post
     * @returns Numero di like
     */
    getLikeCount(postId: string): Promise<number>;
    /**
     * Cerca post per hashtag
     * @param hashtag Hashtag da cercare (senza #)
     * @returns Array di post che contengono l'hashtag
     */
    searchByHashtag(hashtag: string): Promise<Post[]>;
    /**
     * Elimina un post
     * @param postId ID del post da eliminare
     * @returns true se l'operazione è riuscita, false altrimenti
     */
    deletePost(postId: string): Promise<boolean>;
    /**
     * Ottieni la timeline (post propri e di chi segui) come Observable
     * @returns Observable di post in tempo reale
     */
    getTimelineObservable(limit?: number, options?: {
        includeLikes: boolean;
    }): Observable<Message[]>;
    /**
     * Ottieni i commenti di un post come Observable
     * @param postId ID del post
     * @returns Observable di commenti in tempo reale
     */
    getCommentsObservable(postId: string): Observable<Comment[]>;
    /**
     * Ottieni i like di un post come Observable
     * @param postId ID del post
     * @returns Observable del conteggio like in tempo reale
     */
    getLikesObservable(postId: string): Observable<string[]>;
    /**
     * Ottieni il conteggio dei like di un post come Observable
     * @param postId ID del post
     * @returns Observable con il numero di like in tempo reale
     */
    getLikeCountObservable(postId: string): Observable<number>;
    /**
     * Ottieni un post specifico con dettagli dell'autore in tempo reale
     * @param postId ID del post
     * @returns Observable del post arricchito con dettagli utente
     */
    getEnrichedPostObservable(postId: string): Observable<any>;
    /**
     * Cerca post per hashtag con aggiornamenti in tempo reale
     * @param hashtag Hashtag da cercare
     * @returns Observable di post con l'hashtag specificato
     */
    searchByHashtagObservable(hashtag: string): Observable<Post[]>;
    /**
     * Osserva il profilo di un utente in tempo reale
     * @param pub Chiave pubblica dell'utente
     * @returns Observable del profilo utente
     */
    getProfileObservable(pub: string): Observable<UserProfile>;
    /**
     * Ottieni tutti gli utenti registrati sulla rete
     * @returns Array di UserProfile base
     */
    getAllUsers(): Promise<UserProfile[]>;
    /**
     * Ottieni tutti gli utenti come Observable
     * @returns Observable di UserProfile
     */
    getAllUsersObservable(): Observable<UserProfile[]>;
}
