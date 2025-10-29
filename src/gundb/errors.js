"use strict";
/**
 * Error classes for Gun and Auth
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.MultipleAuthError = exports.TimeoutError = exports.UserExists = exports.InvalidCredentials = exports.AuthError = exports.GunError = void 0;
/**
 * Base error for Gun
 */
var GunError = /** @class */ (function (_super) {
    __extends(GunError, _super);
    function GunError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "GunError";
        return _this;
    }
    return GunError;
}(Error));
exports.GunError = GunError;
/**
 * Generic authentication error
 */
var AuthError = /** @class */ (function (_super) {
    __extends(AuthError, _super);
    function AuthError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "AuthError";
        return _this;
    }
    return AuthError;
}(GunError));
exports.AuthError = AuthError;
/**
 * Invalid credentials error
 */
var InvalidCredentials = /** @class */ (function (_super) {
    __extends(InvalidCredentials, _super);
    function InvalidCredentials(message) {
        if (message === void 0) { message = "Credenziali non valide"; }
        var _this = _super.call(this, message) || this;
        _this.name = "InvalidCredentials";
        return _this;
    }
    return InvalidCredentials;
}(AuthError));
exports.InvalidCredentials = InvalidCredentials;
/**
 * User already exists error
 */
var UserExists = /** @class */ (function (_super) {
    __extends(UserExists, _super);
    function UserExists(message) {
        if (message === void 0) { message = "Utente già esistente"; }
        var _this = _super.call(this, message) || this;
        _this.name = "UserExists";
        return _this;
    }
    return UserExists;
}(AuthError));
exports.UserExists = UserExists;
/**
 * Timeout error
 */
var TimeoutError = /** @class */ (function (_super) {
    __extends(TimeoutError, _super);
    function TimeoutError(message) {
        if (message === void 0) { message = "Timeout durante l'operazione"; }
        var _this = _super.call(this, message) || this;
        _this.name = "TimeoutError";
        return _this;
    }
    return TimeoutError;
}(GunError));
exports.TimeoutError = TimeoutError;
/**
 * Multiple authentication error
 */
var MultipleAuthError = /** @class */ (function (_super) {
    __extends(MultipleAuthError, _super);
    function MultipleAuthError(message) {
        if (message === void 0) { message = "Autenticazione multipla in corso"; }
        var _this = _super.call(this, message) || this;
        _this.name = "MultipleAuthError";
        return _this;
    }
    return MultipleAuthError;
}(AuthError));
exports.MultipleAuthError = MultipleAuthError;
/** Base error related to the network. */
var NetworkError = /** @class */ (function (_super) {
    __extends(NetworkError, _super);
    function NetworkError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return NetworkError;
}(GunError));
exports.NetworkError = NetworkError;
var withDefaultMessage = function (args, defaultMessage) {
    if (args.length === 0 || (args.length === 1 && !args[0])) {
        args = [defaultMessage];
    }
    return args;
};
