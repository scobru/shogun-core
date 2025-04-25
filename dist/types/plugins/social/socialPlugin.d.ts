import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { UserProfile, TimelineResult, Post, Comment, Message, SocialPluginInterface } from "./types";
import { Observable } from "rxjs";
export declare class SocialPlugin extends BasePlugin implements SocialPluginInterface {
    name: string;
    version: string;
    description: string;
    private social;
    get user(): any;
    initialize(core: ShogunCore): void;
    destroy(): void;
    getProfile(pub: string): Promise<UserProfile>;
    post(content: string, options?: {
        title?: string;
        topic?: string;
        attachment?: string;
        reference?: string;
    }): Promise<Post | null>;
    /**
     * Cerca post per topic o hashtag
     * @param topic Argomento o hashtag da cercare
     * @returns Array di post che contengono l'argomento/hashtag
     */
    searchByTopic(topic: string): Promise<Post[]>;
    likePost(postId: string): Promise<boolean>;
    unlikePost(postId: string): Promise<boolean>;
    getLikes(postId: string): Promise<string[]>;
    getLikeCount(postId: string): Promise<number>;
    addComment(postId: string, content: string): Promise<Comment | null>;
    getComments(postId: string): Promise<Comment[]>;
    deletePost(postId: string): Promise<boolean>;
    getTimeline(): Promise<TimelineResult>;
    /**
     * Ottieni la timeline degli utenti seguiti (esclude i propri post)
     * @returns Timeline con i post degli utenti seguiti
     */
    getFollowingTimeline(): Promise<TimelineResult>;
    follow(pub: string): Promise<boolean>;
    /**
     * Aggiorna i campi del profilo utente
     * @param fields Oggetto con i campi da aggiornare (es. {bio: "Nuova bio"})
     * @returns true se l'operazione è riuscita
     */
    updateProfile(fields: Record<string, string>): Promise<boolean>;
    unfollow(pub: string): Promise<boolean>;
    cleanup(): void;
    /**
     * Ottieni la timeline come Observable per aggiornamenti in tempo reale
     * @param limit Numero massimo di post da recuperare
     * @param options Opzioni aggiuntive
     * @returns Observable della timeline
     */
    getTimelineObservable(limit?: number, options?: {
        includeLikes: boolean;
    }): Observable<Message[]>;
    /**
     * Ottieni i commenti di un post come Observable
     * @param postId ID del post
     * @returns Observable dei commenti
     */
    getCommentsObservable(postId: string): Observable<Comment[]>;
    /**
     * Ottieni gli utenti che hanno messo like a un post come Observable
     * @param postId ID del post
     * @returns Observable dei like
     */
    getLikesObservable(postId: string): Observable<string[]>;
    /**
     * Ottieni il conteggio dei like come Observable
     * @param postId ID del post
     * @returns Observable del conteggio like
     */
    getLikeCountObservable(postId: string): Observable<number>;
    /**
     * Ottieni un post arricchito con dettagli dell'autore
     * @param postId ID del post
     * @returns Observable del post con dettagli aggiuntivi
     */
    getEnrichedPostObservable(postId: string): Observable<any>;
    /**
     * Cerca post per topic con aggiornamenti in tempo reale
     * @param topic Argomento o hashtag da cercare
     * @returns Observable di post con il topic specificato
     */
    searchByTopicObservable(topic: string): Observable<Post[]>;
    /**
     * Osserva un profilo utente in tempo reale
     * @param pub Chiave pubblica dell'utente
     * @returns Observable del profilo utente
     */
    getProfileObservable(pub: string): Observable<UserProfile>;
    /**
     * Ottieni tutti gli utenti registrati sulla rete
     * @returns Array di profili utente base
     */
    getAllUsers(): Promise<UserProfile[]>;
    /**
     * Ottieni tutti gli utenti come Observable
     * @returns Observable di profili utente
     */
    getAllUsersObservable(): Observable<UserProfile[]>;
    /**
     * Ottieni i post creati dall'utente corrente
     * @param limit Numero massimo di post da recuperare
     * @param options Opzioni aggiuntive
     * @returns Risultato della timeline con i post dell'utente
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
