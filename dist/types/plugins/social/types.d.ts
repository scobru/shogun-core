/**
 * Rappresentazione semplificata di un post per le API client
 */
export interface Post {
    id: string;
    author: string;
    content: string;
    timestamp: number;
    title?: string;
    topic?: string;
    attachment?: string;
    reference?: string;
    likes?: Record<string, boolean>;
    comments?: Record<string, any>;
    payload?: {
        content?: string;
        attachment?: string;
    };
}
/**
 * Rappresentazione semplificata di un commento per le API client
 */
export interface Comment {
    id: string;
    author: string;
    content: string;
    timestamp: number;
    postId: string;
}
/**
 * Struttura del profilo utente
 */
export interface UserProfile {
    pub: string;
    alias?: string;
    bio?: string;
    profileImage?: string;
    followers: string[];
    following: string[];
    customFields: Record<string, string>;
}
/**
 * Tipi di messaggio supportati
 */
export declare enum MessageType {
    POST = "post",
    DIRECT = "direct",
    NOTIFICATION = "notification",
    SYSTEM = "system"
}
/**
 * Sottotipi di messaggio
 */
export declare enum MessageSubtype {
    EMPTY = "",
    TEXT = "text",
    IMAGE = "image",
    LIKE = "like",
    COMMENT = "comment",
    FOLLOW = "follow"
}
/**
 * Messaggio generico per la timeline
 */
export interface Message {
    id: string;
    type: MessageType;
    subtype: MessageSubtype;
    creator: string;
    createdAt: number;
    payload: Record<string, any>;
}
/**
 * Messaggio tipo post per la timeline
 */
export interface PostMessage extends Message {
    type: MessageType.POST;
    payload: {
        content: string;
        attachment?: string;
    };
    likes?: Record<string, boolean>;
}
/**
 * Risultato della timeline
 */
export interface TimelineResult {
    messages: Message[];
    error?: string;
}
/**
 * Interfaccia per il plugin Social
 */
export interface SocialPluginInterface {
    /**
     * Ottiene il profilo di un utente
     * @param pub Identificativo pubblico dell'utente
     * @returns Promise con il profilo utente
     */
    getProfile(pub: string): Promise<UserProfile>;
    /**
     * Crea un nuovo post
     * @param content Contenuto del post
     * @param options Opzioni aggiuntive (titolo, argomento, allegato, riferimento)
     * @returns Promise con il post creato o null in caso di errore
     */
    post(content: string, options?: {
        title?: string;
        topic?: string;
        attachment?: string;
        reference?: string;
    }): Promise<Post | null>;
    /**
     * Mette like a un post
     * @param postId ID del post
     * @returns Promise con esito dell'operazione
     */
    likePost(postId: string): Promise<boolean>;
    /**
     * Rimuove il like da un post
     * @param postId ID del post
     * @returns Promise con esito dell'operazione
     */
    unlikePost(postId: string): Promise<boolean>;
    /**
     * Ottiene i like di un post
     * @param postId ID del post
     * @returns Promise con lista di ID utenti che hanno messo like
     */
    getLikes(postId: string): Promise<string[]>;
    /**
     * Aggiunge un commento a un post
     * @param postId ID del post
     * @param content Contenuto del commento
     * @returns Promise con il commento creato o null in caso di errore
     */
    addComment(postId: string, content: string): Promise<Comment | null>;
    /**
     * Ottiene i commenti di un post
     * @param postId ID del post
     * @returns Promise con lista di commenti
     */
    getComments(postId: string): Promise<Comment[]>;
    /**
     * Ottiene la timeline dell'utente
     * @returns Promise con il risultato della timeline
     */
    getTimeline(): Promise<TimelineResult>;
    /**
     * Segue un utente
     * @param pub Identificativo pubblico dell'utente da seguire
     * @returns Promise con esito dell'operazione
     */
    follow(pub: string): Promise<boolean>;
    /**
     * Smette di seguire un utente
     * @param pub Identificativo pubblico dell'utente da non seguire più
     * @returns Promise con esito dell'operazione
     */
    unfollow(pub: string): Promise<boolean>;
    /**
     * Rilascia le risorse e pulisce le cache
     */
    cleanup(): void;
    /**
     * Cerca post per argomento/hashtag
     * @param topic Argomento o hashtag da cercare
     * @returns Promise con lista di post che contengono l'argomento
     */
    searchByTopic(topic: string): Promise<Post[]>;
}
