import { EventEmitter } from "../../../utils/eventEmitter";
import { Post, Comment, TimelineResult, Message } from "../types";
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
     * Normalizza un post recuperato da Gun per evitare problemi di validazione
     * @param post Post da normalizzare
     * @param id ID del post
     * @returns Post normalizzato
     */
    private normalizePost;
    /**
     * Estrae gli hashtag dal testo o dal topic
     */
    private extractHashtags;
    /**
     * Crea un nuovo post con validazione dello schema
     */
    createPost(content: string, options?: {
        title?: string;
        topic?: string;
        attachment?: string;
        reference?: string;
    }): Promise<Post | null>;
    /**
     * Ottieni un post specifico
     */
    getPost(postId: string): Promise<Post | null>;
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
     * Cerca post per topic/hashtag
     */
    searchByTopic(topic: string): Promise<Post[]>;
    /**
     * Cerca post che contengono il topic nel testo
     */
    private searchPostsByTopicText;
    /**
     * Elimina un post
     */
    deletePost(postId: string): Promise<boolean>;
    /**
     * Helper privato: recupera likes come oggetto
     */
    private getLikesObject;
    /**
     * Pulisce la cache
     */
    clearCache(): void;
}
