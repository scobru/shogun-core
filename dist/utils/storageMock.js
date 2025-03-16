// Mock di localStorage per Node.js
class StorageMock {
    constructor() {
        this.store = new Map();
    }
    getItem(key) {
        return this.store.get(key) || null;
    }
    setItem(key, value) {
        this.store.set(key, value);
    }
    removeItem(key) {
        this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
    key(index) {
        if (index >= this.store.size)
            return null;
        return Array.from(this.store.keys())[index] || null;
    }
    get length() {
        return this.store.size;
    }
}
export const localStorage = new StorageMock();
