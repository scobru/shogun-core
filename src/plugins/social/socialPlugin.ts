// src/plugins/social/socialPlugin.ts
import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Social } from "./social";
import { log, logError } from "../../utils/logger";
import { Post, Comment, SocialPluginInterface, Message as MessageInterface } from "./types";
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

// Type adapter for converting between Message interfaces
type MessageAdapter = {
  type: string;
  creator: string;
  createdAt: Date | number;
  subtype?: string;
  payload?: Record<string, any>;
  [key: string]: any;
};

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
      const messageData: MessageAdapter = {
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

  cleanup(): void {
    if (this.social && typeof (this.social as any).cleanup === "function") {
      (this.social as any).cleanup();
    }
  }

  /**
   * Stores a message using the Social plugin
   * @param message Message object to store
   * @returns Promise with the message ID or throws an error
   */
  async storeMessage(message: MessageInterface | MessageAdapter): Promise<string> {   
    if (!this.social) throw new Error("Social plugin not initialized");
    
    // Type adaptation - ensure the message has the expected format
    const adaptedMessage = message as MessageAdapter;
    
    const result = await this.social.storeMessage(adaptedMessage as any);
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
      // Create message data with proper format
      const messageData: MessageAdapter = {
        type: MessageType.Post,
        subtype: PostMessageSubType.Default,
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
        logError("post: failed to store post message");
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
    } catch (error) {
      logError(`post: error - ${error}`);
      return null;
    }
  }

  /**
   * Likes a post
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
      log(`[SocialPlugin] Attempting to like post ${postId} by user ${this.user.is.pub}`);

      // Create a moderation message for the like
      const messageData: MessageAdapter = {
        type: MessageType.Moderation,
        subtype: ModerationMessageSubType.Like,
        creator: this.user.is.pub,
        createdAt: new Date().getTime(),
        payload: {
          reference: postId,
        },
      };

      log(`[SocialPlugin] Created like message:`, messageData);

      // Store the message
      const likeId = await this.storeMessage(messageData);
      log(`[SocialPlugin] Like message stored with ID: ${likeId}`);

      return !!likeId;
    } catch (error) {
      logError(`likePost: error - ${error}`);
      return false;
    }
  }

  /**
   * Unlikes a post
   * @param postId ID of the post to unlike
   * @returns Promise with operation result
   */
  async unlikePost(postId: string): Promise<boolean> {
    // Implementation would need to delete or mark a like as removed
    // This is a stub implementation
    return false;
  }

  /**
   * Follows a user
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
      // Create a connection message for follow
      const messageData: MessageAdapter = {
        type: MessageType.Connection,
        subtype: ConnectionMessageSubType.Follow,
        creator: this.user.is.pub,
        createdAt: new Date().getTime(),
        payload: {
          name: pub,
        },
      };

      // Store the message
      const followId = await this.storeMessage(messageData);
      return !!followId;
    } catch (error) {
      logError(`follow: error - ${error}`);
      return false;
    }
  }

  /**
   * Unfollows a user
   * @param pub Public key of the user to unfollow
   * @returns Promise with operation result
   */
  async unfollow(pub: string): Promise<boolean> {
    // Implementation would need to delete or mark a follow as removed
    // This is a stub implementation
    return false;
  }
}
