"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const logger_1 = require("../../../utils/logger");
const eventEmitter_1 = require("../../../utils/eventEmitter");
/**
 * Service dedicato alla gestione dei profili utente
 */
class Profile extends eventEmitter_1.EventEmitter {
    gun;
    profileCache = new Map();
    cacheDuration = 5 * 60 * 1000; // 5 minuti
    constructor(gunInstance) {
        super();
        this.gun = gunInstance;
    }
    /**
     * Ottieni il profilo di un utente
     * @param pub Chiave pubblica dell'utente
     * @returns Profilo dell'utente
     */
    async getProfile(pub) {
        // Controlla se il profilo è nella cache
        const cached = this.profileCache.get(pub);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }
        // Profilo vuoto con dati minimi
        const profile = {
            pub,
            followers: [],
            following: [],
            customFields: {},
        };
        try {
            // Ottieni dati profilo
            await new Promise((resolve) => {
                this.gun
                    .user(pub)
                    .get('_')
                    .once((userData) => {
                    if (userData) {
                        if (userData.alias)
                            profile.alias = userData.alias;
                        if (userData.bio)
                            profile.bio = userData.bio;
                        if (userData.profileImage)
                            profile.profileImage = userData.profileImage;
                    }
                    resolve();
                });
            });
            // Recuperare i follower e following - questo sarà fatto dal FollowerService
            // Salva in cache
            this.profileCache.set(pub, { data: profile, timestamp: Date.now() });
            return profile;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore caricamento profilo: ${err}`);
            return profile;
        }
    }
    /**
     * Aggiorna un campo del profilo
     * @param field Nome del campo da aggiornare
     * @param value Nuovo valore
     * @returns true se l'operazione è riuscita
     */
    async updateProfile(field, value) {
        const user = this.gun.user();
        if (!user.is || !user.is.pub) {
            throw new Error("Non autenticato");
        }
        try {
            await new Promise((resolve, reject) => {
                this.gun
                    .user()
                    .get("profile")
                    .get(field)
                    .put(value, (ack) => {
                    if (ack.err)
                        reject(new Error(ack.err));
                    else
                        resolve();
                });
            });
            // Invalida cache
            this.profileCache.delete(user.is.pub);
            // Emetti evento
            this.emit("profile:update", { field, value });
            return true;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore aggiornamento profilo: ${err}`);
            return false;
        }
    }
    /**
     * Aggiorna campi multipli del profilo
     * @param fields Record di campo-valore da aggiornare
     * @returns true se l'operazione è riuscita
     */
    async updateProfileFields(fields) {
        const user = this.gun.user();
        if (!user.is || !user.is.pub) {
            throw new Error("Non autenticato");
        }
        try {
            for (const [field, value] of Object.entries(fields)) {
                await new Promise((resolve, reject) => {
                    this.gun
                        .user()
                        .get("profile")
                        .get(field)
                        .put(value, (ack) => {
                        if (ack.err)
                            reject(new Error(ack.err));
                        else
                            resolve();
                    });
                });
            }
            // Invalida cache
            this.profileCache.delete(user.is.pub);
            // Emetti evento
            this.emit("profile:update:multiple", fields);
            return true;
        }
        catch (err) {
            (0, logger_1.logError)(`Errore aggiornamento campi profilo: ${err}`);
            return false;
        }
    }
    /**
     * Pulisce la cache dei profili
     */
    clearCache() {
        this.profileCache.clear();
        (0, logger_1.logDebug)("Cache profili pulita");
    }
}
exports.Profile = Profile;
