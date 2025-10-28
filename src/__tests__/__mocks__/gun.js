// Mock for Gun
const mockGun = jest.fn(() => ({
  user: jest.fn(() => ({
    auth: jest.fn(),
    create: jest.fn(),
    get: jest.fn(() => ({
      put: jest.fn(),
      once: jest.fn(),
      map: jest.fn(),
      on: jest.fn()
    })),
    put: jest.fn(),
    once: jest.fn(),
    map: jest.fn(),
    on: jest.fn(),
    _: {
      sea: {
        pub: 'mock_pub_key',
        priv: 'mock_priv_key',
        epub: 'mock_epub_key',
        epriv: 'mock_epriv_key'
      }
    }
  })),
  get: jest.fn(() => ({
    put: jest.fn(),
    once: jest.fn(),
    map: jest.fn(),
    on: jest.fn()
  })),
  put: jest.fn(),
  once: jest.fn(),
  map: jest.fn(),
  on: jest.fn(),
  opt: jest.fn()
}));

module.exports = mockGun;
