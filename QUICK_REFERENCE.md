# FFA Investments - Technical Summary

## Quick Overview
React-based financial management application with complete Charles Schwab API integration, role-based authentication, and comprehensive admin tools.

## Key Credentials & Access
- **Admin Login**: archie.crawford1@gmail.com / archie123
- **Member Login**: member@example.com / member123
- **Dev Server**: https://localhost:3003 (HTTPS required for Schwab OAuth)

## Essential Files & Commands

### Start Application
```bash
npm install
npm run dev
```

### Admin Tools
```bash
node check-profiles.js          # Check user roles
node create-admin-users.js      # Create admin users  
node reset-admin-passwords.js   # Reset passwords
```

### Environment Requirements (.env)
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SCHWAB_CLIENT_ID=your-schwab-client-id
VITE_SCHWAB_CLIENT_SECRET=your-schwab-client-secret
VITE_SCHWAB_REDIRECT_URI=https://localhost:3003/admin/schwab
```

## Core Architecture

### Technology Stack
- **Frontend**: React 18.2.0 + Vite + React Router
- **Backend**: Supabase (Database + Auth)
- **APIs**: Charles Schwab OAuth 2.0 integration
- **Security**: HTTPS with OpenSSL certificates

### Key Services
- `src/services/schwabApi.js` - Charles Schwab API integration
- `src/Layout.jsx` - Navigation and role-based access
- `src/Pages/AdminSchwab.jsx` - Schwab admin interface

### Database Schema (Supabase)
- `auth.users` - Authentication
- `public.profiles` - User profiles with roles
- `public.accounts` - Financial accounts
- `public.ledger_entries` - Transaction records
- `public.schwab_tokens` - OAuth token storage

## Charles Schwab Integration

### OAuth Flow
1. Admin clicks "Connect to Schwab" in `/admin/schwab`
2. Redirects to Schwab OAuth (state validation included)
3. Callback handles token exchange and storage
4. Automatic token refresh mechanism

### API Capabilities
- Account information and positions
- Transaction history
- Market quotes and fundamentals  
- Performance insights and analytics

## Role System
- **Admin**: Full access to all pages and Charles Schwab integration
- **Member**: Limited to dashboard and contribution pages

## Navigation Structure
```
Admin Users:
├── Dashboard
├── Members  
├── User Management
├── Manage Accounts
├── Accounts
├── Ledger
├── Unit Price
├── Portfolio Builder
├── Education
├── Import Data
├── FFA Import
└── Charles Schwab
    ├── Connect Account
    ├── Account Insights  
    └── Raw Data

Member Users:
├── Dashboard
└── Contribute
```

## Critical File Locations

### Configuration
- `package.json` - Dependencies and scripts
- `vite.config.js` - HTTPS configuration
- `.env` - Environment variables
- `localhost.pem` + `localhost-key.pem` - HTTPS certificates

### Core Application
- `src/main.jsx` - Application entry point
- `src/App.jsx` - Main app component
- `src/Layout.jsx` - Navigation and layout
- `src/contexts/` - React context providers

### Charles Schwab Integration
- `src/services/schwabApi.js` - Main API service
- `src/Pages/AdminSchwab.jsx` - Admin interface
- Database: `schwab_tokens` table for OAuth storage

### Entity Management
- `src/Entities/` - Data models for accounts, users, education, etc.
- `src/Pages/` - Admin pages for each entity type

## Common Issues & Quick Fixes

### White Screen
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Schwab OAuth Issues  
```bash
# Regenerate HTTPS certificates
openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Admin Access Issues
```bash
# Check user roles
node check-profiles.js
# Hard refresh browser (Ctrl+F5)
# Log out and log back in
```

### Database Connection Issues
```bash
# Test connection
node test-supabase.js
# Verify .env variables
```

## Deployment Checklist

### Development
- [x] HTTPS certificates generated
- [x] Environment variables configured  
- [x] Admin users created
- [x] Schwab OAuth configured

### Production
- [ ] Update environment variables for production URLs
- [ ] Configure production SSL certificates
- [ ] Update Schwab app redirect URI
- [ ] Set up monitoring and logging

## Quick Reference Commands

```bash
# Development
npm run dev                     # Start dev server
npm run build                   # Build for production
npm run lint                    # Code linting

# Database Management
node create-admin-users.js      # Create admin users
node check-profiles.js          # Verify user roles
node reset-admin-passwords.js   # Reset all admin passwords
node test-supabase.js          # Test database connection

# SSL Certificate Generation
openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Latest Updates (Nov 16, 2025)
- ✅ Fixed admin navigation role detection
- ✅ Enhanced Charles Schwab OAuth with token refresh
- ✅ Implemented HTTPS development environment
- ✅ Resolved import/export errors in API services
- ✅ Updated Layout component authentication context
- ✅ Added Beardstown Ladies educational guide with interactive checklist
- ✅ Implemented comprehensive dues tracker for admin users
- ✅ Enhanced navigation with dropdown menus for education and admin features

## Contact & Support
- Full documentation: `PROJECT_RUNBOOK.md`
- Setup guides: `SETUP_INSTRUCTIONS.md`, `SUPABASE_SETUP.md`, `SCHWAB_INTEGRATION.md`
- Utility scripts available in root directory