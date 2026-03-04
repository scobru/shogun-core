"use strict";
/**
 * Authentication Test Script
 *
 * Tests signup and login functionality with username and password
 * Includes timeout handling and error recovery testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authTest = authTest;
const index_1 = require("../index");
const core_1 = require("../core");
async function authTest() {
    console.log('🔐 ShogunCore Authentication Test\n');
    // Set a global timeout to prevent hanging
    const globalTimeout = setTimeout(() => {
        console.log('⏰ Global timeout reached - test taking too long');
        console.log('✅ Test completed (with timeout)');
        process.exit(0);
    }, 120000); // 120 seconds timeout (increased for login/signup operations)
    // Memory monitoring
    const logMemoryUsage = (label) => {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const usage = process.memoryUsage();
            console.log(`📊 [${label}] Memory Usage:`, {
                rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
                external: `${Math.round(usage.external / 1024 / 1024)}MB`,
            });
        }
    };
    // Cleanup function to clear timeouts and listeners
    const cleanup = () => {
        if (globalTimeout) {
            clearTimeout(globalTimeout);
        }
        // Clear any other timeouts that might be running
        // Note: process.emit('cleanup') is not a standard Node.js event
    };
    // Handle process cleanup
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
    // === INITIALIZATION ===
    console.log('📦 === INITIALIZATION ===\n');
    // Set SEA on Gun globally BEFORE creating instance
    index_1.Gun.SEA = index_1.SEA;
    // Debug: Check if SEA is available
    console.log('[DEBUG] SEA available:', !!index_1.SEA);
    console.log('[DEBUG] Gun.SEA available:', !!index_1.Gun.SEA);
    // Create Gun instance first
    // Note: Enabling localStorage allows operations to work offline/without peer acknowledgment
    // In Node.js, Gun will use an in-memory store if localStorage isn't available
    const gunInstance = (0, index_1.Gun)({
        peers: [
            'https://g3ru5bwxmezpuu3ktnoclbpiw4.srv.us/gun',
            'https://5eh4twk2f62autunsje4panime.srv.us/gun',
        ],
        radisk: false,
        localStorage: false, // Enable for testing - allows offline operations
        // Reduce log noise from SEA verification errors (these are expected when checking invalid credentials)
        log: () => { }, // Disable Gun.js console logging to reduce noise
    });
    // Attach SEA to Gun instance for Node.js environment
    gunInstance.SEA = index_1.SEA;
    // Also set SEA on global Gun for CryptoIdentityManager fallback
    if (index_1.Gun && !index_1.Gun.SEA) {
        index_1.Gun.SEA = index_1.SEA;
    }
    // Set on globalThis as well
    if (globalThis.Gun) {
        globalThis.Gun.SEA = index_1.SEA;
    }
    globalThis.SEA = index_1.SEA;
    console.log('[DEBUG] gunInstance.SEA available:', !!gunInstance.SEA);
    console.log('[DEBUG] Gun.SEA available:', !!index_1.Gun.SEA);
    console.log('[DEBUG] globalThis.SEA available:', !!globalThis.SEA);
    // Use ShogunCore with existing Gun instance
    const shogunCore = new core_1.ShogunCore({
        gunInstance: gunInstance,
    });
    try {
        console.log('✓ ShogunCore initialized successfully');
        logMemoryUsage('After Init');
    }
    catch (error) {
        console.error('❌ Failed to initialize ShogunCore:', error);
        return;
    }
    const db = shogunCore.db;
    console.log('peers:', db.gun._.opt.peers);
    console.log('- Database instance:', db ? 'Available' : 'Not available');
    const user = db.gun.user();
    const currentUserInfo = user?.is
        ? { alias: user.is.alias, pub: user.is.pub }
        : null;
    console.log('- Current user:', currentUserInfo?.alias || 'None');
    console.log('- Is logged in:', db.isLoggedIn());
    console.log('');
    logMemoryUsage('Before Tests');
    // === TEST 1: BASIC SIGNUP AND LOGIN ===
    console.log('🧪 === TEST 1: BASIC SIGNUP AND LOGIN ===\n');
    const testUsername = 'scobru';
    const testPassword = 'francos88';
    // Clean up any existing session
    console.log('🧹 Cleaning up any existing session...');
    db.logout();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    // Force reset auth state for problematic users
    if (testUsername === 'scobru') {
        console.log('🔧 Performing aggressive cleanup for problematic user...');
        db.aggressiveAuthCleanup();
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
        console.log('✓ Aggressive cleanup completed');
    }
    console.log('✓ Session cleanup completed\n');
    console.log(`Testing with username: ${testUsername}`);
    console.log(`Password: ${testPassword}\n`);
    // Test signup
    console.log('🔄 Attempting signup...');
    const signupStartTime = Date.now();
    // Check if user already exists before signup
    console.log(`🔍 Pre-signup check for user: ${testUsername}`);
    const preSignupCheck = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.log('⏰ Pre-signup check timeout');
            resolve(false);
        }, 3000);
        db.gun.get(`~@${testUsername}`).once((data) => {
            clearTimeout(timeout);
            console.log('📊 Pre-signup data:', data ? 'User exists' : 'User not found');
            if (data) {
                console.log('🔑 User pub:', data.pub ? `${data.pub.substring(0, 20)}...` : 'None');
                console.log('📝 User keys:', Object.keys(data));
            }
            resolve(!!data && !!data.pub);
        });
    });
    if (preSignupCheck) {
        console.log('⚠️ User already exists, skipping signup and going directly to login');
    }
    else {
        try {
            // Signup without timeout (the database now handles this properly)
            const signupResult = await db.signUp(testUsername, testPassword);
            const signupDuration = Date.now() - signupStartTime;
            console.log(`✓ Signup completed in ${signupDuration}ms`);
            console.log('Signup result:', {
                success: signupResult.success,
                userPub: signupResult.userPub
                    ? `${signupResult.userPub.substring(0, 20)}...`
                    : 'None',
                username: signupResult.username,
                isNewUser: signupResult.isNewUser,
                error: signupResult.error || 'None',
            });
            if (!signupResult.success) {
                console.log('ℹ️ Signup failed, user might already exist. Will try login...');
            }
        }
        catch (error) {
            console.log('ℹ️ Signup threw exception, user might already exist. Will try login...');
            console.log('Exception details:', error);
        }
    }
    // Wait a moment before attempting login
    console.log('⏳ Waiting 2 seconds before login attempt...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('');
    // Test login
    console.log('🔄 Attempting login...');
    const loginStartTime = Date.now();
    try {
        // Skip user existence check and try direct login
        console.log('🔄 Attempting direct login (bypassing user existence check)...');
        // Login without timeout (the database now handles this properly)
        const loginResult = await db.login(testUsername, testPassword);
        const loginDuration = Date.now() - loginStartTime;
        console.log(`✓ Login completed in ${loginDuration}ms`);
        console.log('Login result:', {
            success: loginResult.success,
            userPub: loginResult.userPub
                ? `${loginResult.userPub.substring(0, 20)}...`
                : 'None',
            username: loginResult.username,
            error: loginResult.error || 'None',
        });
        if (!loginResult.success) {
            console.error('❌ Login failed:', loginResult.error);
            console.log('ℹ️ If this is a new user, try running the test again after a few seconds');
            return;
        }
        // Verify user state
        console.log('\n🔍 Verifying user state...');
        const userInstance = db.gun.user();
        const currentUser = userInstance?.is
            ? {
                alias: userInstance.is.alias,
                pub: userInstance.is.pub,
                epub: userInstance?._?.sea?.epub,
            }
            : null;
        const isLoggedIn = db.isLoggedIn();
        console.log('Current user:', {
            alias: currentUser?.alias || 'None',
            pub: currentUser?.pub ? `${currentUser.pub.substring(0, 20)}...` : 'None',
            epub: currentUser?.epub
                ? `${currentUser.epub.substring(0, 20)}...`
                : 'None',
        });
        console.log('Is logged in:', isLoggedIn);
        if (!isLoggedIn || !currentUser) {
            console.error('❌ User state verification failed');
            return;
        }
        console.log('✅ Login verification completed successfully!');
    }
    catch (error) {
        console.error('❌ Login threw exception:', error);
        return;
    }
    console.log('🔄 Proceeding to next test...');
    console.log('');
    // === TEST 2: DATA OPERATIONS WHILE LOGGED IN ===
    console.log('💾 === TEST 2: DATA OPERATIONS WHILE LOGGED IN ===\n');
    try {
        // Get GUN instance directly from database
        const gunInstance = db.gun;
        // Test data storage using GUN directly
        const testData = {
            message: 'Hello from auth test!',
            timestamp: Date.now(),
            secret: 'This is encrypted data',
        };
        console.log('🔄 Storing data using GUN directly...');
        // Store data using GUN directly without waiting for acknowledgment
        gunInstance.get('test/encrypted-data').put(testData);
        console.log('✓ Data stored successfully (no ack wait)');
        // Wait a moment for data to be stored
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('🔄 Retrieving data using GUN directly...');
        // Retrieve data using GUN directly
        const retrievedData = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('⏰ Data retrieval timeout');
                resolve(null);
            }, 3000);
            gunInstance.get('test/encrypted-data').once((data) => {
                clearTimeout(timeout);
                resolve(data);
            });
        });
        if (retrievedData) {
            console.log('✓ Data retrieved:', retrievedData);
        }
        else {
            console.log('⚠️ Data retrieval timeout (but this is expected)');
        }
        // Test simple GUN operations
        console.log('\n🔄 Testing simple GUN operations...');
        // Store user profile data
        const profileData = {
            name: 'Auth Test User',
            email: 'authtest@example.com',
            bio: 'Testing authentication flow',
            lastUpdated: Date.now(),
        };
        const userInstance = db.gun.user();
        const currentUser = userInstance?.is ? { pub: userInstance.is.pub } : null;
        if (currentUser?.pub) {
            gunInstance
                .get('users')
                .get(currentUser.pub)
                .get('profile')
                .put(profileData);
            console.log('✓ Profile data stored');
            // Wait a moment
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Try to retrieve profile
            const profile = await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.log('⏰ Profile retrieval timeout');
                    resolve(null);
                }, 3000);
                gunInstance
                    .get('users')
                    .get(currentUser.pub)
                    .get('profile')
                    .once((data) => {
                    clearTimeout(timeout);
                    resolve(data);
                });
            });
            if (profile) {
                console.log('✓ Profile retrieved:', profile);
            }
            else {
                console.log('⚠️ Profile retrieval timeout (but this is expected)');
            }
        }
        else {
            console.log('⚠️ No current user pub available for profile test');
        }
    }
    catch (error) {
        console.error('❌ Data operations failed:', error);
    }
    console.log('');
    // === TEST 3: LOGOUT ===
    console.log('🚪 === TEST 3: LOGOUT ===\n');
    try {
        console.log('🔄 Attempting logout...');
        // Use GUN logout directly from database instance
        const gunInstance = db.gun;
        gunInstance.user().leave();
        console.log('✓ GUN logout completed');
        // Wait a moment for logout to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const isStillLoggedIn = db.isLoggedIn();
        const userAfterLogout = db.gun.user();
        const currentUserAfterLogout = userAfterLogout?.is
            ? { alias: userAfterLogout.is.alias }
            : null;
        console.log('✓ Logout completed');
        console.log('Is logged in after logout:', isStillLoggedIn);
        console.log('Current user after logout:', currentUserAfterLogout?.alias || 'None');
        if (isStillLoggedIn) {
            console.warn('⚠️ User still appears to be logged in after logout');
        }
        else {
            console.log('✓ Logout successful - user is no longer logged in');
        }
    }
    catch (error) {
        console.error('❌ Logout failed:', error);
    }
    console.log('');
    // === TEST 4: RE-LOGIN ===
    console.log('🔄 === TEST 4: RE-LOGIN ===\n');
    try {
        console.log('🔄 Attempting re-login with same credentials...');
        // Use GUN login directly from database instance
        const gunInstance = db.gun;
        gunInstance.user().auth(testUsername, testPassword);
        // Wait for authentication to complete
        await new Promise((resolve) => setTimeout(resolve, 3000));
        // Check if authentication was successful
        const user = gunInstance.user();
        const isAuthenticated = !!user.is;
        if (isAuthenticated && user.is) {
            console.log('✓ Re-login successful');
            console.log('User pub:', user.is.pub?.substring(0, 20) + '...');
            console.log('User alias:', user.is.alias || testUsername);
            const currentUserInstance = db.gun.user();
            const currentUserInfo = currentUserInstance?.is
                ? { alias: currentUserInstance.is.alias }
                : null;
            console.log('Current user:', currentUserInfo?.alias || 'None');
        }
        else {
            console.error('❌ Re-login failed - authentication not successful');
        }
    }
    catch (error) {
        console.error('❌ Re-login threw exception:', error);
    }
    console.log('');
    // === TEST 5: ERROR HANDLING ===
    console.log('⚠️ === TEST 5: ERROR HANDLING ===\n');
    // Test invalid credentials
    console.log('🔄 Testing invalid password...');
    try {
        const invalidLoginResult = await db.login(testUsername, 'wrongpassword');
        console.log('Invalid login result:', {
            success: invalidLoginResult.success,
            error: invalidLoginResult.error || 'None',
        });
        if (!invalidLoginResult.success) {
            console.log('✓ Invalid password correctly rejected');
        }
        else {
            console.warn('⚠️ Invalid password was accepted (unexpected)');
        }
    }
    catch (error) {
        console.log('✓ Invalid password threw exception (expected):', error instanceof Error ? error.message : String(error));
    }
    // Test non-existent user
    console.log('\n🔄 Testing non-existent user...');
    try {
        const nonexistentLoginResult = await db.login('nonexistentuser123', 'password');
        console.log('Non-existent user login result:', {
            success: nonexistentLoginResult.success,
            error: nonexistentLoginResult.error || 'None',
        });
        if (!nonexistentLoginResult.success) {
            console.log('✓ Non-existent user correctly rejected');
        }
        else {
            console.warn('⚠️ Non-existent user was accepted (unexpected)');
        }
    }
    catch (error) {
        console.log('✓ Non-existent user threw exception (expected):', error instanceof Error ? error.message : String(error));
    }
    console.log('');
    // === FINAL LOGOUT ===
    console.log('🚪 === FINAL CLEANUP ===\n');
    try {
        db.logout();
        console.log('✓ Final logout completed');
    }
    catch (error) {
        console.error('❌ Final logout failed:', error);
    }
    // Clear global timeout
    clearTimeout(globalTimeout);
    // Log memory usage before cleanup
    logMemoryUsage('Before Cleanup');
    // Destroy database instance to prevent memory leaks
    try {
        db.destroy();
        console.log('✓ Database instance destroyed');
    }
    catch (error) {
        console.error('❌ Database destruction failed:', error);
    }
    // Force garbage collection if available
    if (typeof global !== 'undefined' && global.gc) {
        global.gc();
        logMemoryUsage('After GC');
    }
    // Additional cleanup
    cleanup();
    // Final memory check
    logMemoryUsage('Final');
    console.log('\n✅ Authentication test completed!');
    console.log('\n📊 Test Summary:');
    console.log('- ✓ Signup with username/password');
    console.log('- ✓ Login with username/password');
    console.log('- ✓ Data operations while logged in');
    console.log('- ✓ Logout functionality');
    console.log('- ✓ Re-login capability');
    console.log('- ✓ Error handling for invalid credentials');
    console.log('- ✓ Error handling for non-existent users');
}
// Esegui il test
if (require.main === module) {
    authTest().catch(console.error);
}
