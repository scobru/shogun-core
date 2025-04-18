import { stringify } from "qs";

/**
 * Estrae l'ID di un nodo Gun
 */
export const getId = (node: { _: { [x: string]: any } }) => node?._?.["#"];

/**
 * Estrae la chiave pubblica da un ID Gun (es: ~pubKey)
 */
export const getPub = (id: string) => {
  const match = /~([^@][^\.]+\.[^\.]+)/.exec(id);
  return match ? match[1] : null;
};

/**
 * Estrae la chiave pubblica finale da ID concatenato (es: trust chain)
 */
export const getTargetPub = (id: string) => {
  const match = /~[^@][^\.]+\.[^\.]+.*~([^@][^\.]+\.[^\.]+)$/.exec(id);
  return match ? match[1] : null;
};

/**
 * UUID unico generato dalla configurazione di Gun
 */
export const getUUID = (gun: {
  opt: () => {
    (): any;
    new (): any;
    _: {
      (): any;
      new (): any;
      opt: { (): any; new (): any; uuid: { (): any; new (): any } };
    };
  };
}) => gun.opt()._.opt.uuid();

/**
 * Converte un set Gun in un array di nodi
 */
export const getSet = (data: { [x: string]: any }, id: string | number) => {
  const set = data[id];
  if (!set) return [];
  return Object.keys(set)
    .filter((key) => key !== "_")
    .map((key) => set[key])
    .filter((val) => val && typeof val === "object" && val["#"])
    .map((ref) => data[ref["#"]])
    .filter(Boolean);
};

/**
 * Serializza un oggetto in query string
 */
export const qs = (
  o: { [s: string]: unknown } | ArrayLike<unknown>,
  prefix = "?"
) => {
  const filtered = Object.fromEntries(Object.entries(o).filter(([_, v]) => v));
  const stringified = stringify(filtered);
  return stringified ? `${prefix}${stringified}` : "";
};
