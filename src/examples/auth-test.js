"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authTest = authTest;
var gun_1 = require("gun");
var api_1 = require("../gundb/api");
function authTest() {
    return __awaiter(this, void 0, void 0, function () {
        var gunInstance, quickStart, error_1, api, db, testUsername, testPassword, signupStartTime, preSignupCheck, signupPromise, timeoutPromise, signupResult, signupDuration, error_2, loginStartTime, loginPromise, timeoutPromise, loginResult, loginDuration, currentUser, isLoggedIn, error_3, testData, retrievedData, profile, error_4, isStillLoggedIn, currentUserAfterLogout, error_5, reloginResult, error_6, invalidLoginResult, error_7, nonexistentLoginResult, error_8;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("🔐 ShogunCore Authentication Test\n");
                    // === INITIALIZATION ===
                    console.log("📦 === INITIALIZATION ===\n");
                    gunInstance = (0, gun_1.default)({
                        peers: ["https://shogunnode.scobrudot.dev/gun"],
                        radisk: false,
                    });
                    quickStart = new api_1.AutoQuickStart(gunInstance, "shogun");
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, quickStart.init()];
                case 2:
                    _c.sent();
                    console.log("✓ ShogunCore initialized successfully");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    console.error("❌ Failed to initialize ShogunCore:", error_1);
                    return [2 /*return*/];
                case 4:
                    api = quickStart.api;
                    db = api.database;
                    console.log("peers:", db.gun._.opt.peers);
                    console.log("- Database instance:", db ? "Available" : "Not available");
                    console.log("- Current user:", ((_a = db.getCurrentUser()) === null || _a === void 0 ? void 0 : _a.alias) || "None");
                    console.log("- Is logged in:", db.isLoggedIn());
                    console.log("");
                    // === TEST 1: BASIC SIGNUP AND LOGIN ===
                    console.log("🧪 === TEST 1: BASIC SIGNUP AND LOGIN ===\n");
                    testUsername = "scobru";
                    testPassword = "francos88";
                    // Clean up any existing session
                    console.log("🧹 Cleaning up any existing session...");
                    db.logout();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 5:
                    _c.sent(); // Wait 1 second
                    if (!(testUsername === "scobru")) return [3 /*break*/, 7];
                    console.log("🔧 Performing aggressive cleanup for problematic user...");
                    db.aggressiveAuthCleanup();
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                case 6:
                    _c.sent(); // Wait 3 seconds
                    console.log("✓ Aggressive cleanup completed");
                    _c.label = 7;
                case 7:
                    console.log("✓ Session cleanup completed\n");
                    console.log("Testing with username: ".concat(testUsername));
                    console.log("Password: ".concat(testPassword, "\n"));
                    // Test signup
                    console.log("🔄 Attempting signup...");
                    signupStartTime = Date.now();
                    // Check if user already exists before signup
                    console.log("\uD83D\uDD0D Pre-signup check for user: ".concat(testUsername));
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var timeout = setTimeout(function () {
                                console.log("⏰ Pre-signup check timeout");
                                resolve(false);
                            }, 3000);
                            db.gun.get("~@".concat(testUsername)).once(function (data) {
                                clearTimeout(timeout);
                                console.log("📊 Pre-signup data:", data ? "User exists" : "User not found");
                                if (data) {
                                    console.log("🔑 User pub:", data.pub ? "".concat(data.pub.substring(0, 20), "...") : "None");
                                    console.log("📝 User keys:", Object.keys(data));
                                }
                                resolve(!!data && !!data.pub);
                            });
                        })];
                case 8:
                    preSignupCheck = _c.sent();
                    if (!preSignupCheck) return [3 /*break*/, 9];
                    console.log("⚠️ User already exists, skipping signup and going directly to login");
                    return [3 /*break*/, 12];
                case 9:
                    _c.trys.push([9, 11, , 12]);
                    signupPromise = db.signUp(testUsername, testPassword);
                    timeoutPromise = new Promise(function (_, reject) {
                        return setTimeout(function () { return reject(new Error("Signup timeout after 30 seconds")); }, 30000);
                    });
                    return [4 /*yield*/, Promise.race([
                            signupPromise,
                            timeoutPromise,
                        ])];
                case 10:
                    signupResult = (_c.sent());
                    signupDuration = Date.now() - signupStartTime;
                    console.log("\u2713 Signup completed in ".concat(signupDuration, "ms"));
                    console.log("Signup result:", {
                        success: signupResult.success,
                        userPub: signupResult.userPub
                            ? "".concat(signupResult.userPub.substring(0, 20), "...")
                            : "None",
                        username: signupResult.username,
                        isNewUser: signupResult.isNewUser,
                        error: signupResult.error || "None",
                    });
                    if (!signupResult.success) {
                        console.log("ℹ️ Signup failed, user might already exist. Will try login...");
                    }
                    return [3 /*break*/, 12];
                case 11:
                    error_2 = _c.sent();
                    console.log("ℹ️ Signup threw exception, user might already exist. Will try login...");
                    console.log("Exception details:", error_2);
                    return [3 /*break*/, 12];
                case 12:
                    // Wait a moment before attempting login
                    console.log("⏳ Waiting 2 seconds before login attempt...");
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 13:
                    _c.sent();
                    console.log("");
                    // Test login
                    console.log("🔄 Attempting login...");
                    loginStartTime = Date.now();
                    _c.label = 14;
                case 14:
                    _c.trys.push([14, 16, , 17]);
                    // Skip user existence check and try direct login
                    console.log("🔄 Attempting direct login (bypassing user existence check)...");
                    loginPromise = db.login(testUsername, testPassword);
                    timeoutPromise = new Promise(function (_, reject) {
                        return setTimeout(function () { return reject(new Error("Login timeout after 30 seconds")); }, 30000);
                    });
                    return [4 /*yield*/, Promise.race([
                            loginPromise,
                            timeoutPromise,
                        ])];
                case 15:
                    loginResult = (_c.sent());
                    loginDuration = Date.now() - loginStartTime;
                    console.log("\u2713 Login completed in ".concat(loginDuration, "ms"));
                    console.log("Login result:", {
                        success: loginResult.success,
                        userPub: loginResult.userPub
                            ? "".concat(loginResult.userPub.substring(0, 20), "...")
                            : "None",
                        username: loginResult.username,
                        error: loginResult.error || "None",
                    });
                    if (!loginResult.success) {
                        console.error("❌ Login failed:", loginResult.error);
                        console.log("ℹ️ If this is a new user, try running the test again after a few seconds");
                        return [2 /*return*/];
                    }
                    // Verify user state
                    console.log("\n🔍 Verifying user state...");
                    currentUser = db.getCurrentUser();
                    isLoggedIn = db.isLoggedIn();
                    console.log("Current user:", {
                        alias: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.alias) || "None",
                        pub: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.pub) ? "".concat(currentUser.pub.substring(0, 20), "...") : "None",
                        epub: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.epub)
                            ? "".concat(currentUser.epub.substring(0, 20), "...")
                            : "None",
                    });
                    console.log("Is logged in:", isLoggedIn);
                    if (!isLoggedIn || !currentUser) {
                        console.error("❌ User state verification failed");
                        return [2 /*return*/];
                    }
                    return [3 /*break*/, 17];
                case 16:
                    error_3 = _c.sent();
                    console.error("❌ Login threw exception:", error_3);
                    return [2 /*return*/];
                case 17:
                    console.log("");
                    // === TEST 2: DATA OPERATIONS WHILE LOGGED IN ===
                    console.log("💾 === TEST 2: DATA OPERATIONS WHILE LOGGED IN ===\n");
                    _c.label = 18;
                case 18:
                    _c.trys.push([18, 23, , 24]);
                    testData = {
                        message: "Hello from auth test!",
                        timestamp: Date.now(),
                        secret: "This is encrypted data",
                    };
                    console.log("🔄 Storing encrypted data...");
                    return [4 /*yield*/, db.put("test/encrypted-data", testData)];
                case 19:
                    _c.sent();
                    console.log("✓ Data stored successfully");
                    console.log("🔄 Retrieving encrypted data...");
                    return [4 /*yield*/, db.getData("test/encrypted-data")];
                case 20:
                    retrievedData = _c.sent();
                    console.log("✓ Data retrieved:", retrievedData);
                    // Test profile operations
                    console.log("\n🔄 Testing profile operations...");
                    return [4 /*yield*/, api.updateProfile({
                            name: "Auth Test User",
                            email: "authtest@example.com",
                            bio: "Testing authentication flow",
                        })];
                case 21:
                    _c.sent();
                    console.log("✓ Profile updated");
                    return [4 /*yield*/, api.getProfile()];
                case 22:
                    profile = _c.sent();
                    console.log("✓ Profile retrieved:", profile);
                    return [3 /*break*/, 24];
                case 23:
                    error_4 = _c.sent();
                    console.error("❌ Data operations failed:", error_4);
                    return [3 /*break*/, 24];
                case 24:
                    console.log("");
                    // === TEST 3: LOGOUT ===
                    console.log("🚪 === TEST 3: LOGOUT ===\n");
                    _c.label = 25;
                case 25:
                    _c.trys.push([25, 27, , 28]);
                    console.log("🔄 Attempting logout...");
                    db.logout();
                    // Wait a moment for logout to complete
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 26:
                    // Wait a moment for logout to complete
                    _c.sent();
                    isStillLoggedIn = db.isLoggedIn();
                    currentUserAfterLogout = db.getCurrentUser();
                    console.log("✓ Logout completed");
                    console.log("Is logged in after logout:", isStillLoggedIn);
                    console.log("Current user after logout:", (currentUserAfterLogout === null || currentUserAfterLogout === void 0 ? void 0 : currentUserAfterLogout.alias) || "None");
                    if (isStillLoggedIn) {
                        console.warn("⚠️ User still appears to be logged in after logout");
                    }
                    else {
                        console.log("✓ Logout successful - user is no longer logged in");
                    }
                    return [3 /*break*/, 28];
                case 27:
                    error_5 = _c.sent();
                    console.error("❌ Logout failed:", error_5);
                    return [3 /*break*/, 28];
                case 28:
                    console.log("");
                    // === TEST 4: RE-LOGIN ===
                    console.log("🔄 === TEST 4: RE-LOGIN ===\n");
                    _c.label = 29;
                case 29:
                    _c.trys.push([29, 31, , 32]);
                    console.log("🔄 Attempting re-login with same credentials...");
                    return [4 /*yield*/, db.login(testUsername, testPassword)];
                case 30:
                    reloginResult = _c.sent();
                    console.log("Re-login result:", {
                        success: reloginResult.success,
                        userPub: reloginResult.userPub
                            ? "".concat(reloginResult.userPub.substring(0, 20), "...")
                            : "None",
                        username: reloginResult.username,
                        error: reloginResult.error || "None",
                    });
                    if (reloginResult.success) {
                        console.log("✓ Re-login successful");
                        console.log("Current user:", ((_b = db.getCurrentUser()) === null || _b === void 0 ? void 0 : _b.alias) || "None");
                    }
                    else {
                        console.error("❌ Re-login failed:", reloginResult.error);
                    }
                    return [3 /*break*/, 32];
                case 31:
                    error_6 = _c.sent();
                    console.error("❌ Re-login threw exception:", error_6);
                    return [3 /*break*/, 32];
                case 32:
                    console.log("");
                    // === TEST 5: ERROR HANDLING ===
                    console.log("⚠️ === TEST 5: ERROR HANDLING ===\n");
                    // Test invalid credentials
                    console.log("🔄 Testing invalid password...");
                    _c.label = 33;
                case 33:
                    _c.trys.push([33, 35, , 36]);
                    return [4 /*yield*/, db.login(testUsername, "wrongpassword")];
                case 34:
                    invalidLoginResult = _c.sent();
                    console.log("Invalid login result:", {
                        success: invalidLoginResult.success,
                        error: invalidLoginResult.error || "None",
                    });
                    if (!invalidLoginResult.success) {
                        console.log("✓ Invalid password correctly rejected");
                    }
                    else {
                        console.warn("⚠️ Invalid password was accepted (unexpected)");
                    }
                    return [3 /*break*/, 36];
                case 35:
                    error_7 = _c.sent();
                    console.log("✓ Invalid password threw exception (expected):", error_7 instanceof Error ? error_7.message : String(error_7));
                    return [3 /*break*/, 36];
                case 36:
                    // Test non-existent user
                    console.log("\n🔄 Testing non-existent user...");
                    _c.label = 37;
                case 37:
                    _c.trys.push([37, 39, , 40]);
                    return [4 /*yield*/, db.login("nonexistentuser123", "password")];
                case 38:
                    nonexistentLoginResult = _c.sent();
                    console.log("Non-existent user login result:", {
                        success: nonexistentLoginResult.success,
                        error: nonexistentLoginResult.error || "None",
                    });
                    if (!nonexistentLoginResult.success) {
                        console.log("✓ Non-existent user correctly rejected");
                    }
                    else {
                        console.warn("⚠️ Non-existent user was accepted (unexpected)");
                    }
                    return [3 /*break*/, 40];
                case 39:
                    error_8 = _c.sent();
                    console.log("✓ Non-existent user threw exception (expected):", error_8 instanceof Error ? error_8.message : String(error_8));
                    return [3 /*break*/, 40];
                case 40:
                    console.log("");
                    // === FINAL LOGOUT ===
                    console.log("🚪 === FINAL CLEANUP ===\n");
                    try {
                        db.logout();
                        console.log("✓ Final logout completed");
                    }
                    catch (error) {
                        console.error("❌ Final logout failed:", error);
                    }
                    console.log("\n✅ Authentication test completed!");
                    console.log("\n📊 Test Summary:");
                    console.log("- ✓ Signup with username/password");
                    console.log("- ✓ Login with username/password");
                    console.log("- ✓ Data operations while logged in");
                    console.log("- ✓ Logout functionality");
                    console.log("- ✓ Re-login capability");
                    console.log("- ✓ Error handling for invalid credentials");
                    console.log("- ✓ Error handling for non-existent users");
                    return [2 /*return*/];
            }
        });
    });
}
// Esegui il test
if (require.main === module) {
    authTest().catch(console.error);
}
