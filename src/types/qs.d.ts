/**
 * Dichiarazione TypeScript per il modulo 'qs'
 */
declare module "qs" {
  /**
   * Converte un oggetto JavaScript in una stringa di query URL.
   * @param obj - L'oggetto da convertire
   * @param options - Opzioni di formattazione
   * @returns La stringa di query URL generata
   */
  export function stringify(
    obj: Record<string, any> | any[],
    options?: {
      addQueryPrefix?: boolean;
      arrayFormat?: "indices" | "brackets" | "repeat" | "comma";
      delimiter?: string;
      encode?: boolean;
      encodeValuesOnly?: boolean;
      encoder?: (
        str: string,
        defaultEncoder: (str: string) => string,
        charset: string,
        type: "key" | "value",
      ) => string;
      filter?: Array<string | number> | ((prefix: string, value: any) => any);
      format?: string;
      serializeDate?: (date: Date) => string;
      skipNulls?: boolean;
      sort?: (a: string, b: string) => number;
      charset?: string;
      charsetSentinel?: boolean;
    },
  ): string;

  /**
   * Analizza una stringa di query URL in un oggetto JavaScript.
   * @param str - La stringa di query da analizzare
   * @param options - Opzioni di parsing
   * @returns L'oggetto JavaScript risultante
   */
  export function parse(
    str: string,
    options?: {
      allowDots?: boolean;
      allowPrototypes?: boolean;
      arrayLimit?: number;
      charset?: string;
      charsetSentinel?: boolean;
      comma?: boolean;
      decoder?: (
        str: string,
        defaultDecoder: (str: string) => string,
        charset: string,
        type: "key" | "value",
      ) => string;
      delimiter?: string | RegExp;
      depth?: number;
      ignoreQueryPrefix?: boolean;
      interpretNumericEntities?: boolean;
      parameterLimit?: number;
      parseArrays?: boolean;
      plainObjects?: boolean;
      strictNullHandling?: boolean;
    },
  ): Record<string, any>;
}
