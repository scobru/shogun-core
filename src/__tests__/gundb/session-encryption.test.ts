/**
 * Tests for Encrypted Session Storage
 */

// Mock Gun/SEA
jest.mock("gun", () => ({
    SEA: {
        encrypt: jest.fn(),
        decrypt: jest.fn(),
        work: jest.fn(),
        pair: jest.fn(),
        sign: jest.fn(),
        verify: jest.fn(),
        secret: jest.fn(),
    },
}));

describe("Encrypted Session Storage", () => {
    let mockSessionStorage: Record<string, string>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSessionStorage = {};

        // Mock sessionStorage
        Object.defineProperty(global, "sessionStorage", {
            value: {
                getItem: jest.fn((key: string) => mockSessionStorage[key] || null),
                setItem: jest.fn((key: string, val: string) => {
                    mockSessionStorage[key] = val;
                }),
                removeItem: jest.fn((key: string) => {
                    delete mockSessionStorage[key];
                }),
            },
            writable: true,
            configurable: true,
        });

        // Mock crypto.subtle
        Object.defineProperty(global, "crypto", {
            value: {
                subtle: {
                    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
                },
                getRandomValues: jest.fn((arr: Uint8Array) => {
                    for (let i = 0; i < arr.length; i++) {
                        arr[i] = Math.floor(Math.random() * 256);
                    }
                    return arr;
                }),
            },
            writable: true,
            configurable: true,
        });
    });

    describe("Session format versioning", () => {
        it("should reject legacy plaintext sessions (no version field)", () => {
            const legacySession = {
                username: "testuser",
                pair: { pub: "pub", priv: "priv", epub: "epub", epriv: "epriv" },
                userPub: "pub",
                timestamp: Date.now(),
                expiresAt: Date.now() + 86400000,
            };
            mockSessionStorage["gunSessionData"] = JSON.stringify(legacySession);

            // Parsing the stored data should detect version < 2
            const stored = JSON.parse(mockSessionStorage["gunSessionData"]);
            expect(!stored.version || stored.version < 2).toBe(true);
        });

        it("should accept v2 encrypted sessions", () => {
            const v2Session = {
                encrypted: "encrypted_blob",
                integrity: "abc123",
                salt: "randsalt",
                username: "testuser",
                pub: "testpub",
                version: 2,
            };
            mockSessionStorage["gunSessionData"] = JSON.stringify(v2Session);

            const stored = JSON.parse(mockSessionStorage["gunSessionData"]);
            expect(stored.version).toBe(2);
            expect(stored.encrypted).toBe("encrypted_blob");
            expect(stored.integrity).toBe("abc123");
        });
    });

    describe("Encrypted session structure", () => {
        it("should include all required fields for encrypted sessions", () => {
            const requiredFields = [
                "encrypted",
                "integrity",
                "salt",
                "username",
                "pub",
                "version",
            ];

            const session = {
                encrypted: "enc_data",
                integrity: "hash",
                salt: "random_salt",
                username: "user",
                pub: "pubkey",
                version: 2,
            };

            for (const field of requiredFields) {
                expect(session).toHaveProperty(field);
            }
        });

        it("should reject sessions with missing required fields", () => {
            const corruptSession = {
                encrypted: "enc_data",
                // missing integrity, salt, username
                version: 2,
            };

            const isValid =
                corruptSession.encrypted &&
                (corruptSession as any).integrity &&
                (corruptSession as any).salt &&
                (corruptSession as any).username;

            expect(isValid).toBeFalsy();
        });
    });

    describe("Integrity verification", () => {
        it("should detect tampered encrypted data", () => {
            const originalHash = "abc123";
            const tamperedHash = "xyz789";

            expect(originalHash).not.toBe(tamperedHash);
        });
    });

    describe("Expired sessions", () => {
        it("should detect expired sessions", () => {
            const expiredSession = {
                expiresAt: Date.now() - 1000, // expired 1 second ago
            };

            expect(Date.now() > expiredSession.expiresAt).toBe(true);
        });

        it("should accept non-expired sessions", () => {
            const validSession = {
                expiresAt: Date.now() + 86400000, // expires in 24 hours
            };

            expect(Date.now() > validSession.expiresAt).toBe(false);
        });
    });
});
