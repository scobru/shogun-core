import { logDebug, logError, logWarn } from "../../../utils/logger";
import { EventEmitter } from "../../../utils/eventEmitter";
import {
  Post,
  Comment,
  TimelineResult,
  Message,
  PostMessage,
  MessageType,
  MessageSubtype,
} from "../types";
import { GunRxJS } from "../../../gun/rxjs-integration";
import { Observable, of } from "rxjs";
import { map, tap } from "rxjs/operators";
import { IGunInstance } from "gun";
import * as crypto from "crypto";
import { PostSchema, CommentSchema } from "../schemas";
import Ajv from "ajv";

/**
 * Service dedicato ai post: creazione, recupero, like, commenti, ricerca
 */
export class PostService extends EventEmitter {
  private readonly gun: IGunInstance<any>;
  private readonly user: any;
  public readonly gunRx: GunRxJS;
  private readonly ajv = new Ajv();
  private readonly validatePost: ReturnType<typeof this.ajv.compile>;
  private readonly validateComment: ReturnType<typeof this.ajv.compile>;
  private readonly postCache = new Map<
    string,
    { data: Post; timestamp: number }
  >();
  private readonly cacheDuration = 2 * 60 * 1000; // 2 minuti

  constructor(gunInstance: IGunInstance<any>) {
    super();
    this.gun = gunInstance;
    this.user = this.gun.user().recall({ sessionStorage: true });
    this.gunRx = new GunRxJS(gunInstance);
    this.validatePost = this.ajv.compile(PostSchema);
    this.validateComment = this.ajv.compile(CommentSchema);
  }

  /**
   * Metodo per loggare messaggi di debug
   */
  private debug(message: string, ...args: unknown[]): void {
    logDebug(`[PostService] ${message}`, ...args);
  }

  /**
   * Metodo per loggare errori
   */
  private error(message: string, ...args: unknown[]): void {
    logError(`[PostService] ${message}`, ...args);
  }

  /**
   * Genera un ID univoco (UUID v4)
   */
  private generateUUID(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
  }

  /**
   * Normalizza un post recuperato da Gun per evitare problemi di validazione
   * @param post Post da normalizzare
   * @param id ID del post
   * @returns Post normalizzato
   */
  private normalizePost(post: any, id: string): any {
    if (!post) return post;

    // Clona l'oggetto per non modificare l'originale
    const normalized: any = { ...post };

    // Assicura che l'id sia presente
    normalized.id = normalized.id || id;

    // Normalizza l'autore
    normalized.author =
      typeof normalized.author === "string"
        ? normalized.author
        : this.user?.is?.pub || "sconosciuto";

    // Assicura che timestamp sia un numero
    normalized.timestamp = normalized.timestamp || Date.now();

    // Assicura che content sia una stringa
    normalized.content = normalized.content || "";

    // Gestione allegati: spostare imageData in attachment se necessario
    if (normalized.imageData && !normalized.attachment) {
      normalized.attachment = normalized.imageData;
      delete normalized.imageData;
    }

    // Assicura che altri campi siano del tipo corretto
    if (
      normalized.attachment !== null &&
      normalized.attachment !== undefined &&
      typeof normalized.attachment !== "string"
    ) {
      normalized.attachment = null;
    }

    // Normalizza il payload se esiste
    if (normalized.payload) {
      if (!normalized.payload.content && normalized.content) {
        normalized.payload.content = normalized.content;
      }

      // Sposta imageData in attachment nel payload
      if (normalized.payload.imageData && !normalized.payload.attachment) {
        normalized.payload.attachment = normalized.payload.imageData;
        delete normalized.payload.imageData;
      }
    } else {
      // Crea un payload se non esiste
      normalized.payload = {
        content: normalized.content,
        attachment: normalized.attachment || null,
      };
    }

    // Converti i vecchi campi hashtag nel nuovo formato topic
    if (
      (normalized.hashtags ||
        normalized.hashtagsList ||
        normalized._hashtagsList) &&
      !normalized.topic
    ) {
      let hashtags = [];

      if (normalized.hashtagsList) {
        hashtags = normalized.hashtagsList;
      } else if (normalized._hashtagsList) {
        hashtags = normalized._hashtagsList;
      } else if (
        normalized.hashtags &&
        typeof normalized.hashtags === "object"
      ) {
        hashtags = Object.keys(normalized.hashtags).filter(
          (k) => normalized.hashtags[k]
        );
      }

      if (hashtags.length > 0) {
        normalized.topic = hashtags.map((tag: string) => `#${tag}`).join(" ");
      }
    }

    // Campi opzionali aggiuntivi
    if (normalized.title && typeof normalized.title !== "string") {
      normalized.title = String(normalized.title);
    }

    if (normalized.topic && typeof normalized.topic !== "string") {
      normalized.topic = String(normalized.topic);
    }

    if (normalized.reference && typeof normalized.reference !== "string") {
      normalized.reference = String(normalized.reference);
    }

    return normalized;
  }

  /**
   * Estrae gli hashtag dal testo o dal topic
   */
  private extractHashtags(text: string): string[] {
    if (!text) return [];
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    if (!matches) return [];
    return matches.map((tag) => tag.substring(1).toLowerCase());
  }

  /**
   * Crea un nuovo post con validazione dello schema
   */
  public async createPost(
    content: string,
    options?: {
      title?: string;
      topic?: string;
      attachment?: string;
      reference?: string;
    }
  ): Promise<Post | null> {
    if (!this.user.is || !this.user.is.pub) {
      throw new Error("Non autenticato");
    }

    if (!content || content.trim() === "") {
      throw new Error("Contenuto post non valido");
    }

    try {
      const userPub = this.user.is.pub;
      const postId = this.generateUUID();
      const timestamp = Date.now();
      const trimmedContent = content.trim();

      // Creiamo un oggetto post che rispetta l'interfaccia Post
      const post: Post = {
        id: postId,
        author: userPub,
        content: trimmedContent,
        timestamp,
      };

      // Aggiungi campi opzionali se forniti
      if (options) {
        if (options.title) post.title = options.title;
        if (options.topic) post.topic = options.topic;
        if (options.attachment) post.attachment = options.attachment;
        if (options.reference) post.reference = options.reference;
      }

      // Crea una struttura semplificata per Gun DB che evita i problemi di validazione
      const simplePostData: any = {
        id: postId,
        author: userPub, // Usa sempre e solo la stringa
        content: trimmedContent,
        timestamp: timestamp,
      };

      // Aggiungi campi opzionali alla struttura semplificata
      if (options) {
        if (options.title) simplePostData.title = options.title;
        if (options.topic) simplePostData.topic = options.topic;
        if (options.attachment) simplePostData.attachment = options.attachment;
        if (options.reference) simplePostData.reference = options.reference;
      }

      // Crea il payload
      simplePostData.payload = {
        content: trimmedContent,
      };

      if (options?.attachment) {
        simplePostData.payload.attachment = options.attachment;
      }

      // Validazione con schema JSON
      const isValid = this.validatePost(simplePostData);
      if (!isValid) {
        this.error(
          `Validazione post fallita: ${JSON.stringify(this.validatePost.errors)}`
        );
        return null;
      }

      // Salva il post nel database con la struttura semplificata
      await new Promise<void>((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .put(simplePostData, (ack: any) => {
            if (ack && ack.err) {
              this.error(`Errore salvataggio post: ${ack.err}`);
            } else {
              this.debug(`Post ${postId} salvato correttamente`);
            }
            resolve();
          });
      });

      // Indicizza per topic/hashtag se presente
      if (options?.topic) {
        const hashtags = this.extractHashtags(options.topic);
        if (hashtags.length > 0) {
          for (const tag of hashtags) {
            await new Promise<void>((resolve) => {
              this.gun
                .get("topics")
                .get(tag)
                .get(postId)
                .put(true, () => resolve());
            });
          }
        }
      }

      // Aggiunge anche ai post dell'utente
      await new Promise<void>((resolve) => {
        this.user
          .get("posts")
          .get(postId)
          .put(
            {
              id: postId,
              timestamp,
            },
            (ack: any) => {
              if (ack && ack.err) {
                this.error(`Errore riferimento post utente: ${ack.err}`);
              } else {
                this.debug(`Riferimento post utente ${postId} salvato`);
              }
              resolve();
            }
          );
      });

      this.emit("post:created", post);

      return post;
    } catch (error: any) {
      this.error(`Errore creazione post: ${error.message}`);
      return null;
    }
  }

  /**
   * Ottieni un post specifico
   */
  public async getPost(postId: string): Promise<Post | null> {
    if (!postId) {
      this.error("ID post mancante");
      return null;
    }

    // Controlla la cache
    const cached = this.postCache.get(postId);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      this.debug(`Post ${postId} recuperato dalla cache`);
      return cached.data;
    }

    try {
      return new Promise((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .once((post: any) => {
            if (!post) {
              this.debug(`Post ${postId} non trovato`);
              resolve(null);
              return;
            }

            // Normalizza il post per prevenire errori di validazione
            post = this.normalizePost(post, postId);

            // Convertiamo i dati di Gun nel formato Post
            const typedPost: Post = {
              id: post.id || postId,
              author: post.author || "sconosciuto",
              content: post.content || "",
              timestamp: post.timestamp || Date.now(),
              attachment: post.attachment || post.imageData,
              title: post.title,
              topic: post.topic,
              reference: post.reference,
            };

            // Salta la validazione per evitare errori con dati esistenti
            // La normalizzazione dovrebbe aver già risolto i problemi principali

            // Salva in cache
            this.postCache.set(postId, {
              data: typedPost,
              timestamp: Date.now(),
            });

            this.debug(`Post ${postId} recuperato`);
            resolve(typedPost);
          });
      });
    } catch (err) {
      this.error(`Errore recupero post ${postId}: ${err}`);
      return null;
    }
  }

  /**
   * Recupera la timeline (post propri e di chi segui)
   */
  public async getTimeline(
    limit = 10,
    options: {
      includeLikes: boolean;
      timeout?: number;
      onlyFollowing?: boolean;
    } = { includeLikes: true }
  ): Promise<TimelineResult> {
    if (!this.gun || !this.user) {
      this.error("Gun/SEA non disponibile");
      return { messages: [], error: "Database non disponibile" };
    }

    this.debug("getTimeline - Recupero timeline con limite:", limit);

    return new Promise(async (resolve) => {
      const messages: Message[] = [];
      const seen = new Set<string>();

      let followingList: string[] = [];
      if (options.onlyFollowing && this.user.is && this.user.is.pub) {
        try {
          const userPub = this.user.is.pub;
          // recupero following da Social.getProfile o qui direttamente
          await new Promise<void>((resolveFollowing) => {
            this.gun
              .get("users")
              .get(userPub)
              .get("following")
              .map()
              .once((val: any, key: string) => {
                if (key !== "_" && val === true) {
                  followingList.push(key);
                }
              });
            setTimeout(resolveFollowing, 500);
          });
        } catch (err) {
          this.error("Errore recupero lista following:", err);
        }
      }

      const timeoutId = setTimeout(() => {
        this.debug(
          `getTimeline - Timeout dopo ${options.timeout || 5000}ms - Restituisco ${messages.length} posts`
        );

        messages.sort(
          (a, b) => (b.createdAt as number) - (a.createdAt as number)
        );
        resolve({ messages });
      }, options.timeout || 5000);

      this.gun
        .get("posts")
        .map()
        .once(async (post: any, id: string) => {
          if (!post || seen.has(id)) return;
          seen.add(id);

          // Normalizza il post per evitare errori di validazione
          post = this.normalizePost(post, id);

          const postAuthor = post.author || post.creator;
          if (
            options.onlyFollowing &&
            postAuthor &&
            this.user.is &&
            this.user.is.pub &&
            postAuthor !== this.user.is.pub &&
            !followingList.includes(postAuthor)
          ) {
            return;
          }

          this.debug(`getTimeline - Post trovato: ${id}`);

          let content = post.content || "";
          let attachment = post.attachment || post.imageData || null;
          if ((!content || !attachment) && post.payload) {
            if (post.payload.content && !content) {
              content = post.payload.content;
              this.debug(
                `getTimeline - Contenuto recuperato da payload diretto: ${content.substring(
                  0,
                  20
                )}...`
              );
            }
            if (
              (post.payload.attachment || post.payload.imageData) &&
              !attachment
            ) {
              attachment = post.payload.attachment || post.payload.imageData;
              this.debug(
                `getTimeline - Allegato recuperato da payload diretto per post: ${id}`
              );
            }
          }

          const postMsg: PostMessage = {
            id,
            type: MessageType.POST,
            subtype: MessageSubtype.EMPTY,
            creator: postAuthor || "sconosciuto",
            createdAt: post.timestamp || Date.now(),
            payload: { content },
          };

          if (attachment) {
            postMsg.payload.attachment = attachment;
          }

          if (options.includeLikes) {
            try {
              const likes = await this.getLikesObject(id);
              (postMsg as any).likes = likes;
            } catch (err) {
              this.error(`Errore recupero likes per post ${id}:`, err);
            }
          }

          messages.push(postMsg);

          if (messages.length >= limit) {
            clearTimeout(timeoutId);
            messages.sort(
              (a, b) => (b.createdAt as number) - (a.createdAt as number)
            );
            resolve({ messages });
          }
        });
    });
  }

  /**
   * Timeline come Observable
   */
  public getTimelineObservable(
    limit = 10,
    options: { includeLikes: boolean } = { includeLikes: true }
  ): Observable<Message[]> {
    if (!this.gun || !this.user) {
      this.error("Gun/SEA non disponibile");
      return of([]);
    }

    return this.gunRx.match<any>("posts").pipe(
      map((posts) => {
        if (!posts || !posts.length) return [];
        const limited = posts.slice(0, limit);
        return limited.map((post) => {
          const id = post.id || "";
          const creator = post.author || post.creator || "sconosciuto";
          const createdAt = post.timestamp || post.createdAt || Date.now();
          let content = post.content || "";
          let attachment = post.attachment || post.imageData || null;
          if ((!content || !attachment) && post.payload) {
            content = post.payload.content || content;
            attachment =
              post.payload.attachment || post.payload.imageData || null;
          }
          const msg: PostMessage = {
            id,
            type: MessageType.POST,
            subtype: MessageSubtype.EMPTY,
            creator,
            createdAt,
            payload: { content },
          };
          if (attachment) msg.payload.attachment = attachment;
          return msg;
        });
      }),
      tap((msgs) =>
        this.debug(`Timeline observable: ricevuti ${msgs.length} post`)
      )
    );
  }

  /**
   * Aggiungi un commento a un post con validazione dello schema
   */
  public async addComment(
    postId: string,
    content: string
  ): Promise<Comment | null> {
    if (!this.user.is || !this.user.is.pub) throw new Error("Non autenticato");
    if (!postId || !content.trim()) throw new Error("Dati commento non validi");
    try {
      const userPub = this.user.is.pub;
      const commentId = this.generateUUID();
      const timestamp = Date.now();
      const comment: Comment = {
        id: commentId,
        postId,
        author: userPub,
        content: content.trim(),
        timestamp,
      };

      // Validazione con schema JSON
      const isValid = this.validateComment(comment);
      if (!isValid) {
        this.error(
          `Validazione commento fallita: ${JSON.stringify(this.validateComment.errors)}`
        );
        return null;
      }

      return new Promise((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .get("comments")
          .get(commentId)
          .put(comment, (ack: any) => {
            if (ack.err) {
              logError(`Errore salvataggio commento: ${ack.err}`);
              resolve(null);
            } else {
              setTimeout(() => {
                this.gun
                  .get("posts")
                  .get(postId)
                  .get("comments")
                  .get(commentId)
                  .once((saved: any) => {
                    if (!saved || !saved.content) {
                      logWarn(
                        `Verifica commento ${commentId}: contenuto mancante, riprovando`
                      );
                      this.gun
                        .get("posts")
                        .get(postId)
                        .get("comments")
                        .get(commentId)
                        .put(comment);
                    } else {
                      this.debug(`Commento ${commentId} correttamente salvato`);
                    }
                  });
              }, 500);
              this.debug(`Commento ${commentId} aggiunto al post ${postId}`);

              // Invalida la cache del post
              this.postCache.delete(postId);

              resolve(comment);
            }
          });
      });
    } catch (err) {
      logError(`Errore aggiunta commento: ${err}`);
      return null;
    }
  }

  /**
   * Ottieni i commenti di un post
   */
  public async getComments(postId: string): Promise<Comment[]> {
    if (!postId) throw new Error("ID post non valido");
    try {
      const comments: Comment[] = [];
      await new Promise<void>((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .get("comments")
          .map()
          .once((c: any, key: string) => {
            if (key !== "_" && c) {
              const comment: Comment = {
                id: c.id || key,
                postId,
                author: c.author || "Anonimo",
                content: c.content || "",
                timestamp: c.timestamp || Date.now(),
              };

              // Validazione leggera
              if (comment.id && comment.content && comment.author) {
                comments.push(comment);
              } else {
                this.error(`Commento ${key} non valido`);
              }
            }
          });
        setTimeout(resolve, 500);
      });
      comments.sort(
        (a, b) => (b.timestamp as number) - (a.timestamp as number)
      );
      return comments;
    } catch (err) {
      logError(`Errore recupero commenti: ${err}`);
      return [];
    }
  }

  /**
   * Metti like a un post
   */
  public async likePost(postId: string): Promise<boolean> {
    if (!this.user.is || !this.user.is.pub) throw new Error("Non autenticato");
    try {
      const userPub = this.user.is.pub;
      await new Promise<void>((resolve, reject) => {
        this.gun
          .get("posts")
          .get(postId)
          .get("likes")
          .get(userPub)
          .put(true, (ack: any) => (ack.err ? reject(ack.err) : resolve()));
      });

      // Invalida la cache del post
      this.postCache.delete(postId);

      return true;
    } catch (err) {
      logError(`Errore like post: ${err}`);
      return false;
    }
  }

  /**
   * Rimuovi like da un post
   */
  public async unlikePost(postId: string): Promise<boolean> {
    if (!this.user.is || !this.user.is.pub) throw new Error("Non autenticato");
    try {
      const userPub = this.user.is.pub;
      await new Promise<void>((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .get("likes")
          .get(userPub)
          .put(null, () => resolve());
      });

      // Invalida la cache del post
      this.postCache.delete(postId);

      return true;
    } catch (err) {
      logError(`Errore unlike post: ${err}`);
      return false;
    }
  }

  /**
   * Ottieni gli utenti che hanno messo like a un post
   */
  public async getLikes(postId: string): Promise<string[]> {
    if (!postId) throw new Error("ID post non valido");
    try {
      const likes: string[] = [];
      await new Promise<void>((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .get("likes")
          .map()
          .once((val: any, key: string) => {
            if (key !== "_" && val === true) likes.push(key);
          });
        setTimeout(resolve, 500);
      });
      return likes;
    } catch (err) {
      logError(`Errore recupero likes: ${err}`);
      return [];
    }
  }

  /**
   * Cerca post per topic/hashtag
   */
  public async searchByTopic(topic: string): Promise<Post[]> {
    if (!topic) throw new Error("Topic non valido");

    // Se è un hashtag, estraiamo il termine di ricerca
    let searchTerm = topic;
    if (topic.startsWith("#")) {
      searchTerm = topic.slice(1).toLowerCase();
    }

    this.debug(`Ricerca post con topic/hashtag: ${searchTerm}`);

    try {
      // Prima cerchiamo nei topics indicizzati
      const refs: string[] = [];
      await new Promise<void>((resolve) => {
        this.gun
          .get("topics")
          .get(searchTerm)
          .map()
          .once((val: any, key: string) => {
            if (key !== "_" && val === true) refs.push(key);
          });
        setTimeout(resolve, 1000);
      });

      // Per compatibilità, cerchiamo anche nei vecchi hashtags
      await new Promise<void>((resolve) => {
        this.gun
          .get("hashtags")
          .get(searchTerm)
          .map()
          .once((val: any, key: string) => {
            if (key !== "_" && val === true && !refs.includes(key))
              refs.push(key);
          });
        setTimeout(resolve, 1000);
      });

      if (refs.length === 0) {
        // Cercheremo come parte di un testo nel topic dei post
        this.debug(
          `Nessun post indicizzato per ${searchTerm}, cercheremo in tutti i post`
        );
        return this.searchPostsByTopicText(searchTerm);
      }

      const posts: Post[] = [];
      for (const id of refs) {
        // Prima controlla la cache
        const cached = this.postCache.get(id);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
          posts.push(cached.data);
          continue;
        }

        const data: any = await new Promise((resolve) => {
          this.gun.get("posts").get(id).once(resolve);
          setTimeout(() => resolve(null), 500);
        });
        if (data && data.content) {
          // Normalizza il post
          const normalizedPost = this.normalizePost(data, id);
          posts.push(normalizedPost as Post);

          // Aggiungi alla cache
          this.postCache.set(id, {
            data: normalizedPost as Post,
            timestamp: Date.now(),
          });
        }
      }
      return posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (err) {
      logError(`Errore ricerca topic: ${err}`);
      return [];
    }
  }

  /**
   * Cerca post che contengono il topic nel testo
   */
  private async searchPostsByTopicText(searchTerm: string): Promise<Post[]> {
    this.debug(`Ricerca post con topic nel testo: ${searchTerm}`);
    try {
      const posts: Post[] = [];
      const seen = new Set<string>();

      // Recupera tutti i post e filtra per topic
      await new Promise<void>((resolve) => {
        this.gun
          .get("posts")
          .map()
          .once((post: any, id: string) => {
            if (!post || seen.has(id)) return;
            seen.add(id);

            const normalizedPost = this.normalizePost(post, id);

            if (
              normalizedPost.topic &&
              normalizedPost.topic
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            ) {
              posts.push(normalizedPost as Post);
            }
          });

        // Timeout per limitare la ricerca
        setTimeout(resolve, 3000);
      });

      return posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (err) {
      logError(`Errore ricerca nel testo: ${err}`);
      return [];
    }
  }

  /**
   * Elimina un post
   */
  public async deletePost(postId: string): Promise<boolean> {
    if (!this.user.is || !this.user.is.pub) throw new Error("Non autenticato");
    try {
      const post: any = await new Promise((res) =>
        this.gun.get("posts").get(postId).once(res)
      );
      if (!post) {
        this.error(`Post ${postId} non trovato`);
        return false;
      }
      const userPub = this.user.is.pub;
      const author = post.author || post.creator;
      if (author !== userPub) {
        logWarn(`Autorizzazione negata per post ${postId}`);
        return false;
      }
      let tags: string[] = [];
      if (post._hashtagsList) tags = post._hashtagsList;
      else if (post.hashtags && typeof post.hashtags === "object")
        tags = Object.keys(post.hashtags).filter((k) => post.hashtags[k]);
      for (const t of tags) {
        await new Promise((r) =>
          this.gun.get("hashtags").get(t).get(postId).put(null, r)
        );
      }
      await new Promise((r) =>
        this.gun.get("users").get(userPub).get("posts").get(postId).put(null, r)
      );
      await new Promise((r) => this.gun.get("posts").get(postId).put(null, r));

      // Rimuovi dalla cache
      this.postCache.delete(postId);

      this.emit("delete:post", { id: postId, author: userPub });
      this.debug(`Post ${postId} eliminato`);
      return true;
    } catch (err) {
      logError(`Errore eliminazione post: ${err}`);
      return false;
    }
  }

  /**
   * Helper privato: recupera likes come oggetto
   */
  private async getLikesObject(
    postId: string
  ): Promise<Record<string, boolean>> {
    try {
      return new Promise<Record<string, boolean>>((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .get("likes")
          .once((likes: any) => {
            if (!likes) {
              resolve({});
            } else {
              resolve(likes);
            }
          });
      });
    } catch (err) {
      this.error(`Errore recupero oggetto likes: ${err}`);
      return {};
    }
  }

  /**
   * Ottieni i like di un post come Observable
   * @param postId ID del post
   * @returns Observable di chiavi pubbliche che hanno messo like
   */
  public getLikesObservable(postId: string): Observable<string[]> {
    return new Observable((subscriber) => {
      // Sottoscrizione ai cambiamenti dei like
      const unsub = this.gun
        .get("posts")
        .get(postId)
        .get("likes")
        .on((likes: any) => {
          if (!likes) {
            subscriber.next([]);
            return;
          }

          // Filtra solo i valori true (like attivi)
          const likesList = Object.entries(likes)
            .filter(([key, value]) => key !== "_" && value === true)
            .map(([key]) => key);

          subscriber.next(likesList);
        });

      // Funzione di pulizia
      return (): void => {
        console.log("unsub");
      };
    });
  }

  /**
   * Ottieni il conteggio dei like come Observable
   * @param postId ID del post
   * @returns Observable del numero di like
   */
  public getLikeCountObservable(postId: string): Observable<number> {
    return this.getLikesObservable(postId).pipe(map((likes) => likes.length));
  }

  /**
   * Pulisce la cache
   */
  public clearCache(): void {
    this.postCache.clear();
    this.debug("Cache dei post pulita");
  }
}
