## 2024-05-22 - Insecure Debugging and Weak RNG
**Vulnerability:** Found fs.appendFileSync and console.error debug logs in src/gundb/crypto.ts and Math.random() used for session salt in src/gundb/db.ts.
**Learning:** Debug code left in production can lead to information leakage and performance issues (sync I/O). Math.random() is not cryptographically secure.
**Prevention:** Use crypto.randomUUID() or crypto.getRandomValues() for security-critical randomness. Remove debug logging before committing.
