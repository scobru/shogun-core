"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app_scoped = app_scoped;
/** The app-scoped version of the string. */
function app_scoped(string, scope) {
    if (scope.length > 0)
        return `${scope}-${string}`;
    return string;
}
