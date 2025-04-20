const mockGun = {
  log: jest.fn(),
  SEA: {
    pair: jest.fn().mockResolvedValue({
      pub: "mock-pub",
      priv: "mock-priv",
      epub: "mock-epub",
      epriv: "mock-epriv",
    }),
    encrypt: jest
      .fn()
      .mockImplementation((data) => Promise.resolve(`encrypted:${data}`)),
    decrypt: jest.fn().mockImplementation((data) => {
      if (typeof data === "string" && data.startsWith("encrypted:")) {
        return Promise.resolve(data.replace("encrypted:", ""));
      }
      return Promise.resolve(null);
    }),
    sign: jest
      .fn()
      .mockImplementation((data) => Promise.resolve(`signed:${data}`)),
    verify: jest.fn().mockImplementation(() => Promise.resolve(true)),
    secret: jest.fn().mockImplementation((_key, _pair, cb) => {
      if (typeof cb === "function") {
        setTimeout(() => cb("sharedSecret123"), 0);
        return Promise.resolve();
      }
      return Promise.resolve("sharedSecret123");
    }),
    work: jest
      .fn()
      .mockImplementation(() => Promise.resolve("mock-work-result")),
  },
};

export default mockGun;
