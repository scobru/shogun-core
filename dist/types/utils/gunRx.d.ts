import { Observable } from "rxjs";
import { IGunInstance } from "gun";
import { GunSchema } from "../../../gun/types";
export declare class GunRxJS {
    private readonly gun;
    constructor(gun: IGunInstance);
    /**
     * Crea un Observable da un riferimento Gun
     */
    observe<T extends GunSchema>(path: string): Observable<T>;
}
