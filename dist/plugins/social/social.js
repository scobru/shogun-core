"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Social = void 0;
const logger_1 = require("../../utils/logger");
const eventEmitter_1 = require("../../utils/eventEmitter");
const social_1 = require("../../types/social");
const rxjs_integration_1 = require("../../gun/rxjs-integration");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const friends_1 = require("./friends/friends");
const messages_1 = require("./messagges/messages");
const certs_1 = require("./certificates/certs");
const posts_1 = require("./posts/posts");
/**
 * Plugin Social che utilizza Gun DB
 */
class Social extends eventEmitter_1.EventEmitter {
    gun;
    user;
    profileCache = new Map();
    cacheDuration = 5 * 60 * 1000; // 5 minuti
    gunRx;
    friendService;
    messageService;
    certificateService;
    postService;
    constructor(gunInstance) {
        super();
        this.gun = gunInstance;
        this.user = this.gun.user();
        this.gunRx = new rxjs_integration_1.GunRxJS(gunInstance);
        this.friendService = new friends_1.FriendService(gunInstance);
        this.messageService = new messages_1.MessageService(gunInstance);
        this.certificateService = new certs_1.CertificateService(gunInstance);
        this.postService = new posts_1.PostService(gunInstance);
        // Propagare gli eventi di PostService
        this.postService.on("new:post", (post) => this.emit("new:post", post));
        this.postService.on("delete:post", (data) => this.emit("delete:post", data));
    }
    /**
     * Metodo per loggare messaggi di debug
     */
    debug(message, ...args) {
        (0, logger_1.logDebug)(`[Social] ${message}`, ...args);
    }
    /**
     * Metodo per loggare errori
     */
    error(message, ...args) {
        (0, logger_1.logError)(`[Social] ${message}`, ...args);
    }
    /**
     * Pulisce le cache e i listener
     */
    cleanup() {
        this.profileCache.clear();
        this.removeAllListeners();
    }
    /**
     * Segui un altro utente
     * @param targetPub Chiave pubblica dell'utente da seguire
     * @returns true se l'operazione è riuscita
     */
    async follow(targetPub) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Non autenticato");
        }
        if (targetPub === this.user.is.pub) {
            (0, logger_1.logWarn)("Non puoi seguire te stesso");
            return false;
        }
        try {
            const userPub = this.user.is.pub;
            (0, logger_1.logDebug)(`Follow: ${userPub} → ${targetPub}`);
            // Aggiungi alla lista "following" dell'utente corrente
            await new Promise((resolve, reject) => {
                this.gun
                    .get("users")
                    .get(userPub)
                    .get("following")
                    .get(targetPub)
                    .put(true, (ack) => {
                    if (ack.err)
                        reject(new Error(ack.err));
                    else
                        resolve();
                });
            });
            // Aggiungi alla lista "followers" dell'utente target
            await new Promise((resolve, reject) => {
                this.gun
                    .get("users")
                    .get(targetPub)
                    .get("followers")
                    .get(userPub)
                    .put(true, (ack) => {
                    if (ack.err)
                        reject(new Error(ack.err));
                    else
                        resolve();
                });
            });
            // Invalida cache
            this.profileCache.delete(userPub);
            this.profileCache.delete(targetPub);
            // Notifica
            this.emit("follow", targetPub);
            return true;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore follow: ${err}`);
            return false;
        }
    }
    /**
     * Smetti di seguire un utente
     * @param targetPub Chiave pubblica dell'utente da smettere di seguire
     * @returns true se l'operazione è riuscita
     */
    async unfollow(targetPub) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Non autenticato");
        }
        if (targetPub === this.user.is.pub) {
            (0, logger_1.logWarn)("Non puoi smettere di seguire te stesso");
            return false;
        }
        try {
            const userPub = this.user.is.pub;
            (0, logger_1.logDebug)(`Unfollow: ${userPub} ⊘ ${targetPub}`);
            // Rimuovi dalla lista "following" dell'utente corrente
            await new Promise((resolve) => {
                this.gun
                    .get("users")
                    .get(userPub)
                    .get("following")
                    .get(targetPub)
                    .put(null, () => resolve());
            });
            // Rimuovi dalla lista "followers" dell'utente target
            await new Promise((resolve) => {
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
        }
        catch (err) {
            (0, logger_1.logError)(`Errore unfollow: ${err}`);
            return false;
        }
    }
    /**
     * Ottieni il profilo di un utente
     * @param pub Chiave pubblica dell'utente
     * @returns Profilo dell'utente
     */
    async getProfile(pub) {
        // Controlla se il profilo è nella cache
        const cached = this.profileCache.get(pub);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }
        // Profilo vuoto con dati minimi
        const profile = {
            pub,
            followers: [],
            following: [],
            customFields: {},
        };
        try {
            // Ottieni dati profilo
            await new Promise((resolve) => {
                this.gun
                    .get("users")
                    .get(pub)
                    .once((userData) => {
                    if (userData) {
                        if (userData.alias)
                            profile.alias = userData.alias;
                        if (userData.bio)
                            profile.bio = userData.bio;
                        if (userData.profileImage)
                            profile.profileImage = userData.profileImage;
                    }
                    resolve();
                });
            });
            // Ottieni followers
            await new Promise((resolve) => {
                this.gun
                    .get("users")
                    .get(pub)
                    .get("followers")
                    .map()
                    .once((val, key) => {
                    if (key !== "_" && val === true) {
                        profile.followers.push(key);
                    }
                });
                setTimeout(resolve, 500);
            });
            // Ottieni following
            await new Promise((resolve) => {
                this.gun
                    .get("users")
                    .get(pub)
                    .get("following")
                    .map()
                    .once((val, key) => {
                    if (key !== "_" && val === true) {
                        profile.following.push(key);
                    }
                });
                setTimeout(resolve, 500);
            });
            // Salva in cache
            this.profileCache.set(pub, { data: profile, timestamp: Date.now() });
            return profile;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore caricamento profilo: ${err}`);
            return profile;
        }
    }
    /**
     * Aggiorna un campo del profilo
     * @param field Nome del campo da aggiornare
     * @param value Nuovo valore
     * @returns true se l'operazione è riuscita
     */
    async updateProfile(field, value) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Non autenticato");
        }
        try {
            await new Promise((resolve, reject) => {
                this.gun
                    .get("users")
                    .get(this.user.is.pub)
                    .get(field)
                    .put(value, (ack) => {
                    if (ack.err)
                        reject(new Error(ack.err));
                    else
                        resolve();
                });
            });
            // Invalida cache
            this.profileCache.delete(this.user.is.pub);
            return true;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore aggiornamento profilo: ${err}`);
            return false;
        }
    }
    /**
     * Crea un nuovo post - delegato a PostService
     */
    async post(content, imageData) {
        return this.postService.createPost(content, imageData);
    }
    /**
     * Ottieni la timeline - delegato a PostService
     */
    async getTimeline(limit = 10, options = { includeLikes: true }) {
        return this.postService.getTimeline(limit, options);
    }
    /**
     * Aggiungi un commento a un post - delegato a PostService
     */
    async addComment(postId, content) {
        return this.postService.addComment(postId, content);
    }
    /**
     * Ottieni i commenti di un post - delegato a PostService
     */
    async getComments(postId) {
        return this.postService.getComments(postId);
    }
    /**
     * Metti like a un post - delegato a PostService
     */
    async likePost(postId) {
        return this.postService.likePost(postId);
    }
    /**
     * Rimuovi like da un post - delegato a PostService
     */
    async unlikePost(postId) {
        return this.postService.unlikePost(postId);
    }
    /**
     * Ottieni gli utenti che hanno messo like a un post - delegato a PostService
     */
    async getLikes(postId) {
        return this.postService.getLikes(postId);
    }
    /**
     * Ottieni il conteggio dei like di un post - delegato a PostService
     */
    async getLikeCount(postId) {
        const likes = await this.postService.getLikes(postId);
        return likes.length;
    }
    /**
     * Cerca post per hashtag - delegato a PostService
     */
    async searchByHashtag(hashtag) {
        return this.postService.searchByHashtag(hashtag);
    }
    /**
     * Elimina un post - delegato a PostService
     */
    async deletePost(postId) {
        return this.postService.deletePost(postId);
    }
    /**
     * Ottieni la timeline come Observable - delegato a PostService
     */
    getTimelineObservable(limit = 10, options = { includeLikes: true }) {
        return this.postService.getTimelineObservable(limit, options);
    }
    /**
     * Ottieni un post specifico con dettagli dell'autore in tempo reale
     * @param postId ID del post
     * @returns Observable del post arricchito con dettagli utente
     */
    getEnrichedPostObservable(postId) {
        return this.gunRx.observe(`posts/${postId}`).pipe((0, operators_1.switchMap)((post) => {
            if (!post)
                return (0, rxjs_1.of)(null);
            // Utilizza type assertion generica
            const typedPost = post;
            const author = typedPost.author || typedPost.creator;
            // Verifica se abbiamo un autore valido
            if (!author) {
                return (0, rxjs_1.of)({
                    ...typedPost,
                    authorProfile: { pub: "sconosciuto" },
                });
            }
            // Ottieni il profilo dell'autore
            const authorProfile$ = this.gunRx.observe(`users/${author}`);
            // Combina post e profilo
            return (0, rxjs_1.combineLatest)([(0, rxjs_1.of)(typedPost), authorProfile$]).pipe((0, operators_1.map)(([postData, profileData]) => {
                // Crea una versione sicura del post per evitare valori undefined
                const safePost = { ...postData };
                // Assicura che il payload esista
                if (!safePost.payload) {
                    safePost.payload = { content: safePost.content || "" };
                }
                else if (!safePost.payload.content && safePost.content) {
                    // Assicura che ci sia un contenuto nel payload
                    safePost.payload.content = safePost.content;
                }
                // Verifica che le proprietà obbligatorie esistano
                if (!safePost.id)
                    safePost.id = postId;
                if (!safePost.timestamp)
                    safePost.timestamp = Date.now();
                return {
                    ...safePost,
                    authorProfile: profileData || {
                        pub: postData.author || "sconosciuto",
                    },
                };
            }));
        }), (0, operators_1.tap)((post) => {
            if (post) {
                this.debug(`Post arricchito ${postId} caricato con successo`);
            }
            else {
                this.debug(`Post ${postId} non trovato`);
            }
        }), (0, operators_1.catchError)((err) => {
            this.error(`Errore caricamento post arricchito: ${err}`);
            return (0, rxjs_1.of)(null);
        }));
    }
    /**
     * Ottieni tutti gli utenti registrati sulla rete
     * @returns Array di UserProfile base
     */
    async getAllUsers() {
        this.debug("Recupero di tutti gli utenti dalla rete");
        return new Promise((resolve) => {
            const users = [];
            const seen = new Set();
            // Imposta un timeout per evitare attese infinite
            const timeoutId = setTimeout(() => {
                this.debug(`Timeout raggiunto, restituisco ${users.length} utenti trovati`);
                resolve(users);
            }, 5000);
            // Cerca tutti gli utenti attraverso la collezione 'users'
            this.gun
                .get("users")
                .map()
                .once(async (userData, userPub) => {
                try {
                    // Ignora la chiave Gun interna e gli utenti già processati
                    if (userPub === "_" || seen.has(userPub))
                        return;
                    seen.add(userPub);
                    this.debug(`Utente trovato: ${userPub}`);
                    // Crea un profilo base
                    const profileData = {
                        pub: userPub,
                        followers: [],
                        following: [],
                        customFields: {},
                    };
                    // Aggiungi informazioni se disponibili
                    if (userData) {
                        if (userData.alias)
                            profileData.alias = userData.alias;
                        if (userData.bio)
                            profileData.bio = userData.bio;
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
                }
                catch (err) {
                    this.error(`Errore elaborazione utente ${userPub}:`, err);
                }
            });
        });
    }
    /**
     * Ottieni tutti gli utenti come Observable
     * @returns Observable di UserProfile
     */
    getAllUsersObservable() {
        return new rxjs_1.Observable((subscriber) => {
            this.debug("Avvio ricerca utenti observable");
            const users = [];
            const seen = new Set();
            // Timeout per concludere la ricerca
            const timeoutId = setTimeout(() => {
                this.debug(`Timeout ricerca utenti observable: trovati ${users.length} utenti`);
                subscriber.next([...users]); // Copia l'array per sicurezza
            }, 5000);
            // Cerca tutti gli utenti
            this.gun
                .get("users")
                .map()
                .on((userData, userPub) => {
                try {
                    // Ignora la chiave Gun interna e gli utenti già processati
                    if (userPub === "_" || seen.has(userPub))
                        return;
                    seen.add(userPub);
                    // Crea un profilo base
                    const profileData = {
                        pub: userPub,
                        followers: [],
                        following: [],
                        customFields: {},
                    };
                    // Aggiungi informazioni se disponibili
                    if (userData) {
                        if (userData.alias)
                            profileData.alias = userData.alias;
                        if (userData.bio)
                            profileData.bio = userData.bio;
                        if (userData.profileImage)
                            profileData.profileImage = userData.profileImage;
                    }
                    // Aggiungi alla lista
                    users.push(profileData);
                    // Notifica i sottoscrittori con l'array aggiornato
                    subscriber.next([...users]);
                }
                catch (err) {
                    this.error(`Errore elaborazione utente observable ${userPub}:`, err);
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
    async getUserPosts(limit = 10, options = {
        includeLikes: true,
    }) {
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
    getUserPostsObservable(limit = 10, options = { includeLikes: true }) {
        if (!this.gun || !this.user || !this.user.is || !this.user.is.pub) {
            this.error("Gun/SEA non disponibile o utente non autenticato");
            return (0, rxjs_1.of)([]);
        }
        const userPub = this.user.is.pub;
        return this.gunRx.observe(`users/${userPub}/posts`).pipe((0, operators_1.switchMap)((postsRef) => {
            if (!postsRef)
                return (0, rxjs_1.of)([]);
            // Estrai gli ID dei post
            const postIds = Object.keys(postsRef).filter((key) => key !== "_");
            if (postIds.length === 0)
                return (0, rxjs_1.of)([]);
            // Crea un observable per ogni post
            const postObservables = postIds.map((id) => this.gunRx.observe(`posts/${id}`).pipe((0, operators_1.map)((post) => {
                if (!post)
                    return null;
                // Aggiungiamo una type assertion per evitare errori di tipo
                const typedPost = post;
                // Estrai i dati in modo sicuro
                const id = typedPost.id || "";
                const creator = typedPost.author || typedPost.creator || userPub;
                const createdAt = typedPost.timestamp || typedPost.createdAt || Date.now();
                // Gestisci il contenuto in modo sicuro
                let content = typedPost.content || "";
                let imageData = null;
                // Recupera contenuto dal payload se necessario
                if ((!content || !imageData) && typedPost.payload) {
                    content = typedPost.payload.content || content;
                    imageData = typedPost.payload.imageData || null;
                }
                // Crea messaggio di tipo PostMessage
                const postMsg = {
                    id,
                    type: social_1.MessageType.POST,
                    subtype: social_1.MessageSubtype.EMPTY,
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
            })));
            // Combina tutti i post
            return (0, rxjs_1.combineLatest)(postObservables).pipe((0, operators_1.map)((posts) => posts.filter((p) => p !== null)), (0, operators_1.map)((posts) => posts.sort((a, b) => b.createdAt - a.createdAt)), (0, operators_1.map)((posts) => posts.slice(0, limit)));
        }), (0, operators_1.tap)((messages) => this.debug(`UserPosts observable: ricevuti ${messages.length} post`)));
    }
}
exports.Social = Social;
