# FFA Investments - Supabase Setup Guide

This guide will help you set up Supabase authentication and database integration for your FFA Investment Club application.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose organization, enter project name (e.g., "FFA Investments")
4. Choose region and database password
5. Wait for project to be created

### 2. Configure Authentication

1. In your Supabase dashboard, go to **Authentication → Providers**
2. Enable **Email** authentication
3. Configure email templates if desired
4. Go to **Authentication → URL Configuration**
5. Set **Site URL**: `http://localhost:3000`
6. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000` (for development)

### 3. Get API Keys

1. Go to **Settings → API**
2. Copy your keys:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 4. Update Environment Variables

Update your `.env` file with your actual Supabase credentials:

```env
# Replace with your actual Supabase values
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
VITE_APP_URL=http://localhost:3000
```

### 5. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` and run it
3. This will create all necessary tables, policies, and functions

### 6. Import Your FFA Data

Run the data import script to populate your database with existing FFA timeline data:

```bash
node import-data.js
```

This will:
- Parse your `ffa_timeline.csv` file
- Import all member timeline data
- Create member accounts
- Set up initial unit prices

## 🔧 Application Integration

### Authentication Flow

The app now uses Supabase authentication:

1. **Login**: `/login` - Uses the new `SupabaseLogin` component
2. **Protected Routes**: All routes now use Supabase authentication
3. **Role-based Access**: Admin vs Member roles from Supabase profiles

### Data Sources

The application now supports dual data sources:

1. **Supabase** (primary): For permanent data storage
2. **Base44** (fallback): For existing functionality during transition

### Key Components

- **`src/lib/supabase.js`**: Supabase client configuration
- **`src/contexts/AuthContext.jsx`**: React authentication context
- **`src/components/SupabaseLogin.jsx`**: Modern login component
- **`src/components/ProtectedRoute.jsx`**: Route protection
- **`src/utils/dataSync.js`**: Data synchronization utilities

## 📊 Database Schema

### Core Tables

- **`profiles`**: User profiles linked to auth.users
- **`ffa_timeline`**: Historical member data from your CSV
- **`member_accounts`**: Current member account status
- **`transactions`**: All financial transactions
- **`unit_prices`**: Historical unit price data
- **`education_progress`**: Learning progress tracking

### Security

- **Row Level Security (RLS)**: Enabled on all tables
- **Admin Access**: Admin users can read/write all data
- **Member Access**: Members can only read their own data
- **Public Read**: Timeline and unit price data readable by all authenticated users

## 🎯 Default Admin Accounts

Two admin accounts are automatically configured:

1. **admin@ffa.com** (password: admin123)
2. **archie.crawford1@gmail.com** (password: archie123)

These accounts have full admin privileges and can access all administrative functions.

## 🔄 Data Synchronization

The `dataSyncUtils` provides methods to:

- Sync member data between base44 and Supabase
- Import CSV timeline data
- Manage transactions and unit prices
- Recalculate member account values

## 📱 Usage

### For Development

1. Start your app: `npm run dev`
2. Navigate to `http://localhost:3000`
3. You'll be redirected to the new Supabase login page
4. Use admin credentials or create a new account

### For Production

1. Update `.env` with production Supabase URLs
2. Configure production email settings in Supabase
3. Set up proper domain redirects
4. Deploy with your preferred hosting service

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit real API keys to version control
2. **Service Role Key**: Only use on server-side, never in browser
3. **RLS Policies**: Review and test all Row Level Security policies
4. **Email Verification**: Enable email confirmation for production
5. **MFA**: Consider enabling multi-factor authentication for admin accounts

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**: Check API keys and URL configuration
2. **Database Errors**: Ensure schema is properly applied
3. **Import Failures**: Verify CSV format and data types
4. **Permission Denied**: Check RLS policies and user roles

### Debug Mode

Set `localStorage.debug = 'supabase:*'` in browser console for detailed Supabase logs.

## 📧 Email Configuration

### Development
- Emails are sent to Supabase's test inbox
- Check Supabase dashboard for magic links and confirmations

### Production
- Configure SMTP settings in Supabase
- Set up custom email templates
- Configure proper domain authentication

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Auth Guide](https://supabase.com/docs/guides/auth/auth-react)

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Review Supabase dashboard logs
3. Verify environment variables are correct
4. Ensure database schema is properly applied

Your FFA Investment Club application is now ready with Supabase backend integration!