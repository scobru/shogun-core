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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateService = exports.FriendService = exports.MessageService = exports.PostService = exports.socialPlugin = void 0;
__exportStar(require("./socialPlugin"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./social"), exports);
var socialPlugin_1 = require("./socialPlugin");
Object.defineProperty(exports, "socialPlugin", { enumerable: true, get: function () { return socialPlugin_1.SocialPlugin; } });
// Esportazioni dei servizi
var posts_1 = require("./posts/posts");
Object.defineProperty(exports, "PostService", { enumerable: true, get: function () { return posts_1.PostService; } });
var messages_1 = require("./messagges/messages");
Object.defineProperty(exports, "MessageService", { enumerable: true, get: function () { return messages_1.MessageService; } });
var friends_1 = require("./friends/friends");
Object.defineProperty(exports, "FriendService", { enumerable: true, get: function () { return friends_1.FriendService; } });
var certs_1 = require("./certificates/certs");
Object.defineProperty(exports, "CertificateService", { enumerable: true, get: function () { return certs_1.CertificateService; } });
// Esportazione degli schemi
__exportStar(require("./schemas"), exports);
