import type { GunOptions, IGun, IGunChain, IGunInstance, ISEA } from "gun";
import GunNode from "./models/gun-node";
import AuthManager from "./models/auth/auth";
/**
 * Configuration object for the GunPlusClass
 */
type GunPlusConfiguration = {
    /** Default id generator. Used by e.g. `GunPlus.instance.new` function. */
    id_generator: () => string;
};
type GunImports = {
    Gun: IGun;
    SEA: ISEA;
};
/** Enhances the functionality and usability of GunDB */
export default class GunPlus {
    static instance: GunPlus;
    /** This will import gun at run time to avoid any server side-effects. */
    static imports(): Promise<GunImports>;
    static state: {
        subscribe: (cb: (state: import("./models/auth/state-machine").AUTH_STATE) => any) => () => void;
        set: (event: import("./models/auth/state-machine").StateMachineEvent) => void;
    };
    Gun: IGun;
    SEA: ISEA;
    gun: IGunInstance<any>;
    node: GunNode;
    app_scope: string;
    id_generator: GunPlusConfiguration["id_generator"];
    /** Get info about the user */
    get user(): AuthManager;
    /**
     * __Example Usage__:
     *
     * instantiate
     * ```js
     * class EntryNode extends GunNode {...}
     * new GunPlus<EntryNode>("some-app-scope", EntryNode, {peers});
     * ```
     * use
     * ```js
     * GunPlus.instance.node.some.key.put("value");
     * ```
     */
    constructor(
    /** Main Gun components, loaded from GunPlus.import_gun */
    imports: GunImports, 
    /** Will place everything on an app scope under gun.get(app_scope) */
    app_scope: string, 
    /** Gun options that will be passed on when instantiaing. */
    options: GunOptions, 
    /** Configuration for the GunPlus class */
    configuration?: GunPlusConfiguration);
    /** Return the app-scoped node wrapped in the class that is passed in to the function. */
    wrap<T extends GunNode>(node: GunNodeClassSimple<T>): T;
    /** Returns the write protected space of a public key,
     * and wraps it in the specified node or standard GunNode if not specifed.
     *
     * **Example usage:**
     * ```js
     * const user = GunPlus.instance.soul("asd", UserNode);
     * const group_stream = user.groups.stream();
     * ```
     * */
    soul<T extends GunNode>(pub: string, node?: GunNodeClassSimple<T>): T;
    /**
     *
     * Creates a new node with an id in `gun.get("your-app-scope").get("nodes")`
     */
    new<T extends GunNode>(node?: GunNodeClassSimple<T>, id?: string): T;
}
export type GunNodeClassSimple<T> = new (chain: IGunChain<any>) => T;
export type GunNodeClass<T> = new (chain: IGunChain<any>, options?: {
    certificate?: string;
    iterates?: GunNodeClass<T>;
}) => T;
export {};
