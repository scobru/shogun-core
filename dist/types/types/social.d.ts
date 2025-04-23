/**
 * Configurazione per il Social Plugin
 */
export interface SocialConfig {
    cacheDuration: number;
}
/**
 * Entry di cache generica
 */
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
}
/**
 * Schema base di un messaggio sociale
 */
export interface SocialMessage {
    id: string;
    type: MessageType;
    subtype: MessageSubtype;
    creator: string;
    createdAt: number;
    payload: any;
}
/**
 * Tipi principali di messaggio
 */
export declare enum MessageType {
    POST = "POST",
    PROFILE = "PROFILE",
    MODERATION = "MODERATION",
    CONNECTION = "CONNECTION",
    FILE = "FILE"
}
/**
 * Sottotipi di messaggio
 */
export declare enum MessageSubtype {
    EMPTY = "",
    REPLY = "REPLY",
    REPOST = "REPOST",
    NICKNAME = "NICKNAME",
    BIO = "BIO",
    PROFILE_IMAGE = "PROFILE_IMAGE",
    CUSTOM = "CUSTOM",
    LIKE = "LIKE",
    BLOCK = "BLOCK",
    FOLLOW = "FOLLOW",
    TORRENT = "TORRENT",
    IPFS = "IPFS"
}
/**
 * Messaggio di tipo Post
 */
export interface PostMessage extends SocialMessage {
    type: MessageType.POST;
    subtype: MessageSubtype.EMPTY | MessageSubtype.REPLY | MessageSubtype.REPOST;
    payload: {
        topic?: string;
        title?: string;
        content: string;
        reference?: string;
        attachment?: string;
    };
}
/**
 * Messaggio di tipo Moderation (like)
 */
export interface ModerationMessage extends SocialMessage {
    type: MessageType.MODERATION;
    subtype: MessageSubtype.LIKE | MessageSubtype.BLOCK;
    payload: {
        reference: string;
    };
}
/**
 * Messaggio di tipo Connection (follow)
 */
export interface ConnectionMessage extends SocialMessage {
    type: MessageType.CONNECTION;
    subtype: MessageSubtype.FOLLOW | MessageSubtype.BLOCK;
    payload: {
        name: string;
    };
}
/**
 * Messaggio di tipo Profile
 */
export interface ProfileMessage extends SocialMessage {
    type: MessageType.PROFILE;
    subtype: MessageSubtype.NICKNAME | MessageSubtype.BIO | MessageSubtype.PROFILE_IMAGE | MessageSubtype.CUSTOM;
    payload: {
        key?: string;
        value: string;
    };
}
/**
 * Messaggio di tipo File
 */
export interface FileMessage extends SocialMessage {
    type: MessageType.FILE;
    subtype: MessageSubtype.TORRENT | MessageSubtype.IPFS;
    payload: {
        name: string;
        mimeType: string;
        data: string;
    };
}
/**
 * Tipo unione di tutti i messaggi possibili
 */
export type Message = PostMessage | ModerationMessage | ConnectionMessage | ProfileMessage | FileMessage;
/**
 * Rappresentazione semplificata di un post per le API client
 */
export interface Post {
    id: string;
    author: string;
    content: string;
    title?: string;
    topic?: string;
    attachment?: string;
    timestamp: number;
    reference?: string;
    hashtags?: Record<string, boolean>;
    hashtagsList?: string[];
    imageData?: string;
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
    customFields?: Record<string, string>;
}
/**
 * Risultato della timeline
 */
export interface TimelineResult {
    messages: Message[];
    error?: string;
}
/**
 * Interfaccia del Social Plugin
 */
export interface SocialPluginInterface {
    createMessage(message: Partial<Message>): Promise<Message | null>;
    getMessage(id: string): Promise<Message | null>;
    createPost(content: string, title?: string, topic?: string, attachment?: string): Promise<PostMessage | null>;
    replyToPost(postId: string, content: string): Promise<PostMessage | null>;
    repostMessage(postId: string, comment?: string): Promise<PostMessage | null>;
    postWithImage(content: string, imageData: string): Promise<Post | null>;
    searchByHashtag(hashtag: string): Promise<Post[]>;
    deletePost(postId: string): Promise<boolean>;
    likeMessage(messageId: string): Promise<boolean>;
    unlikeMessage(messageId: string): Promise<boolean>;
    getLikes(messageId: string): Promise<string[]>;
    getProfile(pub: string): Promise<UserProfile>;
    updateProfile(field: MessageSubtype, value: string, key?: string): Promise<boolean>;
    follow(pub: string): Promise<boolean>;
    unfollow(pub: string): Promise<boolean>;
    getTimeline(): Promise<TimelineResult>;
    getMessagesByType(type: MessageType, subtype?: MessageSubtype): Promise<Message[]>;
    cleanup(): void;
}
