import GunPlus from "./gun_plus";
import { make_certificate } from "./models/auth/cert";
import GunNode from "./models/gun-node";
export default GunPlus;
declare const certificates: {
    /** Make certificates. */
    make: typeof make_certificate;
    /** Some ready-made policies. */
    policies: {
        prefix_path_public: {
            "#": {
                "*": string;
            };
        };
        prefix_key_public: {
            ".": {
                "*": string;
            };
        };
        contains_pub: {
            "+": "*";
        };
        prefix_path_x: (path: string) => {
            "#": {
                "*": string;
            };
        };
        prefix_key_x: (key: string) => {
            ".": {
                "*": string;
            };
        };
    };
};
export { GunPlus, GunNode, certificates };
export type { GunAlias, GunPassword } from "./models/auth/auth";
