"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const logger_1 = require("../../../utils/logger");
const eventEmitter_1 = require("../../../utils/eventEmitter");
const social_1 = require("../../../types/social");
const rxjs_integration_1 = require("../../../gun/rxjs-integration");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const crypto = __importStar(require("crypto"));
const schemas_1 = require("../schemas");
const ajv_1 = __importDefault(require("ajv"));
/**
 * Service dedicato ai post: creazione, recupero, like, commenti, ricerca
 */
class PostService extends eventEmitter_1.EventEmitter {
    gun;
    user;
    gunRx;
    ajv = new ajv_1.default();
    validatePost;
    validateComment;
    postCache = new Map();
    cacheDuration = 2 * 60 * 1000; // 2 minuti
    constructor(gunInstance) {
        super();
        this.gun = gunInstance;
        this.user = this.gun.user();
        this.gunRx = new rxjs_integration_1.GunRxJS(gunInstance);
        this.validatePost = this.ajv.compile(schemas_1.PostSchema);
        this.validateComment = this.ajv.compile(schemas_1.CommentSchema);
    }
    /**
     * Metodo per loggare messaggi di debug
     */
    debug(message, ...args) {
        (0, logger_1.logDebug)(`[PostService] ${message}`, ...args);
    }
    /**
     * Metodo per loggare errori
     */
    error(message, ...args) {
        (0, logger_1.logError)(`[PostService] ${message}`, ...args);
    }
    /**
     * Genera un ID univoco (UUID v4)
     */
    generateUUID() {
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
    extractHashtags(text) {
        if (!text)
            return [];
        const hashtagRegex = /#(\w+)/g;
        const matches = text.match(hashtagRegex);
        if (!matches)
            return [];
        return matches.map((tag) => tag.substring(1).toLowerCase());
    }
    /**
     * Indicizza un post per hashtag
     */
    async indexPostByHashtags(postId, hashtags) {
        if (!hashtags || hashtags.length === 0)
            return;
        this.debug(`Indicizzazione post ${postId} per ${hashtags.length} hashtag`);
        for (const tag of hashtags) {
            await new Promise((resolve) => {
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
    clearCache() {
        this.postCache.clear();
        this.debug("Cache dei post pulita");
    }
    /**
     * Normalizza l'oggetto autore per garantire compatibilità con il database
     * @param postData Dati del post da normalizzare
     */
    normalizeAuthor(postData) {
        if (!postData)
            return postData;
        // Clona l'oggetto per non modificare l'originale
        const normalized = { ...postData };
        // Se author non è una stringa, lo imposta come stringa
        if (normalized.author && typeof normalized.author !== "string") {
            this.debug(`Normalizzazione author per post ${normalized.id}`);
            // Salva il pub originale se presente nell'oggetto complesso
            if (normalized.author.pub) {
                normalized.author = normalized.author.pub;
            }
            else if (this.user && this.user.is && this.user.is.pub) {
                // Usa il pub dell'utente corrente come fallback
                normalized.author = this.user.is.pub;
            }
            else {
                // Ultimo caso, converti a stringa
                normalized.author = String(normalized.author);
            }
        }
        return normalized;
    }
    /**
     * Crea un nuovo post con validazione dello schema
     */
    async createPost(content, imageData) {
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
            const hashtagsObj = {};
            hashtags.forEach((tag) => {
                hashtagsObj[tag] = true;
            });
            // Creiamo un oggetto post che rispetta l'interfaccia Post
            const post = {
                id: postId,
                author: userPub,
                content: trimmedContent,
                timestamp,
                imageData: imageData || undefined,
            };
            // Crea una struttura semplificata per Gun DB che evita i problemi di validazione
            // Usa SOLO stringhe per author, mai oggetti complessi
            const simplePostData = {
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
            }
            else {
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
                this.error(`Validazione post fallita: ${JSON.stringify(this.validatePost.errors)}`);
                return null;
            }
            // Salva il post nel database con la struttura semplificata
            await new Promise((resolve) => {
                this.gun
                    .get("posts")
                    .get(postId)
                    .put(simplePostData, (ack) => {
                    if (ack && ack.err) {
                        this.error(`Errore salvataggio post: ${ack.err}`);
                    }
                    else {
                        this.debug(`Post ${postId} salvato correttamente`);
                    }
                    resolve();
                });
            });
            // Aggiunge anche ai post dell'utente
            await new Promise((resolve) => {
                this.user
                    .get("posts")
                    .get(postId)
                    .put({
                    id: postId,
                    timestamp,
                }, (ack) => {
                    if (ack && ack.err) {
                        this.error(`Errore riferimento post utente: ${ack.err}`);
                    }
                    else {
                        this.debug(`Riferimento post utente ${postId} salvato`);
                    }
                    resolve();
                });
            });
            this.emit("post:created", post);
            return post;
        }
        catch (error) {
            this.error(`Errore creazione post: ${error.message}`);
            return null;
        }
    }
    /**
     * Ottieni un post specifico
     */
    async getPost(postId) {
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
                    .once((post) => {
                    if (!post) {
                        this.debug(`Post ${postId} non trovato`);
                        resolve(null);
                        return;
                    }
                    // Normalizza il post per prevenire errori di validazione
                    post = this.normalizePost(post, postId);
                    // Convertiamo i dati di Gun nel formato Post
                    const typedPost = {
                        id: post.id || postId,
                        author: post.author || "sconosciuto",
                        content: post.content || "",
                        timestamp: post.timestamp || Date.now(),
                        imageData: post.imageData,
                        hashtags: post.hashtags,
                        hashtagsList: post._hashtagsList ||
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
        }
        catch (err) {
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
    normalizePost(post, id) {
        if (!post)
            return post;
        // Clona l'oggetto per non modificare l'originale
        const normalized = { ...post };
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
        if (normalized.imageData !== null &&
            normalized.imageData !== undefined &&
            typeof normalized.imageData !== "string") {
            normalized.imageData = null;
        }
        return normalized;
    }
    /**
     * Recupera la timeline (post propri e di chi segui)
     */
    async getTimeline(limit = 10, options = { includeLikes: true }) {
        if (!this.gun || !this.user) {
            this.error("Gun/SEA non disponibile");
            return { messages: [], error: "Database non disponibile" };
        }
        this.debug("getTimeline - Recupero timeline con limite:", limit);
        return new Promise(async (resolve) => {
            const messages = [];
            const seen = new Set();
            let followingList = [];
            if (options.onlyFollowing && this.user.is && this.user.is.pub) {
                try {
                    const userPub = this.user.is.pub;
                    // recupero following da Social.getProfile o qui direttamente
                    await new Promise((resolveFollowing) => {
                        this.gun
                            .get("users")
                            .get(userPub)
                            .get("following")
                            .map()
                            .once((val, key) => {
                            if (key !== "_" && val === true) {
                                followingList.push(key);
                            }
                        });
                        setTimeout(resolveFollowing, 500);
                    });
                }
                catch (err) {
                    this.error("Errore recupero lista following:", err);
                }
            }
            const timeoutId = setTimeout(() => {
                this.debug(`getTimeline - Timeout dopo ${options.timeout || 5000}ms - Restituisco ${messages.length} posts`);
                messages.sort((a, b) => b.createdAt - a.createdAt);
                resolve({ messages });
            }, options.timeout || 5000);
            this.gun
                .get("posts")
                .map()
                .once(async (post, id) => {
                if (!post || seen.has(id))
                    return;
                seen.add(id);
                // Normalizza il post per evitare errori di validazione
                post = this.normalizePost(post, id);
                const postAuthor = post.author || post.creator;
                if (options.onlyFollowing &&
                    postAuthor &&
                    this.user.is &&
                    this.user.is.pub &&
                    postAuthor !== this.user.is.pub &&
                    !followingList.includes(postAuthor)) {
                    return;
                }
                this.debug(`getTimeline - Post trovato: ${id}`);
                let content = post.content || "";
                let imageData = post.imageData || null;
                if ((!content || !imageData) && post.payload) {
                    if (post.payload.content && !content) {
                        content = post.payload.content;
                        this.debug(`getTimeline - Contenuto recuperato da payload diretto: ${content.substring(0, 20)}...`);
                    }
                    if (post.payload.imageData && !imageData) {
                        imageData = post.payload.imageData;
                        this.debug(`getTimeline - Immagine recuperata da payload diretto per post: ${id}`);
                    }
                }
                const postMsg = {
                    id,
                    type: social_1.MessageType.POST,
                    subtype: social_1.MessageSubtype.EMPTY,
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
                        postMsg.likes = likes;
                    }
                    catch (err) {
                        this.error(`Errore recupero likes per post ${id}:`, err);
                    }
                }
                messages.push(postMsg);
                if (messages.length >= limit) {
                    clearTimeout(timeoutId);
                    messages.sort((a, b) => b.createdAt - a.createdAt);
                    resolve({ messages });
                }
            });
        });
    }
    /**
     * Timeline come Observable
     */
    getTimelineObservable(limit = 10, options = { includeLikes: true }) {
        if (!this.gun || !this.user) {
            this.error("Gun/SEA non disponibile");
            return (0, rxjs_1.of)([]);
        }
        return this.gunRx.match("posts").pipe((0, operators_1.map)((posts) => {
            if (!posts || !posts.length)
                return [];
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
                const msg = {
                    id,
                    type: social_1.MessageType.POST,
                    subtype: social_1.MessageSubtype.EMPTY,
                    creator,
                    createdAt,
                    payload: { content },
                };
                if (imageData)
                    msg.payload.attachment = imageData;
                return msg;
            });
        }), (0, operators_1.tap)((msgs) => this.debug(`Timeline observable: ricevuti ${msgs.length} post`)));
    }
    /**
     * Aggiungi un commento a un post con validazione dello schema
     */
    async addComment(postId, content) {
        if (!this.user.is || !this.user.is.pub)
            throw new Error("Non autenticato");
        if (!postId || !content.trim())
            throw new Error("Dati commento non validi");
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
            // Validazione con schema JSON
            const isValid = this.validateComment(comment);
            if (!isValid) {
                this.error(`Validazione commento fallita: ${JSON.stringify(this.validateComment.errors)}`);
                return null;
            }
            return new Promise((resolve) => {
                this.gun
                    .get("posts")
                    .get(postId)
                    .get("comments")
                    .get(commentId)
                    .put(comment, (ack) => {
                    if (ack.err) {
                        (0, logger_1.logError)(`Errore salvataggio commento: ${ack.err}`);
                        resolve(null);
                    }
                    else {
                        setTimeout(() => {
                            this.gun
                                .get("posts")
                                .get(postId)
                                .get("comments")
                                .get(commentId)
                                .once((saved) => {
                                if (!saved || !saved.content) {
                                    (0, logger_1.logWarn)(`Verifica commento ${commentId}: contenuto mancante, riprovando`);
                                    this.gun
                                        .get("posts")
                                        .get(postId)
                                        .get("comments")
                                        .get(commentId)
                                        .put(comment);
                                }
                                else {
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
        }
        catch (err) {
            (0, logger_1.logError)(`Errore aggiunta commento: ${err}`);
            return null;
        }
    }
    /**
     * Ottieni i commenti di un post
     */
    async getComments(postId) {
        if (!postId)
            throw new Error("ID post non valido");
        try {
            const comments = [];
            await new Promise((resolve) => {
                this.gun
                    .get("posts")
                    .get(postId)
                    .get("comments")
                    .map()
                    .once((c, key) => {
                    if (key !== "_" && c) {
                        const comment = {
                            id: c.id || key,
                            postId,
                            author: c.author || "Anonimo",
                            content: c.content || "",
                            timestamp: c.timestamp || Date.now(),
                        };
                        // Validazione leggera
                        if (comment.id && comment.content && comment.author) {
                            comments.push(comment);
                        }
                        else {
                            this.error(`Commento ${key} non valido`);
                        }
                    }
                });
                setTimeout(resolve, 500);
            });
            comments.sort((a, b) => b.timestamp - a.timestamp);
            return comments;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore recupero commenti: ${err}`);
            return [];
        }
    }
    /**
     * Metti like a un post
     */
    async likePost(postId) {
        if (!this.user.is || !this.user.is.pub)
            throw new Error("Non autenticato");
        try {
            const userPub = this.user.is.pub;
            await new Promise((resolve, reject) => {
                this.gun
                    .get("posts")
                    .get(postId)
                    .get("likes")
                    .get(userPub)
                    .put(true, (ack) => (ack.err ? reject(ack.err) : resolve()));
            });
            // Invalida la cache del post
            this.postCache.delete(postId);
            return true;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore like post: ${err}`);
            return false;
        }
    }
    /**
     * Rimuovi like da un post
     */
    async unlikePost(postId) {
        if (!this.user.is || !this.user.is.pub)
            throw new Error("Non autenticato");
        try {
            const userPub = this.user.is.pub;
            await new Promise((resolve) => {
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
        }
        catch (err) {
            (0, logger_1.logError)(`Errore unlike post: ${err}`);
            return false;
        }
    }
    /**
     * Ottieni gli utenti che hanno messo like a un post
     */
    async getLikes(postId) {
        if (!postId)
            throw new Error("ID post non valido");
        try {
            const likes = [];
            await new Promise((resolve) => {
                this.gun
                    .get("posts")
                    .get(postId)
                    .get("likes")
                    .map()
                    .once((val, key) => {
                    if (key !== "_" && val === true)
                        likes.push(key);
                });
                setTimeout(resolve, 500);
            });
            return likes;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore recupero likes: ${err}`);
            return [];
        }
    }
    /**
     * Cerca post per hashtag
     */
    async searchByHashtag(hashtag) {
        if (!hashtag)
            throw new Error("Hashtag non valido");
        const normalized = hashtag.startsWith("#")
            ? hashtag.slice(1).toLowerCase()
            : hashtag.toLowerCase();
        this.debug(`Ricerca post con hashtag #${normalized}`);
        try {
            const refs = [];
            await new Promise((resolve) => {
                this.gun
                    .get("hashtags")
                    .get(normalized)
                    .map()
                    .once((val, key) => {
                    if (key !== "_" && val === true)
                        refs.push(key);
                });
                setTimeout(resolve, 1000);
            });
            if (!refs.length)
                return [];
            const posts = [];
            for (const id of refs) {
                // Prima controlla la cache
                const cached = this.postCache.get(id);
                if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
                    posts.push(cached.data);
                    continue;
                }
                const data = await new Promise((resolve) => {
                    this.gun.get("posts").get(id).once(resolve);
                    setTimeout(() => resolve(null), 500);
                });
                if (data && data.content) {
                    const p = { ...data };
                    if (!p.hashtagsList) {
                        if (p._hashtagsList)
                            p.hashtagsList = p._hashtagsList;
                        else if (p.hashtags && typeof p.hashtags === "object")
                            p.hashtagsList = Object.keys(p.hashtags).filter((k) => p.hashtags[k]);
                    }
                    posts.push(p);
                    // Aggiungi alla cache
                    this.postCache.set(id, { data: p, timestamp: Date.now() });
                }
            }
            return posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        catch (err) {
            (0, logger_1.logError)(`Errore ricerca hashtag: ${err}`);
            return [];
        }
    }
    /**
     * Elimina un post
     */
    async deletePost(postId) {
        if (!this.user.is || !this.user.is.pub)
            throw new Error("Non autenticato");
        try {
            const post = await new Promise((res) => this.gun.get("posts").get(postId).once(res));
            if (!post) {
                this.error(`Post ${postId} non trovato`);
                return false;
            }
            const userPub = this.user.is.pub;
            const author = post.author || post.creator;
            if (author !== userPub) {
                (0, logger_1.logWarn)(`Autorizzazione negata per post ${postId}`);
                return false;
            }
            let tags = [];
            if (post._hashtagsList)
                tags = post._hashtagsList;
            else if (post.hashtags && typeof post.hashtags === "object")
                tags = Object.keys(post.hashtags).filter((k) => post.hashtags[k]);
            for (const t of tags) {
                await new Promise((r) => this.gun.get("hashtags").get(t).get(postId).put(null, r));
            }
            await new Promise((r) => this.gun.get("users").get(userPub).get("posts").get(postId).put(null, r));
            await new Promise((r) => this.gun.get("posts").get(postId).put(null, r));
            // Rimuovi dalla cache
            this.postCache.delete(postId);
            this.emit("delete:post", { id: postId, author: userPub });
            this.debug(`Post ${postId} eliminato`);
            return true;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore eliminazione post: ${err}`);
            return false;
        }
    }
    /**
     * Helper privato: recupera likes come oggetto
     */
    async getLikesObject(postId) {
        const likes = {};
        return new Promise((resolve) => {
            this.gun
                .get("posts")
                .get(postId)
                .get("likes")
                .map()
                .once((val, key) => {
                if (key !== "_" && val === true)
                    likes[key] = true;
            });
            setTimeout(() => resolve(likes), 500);
        });
    }
}
exports.PostService = PostService;
