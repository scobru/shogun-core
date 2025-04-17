declare const validationUtils: {
    isValidEmail: (email: string) => boolean;
    isValidPassword: (password: string) => boolean;
    isValidUsername: (username: string) => boolean;
    isNonEmptyString: (str: unknown) => boolean;
    isNumber: (value: unknown) => boolean;
    isInteger: (value: unknown) => boolean;
    isPositiveNumber: (value: unknown) => boolean;
    isNonNegativeNumber: (value: unknown) => boolean;
    isInRange: (value: number, min: number, max: number) => boolean;
    isBoolean: (value: unknown) => boolean;
    isArray: (value: unknown) => boolean;
    isNonEmptyArray: (value: unknown) => boolean;
    isObject: (value: unknown) => boolean;
    isNonEmptyObject: (value: unknown) => boolean;
    hasRequiredProperties: (obj: Record<string, unknown>, requiredProps: string[]) => boolean;
    validateObject: (obj: Record<string, unknown>, schema: Record<string, (value: unknown) => boolean>) => boolean;
};
