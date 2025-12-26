import Gun from 'gun/gun';
import 'gun/lib/then.js';
import 'gun/lib/radisk.js';
import 'gun/lib/store.js';
import 'gun/lib/rindexed.js';
import 'gun/lib/webrtc.js';
import 'gun/lib/yson.js';
import SEA from 'gun/sea';

import { ShogunCore, ShogunSDKConfig } from '../../index';

describe('Complete Integration Tests - User Manager', () => {
  let shogunCore: ShogunCore;
  let testUsername: string;
  let testPassword: string;

  beforeEach(() => {
    const config: ShogunSDKConfig = {
      appToken: 'test-token',
      oauth: { enabled: false },
      peers: [],
    };

    shogunCore = new ShogunCore(config);
    testUsername = 'integration_test_' + Date.now();
    testPassword = 'TestPass123!@#';
  });

  describe('User Registration and Authentication', () => {
    it('should register a new user successfully', async () => {
      console.log(`Testing user registration: ${testUsername}`);

      const result = await shogunCore.signUp(testUsername, testPassword);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe(testUsername);
      expect(result.user.pub).toBeDefined();
      expect(result.error).toBeUndefined();

      console.log('✅ User registration successful');
    }, 60000);

    it('should authenticate an existing user', async () => {
      console.log(`Testing user authentication: ${testUsername}`);

      // First register the user
      const signUpResult = await shogunCore.signUp(testUsername, testPassword);
      expect(signUpResult.success).toBe(true);

      // Then authenticate
      const loginResult = await shogunCore.login(testUsername, testPassword);

      expect(loginResult.success).toBe(true);
      expect(loginResult.user).toBeDefined();
      expect(loginResult.user.username).toBe(testUsername);
      expect(loginResult.user.pub).toBeDefined();
      expect(loginResult.error).toBeUndefined();

      console.log('✅ User authentication successful');
    }, 60000);

    it('should fail authentication with wrong password', async () => {
      console.log(`Testing failed authentication: ${testUsername}`);

      // First register the user
      const signUpResult = await shogunCore.signUp(testUsername, testPassword);
      expect(signUpResult.success).toBe(true);

      // Then try to authenticate with wrong password
      const loginResult = await shogunCore.login(
        testUsername,
        'WrongPassword123!@#',
      );

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeDefined();
      expect(loginResult.user).toBeUndefined();

      console.log('✅ Failed authentication test successful');
    }, 60000);
  });

  describe('User Validation', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'TestPass123!@#',
        'MySecureP@ssw0rd',
        'Complex!Password#2024',
        'Str0ng!P@ssw0rd$',
      ];

      strongPasswords.forEach((password) => {
        const validation = shogunCore.db.validateSignupCredentials(
          testUsername,
          password,
        );
        expect(validation.valid).toBe(true);
        expect(validation.error).toBeUndefined();
      });

      console.log('✅ Strong password validation successful');
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '123', // Too short
        'password', // No uppercase, numbers, or special chars
        'PASSWORD', // No lowercase, numbers, or special chars
        'Password', // No numbers or special chars
        'Password123', // No special chars
        'pass@word', // No uppercase or numbers
      ];

      weakPasswords.forEach((password) => {
        const validation = shogunCore.db.validateSignupCredentials(
          testUsername,
          password,
        );
        expect(validation.valid).toBe(false);
        expect(validation.error).toBeDefined();
      });

      console.log('✅ Weak password rejection successful');
    });

    it('should validate usernames', () => {
      const validUsernames = [
        'testuser',
        'test_user',
        'test.user',
        'test-user',
        'TestUser123',
        'user_123',
      ];

      const invalidUsernames = [
        '', // Empty
        'test@user', // Invalid character
        'test user', // Space
        'test/user', // Invalid character
        'test\\user', // Invalid character
      ];

      validUsernames.forEach((username) => {
        const validation = shogunCore.db.validateSignupCredentials(
          username,
          testPassword,
        );
        expect(validation.valid).toBe(true);
      });

      invalidUsernames.forEach((username) => {
        const validation = shogunCore.db.validateSignupCredentials(
          username,
          testPassword,
        );
        expect(validation.valid).toBe(false);
        expect(validation.error).toBeDefined();
      });

      console.log('✅ Username validation successful');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow first signup attempt', () => {
      const rateLimitCheck = shogunCore.db.checkRateLimit(
        testUsername,
        'signup',
      );
      expect(rateLimitCheck.allowed).toBe(true);
      expect(rateLimitCheck.error).toBeUndefined();
    });

    it('should allow first login attempt', () => {
      const rateLimitCheck = shogunCore.db.checkRateLimit(
        testUsername,
        'login',
      );
      expect(rateLimitCheck.allowed).toBe(true);
      expect(rateLimitCheck.error).toBeUndefined();
    });
  });

  describe('User Management', () => {
    it('should check if user is authenticated', async () => {
      // Register and login user
      const signUpResult = await shogunCore.signUp(testUsername, testPassword);
      expect(signUpResult.success).toBe(true);

      const loginResult = await shogunCore.login(testUsername, testPassword);
      expect(loginResult.success).toBe(true);

      // Check authentication status
      const isAuth = shogunCore.db.isAuthenticated();
      expect(isAuth).toBe(true);

      console.log('✅ Authentication status check successful');
    }, 60000);

    it('should get user public key', async () => {
      // Register and login user
      const signUpResult = await shogunCore.signUp(testUsername, testPassword);
      expect(signUpResult.success).toBe(true);

      const loginResult = await shogunCore.login(testUsername, testPassword);
      expect(loginResult.success).toBe(true);

      // Get user public key
      const userPub = shogunCore.db.getUserPub();
      expect(userPub).toBeDefined();
      expect(typeof userPub).toBe('string');
      expect(userPub.length).toBeGreaterThan(0);

      console.log('✅ User public key retrieval successful');
    }, 60000);
  });
});
