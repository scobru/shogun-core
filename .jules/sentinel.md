## 2026-02-16 - Weak Salt Generation in Session Storage
**Vulnerability:** Found `Math.random().toString()` used as entropy source for generating session encryption salts in `src/gundb/db.ts`. This makes the salt predictable, weakening the protection against rainbow table attacks on stored sessions.
**Learning:** Even when using strong hashing algorithms (PBKDF2/SHA256), the strength depends entirely on the quality of the input entropy. Using `Math.random()` undermines the security of the entire mechanism.
**Prevention:** Always use `crypto.getRandomValues()` or `crypto.randomUUID()` (or platform-specific CSPRNGs) for any value that requires unpredictability (salts, nonces, keys, IVs).

## 2026-02-16 - Weak Password Policy
**Vulnerability:** Passwords were only validated for length (>= 8 chars), allowing weak passwords like "password", "12345678", or "aaaaaaaa" which are susceptible to brute-force and dictionary attacks.
**Learning:** Default configurations often prioritize usability over security. Explicit validation logic is required to enforce complexity.
**Prevention:** Enforce complexity requirements: uppercase, lowercase, numbers, and special characters. Use regex or dedicated libraries for validation.

## 2026-02-19 - WebAuthn Sign Method Ignores Input Data
**Vulnerability:** The WebAuthn `sign` method in `src/plugins/webauthn/webauthn.ts` used a hardcoded empty 16-byte challenge regardless of the input data. This rendered the resulting signature useless for verifying the integrity or authenticity of the specific data being "signed".
**Learning:** WebAuthn signatures are generated over the concatenation of authenticator data and client data (which includes the challenge). To use WebAuthn as a signing primitive for arbitrary data, the challenge MUST be a cryptographic hash of that data.
**Prevention:** Ensure that any method claiming to sign data actually binds the signature to that data by incorporating it (or its hash) into the signing challenge or message.

## 2024-05-23 - Session Storage Encryption Key Vulnerability
**Vulnerability:** The session encryption key in `src/gundb/db.ts` was derived from `username`, `salt`, and `pub`, all of which were stored in plain text within the `sessionStorage` object alongside the encrypted data. This allowed any attacker with access to `sessionStorage` (e.g., via XSS) to trivially derive the key and decrypt sensitive session data (including private keys).
**Learning:** Client-side 'encryption' is often just obfuscation if the key material is also client-side and accessible. 'Keep me logged in' features without server-side cookies are inherently difficult to secure against XSS.
**Prevention:** We implemented 'device binding' by mixing a unique, device-specific secret stored in `localStorage` into the key derivation function. This ensures that a stolen `sessionStorage` dump cannot be decrypted off-device. Always use independent secrets or hardware-backed keys where possible.
