"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayBufferToBase64 = exports.base64ToArrayBuffer = exports.concatArrayBuffers = exports.hexToBuffer = exports.bufferToHex = exports.sha3_512Hash = exports.sha512Hash = exports.sha256Hash = exports.randomString = void 0;
// Cryptographically Random String Generator
var randomString = function (additionalSalt) {
    if (additionalSalt === void 0) { additionalSalt = ""; }
    var randomStringLength = 16;
    var randomValues = crypto.getRandomValues(new Uint8Array(randomStringLength));
    var randomHex = Array.from(randomValues)
        .map(function (byte) { return byte.toString(16).padStart(2, "0"); })
        .join("");
    return additionalSalt ? additionalSalt + randomHex : randomHex;
};
exports.randomString = randomString;
// Hashing Methods
var sha256Hash = function (input) { return __awaiter(void 0, void 0, void 0, function () {
    var inputString, encoder, data, hashBuffer, hashArray;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                inputString = JSON.stringify(input);
                encoder = new TextEncoder();
                data = encoder.encode(inputString);
                return [4 /*yield*/, crypto.subtle.digest("SHA-256", data)];
            case 1:
                hashBuffer = _a.sent();
                hashArray = Array.from(new Uint8Array(hashBuffer));
                return [2 /*return*/, hashArray.map(function (byte) { return byte.toString(16).padStart(2, "0"); }).join("")];
        }
    });
}); };
exports.sha256Hash = sha256Hash;
var sha512Hash = function (input) { return __awaiter(void 0, void 0, void 0, function () {
    var inputString, encoder, data, hashBuffer, hashArray;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                inputString = JSON.stringify(input);
                encoder = new TextEncoder();
                data = encoder.encode(inputString);
                return [4 /*yield*/, crypto.subtle.digest("SHA-512", data)];
            case 1:
                hashBuffer = _a.sent();
                hashArray = Array.from(new Uint8Array(hashBuffer));
                return [2 /*return*/, hashArray.map(function (byte) { return byte.toString(16).padStart(2, "0"); }).join("")];
        }
    });
}); };
exports.sha512Hash = sha512Hash;
var sha3_512Hash = function (input) { return __awaiter(void 0, void 0, void 0, function () {
    var inputString, encoder, data, hashBuffer, hashArray;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                inputString = JSON.stringify(input);
                encoder = new TextEncoder();
                data = encoder.encode(inputString);
                return [4 /*yield*/, crypto.subtle.digest("SHA-512", data)];
            case 1:
                hashBuffer = _a.sent();
                hashArray = Array.from(new Uint8Array(hashBuffer));
                return [2 /*return*/, hashArray.map(function (byte) { return byte.toString(16).padStart(2, "0"); }).join("")];
        }
    });
}); };
exports.sha3_512Hash = sha3_512Hash;
// Utility functions for crypto operations
var bufferToHex = function (buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(function (b) { return b.toString(16).padStart(2, "0"); })
        .join("");
};
exports.bufferToHex = bufferToHex;
var hexToBuffer = function (hex) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
};
exports.hexToBuffer = hexToBuffer;
var concatArrayBuffers = function () {
    var buffers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        buffers[_i] = arguments[_i];
    }
    var totalLength = buffers.reduce(function (sum, buf) { return sum + buf.byteLength; }, 0);
    var result = new Uint8Array(totalLength);
    var offset = 0;
    for (var _a = 0, buffers_1 = buffers; _a < buffers_1.length; _a++) {
        var buffer = buffers_1[_a];
        result.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
    }
    return result.buffer;
};
exports.concatArrayBuffers = concatArrayBuffers;
var base64ToArrayBuffer = function (base64) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};
exports.base64ToArrayBuffer = base64ToArrayBuffer;
var arrayBufferToBase64 = function (buffer) {
    var bytes = new Uint8Array(buffer);
    var binary = "";
    for (var i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};
exports.arrayBufferToBase64 = arrayBufferToBase64;
