// src/plugins/social/socialPlugin.ts
import { BasePlugin } from "../base";
import { ShogunCore } from "../../index";
import { Social } from "./social";
import { SocialPluginInterface } from "./types";
import { log, logError } from "../../utils/logger";
import {
  UserProfile,
  TimelineResult,
  Post,
  Comment,
  Message,
} from "../../types/social";
import { Observable, of } from "rxjs";

export class SocialPlugin extends BasePlugin implements SocialPluginInterface {
  name = "social";
  version = "1.0.2";
  description = "Social plugin using GunDB for storage and real-time updates";

  private social: Social | null = null;

  public get user() {
    return this.social?.user || null;
  }

  initialize(core: ShogunCore): void {
    super.initialize(core);
    this.social = new Social(core.gun);
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

  async getProfile(pub: string): Promise<UserProfile> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (typeof (this.social as any).getProfile === "function") {
      return (this.social as any).getProfile(pub);
    }
    logError("getProfile method not available");
    return {
      pub,
      followers: [],
      following: [],
      customFields: {},
    };
  }

  async post(content: string): Promise<Post | null> {
    return this.social!.post(content);
  }

  /**
   * Crea un nuovo post con immagine allegata
   * @param content Contenuto del post
   * @param imageData Dati dell'immagine (Base64 o URL)
   * @returns Post creato o null in caso di errore
   */
  async postWithImage(
    content: string,
    imageData: string
  ): Promise<Post | null> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (typeof (this.social as any).post === "function") {
      return (this.social as any).post(content, imageData);
    }
    logError("postWithImage method not available");
    return null;
  }

  /**
   * Cerca post per hashtag
   * @param hashtag Hashtag da cercare (con o senza #)
   * @returns Array di post che contengono l'hashtag
   */
  async searchByHashtag(hashtag: string): Promise<Post[]> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (typeof (this.social as any).searchByHashtag === "function") {
      return (this.social as any).searchByHashtag(hashtag);
    }
    logError("searchByHashtag method not available");
    return [];
  }

  async likePost(postId: string): Promise<boolean> {
    return this.social!.likePost(postId);
  }

  async unlikePost(postId: string): Promise<boolean> {
    return this.social!.unlikePost(postId);
  }

  async getLikes(postId: string): Promise<string[]> {
    return this.social!.getLikes(postId);
  }

  async getLikeCount(postId: string): Promise<number> {
    return this.social!.getLikeCount(postId);
  }

  async addComment(postId: string, content: string): Promise<Comment | null> {
    return this.social!.addComment(postId, content);
  }

  async getComments(postId: string): Promise<Comment[]> {
    return this.social!.getComments(postId);
  }

  async deletePost(postId: string): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (typeof (this.social as any).deletePost === "function") {
      return (this.social as any).deletePost(postId);
    }
    logError("deletePost method not available");
    return false;
  }

  async getTimeline(): Promise<TimelineResult> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (typeof (this.social as any).getTimeline === "function") {
      return (this.social as any).getTimeline();
    }
    logError("getTimeline method not available");
    return { messages: [], error: "Method not implemented" };
  }

  async follow(pub: string): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (typeof (this.social as any).follow === "function") {
      return (this.social as any).follow(pub);
    }
    logError("follow method not available");
    return false;
  }

  async unfollow(pub: string): Promise<boolean> {
    if (!this.social) throw new Error("Social plugin not initialized");
    if (typeof (this.social as any).unfollow === "function") {
      return (this.social as any).unfollow(pub);
    }
    logError("unfollow method not available");
    return false;
  }

  cleanup(): void {
    if (this.social && typeof (this.social as any).cleanup === "function") {
      (this.social as any).cleanup();
    }
  }

  /**
   * Ottieni la timeline come Observable per aggiornamenti in tempo reale
   * @param limit Numero massimo di post da recuperare
   * @param options Opzioni aggiuntive
   * @returns Observable della timeline
   */
  getTimelineObservable(
    limit = 10,
    options: { includeLikes: boolean } = { includeLikes: true }
  ): Observable<Message[]> {
    if (!this.social) {
      logError("Social plugin not initialized");
      return of([]);
    }

    if (typeof (this.social as any).getTimelineObservable === "function") {
      return (this.social as any).getTimelineObservable(limit, options);
    }

    logError("getTimelineObservable method not available");
    return of([]);
  }

  /**
   * Ottieni i commenti di un post come Observable
   * @param postId ID del post
   * @returns Observable dei commenti
   */
  getCommentsObservable(postId: string): Observable<Comment[]> {
    if (!this.social) {
      logError("Social plugin not initialized");
      return of([]);
    }

    if (typeof (this.social as any).getCommentsObservable === "function") {
      return (this.social as any).getCommentsObservable(postId);
    }

    logError("getCommentsObservable method not available");
    return of([]);
  }

  /**
   * Ottieni gli utenti che hanno messo like a un post come Observable
   * @param postId ID del post
   * @returns Observable dei like
   */
  getLikesObservable(postId: string): Observable<string[]> {
    if (!this.social) {
      logError("Social plugin not initialized");
      return of([]);
    }

    if (typeof (this.social as any).getLikesObservable === "function") {
      return (this.social as any).getLikesObservable(postId);
    }

    logError("getLikesObservable method not available");
    return of([]);
  }

  /**
   * Ottieni il conteggio dei like come Observable
   * @param postId ID del post
   * @returns Observable del conteggio like
   */
  getLikeCountObservable(postId: string): Observable<number> {
    if (!this.social) {
      logError("Social plugin not initialized");
      return of(0);
    }

    if (typeof (this.social as any).getLikeCountObservable === "function") {
      return (this.social as any).getLikeCountObservable(postId);
    }

    logError("getLikeCountObservable method not available");
    return of(0);
  }

  /**
   * Ottieni un post arricchito con dettagli dell'autore
   * @param postId ID del post
   * @returns Observable del post con dettagli aggiuntivi
   */
  getEnrichedPostObservable(postId: string): Observable<any> {
    if (!this.social) {
      logError("Social plugin not initialized");
      return of(null);
    }

    if (typeof (this.social as any).getEnrichedPostObservable === "function") {
      return (this.social as any).getEnrichedPostObservable(postId);
    }

    logError("getEnrichedPostObservable method not available");
    return of(null);
  }

  /**
   * Cerca post per hashtag con aggiornamenti in tempo reale
   * @param hashtag Hashtag da cercare
   * @returns Observable di post con l'hashtag specificato
   */
  searchByHashtagObservable(hashtag: string): Observable<Post[]> {
    if (!this.social) {
      logError("Social plugin not initialized");
      return of([]);
    }

    if (typeof (this.social as any).searchByHashtagObservable === "function") {
      return (this.social as any).searchByHashtagObservable(hashtag);
    }

    logError("searchByHashtagObservable method not available");
    return of([]);
  }

  /**
   * Osserva un profilo utente in tempo reale
   * @param pub Chiave pubblica dell'utente
   * @returns Observable del profilo utente
   */
  getProfileObservable(pub: string): Observable<UserProfile> {
    if (!this.social) {
      logError("Social plugin not initialized");
      return of({
        pub,
        followers: [],
        following: [],
        customFields: {},
      });
    }

    if (typeof (this.social as any).getProfileObservable === "function") {
      return (this.social as any).getProfileObservable(pub);
    }

    logError("getProfileObservable method not available");
    return of({
      pub,
      followers: [],
      following: [],
      customFields: {},
    });
  }

  /**
   * Ottieni tutti gli utenti registrati sulla rete
   * @returns Array di profili utente base
   */
  async getAllUsers(): Promise<UserProfile[]> {
    if (!this.social) {
      logError("Social plugin not initialized");
      return [];
    }

    if (typeof (this.social as any).getAllUsers === "function") {
      return (this.social as any).getAllUsers();
    }

    logError("getAllUsers method not available");
    return [];
  }

  /**
   * Ottieni tutti gli utenti come Observable
   * @returns Observable di profili utente
   */
  getAllUsersObservable(): Observable<UserProfile[]> {
    if (!this.social) {
      logError("Social plugin not initialized");
      return of([]);
    }

    if (typeof (this.social as any).getAllUsersObservable === "function") {
      return (this.social as any).getAllUsersObservable();
    }

    logError("getAllUsersObservable method not available");
    return of([]);
  }
}
