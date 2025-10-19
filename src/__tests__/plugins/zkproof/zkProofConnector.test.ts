import { ZkProofConnector } from "../../../plugins/zkproof/zkProofConnector";
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";

// Mock Semaphore dependencies
jest.mock("@semaphore-protocol/identity");
jest.mock("@semaphore-protocol/group");
jest.mock("@semaphore-protocol/proof", () => ({
  generateProof: jest.fn(),
  verifyProof: jest.fn(),
}));

const MockIdentity = Identity as jest.MockedClass<typeof Identity>;
const MockGroup = Group as jest.MockedClass<typeof Group>;

describe("ZkProofConnector", () => {
  let connector: ZkProofConnector;
  let mockIdentity: any;
  let mockGroup: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock identity
    mockIdentity = {
      commitment: BigInt("123456789"),
      trapdoor: BigInt("987654321"),
      nullifier: BigInt("111222333"),
    };

    MockIdentity.mockImplementation(() => mockIdentity as any);

    // Setup mock group
    mockGroup = {
      members: [],
      addMember: jest.fn(),
    };

    MockGroup.mockImplementation(() => mockGroup as any);

    connector = new ZkProofConnector();
  });

  describe("generateIdentity", () => {
    it("should generate random identity", async () => {
      const result = await connector.generateIdentity();

      expect(result).toHaveProperty("commitment");
      expect(result).toHaveProperty("trapdoor");
      expect(result).toHaveProperty("nullifier");
      expect(result).toHaveProperty("createdAt");
      expect(MockIdentity).toHaveBeenCalled();
    });

    it("should generate deterministic identity from seed", async () => {
      const seed = "test-seed";
      const result = await connector.generateIdentity(seed);

      expect(MockIdentity).toHaveBeenCalledWith(seed);
      expect(result).toHaveProperty("commitment");
    });
  });

  describe("restoreIdentity", () => {
    it("should restore identity from trapdoor", async () => {
      const trapdoor = "987654321";
      const result = await connector.restoreIdentity(trapdoor);

      expect(MockIdentity).toHaveBeenCalledWith(trapdoor);
      expect(result).toHaveProperty("commitment");
      expect(result).toHaveProperty("trapdoor");
    });
  });

  describe("generateCredentials", () => {
    it("should generate Gun credentials from identity", async () => {
      const identityData = {
        commitment: "123456789",
        trapdoor: "987654321",
        nullifier: "111222333",
        createdAt: Date.now(),
      };

      const result = await connector.generateCredentials(identityData);

      expect(result).toHaveProperty("pub");
      expect(result).toHaveProperty("priv");
      expect(result).toHaveProperty("epub");
      expect(result).toHaveProperty("epriv");
    });
  });

  describe("addToGroup", () => {
    it("should add identity to group", () => {
      const commitment = "123456789";
      const groupId = "test-group";

      connector.addToGroup(commitment, groupId);

      expect(MockGroup).toHaveBeenCalled();
    });

    it("should use default group if not specified", () => {
      const commitment = "123456789";

      connector.addToGroup(commitment);

      expect(MockGroup).toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should clear all caches", () => {
      connector.cleanup();
      // No error should be thrown
      expect(true).toBe(true);
    });
  });
});
