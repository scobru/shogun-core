import { EventEmitter } from "../../utils/eventEmitter";
import { Post, Comment, UserProfile, TimelineResult, Message } from "./types";
import { GunRxJS } from "../../gun/rxjs-integration";
import { Observable } from "rxjs";
import { IGunInstance } from "gun";
import { FriendService } from "./friends/friends";
import { MessageService } from "./messagges/messages";
import { CertificateService } from "./certificates/certs";
import { PostService } from "./posts/posts";
/**
 * Plugin Social che utilizza Gun DB
 */
export declare class Social extends EventEmitter {
    private readonly gun;
    readonly user: any;
    private readonly profileCache;
    private readonly cacheDuration;
    readonly gunRx: GunRxJS;
    readonly friendService: FriendService;
    readonly messageService: MessageService;
    readonly certificateService: CertificateService;
    readonly postService: PostService;
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
     * Pulisce le cache e i listener
     */
    cleanup(): void;
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
     * Crea un nuovo post - delegato a PostService
     */
    post(content: string, options?: {
        title?: string;
        topic?: string;
        attachment?: string;
        reference?: string;
    }): Promise<Post | null>;
    /**
     * Ottieni la timeline - delegato a PostService
     */
    getTimeline(limit?: number, options?: {
        includeLikes: boolean;
        timeout?: number;
        onlyFollowing?: boolean;
    }): Promise<TimelineResult>;
    /**
     * Aggiungi un commento a un post - delegato a PostService
     */
    addComment(postId: string, content: string): Promise<Comment | null>;
    /**
     * Ottieni i commenti di un post - delegato a PostService
     */
    getComments(postId: string): Promise<Comment[]>;
    /**
     * Metti like a un post - delegato a PostService
     */
    likePost(postId: string): Promise<boolean>;
    /**
     * Rimuovi like da un post - delegato a PostService
     */
    unlikePost(postId: string): Promise<boolean>;
    /**
     * Ottieni gli utenti che hanno messo like a un post - delegato a PostService
     */
    getLikes(postId: string): Promise<string[]>;
    /**
     * Ottieni il conteggio dei like di un post - delegato a PostService
     */
    getLikeCount(postId: string): Promise<number>;
    /**
     * Cerca post per topic/hashtag - delegato a PostService
     */
    searchByTopic(topic: string): Promise<Post[]>;
    /**
     * Elimina un post - delegato a PostService
     */
    deletePost(postId: string): Promise<boolean>;
    /**
     * Ottieni la timeline come Observable - delegato a PostService
     */
    getTimelineObservable(limit?: number, options?: {
        includeLikes: boolean;
    }): Observable<Message[]>;
    /**
     * Ottieni un post specifico con dettagli dell'autore in tempo reale
     * @param postId ID del post
     * @returns Observable del post arricchito con dettagli utente
     */
    getEnrichedPostObservable(postId: string): Observable<any>;
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
    /**
     * Ottieni i post creati dall'utente corrente - delegato a PostService
     */
    getUserPosts(limit?: number, options?: {
        includeLikes: boolean;
        timeout?: number;
    }): Promise<TimelineResult>;
    /**
     * Ottieni i post creati dall'utente corrente come Observable
     * @param limit Numero massimo di post da recuperare
     * @param options Opzioni aggiuntive
     * @returns Observable di post in tempo reale
     */
    getUserPostsObservable(limit?: number, options?: {
        includeLikes: boolean;
    }): Observable<Message[]>;
}
