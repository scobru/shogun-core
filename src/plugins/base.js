"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlugin = void 0;
var eventEmitter_1 = require("../utils/eventEmitter");
/**
 * Classe base per tutti i plugin di ShogunCore
 * Fornisce funzionalità comuni e implementazione base dell'interfaccia ShogunPlugin
 */
var BasePlugin = /** @class */ (function (_super) {
    __extends(BasePlugin, _super);
    function BasePlugin() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
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
            this.emit("destroyed", {
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
}(eventEmitter_1.EventEmitter));
exports.BasePlugin = BasePlugin;
