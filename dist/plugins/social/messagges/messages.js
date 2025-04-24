"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const gun_1 = require("gun");
const rxjs_1 = require("rxjs");
const uuid_1 = require("uuid");
class MessageService {
    gun;
    currentUser;
    chatsList$;
    constructor(gunInstance) {
        this.gun = gunInstance;
        this.currentUser = this.gun.user();
        this.chatsList$ = new rxjs_1.Observable((subscriber) => {
            this.gun
                .user()
                .get("chats")
                .on((chats) => {
                for (const pub in chats || {}) {
                    try {
                        const details = JSON.parse(chats[pub]);
                        if (details) {
                            subscriber.next({
                                roomId: details.roomId,
                                pub: details.pub,
                                latestMessage: details.latestMessage,
                            });
                        }
                    }
                    catch { } // ignore
                }
            });
        });
    }
    createChat(publicKey, callback = () => { }) {
        this.gun
            .user()
            .get("chats")
            .get(publicKey)
            .once(async (exists) => {
            if (exists) {
                return callback({
                    errMessage: "The chat already exists. Opening it now.",
                    errCode: "chat-already-exists",
                    chat: JSON.parse(exists),
                });
            }
            const friend = await this.gun.user(publicKey).once();
            const userPair = await this.gun.user()._.sea;
            const userPub = userPair.pub;
            if (!userPub) {
                return callback({
                    errMessage: "Could not find pub.",
                    errCode: "failed-to-find-pub",
                });
            }
            if (!friend) {
                return callback({
                    errMessage: "Could not find friend.",
                    errCode: "failed-to-find-friend",
                });
            }
            const cert = this.gun
                .user(publicKey)
                .get("certificates")
                .get(userPub)
                .get("chats");
            if (!cert) {
                return callback({
                    errMessage: "Could not find friend certificate to create chat",
                    errCode: "failed-to-find-friend-chats-certificate",
                });
            }
            const roomId = (0, uuid_1.v4)();
            const newChat = JSON.stringify({
                pub: userPub,
                roomId,
                latestMessage: {},
            });
            this.gun
                .user(publicKey)
                .get("chats")
                .get(userPub)
                .put(newChat, (ack) => {
                if (ack.err)
                    return callback({
                        errMessage: ack.err,
                        errCode: "chat-creation-error",
                    });
                this.gun
                    .user()
                    .get("chats")
                    .get(publicKey)
                    .put(JSON.stringify({
                    pub: friend.pub,
                    roomId,
                    latestMessage: {},
                }), (ack) => {
                    if (ack.err)
                        return callback({
                            errMessage: ack.err,
                            errCode: "chat-creation-error",
                        });
                    return callback({
                        success: "Created a chat with friend.",
                        chat: { pub: friend.pub, roomId },
                    });
                });
            }, 
            //@ts-ignore
            { opt: { cert } });
        });
    }
    messageList(roomId, pub) {
        return new rxjs_1.Observable((subscriber) => {
            async () => {
                const userPair = await this.gun.user()._.sea;
                const friend = await this.gun.user(pub).once();
                this.gun
                    .user()
                    .get("messages")
                    .get(roomId)
                    .once(async (messages) => {
                    const initial = [];
                    for (const key in messages || {}) {
                        const encrypted = messages[key].toString();
                        const secret = await gun_1.SEA.secret(friend.epub, userPair);
                        const decrypted = await gun_1.SEA.decrypt(encrypted, secret);
                        if (decrypted) {
                            const item = { ...decrypted, encrypted: true };
                            if (!initial.some((m) => m.id === item.id)) {
                                initial.push(item);
                            }
                        }
                    }
                    subscriber.next({ initial });
                    this.gun
                        .user()
                        .get("messages")
                        .get(roomId)
                        .map()
                        .once(async (msg) => {
                        const encrypted = msg.toString();
                        if (encrypted.startsWith("SEA")) {
                            const secret2 = await gun_1.SEA.secret(friend.epub, userPair);
                            const dec = await gun_1.SEA.decrypt(encrypted, secret2);
                            if (dec && !initial.some((m) => m.id === dec.id)) {
                                subscriber.next({
                                    individual: { ...dec, encrypted: true },
                                    initial: [],
                                });
                            }
                        }
                    });
                });
            };
        });
    }
    sendMessage(roomId, publicKey, message, callback = () => { }) {
        (async () => {
            const userPair = await this.gun.user()._.sea;
            const userPub = userPair.pub;
            const friend = await this.gun.user(publicKey).once();
            if (!userPub) {
                return callback({
                    errMessage: "Could not find pub.",
                    errCode: "failed-to-find-pub",
                });
            }
            const msgCert = this.gun
                .user(publicKey)
                .get("certificates")
                .get(userPub)
                .get("messages");
            if (!msgCert) {
                return callback({
                    errMessage: "Could not find friend certificate to create message",
                    errCode: "failed-to-find-friend-messages-certificate",
                });
            }
            const metaCert = this.gun
                .user(publicKey)
                .get("certificates")
                .get(userPub)
                .get("chats");
            if (!metaCert) {
                return callback({
                    errMessage: "Could not find friend certificate to add meta to chat",
                    errCode: "failed-to-find-friend-chats-certificate",
                });
            }
            const messageId = (0, uuid_1.v4)();
            const timeSent = Date.now();
            const secret = await gun_1.SEA.secret(friend.epub, userPair);
            const encrypted = await gun_1.SEA.encrypt(JSON.stringify({
                id: messageId,
                content: message,
                timeSent,
                sender: userPub,
                type: "text",
            }), secret);
            // update latest
            this.gun
                .user()
                .get("chats")
                .get(roomId)
                .get("latestMessage")
                .put(encrypted);
            this.gun
                .user(publicKey)
                .get("chats")
                .get(roomId)
                .get("latestMessage")
                .put(encrypted, () => { }, { opt: { cert: String(metaCert) } });
            // push message
            this.gun
                .user()
                .get("messages")
                .get(roomId)
                .put(encrypted, (ack) => {
                if (ack.err)
                    return callback({
                        errMessage: ack.err,
                        errCode: "message-creation-error",
                    });
                this.gun
                    .user(publicKey)
                    .get("messages")
                    .get(roomId)
                    .set(encrypted, (ack) => {
                    if (ack.err)
                        return callback({
                            errMessage: ack.err,
                            errCode: "message-creation-error",
                        });
                    return callback({ success: "Created a message with friend." });
                }, 
                //@ts-ignore
                { opt: { cert: msgCert } });
            });
        })();
    }
    sendVoiceMessage(roomId, publicKey, voiceRecording, callback = () => { }) {
        (async () => {
            const userPair = await this.gun.user()._.sea;
            const userPub = userPair.pub;
            const friend = await this.gun.user(publicKey).once();
            if (!userPub) {
                return callback({
                    errMessage: "Could not find pub.",
                    errCode: "failed-to-find-pub",
                });
            }
            const msgCert = this.gun
                .user(publicKey)
                .get("certificates")
                .get(userPub)
                .get("messages");
            if (!msgCert) {
                return callback({
                    errMessage: "Could not find friend certificate to create message",
                    errCode: "failed-to-find-friend-messages-certificate",
                });
            }
            const metaCert = this.gun
                .user(publicKey)
                .get("certificates")
                .get(userPub)
                .get("chats");
            if (!metaCert) {
                return callback({
                    errMessage: "Could not find friend certificate to add meta to chat",
                    errCode: "failed-to-find-friend-chats-certificate",
                });
            }
            // update latest
            this.gun
                .user()
                .get("chats")
                .get(roomId)
                .get("latestMessage")
                .put(voiceRecording);
            this.gun
                .user(publicKey)
                .get("chats")
                .get(roomId)
                .get("latestMessage")
                .put(voiceRecording, () => { }, { opt: { cert: String(metaCert) } });
            // push voice
            this.gun
                .user()
                .get("messages")
                .get(roomId)
                .set(voiceRecording, (ack) => {
                if (ack.err)
                    return callback({
                        errMessage: ack.err,
                        errCode: "message-creation-error",
                    });
                this.gun
                    .user(publicKey)
                    .get("messages")
                    .get(roomId)
                    .set(voiceRecording, (ack) => {
                    if (ack.err)
                        return callback({
                            errMessage: ack.err,
                            errCode: "message-creation-error",
                        });
                    return callback({
                        success: "Created a voice message with friend.",
                    });
                }, 
                //@ts-ignore
                { opt: { cert: msgCert } });
            });
        })();
    }
}
exports.MessageService = MessageService;
