var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { EventEmitter } from '../utils/eventEmitter.js';
/**
 * Classe base per tutti i plugin di ShogunCore
 * Fornisce funzionalità comuni e implementazione base dell'interfaccia ShogunPlugin
 */
var BasePlugin = /** @class */ (function (_super) {
    __extends(BasePlugin, _super);
    function BasePlugin() {
        var _this = _super.apply(this, __spreadArray([], __read(arguments), false)) || this;
        /** Riferimento all'istanza di ShogunCore */
        _this.core = null;
        return _this;
    }
    /**
     * Inizializza il plugin con un'istanza di ShogunCore
     * @param core Istanza di ShogunCore
     */
    BasePlugin.prototype.initialize = function (core) {
        this.core = core;
    };
    /**
     * Distrugge il plugin e libera le risorse
     */
    BasePlugin.prototype.destroy = function () {
        try {
            // Emetti evento di distruzione
            this.emit('destroyed', {
                name: this.name,
                version: this.version,
            });
            this.core = null;
        }
        catch (error) {
            console.error("[".concat(this.name, "] Error during plugin destruction:"), error);
        }
    };
    /**
     * Verifica che il plugin sia stato inizializzato prima di usare il core
     * @throws Error se il plugin non è stato inizializzato
     * @returns L'istanza di ShogunCore non null
     */
    BasePlugin.prototype.assertInitialized = function () {
        if (!this.core) {
            throw new Error("Plugin ".concat(this.name, " not initialized"));
        }
        return this.core;
    };
    return BasePlugin;
}(EventEmitter));
export { BasePlugin };
