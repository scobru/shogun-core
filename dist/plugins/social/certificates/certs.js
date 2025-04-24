"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateService = void 0;
const gun_1 = require("gun");
class CertificateService {
    gun;
    constructor(gunInstance) {
        this.gun = gunInstance;
    }
    async generateFriendRequestsCertificate(callback = () => { }) {
        const exists = this.gun
            .user()
            .get("certificates")
            .get("friendRequests")
            .once();
        if (exists)
            return;
        const userPair = await this.gun.user()._.sea;
        const cb = () => {
            console.log("Certificato generato");
        };
        const certificate = await gun_1.SEA.certify(["*"], [{ "*": "friendRequests" }], userPair, cb);
        this.gun
            .user()
            .get("certificates")
            .get("friendRequests")
            .put(certificate, (ack) => {
            if (ack.err) {
                return callback({
                    errMessage: "Errore durante il salvataggio del certificato",
                    errCode: "gun-put-error",
                });
            }
            else {
                return callback({
                    certificate,
                    success: "Generated new friend requests certificate.",
                });
            }
        });
    }
    async generateAddFriendCertificate(publicKey, callback = () => { }) {
        const exists = this.gun
            .user()
            .get("certificates")
            .get(publicKey)
            .get("addFriend")
            .once();
        if (exists)
            return;
        const certificate = await gun_1.SEA.certify([publicKey], [{ "*": "friends" }], await this.gun.user()._.sea, () => {
            console.log("Certificato generato");
        });
        this.gun
            .user()
            .get("certificates")
            .get(publicKey)
            .get("addFriend")
            .put(certificate, (ack) => {
            if (ack.err) {
                return callback({
                    errMessage: "Errore durante il salvataggio del certificato",
                    errCode: "gun-put-error",
                });
            }
            else {
                return callback({
                    certificate,
                    success: "Generated certificate for requested friend to add user back.",
                });
            }
        });
    }
    async createChatsCertificate(publicKey, callback = () => { }) {
        const exists = this.gun
            .user()
            .get("certificates")
            .get(publicKey)
            .get("chats")
            .once();
        if (exists)
            return;
        const certificate = await gun_1.SEA.certify([publicKey], [{ "*": "chats" }], await this.gun.user()._.sea, () => {
            console.log("Certificato generato");
        });
        this.gun
            .user()
            .get("certificates")
            .get(publicKey)
            .get("chats")
            .put(certificate, (ack) => {
            if (ack.err) {
                return callback({
                    errMessage: "Errore durante il salvataggio del certificato",
                    errCode: "chats-certificate-creation-error",
                });
            }
            else {
                return callback({
                    certificate,
                    success: "Generated new chats certificate.",
                });
            }
        });
    }
    async createMessagesCertificate(publicKey, callback = () => { }) {
        const exists = this.gun
            .user()
            .get("certificates")
            .get(publicKey)
            .get("messages")
            .once();
        if (exists)
            return;
        const certificate = await gun_1.SEA.certify([publicKey], [{ "*": "messages" }], await this.gun.user()._.sea, () => {
            console.log("Certificato generato");
        });
        this.gun
            .user()
            .get("certificates")
            .get(publicKey)
            .get("messages")
            .put(certificate, (ack) => {
            if (ack.err) {
                return callback({
                    errMessage: "Errore durante il salvataggio del certificato",
                    errCode: "messages-certificate-creation-error",
                });
            }
            else {
                return callback({
                    certificate,
                    success: "Generated new messages certificate.",
                });
            }
        });
    }
}
exports.CertificateService = CertificateService;
