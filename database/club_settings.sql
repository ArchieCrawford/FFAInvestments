-- Create shared club settings table for admin-member data synchronization
-- This enables admins to update content that members see in real-time

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