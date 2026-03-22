import { AuthManager } from '../../managers/AuthManager';
import { IShogunCore } from '../../interfaces/shogun';
import { ErrorHandler, ErrorType } from '../../utils/errorHandler';

describe('AuthManager Security', () => {
  let authManager: AuthManager;
  let mockCore: jest.Mocked<IShogunCore>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockCore = {
      db: {
        signUp: jest.fn(),
      },
      emit: jest.fn(),
    } as any;

    authManager = new AuthManager(mockCore);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Clear ErrorHandler state if necessary
    ErrorHandler.clearErrors();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should not leak full error object in signUp console log after fix', async () => {
    const sensitiveStackTrace =
      'Error: Sensitive Stack Trace\n    at Object.signUp (test.ts:1:1)';
    const errorWithSensitiveInfo = new Error('Registration failed');
    errorWithSensitiveInfo.stack = sensitiveStackTrace;

    (mockCore.db.signUp as jest.Mock).mockRejectedValue(errorWithSensitiveInfo);

    await authManager.signUp('testuser', 'password123');

    // Verify the fix: console.error is NOT called with the full error object directly from AuthManager
    // It should be called by ErrorHandler.handleError, which only logs the message.

    // For AuthenticationError, ErrorHandler.handleError logs: `[${error.type}] ${error.code}: ${error.message}`
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `[${ErrorType.AUTHENTICATION}] SIGNUP_FAILED: Error during registration for user testuser: Registration failed`,
    );

    // Verify it was NOT called with the full error object as a second argument
    consoleErrorSpy.mock.calls.forEach((call) => {
      expect(call).not.toContain(errorWithSensitiveInfo);
      call.forEach((arg) => {
        if (typeof arg === 'string') {
          expect(arg).not.toContain('Sensitive Stack Trace');
        }
      });
    });
  });
});
