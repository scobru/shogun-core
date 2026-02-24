# Bolt's Journal

## 2024-05-22 - Optimizing RxJS Metadata Removal
**Learning:** `Object.keys` allocation overhead is significant in recursive hot paths like GunDB metadata removal, especially when dealing with deep object graphs in reactive streams. Replacing it with `for...in` loops (with `hasOwnProperty` check) reduces memory pressure and can improve execution time by avoiding temporary array creation.
**Action:** Prefer `for...in` loops over `Object.keys` or `Object.values` in recursive functions or tight loops where object property iteration is required and the object structure is dynamic.
