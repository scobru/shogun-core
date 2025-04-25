"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialPlugin = void 0;
// src/plugins/social/socialPlugin.ts
const base_1 = require("../base");
const social_1 = require("./social");
const logger_1 = require("../../utils/logger");
const rxjs_1 = require("rxjs");
class SocialPlugin extends base_1.BasePlugin {
    name = "social";
    version = "1.0.2";
    description = "Social plugin using GunDB for storage and real-time updates";
    social = null;
    get user() {
        return this.social?.user;
    }
    initialize(core) {
        super.initialize(core);
        this.social = new social_1.Social(core.gun);
        (0, logger_1.log)("Social plugin initialized");
    }
    destroy() {
        if (this.social && typeof this.social.cleanup === "function") {
            this.social.cleanup();
        }
        this.social = null;
        super.destroy();
        (0, logger_1.log)("Social plugin destroyed");
    }
    async getProfile(pub) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (typeof this.social.getProfile === "function") {
            return this.social.getProfile(pub);
        }
        (0, logger_1.logError)("getProfile method not available");
        return {
            pub,
            followers: [],
            following: [],
            customFields: {},
        };
    }
    async post(content, options) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (typeof this.social.post === "function") {
            return this.social.post(content, options);
        }
        (0, logger_1.logError)("post method not available");
        return null;
    }
    /**
     * Cerca post per topic o hashtag
     * @param topic Argomento o hashtag da cercare
     * @returns Array di post che contengono l'argomento/hashtag
     */
    async searchByTopic(topic) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (typeof this.social.searchByTopic === "function") {
            return this.social.searchByTopic(topic);
        }
        (0, logger_1.logError)("searchByTopic method not available");
        return [];
    }
    async likePost(postId) {
        return this.social.likePost(postId);
    }
    async unlikePost(postId) {
        return this.social.unlikePost(postId);
    }
    async getLikes(postId) {
        return this.social.getLikes(postId);
    }
    async getLikeCount(postId) {
        return this.social.getLikeCount(postId);
    }
    async addComment(postId, content) {
        return this.social.addComment(postId, content);
    }
    async getComments(postId) {
        return this.social.getComments(postId);
    }
    async deletePost(postId) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (typeof this.social.deletePost === "function") {
            return this.social.deletePost(postId);
        }
        (0, logger_1.logError)("deletePost method not available");
        return false;
    }
    async getTimeline() {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (typeof this.social.getTimeline === "function") {
            return this.social.getTimeline();
        }
        (0, logger_1.logError)("getTimeline method not available");
        return { messages: [], error: "Method not implemented" };
    }
    /**
     * Ottieni la timeline degli utenti seguiti (esclude i propri post)
     * @returns Timeline con i post degli utenti seguiti
     */
    async getFollowingTimeline() {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (typeof this.social.getTimeline === "function") {
            return this.social.getTimeline(10, {
                includeLikes: true,
                onlyFollowing: true,
            });
        }
        (0, logger_1.logError)("getFollowingTimeline method not available");
        return { messages: [], error: "Method not implemented" };
    }
    async follow(pub) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (typeof this.social.follow === "function") {
            return this.social.follow(pub);
        }
        (0, logger_1.logError)("follow method not available");
        return false;
    }
    /**
     * Aggiorna i campi del profilo utente
     * @param fields Oggetto con i campi da aggiornare (es. {bio: "Nuova bio"})
     * @returns true se l'operazione è riuscita
     */
    async updateProfile(fields) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (typeof this.social.updateProfile !== "function") {
            (0, logger_1.logError)("updateProfile method not available");
            return false;
        }
        try {
            let success = true;
            // Aggiorna ogni campo nell'oggetto
            for (const [field, value] of Object.entries(fields)) {
                const result = await this.social.updateProfile(field, value);
                if (!result)
                    success = false;
            }
            return success;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore nell'aggiornamento del profilo: ${err}`);
            return false;
        }
    }
    async unfollow(pub) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (typeof this.social.unfollow === "function") {
            return this.social.unfollow(pub);
        }
        (0, logger_1.logError)("unfollow method not available");
        return false;
    }
    cleanup() {
        if (this.social && typeof this.social.cleanup === "function") {
            this.social.cleanup();
        }
    }
    /**
     * Ottieni la timeline come Observable per aggiornamenti in tempo reale
     * @param limit Numero massimo di post da recuperare
     * @param options Opzioni aggiuntive
     * @returns Observable della timeline
     */
    getTimelineObservable(limit = 10, options = { includeLikes: true }) {
        if (!this.social) {
            (0, logger_1.logError)("Social plugin not initialized");
            return (0, rxjs_1.of)([]);
        }
        if (typeof this.social.getTimelineObservable === "function") {
            return this.social.getTimelineObservable(limit, options);
        }
        (0, logger_1.logError)("getTimelineObservable method not available");
        return (0, rxjs_1.of)([]);
    }
    /**
     * Ottieni i commenti di un post come Observable
     * @param postId ID del post
     * @returns Observable dei commenti
     */
    getCommentsObservable(postId) {
        if (!this.social) {
            (0, logger_1.logError)("Social plugin not initialized");
            return (0, rxjs_1.of)([]);
        }
        if (typeof this.social.getCommentsObservable === "function") {
            return this.social.getCommentsObservable(postId);
        }
        (0, logger_1.logError)("getCommentsObservable method not available");
        return (0, rxjs_1.of)([]);
    }
    /**
     * Ottieni gli utenti che hanno messo like a un post come Observable
     * @param postId ID del post
     * @returns Observable dei like
     */
    getLikesObservable(postId) {
        if (!this.social) {
            (0, logger_1.logError)("Social plugin not initialized");
            return (0, rxjs_1.of)([]);
        }
        if (typeof this.social.getLikesObservable === "function") {
            return this.social.getLikesObservable(postId);
        }
        (0, logger_1.logError)("getLikesObservable method not available");
        return (0, rxjs_1.of)([]);
    }
    /**
     * Ottieni il conteggio dei like come Observable
     * @param postId ID del post
     * @returns Observable del conteggio like
     */
    getLikeCountObservable(postId) {
        if (!this.social) {
            (0, logger_1.logError)("Social plugin not initialized");
            return (0, rxjs_1.of)(0);
        }
        if (typeof this.social.getLikeCountObservable === "function") {
            return this.social.getLikeCountObservable(postId);
        }
        (0, logger_1.logError)("getLikeCountObservable method not available");
        return (0, rxjs_1.of)(0);
    }
    /**
     * Ottieni un post arricchito con dettagli dell'autore
     * @param postId ID del post
     * @returns Observable del post con dettagli aggiuntivi
     */
    getEnrichedPostObservable(postId) {
        if (!this.social) {
            (0, logger_1.logError)("Social plugin not initialized");
            return (0, rxjs_1.of)(null);
        }
        if (typeof this.social.getEnrichedPostObservable === "function") {
            return this.social.getEnrichedPostObservable(postId);
        }
        (0, logger_1.logError)("getEnrichedPostObservable method not available");
        return (0, rxjs_1.of)(null);
    }
    /**
     * Cerca post per topic con aggiornamenti in tempo reale
     * @param topic Argomento o hashtag da cercare
     * @returns Observable di post con il topic specificato
     */
    searchByTopicObservable(topic) {
        if (!this.social) {
            (0, logger_1.logError)("Social plugin not initialized");
            return (0, rxjs_1.of)([]);
        }
        if (typeof this.social.searchByTopicObservable === "function") {
            return this.social.searchByTopicObservable(topic);
        }
        (0, logger_1.logError)("searchByTopicObservable method not available");
        return (0, rxjs_1.of)([]);
    }
    /**
     * Osserva un profilo utente in tempo reale
     * @param pub Chiave pubblica dell'utente
     * @returns Observable del profilo utente
     */
    getProfileObservable(pub) {
        if (!this.social) {
            (0, logger_1.logError)("Social plugin not initialized");
            return (0, rxjs_1.of)({
                pub,
                followers: [],
                following: [],
                customFields: {},
            });
        }
        if (typeof this.social.getProfileObservable === "function") {
            return this.social.getProfileObservable(pub);
        }
        (0, logger_1.logError)("getProfileObservable method not available");
        return (0, rxjs_1.of)({
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
    async getAllUsers() {
        if (!this.social) {
            (0, logger_1.logError)("Social plugin not initialized");
            return [];
        }
        if (typeof this.social.getAllUsers === "function") {
            return this.social.getAllUsers();
        }
        (0, logger_1.logError)("getAllUsers method not available");
        return [];
    }
    /**
     * Ottieni tutti gli utenti come Observable
     * @returns Observable di profili utente
     */
    getAllUsersObservable() {
        if (!this.social) {
            (0, logger_1.logError)("Social plugin not initialized");
            return (0, rxjs_1.of)([]);
        }
        if (typeof this.social.getAllUsersObservable === "function") {
            return this.social.getAllUsersObservable();
        }
        (0, logger_1.logError)("getAllUsersObservable method not available");
        return (0, rxjs_1.of)([]);
    }
    /**
     * Ottieni i post creati dall'utente corrente
     * @param limit Numero massimo di post da recuperare
     * @param options Opzioni aggiuntive
     * @returns Risultato della timeline con i post dell'utente
     */
    async getUserPosts(limit = 10, options = {
        includeLikes: true,
    }) {
        if (!this.social)
            throw new Error("Social plugin not initialized");
        if (typeof this.social.getUserPosts === "function") {
            return this.social.getUserPosts(limit, options);
        }
        (0, logger_1.logError)("getUserPosts method not available");
        return { messages: [], error: "Method not implemented" };
    }
    /**
     * Ottieni i post creati dall'utente corrente come Observable
     * @param limit Numero massimo di post da recuperare
     * @param options Opzioni aggiuntive
     * @returns Observable di post in tempo reale
     */
    getUserPostsObservable(limit = 10, options = { includeLikes: true }) {
        if (!this.social) {
            (0, logger_1.logError)("Social plugin not initialized");
            return (0, rxjs_1.of)([]);
        }
        if (typeof this.social.getUserPostsObservable === "function") {
            return this.social.getUserPostsObservable(limit, options);
        }
        (0, logger_1.logError)("getUserPostsObservable method not available");
        return (0, rxjs_1.of)([]);
    }
}
exports.SocialPlugin = SocialPlugin;
