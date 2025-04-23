"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSubtype = exports.MessageType = void 0;
/**
 * Tipi principali di messaggio
 */
var MessageType;
(function (MessageType) {
    MessageType["POST"] = "POST";
    MessageType["PROFILE"] = "PROFILE";
    MessageType["MODERATION"] = "MODERATION";
    MessageType["CONNECTION"] = "CONNECTION";
    MessageType["FILE"] = "FILE";
})(MessageType || (exports.MessageType = MessageType = {}));
/**
 * Sottotipi di messaggio
 */
var MessageSubtype;
(function (MessageSubtype) {
    // Post subtypes
    MessageSubtype["EMPTY"] = "";
    MessageSubtype["REPLY"] = "REPLY";
    MessageSubtype["REPOST"] = "REPOST";
    // Profile subtypes
    MessageSubtype["NICKNAME"] = "NICKNAME";
    MessageSubtype["BIO"] = "BIO";
    MessageSubtype["PROFILE_IMAGE"] = "PROFILE_IMAGE";
    MessageSubtype["CUSTOM"] = "CUSTOM";
    // Moderation subtypes
    MessageSubtype["LIKE"] = "LIKE";
    MessageSubtype["BLOCK"] = "BLOCK";
    // Connection subtypes
    MessageSubtype["FOLLOW"] = "FOLLOW";
    // File subtypes
    MessageSubtype["TORRENT"] = "TORRENT";
    MessageSubtype["IPFS"] = "IPFS";
})(MessageSubtype || (exports.MessageSubtype = MessageSubtype = {}));
