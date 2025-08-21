import { ShogunCore, ShogunSDKConfig } from "../../index";

describe("Simple Bug Fix Test", () => {
  it("should have fixed the checkRateLimit bug", () => {
    const config: ShogunSDKConfig = {
      appToken: "test-token",
      oauth: { enabled: false },
      peers: [],
    };

    const shogunCore = new ShogunCore(config);

    // Test that checkRateLimit returns the correct object structure
    const rateLimitResult = shogunCore.db.checkRateLimit("testuser");

    expect(rateLimitResult).toHaveProperty("allowed");
    expect(typeof rateLimitResult.allowed).toBe("boolean");
    expect(rateLimitResult.allowed).toBe(true);

    // Test that validateSignupCredentials works correctly
    const validationResult = shogunCore.db.validateSignupCredentials(
      "testuser",
      "TestPass123!@#",
    );

    expect(validationResult).toHaveProperty("valid");
    expect(typeof validationResult.valid).toBe("boolean");
    expect(validationResult.valid).toBe(true);

    console.log(
      "✅ Bug fix verified: checkRateLimit and validateSignupCredentials work correctly",
    );
  });
});
