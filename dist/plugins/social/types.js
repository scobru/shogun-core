"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSubtype = exports.MessageType = void 0;
/**
 * Tipi di messaggio supportati
 */
var MessageType;
(function (MessageType) {
    MessageType["POST"] = "post";
    MessageType["DIRECT"] = "direct";
    MessageType["NOTIFICATION"] = "notification";
    MessageType["SYSTEM"] = "system";
})(MessageType || (exports.MessageType = MessageType = {}));
/**
 * Sottotipi di messaggio
 */
var MessageSubtype;
(function (MessageSubtype) {
    MessageSubtype["EMPTY"] = "";
    MessageSubtype["TEXT"] = "text";
    MessageSubtype["IMAGE"] = "image";
    MessageSubtype["LIKE"] = "like";
    MessageSubtype["COMMENT"] = "comment";
    MessageSubtype["FOLLOW"] = "follow";
})(MessageSubtype || (exports.MessageSubtype = MessageSubtype = {}));
