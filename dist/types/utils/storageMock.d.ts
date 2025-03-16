declare class StorageMock implements Storage {
    private store;
    constructor();
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
    key(index: number): string | null;
    get length(): number;
}
export declare const localStorage: StorageMock;
export {};
