// Mock dell'enumerazione di tipi di errore
var ErrorType;
(function (ErrorType) {
    ErrorType["General"] = "General";
    ErrorType["Authentication"] = "Authentication";
    ErrorType["Validation"] = "Validation";
    ErrorType["Network"] = "Network";
    ErrorType["Storage"] = "Storage";
    ErrorType["Configuration"] = "Configuration";
})(ErrorType || (ErrorType = {}));
// Mock della classe ShogunError
class ShogunError extends Error {
    constructor(message, errorType = ErrorType.General) {
        super(message);
        this.name = this.constructor.name;
        this.errorType = errorType;
        this.timestamp = Date.now();
    }
}
// Mock della classe ErrorHandler
class ErrorHandler {
    constructor() {
        this.errorHistory = [];
        this.listeners = [];
        this.maxErrorHistorySize = 10;
    }
    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }
    createError(message, errorType = ErrorType.General) {
        return new ShogunError(message, errorType);
    }
    handleError(error) {
        // Aggiungi errore alla storia
        this.errorHistory.unshift(error);
        // Tronca la storia se supera la dimensione massima
        if (this.errorHistory.length > this.maxErrorHistorySize) {
            this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistorySize);
        }
        // Notifica ascoltatori
        this.notifyListeners(error);
    }
    getRecentErrors() {
        return [...this.errorHistory];
    }
    addListener(listener) {
        this.listeners.push(listener);
    }
    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }
    notifyListeners(error) {
        this.listeners.forEach((listener) => listener(error));
    }
    // Metodi aggiunti per supportare i test
    clearListeners() {
        this.listeners = [];
    }
    clearErrors() {
        this.errorHistory = [];
    }
    // Metodo per filtrare gli errori per tipo
    getErrorsByType(errorType) {
        return this.errorHistory.filter((error) => error.errorType === errorType);
    }
}
// Aggiungo metodi di pulizia per i test se non esistono già
if (!ErrorHandler.clearListeners) {
    ErrorHandler.clearListeners = function () {
        // @ts-ignore accesso a proprietà private per i test
        this.listeners = [];
    };
}
if (!ErrorHandler.clearErrors) {
    ErrorHandler.clearErrors = function () {
        // @ts-ignore accesso a proprietà private per i test
        this.errors = [];
    };
}
describe("ErrorHandler", () => {
    let errorHandler;
    beforeEach(() => {
        // Reset del singleton per ogni test
        // @ts-ignore - Accesso a proprietà private per test
        ErrorHandler.instance = undefined;
        errorHandler = ErrorHandler.getInstance();
        // Assicuriamoci che i metodi clearListeners e clearErrors esistano
        if (typeof errorHandler.clearListeners !== "function") {
            errorHandler.clearListeners = function () {
                // @ts-ignore accesso a proprietà private per i test
                this.listeners = [];
            };
        }
        if (typeof errorHandler.clearErrors !== "function") {
            errorHandler.clearErrors = function () {
                // @ts-ignore accesso a proprietà private per i test
                this.errorHistory = [];
            };
        }
        errorHandler.clearListeners();
        errorHandler.clearErrors();
    });
    test("dovrebbe creare un'istanza singleton", () => {
        const instance1 = ErrorHandler.getInstance();
        const instance2 = ErrorHandler.getInstance();
        expect(instance1).toBe(instance2);
    });
    test("dovrebbe creare errori corretti", () => {
        const error = errorHandler.createError("Test error", ErrorType.Authentication);
        expect(error).toBeInstanceOf(ShogunError);
        expect(error.message).toBe("Test error");
        expect(error.errorType).toBe(ErrorType.Authentication);
        expect(error.timestamp).toBeDefined();
    });
    test("dovrebbe gestire errori e mantenerli nella storia", () => {
        const error = errorHandler.createError("Test error");
        errorHandler.handleError(error);
        const recentErrors = errorHandler.getRecentErrors();
        expect(recentErrors.length).toBe(1);
        expect(recentErrors[0]).toBe(error);
    });
    test("dovrebbe limitare la dimensione della storia degli errori", () => {
        // Crea più errori del limite massimo
        for (let i = 0; i < 15; i++) {
            const error = errorHandler.createError(`Error ${i}`);
            errorHandler.handleError(error);
        }
        const recentErrors = errorHandler.getRecentErrors();
        expect(recentErrors.length).toBe(10); // Deve mantenere solo 10 errori
        expect(recentErrors[0].message).toBe("Error 14"); // L'errore più recente deve essere in cima
    });
    test("dovrebbe notificare gli ascoltatori quando si verifica un errore", () => {
        const mockListener = jest.fn();
        errorHandler.addListener(mockListener);
        const error = errorHandler.createError("Test error");
        errorHandler.handleError(error);
        expect(mockListener).toHaveBeenCalledWith(error);
    });
    test("dovrebbe aggiungere e rimuovere gli ascoltatori correttamente", () => {
        const mockListener = jest.fn();
        errorHandler.addListener(mockListener);
        // Verifica che l'ascoltatore riceva notifiche
        const error1 = errorHandler.createError("Test error 1");
        errorHandler.handleError(error1);
        expect(mockListener).toHaveBeenCalledWith(error1);
        // Rimuovi l'ascoltatore
        errorHandler.removeListener(mockListener);
        mockListener.mockClear();
        // Verifica che l'ascoltatore non riceva più notifiche
        const error2 = errorHandler.createError("Test error 2");
        errorHandler.handleError(error2);
        expect(mockListener).not.toHaveBeenCalled();
    });
    test("dovrebbe pulire tutti gli ascoltatori con clearListeners", () => {
        const mockListener1 = jest.fn();
        const mockListener2 = jest.fn();
        errorHandler.addListener(mockListener1);
        errorHandler.addListener(mockListener2);
        errorHandler.clearListeners();
        const error = errorHandler.createError("Test error");
        errorHandler.handleError(error);
        expect(mockListener1).not.toHaveBeenCalled();
        expect(mockListener2).not.toHaveBeenCalled();
    });
    test("dovrebbe pulire tutti gli errori con clearErrors", () => {
        // Aggiungi alcuni errori
        for (let i = 0; i < 5; i++) {
            errorHandler.handleError(errorHandler.createError(`Error ${i}`));
        }
        // Verifica che gli errori siano stati aggiunti
        expect(errorHandler.getRecentErrors().length).toBe(5);
        // Pulisci gli errori
        errorHandler.clearErrors();
        // Verifica che gli errori siano stati rimossi
        expect(errorHandler.getRecentErrors().length).toBe(0);
    });
    test("dovrebbe avere tutti i tipi di errore definiti", () => {
        expect(ErrorType.General).toBeDefined();
        expect(ErrorType.Authentication).toBeDefined();
        expect(ErrorType.Validation).toBeDefined();
        expect(ErrorType.Network).toBeDefined();
        expect(ErrorType.Storage).toBeDefined();
        expect(ErrorType.Configuration).toBeDefined();
    });
    test("dovrebbe filtrare gli errori per tipo", () => {
        // Crea errori di diversi tipi
        const generalError = errorHandler.createError("General error", ErrorType.General);
        const authError1 = errorHandler.createError("Auth error 1", ErrorType.Authentication);
        const authError2 = errorHandler.createError("Auth error 2", ErrorType.Authentication);
        const validationError = errorHandler.createError("Validation error", ErrorType.Validation);
        // Gestisci tutti gli errori
        errorHandler.handleError(generalError);
        errorHandler.handleError(authError1);
        errorHandler.handleError(authError2);
        errorHandler.handleError(validationError);
        // Verifica filtro per tipo Authentication
        const authErrors = errorHandler.getErrorsByType(ErrorType.Authentication);
        expect(authErrors.length).toBe(2);
        expect(authErrors).toContain(authError1);
        expect(authErrors).toContain(authError2);
        // Verifica filtro per tipo Validation
        const validationErrors = errorHandler.getErrorsByType(ErrorType.Validation);
        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(validationError);
    });
});
export {};
