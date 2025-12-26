import Gun from 'gun/gun';
import SEA from 'gun/sea';
import 'gun/lib/then.js';
import 'gun/lib/radisk.js';
import 'gun/lib/store.js';
import 'gun/lib/rindexed.js';
import 'gun/lib/webrtc.js';
import 'gun/lib/yson.js';

import { ShogunCore, ShogunSDKConfig } from '../../index';

// Utilizziamo un'istanza reale di Gun in memoria
const gun = Gun({
  file: false,
});

// Wrapper function that mimics the saveUser function from your example
const saveUser = async (username: string, password: string) => {
  const config: ShogunSDKConfig = {
    appToken: 'test-token',
    oauth: { enabled: false },
    peers: [],
  };

  const shogunCore = new ShogunCore(config);

  try {
    const result = await shogunCore.signUp(username, password);

    if (result.success) {
      return {
        success: true,
        user: {
          username: result.username,
          pub: result.userPub,
          isNewUser: result.isNewUser,
        },
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

describe('saveUser - Test di Integrazione', () => {
  beforeEach(() => {
    // Clean up any existing test data
    // Note: In a real scenario, you might want to clear the Gun instance
    // but for this test, we'll use unique usernames
  });

  it('dovrebbe salvare un utente e autenticarlo correttamente', async () => {
    const username = 'integ_testuser_' + Date.now();
    const password = 'integ_testpassword123!';

    const result = await saveUser(username, password);

    expect(result.success).toBe(true);
    expect(result.user.username).toBe(username);
    expect(result.user.pub).toBeDefined();

    // Verifichiamo che l'utente sia stato salvato su GunDB
    const user = await new Promise((resolve) => {
      gun
        .get('users')
        .get(username)
        .once((data: any) => {
          resolve(data);
        });
    });

    expect(user).toBeDefined();
    expect((user as any).pub).toBeDefined();
    expect((user as any).username).toBe(username);
  });

  it('dovrebbe gestire la registrazione di utenti duplicati', async () => {
    const username = 'duplicate_testuser_' + Date.now();
    const password = 'duplicate_testpassword123!';

    // Prima registrazione
    const firstResult = await saveUser(username, password);
    expect(firstResult.success).toBe(true);

    // Seconda registrazione con lo stesso username
    const secondResult = await saveUser(username, password);
    expect(secondResult.success).toBe(false);
    expect(secondResult.error).toContain('already exists');
  });

  it('dovrebbe validare i requisiti della password', async () => {
    const username = 'weak_user_' + Date.now();
    const weakPassword = 'weak';

    const result = await saveUser(username, weakPassword);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Password must contain');
  });

  it('dovrebbe gestire errori di rete o sistema', async () => {
    const username = 'error_testuser_' + Date.now();
    const password = 'ErrorTestPass123!';

    // Simuliamo un errore disabilitando temporaneamente Gun
    const originalGun = global.Gun;
    global.Gun = undefined as any;

    try {
      const result = await saveUser(username, password);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    } finally {
      // Ripristiniamo Gun
      global.Gun = originalGun;
    }
  });

  it('dovrebbe verificare la persistenza dei dati dopo il salvataggio', async () => {
    const username = 'persistence_testuser_' + Date.now();
    const password = 'PersistenceTestPass123!';

    const result = await saveUser(username, password);
    expect(result.success).toBe(true);

    // Verifichiamo che i dati persistano anche dopo un delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const persistedUser = await new Promise((resolve) => {
      gun
        .get('users')
        .get(username)
        .once((data: any) => {
          resolve(data);
        });
    });

    expect(persistedUser).toBeDefined();
    expect((persistedUser as any).pub).toBe(result.user.pub);
  });
});
