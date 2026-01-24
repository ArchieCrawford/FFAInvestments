# FFA Investments Application - Complete Runbook & Documentation

**Date Created:** November 16, 2025  
**Version:** 1.0  
**Project Status:** Charles Schwab Integration Complete - Production Ready

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Directory Structure](#directory-structure)
4. [Environment Setup](#environment-setup)
5. [Database Schema](#database-schema)
6. [Charles Schwab Integration](#charles-schwab-integration)
7. [Authentication & Authorization](#authentication--authorization)
8. [Key Components & Services](#key-components--services)
9. [Deployment Instructions](#deployment-instructions)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Development Workflow](#development-workflow)

---

## Project Overview

FFA Investments is a comprehensive financial management application built with React that provides:

- **Member Dashboard**: Personal account overview, contributions, portfolio tracking
- **Admin Dashboard**: Complete system management and oversight
- **Charles Schwab Integration**: Full OAuth 2.0 integration with account insights and transaction data
- **User Management**: Role-based access control with admin/member permissions
- **Financial Data Management**: Account tracking, ledger entries, unit pricing, statements
- **Educational System**: Lesson management and progress tracking
- **Data Import/Export**: CSV/Excel file processing for financial data

### Key Features Implemented
- ✅ Complete Charles Schwab OAuth 2.0 integration with token refresh
- ✅ HTTPS development environment for Schwab API requirements
- ✅ Role-based navigation and access control
- ✅ Real-time financial dashboard with charts
- ✅ Comprehensive admin tools for data management
- ✅ Educational content management system
- ✅ Multi-format data import/export capabilities

---

## Architecture & Technology Stack

### Frontend
- **React 18.2.0**: Modern functional components with hooks
- **Vite 4.4.5**: Fast build tool and development server
- **React Router DOM 6.8.1**: Client-side routing
- **Lucide React**: Modern icon library
- **Recharts 3.3.0**: Data visualization and charting
- **Axios 1.13.2**: HTTP client for API calls

### Backend Services
- **Supabase**: Database, authentication, and real-time subscriptions
- **Charles Schwab API**: Financial data and account management
- **Custom API Layer**: Enhanced service abstractions

### Development Tools
- **ESLint**: Code quality and consistency
- **Vite Dev Server**: Hot module replacement
- **HTTPS Certificates**: OpenSSL-generated for local development

---

## Directory Structure

```
FFAinvestments/
├── README.md (this file)
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite configuration with HTTPS
├── index.html                      # Entry HTML file
├── .env                           # Environment variables
├── localhost.pem                  # HTTPS certificate
├── localhost-key.pem             # HTTPS private key
├── 
├── # Configuration & Setup Files
├── SETUP_INSTRUCTIONS.md         # Original setup guide
├── SUPABASE_SETUP.md             # Database setup instructions
├── SCHWAB_INTEGRATION.md         # Charles Schwab integration guide
├── HTTPS_SETUP.md                # HTTPS development setup
├── supabase-schema.sql           # Database schema definition
├── 
├── # Utility Scripts
├── check-profiles.js             # Profile verification script
├── create-admin-users.js         # Admin user creation
├── reset-admin-passwords.js      # Password reset utility
├── test-login.js                 # Authentication testing
├── test-supabase.js             # Database connection testing
├── import-data.js               # Data import utility
├── 
├── # Data Files
├── data/                        # Spreadsheets and data files
│   ├── ffa_timeline.csv         # Sample timeline data
│   ├── example.xlsx             # Example spreadsheet
│   └── member_dues_20251116_150358.xlsx  # Member dues data
├── directory-structure.txt       # Complete file listing
├── 
├── src/
│   ├── main.jsx                 # Application entry point
│   ├── App.jsx                  # Main app component
│   ├── Layout.jsx               # Navigation and layout
│   ├── index.css                # Global styles
│   ├── 
│   ├── components/              # Reusable UI components
│   ├── contexts/                # React context providers
│   ├── lib/                     # Utility libraries
│   ├── utils/                   # Helper functions
│   ├── api/                     # API layer
│   ├── 
│   ├── Entities/                # Data models and entity definitions
│   │   ├── account/
│   │   ├── AccountUser/
│   │   ├── Announcement/
│   │   ├── AuditLog/
│   │   ├── EducationLesson/
│   │   ├── EducationProgress/
│   │   ├── LedgerEntry/
│   │   ├── Statement/
│   │   └── UnitPrice/
│   ├── 
│   ├── Pages/                   # Main application pages
│   │   ├── AdminAccounts/       # Account management
│   │   ├── AdminDashboard/      # Admin overview
│   │   ├── AdminEducation/      # Education management
│   │   ├── AdminImport/         # Data import tools
│   │   ├── AdminLedger/         # Financial ledger
│   │   ├── AdminSchwab/         # Charles Schwab integration
│   │   ├── AdminUnitPrice/      # Unit price management
│   │   ├── AdminUsers/          # User management
│   │   ├── MemberContribute/    # Member contributions
│   │   └── MemberDashboard/     # Member overview
│   └── 
│   └── services/                # Business logic and API services
│       ├── schwabApi.js         # Charles Schwab API integration
│       └── schwabApiEnhanced.js # Enhanced Schwab functionality
└── 
└── node_modules/                # Dependencies (managed by npm)
```

---

## Environment Setup

### Prerequisites
- Node.js 18+ and npm
- Git
- OpenSSL (for HTTPS certificates)
- Supabase account
- Charles Schwab Developer Account

### Quick Start Commands

```bash
# Clone and setup
git clone <repository-url>
cd FFAinvestments
npm install

# Generate HTTPS certificates (required for Schwab OAuth)
openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Create environment file
cp .env.example .env
# Edit .env with your Supabase and Schwab credentials

# Setup database
node create-admin-users.js
node test-supabase.js

# Start development server
npm run dev
```

### Environment Variables (.env)

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Charles Schwab API Configuration
VITE_SCHWAB_CLIENT_ID=your-schwab-client-id
SCHWAB_CLIENT_SECRET=your-schwab-client-secret
VITE_SCHWAB_REDIRECT_URI=https://localhost:3003/admin/schwab
VITE_SCHWAB_API_BASE=https://api.schwabapi.com

# Application Configuration
VITE_APP_URL=https://localhost:3003
```

---

## Database Schema

### Core Tables

```sql
-- Authentication and User Management
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Data
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT UNIQUE,
  account_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id),
  transaction_date DATE,
  description TEXT,
  amount DECIMAL(12,2),
  entry_type TEXT CHECK (entry_type IN ('debit', 'credit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.unit_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_date DATE,
  unit_price DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Charles Schwab Integration
CREATE TABLE public.schwab_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Educational System
CREATE TABLE public.education_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  lesson_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.education_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  lesson_id UUID REFERENCES education_lessons(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER
);
```

---

## Charles Schwab Integration

### OAuth 2.0 Flow Implementation

The Charles Schwab integration provides complete OAuth 2.0 authentication with token management:

**Key Features:**
- Secure OAuth 2.0 authorization flow
- Automatic token refresh mechanism
- State validation for security
- Rate limiting and error handling
- DNS fallback for API reliability

**Integration Points:**
- **Authorization**: `/admin/schwab` - OAuth connection interface
- **Callback Handling**: Automatic state validation and token exchange
- **API Wrapper**: `schwabApi.js` service for all Schwab API calls
- **Token Storage**: Encrypted storage in Supabase with automatic refresh

### Schwab API Capabilities

```javascript
// Account Information
const accounts = await schwabApi.getAccounts();
const positions = await schwabApi.getAccountPositions(accountId);
const transactions = await schwabApi.getTransactions(accountId, startDate, endDate);

// Market Data
const quotes = await schwabApi.getQuotes(['AAPL', 'GOOGL']);
const fundamentals = await schwabApi.getFundamentals('AAPL');

// Enhanced Features
const insights = await schwabApi.getAccountInsights(accountId);
const performance = await schwabApi.getPerformanceMetrics(accountId);
```

### Required Setup for Schwab Integration

1. **Developer Account**: Register at developer.schwab.com
2. **App Registration**: Create app with redirect URI `https://localhost:3003/admin/schwab`
3. **HTTPS Certificate**: Required for OAuth callbacks (automatically generated)
4. **Environment Configuration**: Set client ID and secret in .env file

---

## Authentication & Authorization

### Role-Based Access Control

The application implements a comprehensive role system:

```javascript
// Role Definition
const roles = {
  admin: {
    permissions: ['read', 'write', 'delete', 'manage_users', 'schwab_access'],
    pages: ['dashboard', 'users', 'accounts', 'ledger', 'schwab', 'education', 'import']
  },
  member: {
    permissions: ['read'],
    pages: ['dashboard', 'contribute']
  }
};

// Usage in Components
const { user, profile } = useAuth();
const isAdmin = profile?.role === 'admin';
```

### Authentication Flow

1. **Login**: Supabase authentication with email/password
2. **Profile Lookup**: Automatic profile creation/lookup on login
3. **Role Assignment**: Admin/member role determines navigation and access
4. **Session Management**: Persistent sessions with automatic refresh
5. **Protected Routes**: Role-based route protection

### Admin User Management

```javascript
// Create Admin Users
node create-admin-users.js

// Reset Passwords  
node reset-admin-passwords.js

// Verify Profiles
node check-profiles.js
```

---

## Key Components & Services

### Core Services

#### schwabApi.js
**Purpose**: Complete Charles Schwab API integration service  
**Features**:
- OAuth 2.0 token management with automatic refresh
- Rate limiting (120 requests per minute)
- DNS fallback for API reliability
- Error handling and retry logic
- Account insights and performance metrics

```javascript
// Key Methods
export const schwabApi = {
  // Authentication
  generateAuthUrl(state),
  exchangeCodeForToken(code, state),
  refreshToken(),
  
  // Account Data
  getAccounts(),
  getAccountPositions(accountId),
  getTransactions(accountId, startDate, endDate),
  
  // Market Data
  getQuotes(symbols),
  getFundamentals(symbol),
  
  // Enhanced Analytics
  getAccountInsights(accountId),
  getPerformanceMetrics(accountId)
};
```

### Page Components

#### AdminSchwab.jsx
**Purpose**: Main Charles Schwab integration interface for admin users  
**Features**:
- OAuth connection management
- Account overview and selection
- Navigation to insights and raw data views
- Token status monitoring

#### Layout.jsx
**Purpose**: Main navigation and layout wrapper  
**Features**:
- Role-based navigation menu rendering
- User profile display with admin badge
- Responsive sidebar and header
- Authentication state management

```javascript
// Navigation Structure
const navigation = {
  admin: [
    'Dashboard', 'Members', 'User Management', 'Manage Accounts',
    'Accounts', 'Ledger', 'Unit Price', 'Portfolio Builder',
    'Education', 'Import Data', 'FFA Import', 'Charles Schwab'
  ],
  member: [
    'Dashboard', 'Contribute'
  ]
};
```

### Entity System

Each entity (Account, User, Lesson, etc.) follows a consistent pattern:
- **Model**: Data structure definition
- **Service**: CRUD operations and business logic
- **Components**: UI components for display and interaction
- **Pages**: Full page interfaces for management

---

## Deployment Instructions

### Development Deployment

1. **Environment Setup**
```bash
npm install
openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

2. **Database Setup**
```bash
# Run schema setup in Supabase dashboard
# Execute supabase-schema.sql

# Create admin users
node create-admin-users.js
```

3. **Start Development Server**
```bash
npm run dev
# Accessible at https://localhost:3003
```

### Production Deployment

1. **Build Application**
```bash
npm run build
```

2. **Environment Variables**
- Update all VITE_ prefixed variables for production URLs
- Ensure Schwab redirect URI matches production domain
- Set up production SSL certificates

3. **Deploy Build**
- Upload `dist/` folder to your hosting provider
- Configure HTTPS (required for Schwab OAuth)
- Set up environment variables on server

### Hosting Recommendations
- **Vercel**: Automatic HTTPS, environment variable management
- **Netlify**: Easy deployment with form handling
- **AWS S3 + CloudFront**: Scalable with custom domain support

---

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. White Screen on Load
**Symptoms**: Blank page or "Loading..." that never completes  
**Causes**: Import/export errors, missing dependencies  
**Solutions**:
```bash
# Check browser console for errors
# Verify all imports are correctly structured
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Charles Schwab OAuth Fails
**Symptoms**: "Invalid redirect URI" or OAuth errors  
**Causes**: Incorrect HTTPS setup, mismatched redirect URIs  
**Solutions**:
```bash
# Ensure HTTPS certificates are valid
# Verify redirect URI in Schwab app matches .env
# Check that app is running on https://localhost:3003
```

#### 3. Admin Navigation Missing
**Symptoms**: Limited navigation menu for admin users  
**Causes**: Role detection issues, authentication context problems  
**Solutions**:
```bash
# Check user role in database
node check-profiles.js

# Verify AuthContext is properly imported
# Hard refresh browser (Ctrl+F5)
# Log out and log back in
```

#### 4. Database Connection Issues
**Symptoms**: Supabase errors, authentication failures  
**Causes**: Incorrect environment variables, network issues  
**Solutions**:
```bash
# Test database connection
node test-supabase.js

# Verify environment variables
# Check Supabase dashboard for service status
```

#### 5. HTTPS Certificate Issues
**Symptoms**: SSL warnings, OAuth redirect failures  
**Solutions**:
```bash
# Regenerate certificates
openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Accept browser security warning for localhost
# Ensure vite.config.js points to correct certificate files
```

### Development Tools

#### Profile Verification
```bash
node check-profiles.js
# Output: ✅ Profile exists: User Name (admin/member)
```

#### Admin User Creation
```bash
node create-admin-users.js
# Creates: archie.crawford1@gmail.com (admin)
#         member@example.com (member)
```

#### Password Reset
```bash
node reset-admin-passwords.js
# Resets passwords for all admin users
```

---

## Development Workflow

### Feature Development Process

1. **Branch Creation**
```bash
git checkout -b feature/new-feature-name
```

2. **Development**
- Make changes in appropriate directories
- Follow existing code patterns and structure
- Update relevant documentation

3. **Testing**
```bash
# Run linting
npm run lint

# Test authentication
node test-login.js

# Test database connectivity
node test-supabase.js

# Manual testing in browser
npm run dev
```

4. **Commit & Push**
```bash
git add .
git commit -m "feat: descriptive commit message"
git push origin feature/new-feature-name
```

### Code Standards

#### Component Structure
```javascript
// Import order: React, external libraries, internal components, services
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components';
import { schwabApi } from '../services/schwabApi';

// Consistent naming and structure
const ComponentName = () => {
  // State declarations
  const [loading, setLoading] = useState(false);
  
  // Hooks
  const navigate = useNavigate();
  
  // Effect hooks
  useEffect(() => {
    // Effect logic
  }, []);
  
  // Event handlers
  const handleClick = async () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="container">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

#### Service Structure
```javascript
// services/exampleApi.js
import { supabase } from '../lib/supabase';

// Named exports for individual functions
export const getExample = async (id) => {
  const { data, error } = await supabase
    .from('examples')
    .select('*')
    .eq('id', id);
  
  if (error) throw error;
  return data;
};

// Default export for main service object
const exampleApi = {
  getExample,
  createExample,
  updateExample,
  deleteExample
};

export default exampleApi;
```

### Performance Considerations

1. **Bundle Size**: Use dynamic imports for large components
2. **API Calls**: Implement proper loading states and error handling
3. **Caching**: Leverage React Query for data caching
4. **Images**: Optimize images and use appropriate formats

### Security Best Practices

1. **Environment Variables**: Never commit sensitive data
2. **Authentication**: Always verify user roles server-side
3. **API Keys**: Use environment variables for all API credentials
4. **HTTPS**: Required for production, especially with financial APIs

---

## Additional Resources

### Documentation Files
- `SETUP_INSTRUCTIONS.md` - Original setup guide
- `SUPABASE_SETUP.md` - Database configuration
- `SCHWAB_INTEGRATION.md` - Charles Schwab API details
- `HTTPS_SETUP.md` - SSL certificate setup

### Utility Scripts
- `check-profiles.js` - User profile verification
- `create-admin-users.js` - Admin user creation
- `reset-admin-passwords.js` - Password reset utility
- `test-login.js` - Authentication testing
- `import-data.js` - Data import utilities

### External Links
- [Supabase Documentation](https://supabase.com/docs)
- [Charles Schwab Developer Portal](https://developer.schwab.com)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

---

## Project Status & Next Steps

### Completed Features ✅
- Complete Charles Schwab OAuth 2.0 integration
- Role-based authentication and navigation
- HTTPS development environment
- Admin and member dashboards
- Financial data management
- Educational content system with interactive Beardstown Ladies guide
- Comprehensive dues tracking and management system
- Data import/export capabilities

### Production Readiness Checklist
- [x] Authentication system
- [x] Role-based access control  
- [x] Charles Schwab integration
- [x] HTTPS support
- [x] Error handling
- [x] Database schema
- [x] Admin tools
- [ ] Production deployment configuration
- [ ] Monitoring and logging
- [ ] Backup procedures

### Recommended Next Steps
1. Set up production environment with proper SSL
2. Implement comprehensive logging and monitoring
3. Add automated testing suite
4. Set up CI/CD pipeline
5. Implement data backup procedures
6. Add email notification system
7. Enhance mobile responsiveness

---

**Contact**: For questions about this implementation, refer to the development session logs or contact the development team.

**Last Updated**: November 16, 2025