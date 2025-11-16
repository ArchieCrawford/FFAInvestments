# HTTPS Development Setup for Charles Schwab Integration

## Overview
Charles Schwab API requires HTTPS for OAuth callbacks in production. For development, you need to set up HTTPS locally to properly test the integration.

## Quick HTTPS Setup for Development

### Option 1: Using mkcert (Recommended)

1. **Install mkcert** (creates locally-trusted development certificates):
   ```bash
   # Windows (using Chocolatey)
   choco install mkcert

   # Or download from: https://github.com/FiloSottile/mkcert/releases
   ```

2. **Create and install local CA**:
   ```bash
   mkcert -install
   ```

3. **Generate certificate for localhost**:
   ```bash
   mkcert localhost 127.0.0.1 ::1
   ```
   This creates `localhost+2.pem` and `localhost+2-key.pem`

4. **Configure Vite for HTTPS** - Update `vite.config.js`:
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import fs from 'fs'
   import path from 'path'

   export default defineConfig({
     plugins: [react()],
     server: {
       https: {
         key: fs.readFileSync(path.resolve(__dirname, 'localhost+2-key.pem')),
         cert: fs.readFileSync(path.resolve(__dirname, 'localhost+2.pem')),
       },
       host: true, // Allow external connections
       port: 3000
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   })
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```
   Your app will now run at `https://localhost:3000`

### Option 2: Using OpenSSL (Manual)

1. **Generate self-signed certificate**:
   ```bash
   # Create private key
   openssl genrsa -out localhost-key.pem 2048

   # Create certificate
   openssl req -new -x509 -key localhost-key.pem -out localhost.pem -days 365 -subj "/CN=localhost"
   ```

2. **Update vite.config.js** (same as above but with different file names)

3. **Accept certificate in browser** when prompted

## Environment Configuration

Update your `.env` file for HTTPS:
```bash
# Change from http to https
REACT_APP_SCHWAB_REDIRECT_URI=https://localhost:3000/admin/schwab/callback
VITE_APP_URL=https://localhost:3000
```

## Schwab Developer Portal Setup

1. **Log into Schwab Developer Portal**: https://developer.schwab.com
2. **Update your app configuration**:
   - Redirect URI: `https://localhost:3000/admin/schwab/callback`
   - For production: `https://www.ffainvestments.com/admin/schwab/callback`

## Testing the Setup

1. **Start the HTTPS dev server**: `npm run dev`
2. **Visit**: `https://localhost:3000`
3. **Accept any certificate warnings** (for self-signed certs)
4. **Test Schwab OAuth flow**: 
   - Go to Charles Schwab → Connection & Overview
   - Click "Connect to Charles Schwab"
   - Should redirect to Schwab login without HTTPS errors

## Production Considerations

### For www.ffainvestments.com deployment:

1. **Use proper SSL certificate** (Let's Encrypt, Cloudflare, etc.)
2. **Update environment variables**:
   ```bash
   REACT_APP_SCHWAB_REDIRECT_URI=https://www.ffainvestments.com/admin/schwab/callback
   VITE_APP_URL=https://www.ffainvestments.com
   ```
3. **Configure web server** (Nginx, Apache) for HTTPS
4. **Update Schwab app settings** with production URLs

### Schwab Production URLs (from Flask app):
- Primary: `https://www.ffainvestments.com/callback`
- Alternative: `https://schwabapp.onrender.com/callback`

## Troubleshooting

### Common Issues:

1. **Certificate not trusted**: 
   - Run `mkcert -install` to install local CA
   - Restart browser

2. **Port already in use**:
   - Change port in `vite.config.js`: `port: 3001`
   - Update redirect URI accordingly

3. **Schwab OAuth redirect fails**:
   - Ensure redirect URI exactly matches Schwab app config
   - Check for trailing slashes and case sensitivity

4. **Mixed content warnings**:
   - Ensure all API calls use HTTPS
   - Check that no resources load over HTTP

### Browser Certificate Acceptance:

For **Chrome/Edge**: Click "Advanced" → "Proceed to localhost (unsafe)"
For **Firefox**: Click "Advanced" → "Accept the Risk and Continue"

## Security Notes

- **Development certificates** should never be used in production
- **Self-signed certificates** will show browser warnings - this is normal for development
- **mkcert certificates** are trusted locally but not by external browsers
- **Production deployment** requires proper CA-issued certificates

## Next Steps

1. Set up HTTPS development environment
2. Test OAuth flow with `https://localhost:3000`
3. Verify token refresh mechanism works
4. Test Excel export functionality
5. Deploy to production with proper SSL certificate