"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialPlugin = void 0;
// src/plugins/social/socialPlugin.ts
const base_1 = require("../base");
const social_1 = require("./social");
const logger_1 = require("../../utils/logger");
const message_1 = require("./message");
class SocialPlugin extends base_1.BasePlugin {
    name = "social";
    version = "1.0.2";
    description = "Social plugin using GunDB for storage and real-time updates";
    social = null;
    gun;
    get user() {
        return this.social?.user;
    }
    initialize(core) {
        super.initialize(core);
        this.gun = core.gun;
        this.social = new social_1.Social(this.gun);
        (0, logger_1.log)("Social plugin initialized");
    }
    destroy() {
        if (this.social && typeof this.social.cleanup === "function") {
            this.social.cleanup();
        }
        this.social = null;
        super.destroy();
        (0, logger_1.log)("Social plugin destroyed");
    }
    /**
     * Adds a comment to a post by creating a POST message with REPLY subtype
     * @param postId ID of the post to comment on
     * @param content Content of the comment
     * @returns Promise with the created comment or null on failure
     */
    async addComment(postId, content) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("addComment: user not authenticated");
            return null;
        }
        try {
            // Create message data with proper format
            const messageData = {
                type: message_1.MessageType.Post,
                subtype: message_1.PostMessageSubType.Reply,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    topic: "",
                    title: "",
                    content: content,
                    reference: postId, // The ID of the post being replied to
                    attachment: "",
                },
            };
            // Store the message
            const commentId = await this.storeMessage(messageData);
            if (!commentId) {
                (0, logger_1.logError)("addComment: failed to store comment message");
                return null;
            }
            // For backward compatibility, also use the existing implementation
            if (typeof this.social.addComment === "function") {
                await this.social.addComment(postId, content);
            }
            // Return the comment in the format expected by clients
            return {
                id: commentId,
                author: this.user.is.pub,
                content: content,
                timestamp: new Date().getTime(),
                postId: postId,
            };
        }
        catch (error) {
            (0, logger_1.logError)(`addComment: error - ${error}`);
            return null;
        }
    }
    cleanup() {
        if (this.social && typeof this.social.cleanup === "function") {
            this.social.cleanup();
        }
    }
    /**
     * Stores a message using the Social plugin
     * @param message Message object to store
     * @returns Promise with the message ID or throws an error
     */
    async storeMessage(message) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        // Type adaptation - ensure the message has the expected format
        const adaptedMessage = message;
        const result = await this.social.storeMessage(adaptedMessage);
        if (result === null) {
            throw new Error("Failed to store message");
        }
        return result;
    }
    /**
     * Creates a new post
     * @param content Content of the post
     * @param options Additional options (title, topic, attachment, reference)
     * @returns Promise with the created post or null on error
     */
    async post(content, options) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("post: user not authenticated");
            return null;
        }
        try {
            // Create message data with proper format
            const messageData = {
                type: message_1.MessageType.Post,
                subtype: message_1.PostMessageSubType.Default,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    topic: options?.topic || "",
                    title: options?.title || "",
                    content: content,
                    reference: options?.reference || "",
                    attachment: options?.attachment || "",
                },
            };
            // Store the message
            const postId = await this.storeMessage(messageData);
            if (!postId) {
                (0, logger_1.logError)("post: failed to store post message");
                return null;
            }
            // Return the post in the format expected by clients
            return {
                id: postId,
                author: this.user.is.pub,
                content: content,
                title: options?.title || "",
                topic: options?.topic || "",
                timestamp: new Date().getTime(),
                likes: {},
                comments: [],
            };
        }
        catch (error) {
            (0, logger_1.logError)(`post: error - ${error}`);
            return null;
        }
    }
    /**
     * Likes a post
     * @param postId ID of the post to like
     * @returns Promise with operation result
     */
    async likePost(postId) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("likePost: user not authenticated");
            return false;
        }
        try {
            (0, logger_1.log)(`[SocialPlugin] Attempting to like post ${postId} by user ${this.user.is.pub}`);
            // Create a moderation message for the like
            const messageData = {
                type: message_1.MessageType.Moderation,
                subtype: message_1.ModerationMessageSubType.Like,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    reference: postId,
                },
            };
            (0, logger_1.log)(`[SocialPlugin] Created like message:`, messageData);
            // Store the message
            const likeId = await this.storeMessage(messageData);
            (0, logger_1.log)(`[SocialPlugin] Like message stored with ID: ${likeId}`);
            return !!likeId;
        }
        catch (error) {
            (0, logger_1.logError)(`likePost: error - ${error}`);
            return false;
        }
    }
    /**
     * Unlikes a post
     * @param postId ID of the post to unlike
     * @returns Promise with operation result
     */
    async unlikePost(postId) {
        // Implementation would need to delete or mark a like as removed
        // This is a stub implementation
        return false;
    }
    /**
     * Follows a user
     * @param pub Public key of the user to follow
     * @returns Promise with operation result
     */
    async follow(pub) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("follow: user not authenticated");
            return false;
        }
        try {
            // Create a connection message for follow
            const messageData = {
                type: message_1.MessageType.Connection,
                subtype: message_1.ConnectionMessageSubType.Follow,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    name: pub,
                },
            };
            // Store the message
            const followId = await this.storeMessage(messageData);
            return !!followId;
        }
        catch (error) {
            (0, logger_1.logError)(`follow: error - ${error}`);
            return false;
        }
    }
    /**
     * Unfollows a user
     * @param pub Public key of the user to unfollow
     * @returns Promise with operation result
     */
    async unfollow(pub) {
        // Implementation would need to delete or mark a follow as removed
        // This is a stub implementation
        return false;
    }
}
exports.SocialPlugin = SocialPlugin;
