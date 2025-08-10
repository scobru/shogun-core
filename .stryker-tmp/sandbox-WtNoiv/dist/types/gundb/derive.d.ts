// @ts-nocheck
export interface DeriveOptions {
    includeSecp256k1Bitcoin?: boolean;
    includeSecp256k1Ethereum?: boolean;
    includeP256?: boolean;
}
export default function (pwd: any, extra: any, options?: DeriveOptions): Promise<{
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
    secp256k1Bitcoin: {
        privateKey: string;
        publicKey: string;
        address: string;
    };
    secp256k1Ethereum: {
        privateKey: string;
        publicKey: string;
        address: string;
    };
}>;
