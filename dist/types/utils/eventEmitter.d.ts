type Listener = (...args: any[]) => void;
export declare class EventEmitter {
    private events;
    on(event: string, listener: Listener): void;
    off(event: string, listener: Listener): void;
    emit(event: string, ...args: any[]): void;
    removeAllListeners(event?: string): void;
}
export {};
