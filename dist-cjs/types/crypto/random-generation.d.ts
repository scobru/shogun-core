export declare const generateRandomString: (length?: number, additionalSalt?: string) => string;
export declare const randomBytes: (length: number) => Uint8Array;
export declare const randomInt: (min: number, max: number) => number;
export declare const randomFloat: () => number;
export declare const randomBool: () => boolean;
export declare const randomUUID: () => string;
export declare class DeterministicRandom {
    private seed;
    constructor(seed: string | number);
    private hashString;
    private lcg;
    integer(min?: number, max?: number): number;
    floating(min?: number, max?: number, fixed?: number): number;
    bool(): boolean;
    string(length?: number, pool?: string): string;
    guid(): string;
    choice<T>(array: T[]): T;
    shuffle<T>(array: T[]): T[];
    color(): string;
    date(start: Date, end: Date): Date;
}
export declare const createDeterministicRandom: (seed: string | number) => DeterministicRandom;
export declare const chance: (seed: string | number) => DeterministicRandom;
export declare const randomChoice: <T>(array: T[]) => T;
export declare const randomShuffle: <T>(array: T[]) => T[];
export declare const randomColor: () => string;
export declare const randomPassword: (options?: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
}) => string;
export declare const randomSeedPhrase: (wordCount?: number) => string[];
