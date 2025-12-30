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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RxJSHolster = exports.DataBaseHolster = void 0;
// Export the main class
__exportStar(require("./db"), exports);
__exportStar(require("./gun-es"), exports);
var db_holster_1 = require("./db-holster");
Object.defineProperty(exports, "DataBaseHolster", { enumerable: true, get: function () { return db_holster_1.DataBaseHolster; } });
var rxjs_holster_1 = require("./rxjs-holster");
Object.defineProperty(exports, "RxJSHolster", { enumerable: true, get: function () { return rxjs_holster_1.RxJSHolster; } });
// Export improved types
__exportStar(require("./types"), exports);
