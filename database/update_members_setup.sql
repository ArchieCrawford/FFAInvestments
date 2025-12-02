-- MEMBER MANAGEMENT SYSTEM SETUP (Updated for existing table)

-- First, let's add missing columns to existing members table if they don't exist
DO $$ 
BEGIN
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'full_name') THEN
    ALTER TABLE members ADD COLUMN full_name text;
  END IF;
  
  -- Add first_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'first_name') THEN
    ALTER TABLE members ADD COLUMN first_name text;
  END IF;
  
  -- Add last_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'last_name') THEN
    ALTER TABLE members ADD COLUMN last_name text;
  END IF;
  
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'phone') THEN
    ALTER TABLE members ADD COLUMN phone text;
  END IF;
  
  -- Add join_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'join_date') THEN
    ALTER TABLE members ADD COLUMN join_date date DEFAULT CURRENT_DATE;
  END IF;
  
  -- Add membership_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'membership_status') THEN
    ALTER TABLE members ADD COLUMN membership_status text DEFAULT 'active';
    ALTER TABLE members ADD CONSTRAINT members_membership_status_check CHECK (membership_status IN ('active', 'inactive', 'pending'));
  END IF;
  
  -- Add dues_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'dues_status') THEN
    ALTER TABLE members ADD COLUMN dues_status text DEFAULT 'pending';
    ALTER TABLE members ADD CONSTRAINT members_dues_status_check CHECK (dues_status IN ('current', 'overdue', 'pending'));
  END IF;
  
  -- Add last_payment_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'last_payment_date') THEN
    ALTER TABLE members ADD COLUMN last_payment_date date;
  END IF;
  
  -- Add notes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'notes') THEN
    ALTER TABLE members ADD COLUMN notes text;
  END IF;
  
  -- Add profile_user_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'profile_user_id') THEN
    ALTER TABLE members ADD COLUMN profile_user_id uuid REFERENCES auth.users(id);
  END IF;
  
  -- Add auth_user_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'auth_user_id') THEN
    ALTER TABLE members ADD COLUMN auth_user_id uuid REFERENCES auth.users(id);
  END IF;
  
  -- Add claimed_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'claimed_at') THEN
    ALTER TABLE members ADD COLUMN claimed_at timestamptz;
  END IF;
  
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'created_at') THEN
    ALTER TABLE members ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'updated_at') THEN
    ALTER TABLE members ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Insert your 22 club members (will only add if email doesn't already exist)
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

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'members' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE members ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Members can read all member info" ON members;
DROP POLICY IF EXISTS "Admins can manage members" ON members;

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

-- Create or replace view to show member account connections
CREATE OR REPLACE VIEW member_accounts AS
SELECT 
  m.*,
  p.id as user_id,
  p.role as user_role,
  au.email as user_email,
  CASE 
    WHEN au.id IS NOT NULL THEN 'registered'
    ELSE 'not_registered'
  END as account_status
FROM members m
LEFT JOIN auth.users au ON m.email = au.email
LEFT JOIN profiles p ON au.id = p.id;

-- Create or replace auto-link function when users sign up
CREATE OR REPLACE FUNCTION link_member_to_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE members 
  SET profile_user_id = COALESCE(profile_user_id, NEW.id),
      auth_user_id = COALESCE(auth_user_id, NEW.id),
      claimed_at = COALESCE(claimed_at, now()),
      updated_at = now()
  WHERE email = NEW.email
    AND (profile_user_id IS NULL OR auth_user_id IS NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_link_member_to_user ON auth.users;
CREATE TRIGGER trigger_link_member_to_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_member_to_user();