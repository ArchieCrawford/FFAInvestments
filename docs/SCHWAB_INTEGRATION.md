# Charles Schwab Integration Setup Guide

## Overview
The Charles Schwab integration has been successfully added to the FFA Investments React app. This integration provides admin users with OAuth-based access to Schwab trading and market data APIs.

## Features Added

### 1. Main Schwab Connection Page (`/admin/schwab`)
- OAuth authentication flow
- Clear connection status and reconnect button
- Navigation to Insights and Org Balance history
   - All data (accounts, positions, charts) now lives on Insights

### 2. Account Insights Dashboard (`/admin/schwab/insights`)
- Portfolio metrics and performance analytics
- Account balances and detailed position tables
- Excel export functionality (equivalent to original account_insights.html)
- Interactive charts and data visualization
- Maintenance actions (e.g., Enrich Security Names)

### 3. Raw API Data Viewer (`/admin/schwab/raw-data`)
- Debug interface for testing API endpoints
- Predefined common endpoints (accounts, positions, orders)
- Custom endpoint input for advanced testing
- API call history and response caching
- Download API responses as JSON files

### 4. OAuth Callback Handler (`/callback` and `/admin/schwab/callback`)
- Handles OAuth redirect flow
- Token exchange and storage
- Automatic redirect to main Schwab page after successful authentication

## Navigation Structure
The Charles Schwab features are accessible through a dropdown menu in the admin sidebar:
```
Charles Schwab
├── Integration (Connect/Login)
├── Insights (Data & Charts)
└── Raw Data Viewer
```

## Environment Setup Required

To use the Charles Schwab integration, you need to set up the following environment variables:

```bash
# Add to .env file
VITE_SCHWAB_CLIENT_ID=your_schwab_app_key
# client secret stays on the backend only
VITE_SCHWAB_REDIRECT_URI=http://localhost:3000/callback
VITE_SCHWAB_ALLOWED_REDIRECTS=http://localhost:3000/callback,https://www.ffainvestments.com/callback
```

## Schwab Developer Setup

1. **Register Your Application**
   - Go to [Schwab Developer Portal](https://developer.schwab.com)
   - Create a new app and get your App Key and Secret
   - Set redirect URI to match your app's callback URL (the production default is `https://www.ffainvestments.com/callback`)

2. **OAuth Flow**
   - Users click "Connect to Charles Schwab" 
   - Redirected to Schwab for authentication
   - After approval, redirected back with authorization code
   - App exchanges code for access tokens
   - Tokens stored locally for API calls

## Technical Architecture

### API Service Layer (`/src/services/schwabApi.js`)
- **SchwabApiService class** - Main API interface
- **OAuth management** - Token refresh, storage, expiration handling
- **Rate limiting** - Automatic request throttling (120 calls/minute)
- **Error handling** - Comprehensive error responses and retry logic
- **Endpoints covered**:
  - Account information and balances
  - Positions and holdings
  - Orders (historical and pending)
  - Market data and quotes
  - Watchlists and preferences

### Component Structure
```
src/
├── services/
│   └── schwabApi.js          # API service layer
└── Pages/
   ├── AdminSchwab.jsx       # Main connection page (auth only)
   ├── SchwabInsights.jsx    # Account insights dashboard (data)
    ├── SchwabRawData.jsx     # Raw data viewer
    └── SchwabCallback.jsx    # OAuth callback handler
```

### Dependencies Added
- **axios** - HTTP client for API calls
- **xlsx** - Excel file generation for exports
- **date-fns** - Date formatting and manipulation

## Security Features

- **Admin-only access** - All routes protected by existing ProtectedRoute system
- **Token security** - Tokens stored in localStorage with automatic refresh
- **API rate limiting** - Built-in throttling to prevent API abuse
- **Error boundaries** - Graceful error handling for API failures

## Usage Instructions

1. **Admin Login** - Only users with admin role can access Schwab features
2. **Connect Account** - Navigate to Charles Schwab → Connection & Overview
3. **Authenticate** - Click "Connect to Charles Schwab" and complete OAuth flow
4. **View Insights** - Access portfolio analytics and export data to Excel
5. **Debug APIs** - Use Raw Data Viewer to test endpoints and troubleshoot

## Next Steps

1. Set up Schwab Developer account and get API credentials
2. Add environment variables to your .env file
3. Test OAuth flow with actual Schwab credentials
4. Verify Excel export functionality works as expected
5. Train admin users on new Charles Schwab features

## Support

For issues with:
- **Schwab API setup** - Check Schwab Developer documentation
- **OAuth flow** - Verify redirect URI matches exactly
- **Excel exports** - Ensure xlsx package is properly installed
- **Navigation menu** - Check admin role permissions

The integration maintains full compatibility with the existing FFA Investments app architecture and follows the same patterns for routing, authentication, and component structure.