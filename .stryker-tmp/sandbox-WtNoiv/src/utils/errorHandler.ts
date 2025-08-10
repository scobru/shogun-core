// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { LogLevel } from "../types/common";

/**
 * Types of errors that can occur in the application
 */
export enum ErrorType {
  AUTHENTICATION = "AuthenticationError",
  AUTHORIZATION = "AuthorizationError",
  VALIDATION = "ValidationError",
  NETWORK = "NetworkError",
  DATABASE = "DatabaseError",
  WALLET = "WalletError",
  STORAGE = "StorageError",
  ENCRYPTION = "EncryptionError",
  SIGNATURE = "SignatureError",
  ENVIRONMENT = "EnvironmentError",
  SECURITY = "SecurityError",
  GUN = "GunError",
  STEALTH = "StealthError",
  WEBAUTHN = "WebAuthnError",
  PLUGIN = "PluginError",
  UNKNOWN = "UnknownError",
  CONNECTOR = "ConnectorError",
  GENERAL = "GeneralError",
  CONTRACT = "ContractError",
  BIP32 = "BIP32Error",
  ETHEREUM = "EthereumError",
  BITCOIN = "BitcoinError",
}

/**
 * Standard interface for Shogun errors
 */
export interface ShogunError {
  type: ErrorType;
  code: string;
  message: string;
  originalError?: Error | unknown;
  timestamp: number;
}

/**
 * Wrapper to standardize errors
 * @param type - Error type
 * @param code - Error code
 * @param message - Error message
 * @param originalError - Original error
 * @returns A structured error object
 */
export function createError(type: ErrorType, code: string, message: string, originalError?: Error | unknown): ShogunError {
  if (stryMutAct_9fa48("6180")) {
    {}
  } else {
    stryCov_9fa48("6180");
    return stryMutAct_9fa48("6181") ? {} : (stryCov_9fa48("6181"), {
      type,
      code,
      message,
      originalError,
      timestamp: Date.now()
    });
  }
}

/**
 * Centralized error handler
 */
export class ErrorHandler {
  private static errors: ShogunError[] = stryMutAct_9fa48("6182") ? ["Stryker was here"] : (stryCov_9fa48("6182"), []);
  private static maxErrors: number = 100;
  private static listeners: Array<(error: ShogunError) => void> = stryMutAct_9fa48("6183") ? ["Stryker was here"] : (stryCov_9fa48("6183"), []);
  private static externalLogger: ((error: ShogunError) => void) | null = null;

  /**
   * Set an external logging service for production error monitoring
   * @param logger - External logger function to send errors to a monitoring service
   */
  static setExternalLogger(logger: (error: ShogunError) => void): void {
    if (stryMutAct_9fa48("6184")) {
      {}
    } else {
      stryCov_9fa48("6184");
      this.externalLogger = logger;
    }
  }

  /**
   * Handles an error by logging it and notifying listeners
   * @param error - The error to handle
   */
  static handleError(error: ShogunError): void {
    if (stryMutAct_9fa48("6185")) {
      {}
    } else {
      stryCov_9fa48("6185");
      // Log essential errors only
      if (stryMutAct_9fa48("6188") ? (error.type === ErrorType.AUTHENTICATION || error.type === ErrorType.AUTHORIZATION) && error.type === ErrorType.SECURITY : stryMutAct_9fa48("6187") ? false : stryMutAct_9fa48("6186") ? true : (stryCov_9fa48("6186", "6187", "6188"), (stryMutAct_9fa48("6190") ? error.type === ErrorType.AUTHENTICATION && error.type === ErrorType.AUTHORIZATION : stryMutAct_9fa48("6189") ? false : (stryCov_9fa48("6189", "6190"), (stryMutAct_9fa48("6192") ? error.type !== ErrorType.AUTHENTICATION : stryMutAct_9fa48("6191") ? false : (stryCov_9fa48("6191", "6192"), error.type === ErrorType.AUTHENTICATION)) || (stryMutAct_9fa48("6194") ? error.type !== ErrorType.AUTHORIZATION : stryMutAct_9fa48("6193") ? false : (stryCov_9fa48("6193", "6194"), error.type === ErrorType.AUTHORIZATION)))) || (stryMutAct_9fa48("6196") ? error.type !== ErrorType.SECURITY : stryMutAct_9fa48("6195") ? false : (stryCov_9fa48("6195", "6196"), error.type === ErrorType.SECURITY)))) {
        if (stryMutAct_9fa48("6197")) {
          {}
        } else {
          stryCov_9fa48("6197");
          console.error(stryMutAct_9fa48("6198") ? `` : (stryCov_9fa48("6198"), `[${error.type}] ${error.code}: ${error.message}`));
        }
      }

      // Store the error in memory
      this.errors.push(error);

      // Keep only the last maxErrors
      if (stryMutAct_9fa48("6202") ? this.errors.length <= this.maxErrors : stryMutAct_9fa48("6201") ? this.errors.length >= this.maxErrors : stryMutAct_9fa48("6200") ? false : stryMutAct_9fa48("6199") ? true : (stryCov_9fa48("6199", "6200", "6201", "6202"), this.errors.length > this.maxErrors)) {
        if (stryMutAct_9fa48("6203")) {
          {}
        } else {
          stryCov_9fa48("6203");
          this.errors = stryMutAct_9fa48("6204") ? this.errors : (stryCov_9fa48("6204"), this.errors.slice(stryMutAct_9fa48("6205") ? +this.maxErrors : (stryCov_9fa48("6205"), -this.maxErrors)));
        }
      }

      // Send to external logger if set (for production monitoring)
      if (stryMutAct_9fa48("6207") ? false : stryMutAct_9fa48("6206") ? true : (stryCov_9fa48("6206", "6207"), this.externalLogger)) {
        if (stryMutAct_9fa48("6208")) {
          {}
        } else {
          stryCov_9fa48("6208");
          try {
            if (stryMutAct_9fa48("6209")) {
              {}
            } else {
              stryCov_9fa48("6209");
              this.externalLogger(error);
            }
          } catch (e) {
            if (stryMutAct_9fa48("6210")) {
              {}
            } else {
              stryCov_9fa48("6210");
              // Fallback logging for external logger errors
              console.error(stryMutAct_9fa48("6211") ? "" : (stryCov_9fa48("6211"), "Failed to send error to external logger:"), e);
            }
          }
        }
      }

      // Notify all listeners
      this.listeners.forEach(listener => {
        if (stryMutAct_9fa48("6212")) {
          {}
        } else {
          stryCov_9fa48("6212");
          try {
            if (stryMutAct_9fa48("6213")) {
              {}
            } else {
              stryCov_9fa48("6213");
              listener(error);
            }
          } catch (e) {
            // Silent error to prevent infinite loops
          }
        }
      });
    }
  }

  /**
   * Handles a raw error by converting it to ShogunError
   * @param type - Error type
   * @param code - Error code
   * @param message - Error message
   * @param originalError - Original error
   * @param logLevel - Log level for the error
   */
  static handle(type: ErrorType, code: string, message: string, originalError?: Error | unknown, logLevel: LogLevel = stryMutAct_9fa48("6214") ? "" : (stryCov_9fa48("6214"), "error")): ShogunError {
    if (stryMutAct_9fa48("6215")) {
      {}
    } else {
      stryCov_9fa48("6215");
      // Create a formatted error message
      const finalMessage = originalError ? stryMutAct_9fa48("6216") ? `` : (stryCov_9fa48("6216"), `${message} - ${this.formatError(originalError)}`) : message;

      // Log the error
      switch (logLevel) {
        case stryMutAct_9fa48("6218") ? "" : (stryCov_9fa48("6218"), "debug"):
          if (stryMutAct_9fa48("6217")) {} else {
            stryCov_9fa48("6217");
            console.log(stryMutAct_9fa48("6219") ? `` : (stryCov_9fa48("6219"), `[${type}.${code}] (DEBUG) ${finalMessage}`));
            break;
          }
        case stryMutAct_9fa48("6221") ? "" : (stryCov_9fa48("6221"), "warn"):
          if (stryMutAct_9fa48("6220")) {} else {
            stryCov_9fa48("6220");
            console.log(stryMutAct_9fa48("6222") ? `` : (stryCov_9fa48("6222"), `[${type}.${code}] (WARN) ${finalMessage}`));
            break;
          }
        case stryMutAct_9fa48("6224") ? "" : (stryCov_9fa48("6224"), "info"):
          if (stryMutAct_9fa48("6223")) {} else {
            stryCov_9fa48("6223");
            console.log(stryMutAct_9fa48("6225") ? `` : (stryCov_9fa48("6225"), `[${type}.${code}] (INFO) ${finalMessage}`));
            break;
          }
        case stryMutAct_9fa48("6226") ? "" : (stryCov_9fa48("6226"), "error"):
        default:
          if (stryMutAct_9fa48("6227")) {} else {
            stryCov_9fa48("6227");
            console.log(stryMutAct_9fa48("6228") ? `` : (stryCov_9fa48("6228"), `[${type}.${code}] (ERROR) ${finalMessage}`));
            if (stryMutAct_9fa48("6231") ? originalError || originalError instanceof Error : stryMutAct_9fa48("6230") ? false : stryMutAct_9fa48("6229") ? true : (stryCov_9fa48("6229", "6230", "6231"), originalError && originalError instanceof Error)) {
              if (stryMutAct_9fa48("6232")) {
                {}
              } else {
                stryCov_9fa48("6232");
                console.log(stryMutAct_9fa48("6235") ? originalError.stack && "No stack trace available" : stryMutAct_9fa48("6234") ? false : stryMutAct_9fa48("6233") ? true : (stryCov_9fa48("6233", "6234", "6235"), originalError.stack || (stryMutAct_9fa48("6236") ? "" : (stryCov_9fa48("6236"), "No stack trace available"))));
              }
            }
            break;
          }
      }
      const error = createError(type, code, finalMessage, originalError);
      this.handleError(error);
      return error;
    }
  }

  /**
   * Handles errors and throws them as standardized ShogunError objects
   * @param type - Error type
   * @param code - Error code
   * @param message - Error message
   * @param originalError - Original error
   * @throws ShogunError
   */
  static handleAndThrow(type: ErrorType, code: string, message: string, originalError?: Error | unknown): never {
    if (stryMutAct_9fa48("6237")) {
      {}
    } else {
      stryCov_9fa48("6237");
      const error = this.handle(type, code, message, originalError);
      throw error;
    }
  }

  /**
   * Retrieves the last N errors
   * @param count - Number of errors to retrieve
   * @returns List of most recent errors
   */
  static getRecentErrors(count: number = 10): ShogunError[] {
    if (stryMutAct_9fa48("6238")) {
      {}
    } else {
      stryCov_9fa48("6238");
      return stryMutAct_9fa48("6239") ? this.errors : (stryCov_9fa48("6239"), this.errors.slice(stryMutAct_9fa48("6240") ? +Math.min(count, this.errors.length) : (stryCov_9fa48("6240"), -(stryMutAct_9fa48("6241") ? Math.max(count, this.errors.length) : (stryCov_9fa48("6241"), Math.min(count, this.errors.length))))));
    }
  }

  /**
   * Adds a listener for errors
   * @param listener - Function that will be called when an error occurs
   */
  static addListener(listener: (error: ShogunError) => void): void {
    if (stryMutAct_9fa48("6242")) {
      {}
    } else {
      stryCov_9fa48("6242");
      this.listeners.push(listener);
    }
  }

  /**
   * Removes an error listener
   * @param listener - Function to remove
   */
  static removeListener(listener: (error: ShogunError) => void): void {
    if (stryMutAct_9fa48("6243")) {
      {}
    } else {
      stryCov_9fa48("6243");
      const index = this.listeners.indexOf(listener);
      if (stryMutAct_9fa48("6246") ? index === -1 : stryMutAct_9fa48("6245") ? false : stryMutAct_9fa48("6244") ? true : (stryCov_9fa48("6244", "6245", "6246"), index !== (stryMutAct_9fa48("6247") ? +1 : (stryCov_9fa48("6247"), -1)))) {
        if (stryMutAct_9fa48("6248")) {
          {}
        } else {
          stryCov_9fa48("6248");
          this.listeners.splice(index, 1);
        }
      }
    }
  }

  /**
   * Notifies all listeners of an error
   * @param error - Error to notify
   */
  private static notifyListeners(error: ShogunError): void {
    if (stryMutAct_9fa48("6249")) {
      {}
    } else {
      stryCov_9fa48("6249");
      for (const listener of this.listeners) {
        if (stryMutAct_9fa48("6250")) {
          {}
        } else {
          stryCov_9fa48("6250");
          try {
            if (stryMutAct_9fa48("6251")) {
              {}
            } else {
              stryCov_9fa48("6251");
              listener(error);
            }
          } catch (listenerError) {
            if (stryMutAct_9fa48("6252")) {
              {}
            } else {
              stryCov_9fa48("6252");
              console.error(stryMutAct_9fa48("6253") ? `` : (stryCov_9fa48("6253"), `Error in error listener: ${listenerError}`));
            }
          }
        }
      }
    }
  }

  /**
   * Helper function to format error messages from native errors
   * @param error - Error to format
   * @returns Formatted error message
   */
  static formatError(error: Error | unknown): string {
    if (stryMutAct_9fa48("6254")) {
      {}
    } else {
      stryCov_9fa48("6254");
      if (stryMutAct_9fa48("6257") ? false : stryMutAct_9fa48("6256") ? true : stryMutAct_9fa48("6255") ? error : (stryCov_9fa48("6255", "6256", "6257"), !error)) {
        if (stryMutAct_9fa48("6258")) {
          {}
        } else {
          stryCov_9fa48("6258");
          return stryMutAct_9fa48("6259") ? "" : (stryCov_9fa48("6259"), "Unknown error");
        }
      }
      if (stryMutAct_9fa48("6261") ? false : stryMutAct_9fa48("6260") ? true : (stryCov_9fa48("6260", "6261"), error instanceof Error)) {
        if (stryMutAct_9fa48("6262")) {
          {}
        } else {
          stryCov_9fa48("6262");
          return stryMutAct_9fa48("6263") ? `` : (stryCov_9fa48("6263"), `${error.name}: ${error.message}`);
        }
      }
      if (stryMutAct_9fa48("6266") ? typeof error !== "string" : stryMutAct_9fa48("6265") ? false : stryMutAct_9fa48("6264") ? true : (stryCov_9fa48("6264", "6265", "6266"), typeof error === (stryMutAct_9fa48("6267") ? "" : (stryCov_9fa48("6267"), "string")))) {
        if (stryMutAct_9fa48("6268")) {
          {}
        } else {
          stryCov_9fa48("6268");
          return error;
        }
      }
      if (stryMutAct_9fa48("6271") ? typeof error !== "object" : stryMutAct_9fa48("6270") ? false : stryMutAct_9fa48("6269") ? true : (stryCov_9fa48("6269", "6270", "6271"), typeof error === (stryMutAct_9fa48("6272") ? "" : (stryCov_9fa48("6272"), "object")))) {
        if (stryMutAct_9fa48("6273")) {
          {}
        } else {
          stryCov_9fa48("6273");
          try {
            if (stryMutAct_9fa48("6274")) {
              {}
            } else {
              stryCov_9fa48("6274");
              return JSON.stringify(error);
            }
          } catch (e) {
            if (stryMutAct_9fa48("6275")) {
              {}
            } else {
              stryCov_9fa48("6275");
              return stryMutAct_9fa48("6276") ? `` : (stryCov_9fa48("6276"), `Object: ${Object.prototype.toString.call(error)}`);
            }
          }
        }
      }
      return String(error);
    }
  }

  /**
   * Error handling with retry logic
   */
  static async withRetry<T>(fn: () => Promise<T>, errorType: ErrorType, errorCode: string, maxRetries = 3, retryDelay = 1000): Promise<T> {
    if (stryMutAct_9fa48("6277")) {
      {}
    } else {
      stryCov_9fa48("6277");
      let lastError: unknown;
      for (let attempt = 1; stryMutAct_9fa48("6280") ? attempt > maxRetries : stryMutAct_9fa48("6279") ? attempt < maxRetries : stryMutAct_9fa48("6278") ? false : (stryCov_9fa48("6278", "6279", "6280"), attempt <= maxRetries); stryMutAct_9fa48("6281") ? attempt-- : (stryCov_9fa48("6281"), attempt++)) {
        if (stryMutAct_9fa48("6282")) {
          {}
        } else {
          stryCov_9fa48("6282");
          try {
            if (stryMutAct_9fa48("6283")) {
              {}
            } else {
              stryCov_9fa48("6283");
              return await fn();
            }
          } catch (error) {
            if (stryMutAct_9fa48("6284")) {
              {}
            } else {
              stryCov_9fa48("6284");
              lastError = error;
              const delay = stryMutAct_9fa48("6285") ? retryDelay / attempt : (stryCov_9fa48("6285"), retryDelay * attempt);
              if (stryMutAct_9fa48("6289") ? attempt >= maxRetries : stryMutAct_9fa48("6288") ? attempt <= maxRetries : stryMutAct_9fa48("6287") ? false : stryMutAct_9fa48("6286") ? true : (stryCov_9fa48("6286", "6287", "6288", "6289"), attempt < maxRetries)) {
                if (stryMutAct_9fa48("6290")) {
                  {}
                } else {
                  stryCov_9fa48("6290");
                  console.log(stryMutAct_9fa48("6291") ? `` : (stryCov_9fa48("6291"), `Retrying operation after ${delay}ms (attempt ${attempt}/${maxRetries})`));
                  await new Promise(stryMutAct_9fa48("6292") ? () => undefined : (stryCov_9fa48("6292"), resolve => setTimeout(resolve, delay)));
                }
              }
            }
          }
        }
      }

      // If we got here, all retries failed.
      // Create the error, then throw a new Error instance for better compatibility with test runners.
      const shogunError = this.handle(errorType, errorCode, stryMutAct_9fa48("6293") ? `` : (stryCov_9fa48("6293"), `Operation failed after ${maxRetries} attempts`), lastError);
      throw new Error(shogunError.message);
    }
  }

  /**
   * Clear all stored errors
   */
  static clearErrors(): void {
    if (stryMutAct_9fa48("6294")) {
      {}
    } else {
      stryCov_9fa48("6294");
      this.errors = stryMutAct_9fa48("6295") ? ["Stryker was here"] : (stryCov_9fa48("6295"), []);
    }
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    byCode: Record<string, number>;
  } {
    if (stryMutAct_9fa48("6296")) {
      {}
    } else {
      stryCov_9fa48("6296");
      const stats = stryMutAct_9fa48("6297") ? {} : (stryCov_9fa48("6297"), {
        total: this.errors.length,
        byType: {} as Record<string, number>,
        byCode: {} as Record<string, number>
      });
      for (const error of this.errors) {
        if (stryMutAct_9fa48("6298")) {
          {}
        } else {
          stryCov_9fa48("6298");
          stats.byType[error.type] = stryMutAct_9fa48("6299") ? (stats.byType[error.type] || 0) - 1 : (stryCov_9fa48("6299"), (stryMutAct_9fa48("6302") ? stats.byType[error.type] && 0 : stryMutAct_9fa48("6301") ? false : stryMutAct_9fa48("6300") ? true : (stryCov_9fa48("6300", "6301", "6302"), stats.byType[error.type] || 0)) + 1);
          stats.byCode[error.code] = stryMutAct_9fa48("6303") ? (stats.byCode[error.code] || 0) - 1 : (stryCov_9fa48("6303"), (stryMutAct_9fa48("6306") ? stats.byCode[error.code] && 0 : stryMutAct_9fa48("6305") ? false : stryMutAct_9fa48("6304") ? true : (stryCov_9fa48("6304", "6305", "6306"), stats.byCode[error.code] || 0)) + 1);
        }
      }
      return stats;
    }
  }

  /**
   * Debug helper - logs messages only in development
   */
  static debug(type: ErrorType, code: string, message: string, level: LogLevel = stryMutAct_9fa48("6307") ? "" : (stryCov_9fa48("6307"), "debug")): void {
    if (stryMutAct_9fa48("6308")) {
      {}
    } else {
      stryCov_9fa48("6308");
      // Only log debug messages in development environment
      if (stryMutAct_9fa48("6311") ? process.env.NODE_ENV !== "development" : stryMutAct_9fa48("6310") ? false : stryMutAct_9fa48("6309") ? true : (stryCov_9fa48("6309", "6310", "6311"), process.env.NODE_ENV === (stryMutAct_9fa48("6312") ? "" : (stryCov_9fa48("6312"), "development")))) {
        if (stryMutAct_9fa48("6313")) {
          {}
        } else {
          stryCov_9fa48("6313");
          const finalMessage = stryMutAct_9fa48("6314") ? `` : (stryCov_9fa48("6314"), `${message}`);
          switch (level) {
            case stryMutAct_9fa48("6316") ? "" : (stryCov_9fa48("6316"), "error"):
              if (stryMutAct_9fa48("6315")) {} else {
                stryCov_9fa48("6315");
                console.error(stryMutAct_9fa48("6317") ? `` : (stryCov_9fa48("6317"), `[${type}.${code}] ${finalMessage}`));
                break;
              }
            case stryMutAct_9fa48("6319") ? "" : (stryCov_9fa48("6319"), "warn"):
              if (stryMutAct_9fa48("6318")) {} else {
                stryCov_9fa48("6318");
                console.warn(stryMutAct_9fa48("6320") ? `` : (stryCov_9fa48("6320"), `[${type}.${code}] ${finalMessage}`));
                break;
              }
            case stryMutAct_9fa48("6322") ? "" : (stryCov_9fa48("6322"), "info"):
              if (stryMutAct_9fa48("6321")) {} else {
                stryCov_9fa48("6321");
                console.log(stryMutAct_9fa48("6323") ? `` : (stryCov_9fa48("6323"), `[${type}.${code}] ${finalMessage}`));
                break;
              }
            case stryMutAct_9fa48("6325") ? "" : (stryCov_9fa48("6325"), "debug"):
              if (stryMutAct_9fa48("6324")) {} else {
                stryCov_9fa48("6324");
                console.log(stryMutAct_9fa48("6326") ? `` : (stryCov_9fa48("6326"), `[${type}.${code}] (DEBUG) ${finalMessage}`));
                break;
              }
          }
        }
      }
    }
  }
}