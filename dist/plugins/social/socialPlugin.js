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
     * Creates a new post using the standardized Post message format
     * @param content Content of the post
     * @param options Additional options for the post
     * @returns Promise with the created post or null
     */
    async post(content, options) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("post: user not authenticated");
            return null;
        }
        try {
            // Create a new Post message
            const createdAt = new Date();
            // Create message with createdAt as a number for proper storeMessage compatibility
            const messageData = {
                type: message_1.MessageType.Post,
                subtype: message_1.PostMessageSubType.Default,
                creator: this.user.is.pub,
                createdAt: createdAt.getTime(),
                payload: {
                    topic: options?.topic || "",
                    title: options?.title || "",
                    content: content,
                    reference: options?.reference || "",
                    attachment: options?.attachment || "",
                },
            };
            // Store the message
            const messageId = await this.storeMessage(messageData);
            if (!messageId) {
                (0, logger_1.logError)("post: failed to store post message");
                return null;
            }
            // For backward compatibility, also use the existing implementation if available
            if (typeof this.social.post === "function") {
                await this.social.post(content, options);
            }
            // Convert to the API Post format used by clients
            return {
                id: messageId,
                author: this.user.is.pub,
                content: content,
                timestamp: createdAt.getTime(),
                title: options?.title,
                topic: options?.topic,
                attachment: options?.attachment,
                reference: options?.reference,
                likes: {},
                comments: {},
            };
        }
        catch (error) {
            (0, logger_1.logError)(`post: error - ${error}`);
            return null;
        }
    }
    /**
     * Likes a post by creating a MODERATION message with LIKE subtype
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
            // Create message data with proper format
            const messageData = {
                type: message_1.MessageType.Moderation,
                subtype: message_1.ModerationMessageSubType.Like,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    reference: postId, // The ID of the post to like
                },
            };
            // Store the message
            const messageId = await this.storeMessage(messageData);
            if (!messageId) {
                (0, logger_1.logError)("likePost: failed to store moderation message");
                return false;
            }
            // For backward compatibility, also use the existing implementation
            if (typeof this.social.likePost === "function") {
                await this.social.likePost(postId);
            }
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`likePost: error - ${error}`);
            return false;
        }
    }
    /**
     * Unlikes a post by creating a MODERATION message with BLOCK subtype (to cancel the like)
     * @param postId ID of the post to unlike
     * @returns Promise with operation result
     */
    async unlikePost(postId) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("unlikePost: user not authenticated");
            return false;
        }
        try {
            // Create message data with proper format
            const messageData = {
                type: message_1.MessageType.Moderation,
                subtype: message_1.ModerationMessageSubType.Block,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    reference: postId, // The ID of the post to unlike
                },
            };
            // Store the message
            const messageId = await this.storeMessage(messageData);
            if (!messageId) {
                (0, logger_1.logError)("unlikePost: failed to store moderation message");
                return false;
            }
            // For backward compatibility, also use the existing implementation
            if (typeof this.social.unlikePost === "function") {
                await this.social.unlikePost(postId);
            }
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`unlikePost: error - ${error}`);
            return false;
        }
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
    /**
     * Deletes a post by creating a MODERATION message with GLOBAL subtype
     * @param postId ID of the post to delete
     * @returns Promise with operation result
     */
    async deletePost(postId) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("deletePost: user not authenticated");
            return false;
        }
        try {
            // Create message data with proper format
            const messageData = {
                type: message_1.MessageType.Moderation,
                subtype: message_1.ModerationMessageSubType.Global,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    reference: postId, // The ID of the post to delete
                },
            };
            // Store the message
            const messageId = await this.storeMessage(messageData);
            if (!messageId) {
                (0, logger_1.logError)("deletePost: failed to store moderation message");
                return false;
            }
            // For backward compatibility, also use the existing implementation
            if (typeof this.social.deletePost === "function") {
                await this.social.deletePost(postId);
            }
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`deletePost: error - ${error}`);
            return false;
        }
    }
    /**
     * Follows a user by creating a CONNECTION message with FOLLOW subtype
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
            // Create message data with proper format
            const messageData = {
                type: message_1.MessageType.Connection,
                subtype: message_1.ConnectionMessageSubType.Follow,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    name: pub, // The public key of the user to follow
                },
            };
            // Store the message
            const messageId = await this.storeMessage(messageData);
            if (!messageId) {
                (0, logger_1.logError)("follow: failed to store connection message");
                return false;
            }
            // Also update the social graph in GunDB directly for backward compatibility
            if (typeof this.social.follow === "function") {
                await this.social.follow(pub);
            }
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`follow: error - ${error}`);
            return false;
        }
    }
    /**
     * Unfollows a user by creating a CONNECTION message that removes the follow relationship
     * @param pub Public key of the user to unfollow
     * @returns Promise with operation result
     */
    async unfollow(pub) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("unfollow: user not authenticated");
            return false;
        }
        try {
            // Create message data with proper format
            const messageData = {
                type: message_1.MessageType.Connection,
                subtype: message_1.ConnectionMessageSubType.Block,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    name: pub, // The public key of the user to unfollow/block
                },
            };
            // Store the message
            const messageId = await this.storeMessage(messageData);
            if (!messageId) {
                (0, logger_1.logError)("unfollow: failed to store connection message");
                return false;
            }
            // Also update the social graph in GunDB directly for backward compatibility
            if (typeof this.social.unfollow === "function") {
                await this.social.unfollow(pub);
            }
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`unfollow: error - ${error}`);
            return false;
        }
    }
    /**
     * Updates user profile fields using PROFILE messages
     * @param fields Object with fields to update (e.g. {bio: "New bio"})
     * @returns Promise with operation result
     */
    async updateProfile(fields) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("updateProfile: user not authenticated");
            return false;
        }
        try {
            let success = true;
            // Create and store a Profile message for each field
            for (const [field, value] of Object.entries(fields)) {
                // Map field names to appropriate subtypes
                let subtype;
                switch (field.toLowerCase()) {
                    case "name":
                        subtype = message_1.ProfileMessageSubType.Name;
                        break;
                    case "bio":
                        subtype = message_1.ProfileMessageSubType.Bio;
                        break;
                    case "profileimage":
                        subtype = message_1.ProfileMessageSubType.ProfileImage;
                        break;
                    case "coverimage":
                        subtype = message_1.ProfileMessageSubType.CoverImage;
                        break;
                    case "website":
                        subtype = message_1.ProfileMessageSubType.Website;
                        break;
                    default:
                        subtype = message_1.ProfileMessageSubType.Custom;
                        break;
                }
                // Create message data with proper format
                const messageData = {
                    type: message_1.MessageType.Profile,
                    subtype: subtype,
                    creator: this.user.is.pub,
                    createdAt: new Date().getTime(),
                    payload: {
                        key: field,
                        value: value,
                    },
                };
                // Store the message
                const messageId = await this.storeMessage(messageData);
                if (!messageId) {
                    (0, logger_1.logError)(`updateProfile: failed to store profile message for field ${field}`);
                    success = false;
                    continue;
                }
            }
            // For backward compatibility, also use the existing implementation
            if (typeof this.social.updateProfile === "function") {
                for (const [field, value] of Object.entries(fields)) {
                    const result = await this.social.updateProfile(field, value);
                    if (!result)
                        success = false;
                }
            }
            return success;
        }
        catch (err) {
            (0, logger_1.logError)(`updateProfile: error - ${err}`);
            return false;
        }
    }
    cleanup() {
        if (this.social && typeof this.social.cleanup === "function") {
            this.social.cleanup();
        }
    }
    async storeMessage(message) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        const result = await this.social.storeMessage(message);
        if (result === null) {
            throw new Error("Failed to store message");
        }
        return result;
    }
    /**
     * Invia un messaggio privato a un utente
     * @param recipient ID pubblico del destinatario
     * @param content Contenuto del messaggio
     * @param options Opzioni aggiuntive
     * @returns Promise con l'ID del messaggio o null in caso di errore
     */
    async sendPrivateMessage(recipient, content, options) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("sendPrivateMessage: user not authenticated");
            return null;
        }
        try {
            // Determine if it's a direct message or group chat
            const subtype = options?.recipients && options.recipients.length > 0
                ? message_1.PrivateMessageSubType.GroupChat
                : message_1.PrivateMessageSubType.Direct;
            // Create message data with proper format
            const messageData = {
                type: message_1.MessageType.Private,
                subtype: subtype,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    recipient: recipient,
                    recipients: options?.recipients || [],
                    content: content,
                    isEncrypted: options?.isEncrypted || false,
                    metadata: {
                        attachmentType: options?.attachmentType || '',
                        attachmentUrl: options?.attachmentUrl || '',
                        replyToId: options?.replyToId || '',
                    },
                },
            };
            // Store the message
            const messageId = await this.storeMessage(messageData);
            if (!messageId) {
                (0, logger_1.logError)("sendPrivateMessage: failed to store private message");
                return null;
            }
            return messageId;
        }
        catch (error) {
            (0, logger_1.logError)(`sendPrivateMessage: error - ${error}`);
            return null;
        }
    }
    /**
     * Segna un messaggio privato come letto
     * @param messageId ID del messaggio
     * @returns Promise con esito dell'operazione
     */
    async markMessageAsRead(messageId) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("markMessageAsRead: user not authenticated");
            return false;
        }
        try {
            // Create a read receipt message
            const messageData = {
                type: message_1.MessageType.Private,
                subtype: message_1.PrivateMessageSubType.ReadReceipt,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    recipient: '', // Will be determined from the original message
                    content: '',
                    isEncrypted: false,
                    metadata: {
                        replyToId: messageId, // Reference to the message being marked as read
                    },
                },
            };
            // Store the message
            const receiptId = await this.storeMessage(messageData);
            if (!receiptId) {
                (0, logger_1.logError)("markMessageAsRead: failed to store read receipt");
                return false;
            }
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`markMessageAsRead: error - ${error}`);
            return false;
        }
    }
    /**
     * Carica un file
     * @param file Dati del file (base64 o URL)
     * @param metadata Metadati del file
     * @returns Promise con l'ID del file o null in caso di errore
     */
    async uploadFile(file, metadata) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("uploadFile: user not authenticated");
            return null;
        }
        try {
            // Create a File message
            const messageData = {
                type: message_1.MessageType.File,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    data: file,
                    filename: metadata.filename,
                    mimetype: metadata.mimetype,
                    size: metadata.size || 0,
                    description: metadata.description || '',
                    isPublic: metadata.isPublic || false,
                },
            };
            // Store the message
            const fileId = await this.storeMessage(messageData);
            if (!fileId) {
                (0, logger_1.logError)("uploadFile: failed to store file message");
                return null;
            }
            return fileId;
        }
        catch (error) {
            (0, logger_1.logError)(`uploadFile: error - ${error}`);
            return null;
        }
    }
    /**
     * Condivide un file con un altro utente
     * @param fileId ID del file
     * @param recipient ID pubblico del destinatario
     * @returns Promise con esito dell'operazione
     */
    async shareFile(fileId, recipient) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (!this.user.is || !this.user.is.pub) {
            (0, logger_1.logError)("shareFile: user not authenticated");
            return false;
        }
        try {
            // Create a private message that references the file
            const messageData = {
                type: message_1.MessageType.Private,
                subtype: message_1.PrivateMessageSubType.Direct,
                creator: this.user.is.pub,
                createdAt: new Date().getTime(),
                payload: {
                    recipient: recipient,
                    content: '',
                    isEncrypted: false,
                    metadata: {
                        attachmentType: 'file',
                        attachmentUrl: fileId, // Reference to the file
                    },
                },
            };
            // Store the message
            const messageId = await this.storeMessage(messageData);
            if (!messageId) {
                (0, logger_1.logError)("shareFile: failed to store share message");
                return false;
            }
            return true;
        }
        catch (error) {
            (0, logger_1.logError)(`shareFile: error - ${error}`);
            return false;
        }
    }
}
exports.SocialPlugin = SocialPlugin;
