import { GunUser, ISEAPair } from "gun";
import GunPlus from "../../gun_plus";
import { StateMachineEvent } from "./state-machine";
/** A valid user alias. Must be checked with the as_alias function. */
export type GunAlias = string & {
    _value: never;
};
/** A valid user password. Must be checked with the AuthManager.validate function. */
export type GunPassword = string & {
    _value: never;
};
/** An auth manager that wraps gun.user logic. */
export default class AuthManager {
    static INITIAL_STATE: "disconnected";
    static state: {
        subscribe: (cb: (state: import("./state-machine").AUTH_STATE) => any) => () => void;
        set: (event: StateMachineEvent) => void;
    };
    static instance: AuthManager;
    gunplus: GunPlus;
    /** Returns the validated alias and password information. This will also be scoped using app_scope from GunPlus */
    validate(alias: string, password: string): Promise<{
        alias: GunAlias;
        password: GunPassword;
    }>;
    /** A new AuthManager. */
    constructor(gunplus: GunPlus);
    /** Gets the user chain, if authenticated. */
    get chain(): import("gun").IGunChain<any, any, any, any>;
    /**
     * Attempt to get the pair of the currently logged in user.
     *
     * You may do `pair({strict})` to throw if the user is not authenticated.
     * */
    pair(options: {
        strict: true;
    }): ISEAPair;
    pair(options?: {
        strict?: false;
    }): ISEAPair | undefined;
    /**
     * Generate a new gun user pair using alias and password.
     *
     * @param alias - The user alias.
     * @param password - The user password.
     * @returns A promise that resolves with gun ack or rejects with gun ack on errors.
     */
    create: ({ alias, password, }: {
        alias: GunAlias;
        password: GunPassword;
    }) => Promise<{
        ok: 0;
        pub: string;
    } | {
        err: string;
    }>;
    /**
     * Authenicate existing gun user using either a pair or a alias/password combination.
     * @returns A promise that resolves with gun ack or rejects with gun ack on errors.
     */
    auth: (info: {
        alias: GunAlias;
        password: GunPassword;
    } | ISEAPair) => Promise<GunAuthAck>;
    /**
     * Un-authenticates the currently authenticated gun user.
     */
    leave: () => Promise<{
        success: true;
    }>;
    /**
     * A simple default certificate that will allow everybody to write to the users graph, as long as the key or path contains their public key.
     *
     * For more advanced things, use the make_certificate or SEA.certify function directly.
     * */
    certify(): Promise<string>;
}
export type GunAuthAck = {
    ack: 2;
    soul: string;
    get: string;
    put: GunUser;
    sea: ISEAPair;
} | {
    err: string;
};
