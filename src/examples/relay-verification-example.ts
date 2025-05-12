import { ShogunCore, RelayMembershipVerifier } from "../index";

/**
 * Example showing how to use the RelayMembershipVerifier class
 * to check if addresses or public keys are authorized in the Shogun protocol
 */
async function runExample() {
  // Initialize Shogun SDK
  const core = new ShogunCore({
    providerUrl: "https://rpc.example.com", // Replace with your Ethereum node RPC URL
  });

  // Create a verifier instance
  const verifier = new RelayMembershipVerifier(
    {
      contractAddress: "0x1234567890123456789012345678901234567890", // Replace with actual contract address
    },
    core, // Optionally pass the ShogunCore instance to reuse its provider
  );

  try {
    // Example 1: Check if an address is authorized
    const address = "0xabcdef1234567890abcdef1234567890abcdef12";
    const isAddressAuthorized = await verifier.isAddressAuthorized(address);
    console.log(`Address ${address} is authorized: ${isAddressAuthorized}`);

    // Example 2: Check if a public key is authorized
    const publicKey =
      "0x04abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
    const isPubKeyAuthorized = await verifier.isPublicKeyAuthorized(publicKey);
    console.log(`Public key is authorized: ${isPubKeyAuthorized}`);

    // Example 3: Get address for a public key
    const addressForPubKey = await verifier.getAddressForPublicKey(publicKey);
    console.log(`Address for public key: ${addressForPubKey || "Not found"}`);

    // Example 4: Get user info for an address
    const userInfo = await verifier.getUserInfo(address);
    if (userInfo) {
      console.log(
        `User subscription expires: ${new Date(Number(userInfo.expires) * 1000).toISOString()}`,
      );
      console.log(`User public key: ${userInfo.pubKey}`);
    } else {
      console.log("User info not found");
    }

    // Example 5: Check if a user subscription is active
    const isActive = await verifier.isUserActive(address);
    console.log(`User subscription is active: ${isActive}`);
  } catch (error) {
    console.error("Error in relay verification example:", error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runExample().catch(console.error);
}
