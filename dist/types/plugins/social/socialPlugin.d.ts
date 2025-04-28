import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Post, Comment, SocialPluginInterface, Message as MessageInterface } from "./types";
type MessageAdapter = {
    type: string;
    creator: string;
    createdAt: Date | number;
    subtype?: string;
    payload?: Record<string, any>;
    [key: string]: any;
};
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
     * Adds a comment to a post by creating a POST message with REPLY subtype
     * @param postId ID of the post to comment on
     * @param content Content of the comment
     * @returns Promise with the created comment or null on failure
     */
    addComment(postId: string, content: string): Promise<Comment | null>;
    cleanup(): void;
    /**
     * Stores a message using the Social plugin
     * @param message Message object to store
     * @returns Promise with the message ID or throws an error
     */
    storeMessage(message: MessageInterface | MessageAdapter): Promise<string>;
    /**
     * Creates a new post
     * @param content Content of the post
     * @param options Additional options (title, topic, attachment, reference)
     * @returns Promise with the created post or null on error
     */
    post(content: string, options?: {
        title?: string;
        topic?: string;
        attachment?: string;
        reference?: string;
    }): Promise<Post | null>;
    /**
     * Likes a post
     * @param postId ID of the post to like
     * @returns Promise with operation result
     */
    likePost(postId: string): Promise<boolean>;
    /**
     * Unlikes a post
     * @param postId ID of the post to unlike
     * @returns Promise with operation result
     */
    unlikePost(postId: string): Promise<boolean>;
    /**
     * Follows a user
     * @param pub Public key of the user to follow
     * @returns Promise with operation result
     */
    follow(pub: string): Promise<boolean>;
    /**
     * Unfollows a user
     * @param pub Public key of the user to unfollow
     * @returns Promise with operation result
     */
    unfollow(pub: string): Promise<boolean>;
}
export {};
