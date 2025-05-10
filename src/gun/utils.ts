/**
 * Extracts the ID of a Gun node
 */
export const getId = (node: { _: { [x: string]: any } }) => node?._?.["#"];

/**
 * Extracts the public key from a Gun ID (e.g., ~pubKey)
 */
export const getPub = (id: string) => {
  const match = /~([^@][^\.]+\.[^\.]+)/.exec(id);
  return match ? match[1] : null;
};

/**
 * Extracts the final public key from a concatenated ID (e.g., trust chain)
 */
export const getTargetPub = (id: string) => {
  const match = /~[^@][^\.]+\.[^\.]+.*~([^@][^\.]+\.[^\.]+)$/.exec(id);
  return match ? match[1] : null;
};

/**
 * Generates a unique UUID from Gun configuration
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
 * Converts a Gun set into an array of nodes
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
 * Serializes an object into a query string
 */
export const qs = (
  o: { [s: string]: unknown } | ArrayLike<unknown>,
  prefix = "?",
) => {
  const filtered = Object.fromEntries(Object.entries(o).filter(([_, v]) => v));
  const stringified = JSON.stringify(filtered);
  return stringified ? `${prefix}${stringified}` : "";
};
