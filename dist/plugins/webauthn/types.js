"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAuthnEventType = void 0;
/**
 * WebAuthn event types
 */
var WebAuthnEventType;
(function (WebAuthnEventType) {
    WebAuthnEventType["DEVICE_REGISTERED"] = "deviceRegistered";
    WebAuthnEventType["DEVICE_REMOVED"] = "deviceRemoved";
    WebAuthnEventType["AUTHENTICATION_SUCCESS"] = "authenticationSuccess";
    WebAuthnEventType["AUTHENTICATION_FAILED"] = "authenticationFailed";
    WebAuthnEventType["ERROR"] = "error";
})(WebAuthnEventType || (exports.WebAuthnEventType = WebAuthnEventType = {}));
