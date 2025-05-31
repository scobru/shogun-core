import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  // Base configuration
  root: '.',
  base: '/',
  
  // Development server
  server: {
    port: 8080,
    host: true,
    open: true,
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  
  // Preview server (for built files)
  preview: {
    port: 8080,
    host: true,
    open: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: 'index.html',
        auth: 'auth-nodom.html',
        legacy: 'auth.html'
      },
      output: {
        manualChunks: {
          vendor: ['gun']
        }
      }
    }
  },
  
  // Plugins
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  
  // Optimizations
  optimizeDeps: {
    include: ['gun'],
    exclude: []
  },
  
  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  
  // Asset handling
  assetsInclude: ['**/*.md', '**/*.txt'],
  
  // Worker configuration
  worker: {
    format: 'es'
  }
}) 