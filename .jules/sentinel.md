## 2026-02-16 - Weak Salt Generation in Session Storage
**Vulnerability:** Found `Math.random().toString()` used as entropy source for generating session encryption salts in `src/gundb/db.ts`. This makes the salt predictable, weakening the protection against rainbow table attacks on stored sessions.
**Learning:** Even when using strong hashing algorithms (PBKDF2/SHA256), the strength depends entirely on the quality of the input entropy. Using `Math.random()` undermines the security of the entire mechanism.
**Prevention:** Always use `crypto.getRandomValues()` or `crypto.randomUUID()` (or platform-specific CSPRNGs) for any value that requires unpredictability (salts, nonces, keys, IVs).
