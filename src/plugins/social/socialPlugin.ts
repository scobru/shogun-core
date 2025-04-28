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

  cleanup(): void {
    if (this.social && typeof (this.social as any).cleanup === "function") {
      (this.social as any).cleanup();
    }
  }

  async storeMessage(message: Message): Promise<string> {   
    if (!this.social) throw new Error("Social plugin not initialized");
    const result = await this.social.storeMessage(message);
    if (result === null) {
      throw new Error("Failed to store message");
    }
    return result;
  }

}
