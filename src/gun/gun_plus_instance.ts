// main entry point
import GunPlus from "./gun_plus";
import { make_certificate, policies } from "./models/auth/cert";
import GunNode from "./models/gun-node";

export default GunPlus;

const certificates = {
  /** Make certificates. */
  make: make_certificate,

  /** Some ready-made policies. */
  policies: policies,
};

export { GunPlus, GunNode, certificates };
export type { GunAlias, GunPassword } from "./models/auth/auth";
