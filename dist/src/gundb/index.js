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
exports.RelayPresets = exports.createRelay = void 0;
// Export the main class
__exportStar(require("./gun-Instance"), exports);
// Export relay components (excluding Relay class which is already exported)
var relay_1 = require("./relay");
Object.defineProperty(exports, "createRelay", { enumerable: true, get: function () { return relay_1.createRelay; } });
Object.defineProperty(exports, "RelayPresets", { enumerable: true, get: function () { return relay_1.RelayPresets; } });
