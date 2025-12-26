import Gun from 'gun/gun';
import SEA from 'gun/sea';
import 'gun/lib/then.js';
import 'gun/lib/radisk.js';
import 'gun/lib/store.js';
import 'gun/lib/rindexed.js';
import 'gun/lib/webrtc.js';
import 'gun/lib/yson.js';

import { ShogunCore, ShogunSDKConfig } from '../../index';

// Utilizziamo un'istanza reale di Gun in memoria per i test di integrazione
const createTestGunInstance = () => {
  return Gun({
    file: false, // Disabilita il salvataggio su file
    localStorage: false, // Disabilita localStorage
    radisk: false, // Disabilita radisk
    multicast: false, // Disabilita multicast
    axe: false, // Disabilita axe
    axe_in: false, // Disabilita axe_in
    axe_out: false, // Disabilita axe_out
  });
};

describe('User Manager - Test di Integrazione con GunDB Reale', () => {
  let gun: any;
  let shogunCore: ShogunCore;
  let config: ShogunSDKConfig;

  beforeEach(() => {
    // Creiamo una nuova istanza di Gun per ogni test
    gun = createTestGunInstance();

    config = {
      appToken: 'test-integration-token',
      oauth: { enabled: false },
      peers: [], // Nessun peer per i test locali
    };

    shogunCore = new ShogunCore(config);
  });

  afterEach(async () => {
    // Pulizia dopo ogni test
    if (shogunCore.db.user) {
      await shogunCore.db.logout();
    }
  });

  describe('signUp - Test di Integrazione', () => {
    it('dovrebbe salvare un utente e autenticarlo correttamente', async () => {
      const username = 'integ_testuser';
      const password = 'IntegTestPass123!';

      // Test del signup
      const signUpResult = await shogunCore.signUp(username, password);

      expect(signUpResult.success).toBe(true);
      expect(signUpResult.username).toBe(username);
      expect(signUpResult.userPub).toBeDefined();
      expect(signUpResult.isNewUser).toBe(true);

      // Verifichiamo che l'utente sia stato salvato su GunDB
      const userData = await new Promise((resolve) => {
        gun
          .get('users')
          .get(username)
          .once((data: any) => {
            resolve(data);
          });
      });

      expect(userData).toBeDefined();
      expect(userData.pub).toBeDefined();
      expect(userData.username).toBe(username);
    });

    it('dovrebbe rifiutare la registrazione di un utente già esistente', async () => {
      const username = 'duplicate_user';
      const password = 'DuplicatePass123!';

      // Prima registrazione
      const firstSignUp = await shogunCore.signUp(username, password);
      expect(firstSignUp.success).toBe(true);

      // Seconda registrazione con lo stesso username
      const secondSignUp = await shogunCore.signUp(username, password);
      expect(secondSignUp.success).toBe(false);
      expect(secondSignUp.error).toContain('already exists');
    });

    it('dovrebbe validare i requisiti della password', async () => {
      const username = 'weak_user';
      const weakPassword = 'weak';

      const result = await shogunCore.signUp(username, weakPassword);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must contain');
    });
  });

  describe('login - Test di Integrazione', () => {
    it('dovrebbe autenticare un utente registrato', async () => {
      const username = 'login_testuser';
      const password = 'LoginTestPass123!';

      // Registriamo l'utente
      const signUpResult = await shogunCore.signUp(username, password);
      expect(signUpResult.success).toBe(true);

      // Facciamo logout
      await shogunCore.db.logout();

      // Test del login
      const loginResult = await shogunCore.login(username, password);

      expect(loginResult.success).toBe(true);
      expect(loginResult.username).toBe(username);
      expect(loginResult.userPub).toBe(signUpResult.userPub);
    });

    it('dovrebbe rifiutare il login con credenziali errate', async () => {
      const username = 'wrong_creds_user';
      const password = 'CorrectPass123!';
      const wrongPassword = 'WrongPass123!';

      // Registriamo l'utente
      await shogunCore.signUp(username, password);

      // Facciamo logout
      await shogunCore.db.logout();

      // Test del login con password sbagliata
      const loginResult = await shogunCore.login(username, wrongPassword);

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeDefined();
    });
  });

  describe('User Data Persistence - Test di Integrazione', () => {
    it("dovrebbe salvare e recuperare i dati dell'utente", async () => {
      const username = 'data_testuser';
      const password = 'DataTestPass123!';

      // Registriamo l'utente
      const signUpResult = await shogunCore.signUp(username, password);
      expect(signUpResult.success).toBe(true);

      // Salviamo alcuni dati dell'utente
      const testData = {
        profile: {
          name: 'Test User',
          email: 'test@example.com',
          preferences: {
            theme: 'dark',
            language: 'it',
          },
        },
      };

      // Salviamo i dati usando GunDB direttamente
      await new Promise((resolve) => {
        gun
          .get('users')
          .get(username)
          .get('profile')
          .put(testData.profile, (ack: any) => {
            resolve(ack);
          });
      });

      // Recuperiamo i dati salvati
      const savedData = await new Promise((resolve) => {
        gun
          .get('users')
          .get(username)
          .get('profile')
          .once((data: any) => {
            resolve(data);
          });
      });

      expect(savedData).toEqual(testData.profile);
    });
  });

  describe('Authentication State - Test di Integrazione', () => {
    it('dovrebbe mantenere lo stato di autenticazione', async () => {
      const username = 'state_testuser';
      const password = 'StateTestPass123!';

      // Registriamo l'utente
      const signUpResult = await shogunCore.signUp(username, password);
      expect(signUpResult.success).toBe(true);

      // Verifichiamo che l'utente sia autenticato
      expect(shogunCore.db.isLoggedIn()).toBe(true);
      expect(shogunCore.db.user).toBeDefined();

      // Facciamo logout
      await shogunCore.db.logout();

      // Verifichiamo che l'utente non sia più autenticato
      expect(shogunCore.db.isLoggedIn()).toBe(false);
    });
  });
});
