export declare const validatePassword: (password: string) => boolean;
export declare const generateSecurePassword: (length?: number) => string;
export declare const measurePerformance: <T>(operation: () => Promise<T>, operationName: string) => Promise<{
    result: T;
    duration: number;
}>;
export declare const formatBytes: (bytes: number) => string;
export declare const formatDuration: (ms: number) => string;
export declare const createProgressCallback: (onProgress: (progress: number) => void, total: number) => {
    increment: (amount?: number) => void;
    setProgress: (progress: number) => void;
    complete: () => void;
};
export declare const sanitizeFileName: (fileName: string) => string;
export declare const getFileExtension: (fileName: string) => string;
export declare const isTextFile: (fileName: string) => boolean;
export declare const createFileHash: (file: File) => Promise<string>;
export declare const compareFiles: (file1: File, file2: File) => Promise<boolean>;
export declare const createBackup: (data: any) => string;
export declare const restoreBackup: (backupString: string) => any;
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
export declare const throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => ((...args: Parameters<T>) => void);
