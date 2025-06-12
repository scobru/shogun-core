"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEA = exports.Gun = exports.GunInstance = void 0;
// Export the main class
var gunInstance_1 = require("./gunInstance");
Object.defineProperty(exports, "GunInstance", { enumerable: true, get: function () { return gunInstance_1.GunInstance; } });
var gun_es_1 = require("./gun-es/gun-es");
Object.defineProperty(exports, "Gun", { enumerable: true, get: function () { return gun_es_1.Gun; } });
Object.defineProperty(exports, "SEA", { enumerable: true, get: function () { return gun_es_1.SEA; } });
