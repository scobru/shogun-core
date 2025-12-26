declare module 'async-mutex' {
  export class Mutex {
    constructor();
    acquire(): Promise<() => void>;
    runExclusive<T>(callback: () => Promise<T> | T): Promise<T>;
    release(): void;
    isLocked(): boolean;
  }
}
