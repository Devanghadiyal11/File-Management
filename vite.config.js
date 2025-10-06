import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Try to enable HTTPS in dev if certs are present at ./.cert/key.pem and ./.cert/cert.pem
function resolveHttps() {
  try {
    const certDir = path.resolve(__dirname, '.cert')
    const keyPath = path.join(certDir, 'key.pem')
    const certPath = path.join(certDir, 'cert.pem')
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      }
    }
  } catch (_) {}
  return false
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    https: resolveHttps(),
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Enable multicore processing
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      mangle: true,
    },
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@coreui/react', '@coreui/coreui', 'bootstrap'],
          'vendor-utils': ['lucide-react', 'framer-motion', 'react-dropzone'],
          'vendor-face': ['face-api.js'],
        },
      },
    },
    // Use all available CPU cores
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
  // Enable parallel processing for dev server
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // Worker configuration
  worker: {
    format: 'es',
    plugins: [react()],
  },
  define: {
    // Define the number of CPU cores available
    __CPU_CORES__: JSON.stringify(os.cpus().length),
  },
})
