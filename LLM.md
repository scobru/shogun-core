# Shogun Core - Documentation

This documentation has been consolidated into `API.md` to keep a single source of truth and avoid duplication.

## ⭐ **NEW in v2.0.1**

- **🔧 FIXED: Remove Operations**: Fixed critical bug in `remove()` and `removeUserData()` methods
- **🔧 IMPROVED: User Data Operations**: All user data methods now use direct Gun user node for better reliability
- **🔧 ENHANCED: Error Handling**: Added proper null checking and improved error logging

## ⭐ **NEW in v2.0.0**

- **Simple API Layer**: Easy-to-use wrapper for common operations with minimal complexity
- **User Space Management**: Complete CRUD operations for user-specific data storage
- **Quick Start Functions**: `quickStart()` and `QuickStart` class for rapid initialization
- **Improved Type System**: Reduced `any` usage with better TypeScript types
- **Configuration Presets**: Pre-built configurations for common use cases

## 🔧 **Recent Bug Fixes (v2.0.1)**

### Fixed Critical Remove Operations Bug

**Problem**: The `remove()` and `removeUserData()` methods were throwing `TypeError: Cannot read properties of null (reading 'err')` when GunDB operations returned `null`.

**Solution**: Added proper null checking before accessing the `err` property:
```typescript
// Before: ack.err (caused errors when ack was null)
// After: ack && ack.err (safe null checking)
```

**Impact**: 
- ✅ `remove()` method now works reliably
- ✅ `removeUserData()` method now works reliably  
- ✅ All user data operations use direct Gun user node for better reliability
- ✅ Improved error handling throughout

## Documentation

- See `API.md` (same directory) for the complete, up-to-date API reference
- See `README.md` for quick start guide and examples
- Recent improvements, frontend integration, security notes, and best practices are all included in `API.md`


