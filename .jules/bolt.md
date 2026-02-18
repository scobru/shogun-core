## 2024-05-23 - RxJS Object Comparison
**Learning:** `JSON.stringify` inside `distinctUntilChanged` is a major performance bottleneck for reactive streams, as it allocates strings O(N) on every emission.
**Action:** Use a specialized `deepEqual` utility (like the one added in `src/utils/deepEqual.ts`) to perform structural comparison without serialization overhead. This is especially critical for GunDB integrations where object references change frequently due to metadata stripping.
