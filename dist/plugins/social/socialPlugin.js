"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialPlugin = void 0;
// src/plugins/social/socialPlugin.ts
const base_1 = require("../base");
const social_1 = require("./social");
const logger_1 = require("../../utils/logger");
class SocialPlugin extends base_1.BasePlugin {
    name = "social";
    version = "1.0.2";
    description = "Social plugin using GunDB for storage and real-time updates";
    social = null;
    get user() {
        return this.social?.user || null;
    }
    initialize(core) {
        super.initialize(core);
        this.social = new social_1.Social(core.gun);
        (0, logger_1.log)("Social plugin initialized");
    }
    destroy() {
        this.social?.cleanup();
        this.social = null;
        super.destroy();
        (0, logger_1.log)("Social plugin destroyed");
    }
    async getProfile(pub) {
        return this.social.getProfile(pub);
    }
    async post(content) {
        return this.social.post(content);
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
    async addComment(postId, content) {
        return this.social.addComment(postId, content);
    }
    async getComments(postId) {
        return this.social.getComments(postId);
    }
    async getTimeline() {
        return this.social.getTimeline();
    }
    async follow(pub) {
        return this.social.follow(pub);
    }
    async unfollow(pub) {
        return this.social.unfollow(pub);
    }
    cleanup() {
        this.social.cleanup();
    }
}
exports.SocialPlugin = SocialPlugin;
