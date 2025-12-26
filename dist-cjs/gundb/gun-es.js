"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEA = exports.Gun = void 0;
// Import Gun and SEA FIRST - extensions depend on Gun.chain being defined
const gun_1 = __importDefault(require("gun"));
exports.Gun = gun_1.default;
require("gun/sea.js");
// Now import Gun extensions - they can safely access Gun.chain
require("gun/lib/then.js");
require("gun/lib/radix.js");
require("gun/lib/radisk.js");
require("gun/lib/store.js");
require("gun/lib/rindexed.js");
require("gun/lib/webrtc.js");
var sea_js_1 = require("gun/sea.js");
Object.defineProperty(exports, "SEA", { enumerable: true, get: function () { return __importDefault(sea_js_1).default; } });
