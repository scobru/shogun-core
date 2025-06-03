"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app_scoped = exports.getArrayFromIndexedObject = exports.getIndexedObjectFromArray = exports.qs = exports.getSet = exports.getUUID = exports.getTargetPub = exports.getPub = exports.getId = exports.derive = exports.SEA = exports.Gun = exports.GunDB = void 0;
// Export the main class
var instance_1 = require("./instance");
Object.defineProperty(exports, "GunDB", { enumerable: true, get: function () { return instance_1.GunDB; } });
var gun_es_1 = require("./gun-es/gun-es");
Object.defineProperty(exports, "Gun", { enumerable: true, get: function () { return gun_es_1.Gun; } });
Object.defineProperty(exports, "SEA", { enumerable: true, get: function () { return gun_es_1.SEA; } });
// Export derive functionality
var derive_1 = require("./derive");
Object.defineProperty(exports, "derive", { enumerable: true, get: function () { return __importDefault(derive_1).default; } });
// Export utils
var utils_1 = require("./utils");
Object.defineProperty(exports, "getId", { enumerable: true, get: function () { return utils_1.getId; } });
Object.defineProperty(exports, "getPub", { enumerable: true, get: function () { return utils_1.getPub; } });
Object.defineProperty(exports, "getTargetPub", { enumerable: true, get: function () { return utils_1.getTargetPub; } });
Object.defineProperty(exports, "getUUID", { enumerable: true, get: function () { return utils_1.getUUID; } });
Object.defineProperty(exports, "getSet", { enumerable: true, get: function () { return utils_1.getSet; } });
Object.defineProperty(exports, "qs", { enumerable: true, get: function () { return utils_1.qs; } });
Object.defineProperty(exports, "getIndexedObjectFromArray", { enumerable: true, get: function () { return utils_1.getIndexedObjectFromArray; } });
Object.defineProperty(exports, "getArrayFromIndexedObject", { enumerable: true, get: function () { return utils_1.getArrayFromIndexedObject; } });
Object.defineProperty(exports, "app_scoped", { enumerable: true, get: function () { return utils_1.app_scoped; } });
