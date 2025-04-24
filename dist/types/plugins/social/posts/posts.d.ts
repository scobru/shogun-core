import { EventEmitter } from "../../../utils/eventEmitter";
import { Post, Comment, TimelineResult, Message } from "../../../types/social";
import { GunRxJS } from "../../../gun/rxjs-integration";
import { Observable } from "rxjs";
import { IGunInstance } from "gun";
/**
 * Service dedicato ai post: creazione, recupero, like, commenti, ricerca
 */
export declare class PostService extends EventEmitter {
    private readonly gun;
    private readonly user;
    readonly gunRx: GunRxJS;
    private readonly ajv;
    private readonly validatePost;
    private readonly validateComment;
    private readonly postCache;
    private readonly cacheDuration;
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
     * Estrae gli hashtag dal testo
     */
    private extractHashtags;
    /**
     * Indicizza un post per hashtag
     */
    private indexPostByHashtags;
    /**
     * Pulisce la cache
     */
    clearCache(): void;
    /**
     * Normalizza l'oggetto autore per garantire compatibilità con il database
     * @param postData Dati del post da normalizzare
     */
    private normalizeAuthor;
    /**
     * Crea un nuovo post con validazione dello schema
     */
    createPost(content: string, imageData?: string): Promise<Post | null>;
    /**
     * Ottieni un post specifico
     */
    getPost(postId: string): Promise<Post | null>;
    /**
     * Normalizza un post recuperato da Gun per evitare problemi di validazione
     * @param post Post da normalizzare
     * @param id ID del post
     * @returns Post normalizzato
     */
    private normalizePost;
    /**
     * Recupera la timeline (post propri e di chi segui)
     */
    getTimeline(limit?: number, options?: {
        includeLikes: boolean;
        timeout?: number;
        onlyFollowing?: boolean;
    }): Promise<TimelineResult>;
    /**
     * Timeline come Observable
     */
    getTimelineObservable(limit?: number, options?: {
        includeLikes: boolean;
    }): Observable<Message[]>;
    /**
     * Aggiungi un commento a un post con validazione dello schema
     */
    addComment(postId: string, content: string): Promise<Comment | null>;
    /**
     * Ottieni i commenti di un post
     */
    getComments(postId: string): Promise<Comment[]>;
    /**
     * Metti like a un post
     */
    likePost(postId: string): Promise<boolean>;
    /**
     * Rimuovi like da un post
     */
    unlikePost(postId: string): Promise<boolean>;
    /**
     * Ottieni gli utenti che hanno messo like a un post
     */
    getLikes(postId: string): Promise<string[]>;
    /**
     * Cerca post per hashtag
     */
    searchByHashtag(hashtag: string): Promise<Post[]>;
    /**
     * Elimina un post
     */
    deletePost(postId: string): Promise<boolean>;
    /**
     * Helper privato: recupera likes come oggetto
     */
    private getLikesObject;
}
