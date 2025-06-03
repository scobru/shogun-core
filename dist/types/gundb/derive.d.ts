export interface DeriveOptions {
    includeSecp256k1Bitcoin?: boolean;
    includeSecp256k1Ethereum?: boolean;
    includeP256?: boolean;
}
export default function (pwd: any, extra: any, options?: DeriveOptions): Promise<any>;
