"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Followers = void 0;
const logger_1 = require("../../../utils/logger");
const eventEmitter_1 = require("../../../utils/eventEmitter");
/**
 * Service dedicato alle operazioni di follow/unfollow tra utenti
 */
class Followers extends eventEmitter_1.EventEmitter {
    gun;
    constructor(gunInstance) {
        super();
        this.gun = gunInstance;
    }
    /**
     * Segui un altro utente
     * @param targetPub Chiave pubblica dell'utente da seguire
     * @returns true se l'operazione è riuscita
     */
    async follow(targetPub) {
        const user = this.gun.user();
        if (!user.is || !user.is.pub) {
            throw new Error("Non autenticato");
        }
        if (targetPub === user.is.pub) {
            (0, logger_1.logWarn)("Non puoi seguire te stesso");
            return false;
        }
        try {
            const userPub = user.is.pub;
            (0, logger_1.logDebug)(`Follow: ${userPub} → ${targetPub}`);
            // Aggiungi alla lista "following" dell'utente corrente
            await new Promise((resolve, reject) => {
                this.gun
                    .user()
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
                    .user(targetPub)
                    .get("followers")
                    .get(userPub)
                    .put(true, (ack) => {
                    if (ack.err)
                        reject(new Error(ack.err));
                    else
                        resolve();
                });
            });
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
        const user = this.gun.user();
        if (!user.is || !user.is.pub) {
            throw new Error("Non autenticato");
        }
        if (targetPub === user.is.pub) {
            (0, logger_1.logWarn)("Non puoi smettere di seguire te stesso");
            return false;
        }
        try {
            const userPub = user.is.pub;
            (0, logger_1.logDebug)(`Unfollow: ${userPub} ⊘ ${targetPub}`);
            // Rimuovi dalla lista "following" dell'utente corrente
            await new Promise((resolve) => {
                this.gun
                    .user()
                    .get("following")
                    .get(targetPub)
                    .put(null, () => resolve());
            });
            // Rimuovi dalla lista "followers" dell'utente target
            await new Promise((resolve) => {
                this.gun
                    .user(targetPub)
                    .get("followers")
                    .get(userPub)
                    .put(null, () => resolve());
            });
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
     * Ottieni la lista dei follower di un utente
     * @param pub Chiave pubblica dell'utente
     * @returns Array di pub keys dei follower
     */
    async getFollowers(pub) {
        const followers = [];
        await new Promise((resolve) => {
            this.gun
                .user(pub)
                .get("followers")
                .map()
                .once((val, key) => {
                if (key !== "_" && val === true) {
                    followers.push(key);
                }
            });
            setTimeout(resolve, 500);
        });
        return followers;
    }
    /**
     * Ottieni la lista degli utenti seguiti da un utente
     * @param pub Chiave pubblica dell'utente
     * @returns Array di pub keys degli utenti seguiti
     */
    async getFollowing(pub) {
        const following = [];
        await new Promise((resolve) => {
            this.gun
                .user(pub)
                .get("following")
                .map()
                .once((val, key) => {
                if (key !== "_" && val === true) {
                    following.push(key);
                }
            });
            setTimeout(resolve, 500);
        });
        return following;
    }
}
exports.Followers = Followers;
