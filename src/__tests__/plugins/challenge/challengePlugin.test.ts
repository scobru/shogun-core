/**
 * Tests for Challenge-Response Authentication Plugin
 */

import { ChallengePlugin } from "../../../plugins/challenge/challengePlugin";

// Mock Gun SEA globally
const mockSEA = {
    sign: jest.fn(),
    verify: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    work: jest.fn(),
    pair: jest.fn(),
};

(global as any).SEA = mockSEA;
(global as any).Gun = { SEA: mockSEA };

// Mock fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe("ChallengePlugin", () => {
    let plugin: ChallengePlugin;

    beforeEach(() => {
        jest.clearAllMocks();
        plugin = new ChallengePlugin();
    });

    describe("plugin metadata", () => {
        it("should have correct name and version", () => {
            expect(plugin.name).toBe("challenge");
            expect(plugin.version).toBe("1.0.0");
        });

        it("should have authentication category", () => {
            expect(plugin._category).toBe("authentication");
        });
    });

    describe("signChallenge", () => {
        it("should sign a challenge string with SEA", async () => {
            const challenge = "random-challenge-string-12345";
            const pair = { pub: "test_pub_key", priv: "test_priv_key" };
            const expectedSignature = "signed_challenge_data";

            mockSEA.sign.mockResolvedValue(expectedSignature);

            const result = await plugin.signChallenge(challenge, pair);

            expect(mockSEA.sign).toHaveBeenCalledWith(challenge, pair);
            expect(result).toBe(expectedSignature);
        });

        it("should throw error when signature fails", async () => {
            mockSEA.sign.mockResolvedValue(null);

            await expect(
                plugin.signChallenge("challenge", { pub: "pub", priv: "priv" }),
            ).rejects.toThrow("Failed to sign challenge");
        });
    });

    describe("verifyChallenge", () => {
        it("should verify a valid signed challenge", async () => {
            const originalChallenge = "random-challenge-12345";
            const signedChallenge = "signed_data";
            const pubKey = "signer_pub_key";

            mockSEA.verify.mockResolvedValue(originalChallenge);

            const result = await plugin.verifyChallenge(
                signedChallenge,
                pubKey,
                originalChallenge,
            );

            expect(mockSEA.verify).toHaveBeenCalledWith(signedChallenge, pubKey);
            expect(result).toBe(true);
        });

        it("should reject a tampered challenge", async () => {
            mockSEA.verify.mockResolvedValue("different-challenge");

            const result = await plugin.verifyChallenge(
                "signed_data",
                "pub_key",
                "expected-challenge",
            );

            expect(result).toBe(false);
        });

        it("should reject when verification returns null", async () => {
            mockSEA.verify.mockResolvedValue(null);

            const result = await plugin.verifyChallenge(
                "signed_data",
                "pub_key",
                "original-challenge",
            );

            expect(result).toBe(false);
        });
    });

    describe("requestChallenge", () => {
        it("should send a POST request to the challenge endpoint", async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    success: true,
                    challengeId: "chal-123",
                    challenge: "random-string",
                    pub: "user_pub",
                }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            plugin.configure({ serverUrl: "http://localhost:3000" });
            const result = await plugin.requestChallenge(
                "http://localhost:3000",
                "testuser",
                "password123",
            );

            expect(mockFetch).toHaveBeenCalledWith(
                "http://localhost:3000/login-challenge",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: "testuser",
                        password: "password123",
                    }),
                }),
            );

            expect(result.challengeId).toBe("chal-123");
            expect(result.challenge).toBe("random-string");
            expect(result.pub).toBe("user_pub");
        });

        it("should throw on server rejection", async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                json: jest.fn().mockResolvedValue({ error: "Invalid credentials" }),
            });

            await expect(
                plugin.requestChallenge("http://localhost:3000", "user", "pass"),
            ).rejects.toThrow("Invalid credentials");
        });
    });

    describe("login (full flow)", () => {
        it("should execute the full challenge-response flow", async () => {
            // Step 1: Mock challenge request
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue({
                        success: true,
                        challengeId: "chal-456",
                        challenge: "challenge-string",
                        pub: "user_pub",
                    }),
                })
                // Step 3: Mock verification
                .mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue({
                        success: true,
                        pub: "user_pub",
                        username: "testuser",
                        token: "jwt-token-xyz",
                    }),
                });

            // Step 2: Mock signing
            mockSEA.sign.mockResolvedValue("signed_challenge");

            const result = await plugin.login(
                "http://localhost:3000",
                "testuser",
                "password",
                { pub: "user_pub", priv: "user_priv" },
            );

            expect(result.success).toBe(true);
            expect(result.userPub).toBe("user_pub");
            expect(result.sessionToken).toBe("jwt-token-xyz");
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(mockSEA.sign).toHaveBeenCalledWith("challenge-string", {
                pub: "user_pub",
                priv: "user_priv",
            });
        });
    });
});
