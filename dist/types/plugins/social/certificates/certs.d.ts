import { IGunInstance } from "gun";
interface CertificateCallbackResponse {
    errMessage?: string;
    errCode?: string;
    certificate?: string;
    success?: string;
}
type CertificateCallback = (response: CertificateCallbackResponse) => void;
export declare class CertificateService {
    private readonly gun;
    constructor(gunInstance: IGunInstance);
    generateFriendRequestsCertificate(callback?: CertificateCallback): Promise<void>;
    generateAddFriendCertificate(publicKey: string, callback?: CertificateCallback): Promise<void>;
    createChatsCertificate(publicKey: string, callback?: CertificateCallback): Promise<void>;
    createMessagesCertificate(publicKey: string, callback?: CertificateCallback): Promise<void>;
}
export {};
