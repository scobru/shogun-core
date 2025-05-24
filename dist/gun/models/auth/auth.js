"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../functions/utils");
const state_machine_1 = require("./state-machine");
const cert_1 = require("./cert");
/** An auth manager that wraps gun.user logic. */
class AuthManager {
    static INITIAL_STATE = state_machine_1.states.disconnected;
    static state = (0, state_machine_1.use_machine)(state_machine_1.auth_state_machine, AuthManager.INITIAL_STATE);
    static instance;
    gunplus;
    /** Returns the validated alias and password information. This will also be scoped using app_scope from GunPlus */
    async validate(alias, password) {
        if (password.length < 8)
            throw new Error("Passwords in gun must be more than 8 characters long!");
        if (alias.length < 1)
            throw new Error("User name must be more than 0 characters long!");
        const app_scope = this.gunplus.app_scope;
        const validated_alias = (0, utils_1.app_scoped)(alias, app_scope);
        const validated_password = (0, utils_1.app_scoped)(password, app_scope);
        return { alias: validated_alias, password: validated_password };
    }
    /** A new AuthManager. */
    constructor(gunplus) {
        if (AuthManager.instance) {
            this.gunplus = AuthManager.instance.gunplus;
            return AuthManager.instance;
        }
        this.gunplus = gunplus;
        AuthManager.instance = this;
    }
    /** Gets the user chain, if authenticated. */
    get chain() {
        return this.gunplus.soul(this.pair({ strict: true }).pub).chain;
    }
    pair(options = {}) {
        const user = this.gunplus.gun.user()._;
        if ("sea" in user) {
            return user.sea;
        }
        if (options.strict) {
            throw new Error("Failed to get user pair! User is not authenticated");
        }
        return undefined;
    }
    /**
     * Generate a new gun user pair using alias and password.
     *
     * @param alias - The user alias.
     * @param password - The user password.
     * @returns A promise that resolves with gun ack or rejects with gun ack on errors.
     */
    create = async ({ alias, password, }) => {
        // Note: throws if state transitions is not possible.
        AuthManager.state.set(new state_machine_1.StateMachineEvent(state_machine_1.events.create));
        // attempt to create user.
        try {
            const res = await new Promise((resolve, reject) => {
                this.gunplus.gun;
                this.gunplus.gun.user().create(alias, password, (ack) => {
                    if ("err" in ack) {
                        reject(ack);
                        return;
                    }
                    resolve(ack);
                });
            });
            // creation success.
            AuthManager.state.set(new state_machine_1.StateMachineEvent(state_machine_1.events.success));
            return res;
        }
        catch (err) {
            // creation failure.
            AuthManager.state.set(new state_machine_1.StateMachineEvent(state_machine_1.events.fail, err));
            throw err;
        }
    };
    /**
     * Authenicate existing gun user using either a pair or a alias/password combination.
     * @returns A promise that resolves with gun ack or rejects with gun ack on errors.
     */
    auth = async (info) => {
        AuthManager.state.set(new state_machine_1.StateMachineEvent(state_machine_1.events.authenticate));
        // attempt to authenticate user.
        try {
            const res = await new Promise((resolve, reject) => {
                if ("pub" in info) {
                    this.gunplus.gun.user().auth({
                        pub: info.pub,
                        priv: info.priv,
                        epub: info.epub,
                        epriv: info.epriv,
                    }, (ack) => {
                        // TODO: Use ...spread operator. tsconfig options?
                        if ("err" in ack) {
                            reject(new Error(ack.err));
                            return;
                        }
                        else
                            resolve(ack);
                    });
                }
                else {
                    this.gunplus.gun.user().auth(info.alias, info.password, (ack) => {
                        if ("err" in ack) {
                            reject(new Error(ack.err));
                            return;
                        }
                        else
                            resolve(ack);
                    });
                }
            });
            // on auth success
            AuthManager.state.set(new state_machine_1.StateMachineEvent(state_machine_1.events.success));
            return res;
        }
        catch (err) {
            // on auth error
            AuthManager.state.set(new state_machine_1.StateMachineEvent(state_machine_1.events.fail));
            throw err;
        }
    };
    /**
     * Un-authenticates the currently authenticated gun user.
     */
    leave = async () => {
        // check if state transition is possible.
        AuthManager.state.set(new state_machine_1.StateMachineEvent(state_machine_1.events.disconnect));
        // attempt log out.
        try {
            const res = await new Promise((resolve, reject) => {
                this.gunplus.gun.user().leave();
                if (this.pair()?.pub) {
                    reject({ err: "User leave failed!" });
                    return;
                }
                resolve({ success: true });
            });
            // on success.
            AuthManager.state.set(new state_machine_1.StateMachineEvent(state_machine_1.events.success));
            return res;
        }
        catch (err) {
            // on fail.
            AuthManager.state.set(new state_machine_1.StateMachineEvent(state_machine_1.events.fail));
            throw err;
        }
    };
    /**
     * A simple default certificate that will allow everybody to write to the users graph, as long as the key or path contains their public key.
     *
     * For more advanced things, use the make_certificate or SEA.certify function directly.
     * */
    certify() {
        return (0, cert_1.make_certificate)([{ pub: "*" }], [cert_1.policies.contains_pub]);
    }
}
exports.default = AuthManager;
