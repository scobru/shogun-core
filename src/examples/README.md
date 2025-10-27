# ShogunCore Transport Layer Examples

This directory contains examples demonstrating how to use ShogunCore with different transport layers. The new architecture allows you to use the same API with various databases (GunDB, SQLite, PostgreSQL, MongoDB, etc.).

## 📁 Files Overview

### `simple-transport-examples.ts`
**Perfect for beginners** - Basic examples showing:
- How to use GunDB transport
- How to use SQLite transport  
- Backward compatibility with existing code
- Easy switching between transports

### `transport-layer-examples.ts`
**Comprehensive examples** showing:
- All available transport types
- Custom transport layer implementation
- Transport factory usage
- Advanced features and comparisons

### `migration-examples.ts`
**Real-world scenarios** including:
- Migrating from GunDB to SQLite
- Transport-agnostic application design
- Data migration scripts
- Best practices for multi-transport apps

## 🚀 Quick Start

### 1. Basic GunDB Usage
```typescript
import { ShogunCore } from "../core";

const shogun = new ShogunCore({
  transport: {
    type: "gun",
    options: {
      peers: ["https://gun-server.herokuapp.com/gun"],
      localStorage: true
    }
  }
});

await shogun.initialize();

// Use the same API you're familiar with
await shogun.db.signUp("username", "password");
await shogun.db.put("data/path", { message: "Hello!" });
```

### 2. SQLite Usage
```typescript
const shogun = new ShogunCore({
  transport: {
    type: "sqlite",
    options: {
      database: "./app.db"
    }
  }
});

await shogun.initialize();

// Same API, different backend!
await shogun.db.signUp("username", "password");
await shogun.db.put("data/path", { message: "Hello!" });
```

### 3. Backward Compatibility
```typescript
// Your existing code still works
const shogun = new ShogunCore({
  gunOptions: {
    peers: ["https://gun-server.herokuapp.com/gun"]
  }
});
```

## 🔧 Available Transport Types

| Transport | Type | Description |
|-----------|------|-------------|
| GunDB | `"gun"` | Decentralized P2P database |
| SQLite | `"sqlite"` | Local SQL database |
| PostgreSQL | `"postgresql"` | SQL database server |
| MongoDB | `"mongodb"` | NoSQL document database |
| Custom | `"custom"` | Your own implementation |

## 📚 Key Benefits

### ✅ **Same API, Different Backends**
```typescript
// This code works with ANY transport layer
await shogun.db.signUp("user", "pass");
await shogun.db.put("path", data);
const result = await shogun.db.getData("path");
```

### ✅ **Easy Migration**
```typescript
// Migrate from GunDB to SQLite by changing one line
const shogun = new ShogunCore({
  transport: { type: "sqlite", options: { database: "./app.db" } }
  // instead of: gunOptions: { peers: [...] }
});
```

### ✅ **Transport-Specific Features**
```typescript
// Access transport-specific features when needed
if (shogun.transport.name === 'sqlite' && shogun.transport.query) {
  const results = await shogun.transport.query("SELECT * FROM users");
}
```

### ✅ **Backward Compatibility**
```typescript
// Existing code continues to work
const shogun = new ShogunCore({
  gunOptions: { peers: [...] } // Still supported!
});
```

## 🎯 Use Cases

### **Development & Testing**
- Use SQLite for local development
- Switch to GunDB for production
- Same codebase, different environments

### **Migration Projects**
- Gradually migrate from GunDB to SQLite
- Keep both systems running during transition
- Zero-downtime migrations

### **Multi-Environment Apps**
- SQLite for offline mode
- GunDB for online sync
- PostgreSQL for analytics

### **Custom Requirements**
- Implement your own transport layer
- Integrate with existing databases
- Add custom features and optimizations

## 🏃‍♂️ Running Examples

### Run All Examples
```bash
# Simple examples (recommended for beginners)
npx ts-node src/examples/simple-transport-examples.ts

# Comprehensive examples
npx ts-node src/examples/transport-layer-examples.ts

# Migration examples
npx ts-node src/examples/migration-examples.ts
```

### Run Individual Examples
```typescript
import { simpleGunExample, simpleSqliteExample } from "./simple-transport-examples";

// Run specific examples
await simpleGunExample();
await simpleSqliteExample();
```

## 🔍 What Each Example Demonstrates

### Simple Examples
- ✅ Basic transport layer usage
- ✅ User authentication and data storage
- ✅ Backward compatibility
- ✅ Easy transport switching

### Comprehensive Examples
- ✅ All transport types
- ✅ Custom transport implementation
- ✅ Transport factory usage
- ✅ Advanced features and comparisons

### Migration Examples
- ✅ Real-world migration scenarios
- ✅ Transport-agnostic application design
- ✅ Data migration scripts
- ✅ Best practices for multi-transport apps

## 🎉 Next Steps

1. **Start with simple examples** to understand the basics
2. **Try different transports** to see the flexibility
3. **Build a transport-agnostic app** using the patterns shown
4. **Implement custom transport** if you have specific needs
5. **Migrate existing apps** using the migration examples

The transport layer architecture makes ShogunCore incredibly flexible while maintaining the familiar API you already know!
