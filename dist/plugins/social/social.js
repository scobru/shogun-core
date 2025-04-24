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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Social = void 0;
const logger_1 = require("../../utils/logger");
const crypto = __importStar(require("crypto"));
const eventEmitter_1 = require("../../utils/eventEmitter");
const social_1 = require("../../types/social");
const rxjs_integration_1 = require("../../gun/rxjs-integration");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
/**
 * Plugin Social che utilizza Gun DB
 */
class Social extends eventEmitter_1.EventEmitter {
    gun;
    user;
    profileCache = new Map();
    cacheDuration = 5 * 60 * 1000; // 5 minuti
    gunRx;
    constructor(gunInstance) {
        super();
        this.gun = gunInstance;
        this.user = this.gun.user();
        this.gunRx = new rxjs_integration_1.GunRxJS(gunInstance);
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
     * Pulisce le cache e i listener
     */
    cleanup() {
        this.profileCache.clear();
        this.removeAllListeners();
    }
    /**
     * Estrae gli hashtag dal testo
     * @param text Testo da analizzare
     * @returns Array di hashtag trovati
     */
    extractHashtags(text) {
        if (!text)
            return [];
        // Cerca pattern #parola (lettere, numeri, underscore)
        const hashtagRegex = /#(\w+)/g;
        const matches = text.match(hashtagRegex);
        if (!matches)
            return [];
        // Rimuove il # e normalizza in minuscolo
        return matches.map((tag) => tag.substring(1).toLowerCase());
    }
    /**
     * Indicizza un post per hashtag
     * @param postId ID del post
     * @param hashtags Array di hashtag da indicizzare
     */
    async indexPostByHashtags(postId, hashtags) {
        if (!hashtags || hashtags.length === 0)
            return;
        (0, logger_1.logDebug)(`Indicizzazione post ${postId} per ${hashtags.length} hashtag`);
        for (const tag of hashtags) {
            // Aggiunge il post all'indice del hashtag
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
     * Crea un nuovo post
     * @param content Contenuto del post
     * @param imageData Dati dell'immagine (Base64 o URL)
     * @returns Dati del post creato o null in caso di errore
     */
    async post(content, imageData) {
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
            const hashtagsObj = {};
            hashtags.forEach((tag) => {
                hashtagsObj[tag] = true;
            });
            // Struttura del post di base - senza proprietà che potrebbero essere undefined
            const post = {
                id: postId,
                author: userPub,
                content: trimmedContent,
                timestamp,
                payload: {}, // Inizializza l'oggetto payload
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
            (0, logger_1.logDebug)(`Creazione post: ${postId} ${hasHashtags ? "con hashtag: " + hashtags.join(", ") : ""} ${imageData ? "con immagine" : "senza immagine"}`);
            return new Promise((resolve) => {
                // Memorizza il post nell'indice globale
                this.gun
                    .get("posts")
                    .get(postId)
                    .put(post, async (ack) => {
                    if (ack.err) {
                        (0, logger_1.logError)(`Errore salvataggio post: ${ack.err}`);
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
                            .once((savedPost) => {
                            if (!savedPost || !savedPost.content) {
                                (0, logger_1.logWarn)(`Verifica post ${postId}: contenuto mancante, riprovando la scrittura`);
                                this.gun.get("posts").get(postId).put(post);
                            }
                            else {
                                (0, logger_1.logDebug)(`Verifica post ${postId}: contenuto correttamente salvato`);
                            }
                        });
                    }, 500);
                    // Per l'interfaccia, restituisci hashtagsList come una proprietà normale
                    if (hasHashtags) {
                        post.hashtagsList = hashtags;
                    }
                    // Notifica l'evento
                    this.emit("new:post", post);
                    (0, logger_1.logDebug)(`Post creato: ${postId}`);
                    resolve(post);
                });
            });
        }
        catch (err) {
            (0, logger_1.logError)(`Errore creazione post: ${err}`);
            return null;
        }
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
     * Ottieni la timeline (post propri e di chi segui)
     * @returns Risultato della timeline
     */
    async getTimeline(limit = 10, options = {
        includeLikes: true,
    }) {
        if (!this.gun || !this.user) {
            this.error("Gun/SEA non disponibile");
            return { messages: [], error: "Database non disponibile" };
        }
        this.debug("getTimeline - Recupero timeline con limite:", limit);
        return new Promise((resolve) => {
            const messages = [];
            const seen = new Set();
            // Imposta un timeout per evitare di bloccarsi indefinitamente
            const timeoutId = setTimeout(() => {
                this.debug(`getTimeline - Timeout dopo ${options.timeout || 5000}ms - Restituisco ${messages.length} posts`);
                // Ordina per data (più recenti prima)
                messages.sort((a, b) => b.createdAt - a.createdAt);
                resolve({ messages });
            }, options.timeout || 5000);
            // Recupera i post più recenti
            this.gun
                .get("posts")
                .map()
                .once(async (post, id) => {
                try {
                    if (!post || seen.has(id))
                        return;
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
                                this.debug(`getTimeline - Contenuto recuperato da payload diretto: ${content.substring(0, 20)}...`);
                            }
                            // Se il payload ha i dati immagine direttamente
                            if (post.payload.imageData && !imageData) {
                                imageData = post.payload.imageData;
                                this.debug(`getTimeline - Immagine recuperata da payload diretto per post: ${id}`);
                            }
                        }
                        catch (err) {
                            this.error("Errore recupero payload post:", err);
                        }
                    }
                    // Crea un messaggio di tipo PostMessage con dati sicuri
                    const postMsg = {
                        id,
                        type: social_1.MessageType.POST,
                        subtype: social_1.MessageSubtype.EMPTY,
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
                            postMsg.likes = likes;
                        }
                        catch (err) {
                            this.error(`Errore recupero likes per post ${id}:`, err);
                        }
                    }
                    messages.push(postMsg);
                    // Se abbiamo raggiunto il limite, conclude
                    if (messages.length >= limit) {
                        clearTimeout(timeoutId);
                        // Ordina per data (più recenti prima)
                        messages.sort((a, b) => b.createdAt - a.createdAt);
                        resolve({ messages });
                    }
                }
                catch (err) {
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
    async getLikesObject(postId) {
        const likes = {};
        return new Promise((resolve) => {
            this.gun
                .get("posts")
                .get(postId)
                .get("likes")
                .map()
                .once((val, key) => {
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
    async addComment(postId, content) {
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
                    .put(comment, (ack) => {
                    if (ack.err) {
                        (0, logger_1.logError)(`Errore salvataggio commento: ${ack.err}`);
                        resolve(null);
                    }
                    else {
                        // Verifica doppia scrittura per garantire persistenza
                        setTimeout(() => {
                            this.gun
                                .get("posts")
                                .get(postId)
                                .get("comments")
                                .get(commentId)
                                .once((savedComment) => {
                                if (!savedComment || !savedComment.content) {
                                    (0, logger_1.logWarn)(`Verifica commento ${commentId}: contenuto mancante, riprovando la scrittura`);
                                    this.gun
                                        .get("posts")
                                        .get(postId)
                                        .get("comments")
                                        .get(commentId)
                                        .put(comment);
                                }
                                else {
                                    (0, logger_1.logDebug)(`Verifica commento ${commentId}: contenuto correttamente salvato`);
                                }
                            });
                        }, 500);
                        (0, logger_1.logDebug)(`Commento ${commentId} aggiunto al post ${postId}`);
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
     * @param postId ID del post
     * @returns Array di commenti
     */
    async getComments(postId) {
        if (!postId) {
            throw new Error("ID post non valido");
        }
        try {
            const comments = [];
            await new Promise((resolve) => {
                this.gun
                    .get("posts")
                    .get(postId)
                    .get("comments")
                    .map()
                    .once((comment, key) => {
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
                            (0, logger_1.logWarn)(`Commento ${key} senza contenuto, verifica i dati in GunDB`);
                        }
                        comments.push(processedComment);
                    }
                });
                setTimeout(resolve, 500);
            });
            // Ordina per data
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
     * @param postId ID del post
     * @returns true se l'operazione è riuscita
     */
    async likePost(postId) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Non autenticato");
        }
        try {
            const userPub = this.user.is.pub;
            await new Promise((resolve, reject) => {
                this.gun
                    .get("posts")
                    .get(postId)
                    .get("likes")
                    .get(userPub)
                    .put(true, (ack) => {
                    if (ack.err)
                        reject(new Error(ack.err));
                    else
                        resolve();
                });
            });
            return true;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore like post: ${err}`);
            return false;
        }
    }
    /**
     * Rimuovi like da un post
     * @param postId ID del post
     * @returns true se l'operazione è riuscita
     */
    async unlikePost(postId) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Non autenticato");
        }
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
            return true;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore unlike post: ${err}`);
            return false;
        }
    }
    /**
     * Ottieni gli utenti che hanno messo like a un post
     * @param postId ID del post
     * @returns Array di ID utenti che hanno messo like
     */
    async getLikes(postId) {
        if (!postId) {
            throw new Error("ID post non valido");
        }
        try {
            const likes = [];
            await new Promise((resolve) => {
                this.gun
                    .get("posts")
                    .get(postId)
                    .get("likes")
                    .map()
                    .once((val, key) => {
                    if (key !== "_" && val === true) {
                        likes.push(key);
                    }
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
     * Ottieni il conteggio dei like di un post
     * @param postId ID del post
     * @returns Numero di like
     */
    async getLikeCount(postId) {
        const likes = await this.getLikes(postId);
        return likes.length;
    }
    /**
     * Cerca post per hashtag
     * @param hashtag Hashtag da cercare (senza #)
     * @returns Array di post che contengono l'hashtag
     */
    async searchByHashtag(hashtag) {
        if (!hashtag) {
            throw new Error("Hashtag non valido");
        }
        // Normalizza hashtag in minuscolo e rimuovi # se presente
        const normalizedTag = hashtag.startsWith("#")
            ? hashtag.substring(1).toLowerCase()
            : hashtag.toLowerCase();
        (0, logger_1.logDebug)(`Ricerca post con hashtag #${normalizedTag}`);
        try {
            // Recupera i riferimenti ai post con l'hashtag
            const postRefs = [];
            await new Promise((resolve) => {
                this.gun
                    .get("hashtags")
                    .get(normalizedTag)
                    .map()
                    .once((val, key) => {
                    if (key !== "_" && val === true) {
                        postRefs.push(key);
                    }
                });
                setTimeout(resolve, 1000);
            });
            if (postRefs.length === 0) {
                (0, logger_1.logDebug)(`Nessun post trovato con hashtag #${normalizedTag}`);
                return [];
            }
            (0, logger_1.logDebug)(`Trovati ${postRefs.length} post con hashtag #${normalizedTag}`);
            // Recupera i post effettivi
            const posts = [];
            for (const postId of postRefs) {
                const post = await new Promise((resolve) => {
                    this.gun
                        .get("posts")
                        .get(postId)
                        .once((data) => {
                        resolve(data);
                    });
                    // Timeout per garantire la risposta
                    setTimeout(() => resolve(null), 500);
                });
                if (post && post.content) {
                    // Garantisce che ci sia sempre un array hashtagsList
                    const postData = { ...post };
                    // Recupera hashtags in diversi formati possibili
                    if (!postData.hashtagsList) {
                        if (post._hashtagsList) {
                            // Nuovo formato con _hashtagsList
                            postData.hashtagsList = post._hashtagsList;
                        }
                        else if (post.hashtags) {
                            // Vecchio formato con hashtags come oggetto
                            if (typeof post.hashtags === "object" &&
                                !Array.isArray(post.hashtags)) {
                                postData.hashtagsList = Object.keys(post.hashtags).filter((key) => post.hashtags[key] === true);
                            }
                            else if (Array.isArray(post.hashtags)) {
                                // Caso in cui hashtags è già un array
                                postData.hashtagsList = post.hashtags;
                            }
                        }
                        else {
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
        }
        catch (err) {
            (0, logger_1.logError)(`Errore ricerca hashtag: ${err}`);
            return [];
        }
    }
    /**
     * Elimina un post
     * @param postId ID del post da eliminare
     * @returns true se l'operazione è riuscita, false altrimenti
     */
    async deletePost(postId) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Non autenticato");
        }
        try {
            // Verifica che l'utente sia l'autore del post
            const post = await new Promise((resolve) => {
                this.gun
                    .get("posts")
                    .get(postId)
                    .once((data) => {
                    resolve(data);
                });
            });
            if (!post) {
                (0, logger_1.logError)(`Post ${postId} non trovato`);
                return false;
            }
            const userPub = this.user.is.pub;
            const postAuthor = post.author || post.creator;
            if (postAuthor !== userPub) {
                (0, logger_1.logWarn)(`L'utente ${userPub} non è autorizzato a eliminare il post ${postId}`);
                return false;
            }
            (0, logger_1.logDebug)(`Eliminazione post: ${postId}`);
            // Ottieni la lista degli hashtag da rimuovere dall'indice
            let hashtagsToRemove = [];
            // Gestisci sia il vecchio formato (array) che il nuovo formato (oggetto)
            if (post.hashtagsList && Array.isArray(post.hashtagsList)) {
                hashtagsToRemove = post.hashtagsList;
            }
            else if (post.hashtags) {
                if (Array.isArray(post.hashtags)) {
                    // Vecchio formato (array)
                    hashtagsToRemove = post.hashtags;
                }
                else {
                    // Nuovo formato (oggetto)
                    hashtagsToRemove = Object.keys(post.hashtags).filter((key) => post.hashtags[key] === true);
                }
            }
            // Rimuovi i riferimenti dagli indici hashtag
            if (hashtagsToRemove.length > 0) {
                for (const tag of hashtagsToRemove) {
                    await new Promise((resolve) => {
                        this.gun
                            .get("hashtags")
                            .get(tag)
                            .get(postId)
                            .put(null, () => resolve());
                    });
                }
            }
            // Rimuovi i riferimenti al post dalle liste degli utenti
            await new Promise((resolve) => {
                this.gun
                    .get("users")
                    .get(userPub)
                    .get("posts")
                    .get(postId)
                    .put(null, () => resolve());
            });
            // Elimina il post dall'indice globale
            await new Promise((resolve) => {
                this.gun
                    .get("posts")
                    .get(postId)
                    .put(null, () => resolve());
            });
            // Notifica l'evento di eliminazione
            this.emit("delete:post", { id: postId, author: userPub });
            (0, logger_1.logDebug)(`Post ${postId} eliminato`);
            return true;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore eliminazione post: ${err}`);
            return false;
        }
    }
    /**
     * Ottieni la timeline (post propri e di chi segui) come Observable
     * @returns Observable di post in tempo reale
     */
    getTimelineObservable(limit = 10, options = { includeLikes: true }) {
        if (!this.gun || !this.user) {
            this.error("Gun/SEA non disponibile");
            return (0, rxjs_1.of)([]);
        }
        return this.gunRx.match("posts").pipe((0, operators_1.map)((posts) => {
            if (!posts || !posts.length)
                return [];
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
            });
        }), (0, operators_1.tap)((messages) => this.debug(`Timeline observable: ricevuti ${messages.length} post`)));
    }
    /**
     * Ottieni i commenti di un post come Observable
     * @param postId ID del post
     * @returns Observable di commenti in tempo reale
     */
    getCommentsObservable(postId) {
        if (!postId) {
            return (0, rxjs_1.of)([]);
        }
        return this.gunRx.observe(`posts/${postId}/comments`).pipe((0, operators_1.map)((comments) => {
            if (!comments)
                return [];
            // Converti l'oggetto dei commenti in array
            const commentsArray = Object.entries(comments)
                .filter(([key, _]) => key !== "_") // Filtra le chiavi Gun interne
                .map(([key, value]) => {
                const comment = value;
                return {
                    id: comment.id || key,
                    author: comment.author || "Anonimo",
                    content: comment.content || "",
                    timestamp: comment.timestamp || Date.now(),
                    postId,
                };
            })
                .filter((comment) => comment.content); // Filtra i commenti senza contenuto
            // Ordina per data (più recenti prima)
            return commentsArray.sort((a, b) => b.timestamp - a.timestamp);
        }), (0, operators_1.tap)((comments) => this.debug(`Commenti observable per post ${postId}: ${comments.length} commenti`)));
    }
    /**
     * Ottieni i like di un post come Observable
     * @param postId ID del post
     * @returns Observable del conteggio like in tempo reale
     */
    getLikesObservable(postId) {
        if (!postId) {
            return (0, rxjs_1.of)([]);
        }
        return this.gunRx.observe(`posts/${postId}/likes`).pipe((0, operators_1.map)((likes) => {
            if (!likes)
                return [];
            // Converti l'oggetto dei like in array di utenti
            return Object.entries(likes)
                .filter(([key, value]) => key !== "_" && value === true)
                .map(([key, _]) => key);
        }), (0, operators_1.tap)((likes) => this.debug(`Like observable per post ${postId}: ${likes.length} like`)));
    }
    /**
     * Ottieni il conteggio dei like di un post come Observable
     * @param postId ID del post
     * @returns Observable con il numero di like in tempo reale
     */
    getLikeCountObservable(postId) {
        return this.getLikesObservable(postId).pipe((0, operators_1.map)((likes) => likes.length));
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
     * Cerca post per hashtag con aggiornamenti in tempo reale
     * @param hashtag Hashtag da cercare
     * @returns Observable di post con l'hashtag specificato
     */
    searchByHashtagObservable(hashtag) {
        if (!hashtag) {
            return (0, rxjs_1.of)([]);
        }
        // Normalizza hashtag
        const normalizedTag = hashtag.startsWith("#")
            ? hashtag.substring(1).toLowerCase()
            : hashtag.toLowerCase();
        this.debug(`Ricerca observable per hashtag #${normalizedTag}`);
        // Osserva l'indice degli hashtag
        return this.gunRx.observe(`hashtags/${normalizedTag}`).pipe((0, operators_1.switchMap)((hashtagIndex) => {
            if (!hashtagIndex)
                return (0, rxjs_1.of)([]);
            // Estrai gli ID dei post
            const postIds = Object.keys(hashtagIndex).filter((key) => key !== "_");
            if (postIds.length === 0)
                return (0, rxjs_1.of)([]);
            // Per ogni ID, carica il post completo
            const postObservables = postIds.map((id) => this.gunRx.observe(`posts/${id}`).pipe((0, operators_1.map)((post) => {
                if (post) {
                    // Garantisce che ci sia sempre un array hashtagsList
                    const typedPost = { ...post };
                    // Recupera hashtags in diversi formati possibili
                    if (!typedPost.hashtagsList) {
                        if (typedPost._hashtagsList) {
                            // Nuovo formato con _hashtagsList
                            typedPost.hashtagsList = typedPost._hashtagsList;
                        }
                        else if (typedPost.hashtags) {
                            // Formato con hashtags come oggetto
                            if (typeof typedPost.hashtags === "object" &&
                                !Array.isArray(typedPost.hashtags)) {
                                typedPost.hashtagsList = Object.keys(typedPost.hashtags).filter((key) => typedPost.hashtags[key] === true);
                            }
                            else if (Array.isArray(typedPost.hashtags)) {
                                // Caso in cui hashtags è già un array
                                typedPost.hashtagsList = typedPost.hashtags;
                            }
                        }
                        else {
                            // Se non troviamo hashtag, usiamo un array vuoto
                            typedPost.hashtagsList = [];
                        }
                    }
                    return typedPost;
                }
                return post;
            })));
            // Combina tutti i post in un array
            return (0, rxjs_1.combineLatest)(postObservables);
        }), (0, operators_1.map)((posts) => posts.filter((post) => post && post.content)), (0, operators_1.map)((posts) => posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))), (0, operators_1.tap)((posts) => this.debug(`Trovati ${posts.length} post con hashtag #${normalizedTag}`)));
    }
    /**
     * Osserva il profilo di un utente in tempo reale
     * @param pub Chiave pubblica dell'utente
     * @returns Observable del profilo utente
     */
    getProfileObservable(pub) {
        if (!pub) {
            return (0, rxjs_1.of)({
                pub: "",
                followers: [],
                following: [],
                customFields: {},
            });
        }
        // Profilo base
        const baseProfile = {
            pub,
            followers: [],
            following: [],
            customFields: {},
        };
        // Osserva i dati del profilo
        const profileData$ = this.gunRx.observe(`users/${pub}`);
        const followers$ = this.gunRx.observe(`users/${pub}/followers`);
        const following$ = this.gunRx.observe(`users/${pub}/following`);
        return (0, rxjs_1.combineLatest)([profileData$, followers$, following$]).pipe((0, operators_1.map)(([profileData, followers, following]) => {
            // Type assertions con Record generico
            const typedProfileData = profileData;
            const typedFollowers = followers;
            const typedFollowing = following;
            // Crea profilo combinando i dati
            const profile = { ...baseProfile };
            // Aggiungi dati profilo base
            if (typedProfileData) {
                if (typedProfileData.alias)
                    profile.alias = typedProfileData.alias;
                if (typedProfileData.bio)
                    profile.bio = typedProfileData.bio;
                if (typedProfileData.profileImage)
                    profile.profileImage = typedProfileData.profileImage;
            }
            // Aggiungi followers
            if (typedFollowers) {
                profile.followers = Object.keys(typedFollowers).filter((key) => key !== "_" && typedFollowers[key] === true);
            }
            // Aggiungi following
            if (typedFollowing) {
                profile.following = Object.keys(typedFollowing).filter((key) => key !== "_" && typedFollowing[key] === true);
            }
            return profile;
        }), (0, operators_1.tap)((profile) => this.debug(`Profilo observable ${pub}: ${profile.followers.length} followers, ${profile.following.length} following`)));
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
}
exports.Social = Social;
