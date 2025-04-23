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
// src/plugins/social/social.ts
const logger_1 = require("../../utils/logger");
const crypto = __importStar(require("crypto"));
const social_1 = require("../../types/social");
const eventEmitter_1 = require("../../utils/eventEmitter");
class Social extends eventEmitter_1.EventEmitter {
    DEFAULT_CONFIG = {
        cacheDuration: 5 * 60 * 1000,
    };
    config;
    gun;
    user; // Gun user instance
    profileCache = new Map();
    timelineCache = new Map();
    constructor(gunInstance) {
        super();
        this.config = { ...this.DEFAULT_CONFIG };
        this.gun = gunInstance;
        this.user = this.gun.user();
    }
    /**
     * Genera un ID univoco basato su:
     * [typeLen][type][subtypeLen][subtype][creatorLen][creator][createdAt][payloadLen][payload]
     * poi sha256 e concatena creator/hash
     */
    generateMessageId(message) {
        if (!message.type || !message.creator || message.createdAt === undefined) {
            throw new Error("Message must have type, creator and createdAt");
        }
        const hexType = Buffer.from(message.type.toUpperCase()).toString("hex");
        const hexSubtype = message.subtype
            ? Buffer.from(message.subtype.toUpperCase()).toString("hex")
            : "";
        const hexCreator = Buffer.from(message.creator).toString("hex");
        // createdAt in millisecondi, esadecimale a 16 caratteri
        const hexCreatedAt = message.createdAt.toString(16).padStart(16, "0");
        // serializza payload
        let payloadHex = "";
        if (message.payload) {
            try {
                // Rimuovi eventuali proprietà undefined dal payload
                const cleanPayload = Object.entries(message.payload)
                    .filter(([_, value]) => value !== undefined)
                    .reduce((obj, [key, value]) => {
                    obj[key] = value;
                    return obj;
                }, {});
                const payloadStr = JSON.stringify(cleanPayload);
                payloadHex = Buffer.from(payloadStr).toString("hex");
                (0, logger_1.logDebug)(`Payload serializzato: ${payloadStr.substring(0, 50)}...`);
            }
            catch (err) {
                (0, logger_1.logError)("Errore durante la serializzazione del payload", err);
                payloadHex = Buffer.from("{}").toString("hex");
            }
        }
        // payload length prefix (4 byte)
        const payloadLen = payloadHex.length.toString(16).padStart(8, "0");
        const typeLen = hexType.length.toString(16).padStart(2, "0");
        const subtypeLen = hexSubtype.length.toString(16).padStart(2, "0");
        const creatorLen = hexCreator.length.toString(16).padStart(4, "0");
        const encode = `${typeLen}${hexType}` +
            `${subtypeLen}${hexSubtype}` +
            `${creatorLen}${hexCreator}` +
            `${hexCreatedAt}` +
            `${payloadLen}${payloadHex}`;
        const messageHash = crypto
            .createHash("sha256")
            .update(encode)
            .digest("hex");
        return `${message.creator}/${messageHash}`;
    }
    /**
     * Crea un messaggio generico (post, moderazione, connection, profile, file)
     * e lo salva in gun.get("messages")
     */
    async createMessage(messageData) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Not authenticated");
        }
        try {
            const type = messageData.type || social_1.MessageType.POST;
            const subtype = messageData.subtype || social_1.MessageSubtype.EMPTY;
            const creator = this.user.is.pub;
            const createdAt = messageData.createdAt ?? Date.now(); // ms
            // Assicuriamoci che il payload sia un oggetto valido
            const payload = messageData.payload && typeof messageData.payload === "object"
                ? messageData.payload
                : {};
            // Log per il debug
            (0, logger_1.logDebug)(`Creazione messaggio type=${type}, subtype=${subtype}, con payload:`, payload);
            let partial = {
                type,
                subtype,
                creator,
                createdAt,
                payload,
            };
            const id = this.generateMessageId(partial);
            let message;
            switch (type) {
                case social_1.MessageType.POST:
                    // Assicura che tutti i campi opzionali siano presenti, impostati a null se mancanti
                    message = {
                        id,
                        type,
                        subtype: subtype,
                        creator,
                        createdAt,
                        payload: {
                            content: payload.content || "",
                            reference: payload.reference || null,
                            title: payload.title || null,
                            topic: payload.topic || null,
                            attachment: payload.attachment || null,
                        },
                    };
                    break;
                case social_1.MessageType.MODERATION:
                    message = {
                        id,
                        type,
                        subtype: subtype,
                        creator,
                        createdAt,
                        payload: {
                            reference: payload.reference || "",
                        },
                    };
                    break;
                case social_1.MessageType.CONNECTION:
                    message = {
                        id,
                        type,
                        subtype: subtype,
                        creator,
                        createdAt,
                        payload: {
                            name: payload.name || "",
                        },
                    };
                    break;
                case social_1.MessageType.PROFILE:
                    message = {
                        id,
                        type,
                        subtype: subtype,
                        creator,
                        createdAt,
                        payload: {
                            key: payload.key || undefined,
                            value: payload.value || "",
                        },
                    };
                    break;
                case social_1.MessageType.FILE:
                    message = {
                        id,
                        type,
                        subtype: subtype,
                        creator,
                        createdAt,
                        payload: {
                            name: payload.name || "",
                            mimeType: payload.mimeType || "application/octet-stream",
                            data: payload.data || "",
                        },
                    };
                    break;
                default:
                    throw new Error(`Unsupported message type: ${type}`);
            }
            // Salva direttamente l'oggetto
            // Assicuriamoci che il messaggio venga salvato in modo affidabile
            return new Promise((resolve) => {
                // Costruisci l'oggetto finale da salvare, includendo solo i campi definiti e non null
                const messageToSave = {
                    id: message.id,
                    type: message.type,
                    subtype: message.subtype,
                    creator: message.creator,
                    createdAt: message.createdAt,
                    payload: {
                        // Inizia con il payload base
                        content: message.payload.content || "",
                    },
                };
                // Aggiungi campi opzionali del payload solo se non sono null
                if (message.payload.reference !== null) {
                    messageToSave.payload.reference = message.payload.reference;
                }
                if (message.payload.title !== null) {
                    messageToSave.payload.title = message.payload.title;
                }
                if (message.payload.topic !== null) {
                    messageToSave.payload.topic = message.payload.topic;
                }
                if (message.payload.attachment !== null) {
                    messageToSave.payload.attachment = message.payload.attachment;
                }
                // Log del messaggio che verrà effettivamente salvato
                (0, logger_1.logDebug)("Messaggio finale pronto per GunDB .put():", messageToSave);
                this.gun
                    .get("messages")
                    .get(message.id)
                    .put(messageToSave, (ack) => {
                    if (ack && ack.err) {
                        (0, logger_1.logError)(`Errore durante il salvataggio del messaggio: ${ack.err}`, messageToSave // Logga l'oggetto che ha causato l'errore
                        );
                        resolve(null);
                    }
                    else {
                        (0, logger_1.logDebug)(`Messaggio salvato con successo: ${messageToSave.type}/${messageToSave.id}`);
                        // Notifica usando l'oggetto originale `message` che ha la struttura completa
                        this.emit(`new:${message.type.toLowerCase()}`, message);
                        // Svuota la cache della timeline per forzare un ricaricamento
                        if (message.type === social_1.MessageType.POST) {
                            this.timelineCache.clear();
                        }
                        // Restituisci l'oggetto originale `message` completo
                        resolve(message);
                    }
                });
            });
        }
        catch (err) {
            (0, logger_1.logError)("Failed to create message", err);
            return null;
        }
    }
    /** Recupera un singolo messaggio da messages/:id */
    async getMessage(id) {
        return new Promise((resolve) => {
            this.gun
                .get("messages")
                .get(id)
                .once((data) => resolve(data || null));
        });
    }
    /** Crea un post (ha subtype EMPTY) e lo restituisce come Post client-side */
    async post(content) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Not authenticated");
        }
        try {
            (0, logger_1.logDebug)(`Creazione nuovo post con contenuto: ${content.substring(0, 20)}...`);
            const creator = this.user.is.pub;
            const createdAt = Date.now();
            // Creiamo un payload minimo con solo il contenuto
            const payload = { content };
            const msg = await this.createMessage({
                type: social_1.MessageType.POST,
                subtype: social_1.MessageSubtype.EMPTY,
                payload,
                createdAt,
            });
            if (!msg) {
                (0, logger_1.logError)("Post creation failed - createMessage returned null");
                return null;
            }
            (0, logger_1.logDebug)(`Post creato con successo: ${msg.id}`);
            // Svuota la cache della timeline per assicurarsi che il nuovo post appaia
            this.timelineCache.clear();
            const post = {
                id: msg.id,
                author: creator,
                content: content,
                timestamp: createdAt,
            };
            // Verifica che il post sia stato salvato correttamente
            setTimeout(() => {
                this.getMessage(msg.id).then((savedMsg) => {
                    if (!savedMsg) {
                        (0, logger_1.logWarn)(`Il post ${msg.id} non è stato trovato dopo la creazione`);
                    }
                    else {
                        (0, logger_1.logDebug)(`Verifica post: ${msg.id} salvato correttamente`);
                    }
                });
            }, 1000);
            return post;
        }
        catch (err) {
            (0, logger_1.logError)("Post creation failed", err);
            return null;
        }
    }
    /** Metodi di like/unlike tramite messaggi di moderazione */
    async likePost(postId) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Not authenticated");
        }
        const msg = await this.createMessage({
            type: social_1.MessageType.MODERATION,
            subtype: social_1.MessageSubtype.LIKE,
            payload: { reference: postId },
        });
        return msg !== null;
    }
    async unlikePost(postId) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Not authenticated");
        }
        // pubblichiamo un "unlike" come blocco:
        const msg = await this.createMessage({
            type: social_1.MessageType.MODERATION,
            subtype: social_1.MessageSubtype.BLOCK,
            payload: { reference: postId },
        });
        return msg !== null;
    }
    /** Estrae tutti i like reali (MESSAGE/LTYPE=LIKE, non annullati da BLOCK) */
    async getLikes(postId) {
        const likes = await this.getMessagesByType(social_1.MessageType.MODERATION, social_1.MessageSubtype.LIKE);
        const unlikes = await this.getMessagesByType(social_1.MessageType.MODERATION, social_1.MessageSubtype.BLOCK);
        const blockedSet = new Set(unlikes.map((m) => m.payload.reference === postId && m.creator));
        return likes
            .filter((m) => m.payload.reference === postId)
            .map((m) => m.creator)
            .filter((pub) => !blockedSet.has(pub));
    }
    /** Aggiunge un commento (POST + subtype=REPLY) */
    async addComment(postId, content) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Not authenticated");
        }
        const createdAt = Date.now();
        const msg = await this.createMessage({
            type: social_1.MessageType.POST,
            subtype: social_1.MessageSubtype.REPLY,
            payload: { content, reference: postId },
            createdAt,
        });
        if (!msg)
            return null;
        return {
            id: msg.id,
            author: msg.creator,
            content,
            timestamp: createdAt,
            postId,
        };
    }
    /** Ottiene tutti i reply al post */
    async getComments(postId) {
        const replies = await this.getMessagesByType(social_1.MessageType.POST, social_1.MessageSubtype.REPLY);
        const comments = replies
            .filter((m) => m.payload.reference === postId)
            .map((m) => ({
            id: m.id,
            author: m.creator,
            content: m.payload.content,
            timestamp: m.createdAt,
            postId,
        }));
        // ordina in ordine cronologico ascendente
        comments.sort((a, b) => a.timestamp - b.timestamp);
        return comments;
    }
    /** Timeline: tutti i POST EMPTY dell'utente e di chi segue, ordinati per createdAt desc */
    async getTimeline() {
        if (!this.user.is || !this.user.is.pub) {
            return { messages: [], error: "Not authenticated" };
        }
        const me = this.user.is.pub;
        (0, logger_1.logDebug)(`Richiesta timeline per l'utente: ${me}`);
        // cache check
        const cached = this.timelineCache.get(me);
        if (cached && Date.now() - cached.timestamp < this.config.cacheDuration) {
            (0, logger_1.logDebug)(`Using cached timeline for ${me} with ${cached.data.length} posts`);
            return { messages: cached.data };
        }
        try {
            // Ottieni il profilo utente per i following
            const profile = await this.getProfile(me);
            (0, logger_1.logDebug)(`Profilo caricato per ${me}, following: ${profile.following.length} utenti`);
            // Assicuriamoci che usersToInclude contenga almeno l'utente corrente
            const usersToInclude = new Set([me, ...profile.following]);
            // Ottieni tutti i post
            (0, logger_1.logDebug)(`Recupero post di tipo ${social_1.MessageType.POST} e sottotipo ${social_1.MessageSubtype.EMPTY}`);
            const feed = await this.getMessagesByType(social_1.MessageType.POST, social_1.MessageSubtype.EMPTY);
            (0, logger_1.logDebug)(`Recuperati ${feed.length} post totali, filtro per utenti seguiti`);
            // Controlla se ci sono post che hanno creator uguale alla chiave pubblica dell'utente
            const ownPosts = feed.filter((p) => {
                const isOwn = p.creator === me;
                if (isOwn) {
                    (0, logger_1.logDebug)(`Post dell'utente: ${JSON.stringify(p)}`);
                }
                return isOwn;
            });
            (0, logger_1.logDebug)(`Ci sono ${ownPosts.length} post dell'utente`);
            // Filtra e ordina i post
            const filtered = feed
                .filter((p) => {
                if (!p || !p.creator) {
                    (0, logger_1.logWarn)(`Post non valido nella timeline: ${JSON.stringify(p)}`);
                    return false;
                }
                const isIncluded = usersToInclude.has(p.creator);
                if (!isIncluded && p.creator === me) {
                    (0, logger_1.logWarn)(`Post di ${me} non incluso nella timeline, controllo: ${JSON.stringify(p)}`);
                }
                return isIncluded;
            })
                .sort((a, b) => b.createdAt - a.createdAt);
            (0, logger_1.logDebug)(`Timeline filtrata: ${filtered.length} post da visualizzare`);
            // aggiorna cache
            this.timelineCache.set(me, {
                data: filtered,
                timestamp: Date.now(),
            });
            return { messages: filtered };
        }
        catch (err) {
            (0, logger_1.logError)("Timeline fetch failed", err);
            return { messages: [], error: err.message };
        }
    }
    /** Svuota cache e listener */
    cleanup() {
        this.profileCache.clear();
        this.timelineCache.clear();
        this.removeAllListeners();
    }
    // ——— PROFILE & CONNECTION (restano invariati) ———
    async updateProfile(field, value, key) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Not authenticated");
        }
        const msg = await this.createMessage({
            type: social_1.MessageType.PROFILE,
            subtype: field,
            payload: { key, value },
        });
        if (!msg)
            return false;
        this.profileCache.delete(this.user.is.pub);
        return true;
    }
    async getProfile(pub) {
        const cached = this.profileCache.get(pub);
        if (cached && Date.now() - cached.timestamp < this.config.cacheDuration) {
            (0, logger_1.logDebug)("Using cached profile for", pub);
            return cached.data;
        }
        const profile = {
            pub,
            followers: [],
            following: [],
            customFields: {},
        };
        try {
            const allProfile = await this.getMessagesByType(social_1.MessageType.PROFILE);
            for (const msg of allProfile.filter((m) => m.creator === pub)) {
                switch (msg.subtype) {
                    case social_1.MessageSubtype.NICKNAME:
                        profile.alias = msg.payload.value;
                        break;
                    case social_1.MessageSubtype.BIO:
                        profile.bio = msg.payload.value;
                        break;
                    case social_1.MessageSubtype.PROFILE_IMAGE:
                        profile.profileImage = msg.payload.value;
                        break;
                    case social_1.MessageSubtype.CUSTOM:
                        if (msg.payload.key) {
                            if (!profile.customFields) {
                                profile.customFields = {};
                            }
                            profile.customFields[msg.payload.key] = msg.payload.value;
                        }
                        break;
                }
            }
            // follower/following
            const conns = await this.getMessagesByType(social_1.MessageType.CONNECTION, social_1.MessageSubtype.FOLLOW);
            profile.followers = conns
                .filter((m) => m.payload.name === pub)
                .map((m) => m.creator);
            profile.following = conns
                .filter((m) => m.creator === pub)
                .map((m) => m.payload.name);
            this.profileCache.set(pub, { data: profile, timestamp: Date.now() });
            return profile;
        }
        catch (err) {
            (0, logger_1.logError)("Failed to get profile", err);
            return profile;
        }
    }
    async follow(pub) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Not authenticated");
        }
        if (pub === this.user.is.pub) {
            (0, logger_1.logWarn)("Cannot follow yourself");
            return false;
        }
        const profile = await this.getProfile(this.user.is.pub);
        if (profile.following.includes(pub)) {
            return true;
        }
        const msg = await this.createMessage({
            type: social_1.MessageType.CONNECTION,
            subtype: social_1.MessageSubtype.FOLLOW,
            payload: { name: pub },
        });
        if (!msg)
            return false;
        this.profileCache.delete(this.user.is.pub);
        this.profileCache.delete(pub);
        this.emit("follow", pub);
        return true;
    }
    async unfollow(pub) {
        if (!this.user.is || !this.user.is.pub) {
            throw new Error("Not authenticated");
        }
        if (pub === this.user.is.pub) {
            (0, logger_1.logWarn)("Cannot unfollow yourself");
            return false;
        }
        const conns = await this.getMessagesByType(social_1.MessageType.CONNECTION, social_1.MessageSubtype.FOLLOW);
        // rimuovo fisicamente tutti i follow verso pub
        for (const f of conns.filter((m) => m.creator === this.user.is.pub &&
            m.payload.name === pub)) {
            this.gun.get("messages").get(f.id).put(null);
        }
        this.profileCache.delete(this.user.is.pub);
        this.profileCache.delete(pub);
        this.emit("unfollow", pub);
        return true;
    }
    /** Legge dal bucket "messages" e filtra per tipo/sottotipo */
    async getMessagesByType(type, subtype) {
        return new Promise((resolve) => {
            const out = [];
            let processed = 0;
            // Usa una variabile di conteggio per tenere traccia dei messaggi elaborati
            this.gun
                .get("messages")
                .map()
                .once((data, key) => {
                processed++;
                if (!data)
                    return;
                // Log per debug
                if (type === social_1.MessageType.POST) {
                    (0, logger_1.logDebug)(`Processing message ${key}: type=${data.type}, subtype=${data.subtype}`);
                }
                if (data.type !== type)
                    return;
                if (subtype !== undefined && data.subtype !== subtype)
                    return;
                const validMessage = this.validateAndConvertMessage(data);
                if (validMessage) {
                    out.push(validMessage);
                }
            });
            // Aumenta il timeout per dare più tempo per l'elaborazione
            setTimeout(() => {
                (0, logger_1.logDebug)(`getMessagesByType completed: found ${out.length} messages of type ${type}${subtype ? "/" + subtype : ""} out of ${processed} processed`);
                resolve(out);
            }, 3000);
        });
    }
    /** Converte raw → Message tipizzato */
    validateAndConvertMessage(data) {
        try {
            if (!data || typeof data !== "object") {
                (0, logger_1.logError)("Message data is not an object", data);
                return null;
            }
            const { id, type, subtype, creator, createdAt, payload } = data;
            // Controlli più rigidi
            if (!id || !type || !creator) {
                (0, logger_1.logError)("Message missing required fields", { id, type, creator });
                return null;
            }
            // Gestire createdAt possibilmente mancante o in formato errato
            const timestamp = createdAt || Date.now();
            // Assicurati che payload sia un oggetto
            const safePayload = payload || {};
            // Log dettagliato per problemi di payload in messaggi POST
            if (type === social_1.MessageType.POST) {
                (0, logger_1.logDebug)("Validating POST message payload", JSON.stringify(safePayload));
            }
            switch (type) {
                case social_1.MessageType.POST:
                    return {
                        id,
                        type,
                        subtype: subtype || social_1.MessageSubtype.EMPTY,
                        creator,
                        createdAt: timestamp,
                        payload: {
                            content: safePayload.content || "",
                            reference: safePayload.reference || undefined,
                            title: safePayload.title || undefined,
                            topic: safePayload.topic || undefined,
                            attachment: safePayload.attachment || undefined,
                        },
                    };
                case social_1.MessageType.MODERATION:
                    return {
                        id,
                        type,
                        subtype: subtype || social_1.MessageSubtype.EMPTY,
                        creator,
                        createdAt: timestamp,
                        payload: {
                            reference: safePayload.reference || "",
                        },
                    };
                case social_1.MessageType.CONNECTION:
                    return {
                        id,
                        type,
                        subtype: subtype || social_1.MessageSubtype.EMPTY,
                        creator,
                        createdAt: timestamp,
                        payload: {
                            name: safePayload.name || "",
                        },
                    };
                case social_1.MessageType.PROFILE:
                    return {
                        id,
                        type,
                        subtype: subtype || social_1.MessageSubtype.EMPTY,
                        creator,
                        createdAt: timestamp,
                        payload: {
                            key: safePayload.key || undefined,
                            value: safePayload.value || "",
                        },
                    };
                case social_1.MessageType.FILE:
                    return {
                        id,
                        type,
                        subtype: subtype || social_1.MessageSubtype.EMPTY,
                        creator,
                        createdAt: timestamp,
                        payload: {
                            name: safePayload.name || "",
                            mimeType: safePayload.mimeType || "application/octet-stream",
                            data: safePayload.data || "",
                        },
                    };
                default:
                    return null;
            }
        }
        catch (err) {
            (0, logger_1.logError)("Message validation failed", err);
            return null;
        }
    }
}
exports.Social = Social;
