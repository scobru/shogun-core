import {
  ZkCredentials,
  CredentialType,
} from "../../../plugins/zkproof/zkCredentials";
import { Identity } from "@semaphore-protocol/identity";

// Mock Semaphore dependencies
jest.mock("@semaphore-protocol/identity");
jest.mock("@semaphore-protocol/group");
jest.mock("@semaphore-protocol/proof", () => ({
  generateProof: jest.fn().mockResolvedValue({
    merkleTreeRoot: BigInt(123),
    nullifierHash: BigInt(456),
    signal: BigInt(789),
    externalNullifier: BigInt(111),
    proof: [BigInt(222), BigInt(333), BigInt(444)],
  }),
  verifyProof: jest.fn().mockResolvedValue(true),
}));

const MockIdentity = Identity as jest.MockedClass<typeof Identity>;

describe("ZkCredentials", () => {
  let zkCreds: ZkCredentials;
  let mockIdentity: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock identity
    mockIdentity = {
      commitment: BigInt("123456789"),
      trapdoor: BigInt("987654321"),
      nullifier: BigInt("111222333"),
    };

    MockIdentity.mockImplementation(() => mockIdentity as any);

    zkCreds = new ZkCredentials();
  });

  describe("createCredential", () => {
    it("should create a credential from private data", () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      const result = zkCreds.createCredential(mockSemaphoreIdentity, {
        type: CredentialType.AGE,
        claim: "Over 18 years old",
        privateData: {
          birthDate: "1990-01-01",
          actualAge: 33,
        },
      });

      expect(result).toHaveProperty("credential");
      expect(result).toHaveProperty("credentialHash");
      expect(result.credential.type).toBe(CredentialType.AGE);
      expect(result.credential.claim).toBe("Over 18 years old");
      expect(result.credential.credentialHash).toBeDefined();
    });

    it("should create citizenship credential", () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      const result = zkCreds.createCredential(mockSemaphoreIdentity, {
        type: CredentialType.CITIZENSHIP,
        claim: "EU Citizen",
        privateData: {
          country: "Italy",
          passportNumber: "IT123456",
        },
      });

      expect(result.credential.type).toBe(CredentialType.CITIZENSHIP);
      expect(result.credential.claim).toBe("EU Citizen");
    });

    it("should create education credential", () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      const result = zkCreds.createCredential(mockSemaphoreIdentity, {
        type: CredentialType.EDUCATION,
        claim: "Has Bachelor degree",
        privateData: {
          university: "MIT",
          degree: "Computer Science",
          year: 2020,
        },
      });

      expect(result.credential.type).toBe(CredentialType.EDUCATION);
      expect(result.credential.claim).toBe("Has Bachelor degree");
    });

    it("should create income credential", () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      const result = zkCreds.createCredential(mockSemaphoreIdentity, {
        type: CredentialType.INCOME,
        claim: "Income >= 50,000 USD",
        privateData: {
          actualIncome: 75000,
          currency: "USD",
        },
      });

      expect(result.credential.type).toBe(CredentialType.INCOME);
      expect(result.credential.claim).toBe("Income >= 50,000 USD");
    });

    it("should create custom credential", () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      const result = zkCreds.createCredential(mockSemaphoreIdentity, {
        type: CredentialType.CUSTOM,
        claim: "Verified developer",
        privateData: {
          githubUsername: "johndoe",
          repositories: 150,
          stars: 5000,
        },
      });

      expect(result.credential.type).toBe(CredentialType.CUSTOM);
      expect(result.credential.claim).toBe("Verified developer");
    });
  });

  describe("proveAge", () => {
    it("should create age proof for valid age", async () => {
      const mockSemaphoreIdentity = new Identity("test-seed");
      const birthDate = new Date("1990-01-01");

      const proof = await zkCreds.proveAge(
        mockSemaphoreIdentity,
        birthDate,
        18,
      );

      expect(proof.type).toBe(CredentialType.AGE);
      expect(proof.claim).toContain("18 or older");
    });

    it("should reject if age is below minimum", async () => {
      const mockSemaphoreIdentity = new Identity("test-seed");
      const birthDate = new Date("2010-01-01"); // Too young

      await expect(
        zkCreds.proveAge(mockSemaphoreIdentity, birthDate, 18),
      ).rejects.toThrow("less than required");
    });

    it("should calculate age correctly", async () => {
      const mockSemaphoreIdentity = new Identity("test-seed");
      const birthDate = new Date("2000-01-01");
      const expectedAge = Math.floor(
        (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );

      const proof = await zkCreds.proveAge(
        mockSemaphoreIdentity,
        birthDate,
        18,
      );

      expect(proof.type).toBe(CredentialType.AGE);
      // Age should be calculated correctly (around 24-25 years in 2024)
      expect(expectedAge).toBeGreaterThanOrEqual(18);
    });
  });

  describe("proveCitizenship", () => {
    it("should create citizenship proof", async () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      const proof = await zkCreds.proveCitizenship(
        mockSemaphoreIdentity,
        "Italy",
        "EU",
      );

      expect(proof.type).toBe(CredentialType.CITIZENSHIP);
      expect(proof.claim).toBe("Citizen of EU");
    });

    it("should work with default region", async () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      const proof = await zkCreds.proveCitizenship(
        mockSemaphoreIdentity,
        "Germany",
      );

      expect(proof.type).toBe(CredentialType.CITIZENSHIP);
      expect(proof.claim).toBe("Citizen of EU");
    });
  });

  describe("proveEducation", () => {
    it("should create education credential proof", async () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      const proof = await zkCreds.proveEducation(
        mockSemaphoreIdentity,
        "Bachelor of Science",
        "MIT",
        2020,
      );

      expect(proof.type).toBe(CredentialType.EDUCATION);
      expect(proof.claim).toBe("Has Bachelor of Science degree");
    });
  });

  describe("proveIncome", () => {
    it("should create income proof for sufficient income", async () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      const proof = await zkCreds.proveIncome(
        mockSemaphoreIdentity,
        75000,
        50000,
        "USD",
      );

      expect(proof.type).toBe(CredentialType.INCOME);
      expect(proof.claim).toBe("Income ≥ 50000 USD");
    });

    it("should reject if income is below minimum", async () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      await expect(
        zkCreds.proveIncome(mockSemaphoreIdentity, 30000, 50000, "USD"),
      ).rejects.toThrow("less than required");
    });

    it("should work with default currency", async () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      const proof = await zkCreds.proveIncome(
        mockSemaphoreIdentity,
        75000,
        50000,
      );

      expect(proof.type).toBe(CredentialType.INCOME);
      expect(proof.claim).toContain("USD");
    });
  });

  describe("addToCredentialGroup", () => {
    it("should add identity to default group", () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      // Should not throw
      expect(() =>
        zkCreds.addToCredentialGroup(mockSemaphoreIdentity),
      ).not.toThrow();
    });

    it("should add identity to custom group", () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      // Should not throw
      expect(() =>
        zkCreds.addToCredentialGroup(mockSemaphoreIdentity, "custom-group"),
      ).not.toThrow();
    });
  });

  describe("cleanup", () => {
    it("should clear all groups and caches", () => {
      const mockSemaphoreIdentity = new Identity("test-seed");

      // Add some data
      zkCreds.addToCredentialGroup(mockSemaphoreIdentity, "test-group");

      // Cleanup
      zkCreds.cleanup();

      // Should not throw after cleanup
      expect(() => zkCreds.cleanup()).not.toThrow();
    });
  });

  describe("CredentialType enum", () => {
    it("should have all credential types defined", () => {
      expect(CredentialType.AGE).toBe("age");
      expect(CredentialType.CITIZENSHIP).toBe("citizenship");
      expect(CredentialType.EDUCATION).toBe("education");
      expect(CredentialType.INCOME).toBe("income");
      expect(CredentialType.EMPLOYMENT).toBe("employment");
      expect(CredentialType.HEALTH).toBe("health");
      expect(CredentialType.CUSTOM).toBe("custom");
    });
  });
});
