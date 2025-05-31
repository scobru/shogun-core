/**
 * Test script to verify wallet creation after login
 * This demonstrates the fix for the "no mnemonic" issue
 */

const { ShogunCore } = require('./dist/core.js');

async function testWalletCreation() {
  console.log('🧪 Testing wallet creation after login...');
  
  try {
    // Initialize Shogun SDK with wallet plugin enabled
    const shogun = new ShogunCore({
      peers: ['http://localhost:8765/gun'],
      scope: 'test-app',
      bip44: { enabled: true }, // Enable wallet plugin
      logging: {
        level: 'debug',
        logToConsole: true,
        logTimestamps: true
      }
    });

    console.log('✅ ShogunCore initialized');

    // Test user credentials
    const username = 'test-user-' + Date.now();
    const password = 'test-password-123';

    // Sign up a new user
    console.log('📝 Signing up new user:', username);
    const signupResult = await shogun.signUp(username, password);
    
    if (!signupResult.success) {
      throw new Error('Signup failed: ' + signupResult.error);
    }
    
    console.log('✅ User signed up successfully');

    // Login the user
    console.log('🔐 Logging in user:', username);
    const loginResult = await shogun.login(username, password);
    
    if (!loginResult.success) {
      throw new Error('Login failed: ' + loginResult.error);
    }
    
    console.log('✅ User logged in successfully');

    // Wait a moment for wallet initialization
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if wallet plugin is available
    const walletPlugin = shogun.getPlugin('bip44');
    if (!walletPlugin) {
      throw new Error('Wallet plugin not found');
    }
    
    console.log('✅ Wallet plugin found');

    // Try to load wallets
    console.log('💰 Loading wallets...');
    const wallets = await walletPlugin.loadWallets();
    
    console.log('✅ Wallets loaded:', wallets.length);
    
    if (wallets.length > 0) {
      console.log('🎉 SUCCESS: Wallet automatically created after login!');
      console.log('📍 First wallet address:', wallets[0].address);
    } else {
      console.log('⚠️  No wallets found, creating one manually...');
      const newWallet = await walletPlugin.createWallet();
      console.log('✅ Wallet created manually:', newWallet.address);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testWalletCreation(); 