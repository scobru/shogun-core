/**
 * Extracts the ID of a Gun node
 * @param node - Gun node object containing metadata
 * @returns The node ID from the metadata
 */
export const getId = (node: { _: { [x: string]: any } }) => node?._?.["#"];

/**
 * Extracts the public key from a Gun ID (e.g., ~pubKey)
 * @param id - Gun ID string containing public key
 * @returns Extracted public key or null if not found
 */
export const getPub = (id: string) => {
  const match = /~([^@][^\.]+\.[^\.]+)/.exec(id);
  return match ? match[1] : null;
};

/**
 * Extracts the final public key from a concatenated ID (e.g., trust chain)
 * @param id - Concatenated Gun ID string
 * @returns Final public key in the chain or null if not found
 */
export const getTargetPub = (id: string) => {
  const match = /~[^@][^\.]+\.[^\.]+.*~([^@][^\.]+\.[^\.]+)$/.exec(id);
  return match ? match[1] : null;
};

/**
 * Generates a unique UUID from Gun configuration
 * @param gun - Gun instance containing UUID generator
 * @returns Generated UUID string
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
 * @param data - Gun data object containing set
 * @param id - ID of the set to convert
 * @returns Array of nodes from the set
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
 * @param o - Object to serialize
 * @param prefix - Optional prefix for query string (defaults to "?")
 * @returns Serialized query string
 */
export const qs = (
  o: { [s: string]: unknown } | ArrayLike<unknown>,
  prefix = "?",
) => {
  const filtered = Object.fromEntries(Object.entries(o).filter(([_, v]) => v));
  const stringified = JSON.stringify(filtered);
  return stringified ? `${prefix}${stringified}` : "";
};

/**
 * Converts an array of objects into an indexed object using item IDs as keys
 * @param arr - Array of objects with ID properties
 * @returns Object indexed by item IDs
 */
export const getIndexedObjectFromArray = (arr: any[]) => {
  return arr.reduce((acc: any, item: { id: any }) => {
    return {
      ...acc,
      [item.id]: item,
    };
  }, {});
};

/**
 * Converts an indexed object back into an array
 * @param indexedObj - Object containing indexed values
 * @returns Array of values from the indexed object
 */
export const getArrayFromIndexedObject = (
  indexedObj: ArrayLike<unknown> | { [s: string]: unknown },
) => {
  return Object.values(indexedObj);
};

export function app_scoped(string: string, scope: string): string {
  if (scope.length > 0) return `${scope}-${string}`;
  return string;
}
