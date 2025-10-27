/**
 * Transport Layer Examples
 *
 * This example demonstrates how to use ShogunCore with different transport layers:
 * - GunDB (decentralized)
 * - SQLite (traditional database)
 * - Custom transport layer
 *
 * All examples use the same API, showing the flexibility of the new architecture.
 */

import { ShogunCore } from "../core";
import {
  TransportFactory,
  TransportConfig,
  TransportLayer,
  IUserInstance,
  IChain,
} from "../gundb/transport/TransportLayer";
import { GunTransport } from "../gundb/transport/GunTransport";
import { SqliteTransport } from "../gundb/transport/SqliteTransport";
import Database from "better-sqlite3";

/**
 * Example 1: Using GunDB Transport (Default)
 */
async function gunTransportExample() {
  console.log("🚀 Example 1: GunDB Transport");
  console.log("================================");

  try {
    // Initialize ShogunCore with GunDB transport
    const shogun = new ShogunCore({
      transport: {
        type: "gun",
        options: {
          peers: ["https://shogunnode.scobrudot.dev/gun"],
          localStorage: true,
        },
      },
    });

    // Wait for initialization
    await shogun.initialize();

    console.log("✅ GunDB transport initialized");
    console.log("Transport name:", shogun.transport.name);
    console.log("Transport version:", shogun.transport.version);
    console.log("Is connected:", shogun.transport.isConnected());

    // Test user operations
    console.log("\n📝 Testing user operations...");

    // Sign up a new user
    const signupResult = await shogun.db.signUp("testuser_gun", "password123");
    if (signupResult.success) {
      console.log("✅ User signed up successfully:", signupResult.userPub);
    } else {
      console.log("❌ Signup failed:", signupResult.error);
      // login
      const loginResult = await shogun.db.login("testuser_gun", "password123");
      if (loginResult.success) {
        console.log("✅ User logged in successfully:", loginResult.userPub);
      } else {
        console.log("❌ Login failed:", loginResult.error);
      }
    }

    // Test data operations
    console.log("\n💾 Testing data operations...");
    await shogun.db.put("test/gun/data", {
      message: "Hello from GunDB!",
      timestamp: Date.now(),
    });

    const data = await shogun.db.getData("test/gun/data");
    console.log("📖 Retrieved data:", data);

    // Test peer management (GunDB specific)
    console.log("\n🌐 Testing peer management...");
    shogun.db.addPeer("https://shogunnode.scobrudot.dev/gun");
    const peers = shogun.db.getCurrentPeers();
    console.log("🔗 Current peers:", peers);

    // Cleanup
    shogun.transport.destroy();
    console.log("🧹 GunDB transport cleaned up\n");
  } catch (error) {
    console.error("❌ GunDB example failed:", error);
  }
}

/**
 * Example 2: Using SQLite Transport
 */
async function sqliteTransportExample() {
  console.log("🗄️ Example 2: SQLite Transport");
  console.log("=================================");

  try {
    // Initialize ShogunCore with SQLite transport
    const shogun = new ShogunCore({
      transport: {
        type: "sqlite",
        options: {
          database: "./example.db",
          verbose: true,
        },
      },
    });

    // Wait for initialization
    await shogun.initialize();

    console.log("✅ SQLite transport initialized");
    console.log("Transport name:", shogun.transport.name);
    console.log("Transport version:", shogun.transport.version);
    console.log("Is connected:", shogun.transport.isConnected());

    // Test user operations
    console.log("\n📝 Testing user operations...");

    // Sign up a new user
    const signupResult = await shogun.db.signUp(
      "testuser_sqlite",
      "password123",
    );
    if (signupResult.success) {
      console.log("✅ User signed up successfully:", signupResult.userPub);
    } else {
      console.log("❌ Signup failed:", signupResult.error);
    }

    // Test data operations
    console.log("\n💾 Testing data operations...");
    await shogun.db.put("test/sqlite/data", {
      message: "Hello from SQLite!",
      timestamp: Date.now(),
    });

    const data = await shogun.db.getData("test/sqlite/data");
    console.log("📖 Retrieved data:", data);

    // Test SQL-specific operations
    console.log("\n🔍 Testing SQL-specific operations...");
    if (shogun.transport.query) {
      const result = await shogun.transport.query(
        "SELECT * FROM data WHERE path LIKE ?",
        ["test/sqlite/%"],
      );
      console.log("📊 SQL query result:", result);
    }

    // Cleanup
    shogun.transport.destroy();
    console.log("🧹 SQLite transport cleaned up\n");
  } catch (error) {
    console.error("❌ SQLite example failed:", error);
  }
}

/**
 * Example 3: Using Custom Transport Layer
 */
async function customTransportExample() {
  console.log("🔧 Example 3: Custom Transport Layer");
  console.log("=====================================");

  try {
    // Create a custom transport that logs all operations
    class LoggingTransport extends GunTransport {
      public readonly name = "gundb" as const;
      public readonly version = "1.0.0";

      async put(data: any): Promise<any> {
        console.log(`📝 [LOG] PUT:`, data);
        return super.put(data);
      }

      async getData(): Promise<any> {
        console.log(`📖 [LOG] GET`);
        return super.getData();
      }

      user(): any {
        console.log(`👤 [LOG] USER operation`);
        return super.user();
      }
    }

    // Initialize ShogunCore with custom transport
    const shogun = new ShogunCore({
      transport: {
        type: "custom",
        customTransport: new LoggingTransport({}),
      },
    });

    // Wait for initialization
    await shogun.initialize();

    console.log("✅ Custom transport initialized");
    console.log("Transport name:", shogun.transport.name);
    console.log("Transport version:", shogun.transport.version);

    // Test operations (all will be logged)
    console.log("\n📝 Testing logged operations...");

    await shogun.db.put("test/custom/data", {
      message: "Hello from custom transport!",
      timestamp: Date.now(),
    });
    const data = await shogun.db.getData("test/custom/data");
    console.log("📖 Retrieved data:", data);

    // Cleanup
    shogun.transport.destroy();
    console.log("🧹 Custom transport cleaned up\n");
  } catch (error) {
    console.error("❌ Custom transport example failed:", error);
  }
}

/**
 * Example 4: Backward Compatibility with Gun Instance
 */
async function backwardCompatibilityExample() {
  console.log("🔄 Example 4: Backward Compatibility");
  console.log("=====================================");

  try {
    // This shows how existing code continues to work
    const shogun = new ShogunCore({
      gunOptions: {
        peers: ["https://gun-server.herokuapp.com/gun"],
        localStorage: true,
      },
    });

    // Wait for initialization
    await shogun.initialize();

    console.log("✅ Backward compatibility mode initialized");
    console.log("Transport name:", shogun.transport.name);

    // Access Gun instance for backward compatibility
    const gunInstance = shogun.db.getGun();
    if (gunInstance) {
      console.log("✅ Gun instance available for backward compatibility");
    }

    // Test that the API still works the same way
    await shogun.db.put("test/compat/data", {
      message: "Backward compatible!",
      timestamp: Date.now(),
    });
    const data = await shogun.db.getData("test/compat/data");
    console.log("📖 Retrieved data:", data);

    // Cleanup
    shogun.transport.destroy();
    console.log("🧹 Backward compatibility example cleaned up\n");
  } catch (error) {
    console.error("❌ Backward compatibility example failed:", error);
  }
}

/**
 * Example 5: Real SQLite Implementation (Example Only)
 * This shows how to implement a real SQLite transport using better-sqlite3
 */
async function realSqliteExample() {
  console.log("🗄️ Example 5: Real SQLite Implementation");
  console.log("==========================================");

  try {
    // Real SQLite User Instance Implementation
    class RealSqliteUserInstance implements IUserInstance {
      constructor(
        private transport: RealSqliteTransport,
        private userId?: string,
      ) {}

      get is() {
        return this.userId
          ? {
              pub: this.userId,
              epub: this.userId,
              alias: this.userId,
            }
          : undefined;
      }

      get _() {
        return this.userId
          ? {
              sea: {
                pub: this.userId,
                priv: "",
                epub: this.userId,
                epriv: "",
              },
            }
          : undefined;
      }

      auth(...args: any[]): any {
        const [username, password, callback] = args;

        if (typeof callback === "function") {
          setTimeout(async () => {
            try {
              const result = await this.transport.query(
                "SELECT id FROM users WHERE username = ? AND password = ?",
                [username, password],
              );

              if (result && result.length > 0) {
                this.userId = result[0].id.toString();
                callback({
                  err: null,
                  pub: this.userId,
                  user: { id: this.userId, username },
                });
              } else {
                callback({ err: "Invalid credentials" });
              }
            } catch (error: any) {
              callback({ err: error.message });
            }
          }, 50);
        }

        return this;
      }

      create(...args: any[]): any {
        const [username, password, callback] = args;

        if (typeof callback === "function") {
          setTimeout(async () => {
            try {
              const result = await this.transport.query(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                [username, password],
              );

              this.userId = result.insertId.toString();
              callback({
                err: null,
                pub: this.userId,
                user: { id: this.userId, username },
              });
            } catch (error: any) {
              callback({ err: error.message });
            }
          }, 50);
        }

        return this;
      }

      leave(): void {
        this.userId = undefined;
      }

      recall(options?: any): IUserInstance {
        return this;
      }

      put(data: any): void {
        if (!this.userId) return;

        this.transport
          .query("UPDATE users SET data = ? WHERE id = ?", [
            JSON.stringify(data),
            this.userId,
          ])
          .catch(console.error);
      }

      get(key: string): IChain {
        return new RealSqliteChain(
          this.transport,
          `users/${this.userId}/${key}`,
        );
      }
    }

    // Real SQLite Chain Implementation
    class RealSqliteChain implements IChain {
      constructor(
        private transport: RealSqliteTransport,
        private path: string,
      ) {}

      get(key: string): IChain {
        return new RealSqliteChain(this.transport, `${this.path}/${key}`);
      }

      async put(data: any): Promise<any> {
        try {
          const result = await this.transport.query(
            "INSERT OR REPLACE INTO data (path, value) VALUES (?, ?)",
            [this.path, JSON.stringify(data)],
          );
          return result;
        } catch (error) {
          throw error;
        }
      }

      async set(data: any): Promise<any> {
        return this.put(data);
      }

      once(callback: (data: any) => void): void {
        this.getData().then(callback).catch(console.error);
      }

      on(callback: (data: any) => void): void {
        const interval = setInterval(() => {
          this.getData().then(callback).catch(console.error);
        }, 1000);
        (this as any)._interval = interval;
      }

      off(callback: (data: any) => void): void {
        const interval = (this as any)._interval;
        if (interval) {
          clearInterval(interval);
          delete (this as any)._interval;
        }
      }

      async then(): Promise<any> {
        return this.getData();
      }

      async find(query: any): Promise<any> {
        try {
          const result = await this.transport.query(
            "SELECT * FROM data WHERE path LIKE ?",
            [`${this.path}%`],
          );
          return result;
        } catch (error) {
          throw error;
        }
      }

      async insert(data: any): Promise<any> {
        return this.put(data);
      }

      async update(query: any, data: any): Promise<any> {
        try {
          const result = await this.transport.query(
            "UPDATE data SET value = ? WHERE path = ? AND value LIKE ?",
            [JSON.stringify(data), this.path, `%${JSON.stringify(query)}%`],
          );
          return result;
        } catch (error) {
          throw error;
        }
      }

      async delete(query: any): Promise<any> {
        try {
          const result = await this.transport.query(
            "DELETE FROM data WHERE path = ? AND value LIKE ?",
            [this.path, `%${JSON.stringify(query)}%`],
          );
          return result;
        } catch (error) {
          throw error;
        }
      }

      private async getData(): Promise<any> {
        try {
          const result = await this.transport.query(
            "SELECT value FROM data WHERE path = ?",
            [this.path],
          );
          return result && result.length > 0
            ? JSON.parse(result[0].value)
            : null;
        } catch (error) {
          return null;
        }
      }
    }

    // Real SQLite Transport Implementation
    class RealSqliteTransport implements TransportLayer {
      public readonly name = "real-sqlite";
      public readonly version = "1.0.0";

      private db!: Database.Database;
      private isConnectedState = false;
      private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

      constructor(options?: any) {
        this.initializeDatabase(options);
      }

      private async initializeDatabase(options?: any): Promise<void> {
        try {
          const dbPath = options?.database || "./real-example.db";
          console.log(`🗄️ Connecting to real SQLite database: ${dbPath}`);

          this.db = new Database(dbPath);
          this.db.pragma("journal_mode = WAL");

          await this.createTables();
          this.isConnectedState = true;

          console.log("✅ Real SQLite database initialized successfully");
        } catch (error) {
          console.error("❌ Real SQLite initialization error:", error);
          this.isConnectedState = false;
          throw error;
        }
      }

      private async createTables(): Promise<void> {
        try {
          this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              data TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS data (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              path TEXT UNIQUE NOT NULL,
              value TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_data_path ON data(path);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
          `);

          console.log("📋 Real SQLite tables created successfully");
        } catch (error) {
          console.error("❌ Error creating real SQLite tables:", error);
          throw error;
        }
      }

      user(): IUserInstance {
        return new RealSqliteUserInstance(this);
      }

      get(path: string): IChain {
        return new RealSqliteChain(this, path);
      }

      on?(event: string, callback: (data: any) => void): void {
        if (!this.eventListeners.has(event)) {
          this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);
      }

      off?(event: string, callback: (data: any) => void): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
          listeners.delete(callback);
        }
      }

      emit?(event: string, data?: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
          listeners.forEach((callback) => callback(data));
        }
      }

      async connect(config?: any): Promise<boolean> {
        try {
          this.isConnectedState = true;
          return true;
        } catch (error) {
          console.error("❌ Real SQLite connection error:", error);
          this.isConnectedState = false;
          return false;
        }
      }

      async disconnect(): Promise<boolean> {
        try {
          this.isConnectedState = false;
          return true;
        } catch (error) {
          console.error("❌ Real SQLite disconnection error:", error);
          return false;
        }
      }

      isConnected(): boolean {
        return this.isConnectedState;
      }

      configure(options: any): void {
        console.log("⚙️ Configuring real SQLite transport:", options);
      }

      async query(sql: string, params?: any[]): Promise<any> {
        try {
          console.log(`🔍 Real SQL Query: ${sql}`, params || []);

          const stmt = this.db.prepare(sql);

          if (sql.trim().toUpperCase().startsWith("SELECT")) {
            return stmt.all(params || []);
          } else if (sql.trim().toUpperCase().startsWith("INSERT")) {
            const result = stmt.run(params || []);
            return { insertId: result.lastInsertRowid };
          } else if (
            sql.trim().toUpperCase().startsWith("UPDATE") ||
            sql.trim().toUpperCase().startsWith("DELETE")
          ) {
            const result = stmt.run(params || []);
            return { changes: result.changes };
          }

          return stmt.run(params || []);
        } catch (error) {
          console.error("❌ Real SQL query error:", error);
          throw error;
        }
      }

      async transaction?(callback: (tx: any) => Promise<any>): Promise<any> {
        try {
          const transaction = this.db.transaction(() => {
            const tx = {
              query: (sql: string, params?: any[]) => this.query(sql, params),
            };
            return callback(tx);
          });

          return transaction();
        } catch (error) {
          console.error("❌ Real SQLite transaction error:", error);
          throw error;
        }
      }

      getStats(): { users: number; data: number; size: string } {
        try {
          const usersResult = this.db
            .prepare("SELECT COUNT(*) as count FROM users")
            .get() as { count: number };
          const dataResult = this.db
            .prepare("SELECT COUNT(*) as count FROM data")
            .get() as { count: number };

          const fs = require("fs");
          const stats = fs.statSync(this.db.name);
          const size = (stats.size / 1024).toFixed(2) + " KB";

          return {
            users: usersResult.count,
            data: dataResult.count,
            size: size,
          };
        } catch (error) {
          console.error("❌ Error getting real SQLite stats:", error);
          return { users: 0, data: 0, size: "0 KB" };
        }
      }

      destroy(): void {
        try {
          this.eventListeners.clear();

          if (this.db) {
            this.db.close();
            console.log("🔒 Real SQLite database connection closed");
          }

          this.isConnectedState = false;
        } catch (error) {
          console.error("❌ Real SQLite destroy error:", error);
        }
      }
    }

    // Test the real SQLite implementation
    console.log("🧪 Testing real SQLite implementation...");

    const realSqliteTransport = new RealSqliteTransport({
      database: "./real-sqlite-example.db",
    });

    await realSqliteTransport.connect();

    console.log("✅ Real SQLite transport created and connected");
    console.log("Transport name:", realSqliteTransport.name);
    console.log("Transport version:", realSqliteTransport.version);
    console.log("Is connected:", realSqliteTransport.isConnected());

    // Test user operations
    console.log("\n📝 Testing real user operations...");

    const user = realSqliteTransport.user();

    // Create user
    await new Promise<void>((resolve, reject) => {
      user.create("realuser", "password123", (result: any) => {
        if (result.err) {
          console.log("❌ User creation failed:", result.err);
          reject(new Error(result.err));
        } else {
          console.log("✅ User created successfully:", result.pub);
          resolve();
        }
      });
    });

    // Test data operations
    console.log("\n💾 Testing real data operations...");

    const node = realSqliteTransport.get("test/real/data");
    await node.put({
      message: "Hello from real SQLite!",
      timestamp: Date.now(),
    });

    const data = await node.then();
    console.log("📖 Retrieved data:", data);

    // Test SQL-specific operations
    console.log("\n🔍 Testing real SQL-specific operations...");

    const result = await realSqliteTransport.query(
      "SELECT * FROM data WHERE path LIKE ?",
      ["test/real/%"],
    );
    console.log("📊 Real SQL query result:", result);

    // Get database stats
    console.log("\n📊 Database statistics:");
    const stats = realSqliteTransport.getStats();
    console.log("   Users:", stats.users);
    console.log("   Data records:", stats.data);
    console.log("   Database size:", stats.size);

    // Cleanup
    realSqliteTransport.destroy();
    console.log("🧹 Real SQLite example cleaned up\n");
  } catch (error) {
    console.error("❌ Real SQLite example failed:", error);
  }
}

/**
 * Example 6: Transport Layer Comparison
 */
async function transportComparisonExample() {
  console.log("⚖️ Example 5: Transport Layer Comparison");
  console.log("==========================================");

  const transports = [
    { name: "GunDB", type: "gun" as const, options: {} },
    {
      name: "SQLite",
      type: "sqlite" as const,
      options: { database: "./comparison.db" },
    },
  ];

  for (const transportConfig of transports) {
    console.log(`\n🔍 Testing ${transportConfig.name}...`);

    try {
      const transport = TransportFactory.create(transportConfig);

      console.log(`✅ ${transportConfig.name} created`);
      console.log(`   Name: ${transport.name}`);
      console.log(`   Version: ${transport.version}`);

      // Test connection
      const connected = await transport.connect(transportConfig.options);
      console.log(`   Connected: ${connected}`);

      // Test basic operations
      const user = transport.user();
      console.log(`   User instance: ${user ? "Available" : "Not available"}`);

      const node = transport.get("test");
      console.log(`   Node instance: ${node ? "Available" : "Not available"}`);

      // Cleanup
      await transport.disconnect();
      transport.destroy();
      console.log(`   Cleaned up`);
    } catch (error) {
      console.error(`❌ ${transportConfig.name} failed:`, error);
    }
  }
}

/**
 * Main function to run all examples
 */
async function runAllExamples() {
  console.log("🎯 ShogunCore Transport Layer Examples");
  console.log("========================================");
  console.log(
    "This example demonstrates the flexibility of the new transport layer architecture.\n",
  );

  try {
    // Run all examples
    await gunTransportExample();
    await sqliteTransportExample();
    await customTransportExample();
    await backwardCompatibilityExample();
    await realSqliteExample();
    await transportComparisonExample();

    console.log("🎉 All examples completed successfully!");
    console.log("\n📚 Key Takeaways:");
    console.log("• Same API works with different databases");
    console.log("• Easy to switch between transport layers");
    console.log("• Backward compatibility maintained");
    console.log("• Custom transport layers supported");
    console.log("• Database-specific features available when needed");
    console.log("• Real SQLite implementation example provided");
  } catch (error) {
    console.error("❌ Examples failed:", error);
  }
}

// Export for use in other files
export {
  gunTransportExample,
  sqliteTransportExample,
  customTransportExample,
  backwardCompatibilityExample,
  realSqliteExample,
  transportComparisonExample,
  runAllExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
