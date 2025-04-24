"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendService = void 0;
const rxjs_1 = require("rxjs");
const certs_1 = require("../certificates/certs");
class FriendService {
    gun;
    currentUser;
    certificateManager;
    friendRequests$;
    friendsList$;
    constructor(gunInstance) {
        this.gun = gunInstance;
        this.currentUser = this.gun?.user();
        this.certificateManager = new certs_1.CertificateService(gunInstance);
        this.friendRequests$ = new rxjs_1.Observable((subscriber) => {
            this.gun
                .user()
                .get("friendRequests")
                .map((pub, key) => {
                if (pub) {
                    const user = this.gun.user(pub);
                    user.once((_user) => {
                        if (_user?.info && _user.pub && _user.alias) {
                            this.gun.get(_user.info["#"]).on((data) => {
                                subscriber.next({
                                    key,
                                    pub: _user.pub,
                                    alias: _user.alias,
                                    displayName: data.displayName,
                                    about: data.about || undefined,
                                });
                            });
                        }
                        else if (_user?.pub && _user.alias) {
                            subscriber.next({
                                key,
                                pub: _user.pub,
                                alias: _user.alias,
                            });
                        }
                    });
                }
                else {
                    subscriber.next(undefined);
                }
            });
        });
        this.friendsList$ = new rxjs_1.Observable((subscriber) => {
            this.gun
                .user()
                .get("friends")
                .map((pub, key) => {
                if (pub) {
                    const user = this.gun.user(pub);
                    user.once((_user) => {
                        if (_user?.info && _user.pub && _user.alias) {
                            this.gun.get(_user.info["#"]).on((data) => {
                                subscriber.next({
                                    key,
                                    pub: _user.pub,
                                    alias: _user.alias,
                                    displayName: data.displayName,
                                    about: data.about || undefined,
                                });
                            });
                        }
                        else if (_user?.pub && _user.alias) {
                            subscriber.next({
                                key,
                                pub: _user.pub,
                                alias: _user.alias,
                            });
                        }
                    });
                }
                else {
                    subscriber.next(undefined);
                }
            });
        });
    }
    addFriendRequest(publicKey, callback = () => { }) {
        (async () => {
            const cert = this.gun
                .user(publicKey)
                .get("certificates")
                .get("friendRequests")
                .once();
            this.gun
                .user(publicKey)
                .get("friendRequests")
                .set(this.currentUser.is.pub, (ack) => {
                if (ack.err) {
                    return callback({
                        errMessage: ack.err,
                        errCode: "friend-request-error",
                    });
                }
                else {
                    this.certificateManager.generateAddFriendCertificate(publicKey, (res) => res.errMessage
                        ? callback(res)
                        : callback({ success: "Friend request sent successfully." }));
                }
            }, 
            // @ts-ignore
            { opt: { cert } });
        })();
    }
    acceptFriendRequest(params, callback = () => { }) {
        const { key, publicKey } = params;
        this.gun
            .user()
            .get("friendRequests")
            .get(key)
            .put(null, async (ack) => {
            if (ack.err) {
                return callback({
                    errMessage: ack.err,
                    errCode: "accept-friend-request-failed",
                });
            }
            const cert = this.gun
                .user(publicKey)
                .get("certificates")
                .get(this.currentUser.is.pub)
                .get("addFriend")
                .once();
            this.gun
                .user(publicKey)
                .get("friends")
                .set(this.currentUser.is.pub, (ack) => {
                if (ack.err) {
                    return callback({
                        errMessage: ack.err,
                        errCode: "add-friend-failed",
                    });
                }
                this.gun
                    .user()
                    .get("friends")
                    .put(publicKey, (ack) => {
                    if (ack.err) {
                        return callback({
                            errMessage: ack.err,
                            errCode: "add-friend-failed",
                        });
                    }
                    return callback({ success: "Added friend successfully." });
                });
            }, 
            // @ts-ignore
            { opt: { cert } });
        });
    }
    rejectFriendRequest(key, callback = () => { }) {
        this.gun
            .user()
            .get("friendRequests")
            .get(key)
            .put(null, (err) => {
            if (err) {
                return callback({
                    errMessage: err,
                    errCode: "reject-friend-request-failed",
                });
            }
            return callback({ success: "Friend request removed successfully." });
        });
    }
}
exports.FriendService = FriendService;
