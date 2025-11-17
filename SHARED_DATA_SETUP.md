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
```sql
-- Create members table for tracking club membership
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  first_name text,
  last_name text,
  phone text,
  join_date date DEFAULT CURRENT_DATE,
  membership_status text DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'pending')),
  dues_status text DEFAULT 'pending' CHECK (dues_status IN ('current', 'overdue', 'pending')),
  last_payment_date date,
  notes text,
  profile_user_id uuid REFERENCES auth.users(id), -- Links to actual user account if they've signed up
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert your member data
INSERT INTO members (email, full_name, first_name, last_name, membership_status) VALUES
  ('pkirby@kirbycpa.com', 'Phillip Kirby', 'Phillip', 'Kirby', 'active'),
  ('lequan.hylton@gmail.com', 'LeQuan Hylton', 'LeQuan', 'Hylton', 'active'),
  ('james.erodgers@yahoo.com', 'James Rodgers', 'James', 'Rodgers', 'active'),
  ('rgwalt6145@aol.com', 'rgwalt6145', NULL, NULL, 'active'),
  ('faburrell1@verizon.net', 'Felecia Burrell', 'Felecia', 'Burrell', 'active'),
  ('beulenner@aol.com', 'beulenner', NULL, NULL, 'active'),
  ('foursharpes@yahoo.com', 'FAMILY SHARPE', 'FAMILY', 'SHARPE', 'active'),
  ('2000nupsi07@gmail.com', 'Dante Jackson', 'Dante', 'Jackson', 'active'),
  ('mnichols818@hotmail.com', 'Milton Nichols', 'Milton', 'Nichols', 'active'),
  ('jessewalker318@gmail.com', 'jessewalker318', NULL, NULL, 'active'),
  ('luther.robinson1@gmail.com', 'Luther Robinson', 'Luther', 'Robinson', 'active'),
  ('davybeave@aol.com', 'davybeave', NULL, NULL, 'active'),
  ('clifftaylor20@gmail.com', 'clifftaylor20', NULL, NULL, 'active'),
  ('kristenkirby22@gmail.com', 'Kristen Greene', 'Kristen', 'Greene', 'active'),
  ('kadih1@msn.com', 'Kofi Adih', 'Kofi', 'Adih', 'active'),
  ('shedrickmccall@gmail.com', 'Shedrick McCall', 'Shedrick', 'McCall', 'active'),
  ('abck115@aol.com', 'abck115', NULL, NULL, 'active'),
  ('joeljean86@hotmail.com', 'Joel Jean', 'Joel', 'Jean', 'active'),
  ('miltonmnichols2@gmail.com', 'Milton Nichols', 'Milton', 'Nichols', 'active'),
  ('donotreply.resumebuilder@asamra.hoffman.army.mil', 'Asamra Hoffman Army Donotreply.resumebuilder', 'Asamra', 'Hoffman', 'active'),
  ('archie.crawford1@gmail.com', 'archie.crawford1', NULL, NULL, 'active'),
  ('chillman38@aol.com', 'chillman38', NULL, NULL, 'active')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create policies for member access
CREATE POLICY "Members can read all member info" ON members
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage members" ON members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create a view to match members with user accounts
CREATE OR REPLACE VIEW member_accounts AS
SELECT 
  m.*,
  p.id as user_id,
  p.role as user_role,
  CASE 
    WHEN p.id IS NOT NULL THEN 'registered'
    ELSE 'not_registered'
  END as account_status
FROM members m
LEFT JOIN profiles p ON m.email = p.email;

-- Create function to update member profile when user signs up
CREATE OR REPLACE FUNCTION link_member_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user signs up, try to link them to existing member record
  UPDATE members 
  SET profile_user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND profile_user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically link members when users sign up
DROP TRIGGER IF EXISTS trigger_link_member_to_user ON profiles;
CREATE TRIGGER trigger_link_member_to_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_member_to_user();
```

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