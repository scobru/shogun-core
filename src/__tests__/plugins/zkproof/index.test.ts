import * as ZkProofExports from '../../../plugins/zkproof';

describe('ZK-Proof Plugin Exports', () => {
  it('should export ZkProofPlugin', () => {
    expect(ZkProofExports.ZkProofPlugin).toBeDefined();
    expect(typeof ZkProofExports.ZkProofPlugin).toBe('function');
  });

  it('should export ZkProofConnector', () => {
    expect(ZkProofExports.ZkProofConnector).toBeDefined();
    expect(typeof ZkProofExports.ZkProofConnector).toBe('function');
  });

  it('should have correct module structure', () => {
    const exports = Object.keys(ZkProofExports);
    expect(exports).toContain('ZkProofPlugin');
    expect(exports).toContain('ZkProofConnector');
  });
});
