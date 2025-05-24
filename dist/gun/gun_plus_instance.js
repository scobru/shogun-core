"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificates = exports.GunNode = exports.GunPlus = void 0;
// main entry point
const gun_plus_1 = __importDefault(require("./gun_plus"));
exports.GunPlus = gun_plus_1.default;
const cert_1 = require("./models/auth/cert");
const gun_node_1 = __importDefault(require("./models/gun-node"));
exports.GunNode = gun_node_1.default;
exports.default = gun_plus_1.default;
const certificates = {
    /** Make certificates. */
    make: cert_1.make_certificate,
    /** Some ready-made policies. */
    policies: cert_1.policies,
};
exports.certificates = certificates;
