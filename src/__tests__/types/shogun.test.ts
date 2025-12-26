import {
  PluginCategory,
  CorePlugins,
  AuthMethod,
  AuthResult,
  SignUpResult,
  IShogunCore,
  WebauthnConfig,
  ShogunSDKConfig,
  ShogunEvents,
  Wallets,
} from '../../interfaces/shogun';

describe('Shogun Types', () => {
  describe('PluginCategory Enum', () => {
    it('should have correct authentication category', () => {
      expect(PluginCategory.Authentication).toBe('authentication');
    });

    it('should have correct wallet category', () => {
      expect(PluginCategory.Wallet).toBe('wallet');
    });

    it('should have correct privacy category', () => {
      expect(PluginCategory.Privacy).toBe('privacy');
    });

    it('should have correct identity category', () => {
      expect(PluginCategory.Identity).toBe('identity');
    });

    it('should have correct utility category', () => {
      expect(PluginCategory.Utility).toBe('utility');
    });

    it('should have all expected categories', () => {
      const categories = Object.values(PluginCategory);
      expect(categories).toContain('authentication');
      expect(categories).toContain('wallet');
      expect(categories).toContain('privacy');
      expect(categories).toContain('identity');
      expect(categories).toContain('utility');
      expect(categories).toContain('messages');
      expect(categories).toContain('other');
      expect(categories).toHaveLength(7);
    });
  });

  describe('CorePlugins Enum', () => {
    it('should have correct webauthn plugin', () => {
      expect(CorePlugins.WebAuthn).toBe('webauthn');
    });

    it('should have correct web3 plugin', () => {
      expect(CorePlugins.Web3).toBe('web3');
    });

    it('should have correct nostr plugin', () => {
      expect(CorePlugins.Nostr).toBe('nostr');
    });

    // OAuth has been removed from Shogun Core

    it('should have all expected plugins', () => {
      const plugins = Object.values(CorePlugins);
      expect(plugins).toContain('webauthn');
      expect(plugins).toContain('web3');
      expect(plugins).toContain('nostr');
      expect(plugins).toContain('zkproof');
      // OAuth has been removed from Shogun Core
      expect(plugins).toHaveLength(4);
    });
  });

  describe('AuthMethod Type', () => {
    it('should support all auth methods', () => {
      const authMethods: AuthMethod[] = [
        'password',
        'webauthn',
        'web3',
        'nostr',
        'oauth',
        'bitcoin',
        'pair',
      ];

      expect(authMethods).toContain('password');
      expect(authMethods).toContain('webauthn');
      expect(authMethods).toContain('web3');
      expect(authMethods).toContain('nostr');
      expect(authMethods).toContain('oauth');
      expect(authMethods).toContain('bitcoin');
      expect(authMethods).toContain('pair');
      expect(authMethods).toHaveLength(7);
    });
  });

  describe('AuthResult Interface', () => {
    it('should allow successful auth result', () => {
      const authResult: AuthResult = {
        success: true,
        userPub: 'test-pub-key',
        username: 'testuser',
        sessionToken: 'session-token-123',
        authMethod: 'password',
        sea: {
          pub: 'public-key',
          priv: 'private-key',
          epub: 'ephemeral-public-key',
          epriv: 'ephemeral-private-key',
        },
      };

      expect(authResult.success).toBe(true);
      expect(authResult.userPub).toBe('test-pub-key');
      expect(authResult.username).toBe('testuser');
      expect(authResult.sessionToken).toBe('session-token-123');
      expect(authResult.authMethod).toBe('password');
      expect(authResult.sea).toBeDefined();
      expect(authResult.sea?.pub).toBe('public-key');
    });

    it('should allow failed auth result', () => {
      const authResult: AuthResult = {
        success: false,
        error: 'Invalid credentials',
        authMethod: 'password',
      };

      expect(authResult.success).toBe(false);
      expect(authResult.error).toBe('Invalid credentials');
      expect(authResult.authMethod).toBe('password');
    });

    it('should allow OAuth auth result', () => {
      const authResult: AuthResult = {
        success: true,
        userPub: 'oauth-pub-key',
        username: 'oauthuser',
        authMethod: 'oauth',
        provider: 'google',
        redirectUrl: 'https://example.com/callback',
        pendingAuth: true,
        message: 'Please complete OAuth flow',
        isNewUser: true,
        user: {
          userPub: 'oauth-pub-key',
          username: 'oauthuser',
          email: 'user@example.com',
          name: 'OAuth User',
          picture: 'https://example.com/avatar.jpg',
          oauth: {
            provider: 'google',
            id: 'oauth-id-123',
            email: 'user@example.com',
            name: 'OAuth User',
            picture: 'https://example.com/avatar.jpg',
            lastLogin: Date.now(),
          },
        },
      };

      expect(authResult.success).toBe(true);
      expect(authResult.provider).toBe('google');
      expect(authResult.redirectUrl).toBe('https://example.com/callback');
      expect(authResult.pendingAuth).toBe(true);
      expect(authResult.isNewUser).toBe(true);
      expect(authResult.user).toBeDefined();
      expect(authResult.user?.oauth?.provider).toBe('google');
    });
  });

  describe('SignUpResult Interface', () => {
    it('should allow successful signup result', () => {
      const signUpResult: SignUpResult = {
        success: true,
        userPub: 'new-pub-key',
        username: 'newuser',
        pub: 'public-key',
        authMethod: 'password',
        sessionToken: 'session-token-456',
        isNewUser: true,
        sea: {
          pub: 'public-key',
          priv: 'private-key',
          epub: 'ephemeral-public-key',
          epriv: 'ephemeral-private-key',
        },
      };

      expect(signUpResult.success).toBe(true);
      expect(signUpResult.userPub).toBe('new-pub-key');
      expect(signUpResult.username).toBe('newuser');
      expect(signUpResult.pub).toBe('public-key');
      expect(signUpResult.authMethod).toBe('password');
      expect(signUpResult.isNewUser).toBe(true);
    });

    it('should allow failed signup result', () => {
      const signUpResult: SignUpResult = {
        success: false,
        error: 'Username already exists',
        message: 'Please choose a different username',
      };

      expect(signUpResult.success).toBe(false);
      expect(signUpResult.error).toBe('Username already exists');
      expect(signUpResult.message).toBe('Please choose a different username');
    });

    it('should allow OAuth signup result', () => {
      const signUpResult: SignUpResult = {
        success: true,
        userPub: 'oauth-pub-key',
        username: 'oauthuser',
        authMethod: 'oauth',
        provider: 'github',
        redirectUrl: 'https://example.com/oauth-callback',
        pendingAuth: false,
        isNewUser: false,
        user: {
          userPub: 'oauth-pub-key',
          username: 'oauthuser',
          email: 'user@example.com',
          name: 'GitHub User',
          picture: 'https://github.com/avatar.jpg',
          oauth: {
            provider: 'github',
            id: 'github-id-456',
            email: 'user@example.com',
            name: 'GitHub User',
            picture: 'https://github.com/avatar.jpg',
            lastLogin: Date.now(),
          },
        },
      };

      expect(signUpResult.success).toBe(true);
      expect(signUpResult.provider).toBe('github');
      expect(signUpResult.pendingAuth).toBe(false);
      expect(signUpResult.isNewUser).toBe(false);
    });
  });

  describe('IShogunCore Interface', () => {
    it('should define the interface structure', () => {
      // This is a type test - we're just ensuring the interface can be defined
      const mockShogunCore: IShogunCore = {
        // PluginManager methods
        registerPlugin: jest.fn(),
        unregisterPlugin: jest.fn(),
        getPlugin: jest.fn(),
        getPlugins: jest.fn(),
        hasPlugin: jest.fn(),

        // Core properties
        gun: {} as any,
        db: {} as any,
        rx: {} as any,
        storage: {} as any,
        config: {} as any,

        // Event emitter methods
        on: jest.fn(),
        off: jest.fn(),
        once: jest.fn(),
        removeAllListeners: jest.fn(),
        emit: jest.fn(),

        // Error handling methods
        getRecentErrors: jest.fn(),

        // Authentication methods
        login: jest.fn(),
        signUp: jest.fn(),
        getAuthenticationMethod: jest.fn(),

        // User management methods
        getCurrentUser: jest.fn(),
        changeUsername: jest.fn(),

        // Utility methods
        logout: jest.fn(),
        isLoggedIn: jest.fn(),
      };

      expect(mockShogunCore).toBeDefined();
      expect(typeof mockShogunCore.registerPlugin).toBe('function');
      expect(typeof mockShogunCore.login).toBe('function');
      expect(typeof mockShogunCore.signUp).toBe('function');
      expect(typeof mockShogunCore.logout).toBe('function');
      expect(typeof mockShogunCore.isLoggedIn).toBe('function');
    });
  });

  describe('WebauthnConfig Interface', () => {
    it('should allow minimal webauthn config', () => {
      const webauthnConfig: WebauthnConfig = {
        enabled: true,
      };

      expect(webauthnConfig.enabled).toBe(true);
      expect(webauthnConfig.rpName).toBeUndefined();
      expect(webauthnConfig.rpId).toBeUndefined();
    });

    it('should allow full webauthn config', () => {
      const webauthnConfig: WebauthnConfig = {
        enabled: true,
        rpName: 'My Application',
        rpId: 'example.com',
      };

      expect(webauthnConfig.enabled).toBe(true);
      expect(webauthnConfig.rpName).toBe('My Application');
      expect(webauthnConfig.rpId).toBe('example.com');
    });
  });

  describe('ShogunSDKConfig Interface', () => {
    it('should allow minimal config', () => {
      const config: ShogunSDKConfig = {
        peers: ['https://gun-manhattan.herokuapp.com/gun'],
      };

      expect(config.peers).toEqual(['https://gun-manhattan.herokuapp.com/gun']);
      expect(config.gunInstance).toBeUndefined();
      expect(config.authToken).toBeUndefined();
      expect(config.scope).toBeUndefined();
    });

    it('should allow full config', () => {
      const config: ShogunSDKConfig = {
        gunInstance: {} as any,
        authToken: 'auth-token-123',
        scope: 'user:read,user:write',
        peers: ['https://gun-manhattan.herokuapp.com/gun'],
        webauthn: {
          enabled: true,
          rpName: 'My App',
          rpId: 'example.com',
        },
        web3: {
          enabled: true,
        },
        nostr: {
          enabled: true,
        },
        oauth: {
          enabled: true,
          usePKCE: true,
          allowUnsafeClientSecret: false,
          providers: {
            google: {
              clientId: 'google-client-id',
              clientSecret: 'google-client-secret',
            },
          },
        },
        timeouts: {
          login: 30000,
          signup: 60000,
          operation: 10000,
        },
        plugins: {
          autoRegister: [],
        },
      };

      expect(config.gunInstance).toBeDefined();
      expect(config.authToken).toBe('auth-token-123');
      expect(config.scope).toBe('user:read,user:write');
      expect(config.peers).toEqual(['https://gun-manhattan.herokuapp.com/gun']);
      expect(config.webauthn?.enabled).toBe(true);
      expect(config.web3?.enabled).toBe(true);
      expect(config.nostr?.enabled).toBe(true);
      expect(config.oauth?.enabled).toBe(true);
      expect(config.oauth?.usePKCE).toBe(true);
      expect(config.timeouts?.login).toBe(30000);
    });
  });

  describe('ShogunEvents Interface', () => {
    it('should define event handler types', () => {
      // This is a type test - we're just ensuring the interface can be defined
      const mockEvents: ShogunEvents = {
        error: jest.fn(),
        'auth:signup': jest.fn(),
        'auth:login': jest.fn(),
        'auth:logout': jest.fn(),
      };

      expect(mockEvents).toBeDefined();
      expect(typeof mockEvents.error).toBe('function');
      expect(typeof mockEvents['auth:signup']).toBe('function');
      expect(typeof mockEvents['auth:login']).toBe('function');
      expect(typeof mockEvents['auth:logout']).toBe('function');
    });
  });

  describe('Wallets Interface', () => {
    it('should define wallet structure', () => {
      const wallets: Wallets = {
        secp256k1Bitcoin: {
          privateKey: 'bitcoin-private-key',
          publicKey: 'bitcoin-public-key',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        },
        secp256k1Ethereum: {
          privateKey: 'ethereum-private-key',
          publicKey: 'ethereum-public-key',
          address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        },
      };

      expect(wallets.secp256k1Bitcoin).toBeDefined();
      expect(wallets.secp256k1Bitcoin.privateKey).toBe('bitcoin-private-key');
      expect(wallets.secp256k1Bitcoin.publicKey).toBe('bitcoin-public-key');
      expect(wallets.secp256k1Bitcoin.address).toBe(
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      );

      expect(wallets.secp256k1Ethereum).toBeDefined();
      expect(wallets.secp256k1Ethereum.privateKey).toBe('ethereum-private-key');
      expect(wallets.secp256k1Ethereum.publicKey).toBe('ethereum-public-key');
      expect(wallets.secp256k1Ethereum.address).toBe(
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      );
    });
  });

  describe('Type Compatibility', () => {
    it('should allow AuthMethod to be used in AuthResult', () => {
      const authMethods: AuthMethod[] = [
        'password',
        'webauthn',
        'web3',
        'nostr',
        'oauth',
        'bitcoin',
        'pair',
      ];

      authMethods.forEach((method) => {
        const authResult: AuthResult = {
          success: true,
          authMethod: method,
        };
        expect(authResult.authMethod).toBe(method);
      });
    });

    it('should allow AuthMethod to be used in SignUpResult', () => {
      const authMethods: AuthMethod[] = [
        'password',
        'webauthn',
        'web3',
        'nostr',
        'oauth',
        'bitcoin',
        'pair',
      ];

      authMethods.forEach((method) => {
        const signUpResult: SignUpResult = {
          success: true,
          authMethod: method,
        };
        expect(signUpResult.authMethod).toBe(method);
      });
    });

    it('should allow PluginCategory to be used in plugin registration', () => {
      const pluginData = {
        name: 'test-plugin',
        version: '1.0.0',
        category: PluginCategory.Authentication,
      };

      expect(pluginData.category).toBe('authentication');
    });

    it('should allow CorePlugins to be used in plugin names', () => {
      const pluginNames = [
        CorePlugins.WebAuthn,
        CorePlugins.Web3,
        CorePlugins.Nostr,
        CorePlugins.ZkProof,
      ];

      expect(pluginNames).toContain('webauthn');
      expect(pluginNames).toContain('web3');
      expect(pluginNames).toContain('nostr');
      expect(pluginNames).toContain('zkproof');
      // OAuth has been removed from Shogun Core
    });
  });
});
