import { expect, describe, it, jest, beforeEach } from '@jest/globals';
import { Web3Signer } from '../../../plugins/web3/web3Signer';
import { ErrorHandler, ErrorType } from '../../../utils/errorHandler';

// Mock ErrorHandler
jest.mock('../../../utils/errorHandler', () => ({
  ErrorHandler: {
    handle: jest.fn(),
  },
  ErrorType: {
    AUTHENTICATION: 'AuthenticationError',
    WALLET: 'WalletError',
    ENCRYPTION: 'EncryptionError',
    DATABASE: 'DatabaseError',
    SIGNATURE: 'SignatureError',
  },
}));

// Mock derive function
jest.mock('../../../gundb/derive', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    pub: 'mockPub',
    priv: 'mockPriv',
    epub: 'mockEPub',
    epriv: 'mockEPriv',
  }),
}));

describe('Web3Signer Security', () => {
  let web3Signer: Web3Signer;
  let mockGun: any;

  beforeEach(() => {
    jest.clearAllMocks();
    web3Signer = new Web3Signer();
    mockGun = {
      user: jest.fn().mockReturnValue({
        auth: jest.fn(),
        create: jest.fn(),
      }),
    };
  });

  it('should call ErrorHandler when GunDB authentication fails in authenticateWithExistingPair', async () => {
    const address = '0x1234567890123456789012345678901234567890';
    const authError = { err: 'Invalid credentials' };

    // Mock GunDB auth to fail
    (mockGun.user().auth as jest.Mock).mockImplementation((pair, callback) => {
      callback(authError);
    });

    const result = await web3Signer.authenticateWithExistingPair(address, mockGun);

    expect(result.success).toBe(false);
    expect(result.error).toBe(authError.err);

    // Verify ErrorHandler was called instead of console.log
    expect(ErrorHandler.handle).toHaveBeenCalledWith(
      ErrorType.AUTHENTICATION,
      'WEB3_GUN_AUTH_FAILED',
      expect.any(String),
      authError.err
    );
  });

  it('should call ErrorHandler when createDerivedKeyPairFromAddress fails', async () => {
     // Trigger an error by passing an invalid address that ethers.getAddress would reject
     const invalidAddress = 'invalid-address';

     try {
       await web3Signer.createDerivedKeyPairFromAddress(invalidAddress);
     } catch (e) {
       // Expected error
     }

     expect(ErrorHandler.handle).toHaveBeenCalledWith(
       ErrorType.ENCRYPTION,
       'WEB3_KEY_DERIVATION_ERROR',
       expect.any(String),
       expect.any(Error)
     );
  });
});
