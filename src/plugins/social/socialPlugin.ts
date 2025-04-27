// src/plugins/social/socialPlugin.ts
import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Social } from "./social";
import { log, logError } from "../../utils/logger";
import { Post, Comment, SocialPluginInterface } from "./types";
import { IGunInstance } from "gun";
import {
  Message,
  MessageType,
  Connection,
  ConnectionMessageSubType,
  Post as MessagePost,
  PostMessageSubType,
  PostMessageOption,
  Moderation,
  ModerationMessageSubType,
  Profile,
  ProfileMessageSubType,
  PrivateMessageSubType,
} from "./message";

export class SocialPlugin extends BasePlugin implements SocialPluginInterface {
  name = "social";
  version = "1.0.2";
  description = "Social plugin using GunDB for storage and real-time updates";

  private social: Social | null = null;
  private gun!: IGunInstance<any>;

  public get user() {
    return this.social?.user;
  }

  initialize(core: ShogunCore): void {
    super.initialize(core);
    this.gun = core.gun;
    this.social = new Social(this.gun);
    log("Social plugin initialized");
  }

  destroy(): void {
    if (this.social && typeof (this.social as any).cleanup === "function") {
      (this.social as any).cleanup();
    }
    this.social = null;
    super.destroy();
    log("Social plugin destroyed");
  }


  /**
   * Creates a new post using the standardized Post message format
   * @param content Content of the post
   * @param options Additional options for the post
   * @returns Promise with the created post or null
   */
  async post(
    content: string,
    options?: {
      title?: string;
      topic?: string;
      attachment?: string;
      reference?: string;
    }
  ): Promise<Post | null> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("post: user not authenticated");
      return null;
    }

    try {
      // Create a new Post message
      const createdAt = new Date();
      
      // Create message with createdAt as a number for proper storeMessage compatibility
      const messageData = {
        type: MessageType.Post,
        subtype: PostMessageSubType.Default,
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
        logError("post: failed to store post message");
        return null;
      }

      // For backward compatibility, also use the existing implementation if available
      if (typeof (this.social as any).post === "function") {
        await (this.social as any).post(content, options);
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
    } catch (error) {
      logError(`post: error - ${error}`);
      return null;
    }
  }

  /**
   * Likes a post by creating a MODERATION message with LIKE subtype
   * @param postId ID of the post to like
   * @returns Promise with operation result
   */
  async likePost(postId: string): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("likePost: user not authenticated");
      return false;
    }

    try {
      // Create message data with proper format
      const messageData = {
        type: MessageType.Moderation,
        subtype: ModerationMessageSubType.Like,
        creator: this.user.is.pub,
        createdAt: new Date().getTime(),
        payload: {
          reference: postId, // The ID of the post to like
        },
      };

      // Store the message
      const messageId = await this.storeMessage(messageData);
      if (!messageId) {
        logError("likePost: failed to store moderation message");
        return false;
      }

      // For backward compatibility, also use the existing implementation
      if (typeof (this.social as any).likePost === "function") {
        await (this.social as any).likePost(postId);
      }

      return true;
    } catch (error) {
      logError(`likePost: error - ${error}`);
      return false;
    }
  }

  /**
   * Unlikes a post by creating a MODERATION message with BLOCK subtype (to cancel the like)
   * @param postId ID of the post to unlike
   * @returns Promise with operation result
   */
  async unlikePost(postId: string): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("unlikePost: user not authenticated");
      return false;
    }

    try {
      // Create message data with proper format
      const messageData = {
        type: MessageType.Moderation,
        subtype: ModerationMessageSubType.Block,
        creator: this.user.is.pub,
        createdAt: new Date().getTime(),
        payload: {
          reference: postId, // The ID of the post to unlike
        },
      };

      // Store the message
      const messageId = await this.storeMessage(messageData);
      if (!messageId) {
        logError("unlikePost: failed to store moderation message");
        return false;
      }

      // For backward compatibility, also use the existing implementation
      if (typeof (this.social as any).unlikePost === "function") {
        await (this.social as any).unlikePost(postId);
      }

      return true;
    } catch (error) {
      logError(`unlikePost: error - ${error}`);
      return false;
    }
  }

  /**
   * Adds a comment to a post by creating a POST message with REPLY subtype
   * @param postId ID of the post to comment on
   * @param content Content of the comment
   * @returns Promise with the created comment or null on failure
   */
  async addComment(postId: string, content: string): Promise<Comment | null> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("addComment: user not authenticated");
      return null;
    }

    try {
      // Create message data with proper format
      const messageData = {
        type: MessageType.Post,
        subtype: PostMessageSubType.Reply,
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
        logError("addComment: failed to store comment message");
        return null;
      }

      // For backward compatibility, also use the existing implementation
      if (typeof (this.social as any).addComment === "function") {
        await (this.social as any).addComment(postId, content);
      }

      // Return the comment in the format expected by clients
      return {
        id: commentId,
        author: this.user.is.pub,
        content: content,
        timestamp: new Date().getTime(),
        postId: postId,
      };
    } catch (error) {
      logError(`addComment: error - ${error}`);
      return null;
    }
  }

  /**
   * Deletes a post by creating a MODERATION message with GLOBAL subtype
   * @param postId ID of the post to delete
   * @returns Promise with operation result
   */
  async deletePost(postId: string): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("deletePost: user not authenticated");
      return false;
    }

    try {
      // Create message data with proper format
      const messageData = {
        type: MessageType.Moderation,
        subtype: ModerationMessageSubType.Global,
        creator: this.user.is.pub,
        createdAt: new Date().getTime(),
        payload: {
          reference: postId, // The ID of the post to delete
        },
      };

      // Store the message
      const messageId = await this.storeMessage(messageData);
      if (!messageId) {
        logError("deletePost: failed to store moderation message");
        return false;
      }

      // For backward compatibility, also use the existing implementation
      if (typeof (this.social as any).deletePost === "function") {
        await (this.social as any).deletePost(postId);
      }

      return true;
    } catch (error) {
      logError(`deletePost: error - ${error}`);
      return false;
    }
  }

  /**
   * Follows a user by creating a CONNECTION message with FOLLOW subtype
   * @param pub Public key of the user to follow
   * @returns Promise with operation result
   */
  async follow(pub: string): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("follow: user not authenticated");
      return false;
    }

    try {
      // Create message data with proper format
      const messageData = {
        type: MessageType.Connection,
        subtype: ConnectionMessageSubType.Follow,
        creator: this.user.is.pub,
        createdAt: new Date().getTime(),
        payload: {
          name: pub, // The public key of the user to follow
        },
      };

      // Store the message
      const messageId = await this.storeMessage(messageData);
      if (!messageId) {
        logError("follow: failed to store connection message");
        return false;
      }

      // Also update the social graph in GunDB directly for backward compatibility
      if (typeof (this.social as any).follow === "function") {
        await (this.social as any).follow(pub);
      }

      return true;
    } catch (error) {
      logError(`follow: error - ${error}`);
      return false;
    }
  }

  /**
   * Unfollows a user by creating a CONNECTION message that removes the follow relationship
   * @param pub Public key of the user to unfollow
   * @returns Promise with operation result
   */
  async unfollow(pub: string): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("unfollow: user not authenticated");
      return false;
    }

    try {
      // Create message data with proper format
      const messageData = {
        type: MessageType.Connection,
        subtype: ConnectionMessageSubType.Block,
        creator: this.user.is.pub,
        createdAt: new Date().getTime(),
        payload: {
          name: pub, // The public key of the user to unfollow/block
        },
      };

      // Store the message
      const messageId = await this.storeMessage(messageData);
      if (!messageId) {
        logError("unfollow: failed to store connection message");
        return false;
      }

      // Also update the social graph in GunDB directly for backward compatibility
      if (typeof (this.social as any).unfollow === "function") {
        await (this.social as any).unfollow(pub);
      }

      return true;
    } catch (error) {
      logError(`unfollow: error - ${error}`);
      return false;
    }
  }

  /**
   * Updates user profile fields using PROFILE messages
   * @param fields Object with fields to update (e.g. {bio: "New bio"})
   * @returns Promise with operation result
   */
  async updateProfile(fields: Record<string, string>): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("updateProfile: user not authenticated");
      return false;
    }

    try {
      let success = true;

      // Create and store a Profile message for each field
      for (const [field, value] of Object.entries(fields)) {
        // Map field names to appropriate subtypes
        let subtype: ProfileMessageSubType;
        switch (field.toLowerCase()) {
          case "name":
            subtype = ProfileMessageSubType.Name;
            break;
          case "bio":
            subtype = ProfileMessageSubType.Bio;
            break;
          case "profileimage":
            subtype = ProfileMessageSubType.ProfileImage;
            break;
          case "coverimage":
            subtype = ProfileMessageSubType.CoverImage;
            break;
          case "website":
            subtype = ProfileMessageSubType.Website;
            break;
          default:
            subtype = ProfileMessageSubType.Custom;
            break;
        }

        // Create message data with proper format
        const messageData = {
          type: MessageType.Profile,
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
          logError(
            `updateProfile: failed to store profile message for field ${field}`
          );
          success = false;
          continue;
        }
      }

      // For backward compatibility, also use the existing implementation
      if (typeof (this.social as any).updateProfile === "function") {
        for (const [field, value] of Object.entries(fields)) {
          const result = await (this.social as any).updateProfile(field, value);
          if (!result) success = false;
        }
      }

      return success;
    } catch (err) {
      logError(`updateProfile: error - ${err}`);
      return false;
    }
  }

  cleanup(): void {
    if (this.social && typeof (this.social as any).cleanup === "function") {
      (this.social as any).cleanup();
    }
  }

  async storeMessage(message: {
    type: string;
    subtype?: string;
    creator: string;
    createdAt: number;
    payload: any;
  }): Promise<string> {
    if (!this.social) throw new Error("Social plugin not initialized");
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
  async sendPrivateMessage(
    recipient: string,
    content: string,
    options?: {
      isEncrypted?: boolean;
      attachmentType?: string;
      attachmentUrl?: string;
      replyToId?: string;
      recipients?: string[]; // Per messaggi di gruppo
    }
  ): Promise<string | null> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("sendPrivateMessage: user not authenticated");
      return null;
    }

    try {
      // Determine if it's a direct message or group chat
      const subtype = options?.recipients && options.recipients.length > 0
        ? PrivateMessageSubType.GroupChat
        : PrivateMessageSubType.Direct;

      // Create message data with proper format
      const messageData = {
        type: MessageType.Private,
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
        logError("sendPrivateMessage: failed to store private message");
        return null;
      }

      return messageId;
    } catch (error) {
      logError(`sendPrivateMessage: error - ${error}`);
      return null;
    }
  }

  
  /**
   * Segna un messaggio privato come letto
   * @param messageId ID del messaggio
   * @returns Promise con esito dell'operazione
   */
  async markMessageAsRead(messageId: string): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("markMessageAsRead: user not authenticated");
      return false;
    }

    try {
      // Create a read receipt message
      const messageData = {
        type: MessageType.Private,
        subtype: PrivateMessageSubType.ReadReceipt,
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
        logError("markMessageAsRead: failed to store read receipt");
        return false;
      }

      return true;
    } catch (error) {
      logError(`markMessageAsRead: error - ${error}`);
      return false;
    }
  }

  /**
   * Carica un file
   * @param file Dati del file (base64 o URL)
   * @param metadata Metadati del file
   * @returns Promise con l'ID del file o null in caso di errore
   */
  async uploadFile(
    file: string,
    metadata: {
      filename: string;
      mimetype: string;
      size?: number;
      description?: string;
      isPublic?: boolean;
    }
  ): Promise<string | null> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("uploadFile: user not authenticated");
      return null;
    }

    try {
      // Create a File message
      const messageData = {
        type: MessageType.File,
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
        logError("uploadFile: failed to store file message");
        return null;
      }

      return fileId;
    } catch (error) {
      logError(`uploadFile: error - ${error}`);
      return null;
    }
  }

  /**
   * Condivide un file con un altro utente
   * @param fileId ID del file
   * @param recipient ID pubblico del destinatario
   * @returns Promise con esito dell'operazione
   */
  async shareFile(fileId: string, recipient: string): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (!this.user.is || !this.user.is.pub) {
      logError("shareFile: user not authenticated");
      return false;
    }

    try {
      // Create a private message that references the file
      const messageData = {
        type: MessageType.Private,
        subtype: PrivateMessageSubType.Direct,
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
        logError("shareFile: failed to store share message");
        return false;
      }

      return true;
    } catch (error) {
      logError(`shareFile: error - ${error}`);
      return false;
    }
  }
}
