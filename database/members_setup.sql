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
  auth_user_id uuid REFERENCES auth.users(id),
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert the member data you provided
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
  SET profile_user_id = COALESCE(profile_user_id, NEW.id),
      auth_user_id = COALESCE(auth_user_id, NEW.id),
      claimed_at = COALESCE(claimed_at, now()),
      updated_at = now()
  WHERE email = NEW.email
    AND (profile_user_id IS NULL OR auth_user_id IS NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically link members when users sign up
DROP TRIGGER IF EXISTS trigger_link_member_to_user ON profiles;
CREATE TRIGGER trigger_link_member_to_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_member_to_user();