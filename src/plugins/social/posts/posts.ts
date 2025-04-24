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
} from "../../../types/social";
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
    this.user = this.gun.user();
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
   * Estrae gli hashtag dal testo
   */
  private extractHashtags(text: string): string[] {
    if (!text) return [];
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    if (!matches) return [];
    return matches.map((tag) => tag.substring(1).toLowerCase());
  }

  /**
   * Indicizza un post per hashtag
   */
  private async indexPostByHashtags(
    postId: string,
    hashtags: string[]
  ): Promise<void> {
    if (!hashtags || hashtags.length === 0) return;
    this.debug(`Indicizzazione post ${postId} per ${hashtags.length} hashtag`);
    for (const tag of hashtags) {
      await new Promise<void>((resolve) => {
        this.gun
          .get("hashtags")
          .get(tag)
          .get(postId)
          .put(true, () => resolve());
      });
    }
  }

  /**
   * Pulisce la cache
   */
  public clearCache(): void {
    this.postCache.clear();
    this.debug("Cache dei post pulita");
  }

  /**
   * Normalizza l'oggetto autore per garantire compatibilità con il database
   * @param postData Dati del post da normalizzare
   */
  private normalizeAuthor(postData: any): any {
    if (!postData) return postData;

    // Clona l'oggetto per non modificare l'originale
    const normalized = { ...postData };

    // Se author non è una stringa, lo imposta come stringa
    if (normalized.author && typeof normalized.author !== "string") {
      this.debug(`Normalizzazione author per post ${normalized.id}`);

      // Salva il pub originale se presente nell'oggetto complesso
      if (normalized.author.pub) {
        normalized.author = normalized.author.pub;
      } else if (this.user && this.user.is && this.user.is.pub) {
        // Usa il pub dell'utente corrente come fallback
        normalized.author = this.user.is.pub;
      } else {
        // Ultimo caso, converti a stringa
        normalized.author = String(normalized.author);
      }
    }

    return normalized;
  }

  /**
   * Crea un nuovo post con validazione dello schema
   */
  public async createPost(
    content: string,
    imageData?: string
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

      const hashtags = this.extractHashtags(trimmedContent);
      const hasHashtags = hashtags.length > 0;
      const hashtagsObj: Record<string, boolean> = {};
      hashtags.forEach((tag) => {
        hashtagsObj[tag] = true;
      });

      // Creiamo un oggetto post che rispetta l'interfaccia Post
      const post: Post = {
        id: postId,
        author: userPub,
        content: trimmedContent,
        timestamp,
        imageData: imageData || undefined,
      };

      // Crea una struttura semplificata per Gun DB che evita i problemi di validazione
      // Usa SOLO stringhe per author, mai oggetti complessi
      const simplePostData: any = {
        id: postId,
        author: userPub, // Usa sempre e solo la stringa
        content: trimmedContent,
        timestamp: timestamp,
        imageData: imageData || null,
      };

      if (imageData) {
        simplePostData.payload = {
          content: trimmedContent,
          imageData: imageData,
        };
      } else {
        simplePostData.payload = {
          content: trimmedContent,
        };
      }

      if (hasHashtags) {
        post.hashtags = hashtagsObj;
        post.hashtagsList = hashtags;
        simplePostData.hashtags = hashtagsObj;
        simplePostData._hashtagsList = hashtags;
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
              imageData: post.imageData,
              hashtags: post.hashtags,
              hashtagsList:
                post._hashtagsList ||
                (post.hashtags
                  ? Object.keys(post.hashtags).filter((k) => post.hashtags[k])
                  : undefined),
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

    // Assicura che altri campi siano del tipo corretto
    if (
      normalized.imageData !== null &&
      normalized.imageData !== undefined &&
      typeof normalized.imageData !== "string"
    ) {
      normalized.imageData = null;
    }

    return normalized;
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
          let imageData = post.imageData || null;
          if ((!content || !imageData) && post.payload) {
            if (post.payload.content && !content) {
              content = post.payload.content;
              this.debug(
                `getTimeline - Contenuto recuperato da payload diretto: ${content.substring(
                  0,
                  20
                )}...`
              );
            }
            if (post.payload.imageData && !imageData) {
              imageData = post.payload.imageData;
              this.debug(
                `getTimeline - Immagine recuperata da payload diretto per post: ${id}`
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

          if (imageData) {
            postMsg.payload.attachment = imageData;
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
          let imageData = null;
          if ((!content || !imageData) && post.payload) {
            content = post.payload.content || content;
            imageData = post.payload.imageData || null;
          }
          const msg: PostMessage = {
            id,
            type: MessageType.POST,
            subtype: MessageSubtype.EMPTY,
            creator,
            createdAt,
            payload: { content },
          };
          if (imageData) msg.payload.attachment = imageData;
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
   * Cerca post per hashtag
   */
  public async searchByHashtag(hashtag: string): Promise<Post[]> {
    if (!hashtag) throw new Error("Hashtag non valido");
    const normalized = hashtag.startsWith("#")
      ? hashtag.slice(1).toLowerCase()
      : hashtag.toLowerCase();
    this.debug(`Ricerca post con hashtag #${normalized}`);
    try {
      const refs: string[] = [];
      await new Promise<void>((resolve) => {
        this.gun
          .get("hashtags")
          .get(normalized)
          .map()
          .once((val: any, key: string) => {
            if (key !== "_" && val === true) refs.push(key);
          });
        setTimeout(resolve, 1000);
      });
      if (!refs.length) return [];
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
          const p: any = { ...data };
          if (!p.hashtagsList) {
            if (p._hashtagsList) p.hashtagsList = p._hashtagsList;
            else if (p.hashtags && typeof p.hashtags === "object")
              p.hashtagsList = Object.keys(p.hashtags).filter(
                (k) => p.hashtags[k]
              );
          }
          posts.push(p as Post);

          // Aggiungi alla cache
          this.postCache.set(id, { data: p as Post, timestamp: Date.now() });
        }
      }
      return posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (err) {
      logError(`Errore ricerca hashtag: ${err}`);
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
    const likes: Record<string, boolean> = {};
    return new Promise((resolve) => {
      this.gun
        .get("posts")
        .get(postId)
        .get("likes")
        .map()
        .once((val: any, key: string) => {
          if (key !== "_" && val === true) likes[key] = true;
        });
      setTimeout(() => resolve(likes), 500);
    });
  }
}
