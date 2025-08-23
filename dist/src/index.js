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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayPresets = exports.createRelay = exports.Relay = exports.ShogunCore = exports.Gun = exports.GunInstance = exports.GunErrors = exports.derive = exports.crypto = exports.GunRxJS = exports.SEA = void 0;
const core_1 = require("./core");
Object.defineProperty(exports, "ShogunCore", { enumerable: true, get: function () { return core_1.ShogunCore; } });
const relay_1 = require("./gundb/relay");
Object.defineProperty(exports, "Relay", { enumerable: true, get: function () { return relay_1.Relay; } });
Object.defineProperty(exports, "RelayPresets", { enumerable: true, get: function () { return relay_1.RelayPresets; } });
Object.defineProperty(exports, "createRelay", { enumerable: true, get: function () { return relay_1.createRelay; } });
const gun_Instance_1 = require("./gundb/gun-Instance");
Object.defineProperty(exports, "SEA", { enumerable: true, get: function () { return gun_Instance_1.SEA; } });
Object.defineProperty(exports, "GunRxJS", { enumerable: true, get: function () { return gun_Instance_1.GunRxJS; } });
Object.defineProperty(exports, "crypto", { enumerable: true, get: function () { return gun_Instance_1.crypto; } });
Object.defineProperty(exports, "derive", { enumerable: true, get: function () { return gun_Instance_1.derive; } });
Object.defineProperty(exports, "GunErrors", { enumerable: true, get: function () { return gun_Instance_1.GunErrors; } });
Object.defineProperty(exports, "GunInstance", { enumerable: true, get: function () { return gun_Instance_1.GunInstance; } });
// Import Gun as default export
const gun_Instance_2 = __importDefault(require("./gundb/gun-Instance"));
exports.Gun = gun_Instance_2.default;
__exportStar(require("./utils/errorHandler"), exports);
__exportStar(require("./plugins"), exports);
__exportStar(require("./types/shogun"), exports);
