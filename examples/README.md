# 🥷 Shogun Core Examples

Practical examples to test and demonstrate Shogun Core functionality with NoDom reactive library.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start on `http://localhost:8080` and automatically open in your browser.

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start Vite dev server with HMR
npm run start        # Alias for dev (port 8080)

# Build & Preview
npm run build        # Build for production
npm run preview      # Preview built files
npm run serve        # Serve built files on port 8080

# Quick Access
npm run auth         # Show auth interface URL
npm run legacy       # Show legacy interface URL
npm run help         # Show available scripts
```

## 🔗 Available Examples

### 🔐 Shogun Auth (Main Interface)
- **URL**: `/auth-nodom.html`
- **Features**: Complete authentication with reactive UI
- **Technologies**: Shogun Core + NoDom + WebAuthn + Wallets

### 🏛️ Shogun Auth Legacy
- **URL**: `/auth.html` 
- **Features**: Traditional authentication interface
- **Technologies**: Shogun Core (without NoDom)

## 🛠️ Development Features

### Vite Benefits
- ⚡ **Lightning Fast**: Instant server start and HMR
- 🔥 **Hot Module Replacement**: Real-time updates without page refresh
- 📦 **Optimized Builds**: Tree-shaking and code splitting
- 🔧 **Modern Tooling**: ES modules, TypeScript support
- 🌐 **CORS Handling**: Proper headers for WebAuthn and wallets

### Development Tools
- **Source Maps**: Full debugging support
- **Legacy Support**: Automatic polyfills for older browsers
- **Asset Optimization**: Automatic compression and optimization
- **Multi-page Support**: Optimized builds for all examples

## 🔧 Configuration

### Vite Configuration
The project includes a comprehensive `vite.config.js` with:
- Development server on port 8080
- CORS headers for WebAuthn
- Legacy browser support
- Optimized builds with code splitting
- Source map generation

### Environment Variables
```bash
NODE_ENV=development  # Development mode
NODE_ENV=production   # Production mode
```

## 📁 Project Structure

```
shogun-core/src/examples/
├── index.html              # Main examples page
├── auth-nodom.html         # Modern auth interface
├── auth.html              # Legacy auth interface
├── shogun-core.js         # Shogun Core library
├── nodom.js              # NoDom reactive library
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md             # This file
```

## 🌐 Browser Support

- **Modern Browsers**: Full ES2020+ support
- **Legacy Browsers**: Automatic polyfills via Vite Legacy plugin
- **WebAuthn**: Chrome 67+, Firefox 60+, Safari 14+
- **Crypto Wallets**: MetaMask, Nostr extensions

## 🔒 Security Features

### WebAuthn Support
- Biometric authentication (Touch ID, Face ID, fingerprint)
- Hardware security keys (YubiKey, etc.)
- Platform authenticators
- Cross-platform authenticators

### Wallet Integration
- **Ethereum**: MetaMask integration
- **Bitcoin**: Nostr protocol support
- **Secure**: Private key never exposed
- **Standards**: Following EIP and BIP standards

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 8080
npx kill-port 8080
npm run dev
```

**CORS errors:**
- Vite configuration includes proper CORS headers
- WebAuthn requires HTTPS in production

**WebAuthn not working:**
- Ensure HTTPS in production
- Check browser compatibility
- Verify domain configuration

### Debug Mode
```bash
# Enable debug logging
DEBUG=vite:* npm run dev
```

## 📚 Documentation

- [Shogun Core](https://github.com/scobru/shogun-core)
- [NoDom Library](./nodom.js)
- [Vite Documentation](https://vitejs.dev/)
- [WebAuthn Guide](https://webauthn.guide/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run dev`
5. Build with `npm run build`
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the Shogun community** 