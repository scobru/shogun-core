declare const mockGun: {
    log: jest.Mock<any, any, any>;
    SEA: {
        pair: jest.Mock<any, any, any>;
        encrypt: jest.Mock<any, any, any>;
        decrypt: jest.Mock<any, any, any>;
        sign: jest.Mock<any, any, any>;
        verify: jest.Mock<any, any, any>;
        secret: jest.Mock<any, any, any>;
        work: jest.Mock<any, any, any>;
    };
};
export default mockGun;
