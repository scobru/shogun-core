import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Post, Comment, SocialPluginInterface } from "./types";
export declare class SocialPlugin extends BasePlugin implements SocialPluginInterface {
    name: string;
    version: string;
    description: string;
    private social;
    private gun;
    get user(): any;
    initialize(core: ShogunCore): void;
    destroy(): void;
    /**
     * Creates a new post using the standardized Post message format
     * @param content Content of the post
     * @param options Additional options for the post
     * @returns Promise with the created post or null
     */
    post(content: string, options?: {
        title?: string;
        topic?: string;
        attachment?: string;
        reference?: string;
    }): Promise<Post | null>;
    /**
     * Likes a post by creating a MODERATION message with LIKE subtype
     * @param postId ID of the post to like
     * @returns Promise with operation result
     */
    likePost(postId: string): Promise<boolean>;
    /**
     * Unlikes a post by creating a MODERATION message with BLOCK subtype (to cancel the like)
     * @param postId ID of the post to unlike
     * @returns Promise with operation result
     */
    unlikePost(postId: string): Promise<boolean>;
    /**
     * Adds a comment to a post by creating a POST message with REPLY subtype
     * @param postId ID of the post to comment on
     * @param content Content of the comment
     * @returns Promise with the created comment or null on failure
     */
    addComment(postId: string, content: string): Promise<Comment | null>;
    /**
     * Deletes a post by creating a MODERATION message with GLOBAL subtype
     * @param postId ID of the post to delete
     * @returns Promise with operation result
     */
    deletePost(postId: string): Promise<boolean>;
    /**
     * Follows a user by creating a CONNECTION message with FOLLOW subtype
     * @param pub Public key of the user to follow
     * @returns Promise with operation result
     */
    follow(pub: string): Promise<boolean>;
    /**
     * Unfollows a user by creating a CONNECTION message that removes the follow relationship
     * @param pub Public key of the user to unfollow
     * @returns Promise with operation result
     */
    unfollow(pub: string): Promise<boolean>;
    /**
     * Updates user profile fields using PROFILE messages
     * @param fields Object with fields to update (e.g. {bio: "New bio"})
     * @returns Promise with operation result
     */
    updateProfile(fields: Record<string, string>): Promise<boolean>;
    cleanup(): void;
    storeMessage(message: {
        type: string;
        subtype?: string;
        creator: string;
        createdAt: number;
        payload: any;
    }): Promise<string>;
    /**
     * Invia un messaggio privato a un utente
     * @param recipient ID pubblico del destinatario
     * @param content Contenuto del messaggio
     * @param options Opzioni aggiuntive
     * @returns Promise con l'ID del messaggio o null in caso di errore
     */
    sendPrivateMessage(recipient: string, content: string, options?: {
        isEncrypted?: boolean;
        attachmentType?: string;
        attachmentUrl?: string;
        replyToId?: string;
        recipients?: string[];
    }): Promise<string | null>;
    /**
     * Segna un messaggio privato come letto
     * @param messageId ID del messaggio
     * @returns Promise con esito dell'operazione
     */
    markMessageAsRead(messageId: string): Promise<boolean>;
    /**
     * Carica un file
     * @param file Dati del file (base64 o URL)
     * @param metadata Metadati del file
     * @returns Promise con l'ID del file o null in caso di errore
     */
    uploadFile(file: string, metadata: {
        filename: string;
        mimetype: string;
        size?: number;
        description?: string;
        isPublic?: boolean;
    }): Promise<string | null>;
    /**
     * Condivide un file con un altro utente
     * @param fileId ID del file
     * @param recipient ID pubblico del destinatario
     * @returns Promise con esito dell'operazione
     */
    shareFile(fileId: string, recipient: string): Promise<boolean>;
}
