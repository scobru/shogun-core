import {
  handleError,
  ErrorCallback,
  ErrorOptions,
} from "../../utils/errorHandler";

describe("ErrorHandler - Test Aggiuntivi", () => {
  // Salviamo il console.error originale
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Mock di console.error
    console.error = jest.fn();
  });

  afterEach(() => {
    // Ripristino il console.error originale
    console.error = originalConsoleError;
  });

  test("dovrebbe gestire errori con messaggio personalizzato", () => {
    const customMessage = "Questo è un errore personalizzato";
    const error = new Error("Errore originale");

    // Opzioni con messaggio personalizzato
    const options: ErrorOptions = {
      message: customMessage,
      throwError: false,
      logError: true,
    };

    // Handler
    const result = handleError(error, options);

    // Verifiche
    expect(result.success).toBe(false);
    expect(result.message).toBe(customMessage);
    expect(console.error).toHaveBeenCalled();
  });

  test("dovrebbe utilizzare la callback quando fornita", () => {
    // Mock della callback
    const mockCallback: ErrorCallback = jest
      .fn()
      .mockReturnValue("Risultato della callback");

    const error = new Error("Errore di test");

    // Opzioni con callback
    const options: ErrorOptions = {
      callback: mockCallback,
      throwError: false,
      logError: false,
    };

    // Handler
    const result = handleError(error, options);

    // Verifiche
    expect(mockCallback).toHaveBeenCalledWith(error);
    expect(result).toBe("Risultato della callback");
  });

  test("dovrebbe lanciare l'errore quando throwError è true", () => {
    const error = new Error("Errore da lanciare");

    // Opzioni con throwError = true
    const options: ErrorOptions = {
      throwError: true,
      logError: false,
    };

    // Dovrebbe lanciare l'errore
    expect(() => handleError(error, options)).toThrow("Errore da lanciare");
  });

  test("dovrebbe gestire diversi tipi di errori", () => {
    // Test con stringa come errore
    const stringError = "Questo è un errore come stringa";
    const result1 = handleError(stringError, { throwError: false });
    expect(result1.success).toBe(false);
    expect(result1.message).toBe(stringError);

    // Test con oggetto generico come errore
    const objectError = { errorCode: 123, text: "Errore oggetto" };
    const result2 = handleError(objectError, { throwError: false });
    expect(result2.success).toBe(false);
    expect(result2.error).toBe(objectError);

    // Test con null/undefined come errore
    const result3 = handleError(null, {
      throwError: false,
      message: "Errore nullo",
    });
    expect(result3.success).toBe(false);
    expect(result3.message).toBe("Errore nullo");
  });
});
