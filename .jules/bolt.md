## 2025-02-18 - [Manual UUID Generation Bottleneck]
**Learning:** Manual implementation of UUID generation using `Array.from` and `.map` on `Uint8Array` was ~16x slower than using the optimized `uuid` library's `v4()` function.
**Action:** Prefer established, optimized libraries like `uuid` over manual implementations for standard cryptographic operations unless there is a specific reason not to.
