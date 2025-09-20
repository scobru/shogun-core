/**
 * Examples showing simplified usage of ShogunCore
 * Demonstrates how to reduce complexity while maintaining functionality
 */

import Gun from "gun/gun";
import { quickStart } from "../gundb/simple-api";
import { ShogunCore } from "../core";

// Example 1: Quick Start - Minimal setup for common use cases
export async function quickStartExample() {
  // Initialize Gun with minimal config
  const gun = Gun({
    peers: ["https://gunjs.herokuapp.com/gun"],
  });

  // Create simple API wrapper
  const shogun = quickStart(gun, "my-app");
  await shogun.init();

  // Simple operations - no complex error handling needed
  const success = await shogun.api.put("users/john", {
    name: "John Doe",
    age: 30,
  });
  console.log("Data saved:", success);

  const userData = await shogun.api.get("users/john");
  console.log("User data:", userData);

  // Simple authentication
  const user = await shogun.api.login("john", "password123");
  if (user) {
    console.log("Logged in:", user.username);

    // Save user-specific data
    await shogun.api.putUserData("profile", { bio: "Hello world!" });

    // Update user profile
    await shogun.api.updateProfile({
      name: "John Doe",
      email: "john@example.com",
      bio: "Hello world!",
      avatar: "https://example.com/avatar.jpg",
    });

    // Save user settings
    await shogun.api.saveSettings({
      theme: "dark",
      language: "en",
      notifications: true,
    });

    // Create a collection
    await shogun.api.createCollection("bookmarks", {
      bookmark1: { url: "https://example.com", title: "Example" },
      bookmark2: { url: "https://github.com", title: "GitHub" },
    });

    // Add item to collection
    await shogun.api.addToCollection("bookmarks", "bookmark3", {
      url: "https://stackoverflow.com",
      title: "Stack Overflow",
    });
  }
}

// Example 2: Traditional ShogunCore with simplified patterns
export async function traditionalSimplifiedExample() {
  const gun = Gun({
    peers: ["https://gunjs.herokuapp.com/gun"],
  });

  const shogun = new ShogunCore({
    gunInstance: gun,
    gunOptions: { peers: ["https://gunjs.herokuapp.com/gun"] },
  });

  // Wait for initialization
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simplified data operations using the simple API
  const simpleAPI = shogun.db as any; // Access the simple API through the database

  // These operations are now much simpler
  const saved = await simpleAPI.put("messages/chat1", {
    text: "Hello!",
    timestamp: Date.now(),
  });

  if (saved) {
    const message = await simpleAPI.get("messages/chat1");
    console.log("Message retrieved:", message);
  }
}

// Example 3: Progressive complexity - start simple, add features as needed
export class ProgressiveShogun {
  private shogun: ShogunCore;
  private simpleAPI: any;

  constructor() {
    const gun = Gun({
      peers: ["https://gunjs.herokuapp.com/gun"],
    });

    this.shogun = new ShogunCore({
      gunInstance: gun,
      gunOptions: { peers: ["https://gunjs.herokuapp.com/gun"] },
    });

    // Start with simple API
    this.simpleAPI = quickStart(gun, "progressive-app");
  }

  // Level 1: Basic operations
  async basicOperations() {
    await this.simpleAPI.init();

    // Simple CRUD
    await this.simpleAPI.api.put("data", { value: 42 });
    const data = await this.simpleAPI.api.get("data");
    console.log("Basic data:", data);
  }

  // Level 2: Authentication
  async addAuthentication() {
    const user = await this.simpleAPI.api.signup("alice", "password123");
    if (user) {
      console.log("User created:", user.username);

      // User-specific data
      await this.simpleAPI.api.putUserData("settings", { theme: "dark" });
    }
  }

  // Level 3: Advanced features (when needed)
  async addAdvancedFeatures() {
    // Access full ShogunCore features
    const plugins = this.shogun.getPluginsInfo();
    console.log("Available plugins:", plugins);

    // Use RxJS for reactive programming
    const rx = this.shogun.rx;
    rx.observe("realtime-data").subscribe((data) => {
      console.log("Real-time update:", data);
    });
  }
}

// Example 4: Migration helper from raw GunDB
export class GunDBMigrationHelper {
  private shogun: ShogunCore;

  constructor(gunInstance: any) {
    this.shogun = new ShogunCore({
      gunInstance: gunInstance,
    });
  }

  // Convert raw GunDB patterns to simplified ShogunCore patterns
  async migrateFromRawGun() {
    // Old GunDB way:
    // gun.get('users').put({name: 'John'}, ack => { ... })

    // New simplified way:
    const success = await this.shogun.db.put("users", { name: "John" });
    console.log("Migration result:", success.success);

    // Old GunDB way:
    // gun.get('users').once(data => { ... })

    // New simplified way:
    const userData = await this.shogun.db.getData("users");
    console.log("User data:", userData);
  }

  // Helper to gradually migrate complex GunDB code
  async gradualMigration() {
    // Step 1: Replace basic operations
    const basicOps = {
      put: (path: string, data: any) => this.shogun.db.put(path, data),
      get: (path: string) => this.shogun.db.getData(path),
      remove: (path: string) => this.shogun.db.remove(path),
    };

    // Step 2: Add authentication
    const auth = {
      login: (username: string, password: string) =>
        this.shogun.db.login(username, password),
      signup: (username: string, password: string) =>
        this.shogun.db.signUp(username, password),
      logout: () => this.shogun.db.logout(),
    };

    // Step 3: Add advanced features as needed
    const advanced = {
      plugins: () => this.shogun.getPluginsInfo(),
      rx: () => this.shogun.rx,
      events: () => this.shogun.on,
    };

    return { basicOps, auth, advanced };
  }
}

// Usage examples
export async function runExamples() {
  console.log("=== Quick Start Example ===");
  await quickStartExample();

  console.log("\n=== Traditional Simplified Example ===");
  await traditionalSimplifiedExample();

  console.log("\n=== Progressive Complexity Example ===");
  const progressive = new ProgressiveShogun();
  await progressive.basicOperations();
  await progressive.addAuthentication();
  await progressive.addAdvancedFeatures();

  console.log("\n=== Migration Helper Example ===");
  const gun = Gun({ peers: ["https://gunjs.herokuapp.com/gun"] });
  const migration = new GunDBMigrationHelper(gun);
  await migration.migrateFromRawGun();
  const migrationHelpers = await migration.gradualMigration();
  console.log("Migration helpers created:", Object.keys(migrationHelpers));

  console.log("\n=== User Space Management Example ===");
  await userSpaceManagementExample();
}

// Example 5: Complete User Space Management
export async function userSpaceManagementExample() {
  const gun = Gun({ peers: ["https://gunjs.herokuapp.com/gun"] });
  const shogun = quickStart(gun, "user-space-demo");
  await shogun.init();

  // Register and login
  const user = await shogun.api.signup("alice", "password123");
  if (!user) {
    console.error("Failed to create user");
    return;
  }

  console.log("User created:", user.username);

  // 1. Profile Management
  console.log("\n=== Profile Management ===");
  const profileUpdated = await shogun.api.updateProfile({
    name: "Alice Smith",
    email: "alice@example.com",
    bio: "Software developer and GunDB enthusiast",
    avatar: "https://example.com/alice-avatar.jpg",
    location: "San Francisco, CA",
    website: "https://alice.dev",
  });
  console.log("Profile updated:", profileUpdated);

  const profile = await shogun.api.getProfile();
  console.log("Current profile:", profile);

  // 2. Settings Management
  console.log("\n=== Settings Management ===");
  const settingsSaved = await shogun.api.saveSettings({
    theme: "dark",
    language: "en",
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    privacy: {
      profilePublic: true,
      showEmail: false,
      showLocation: true,
    },
  });
  console.log("Settings saved:", settingsSaved);

  const settings = await shogun.api.getSettings();
  console.log("Current settings:", settings);

  // 3. Preferences Management
  console.log("\n=== Preferences Management ===");
  const preferencesSaved = await shogun.api.savePreferences({
    ui: {
      sidebarCollapsed: false,
      compactMode: true,
      animationsEnabled: true,
    },
    data: {
      autoSave: true,
      syncInterval: 30000,
      offlineMode: false,
    },
  });
  console.log("Preferences saved:", preferencesSaved);

  const preferences = await shogun.api.getPreferences();
  console.log("Current preferences:", preferences);

  // 4. Collections Management
  console.log("\n=== Collections Management ===");

  // Create bookmarks collection
  const bookmarksCreated = await shogun.api.createCollection("bookmarks", {
    "gun-docs": {
      url: "https://gun.eco/docs",
      title: "GunDB Documentation",
      tags: ["documentation", "gun", "database"],
      addedAt: Date.now(),
    },
    "shogun-core": {
      url: "https://github.com/shogun-core",
      title: "ShogunCore Repository",
      tags: ["github", "typescript", "gun"],
      addedAt: Date.now(),
    },
  });
  console.log("Bookmarks collection created:", bookmarksCreated);

  // Add more bookmarks
  await shogun.api.addToCollection("bookmarks", "rxjs-docs", {
    url: "https://rxjs.dev",
    title: "RxJS Documentation",
    tags: ["rxjs", "reactive", "programming"],
    addedAt: Date.now(),
  });

  await shogun.api.addToCollection("bookmarks", "typescript-docs", {
    url: "https://www.typescriptlang.org/docs",
    title: "TypeScript Documentation",
    tags: ["typescript", "javascript", "programming"],
    addedAt: Date.now(),
  });

  // Get bookmarks collection
  const bookmarks = await shogun.api.getCollection("bookmarks");
  console.log("Bookmarks collection:", bookmarks);

  // Create notes collection
  const notesCreated = await shogun.api.createCollection("notes", {
    "meeting-notes": {
      title: "Team Meeting Notes",
      content: "Discussed project roadmap and deadlines...",
      tags: ["work", "meeting"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  });
  console.log("Notes collection created:", notesCreated);

  // Add more notes
  await shogun.api.addToCollection("notes", "idea-1", {
    title: "App Idea: Decentralized Social Network",
    content: "Build a social network using GunDB for real-time messaging...",
    tags: ["idea", "social", "decentralized"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const notes = await shogun.api.getCollection("notes");
  console.log("Notes collection:", notes);

  // 5. Advanced User Data Operations
  console.log("\n=== Advanced Operations ===");

  // Get all user data
  const allUserData = await shogun.api.getAllUserData();
  console.log("All user data keys:", Object.keys(allUserData || {}));

  // Update specific settings
  const currentSettings = await shogun.api.getSettings();
  if (currentSettings) {
    const updatedSettings = {
      ...currentSettings,
      theme: "light", // Change theme
      notifications: {
        ...currentSettings.notifications,
        push: true, // Enable push notifications
      },
    };
    await shogun.api.saveSettings(updatedSettings);
    console.log("Settings updated with new theme and push notifications");
  }

  // Remove item from collection
  const removed = await shogun.api.removeFromCollection(
    "bookmarks",
    "gun-docs",
  );
  console.log("Bookmark removed:", removed);

  // Get updated collection
  const updatedBookmarks = await shogun.api.getCollection("bookmarks");
  console.log("Updated bookmarks:", Object.keys(updatedBookmarks || {}));

  // 6. Data Persistence and Retrieval
  console.log("\n=== Data Persistence ===");

  // Save custom user data
  await shogun.api.putUserData("customData", {
    lastLogin: Date.now(),
    loginCount: 1,
    favoriteColor: "blue",
    timezone: "UTC-8",
  });

  const customData = await shogun.api.getUserData("customData");
  console.log("Custom user data:", customData);

  // Update custom data
  if (customData) {
    const updatedCustomData = {
      ...customData,
      loginCount: (customData.loginCount as number) + 1,
      lastLogin: Date.now(),
    };
    await shogun.api.putUserData("customData", updatedCustomData);
    console.log("Custom data updated with new login count");
  }

  console.log("\n=== User Space Management Complete ===");
  console.log("All user data operations completed successfully!");
}
