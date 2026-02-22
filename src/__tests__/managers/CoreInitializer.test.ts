import { CoreInitializer } from '../../managers/CoreInitializer';
import { IShogunCore } from '../../interfaces/shogun';

describe('CoreInitializer SEA Resolution', () => {
  let coreMock: jest.Mocked<IShogunCore>;
  let initializer: CoreInitializer;

  beforeEach(() => {
    coreMock = {
      _gun: {} as any,
      emit: jest.fn(),
    } as any;
    initializer = new CoreInitializer(coreMock);

    // Clear globals
    (globalThis as any).Gun = undefined;
    (globalThis as any).Holster = undefined;
    (globalThis as any).SEA = undefined;

    if (typeof global !== 'undefined') {
      (global as any).Gun = undefined;
      (global as any).Holster = undefined;
      (global as any).SEA = undefined;
    }
  });

  afterAll(() => {
    // Cleanup
    delete (globalThis as any).Gun;
    delete (globalThis as any).Holster;
    delete (globalThis as any).SEA;
  });

  it('should resolve SEA from gun instance', () => {
    const mockSEA = { name: 'mockSEA-instance' };
    const gunInstance = { SEA: mockSEA };

    // Access private method for testing
    const resolvedSEA = (initializer as any).resolveSEA(gunInstance, false);
    expect(resolvedSEA).toBe(mockSEA);
  });

  it('should resolve SEA from global Gun.SEA', () => {
    const mockSEA = { name: 'mockSEA-global-gun' };
    (globalThis as any).Gun = { SEA: mockSEA };

    const resolvedSEA = (initializer as any).resolveSEA({}, false);
    expect(resolvedSEA).toBe(mockSEA);
  });

  it('should resolve SEA from global Holster.SEA', () => {
    const mockSEA = { name: 'mockSEA-global-holster' };
    (globalThis as any).Holster = { SEA: mockSEA };

    const resolvedSEA = (initializer as any).resolveSEA({}, true);
    expect(resolvedSEA).toBe(mockSEA);
  });

  it('should resolve SEA from globalThis.SEA', () => {
    const mockSEA = { name: 'mockSEA-globalthis' };
    (globalThis as any).SEA = mockSEA;

    const resolvedSEA = (initializer as any).resolveSEA({}, false);
    expect(resolvedSEA).toBe(mockSEA);
  });

  it('should return null if SEA not found', () => {
    const resolvedSEA = (initializer as any).resolveSEA({}, false);
    expect(resolvedSEA).toBeNull();
  });
});
