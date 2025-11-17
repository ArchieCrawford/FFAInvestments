-- UNIFIED MEMBER DATA SYSTEM SETUP
-- This creates a complete member profile with all investment data merged together

-- 1. First, update the members table to integrate with existing data
DO $$ 
BEGIN
  -- Add missing columns to existing members table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'full_name') THEN
    ALTER TABLE members ADD COLUMN full_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'first_name') THEN
    ALTER TABLE members ADD COLUMN first_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'last_name') THEN
    ALTER TABLE members ADD COLUMN last_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'phone') THEN
    ALTER TABLE members ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'join_date') THEN
    ALTER TABLE members ADD COLUMN join_date date DEFAULT CURRENT_DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'membership_status') THEN
    ALTER TABLE members ADD COLUMN membership_status text DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'dues_status') THEN
    ALTER TABLE members ADD COLUMN dues_status text DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'last_payment_date') THEN
    ALTER TABLE members ADD COLUMN last_payment_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'notes') THEN
    ALTER TABLE members ADD COLUMN notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'profile_user_id') THEN
    ALTER TABLE members ADD COLUMN profile_user_id uuid REFERENCES auth.users(id);
  END IF;
  
  -- Link to member_accounts table for investment data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'member_account_id') THEN
    ALTER TABLE members ADD COLUMN member_account_id uuid REFERENCES member_accounts(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'created_at') THEN
    ALTER TABLE members ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'updated_at') THEN
    ALTER TABLE members ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
  
  -- Add unique constraint on email if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'members_email_unique' 
    AND table_name = 'members'
  ) THEN
    ALTER TABLE members ADD CONSTRAINT members_email_unique UNIQUE (email);
  END IF;
END $$;

-- 2. Insert your 22 club members (with safe duplicate handling)
DO $$
DECLARE
  member_record RECORD;
  member_data JSONB := '[
    {"email": "pkirby@kirbycpa.com", "full_name": "Phillip Kirby", "first_name": "Phillip", "last_name": "Kirby"},
    {"email": "lequan.hylton@gmail.com", "full_name": "LeQuan Hylton", "first_name": "LeQuan", "last_name": "Hylton"},
    {"email": "james.erodgers@yahoo.com", "full_name": "James Rodgers", "first_name": "James", "last_name": "Rodgers"},
    {"email": "rgwalt6145@aol.com", "full_name": "rgwalt6145", "first_name": null, "last_name": null},
    {"email": "faburrell1@verizon.net", "full_name": "Felecia Burrell", "first_name": "Felecia", "last_name": "Burrell"},
    {"email": "beulenner@aol.com", "full_name": "beulenner", "first_name": null, "last_name": null},
    {"email": "foursharpes@yahoo.com", "full_name": "FAMILY SHARPE", "first_name": "FAMILY", "last_name": "SHARPE"},
    {"email": "2000nupsi07@gmail.com", "full_name": "Dante Jackson", "first_name": "Dante", "last_name": "Jackson"},
    {"email": "mnichols818@hotmail.com", "full_name": "Milton Nichols", "first_name": "Milton", "last_name": "Nichols"},
    {"email": "jessewalker318@gmail.com", "full_name": "jessewalker318", "first_name": null, "last_name": null},
    {"email": "luther.robinson1@gmail.com", "full_name": "Luther Robinson", "first_name": "Luther", "last_name": "Robinson"},
    {"email": "davybeave@aol.com", "full_name": "davybeave", "first_name": null, "last_name": null},
    {"email": "clifftaylor20@gmail.com", "full_name": "clifftaylor20", "first_name": null, "last_name": null},
    {"email": "kristenkirby22@gmail.com", "full_name": "Kristen Greene", "first_name": "Kristen", "last_name": "Greene"},
    {"email": "kadih1@msn.com", "full_name": "Kofi Adih", "first_name": "Kofi", "last_name": "Adih"},
    {"email": "shedrickmccall@gmail.com", "full_name": "Shedrick McCall", "first_name": "Shedrick", "last_name": "McCall"},
    {"email": "abck115@aol.com", "full_name": "abck115", "first_name": null, "last_name": null},
    {"email": "joeljean86@hotmail.com", "full_name": "Joel Jean", "first_name": "Joel", "last_name": "Jean"},
    {"email": "miltonmnichols2@gmail.com", "full_name": "Milton Nichols", "first_name": "Milton", "last_name": "Nichols"},
    {"email": "donotreply.resumebuilder@asamra.hoffman.army.mil", "full_name": "Asamra Hoffman Army Donotreply.resumebuilder", "first_name": "Asamra", "last_name": "Hoffman"},
    {"email": "archie.crawford1@gmail.com", "full_name": "archie.crawford1", "first_name": null, "last_name": null},
    {"email": "chillman38@aol.com", "full_name": "chillman38", "first_name": null, "last_name": null}
  ]'::jsonb;
BEGIN
  FOR member_record IN SELECT * FROM jsonb_array_elements(member_data)
  LOOP
    INSERT INTO members (email, full_name, first_name, last_name, membership_status)
    VALUES (
      member_record->>'email',
      member_record->>'full_name',
      NULLIF(member_record->>'first_name', 'null'),
      NULLIF(member_record->>'last_name', 'null'),
      'active'
    )
    ON CONFLICT (email) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, members.full_name),
      first_name = COALESCE(EXCLUDED.first_name, members.first_name),
      last_name = COALESCE(EXCLUDED.last_name, members.last_name),
      membership_status = COALESCE(EXCLUDED.membership_status, members.membership_status),
      updated_at = now();
  END LOOP;
END $$;

-- 3. Create comprehensive view that merges ALL member data together
CREATE OR REPLACE VIEW complete_member_profiles AS
SELECT 
  -- Basic Member Info
  m.id as member_id,
  m.email,
  m.full_name,
  m.first_name,
  m.last_name,
  m.phone,
  m.join_date,
  m.membership_status,
  m.dues_status,
  m.last_payment_date,
  m.notes,
  
  -- User Account Info
  au.id as user_id,
  p.display_name,
  p.role as user_role,
  p.avatar_url,
  CASE 
    WHEN au.id IS NOT NULL THEN 'registered'
    ELSE 'not_registered'
  END as account_status,
  
  -- Investment Account Data
  ma.id as member_account_id,
  ma.current_units,
  ma.total_contributions,
  ma.current_value,
  ma.ownership_percentage,
  ma.is_active as account_active,
  
  -- Latest Portfolio Data from FFA Timeline
  latest_timeline.portfolio_value as latest_portfolio_value,
  latest_timeline.total_units as timeline_units,
  latest_timeline.portfolio_growth,
  latest_timeline.portfolio_growth_amount,
  latest_timeline.report_date as last_report_date,
  
  -- Current Unit Price
  up.unit_price as current_unit_price,
  up.price_date as unit_price_date,
  
  -- Calculated Current Values
  CASE 
    WHEN ma.current_units IS NOT NULL AND up.unit_price IS NOT NULL 
    THEN ma.current_units * up.unit_price
    ELSE ma.current_value
  END as calculated_current_value,
  
  -- Total Return Information
  CASE 
    WHEN ma.total_contributions > 0 AND ma.current_value > 0
    THEN ((ma.current_value - ma.total_contributions) / ma.total_contributions) * 100
    ELSE 0
  END as return_percentage,
  
  CASE 
    WHEN ma.current_value IS NOT NULL AND ma.total_contributions IS NOT NULL
    THEN ma.current_value - ma.total_contributions
    ELSE 0
  END as total_gain_loss,
  
  -- Transaction Summary
  transaction_summary.total_transactions,
  transaction_summary.last_transaction_date,
  transaction_summary.last_transaction_type,
  
  -- Education Progress
  education_stats.completed_lessons,
  education_stats.total_time_spent,
  education_stats.average_score,
  
  -- Timestamps
  m.created_at as member_created_at,
  m.updated_at as member_updated_at

FROM members m

-- Join with user authentication data
LEFT JOIN auth.users au ON m.email = au.email
LEFT JOIN profiles p ON au.id = p.id

-- Join with investment account data
LEFT JOIN member_accounts ma ON (
  m.member_account_id = ma.id OR 
  ma.email = m.email OR 
  LOWER(ma.member_name) = LOWER(m.full_name)
)

-- Get latest timeline data for each member
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (ft.member_name) 
    ft.portfolio_value,
    ft.total_units,
    ft.portfolio_growth,
    ft.portfolio_growth_amount,
    ft.report_date
  FROM ffa_timeline ft
  WHERE LOWER(ft.member_name) = LOWER(COALESCE(m.full_name, m.email))
  ORDER BY ft.member_name, ft.report_date DESC
  LIMIT 1
) latest_timeline ON true

-- Get current unit price
LEFT JOIN LATERAL (
  SELECT unit_price, price_date
  FROM unit_prices
  ORDER BY price_date DESC
  LIMIT 1
) up ON true

-- Get transaction summary
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_transactions,
    MAX(transaction_date) as last_transaction_date,
    (SELECT transaction_type FROM transactions t2 
     WHERE t2.member_account_id = ma.id 
     ORDER BY transaction_date DESC, created_at DESC 
     LIMIT 1) as last_transaction_type
  FROM transactions t
  WHERE t.member_account_id = ma.id
) transaction_summary ON true

-- Get education progress
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_lessons,
    SUM(time_spent_minutes) as total_time_spent,
    AVG(score) FILTER (WHERE score IS NOT NULL) as average_score
  FROM education_progress ep
  WHERE ep.user_id = p.id
) education_stats ON true

ORDER BY m.full_name NULLS LAST, m.email;

-- 4. Enable Row Level Security
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

-- 5. Create security policies
DROP POLICY IF EXISTS "Members can read all member info" ON members;
DROP POLICY IF EXISTS "Admins can manage members" ON members;

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

-- 6. Function to link member data across tables
CREATE OR REPLACE FUNCTION link_member_data()
RETURNS void AS $$
BEGIN
  -- Link members to existing member_accounts by email
  UPDATE members 
  SET member_account_id = ma.id,
      updated_at = now()
  FROM member_accounts ma
  WHERE members.email = ma.email 
  AND members.member_account_id IS NULL;
  
  -- Link members to existing member_accounts by name
  UPDATE members 
  SET member_account_id = ma.id,
      updated_at = now()
  FROM member_accounts ma
  WHERE LOWER(members.full_name) = LOWER(ma.member_name)
  AND members.member_account_id IS NULL
  AND members.full_name IS NOT NULL;
  
  -- Link member_accounts to members by updating email
  UPDATE member_accounts
  SET email = m.email,
      updated_at = now()
  FROM members m
  WHERE LOWER(member_accounts.member_name) = LOWER(m.full_name)
  AND member_accounts.email IS NULL
  AND m.full_name IS NOT NULL;
  
END;
$$ LANGUAGE plpgsql;

-- 7. Auto-link function when users sign up
CREATE OR REPLACE FUNCTION link_member_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Update member record with user ID
  UPDATE members 
  SET profile_user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND profile_user_id IS NULL;
  
  -- Link member data if not already linked
  PERFORM link_member_data();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Set up triggers
DROP TRIGGER IF EXISTS trigger_link_member_to_user ON auth.users;
CREATE TRIGGER trigger_link_member_to_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_member_to_user();

-- 9. Run initial data linking
SELECT link_member_data();