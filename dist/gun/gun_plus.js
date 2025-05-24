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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gun_node_1 = __importDefault(require("./models/gun-node"));
const auth_1 = __importDefault(require("./models/auth/auth"));
/** Enhances the functionality and usability of GunDB */
class GunPlus {
    static instance;
    /** This will import gun at run time to avoid any server side-effects. */
    static async imports() {
        const Gun = (await Promise.resolve().then(() => __importStar(require("gun/gun")))).default;
        const SEA = (await Promise.resolve().then(() => __importStar(require("gun/sea")))).default;
        return { Gun, SEA };
    }
    static state = auth_1.default.state;
    Gun;
    SEA;
    gun;
    node;
    app_scope;
    id_generator;
    /** Get info about the user */
    get user() {
        return auth_1.default.instance;
    }
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
    imports, 
    /** Will place everything on an app scope under gun.get(app_scope) */
    app_scope, 
    /** Gun options that will be passed on when instantiaing. */
    options, 
    /** Configuration for the GunPlus class */
    configuration) {
        if (GunPlus.instance) {
            this.Gun = GunPlus.instance.Gun;
            this.SEA = GunPlus.instance.SEA;
            this.gun = GunPlus.instance.gun;
            this.node = GunPlus.instance.node;
            this.id_generator =
                configuration?.id_generator || (() => crypto.randomUUID());
            this.app_scope = app_scope;
            return GunPlus.instance;
        }
        this.Gun = imports.Gun;
        this.SEA = imports.SEA;
        this.gun = this.Gun(options);
        if (app_scope.length > 0) {
            this.node = new gun_node_1.default(this.gun.get(app_scope));
        }
        else {
            this.node = new gun_node_1.default(this.gun);
        }
        this.id_generator =
            configuration?.id_generator || (() => crypto.randomUUID());
        this.app_scope = app_scope;
        new auth_1.default(this); // initialize the singleton.
        GunPlus.instance = this;
    }
    /** Return the app-scoped node wrapped in the class that is passed in to the function. */
    wrap(node) {
        return new node(this.node.chain);
    }
    /** Returns the write protected space of a public key,
     * and wraps it in the specified node or standard GunNode if not specifed.
     *
     * **Example usage:**
     * ```js
     * const user = GunPlus.instance.soul("asd", UserNode);
     * const group_stream = user.groups.stream();
     * ```
     * */
    soul(pub, node) {
        const node_class = node ? node : gun_node_1.default;
        return new node_class(this.gun.get(`~${pub}`));
    }
    /**
     *
     * Creates a new node with an id in `gun.get("your-app-scope").get("nodes")`
     */
    new(node, id) {
        const node_class = node ? node : gun_node_1.default;
        const the_id = id ? id : this.id_generator();
        return new node_class(this.node.get("nodes").get(the_id).chain);
    }
}
exports.default = GunPlus;
