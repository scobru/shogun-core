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
const types_1 = require("../types");
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
        this.user = this.gun.user().recall({ sessionStorage: true });
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
        // Gestione allegati: spostare imageData in attachment se necessario
        if (normalized.imageData && !normalized.attachment) {
            normalized.attachment = normalized.imageData;
            delete normalized.imageData;
        }
        // Assicura che altri campi siano del tipo corretto
        if (normalized.attachment !== null &&
            normalized.attachment !== undefined &&
            typeof normalized.attachment !== "string") {
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
        }
        else {
            // Crea un payload se non esiste
            normalized.payload = {
                content: normalized.content,
                attachment: normalized.attachment || null,
            };
        }
        // Converti i vecchi campi hashtag nel nuovo formato topic
        if ((normalized.hashtags ||
            normalized.hashtagsList ||
            normalized._hashtagsList) &&
            !normalized.topic) {
            let hashtags = [];
            if (normalized.hashtagsList) {
                hashtags = normalized.hashtagsList;
            }
            else if (normalized._hashtagsList) {
                hashtags = normalized._hashtagsList;
            }
            else if (normalized.hashtags &&
                typeof normalized.hashtags === "object") {
                hashtags = Object.keys(normalized.hashtags).filter((k) => normalized.hashtags[k]);
            }
            if (hashtags.length > 0) {
                normalized.topic = hashtags.map((tag) => `#${tag}`).join(" ");
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
     * Crea un nuovo post con validazione dello schema
     */
    async createPost(content, options) {
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
            const post = {
                id: postId,
                author: userPub,
                content: trimmedContent,
                timestamp,
            };
            // Aggiungi campi opzionali se forniti
            if (options) {
                if (options.title)
                    post.title = options.title;
                if (options.topic)
                    post.topic = options.topic;
                if (options.attachment)
                    post.attachment = options.attachment;
                if (options.reference)
                    post.reference = options.reference;
            }
            // Crea una struttura semplificata per Gun DB che evita i problemi di validazione
            const simplePostData = {
                id: postId,
                author: userPub, // Usa sempre e solo la stringa
                content: trimmedContent,
                timestamp: timestamp,
            };
            // Aggiungi campi opzionali alla struttura semplificata
            if (options) {
                if (options.title)
                    simplePostData.title = options.title;
                if (options.topic)
                    simplePostData.topic = options.topic;
                if (options.attachment)
                    simplePostData.attachment = options.attachment;
                if (options.reference)
                    simplePostData.reference = options.reference;
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
                this.error(`Validazione post fallita: ${JSON.stringify(this.validatePost.errors)}`);
                return null;
            }
            // Salva il post nel database con la struttura semplificata
            await new Promise((resolve) => {
                this.gun.user().get("posts")
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
            // Indicizza per topic/hashtag se presente
            if (options?.topic) {
                const hashtags = this.extractHashtags(options.topic);
                if (hashtags.length > 0) {
                    for (const tag of hashtags) {
                        await new Promise((resolve) => {
                            this.gun.user().get("topics")
                                .get(tag)
                                .get(postId)
                                .put(true, () => resolve());
                        });
                    }
                }
            }
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
                this.gun.user().get("posts")
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
        }
        catch (err) {
            this.error(`Errore recupero post ${postId}: ${err}`);
            return null;
        }
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
                            .user()
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
            this.gun.user()
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
                let attachment = post.attachment || post.imageData || null;
                if ((!content || !attachment) && post.payload) {
                    if (post.payload.content && !content) {
                        content = post.payload.content;
                        this.debug(`getTimeline - Contenuto recuperato da payload diretto: ${content.substring(0, 20)}...`);
                    }
                    if ((post.payload.attachment || post.payload.imageData) &&
                        !attachment) {
                        attachment = post.payload.attachment || post.payload.imageData;
                        this.debug(`getTimeline - Allegato recuperato da payload diretto per post: ${id}`);
                    }
                }
                const postMsg = {
                    id,
                    type: types_1.MessageType.POST,
                    subtype: types_1.MessageSubtype.EMPTY,
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
                let attachment = post.attachment || post.imageData || null;
                if ((!content || !attachment) && post.payload) {
                    content = post.payload.content || content;
                    attachment =
                        post.payload.attachment || post.payload.imageData || null;
                }
                const msg = {
                    id,
                    type: types_1.MessageType.POST,
                    subtype: types_1.MessageSubtype.EMPTY,
                    creator,
                    createdAt,
                    payload: { content },
                };
                if (attachment)
                    msg.payload.attachment = attachment;
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
                this.gun.user().get("posts")
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
                this.gun.user().get("posts")
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
                this.gun.user().get("posts")
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
                this.gun.user().get("posts")
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
                this.gun.user().get("posts")
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
     * Cerca post per topic/hashtag
     */
    async searchByTopic(topic) {
        if (!topic)
            throw new Error("Topic non valido");
        // Se è un hashtag, estraiamo il termine di ricerca
        let searchTerm = topic;
        if (topic.startsWith("#")) {
            searchTerm = topic.slice(1).toLowerCase();
        }
        this.debug(`Ricerca post con topic/hashtag: ${searchTerm}`);
        try {
            // Prima cerchiamo nei topics indicizzati
            const refs = [];
            await new Promise((resolve) => {
                this.gun.user().get("topics")
                    .get(searchTerm)
                    .map()
                    .once((val, key) => {
                    if (key !== "_" && val === true)
                        refs.push(key);
                });
                setTimeout(resolve, 1000);
            });
            // Per compatibilità, cerchiamo anche nei vecchi hashtags
            await new Promise((resolve) => {
                this.gun.user().get("hashtags")
                    .get(searchTerm)
                    .map()
                    .once((val, key) => {
                    if (key !== "_" && val === true && !refs.includes(key))
                        refs.push(key);
                });
                setTimeout(resolve, 1000);
            });
            if (refs.length === 0) {
                // Cercheremo come parte di un testo nel topic dei post
                this.debug(`Nessun post indicizzato per ${searchTerm}, cercheremo in tutti i post`);
                return this.searchPostsByTopicText(searchTerm);
            }
            const posts = [];
            for (const id of refs) {
                // Prima controlla la cache
                const cached = this.postCache.get(id);
                if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
                    posts.push(cached.data);
                    continue;
                }
                const data = await new Promise((resolve) => {
                    this.gun.user().get("posts").get(id).once(resolve);
                    setTimeout(() => resolve(null), 500);
                });
                if (data && data.content) {
                    // Normalizza il post
                    const normalizedPost = this.normalizePost(data, id);
                    posts.push(normalizedPost);
                    // Aggiungi alla cache
                    this.postCache.set(id, {
                        data: normalizedPost,
                        timestamp: Date.now(),
                    });
                }
            }
            return posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        catch (err) {
            (0, logger_1.logError)(`Errore ricerca topic: ${err}`);
            return [];
        }
    }
    /**
     * Cerca post che contengono il topic nel testo
     */
    async searchPostsByTopicText(searchTerm) {
        this.debug(`Ricerca post con topic nel testo: ${searchTerm}`);
        try {
            const posts = [];
            const seen = new Set();
            // Recupera tutti i post e filtra per topic
            await new Promise((resolve) => {
                this.gun.user().get("posts")
                    .map()
                    .once((post, id) => {
                    if (!post || seen.has(id))
                        return;
                    seen.add(id);
                    const normalizedPost = this.normalizePost(post, id);
                    if (normalizedPost.topic &&
                        normalizedPost.topic
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())) {
                        posts.push(normalizedPost);
                    }
                });
                // Timeout per limitare la ricerca
                setTimeout(resolve, 3000);
            });
            return posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        catch (err) {
            (0, logger_1.logError)(`Errore ricerca nel testo: ${err}`);
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
            const post = await new Promise((res) => this.gun.user().get("posts").get(postId).once(res));
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
                await new Promise((r) => this.gun.user().get("hashtags").get(t).get(postId).put(null, r));
            }
            await new Promise((r) => this.gun.user().get("posts").get(postId).put(null, r));
            await new Promise((r) => this.gun.user().get("posts").get(postId).put(null, r));
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
        try {
            return new Promise((resolve) => {
                this.gun.user().get("posts")
                    .get(postId)
                    .get("likes")
                    .once((likes) => {
                    if (!likes) {
                        resolve({});
                    }
                    else {
                        resolve(likes);
                    }
                });
            });
        }
        catch (err) {
            this.error(`Errore recupero oggetto likes: ${err}`);
            return {};
        }
    }
    /**
     * Ottieni i like di un post come Observable
     * @param postId ID del post
     * @returns Observable di chiavi pubbliche che hanno messo like
     */
    getLikesObservable(postId) {
        return new rxjs_1.Observable((subscriber) => {
            // Sottoscrizione ai cambiamenti dei like
            const unsub = this.gun.user()
                .get("posts")
                .get(postId)
                .get("likes")
                .on((likes) => {
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
            return () => {
                console.log("unsub");
                unsub.off();
            };
        });
    }
    /**
     * Ottieni il conteggio dei like come Observable
     * @param postId ID del post
     * @returns Observable del numero di like
     */
    getLikeCountObservable(postId) {
        return this.getLikesObservable(postId).pipe((0, operators_1.map)((likes) => likes.length));
    }
    /**
     * Pulisce la cache
     */
    clearCache() {
        this.postCache.clear();
        this.debug("Cache dei post pulita");
    }
}
exports.PostService = PostService;
