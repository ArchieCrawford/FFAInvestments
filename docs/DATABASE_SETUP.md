# Database Setup for Member Data Storage

This document explains how to set up permanent database storage for all member data including dues, unit values, personal data, portfolio data, and club values.

## Quick Setup

### Option 1: Use Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the "SQL Editor" tab
3. Copy and paste the contents of `src/database/memberDataSchema.sql`
4. Click "Run" to execute the SQL

### Option 2: Use the Import Function

1. Load the application with Excel data first
2. Click the "Import to Database" button in the Admin Dues page
3. This will automatically create members and dues data from your Excel file

## What Gets Created

### Tables Created:
- **members** - Basic member information (name, email, join date, status)
- **member_dues** - Payment status, amounts owed, contributions
- **member_unit_values** - Unit holdings and valuations by date
- **member_personal_data** - Extended member info (address, emergency contacts)
- **member_portfolio_data** - Individual stock holdings and performance
- **club_values** - Overall club performance metrics
- **payment_history** - Detailed payment tracking

### Security:
- Row Level Security (RLS) enabled on all tables
- Basic read policies for all users
- Admin policies for data management (adjust based on your auth system)

## Data Migration

### From Excel to Database:
```javascript
// Your Excel data will be automatically imported with this structure:
{
  "Member Name": "Smith, John",
  "Payment Status": "Current", // or "Credit Balance", "Owes Money"
  "Latest Amount Owed": 100.00,
  "Total Payments": 1200.00,
  "Total Contribution": 5000.00
}
```

### Database Benefits:
- ✅ Permanent storage (no more Excel dependency)
- ✅ Real-time updates across all admin users  
- ✅ Backup and recovery through Supabase
- ✅ API access for mobile apps or integrations
- ✅ Advanced querying and reporting capabilities
- ✅ Audit trails and change tracking

## Usage in Application

### Admin Dues Page:
- Toggle between "Database" and "Excel" data sources
- Import Excel data to database with one click
- View real-time member payment status
- Add payment history and update dues

### Future Enhancements:
- Member self-service portal to view their own data
- Automated email notifications for overdue payments
- Integration with accounting software
- Mobile app for payment tracking
- Advanced reporting and analytics

## Database Schema Details

### Core Relationships:
```
members (1) → (many) member_dues
members (1) → (many) member_unit_values  
members (1) → (one) member_personal_data
members (1) → (many) member_portfolio_data
members (1) → (many) payment_history

club_values (standalone) - tracks overall club metrics
```

### Key Indexes:
- Fast lookups by member_id
- Date-based queries optimized
- Payment status filtering
- Symbol-based portfolio queries

## Troubleshooting

### If tables don't exist:
1. Check that the SQL was executed successfully in Supabase
2. Verify you have the correct permissions in your Supabase project
3. Check the Supabase logs for any error messages

### If data isn't showing:
1. Verify the RLS policies allow your user to read data
2. Check that data was actually imported (use Supabase table view)
3. Ensure your environment variables are correct

### If imports fail:
1. Check that your Excel file has the expected column names
2. Verify Supabase connection is working
3. Check browser console for detailed error messages

## Environment Variables Required

Make sure these are set in your `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps

1. Run the SQL schema in Supabase dashboard
2. Import your Excel data using the "Import to Database" button
3. Switch to "Database" mode in the dues tracker
4. Start managing member data with persistent storage!

The application will automatically handle the transition from Excel-based data to database storage, giving you a modern, scalable foundation for your investment club management system.