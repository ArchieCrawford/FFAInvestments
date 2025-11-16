import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// HTTPS configuration for Schwab API development
// Schwab requires HTTPS for OAuth callbacks
function getHttpsConfig() {
  try {
    // Try to find mkcert certificates first
    const mkcertKey = path.resolve(__dirname, 'localhost+2-key.pem')
    const mkcertCert = path.resolve(__dirname, 'localhost+2.pem')
    
    if (fs.existsSync(mkcertKey) && fs.existsSync(mkcertCert)) {
      console.log('🔒 Using mkcert HTTPS certificates')
      return {
        key: fs.readFileSync(mkcertKey),
        cert: fs.readFileSync(mkcertCert),
      }
    }
    
    // Try manual OpenSSL certificates
    const opensslKey = path.resolve(__dirname, 'localhost-key.pem')
    const opensslCert = path.resolve(__dirname, 'localhost.pem')
    
    if (fs.existsSync(opensslKey) && fs.existsSync(opensslCert)) {
      console.log('🔒 Using OpenSSL HTTPS certificates')
      return {
        key: fs.readFileSync(opensslKey),
        cert: fs.readFileSync(opensslCert),
      }
    }
    
    console.log('⚠️  No HTTPS certificates found. Run setup from HTTPS_SETUP.md')
    console.log('⚠️  Schwab OAuth will not work without HTTPS in development')
    return false
    
  } catch (error) {
    console.log('⚠️  Error loading HTTPS certificates:', error.message)
    return false
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    },
    // Exclude the charles_schwab_display folder from optimization
    exclude: ['charles_schwab_display']
  },
  server: {
    port: 3000,
    host: true,
    // Enable HTTPS if certificates are available
    https: getHttpsConfig(),
    // Open browser automatically (useful for HTTPS certificate acceptance)
    open: true
  },
  // Exclude charles_schwab_display folder from build
  build: {
    target: 'es2022', // Support top-level await
    rollupOptions: {
      external: (id) => {
        return id.includes('charles_schwab_display')
      }
    }
  }
})