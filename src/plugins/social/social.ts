import { logDebug, logError, logWarn } from "../../utils/logger";
import { IGunInstance } from "gun";
import * as crypto from "crypto";
import { EventEmitter } from "../../utils/eventEmitter";
import {
  Post,
  Comment,
  UserProfile,
  TimelineResult,
  Message,
  PostMessage,
  MessageType,
  MessageSubtype,
} from "../../types/social";
import { GunRxJS } from "../../gun/rxjs-integration";
import { Observable, of, combineLatest } from "rxjs";
import { map, switchMap, tap, catchError } from "rxjs/operators";

// Interfacce per risolvere gli errori di tipo
interface GunPostData {
  id?: string;
  author?: string;
  creator?: string;
  content?: string;
  timestamp?: number;
  imageData?: string;
  payload?: {
    content?: string;
    imageData?: string;
  };
  [key: string]: any; // Indice per proprietà aggiuntive
}

interface GunProfileData {
  alias?: string;
  bio?: string;
  profileImage?: string;
  [key: string]: any; // Indice per proprietà aggiuntive
}

interface GunCollectionData {
  [key: string]: any; // Permette accesso con indice stringa
}

// Type Record generico per dati Gun che permette qualsiasi proprietà
type GunDataRecord = Record<string, any>;

/**
 * Plugin Social semplificato che utilizza direttamente Gun DB
 */
export class Social extends EventEmitter {
  private readonly gun: IGunInstance<any>;
  public user: any; // Gun user instance
  private readonly profileCache = new Map<
    string,
    { data: UserProfile; timestamp: number }
  >();
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minuti
  private readonly gunRx: GunRxJS;

  constructor(gunInstance: IGunInstance<any>) {
    super();
    this.gun = gunInstance;
    this.user = this.gun.user();
    this.gunRx = new GunRxJS(gunInstance);
  }

  /**
   * Metodo per loggare messaggi di debug
   */
  private debug(message: string, ...args: unknown[]): void {
    logDebug(`[Social] ${message}`, ...args);
  }

  /**
   * Metodo per loggare errori
   */
  private error(message: string, ...args: unknown[]): void {
    logError(`[Social] ${message}`, ...args);
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
   * Pulisce le cache e i listener
   */
  public cleanup(): void {
    this.profileCache.clear();
    this.removeAllListeners();
  }

  /**
   * Estrae gli hashtag dal testo
   * @param text Testo da analizzare
   * @returns Array di hashtag trovati
   */
  private extractHashtags(text: string): string[] {
    if (!text) return [];
    // Cerca pattern #parola (lettere, numeri, underscore)
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);

    if (!matches) return [];

    // Rimuove il # e normalizza in minuscolo
    return matches.map((tag) => tag.substring(1).toLowerCase());
  }

  /**
   * Indicizza un post per hashtag
   * @param postId ID del post
   * @param hashtags Array di hashtag da indicizzare
   */
  private async indexPostByHashtags(
    postId: string,
    hashtags: string[]
  ): Promise<void> {
    if (!hashtags || hashtags.length === 0) return;

    logDebug(`Indicizzazione post ${postId} per ${hashtags.length} hashtag`);

    for (const tag of hashtags) {
      // Aggiunge il post all'indice del hashtag
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
   * Crea un nuovo post
   * @param content Contenuto del post
   * @param imageData Dati dell'immagine (Base64 o URL)
   * @returns Dati del post creato o null in caso di errore
   */
  public async post(content: string, imageData?: string): Promise<Post | null> {
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

      // Estrai hashtag dal contenuto
      const hashtags = this.extractHashtags(trimmedContent);
      const hasHashtags = hashtags.length > 0;

      // Crea un oggetto hashtag invece di un array per GunDB
      const hashtagsObj: Record<string, boolean> = {};
      hashtags.forEach((tag) => {
        hashtagsObj[tag] = true;
      });

      // Struttura del post di base - senza proprietà che potrebbero essere undefined
      const post: any = {
        id: postId,
        author: userPub,
        content: trimmedContent,
        timestamp,
        creator: userPub, // per compatibilità con codice esistente
        createdAt: timestamp, // per compatibilità con codice esistente
        type: "POST", // per compatibilità con codice esistente
        subtype: "EMPTY", // per compatibilità con codice esistente
        payload: {
          // per compatibilità con codice esistente
          content: trimmedContent,
        },
      };

      // Aggiungi imageData solo se presente, per evitare valori undefined
      if (imageData) {
        post.imageData = imageData;
        post.payload.imageData = imageData;
      }

      // Aggiungi hashtags solo se ce ne sono
      if (hasHashtags) {
        post.hashtags = hashtagsObj; // usa oggetto per GunDB
        // Tieni hashtagsList come proprietà separata solo se necessario per l'interfaccia
        // ma non salvarlo direttamente nel post per evitare errori con GunDB
        post._hashtagsList = hashtags; // prefisso _ per indicare che è per uso interno
      }

      logDebug(
        `Creazione post: ${postId} ${hasHashtags ? "con hashtag: " + hashtags.join(", ") : ""} ${imageData ? "con immagine" : "senza immagine"}`
      );

      return new Promise((resolve) => {
        // Memorizza il post nell'indice globale
        this.gun
          .get("posts")
          .get(postId)
          .put(post, async (ack: any) => {
            if (ack.err) {
              logError(`Errore salvataggio post: ${ack.err}`);
              resolve(null);
              return;
            }

            // Aggiunge al feed personale dell'utente
            this.gun
              .get("users")
              .get(userPub)
              .get("posts")
              .get(postId)
              .put(true);

            // Indicizza post per hashtag
            if (hasHashtags) {
              await this.indexPostByHashtags(postId, hashtags);
            }

            // Verifica che il post sia stato salvato correttamente
            setTimeout(() => {
              this.gun
                .get("posts")
                .get(postId)
                .once((savedPost: any) => {
                  if (!savedPost || !savedPost.content) {
                    logWarn(
                      `Verifica post ${postId}: contenuto mancante, riprovando la scrittura`
                    );
                    this.gun.get("posts").get(postId).put(post);
                  } else {
                    logDebug(
                      `Verifica post ${postId}: contenuto correttamente salvato`
                    );
                  }
                });
            }, 500);

            // Per l'interfaccia, restituisci hashtagsList come una proprietà normale
            if (hasHashtags) {
              (post as Post).hashtagsList = hashtags;
            }

            // Notifica l'evento
            this.emit("new:post", post);

            logDebug(`Post creato: ${postId}`);
            resolve(post as Post);
          });
      });
    } catch (err) {
      logError(`Errore creazione post: ${err}`);
      return null;
    }
  }

  /**
   * Segui un altro utente
   * @param targetPub Chiave pubblica dell'utente da seguire
   * @returns true se l'operazione è riuscita
   */
  public async follow(targetPub: string): Promise<boolean> {
    if (!this.user.is || !this.user.is.pub) {
      throw new Error("Non autenticato");
    }

    if (targetPub === this.user.is.pub) {
      logWarn("Non puoi seguire te stesso");
      return false;
    }

    try {
      const userPub = this.user.is.pub;
      logDebug(`Follow: ${userPub} → ${targetPub}`);

      // Aggiungi alla lista "following" dell'utente corrente
      await new Promise<void>((resolve, reject) => {
        this.gun
          .get("users")
          .get(userPub)
          .get("following")
          .get(targetPub)
          .put(true, (ack: any) => {
            if (ack.err) reject(new Error(ack.err));
            else resolve();
          });
      });

      // Aggiungi alla lista "followers" dell'utente target
      await new Promise<void>((resolve, reject) => {
        this.gun
          .get("users")
          .get(targetPub)
          .get("followers")
          .get(userPub)
          .put(true, (ack: any) => {
            if (ack.err) reject(new Error(ack.err));
            else resolve();
          });
      });

      // Invalida cache
      this.profileCache.delete(userPub);
      this.profileCache.delete(targetPub);

      // Notifica
      this.emit("follow", targetPub);

      return true;
    } catch (err) {
      logError(`Errore follow: ${err}`);
      return false;
    }
  }

  /**
   * Smetti di seguire un utente
   * @param targetPub Chiave pubblica dell'utente da smettere di seguire
   * @returns true se l'operazione è riuscita
   */
  public async unfollow(targetPub: string): Promise<boolean> {
    if (!this.user.is || !this.user.is.pub) {
      throw new Error("Non autenticato");
    }

    if (targetPub === this.user.is.pub) {
      logWarn("Non puoi smettere di seguire te stesso");
      return false;
    }

    try {
      const userPub = this.user.is.pub;
      logDebug(`Unfollow: ${userPub} ⊘ ${targetPub}`);

      // Rimuovi dalla lista "following" dell'utente corrente
      await new Promise<void>((resolve) => {
        this.gun
          .get("users")
          .get(userPub)
          .get("following")
          .get(targetPub)
          .put(null, () => resolve());
      });

      // Rimuovi dalla lista "followers" dell'utente target
      await new Promise<void>((resolve) => {
        this.gun
          .get("users")
          .get(targetPub)
          .get("followers")
          .get(userPub)
          .put(null, () => resolve());
      });

      // Invalida cache
      this.profileCache.delete(userPub);
      this.profileCache.delete(targetPub);

      // Notifica
      this.emit("unfollow", targetPub);

      return true;
    } catch (err) {
      logError(`Errore unfollow: ${err}`);
      return false;
    }
  }

  /**
   * Ottieni il profilo di un utente
   * @param pub Chiave pubblica dell'utente
   * @returns Profilo dell'utente
   */
  public async getProfile(pub: string): Promise<UserProfile> {
    // Controlla se il profilo è nella cache
    const cached = this.profileCache.get(pub);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    // Profilo vuoto con dati minimi
    const profile: UserProfile = {
      pub,
      followers: [],
      following: [],
      customFields: {},
    };

    try {
      // Ottieni dati profilo
      await new Promise<void>((resolve) => {
        this.gun
          .get("users")
          .get(pub)
          .once((userData: any) => {
            if (userData) {
              if (userData.alias) profile.alias = userData.alias;
              if (userData.bio) profile.bio = userData.bio;
              if (userData.profileImage)
                profile.profileImage = userData.profileImage;
            }
            resolve();
          });
      });

      // Ottieni followers
      await new Promise<void>((resolve) => {
        this.gun
          .get("users")
          .get(pub)
          .get("followers")
          .map()
          .once((val: any, key: string) => {
            if (key !== "_" && val === true) {
              profile.followers.push(key);
            }
          });
        setTimeout(resolve, 500);
      });

      // Ottieni following
      await new Promise<void>((resolve) => {
        this.gun
          .get("users")
          .get(pub)
          .get("following")
          .map()
          .once((val: any, key: string) => {
            if (key !== "_" && val === true) {
              profile.following.push(key);
            }
          });
        setTimeout(resolve, 500);
      });

      // Salva in cache
      this.profileCache.set(pub, { data: profile, timestamp: Date.now() });
      return profile;
    } catch (err) {
      logError(`Errore caricamento profilo: ${err}`);
      return profile;
    }
  }

  /**
   * Aggiorna un campo del profilo
   * @param field Nome del campo da aggiornare
   * @param value Nuovo valore
   * @returns true se l'operazione è riuscita
   */
  public async updateProfile(field: string, value: string): Promise<boolean> {
    if (!this.user.is || !this.user.is.pub) {
      throw new Error("Non autenticato");
    }

    try {
      await new Promise<void>((resolve, reject) => {
        this.gun
          .get("users")
          .get(this.user.is.pub)
          .get(field)
          .put(value, (ack: any) => {
            if (ack.err) reject(new Error(ack.err));
            else resolve();
          });
      });

      // Invalida cache
      this.profileCache.delete(this.user.is.pub);
      return true;
    } catch (err) {
      logError(`Errore aggiornamento profilo: ${err}`);
      return false;
    }
  }

  /**
   * Ottieni la timeline (post propri e di chi segui)
   * @returns Risultato della timeline
   */
  public async getTimeline(
    limit = 10,
    options: { includeLikes: boolean; timeout?: number } = {
      includeLikes: true,
    }
  ): Promise<TimelineResult> {
    if (!this.gun || !this.user) {
      this.error("Gun/SEA non disponibile");
      return { messages: [], error: "Database non disponibile" };
    }

    this.debug("getTimeline - Recupero timeline con limite:", limit);

    return new Promise((resolve) => {
      const messages: Message[] = [];
      const seen = new Set();

      // Imposta un timeout per evitare di bloccarsi indefinitamente
      const timeoutId = setTimeout(() => {
        this.debug(
          `getTimeline - Timeout dopo ${options.timeout || 5000}ms - Restituisco ${messages.length} posts`
        );
        resolve({ messages });
      }, options.timeout || 5000);

      // Recupera i post più recenti
      this.gun
        .get("posts")
        .map()
        .once(async (post: any, id: string) => {
          try {
            if (!post || seen.has(id)) return;
            seen.add(id);

            this.debug(`getTimeline - Post trovato: ${id}`);

            // Verifica e ottieni il contenuto del post
            let content = post.content || "";
            let imageData = post.imageData || null;

            // Se non c'è contenuto diretto, prova a recuperarlo dal payload
            if ((!content || !imageData) && post.payload) {
              try {
                // Se il payload ha il contenuto direttamente
                if (post.payload.content && !content) {
                  content = post.payload.content;
                  this.debug(
                    `getTimeline - Contenuto recuperato da payload diretto: ${content.substring(0, 20)}...`
                  );
                }

                // Se il payload ha i dati immagine direttamente
                if (post.payload.imageData && !imageData) {
                  imageData = post.payload.imageData;
                  this.debug(
                    `getTimeline - Immagine recuperata da payload diretto per post: ${id}`
                  );
                }
              } catch (err) {
                this.error("Errore recupero payload post:", err);
              }
            }

            // Crea un messaggio di tipo PostMessage con dati sicuri
            const postMsg: PostMessage = {
              id,
              type: MessageType.POST,
              subtype: MessageSubtype.EMPTY,
              creator: post.author || post.creator || "sconosciuto",
              createdAt: post.timestamp || Date.now(),
              payload: {
                content: content || "",
              },
            };

            // Aggiungi attachment solo se c'è un'immagine
            if (imageData) {
              postMsg.payload.attachment = imageData;
            }

            // Aggiungi i like se richiesto
            if (options.includeLikes) {
              try {
                const likes = await this.getLikesObject(id);
                (postMsg as any).likes = likes;
              } catch (err) {
                this.error(`Errore recupero likes per post ${id}:`, err);
              }
            }

            messages.push(postMsg);

            // Se abbiamo raggiunto il limite, conclude
            if (messages.length >= limit) {
              clearTimeout(timeoutId);
              resolve({ messages });
            }
          } catch (err) {
            this.error("Errore elaborazione post:", err);
          }
        });
    });
  }

  /**
   * Ottieni l'oggetto dei like di un post
   * @private
   * @param postId ID del post
   * @returns Oggetto con i like
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
          if (key !== "_" && val === true) {
            likes[key] = true;
          }
        });

      setTimeout(() => resolve(likes), 500);
    });
  }

  /**
   * Aggiungi un commento a un post
   * @param postId ID del post
   * @param content Contenuto del commento
   * @returns Dati del commento o null in caso di errore
   */
  public async addComment(
    postId: string,
    content: string
  ): Promise<Comment | null> {
    if (!this.user.is || !this.user.is.pub) {
      throw new Error("Non autenticato");
    }

    if (!postId || !content || content.trim() === "") {
      throw new Error("Dati commento non validi");
    }

    try {
      const userPub = this.user.is.pub;
      const commentId = this.generateUUID();
      const timestamp = Date.now();

      const comment = {
        id: commentId,
        postId,
        author: userPub,
        content: content.trim(),
        timestamp,
      };

      return new Promise((resolve) => {
        // Salva il commento nel post
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
              // Verifica doppia scrittura per garantire persistenza
              setTimeout(() => {
                this.gun
                  .get("posts")
                  .get(postId)
                  .get("comments")
                  .get(commentId)
                  .once((savedComment: any) => {
                    if (!savedComment || !savedComment.content) {
                      logWarn(
                        `Verifica commento ${commentId}: contenuto mancante, riprovando la scrittura`
                      );
                      this.gun
                        .get("posts")
                        .get(postId)
                        .get("comments")
                        .get(commentId)
                        .put(comment);
                    } else {
                      logDebug(
                        `Verifica commento ${commentId}: contenuto correttamente salvato`
                      );
                    }
                  });
              }, 500);

              logDebug(`Commento ${commentId} aggiunto al post ${postId}`);
              resolve(comment as Comment);
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
   * @param postId ID del post
   * @returns Array di commenti
   */
  public async getComments(postId: string): Promise<Comment[]> {
    if (!postId) {
      throw new Error("ID post non valido");
    }

    try {
      const comments: Comment[] = [];

      await new Promise<void>((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .get("comments")
          .map()
          .once((comment: any, key: string) => {
            if (key !== "_" && comment) {
              // Assicurati che tutti i campi siano presenti
              const processedComment = {
                id: comment.id || key,
                author: comment.author || "Anonimo",
                content: comment.content || "", // Se il contenuto è vuoto, sarà gestito dal frontend
                timestamp: comment.timestamp || Date.now(),
                postId,
              };

              if (!comment.content) {
                logWarn(
                  `Commento ${key} senza contenuto, verifica i dati in GunDB`
                );
              }

              comments.push(processedComment);
            }
          });

        setTimeout(resolve, 500);
      });

      // Ordina per data
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
   * @param postId ID del post
   * @returns true se l'operazione è riuscita
   */
  public async likePost(postId: string): Promise<boolean> {
    if (!this.user.is || !this.user.is.pub) {
      throw new Error("Non autenticato");
    }

    try {
      const userPub = this.user.is.pub;

      await new Promise<void>((resolve, reject) => {
        this.gun
          .get("posts")
          .get(postId)
          .get("likes")
          .get(userPub)
          .put(true, (ack: any) => {
            if (ack.err) reject(new Error(ack.err));
            else resolve();
          });
      });

      return true;
    } catch (err) {
      logError(`Errore like post: ${err}`);
      return false;
    }
  }

  /**
   * Rimuovi like da un post
   * @param postId ID del post
   * @returns true se l'operazione è riuscita
   */
  public async unlikePost(postId: string): Promise<boolean> {
    if (!this.user.is || !this.user.is.pub) {
      throw new Error("Non autenticato");
    }

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

      return true;
    } catch (err) {
      logError(`Errore unlike post: ${err}`);
      return false;
    }
  }

  /**
   * Ottieni gli utenti che hanno messo like a un post
   * @param postId ID del post
   * @returns Array di ID utenti che hanno messo like
   */
  public async getLikes(postId: string): Promise<string[]> {
    if (!postId) {
      throw new Error("ID post non valido");
    }

    try {
      const likes: string[] = [];

      await new Promise<void>((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .get("likes")
          .map()
          .once((val: any, key: string) => {
            if (key !== "_" && val === true) {
              likes.push(key);
            }
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
   * Ottieni il conteggio dei like di un post
   * @param postId ID del post
   * @returns Numero di like
   */
  public async getLikeCount(postId: string): Promise<number> {
    const likes = await this.getLikes(postId);
    return likes.length;
  }

  /**
   * Cerca post per hashtag
   * @param hashtag Hashtag da cercare (senza #)
   * @returns Array di post che contengono l'hashtag
   */
  public async searchByHashtag(hashtag: string): Promise<Post[]> {
    if (!hashtag) {
      throw new Error("Hashtag non valido");
    }

    // Normalizza hashtag in minuscolo e rimuovi # se presente
    const normalizedTag = hashtag.startsWith("#")
      ? hashtag.substring(1).toLowerCase()
      : hashtag.toLowerCase();

    logDebug(`Ricerca post con hashtag #${normalizedTag}`);

    try {
      // Recupera i riferimenti ai post con l'hashtag
      const postRefs: string[] = [];
      await new Promise<void>((resolve) => {
        this.gun
          .get("hashtags")
          .get(normalizedTag)
          .map()
          .once((val: any, key: string) => {
            if (key !== "_" && val === true) {
              postRefs.push(key);
            }
          });

        setTimeout(resolve, 1000);
      });

      if (postRefs.length === 0) {
        logDebug(`Nessun post trovato con hashtag #${normalizedTag}`);
        return [];
      }

      logDebug(`Trovati ${postRefs.length} post con hashtag #${normalizedTag}`);

      // Recupera i post effettivi
      const posts: Post[] = [];
      for (const postId of postRefs) {
        const post = await new Promise<any>((resolve) => {
          this.gun
            .get("posts")
            .get(postId)
            .once((data: any) => {
              resolve(data);
            });

          // Timeout per garantire la risposta
          setTimeout(() => resolve(null), 500);
        });

        if (post && post.content) {
          // Garantisce che ci sia sempre un array hashtagsList
          const postData = { ...post } as Post;

          // Recupera hashtags in diversi formati possibili
          if (!postData.hashtagsList) {
            if (post._hashtagsList) {
              // Nuovo formato con _hashtagsList
              postData.hashtagsList = post._hashtagsList;
            } else if (post.hashtags) {
              // Vecchio formato con hashtags come oggetto
              if (
                typeof post.hashtags === "object" &&
                !Array.isArray(post.hashtags)
              ) {
                postData.hashtagsList = Object.keys(post.hashtags).filter(
                  (key) => post.hashtags[key] === true
                );
              } else if (Array.isArray(post.hashtags)) {
                // Caso in cui hashtags è già un array
                postData.hashtagsList = post.hashtags;
              }
            } else {
              // Se non troviamo hashtag, usiamo un array vuoto
              postData.hashtagsList = [];
            }
          }

          posts.push(postData);
        }
      }

      // Ordina per data (più recenti prima)
      posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      return posts;
    } catch (err) {
      logError(`Errore ricerca hashtag: ${err}`);
      return [];
    }
  }

  /**
   * Elimina un post
   * @param postId ID del post da eliminare
   * @returns true se l'operazione è riuscita, false altrimenti
   */
  public async deletePost(postId: string): Promise<boolean> {
    if (!this.user.is || !this.user.is.pub) {
      throw new Error("Non autenticato");
    }

    try {
      // Verifica che l'utente sia l'autore del post
      const post = await new Promise<any>((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .once((data: any) => {
            resolve(data);
          });
      });

      if (!post) {
        logError(`Post ${postId} non trovato`);
        return false;
      }

      const userPub = this.user.is.pub;
      const postAuthor = post.author || post.creator;

      if (postAuthor !== userPub) {
        logWarn(
          `L'utente ${userPub} non è autorizzato a eliminare il post ${postId}`
        );
        return false;
      }

      logDebug(`Eliminazione post: ${postId}`);

      // Ottieni la lista degli hashtag da rimuovere dall'indice
      let hashtagsToRemove: string[] = [];

      // Gestisci sia il vecchio formato (array) che il nuovo formato (oggetto)
      if (post.hashtagsList && Array.isArray(post.hashtagsList)) {
        hashtagsToRemove = post.hashtagsList;
      } else if (post.hashtags) {
        if (Array.isArray(post.hashtags)) {
          // Vecchio formato (array)
          hashtagsToRemove = post.hashtags;
        } else {
          // Nuovo formato (oggetto)
          hashtagsToRemove = Object.keys(post.hashtags).filter(
            (key) => post.hashtags[key] === true
          );
        }
      }

      // Rimuovi i riferimenti dagli indici hashtag
      if (hashtagsToRemove.length > 0) {
        for (const tag of hashtagsToRemove) {
          await new Promise<void>((resolve) => {
            this.gun
              .get("hashtags")
              .get(tag)
              .get(postId)
              .put(null, () => resolve());
          });
        }
      }

      // Rimuovi i riferimenti al post dalle liste degli utenti
      await new Promise<void>((resolve) => {
        this.gun
          .get("users")
          .get(userPub)
          .get("posts")
          .get(postId)
          .put(null, () => resolve());
      });

      // Elimina il post dall'indice globale
      await new Promise<void>((resolve) => {
        this.gun
          .get("posts")
          .get(postId)
          .put(null, () => resolve());
      });

      // Notifica l'evento di eliminazione
      this.emit("delete:post", { id: postId, author: userPub });

      logDebug(`Post ${postId} eliminato`);
      return true;
    } catch (err) {
      logError(`Errore eliminazione post: ${err}`);
      return false;
    }
  }

  /**
   * Ottieni la timeline (post propri e di chi segui) come Observable
   * @returns Observable di post in tempo reale
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

        // Limita il numero di post
        const limitedPosts = posts.slice(0, limit);

        return limitedPosts.map((post) => {
          // Estrai i dati in modo sicuro
          const id = post.id || "";
          const creator = post.author || post.creator || "sconosciuto";
          const createdAt = post.timestamp || post.createdAt || Date.now();

          // Gestisci il contenuto in modo sicuro
          let content = post.content || "";
          let imageData = null;

          // Recupera contenuto dal payload se necessario
          if ((!content || !imageData) && post.payload) {
            content = post.payload.content || content;
            imageData = post.payload.imageData || null;
          }

          // Crea messaggio di tipo PostMessage
          const postMsg: PostMessage = {
            id,
            type: MessageType.POST,
            subtype: MessageSubtype.EMPTY,
            creator,
            createdAt,
            payload: {
              content,
            },
          };

          // Aggiungi attachment solo se presente
          if (imageData) {
            postMsg.payload.attachment = imageData;
          }

          return postMsg;
        });
      }),
      tap((messages) =>
        this.debug(`Timeline observable: ricevuti ${messages.length} post`)
      )
    );
  }

  /**
   * Ottieni i commenti di un post come Observable
   * @param postId ID del post
   * @returns Observable di commenti in tempo reale
   */
  public getCommentsObservable(postId: string): Observable<Comment[]> {
    if (!postId) {
      return of([]);
    }

    return this.gunRx.observe(`posts/${postId}/comments`).pipe(
      map((comments) => {
        if (!comments) return [];

        // Converti l'oggetto dei commenti in array
        const commentsArray = Object.entries(comments)
          .filter(([key, _]) => key !== "_") // Filtra le chiavi Gun interne
          .map(([key, value]) => {
            const comment = value as any;
            return {
              id: comment.id || key,
              author: comment.author || "Anonimo",
              content: comment.content || "",
              timestamp: comment.timestamp || Date.now(),
              postId,
            } as Comment;
          })
          .filter((comment) => comment.content); // Filtra i commenti senza contenuto

        // Ordina per data (più recenti prima)
        return commentsArray.sort(
          (a, b) => (b.timestamp as number) - (a.timestamp as number)
        );
      }),
      tap((comments) =>
        this.debug(
          `Commenti observable per post ${postId}: ${comments.length} commenti`
        )
      )
    );
  }

  /**
   * Ottieni i like di un post come Observable
   * @param postId ID del post
   * @returns Observable del conteggio like in tempo reale
   */
  public getLikesObservable(postId: string): Observable<string[]> {
    if (!postId) {
      return of([]);
    }

    return this.gunRx.observe(`posts/${postId}/likes`).pipe(
      map((likes) => {
        if (!likes) return [];

        // Converti l'oggetto dei like in array di utenti
        return Object.entries(likes)
          .filter(([key, value]) => key !== "_" && value === true)
          .map(([key, _]) => key);
      }),
      tap((likes) =>
        this.debug(`Like observable per post ${postId}: ${likes.length} like`)
      )
    );
  }

  /**
   * Ottieni il conteggio dei like di un post come Observable
   * @param postId ID del post
   * @returns Observable con il numero di like in tempo reale
   */
  public getLikeCountObservable(postId: string): Observable<number> {
    return this.getLikesObservable(postId).pipe(map((likes) => likes.length));
  }

  /**
   * Ottieni un post specifico con dettagli dell'autore in tempo reale
   * @param postId ID del post
   * @returns Observable del post arricchito con dettagli utente
   */
  public getEnrichedPostObservable(postId: string): Observable<any> {
    return this.gunRx.observe(`posts/${postId}`).pipe(
      switchMap((post) => {
        if (!post) return of(null);

        // Utilizza type assertion generica
        const typedPost = post as GunDataRecord;
        const author = typedPost.author || typedPost.creator;

        // Verifica se abbiamo un autore valido
        if (!author) {
          return of({
            ...typedPost,
            authorProfile: { pub: "sconosciuto" },
          });
        }

        // Ottieni il profilo dell'autore
        const authorProfile$ = this.gunRx.observe(`users/${author}`);

        // Combina post e profilo
        return combineLatest([of(typedPost), authorProfile$]).pipe(
          map(([postData, profileData]) => {
            // Crea una versione sicura del post per evitare valori undefined
            const safePost = { ...postData };

            // Assicura che il payload esista
            if (!safePost.payload) {
              safePost.payload = { content: safePost.content || "" };
            } else if (!safePost.payload.content && safePost.content) {
              // Assicura che ci sia un contenuto nel payload
              safePost.payload.content = safePost.content;
            }

            // Verifica che le proprietà obbligatorie esistano
            if (!safePost.id) safePost.id = postId;
            if (!safePost.timestamp) safePost.timestamp = Date.now();

            return {
              ...safePost,
              authorProfile: profileData || {
                pub: postData.author || "sconosciuto",
              },
            };
          })
        );
      }),
      tap((post) => {
        if (post) {
          this.debug(`Post arricchito ${postId} caricato con successo`);
        } else {
          this.debug(`Post ${postId} non trovato`);
        }
      }),
      catchError((err) => {
        this.error(`Errore caricamento post arricchito: ${err}`);
        return of(null);
      })
    );
  }

  /**
   * Cerca post per hashtag con aggiornamenti in tempo reale
   * @param hashtag Hashtag da cercare
   * @returns Observable di post con l'hashtag specificato
   */
  public searchByHashtagObservable(hashtag: string): Observable<Post[]> {
    if (!hashtag) {
      return of([]);
    }

    // Normalizza hashtag
    const normalizedTag = hashtag.startsWith("#")
      ? hashtag.substring(1).toLowerCase()
      : hashtag.toLowerCase();

    this.debug(`Ricerca observable per hashtag #${normalizedTag}`);

    // Osserva l'indice degli hashtag
    return this.gunRx.observe(`hashtags/${normalizedTag}`).pipe(
      switchMap((hashtagIndex) => {
        if (!hashtagIndex) return of([]);

        // Estrai gli ID dei post
        const postIds = Object.keys(hashtagIndex).filter((key) => key !== "_");

        if (postIds.length === 0) return of([]);

        // Per ogni ID, carica il post completo
        const postObservables = postIds.map((id) =>
          this.gunRx.observe(`posts/${id}`).pipe(
            map((post) => {
              if (post) {
                // Garantisce che ci sia sempre un array hashtagsList
                const typedPost = { ...post } as any;

                // Recupera hashtags in diversi formati possibili
                if (!typedPost.hashtagsList) {
                  if (typedPost._hashtagsList) {
                    // Nuovo formato con _hashtagsList
                    typedPost.hashtagsList = typedPost._hashtagsList;
                  } else if (typedPost.hashtags) {
                    // Formato con hashtags come oggetto
                    if (
                      typeof typedPost.hashtags === "object" &&
                      !Array.isArray(typedPost.hashtags)
                    ) {
                      typedPost.hashtagsList = Object.keys(
                        typedPost.hashtags
                      ).filter((key) => typedPost.hashtags[key] === true);
                    } else if (Array.isArray(typedPost.hashtags)) {
                      // Caso in cui hashtags è già un array
                      typedPost.hashtagsList = typedPost.hashtags;
                    }
                  } else {
                    // Se non troviamo hashtag, usiamo un array vuoto
                    typedPost.hashtagsList = [];
                  }
                }

                return typedPost as Post;
              }
              return post as Post;
            })
          )
        );

        // Combina tutti i post in un array
        return combineLatest(postObservables);
      }),
      map((posts) => posts.filter((post) => post && post.content)),
      map((posts) =>
        posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      ),
      tap((posts) =>
        this.debug(`Trovati ${posts.length} post con hashtag #${normalizedTag}`)
      )
    );
  }

  /**
   * Osserva il profilo di un utente in tempo reale
   * @param pub Chiave pubblica dell'utente
   * @returns Observable del profilo utente
   */
  public getProfileObservable(pub: string): Observable<UserProfile> {
    if (!pub) {
      return of({
        pub: "",
        followers: [],
        following: [],
        customFields: {},
      });
    }

    // Profilo base
    const baseProfile: UserProfile = {
      pub,
      followers: [],
      following: [],
      customFields: {},
    };

    // Osserva i dati del profilo
    const profileData$ = this.gunRx.observe(`users/${pub}`);
    const followers$ = this.gunRx.observe(`users/${pub}/followers`);
    const following$ = this.gunRx.observe(`users/${pub}/following`);

    return combineLatest([profileData$, followers$, following$]).pipe(
      map(([profileData, followers, following]) => {
        // Type assertions con Record generico
        const typedProfileData = profileData as GunDataRecord;
        const typedFollowers = followers as GunDataRecord;
        const typedFollowing = following as GunDataRecord;

        // Crea profilo combinando i dati
        const profile: UserProfile = { ...baseProfile };

        // Aggiungi dati profilo base
        if (typedProfileData) {
          if (typedProfileData.alias) profile.alias = typedProfileData.alias;
          if (typedProfileData.bio) profile.bio = typedProfileData.bio;
          if (typedProfileData.profileImage)
            profile.profileImage = typedProfileData.profileImage;
        }

        // Aggiungi followers
        if (typedFollowers) {
          profile.followers = Object.keys(typedFollowers).filter(
            (key) => key !== "_" && typedFollowers[key] === true
          );
        }

        // Aggiungi following
        if (typedFollowing) {
          profile.following = Object.keys(typedFollowing).filter(
            (key) => key !== "_" && typedFollowing[key] === true
          );
        }

        return profile;
      }),
      tap((profile) =>
        this.debug(
          `Profilo observable ${pub}: ${profile.followers.length} followers, ${profile.following.length} following`
        )
      )
    );
  }

  /**
   * Ottieni tutti gli utenti registrati sulla rete
   * @returns Array di UserProfile base
   */
  public async getAllUsers(): Promise<UserProfile[]> {
    this.debug("Recupero di tutti gli utenti dalla rete");

    return new Promise((resolve) => {
      const users: UserProfile[] = [];
      const seen = new Set<string>();

      // Imposta un timeout per evitare attese infinite
      const timeoutId = setTimeout(() => {
        this.debug(
          `Timeout raggiunto, restituisco ${users.length} utenti trovati`
        );
        resolve(users);
      }, 5000);

      // Cerca tutti gli utenti attraverso la collezione 'users'
      this.gun
        .get("users")
        .map()
        .once(async (userData: any, userPub: string) => {
          try {
            // Ignora la chiave Gun interna e gli utenti già processati
            if (userPub === "_" || seen.has(userPub)) return;
            seen.add(userPub);

            this.debug(`Utente trovato: ${userPub}`);

            // Crea un profilo base
            const profileData: UserProfile = {
              pub: userPub,
              followers: [],
              following: [],
              customFields: {},
            };

            // Aggiungi informazioni se disponibili
            if (userData) {
              if (userData.alias) profileData.alias = userData.alias;
              if (userData.bio) profileData.bio = userData.bio;
              if (userData.profileImage)
                profileData.profileImage = userData.profileImage;
            }

            // Aggiungi alla lista
            users.push(profileData);

            // Se abbiamo molti utenti, concluriamo prima
            if (users.length > 100) {
              clearTimeout(timeoutId);
              this.debug(`Limite utenti raggiunto (100), concludo la ricerca`);
              resolve(users);
            }
          } catch (err) {
            this.error(`Errore elaborazione utente ${userPub}:`, err);
          }
        });
    });
  }

  /**
   * Ottieni tutti gli utenti come Observable
   * @returns Observable di UserProfile
   */
  public getAllUsersObservable(): Observable<UserProfile[]> {
    return new Observable((subscriber) => {
      this.debug("Avvio ricerca utenti observable");

      const users: UserProfile[] = [];
      const seen = new Set<string>();

      // Timeout per concludere la ricerca
      const timeoutId = setTimeout(() => {
        this.debug(
          `Timeout ricerca utenti observable: trovati ${users.length} utenti`
        );
        subscriber.next([...users]); // Copia l'array per sicurezza
      }, 5000);

      // Cerca tutti gli utenti
      this.gun
        .get("users")
        .map()
        .on((userData: any, userPub: string) => {
          try {
            // Ignora la chiave Gun interna e gli utenti già processati
            if (userPub === "_" || seen.has(userPub)) return;
            seen.add(userPub);

            // Crea un profilo base
            const profileData: UserProfile = {
              pub: userPub,
              followers: [],
              following: [],
              customFields: {},
            };

            // Aggiungi informazioni se disponibili
            if (userData) {
              if (userData.alias) profileData.alias = userData.alias;
              if (userData.bio) profileData.bio = userData.bio;
              if (userData.profileImage)
                profileData.profileImage = userData.profileImage;
            }

            // Aggiungi alla lista
            users.push(profileData);

            // Notifica i sottoscrittori con l'array aggiornato
            subscriber.next([...users]);
          } catch (err) {
            this.error(
              `Errore elaborazione utente observable ${userPub}:`,
              err
            );
          }
        });

      // Funzione di pulizia quando ci si disconnette
      return () => {
        clearTimeout(timeoutId);
        this.debug("Observable utenti chiuso");
      };
    });
  }
}
