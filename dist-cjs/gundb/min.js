"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEA = exports.Gun = void 0;
const gun_1 = __importDefault(require("gun"));
exports.Gun = gun_1.default;
const sea_js_1 = __importDefault(require("gun/sea.js"));
Object.defineProperty(exports, "SEA", { enumerable: true, get: function () { return sea_js_1.default; } });
