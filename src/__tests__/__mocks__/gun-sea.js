// Mock for Gun/SEA
module.exports = {
  encrypt: jest.fn().mockResolvedValue('encrypted_data'),
  decrypt: jest.fn().mockResolvedValue('decrypted_data'),
  work: jest.fn().mockResolvedValue('hashed_data'),
  pair: jest.fn().mockResolvedValue({
    pub: 'mock_pub_key',
    priv: 'mock_priv_key',
    epub: 'mock_epub_key',
    epriv: 'mock_epriv_key'
  }),
  sign: jest.fn().mockResolvedValue('signed_data'),
  verify: jest.fn().mockResolvedValue(true)
};
