## 2025-02-27 - Insecure Salt Generation
**Vulnerability:** Used `Math.random()` for generating session salts in `src/gundb/db.ts`, which is predictable and not cryptographically secure.
**Learning:** Even in seemingly minor contexts like session storage keys, using `Math.random()` creates a vulnerability where attackers could potentially predict session keys if they know the PRNG state.
**Prevention:** Always use `crypto.randomUUID()` or `crypto.getRandomValues()` for any value used in cryptographic operations (like salts, keys, nonces).
