/**
 * WebAuthn event types
 */
export var WebAuthnEventType;
(function (WebAuthnEventType) {
    WebAuthnEventType["DEVICE_REGISTERED"] = "deviceRegistered";
    WebAuthnEventType["DEVICE_REMOVED"] = "deviceRemoved";
    WebAuthnEventType["AUTHENTICATION_SUCCESS"] = "authenticationSuccess";
    WebAuthnEventType["AUTHENTICATION_FAILED"] = "authenticationFailed";
    WebAuthnEventType["ERROR"] = "error";
})(WebAuthnEventType || (WebAuthnEventType = {}));
