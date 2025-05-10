"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIDEventType = void 0;
/**
 * DID Event types
 */
var DIDEventType;
(function (DIDEventType) {
    DIDEventType["CREATED"] = "didCreated";
    DIDEventType["UPDATED"] = "didUpdated";
    DIDEventType["DEACTIVATED"] = "didDeactivated";
    DIDEventType["REGISTERED"] = "didRegistered";
    DIDEventType["ERROR"] = "didError";
})(DIDEventType || (exports.DIDEventType = DIDEventType = {}));
