import { logDebug, logError, logWarn } from "../../utils/logger";
import { GunDataRecord } from "../../gun/types";
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
} from "./types";
import { GunRxJS } from "../../gun/rxjs-integration";
import { Observable, of, combineLatest } from "rxjs";
import { map, switchMap, tap, catchError } from "rxjs/operators";
import { IGunInstance } from "gun";

import { FriendService } from "./friends/friends";
import { MessageService } from "./messagges/messages";
import { CertificateService } from "./certificates/certs";
import { PostService } from "./posts/posts";
import { Followers } from "./followers/followers";
import { Profile } from "./profile/profile";

/**
 * Plugin Social che utilizza Gun DB
 */
export class Social extends EventEmitter {
  private readonly gun: IGunInstance<any>;
  public readonly user: any;
  public readonly gunRx: GunRxJS;
  public readonly friendService: FriendService;
  public readonly messageService: MessageService;
  public readonly certificateService: CertificateService;
  public readonly postService: PostService;
  public readonly followerService: Followers;
  public readonly profileService: Profile;

  constructor(gunInstance: IGunInstance<any>) {
    super();
    this.gun = gunInstance;
    this.user = this.gun.user().recall({ sessionStorage: true });
    this.gunRx = new GunRxJS(gunInstance);
    this.friendService = new FriendService(gunInstance);
    this.messageService = new MessageService(gunInstance);
    this.certificateService = new CertificateService(gunInstance);
    this.postService = new PostService(gunInstance);
    this.followerService = new Followers(gunInstance);
    this.profileService = new Profile(gunInstance);

    // Propagare gli eventi di PostService
    this.postService.on("new:post", (post) => this.emit("new:post", post));
    this.postService.on("delete:post", (data) =>
      this.emit("delete:post", data)
    );
    
    // Propagare gli eventi di followerService
    this.followerService.on("follow", (targetPub) => this.emit("follow", targetPub));
    this.followerService.on("unfollow", (targetPub) => this.emit("unfollow", targetPub));
    
    // Propagare gli eventi di profileService
    this.profileService.on("profile:update", (data) => this.emit("profile:update", data));
    this.profileService.on("profile:update:multiple", (data) => this.emit("profile:update:multiple", data));
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
   * Pulisce le cache e i listener
   */
  public cleanup(): void {
    this.profileService.clearCache();
    this.removeAllListeners();
  }

  /**
   * Segui un altro utente - delegato a followerService
   * @param targetPub Chiave pubblica dell'utente da seguire
   * @returns true se l'operazione è riuscita
   */
  public async follow(targetPub: string): Promise<boolean> {
    const result = await this.followerService.follow(targetPub);
    
    if (result) {
      // Invalida cache
      this.profileService.clearCache();
    }
    
    return result;
  }

  /**
   * Smetti di seguire un utente - delegato a followerService
   * @param targetPub Chiave pubblica dell'utente da smettere di seguire
   * @returns true se l'operazione è riuscita
   */
  public async unfollow(targetPub: string): Promise<boolean> {
    const result = await this.followerService.unfollow(targetPub);
    
    if (result) {
      // Invalida cache
      this.profileService.clearCache();
    }
    
    return result;
  }

  /**
   * Ottieni il profilo di un utente - delegato a profileService
   * @param pub Chiave pubblica dell'utente
   * @returns Profilo dell'utente
   */
  public async getProfile(pub: string): Promise<UserProfile> {
    const profile = await this.profileService.getProfile(pub);
    
    // Aggiungi followers e following
    profile.followers = await this.followerService.getFollowers(pub);
    profile.following = await this.followerService.getFollowing(pub);
    
    return profile;
  }

  /**
   * Aggiorna un campo del profilo - delegato a profileService
   * @param field Nome del campo da aggiornare
   * @param value Nuovo valore
   * @returns true se l'operazione è riuscita
   */
  public async updateProfile(field: string, value: string): Promise<boolean> {
    return this.profileService.updateProfile(field, value);
  }

  /**
   * Aggiorna campi multipli del profilo - delegato a profileService
   * @param fields Record di campo-valore da aggiornare
   * @returns true se l'operazione è riuscita
   */
  public async updateProfileFields(fields: Record<string, string>): Promise<boolean> {
    return this.profileService.updateProfileFields(fields);
  }

  /**
   * Crea un nuovo post - delegato a PostService
   */
  public async post(
    content: string,
    options?: {
      title?: string;
      topic?: string;
      attachment?: string;
      reference?: string;
    }
  ): Promise<Post | null> {
    return this.postService.createPost(content, options);
  }

  /**
   * Ottieni la timeline - delegato a PostService
   */
  public async getTimeline(
    limit = 10,
    options: {
      includeLikes: boolean;
      timeout?: number;
      onlyFollowing?: boolean;
    } = { includeLikes: true }
  ): Promise<TimelineResult> {
    return this.postService.getTimeline(limit, options);
  }

  /**
   * Aggiungi un commento a un post - delegato a PostService
   */
  public async addComment(
    postId: string,
    content: string
  ): Promise<Comment | null> {
    return this.postService.addComment(postId, content);
  }

  /**
   * Ottieni i commenti di un post - delegato a PostService
   */
  public async getComments(postId: string): Promise<Comment[]> {
    return this.postService.getComments(postId);
  }

  /**
   * Metti like a un post - delegato a PostService
   */
  public async likePost(postId: string): Promise<boolean> {
    return this.postService.likePost(postId);
  }

  /**
   * Rimuovi like da un post - delegato a PostService
   */
  public async unlikePost(postId: string): Promise<boolean> {
    return this.postService.unlikePost(postId);
  }

  /**
   * Ottieni gli utenti che hanno messo like a un post - delegato a PostService
   */
  public async getLikes(postId: string): Promise<string[]> {
    return this.postService.getLikes(postId);
  }

  /**
   * Ottieni il conteggio dei like di un post - delegato a PostService
   */
  public async getLikeCount(postId: string): Promise<number> {
    const likes = await this.postService.getLikes(postId);
    return likes.length;
  }

  /**
   * Cerca post per topic/hashtag - delegato a PostService
   */
  public async searchByTopic(topic: string): Promise<Post[]> {
    return this.postService.searchByTopic(topic);
  }

  /**
   * Elimina un post - delegato a PostService
   */
  public async deletePost(postId: string): Promise<boolean> {
    return this.postService.deletePost(postId);
  }

  /**
   * Ottieni la timeline come Observable - delegato a PostService
   */
  public getTimelineObservable(
    limit = 10,
    options: { includeLikes: boolean } = { includeLikes: true }
  ): Observable<Message[]> {
    return this.postService.getTimelineObservable(limit, options);
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
        .user()
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
        .user()
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

  /**
   * Ottieni i post creati dall'utente corrente - delegato a PostService
   */
  public async getUserPosts(
    limit = 10,
    options: { includeLikes: boolean; timeout?: number } = {
      includeLikes: true,
    }
  ): Promise<TimelineResult> {
    if (!this.user.is || !this.user.is.pub) {
      this.error("Utente non autenticato");
      return { messages: [], error: "Utente non autenticato" };
    }

    // Recupera i post dell'utente
    const userPub = this.user.is.pub;
    this.debug(`Recupero post dell'utente ${userPub}`);

    // Get all posts
    const allPosts = await this.getTimeline(100, options);

    // Filter only user's posts
    const userPosts = {
      messages: allPosts.messages
        .filter((post) => post.creator === userPub)
        .slice(0, limit),
      error: allPosts.error,
    };

    return userPosts;
  }

  /**
   * Ottieni i post creati dall'utente corrente come Observable
   * @param limit Numero massimo di post da recuperare
   * @param options Opzioni aggiuntive
   * @returns Observable di post in tempo reale
   */
  public getUserPostsObservable(
    limit = 10,
    options: { includeLikes: boolean } = { includeLikes: true }
  ): Observable<Message[]> {
    if (!this.gun || !this.user || !this.user.is || !this.user.is.pub) {
      this.error("Gun/SEA non disponibile o utente non autenticato");
      return of([]);
    }

    const userPub = this.user.is.pub;
    return this.gunRx.observe(`users/${userPub}/posts`).pipe(
      switchMap((postsRef) => {
        if (!postsRef) return of([]);

        // Estrai gli ID dei post
        const postIds = Object.keys(postsRef).filter((key) => key !== "_");

        if (postIds.length === 0) return of([]);

        // Crea un observable per ogni post
        const postObservables = postIds.map((id) =>
          this.gunRx.observe(`posts/${id}`).pipe(
            map((post) => {
              if (!post) return null;

              // Aggiungiamo una type assertion per evitare errori di tipo
              const typedPost = post as {
                id?: string;
                author?: string;
                creator?: string;
                timestamp?: number;
                createdAt?: number;
                content?: string;
                payload?: {
                  content?: string;
                  imageData?: string;
                };
              };

              // Estrai i dati in modo sicuro
              const id = typedPost.id || "";
              const creator = typedPost.author || typedPost.creator || userPub;
              const createdAt =
                typedPost.timestamp || typedPost.createdAt || Date.now();

              // Gestisci il contenuto in modo sicuro
              let content = typedPost.content || "";
              let imageData = null;

              // Recupera contenuto dal payload se necessario
              if ((!content || !imageData) && typedPost.payload) {
                content = typedPost.payload.content || content;
                imageData = typedPost.payload.imageData || null;
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
            })
          )
        );

        // Combina tutti i post
        return combineLatest(postObservables).pipe(
          map((posts) => posts.filter((p) => p !== null) as Message[]),
          map((posts) =>
            posts.sort(
              (a, b) => (b.createdAt as number) - (a.createdAt as number)
            )
          ),
          map((posts) => posts.slice(0, limit))
        );
      }),
      tap((messages) =>
        this.debug(`UserPosts observable: ricevuti ${messages.length} post`)
      )
    );
  }
}
