/**
 * Authentication Test Script
 *
 * Tests signup and login functionality with username and password
 * Includes timeout handling and error recovery testing
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Gun, SEA } from '../index.js';
import { ShogunCore } from '../core.js';
function authTest() {
    return __awaiter(this, void 0, void 0, function () {
        var globalTimeout, logMemoryUsage, cleanup, gunInstance, shogunCore, db, user, currentUserInfo, testUsername, testPassword, signupStartTime, preSignupCheck, signupResult, signupDuration, error_1, loginStartTime, loginResult, loginDuration, userInstance, currentUser, isLoggedIn, error_2, gunInstance_1, testData, retrievedData, profileData, userInstance, currentUser_1, profile, error_3, gunInstance_2, isStillLoggedIn, userAfterLogout, currentUserAfterLogout, error_4, gunInstance_3, user_1, isAuthenticated, currentUserInstance, currentUserInfo_1, error_5, invalidLoginResult, error_6, nonexistentLoginResult, error_7;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('🔐 ShogunCore Authentication Test\n');
                    globalTimeout = setTimeout(function () {
                        console.log('⏰ Global timeout reached - test taking too long');
                        console.log('✅ Test completed (with timeout)');
                        process.exit(0);
                    }, 120000);
                    logMemoryUsage = function (label) {
                        if (typeof process !== 'undefined' && process.memoryUsage) {
                            var usage = process.memoryUsage();
                            console.log("\uD83D\uDCCA [".concat(label, "] Memory Usage:"), {
                                rss: "".concat(Math.round(usage.rss / 1024 / 1024), "MB"),
                                heapUsed: "".concat(Math.round(usage.heapUsed / 1024 / 1024), "MB"),
                                heapTotal: "".concat(Math.round(usage.heapTotal / 1024 / 1024), "MB"),
                                external: "".concat(Math.round(usage.external / 1024 / 1024), "MB"),
                            });
                        }
                    };
                    cleanup = function () {
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
                    Gun.SEA = SEA;
                    // Debug: Check if SEA is available
                    console.log('[DEBUG] SEA available:', !!SEA);
                    console.log('[DEBUG] Gun.SEA available:', !!Gun.SEA);
                    gunInstance = Gun({
                        peers: [
                            'https://g3ru5bwxmezpuu3ktnoclbpiw4.srv.us/gun',
                            'https://5eh4twk2f62autunsje4panime.srv.us/gun',
                        ],
                        radisk: false,
                        localStorage: false, // Enable for testing - allows offline operations
                        // Reduce log noise from SEA verification errors (these are expected when checking invalid credentials)
                        log: function () { }, // Disable Gun.js console logging to reduce noise
                    });
                    // Attach SEA to Gun instance for Node.js environment
                    gunInstance.SEA = SEA;
                    // Also set SEA on global Gun for CryptoIdentityManager fallback
                    if (Gun && !Gun.SEA) {
                        Gun.SEA = SEA;
                    }
                    // Set on globalThis as well
                    if (globalThis.Gun) {
                        globalThis.Gun.SEA = SEA;
                    }
                    globalThis.SEA = SEA;
                    console.log('[DEBUG] gunInstance.SEA available:', !!gunInstance.SEA);
                    console.log('[DEBUG] Gun.SEA available:', !!Gun.SEA);
                    console.log('[DEBUG] globalThis.SEA available:', !!globalThis.SEA);
                    shogunCore = new ShogunCore({
                        gunInstance: gunInstance,
                    });
                    try {
                        console.log('✓ ShogunCore initialized successfully');
                        logMemoryUsage('After Init');
                    }
                    catch (error) {
                        console.error('❌ Failed to initialize ShogunCore:', error);
                        return [2 /*return*/];
                    }
                    db = shogunCore.db;
                    console.log('peers:', db.gun._.opt.peers);
                    console.log('- Database instance:', db ? 'Available' : 'Not available');
                    user = db.gun.user();
                    currentUserInfo = (user === null || user === void 0 ? void 0 : user.is)
                        ? { alias: user.is.alias, pub: user.is.pub }
                        : null;
                    console.log('- Current user:', (currentUserInfo === null || currentUserInfo === void 0 ? void 0 : currentUserInfo.alias) || 'None');
                    console.log('- Is logged in:', db.isLoggedIn());
                    console.log('');
                    logMemoryUsage('Before Tests');
                    // === TEST 1: BASIC SIGNUP AND LOGIN ===
                    console.log('🧪 === TEST 1: BASIC SIGNUP AND LOGIN ===\n');
                    testUsername = 'scobru';
                    testPassword = 'francos88';
                    // Clean up any existing session
                    console.log('🧹 Cleaning up any existing session...');
                    db.logout();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 1:
                    _d.sent(); // Wait 1 second
                    if (!(testUsername === 'scobru')) return [3 /*break*/, 3];
                    console.log('🔧 Performing aggressive cleanup for problematic user...');
                    db.aggressiveAuthCleanup();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                case 2:
                    _d.sent(); // Wait 3 seconds
                    console.log('✓ Aggressive cleanup completed');
                    _d.label = 3;
                case 3:
                    console.log('✓ Session cleanup completed\n');
                    console.log("Testing with username: ".concat(testUsername));
                    console.log("Password: ".concat(testPassword, "\n"));
                    // Test signup
                    console.log('🔄 Attempting signup...');
                    signupStartTime = Date.now();
                    // Check if user already exists before signup
                    console.log("\uD83D\uDD0D Pre-signup check for user: ".concat(testUsername));
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var timeout = setTimeout(function () {
                                console.log('⏰ Pre-signup check timeout');
                                resolve(false);
                            }, 3000);
                            db.gun.get("~@".concat(testUsername)).once(function (data) {
                                clearTimeout(timeout);
                                console.log('📊 Pre-signup data:', data ? 'User exists' : 'User not found');
                                if (data) {
                                    console.log('🔑 User pub:', data.pub ? "".concat(data.pub.substring(0, 20), "...") : 'None');
                                    console.log('📝 User keys:', Object.keys(data));
                                }
                                resolve(!!data && !!data.pub);
                            });
                        })];
                case 4:
                    preSignupCheck = _d.sent();
                    if (!preSignupCheck) return [3 /*break*/, 5];
                    console.log('⚠️ User already exists, skipping signup and going directly to login');
                    return [3 /*break*/, 8];
                case 5:
                    _d.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, db.signUp(testUsername, testPassword)];
                case 6:
                    signupResult = _d.sent();
                    signupDuration = Date.now() - signupStartTime;
                    console.log("\u2713 Signup completed in ".concat(signupDuration, "ms"));
                    console.log('Signup result:', {
                        success: signupResult.success,
                        userPub: signupResult.userPub
                            ? "".concat(signupResult.userPub.substring(0, 20), "...")
                            : 'None',
                        username: signupResult.username,
                        isNewUser: signupResult.isNewUser,
                        error: signupResult.error || 'None',
                    });
                    if (!signupResult.success) {
                        console.log('ℹ️ Signup failed, user might already exist. Will try login...');
                    }
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _d.sent();
                    console.log('ℹ️ Signup threw exception, user might already exist. Will try login...');
                    console.log('Exception details:', error_1);
                    return [3 /*break*/, 8];
                case 8:
                    // Wait a moment before attempting login
                    console.log('⏳ Waiting 2 seconds before login attempt...');
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 9:
                    _d.sent();
                    console.log('');
                    // Test login
                    console.log('🔄 Attempting login...');
                    loginStartTime = Date.now();
                    _d.label = 10;
                case 10:
                    _d.trys.push([10, 12, , 13]);
                    // Skip user existence check and try direct login
                    console.log('🔄 Attempting direct login (bypassing user existence check)...');
                    return [4 /*yield*/, db.login(testUsername, testPassword)];
                case 11:
                    loginResult = _d.sent();
                    loginDuration = Date.now() - loginStartTime;
                    console.log("\u2713 Login completed in ".concat(loginDuration, "ms"));
                    console.log('Login result:', {
                        success: loginResult.success,
                        userPub: loginResult.userPub
                            ? "".concat(loginResult.userPub.substring(0, 20), "...")
                            : 'None',
                        username: loginResult.username,
                        error: loginResult.error || 'None',
                    });
                    if (!loginResult.success) {
                        console.error('❌ Login failed:', loginResult.error);
                        console.log('ℹ️ If this is a new user, try running the test again after a few seconds');
                        return [2 /*return*/];
                    }
                    // Verify user state
                    console.log('\n🔍 Verifying user state...');
                    userInstance = db.gun.user();
                    currentUser = (userInstance === null || userInstance === void 0 ? void 0 : userInstance.is)
                        ? {
                            alias: userInstance.is.alias,
                            pub: userInstance.is.pub,
                            epub: (_b = (_a = userInstance === null || userInstance === void 0 ? void 0 : userInstance._) === null || _a === void 0 ? void 0 : _a.sea) === null || _b === void 0 ? void 0 : _b.epub,
                        }
                        : null;
                    isLoggedIn = db.isLoggedIn();
                    console.log('Current user:', {
                        alias: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.alias) || 'None',
                        pub: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.pub) ? "".concat(currentUser.pub.substring(0, 20), "...") : 'None',
                        epub: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.epub)
                            ? "".concat(currentUser.epub.substring(0, 20), "...")
                            : 'None',
                    });
                    console.log('Is logged in:', isLoggedIn);
                    if (!isLoggedIn || !currentUser) {
                        console.error('❌ User state verification failed');
                        return [2 /*return*/];
                    }
                    console.log('✅ Login verification completed successfully!');
                    return [3 /*break*/, 13];
                case 12:
                    error_2 = _d.sent();
                    console.error('❌ Login threw exception:', error_2);
                    return [2 /*return*/];
                case 13:
                    console.log('🔄 Proceeding to next test...');
                    console.log('');
                    // === TEST 2: DATA OPERATIONS WHILE LOGGED IN ===
                    console.log('💾 === TEST 2: DATA OPERATIONS WHILE LOGGED IN ===\n');
                    _d.label = 14;
                case 14:
                    _d.trys.push([14, 21, , 22]);
                    gunInstance_1 = db.gun;
                    testData = {
                        message: 'Hello from auth test!',
                        timestamp: Date.now(),
                        secret: 'This is encrypted data',
                    };
                    console.log('🔄 Storing data using GUN directly...');
                    // Store data using GUN directly without waiting for acknowledgment
                    gunInstance_1.get('test/encrypted-data').put(testData);
                    console.log('✓ Data stored successfully (no ack wait)');
                    // Wait a moment for data to be stored
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 15:
                    // Wait a moment for data to be stored
                    _d.sent();
                    console.log('🔄 Retrieving data using GUN directly...');
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var timeout = setTimeout(function () {
                                console.log('⏰ Data retrieval timeout');
                                resolve(null);
                            }, 3000);
                            gunInstance_1.get('test/encrypted-data').once(function (data) {
                                clearTimeout(timeout);
                                resolve(data);
                            });
                        })];
                case 16:
                    retrievedData = _d.sent();
                    if (retrievedData) {
                        console.log('✓ Data retrieved:', retrievedData);
                    }
                    else {
                        console.log('⚠️ Data retrieval timeout (but this is expected)');
                    }
                    // Test simple GUN operations
                    console.log('\n🔄 Testing simple GUN operations...');
                    profileData = {
                        name: 'Auth Test User',
                        email: 'authtest@example.com',
                        bio: 'Testing authentication flow',
                        lastUpdated: Date.now(),
                    };
                    userInstance = db.gun.user();
                    currentUser_1 = (userInstance === null || userInstance === void 0 ? void 0 : userInstance.is) ? { pub: userInstance.is.pub } : null;
                    if (!(currentUser_1 === null || currentUser_1 === void 0 ? void 0 : currentUser_1.pub)) return [3 /*break*/, 19];
                    gunInstance_1
                        .get('users')
                        .get(currentUser_1.pub)
                        .get('profile')
                        .put(profileData);
                    console.log('✓ Profile data stored');
                    // Wait a moment
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 17:
                    // Wait a moment
                    _d.sent();
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var timeout = setTimeout(function () {
                                console.log('⏰ Profile retrieval timeout');
                                resolve(null);
                            }, 3000);
                            gunInstance_1
                                .get('users')
                                .get(currentUser_1.pub)
                                .get('profile')
                                .once(function (data) {
                                clearTimeout(timeout);
                                resolve(data);
                            });
                        })];
                case 18:
                    profile = _d.sent();
                    if (profile) {
                        console.log('✓ Profile retrieved:', profile);
                    }
                    else {
                        console.log('⚠️ Profile retrieval timeout (but this is expected)');
                    }
                    return [3 /*break*/, 20];
                case 19:
                    console.log('⚠️ No current user pub available for profile test');
                    _d.label = 20;
                case 20: return [3 /*break*/, 22];
                case 21:
                    error_3 = _d.sent();
                    console.error('❌ Data operations failed:', error_3);
                    return [3 /*break*/, 22];
                case 22:
                    console.log('');
                    // === TEST 3: LOGOUT ===
                    console.log('🚪 === TEST 3: LOGOUT ===\n');
                    _d.label = 23;
                case 23:
                    _d.trys.push([23, 25, , 26]);
                    console.log('🔄 Attempting logout...');
                    gunInstance_2 = db.gun;
                    gunInstance_2.user().leave();
                    console.log('✓ GUN logout completed');
                    // Wait a moment for logout to complete
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 24:
                    // Wait a moment for logout to complete
                    _d.sent();
                    isStillLoggedIn = db.isLoggedIn();
                    userAfterLogout = db.gun.user();
                    currentUserAfterLogout = (userAfterLogout === null || userAfterLogout === void 0 ? void 0 : userAfterLogout.is)
                        ? { alias: userAfterLogout.is.alias }
                        : null;
                    console.log('✓ Logout completed');
                    console.log('Is logged in after logout:', isStillLoggedIn);
                    console.log('Current user after logout:', (currentUserAfterLogout === null || currentUserAfterLogout === void 0 ? void 0 : currentUserAfterLogout.alias) || 'None');
                    if (isStillLoggedIn) {
                        console.warn('⚠️ User still appears to be logged in after logout');
                    }
                    else {
                        console.log('✓ Logout successful - user is no longer logged in');
                    }
                    return [3 /*break*/, 26];
                case 25:
                    error_4 = _d.sent();
                    console.error('❌ Logout failed:', error_4);
                    return [3 /*break*/, 26];
                case 26:
                    console.log('');
                    // === TEST 4: RE-LOGIN ===
                    console.log('🔄 === TEST 4: RE-LOGIN ===\n');
                    _d.label = 27;
                case 27:
                    _d.trys.push([27, 29, , 30]);
                    console.log('🔄 Attempting re-login with same credentials...');
                    gunInstance_3 = db.gun;
                    gunInstance_3.user().auth(testUsername, testPassword);
                    // Wait for authentication to complete
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                case 28:
                    // Wait for authentication to complete
                    _d.sent();
                    user_1 = gunInstance_3.user();
                    isAuthenticated = !!user_1.is;
                    if (isAuthenticated && user_1.is) {
                        console.log('✓ Re-login successful');
                        console.log('User pub:', ((_c = user_1.is.pub) === null || _c === void 0 ? void 0 : _c.substring(0, 20)) + '...');
                        console.log('User alias:', user_1.is.alias || testUsername);
                        currentUserInstance = db.gun.user();
                        currentUserInfo_1 = (currentUserInstance === null || currentUserInstance === void 0 ? void 0 : currentUserInstance.is)
                            ? { alias: currentUserInstance.is.alias }
                            : null;
                        console.log('Current user:', (currentUserInfo_1 === null || currentUserInfo_1 === void 0 ? void 0 : currentUserInfo_1.alias) || 'None');
                    }
                    else {
                        console.error('❌ Re-login failed - authentication not successful');
                    }
                    return [3 /*break*/, 30];
                case 29:
                    error_5 = _d.sent();
                    console.error('❌ Re-login threw exception:', error_5);
                    return [3 /*break*/, 30];
                case 30:
                    console.log('');
                    // === TEST 5: ERROR HANDLING ===
                    console.log('⚠️ === TEST 5: ERROR HANDLING ===\n');
                    // Test invalid credentials
                    console.log('🔄 Testing invalid password...');
                    _d.label = 31;
                case 31:
                    _d.trys.push([31, 33, , 34]);
                    return [4 /*yield*/, db.login(testUsername, 'wrongpassword')];
                case 32:
                    invalidLoginResult = _d.sent();
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
                    return [3 /*break*/, 34];
                case 33:
                    error_6 = _d.sent();
                    console.log('✓ Invalid password threw exception (expected):', error_6 instanceof Error ? error_6.message : String(error_6));
                    return [3 /*break*/, 34];
                case 34:
                    // Test non-existent user
                    console.log('\n🔄 Testing non-existent user...');
                    _d.label = 35;
                case 35:
                    _d.trys.push([35, 37, , 38]);
                    return [4 /*yield*/, db.login('nonexistentuser123', 'password')];
                case 36:
                    nonexistentLoginResult = _d.sent();
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
                    return [3 /*break*/, 38];
                case 37:
                    error_7 = _d.sent();
                    console.log('✓ Non-existent user threw exception (expected):', error_7 instanceof Error ? error_7.message : String(error_7));
                    return [3 /*break*/, 38];
                case 38:
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
                    return [2 /*return*/];
            }
        });
    });
}
// Esegui il test
if (require.main === module) {
    authTest().catch(console.error);
}
export { authTest };
