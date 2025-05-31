let currentObserver = null;
let gun = null; // not instantiated immediately!
let currentUser = null; // reference to the currently authenticated user
let currentNamespace = null; // current namespace
let namespaceContext = []; // namespace stack to manage nested context

export const Fragment = Symbol("Fragment");

export function init(gunInstance) {
  gun = gunInstance;
}

/**
 * Resolves a key based on the current namespace or context
 * @param {string} key - The original key
 * @param {Element} [element] - Optional DOM element from which to read the namespace attribute
 * @returns {string} - The key with namespace applied if necessary
 */
function resolveKey(key, element) {
  if (!key) return key;

  // If the key already starts with ~, it's already a complete namespace
  if (key.startsWith("~")) return key;

  // 1. First priority: check if the element has a namespace attribute
  if (element) {
    try {
      let currentElement = element;

      // Traverse up the DOM tree looking for the namespace attribute
      while (currentElement) {
        if (
          currentElement.getAttribute &&
          currentElement.getAttribute("namespace")
        ) {
          const elementNamespace = currentElement.getAttribute("namespace");
          // Debug: console.log(`[resolveKey] Found namespace attribute: ${elementNamespace} for key: ${key}`);
          return `${elementNamespace}.${key}`;
        }
        currentElement = currentElement.parentNode;
      }
    } catch (err) {
      console.warn(
        `[resolveKey] Error searching for namespace attribute:`,
        err
      );
    }
  }

  // 2. Second priority: use context namespace if available
  const nsToUse =
    namespaceContext.length > 0
      ? namespaceContext[namespaceContext.length - 1]
      : null;
  if (nsToUse) {
    // Debug: console.log(`[resolveKey] Using context namespace: ${nsToUse} for key: ${key}`);
    return `${nsToUse}.${key}`;
  }

  // 3. Third priority: use global namespace if available
  if (currentNamespace) {
    // Debug: console.log(`[resolveKey] Using global namespace: ${currentNamespace} for key: ${key}`);
    return `${currentNamespace}.${key}`;
  }

  // No namespace found, return the original key
  return key;
}

export function setSignal(initialValue, options = {}) {
  const { key, element } = options || {};
  const subscribers = new Set();
  let value = initialValue;

  // Resolve the key with namespace if necessary
  const resolvedKey = key ? resolveKey(key, element) : null;

  // Debug: console.log(`[setSignal] Original key: ${key}, Resolved key: ${resolvedKey}, Element:`, element);

  if (resolvedKey && gun) {
    // Store for resolved key, to retrieve existing signal instances with the same key
    if (!window._nodomSignalStore) {
      window._nodomSignalStore = new Map();
    }

    // Check if a signal with this key already exists
    if (window._nodomSignalStore.has(resolvedKey)) {
      const existingSignal = window._nodomSignalStore.get(resolvedKey);
      // Add observers to the existing instance
      return existingSignal;
    }

    const node = gun.get(resolvedKey);

    // Retrieve the initial value
    let initializing = true;
    node.once((data) => {
      if (data && data.value !== undefined) {
        value = data.value;
        if (!initializing) {
          subscribers.forEach((fn) => fn());
        }
      }
    });
    initializing = false;

    // Listen for changes
    node.on((data) => {
      if (data && data.value !== undefined) {
        value = data.value;
        subscribers.forEach((fn) => fn());
      }
    });
  }

  const read = () => {
    if (currentObserver) subscribers.add(currentObserver);
    return value;
  };

  const write = (newValue) => {
    value = typeof newValue === "function" ? newValue(value) : newValue;
    if (resolvedKey && gun) {
      gun.get(resolvedKey).put({ value });
      // Debug: console.log(`[setSignal] Set value in GunDB: ${newValue} for key: ${resolvedKey}`);
    }
    subscribers.forEach((fn) => fn());
  };

  const signal = [read, write];

  // Store the signal for reuse
  if (resolvedKey && gun) {
    window._nodomSignalStore.set(resolvedKey, signal);
  }

  return signal;
}

export function setEffect(fn) {
  const execute = () => {
    currentObserver = execute;
    fn();
    currentObserver = null;
  };
  execute();
}

export function setMemo(fn) {
  const [get, set] = setSignal();
  setEffect(() => set(fn()));
  return get;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const isSvg = (tag) =>
  /^(svg|path|circle|rect|line|polygon|polyline|ellipse|g|text|defs|use)$/.test(
    tag
  );

function insertChildren(parent, children) {
  if (!children) return;
  const childArray = Array.isArray(children) ? children.flat() : [children];
  for (const child of childArray) {
    if (child == null || typeof child === "boolean") continue;
    if (typeof child === "function") {
      const marker = document.createComment("");
      let lastNode = null;
      parent.appendChild(marker);
      setEffect(() => {
        const value = child();
        if (lastNode) {
          if (typeof lastNode === "object" && lastNode.nodeType) {
            lastNode.remove();
          } else {
            const next = marker.nextSibling;
            if (next && next.nodeType === 3) next.remove();
          }
        }
        if (value != null) {
          const newNode =
            typeof value === "object" && value.nodeType
              ? value
              : document.createTextNode(String(value));
          if (marker.parentNode) {
            marker.parentNode.insertBefore(newNode, marker.nextSibling);
            lastNode = newNode;
          }
        } else {
          lastNode = null;
        }
      });
    } else {
      parent.appendChild(
        typeof child === "object" && child.nodeType
          ? child
          : document.createTextNode(String(child))
      );
    }
  }
}

export function jsx(type, props = {}) {
  // Handle context namespace
  let oldNamespaceContext = null;
  if (props && props.namespace) {
    oldNamespaceContext = [...namespaceContext];
    namespaceContext.push(props.namespace);
    // Remove the namespace property to avoid adding it as an attribute
    delete props.namespace;
  }

  if (type === Fragment) {
    const fragment = document.createDocumentFragment();
    insertChildren(fragment, props.children);

    // Restore the namespace context
    if (oldNamespaceContext !== null) {
      namespaceContext = oldNamespaceContext;
    }

    return fragment;
  }

  if (typeof type === "function") {
    const result = type(props);

    // Restore the namespace context
    if (oldNamespaceContext !== null) {
      namespaceContext = oldNamespaceContext;
    }

    return result;
  }

  const el = isSvg(type)
    ? document.createElementNS(SVG_NS, type)
    : document.createElement(type);

  for (const key in props) {
    if (key === "children" || key === "ref" || key === "namespace") continue;
    if (key.startsWith("on") && typeof props[key] === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), props[key]);
    } else if (key === "style" && typeof props[key] === "object") {
      Object.assign(el.style, props[key]);
    } else if (key === "className" || key === "class") {
      if (typeof props[key] === "function") {
        // Handle reactive class - defer to avoid interference with event handling
        requestAnimationFrame(() => {
          setEffect(() => {
            el.setAttribute("class", props[key]());
          });
        });
        // Set initial value immediately
        try {
          el.setAttribute("class", props[key]());
        } catch (e) {
          console.warn("Error setting initial class:", e);
        }
      } else {
        el.setAttribute("class", props[key]);
      }
    } else if (key === "value" && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
      if (typeof props[key] === "function") {
        // Handle reactive value for inputs - defer to avoid interference
        requestAnimationFrame(() => {
          setEffect(() => {
            const newValue = props[key]();
            if (el.value !== newValue) {
              el.value = newValue;
            }
          });
        });
        // Set initial value immediately
        try {
          el.value = props[key]();
        } catch (e) {
          console.warn("Error setting initial value:", e);
        }
      } else {
        el.value = props[key];
      }
    } else if (key === "disabled") {
      if (typeof props[key] === "function") {
        // Handle reactive disabled - defer to avoid interference
        requestAnimationFrame(() => {
          setEffect(() => {
            const value = props[key]();
            if (value) {
              el.setAttribute("disabled", "");
            } else {
              el.removeAttribute("disabled");
            }
          });
        });
        // Set initial value immediately
        try {
          const initialValue = props[key]();
          if (initialValue) {
            el.setAttribute("disabled", "");
          }
        } catch (e) {
          console.warn("Error setting initial disabled:", e);
        }
      } else {
        if (props[key]) {
          el.setAttribute("disabled", "");
        }
      }
    } else if (typeof props[key] === "function") {
      // Handle other reactive properties - defer to avoid interference
      requestAnimationFrame(() => {
        setEffect(() => {
          const value = props[key]();
          if (value != null) {
            el.setAttribute(key, value);
          } else {
            el.removeAttribute(key);
          }
        });
      });
      // Set initial value immediately
      try {
        const initialValue = props[key]();
        if (initialValue != null) {
          el.setAttribute(key, initialValue);
        }
      } catch (e) {
        console.warn(`Error setting initial ${key}:`, e);
      }
    } else if (props[key] != null) {
      el.setAttribute(key, props[key]);
    }
  }

  // ** Automatic input binding **
  if (props.name && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
    // Use the key resolved with context namespace or attribute
    const resolvedKey = resolveKey(props.name, el);

    // Create a signal with the current input value
    const initialValue = el.value || "";
    const [get, set] = setSignal(initialValue, {
      key: resolvedKey,
      element: el,
    });

    // Synchronize the input with the value from DB
    el.value = get();

    // Update the input when the value changes in Gun
    setEffect(() => {
      const currentValue = get();
      if (el.value !== currentValue) {
        el.value = currentValue;
      }
    });

    // Update Gun when the input changes
    el.addEventListener("input", (e) => {
      set(e.target.value);
    });
  }

  if (props.ref && typeof props.ref === "function") {
    props.ref(el);
  }

  insertChildren(el, props.children);

  // Restore the namespace context
  if (oldNamespaceContext !== null) {
    namespaceContext = oldNamespaceContext;
  }

  return el;
}

export function h(type, props, ...children) {
  props = props || {};
  if (children.length)
    props.children = children.length === 1 ? children[0] : children;
  return jsx(type, props);
}

/**
 * Authenticates a user with Gun and sets the current namespace
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {boolean} createIfNeeded - If true, creates the user if it doesn't exist
 * @returns {Promise<object>} - Authentication result
 */
export async function auth(username, password, createIfNeeded = true) {
  if (!gun)
    throw new Error(
      "joy-lite: Gun instance not initialized. Call init(gun) first."
    );

  return new Promise((resolve, reject) => {
    gun.user().auth(username, password, (ack) => {
      if (ack.err && createIfNeeded) {
        gun.user().create(username, password, (createAck) => {
          if (createAck.err) {
            console.error("Failed to create user:", createAck.err);
            reject(createAck.err);
          } else {
            console.log("User created, logging in...");
            gun.user().auth(username, password, (loginAck) => {
              if (loginAck.err) {
                console.error("Failed to login after create:", loginAck.err);
                reject(loginAck.err);
              } else {
                // Set current user and get namespace
                currentUser = gun.user();
                updateNamespace();
                console.log("User logged in successfully!");
                console.log(
                  `Your namespace is publicly available at ${currentNamespace}`
                );
                resolve({ success: true, namespace: currentNamespace });
              }
            });
          }
        });
      } else if (ack.err) {
        console.error("Authentication error:", ack.err);
        reject(ack.err);
      } else {
        // Set current user and get namespace
        currentUser = gun.user();
        updateNamespace();
        console.log("User logged in successfully!");
        console.log(
          `Your namespace is publicly available at ${currentNamespace}`
        );
        resolve({ success: true, namespace: currentNamespace });
      }
    });
  });
}

/**
 * Updates the current namespace based on the authenticated user
 */
function updateNamespace() {
  if (!currentUser || !currentUser.is) {
    currentNamespace = null;
    return;
  }

  // Namespace format: ~[pubKey].[pubKey-hash]
  const pubKey = currentUser.is.pub;
  if (!pubKey) {
    currentNamespace = null;
    return;
  }

  // In JOY, uses a hash of the pub key as the second part of the namespace
  // For simplicity, we'll just use the pub key directly
  currentNamespace = `~${pubKey}`;
}

/**
 * Gets the current namespace of the authenticated user
 * @returns {string|null} - The current namespace or null if not authenticated
 */
export function getNamespace() {
  return currentNamespace;
}

/**
 * Logs out the current user
 */
export function logout() {
  if (!gun) return;

  gun.user().leave();
  currentUser = null;
  currentNamespace = null;
  console.log("User logged out");
}

/**
 * Manually sets a specific namespace
 * @param {string} namespace - The namespace to use
 */
export function setNamespace(namespace) {
  if (!namespace) {
    currentNamespace = null;
    return;
  }

  // Verify that the namespace has the correct format
  if (!namespace.startsWith("~")) {
    console.warn("Namespace should start with ~");
    namespace = `~${namespace}`;
  }

  currentNamespace = namespace;
  console.log(`Namespace set to: ${currentNamespace}`);
}

/**
 * Creates a container component with applied namespace
 * @param {string} namespace - The namespace to apply
 * @param {Function|Node} component - The component to render
 * @returns {Function} - A component with the namespace applied
 */
export function withNamespace(namespace, component) {
  return (props = {}) => {
    // If component is already a DOM node, wrap it in a div with namespace
    if (component instanceof Node) {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("namespace", namespace);
      wrapper.appendChild(component);
      return wrapper;
    }

    // Otherwise, create a new component with the namespace applied
    return jsx("div", { namespace, ...props }, component);
  };
}

export default {
  setSignal,
  setEffect,
  setMemo,
  jsx,
  h,
  Fragment,
  auth,
  getNamespace,
  logout,
  setNamespace,
  withNamespace,
};
