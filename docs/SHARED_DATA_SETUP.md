# Shared Data System Setup

## 🚀 What This Accomplishes

This system transforms the app from "each browser living in its own fantasy" to "everyone reading and writing the same book." Admins can now update content that members see **instantly across all devices**.

## 📊 Database Setup

**IMPORTANT:** Run this SQL in your Supabase SQL Editor first:

### 1. Club Settings Table (Admin-Member Sync)
```sql
-- Create shared club settings table for admin-member data synchronization
CREATE TABLE IF NOT EXISTS club_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name text NOT NULL DEFAULT 'FFA Investments',
  tagline text,
  homepage_message text,
  welcome_message text,
  dues_info text,
  contact_email text,
  meeting_schedule text,
  announcements text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings
INSERT INTO club_settings (
  club_name, 
  tagline, 
  homepage_message,
  welcome_message,
  dues_info,
  contact_email,
  meeting_schedule
)
VALUES (
  'FFA Investments',
  'Where futures begin and wealth grows',
  'Welcome to the FFA Investments member portal. Stay connected with club activities, track your investments, and grow your financial knowledge.',
  'Welcome back! Check your dashboard for the latest updates on your investment portfolio and club activities.',
  'Membership dues are $50 per semester. Payment options available through the portal.',
  'admin@ffainvestments.com',
  'Weekly meetings every Tuesday at 7:00 PM in Room 205'
)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE club_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin write access and member read access
CREATE POLICY "Members can read club settings" ON club_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage club settings" ON club_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

### 2. Members Management System
The canonical members schema (including `role`, `auth_user_id`, `claimed_at`, invite metadata, and deterministic RLS policies) now lives in `database/members_setup.sql`. That script seeds the roster and creates the `claim_member_for_current_user` RPC, which is the sole mechanism for linking Supabase users to pre-imported members. Run that file (plus the accompanying migration) instead of the older trigger-based flow described here.

## 🔄 How It Works

### Admin Side (`/admin/settings`):
1. **Read** current settings from `club_settings` table
2. **Edit** fields in a user-friendly form  
3. **Save** updates directly to Supabase
4. Changes are **instantly available** to all members

### Member Side (`/member/home`):
1. **Read** latest settings from `club_settings` table
2. **Display** admin-controlled content dynamically
3. **No caching** - always shows current data

## 🎯 Live URLs

- **Admin Settings:** https://ffa-investments-m0dypcie4-ajs-projects-e15d145a.vercel.app/admin/settings
- **Admin Members:** https://ffa-investments-m0dypcie4-ajs-projects-e15d145a.vercel.app/admin/members
- **Member Home:** https://ffa-investments-m0dypcie4-ajs-projects-e15d145a.vercel.app/member/home
- **Member Directory:** https://ffa-investments-m0dypcie4-ajs-projects-e15d145a.vercel.app/member/directory
- **Login:** https://ffa-investments-m0dypcie4-ajs-projects-e15d145a.vercel.app/login

## 🧪 Testing Flow

1. **Login as Admin** (admin@ffainvestments.com / demo123456)
2. **Navigate to** `/admin/settings`
3. **Edit content** (club name, announcements, etc.)
4. **Save changes**
5. **Open new browser/device** and login as member
6. **Navigate to** `/member/home`  
7. **Verify** the changes appear immediately

## 🔧 Technical Implementation

- **Database:** Single `club_settings` table with RLS policies
- **Admin Component:** `AdminSettings.jsx` - Full CRUD operations
- **Member Component:** `MemberHome.jsx` - Read-only display
- **Security:** Role-based access (admins write, members read)
- **Real-time:** Direct Supabase queries (no local storage)

## 🎨 Features

### Admin Settings Page:
- ✅ Dark theme matching app design
- ✅ Form validation and error handling
- ✅ Success feedback with auto-hide
- ✅ All club information fields
- ✅ Responsive design

### Member Home Page:
- ✅ Dynamic club branding
- ✅ Admin-controlled announcements  
- ✅ Contact and meeting info
- ✅ Quick action buttons
- ✅ Member status display

## 🚀 Extension Pattern

Use this same pattern for any admin-controlled content:

```javascript
// Create table
CREATE TABLE announcements (id, title, message, priority, created_at);

// Admin page writes to it
const saveAnnouncement = () => supabase.from('announcements').insert(data)

// Member page reads from it  
const getAnnouncements = () => supabase.from('announcements').select('*')
```

## 📈 Next Steps

This foundation enables:
- **Real-time announcements**
- **Dynamic dues management** 
- **Centralized contact info**
- **Meeting schedule updates**
- **Emergency notifications**
- **Portfolio settings**

**No more "device-specific" changes!** 🎉