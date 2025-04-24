"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GunRxJS = void 0;
const rxjs_1 = require("rxjs");
class GunRxJS {
    gun;
    constructor(gun) {
        this.gun = gun;
    }
    /**
     * Crea un Observable da un riferimento Gun
     */
    observe(path) {
        return new rxjs_1.Observable((subscriber) => {
            const ref = this.gun.get(path);
            const callback = (data) => {
                if (data === null || data === undefined) {
                    subscriber.next(null);
                    return;
                }
                subscriber.next(data);
            };
            ref.on((data) => {
                if (data === null || data === undefined) {
                    subscriber.next(null);
                    return;
                }
                subscriber.next(data);
            });
            // Cleanup quando l'Observable viene unsubscribed
            return () => {
                ref.off();
            };
        });
    }
}
exports.GunRxJS = GunRxJS;
