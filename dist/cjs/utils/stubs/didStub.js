"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShogunDID = void 0;
/**
 * DID stub for light version
 * Include only basic functionality - advanced features must be lazy loaded
 */
class DIDStub {
    constructor() {
        console.warn("DID functionality disabled in light version. Import full version or lazy load DID module.");
    }
    async createDID() {
        throw new Error("DID functionality disabled in light version");
    }
    async getCurrentUserDID() {
        throw new Error("DID functionality disabled in light version");
    }
    async resolveDID() {
        throw new Error("DID functionality disabled in light version");
    }
    async authenticateWithDID() {
        throw new Error("DID functionality disabled in light version");
    }
    async updateDIDDocument() {
        throw new Error("DID functionality disabled in light version");
    }
    async deactivateDID() {
        throw new Error("DID functionality disabled in light version");
    }
    isValidDID() {
        throw new Error("DID functionality disabled in light version");
    }
}
exports.ShogunDID = DIDStub;
exports.default = DIDStub;
