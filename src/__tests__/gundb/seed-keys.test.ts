/**
 * Tests for Seed-Based Key Generation
 */

import {
    generatePairFromSeed,
    generatePairFromMnemonic,
} from "../../gundb/crypto";
import { SEA } from "gun";

// Mock Gun.SEA
jest.mock("gun", () => {
    return {
        SEA: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
            work: jest.fn(),
            pair: jest.fn(),
            sign: jest.fn(),
            verify: jest.fn(),
            secret: jest.fn(),
        }
    };
});

describe("Seed-Based Key Generation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Ensure global.SEA is set to the mocked SEA object we can control
        const mockSEA = require("gun").SEA;
        (global as any).SEA = mockSEA;
        (globalThis as any).SEA = mockSEA;
    });

    describe("generatePairFromSeed", () => {
        it("should generate a pair from a seed string", async () => {
            const mockPair = {
                pub: "seed_pub_key",
                priv: "seed_priv_key",
                epub: "seed_epub_key",
                epriv: "seed_epriv_key",
            };

            (SEA.pair as jest.Mock).mockResolvedValue(mockPair);

            const result = await generatePairFromSeed("test-seed-phrase");

            expect(result).toEqual(mockPair);
            expect(result.pub).toBe("seed_pub_key");
            expect(result.priv).toBe("seed_priv_key");
            expect(result.epub).toBe("seed_epub_key");
            expect(result.epriv).toBe("seed_epriv_key");
        });

        it("should throw when SEA is not available", async () => {
            const originalPair = SEA.pair;
            try {
                (SEA.pair as any) = undefined;
                (global as any).SEA = { pair: undefined };

                await expect(generatePairFromSeed("test-seed")).rejects.toThrow(
                    "SEA not available",
                );
            } finally {
                (SEA.pair as any) = originalPair;
            }
        });

        it("should call SEA.pair with seed option", async () => {
            const mockPair = {
                pub: "pub",
                priv: "priv",
                epub: "epub",
                epriv: "epriv",
            };
            (SEA.pair as jest.Mock).mockResolvedValue(mockPair);

            await generatePairFromSeed("my-seed");

            expect(SEA.pair).toHaveBeenCalledWith(null, { seed: "my-seed" });
        });

        it("should fall back to SEA.work + pair when native seed fails", async () => {
            const mockPair = {
                pub: "fallback_pub",
                priv: "fallback_priv",
                epub: "fallback_epub",
                epriv: "fallback_epriv",
            };

            // First call (native seed) - return incomplete pair
            // Second call (fallback seed) - return valid pair
            (SEA.pair as jest.Mock)
                .mockResolvedValueOnce(null) // native seed fails
                .mockResolvedValueOnce(mockPair); // fallback succeeds

            (SEA.work as jest.Mock).mockResolvedValue("derived_password");

            const result = await generatePairFromSeed("test-seed");

            expect(SEA.work).toHaveBeenCalledWith(
                "test-seed",
                "shogun-seed-salt",
                null,
                { name: "SHA-256" },
            );
            expect(result).toEqual(mockPair);
        });
    });

    describe("generatePairFromMnemonic", () => {
        it("should generate a pair from a valid 12-word mnemonic", async () => {
            const mockPair = {
                pub: "mnemonic_pub",
                priv: "mnemonic_priv",
                epub: "mnemonic_epub",
                epriv: "mnemonic_epriv",
            };

            (SEA.pair as jest.Mock).mockResolvedValue(mockPair);

            const mnemonic =
                "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
            const result = await generatePairFromMnemonic(mnemonic, "testuser");

            expect(result).toEqual(mockPair);
            expect(result.pub).toBe("mnemonic_pub");
        });

        it("should throw for mnemonics with less than 12 words", async () => {
            await expect(
                generatePairFromMnemonic("too few words here", "testuser"),
            ).rejects.toThrow("Invalid mnemonic: must be at least 12 words");
        });

        it("should produce different results for different usernames", async () => {
            const mockPair1 = { pub: "p1", priv: "pr1", epub: "e1", epriv: "ep1" };
            const mockPair2 = { pub: "p2", priv: "pr2", epub: "e2", epriv: "ep2" };

            (SEA.pair as jest.Mock)
                .mockResolvedValueOnce(mockPair1)
                .mockResolvedValueOnce(mockPair2);

            const mnemonic =
                "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

            const result1 = await generatePairFromMnemonic(mnemonic, "user1");
            const result2 = await generatePairFromMnemonic(mnemonic, "user2");

            // The seeds passed to SEA.pair should differ per username
            expect(SEA.pair).toHaveBeenCalledTimes(2);
            const call1Seed = (SEA.pair as jest.Mock).mock.calls[0][1]?.seed;
            const call2Seed = (SEA.pair as jest.Mock).mock.calls[1][1]?.seed;
            expect(call1Seed).not.toBe(call2Seed);
        });
    });
});
