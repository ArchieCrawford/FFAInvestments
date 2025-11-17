-- Fix to ensure all 22 members appear with emails in admin interface

-- 1. First, let's ensure all your 22 members are properly in the members table with emails
INSERT INTO members (email, member_name, full_name, first_name, last_name, membership_status) VALUES
  ('pkirby@kirbycpa.com', 'Phillip Kirby', 'Phillip Kirby', 'Phillip', 'Kirby', 'active'),
  ('lequan.hylton@gmail.com', 'LeQuan Hylton', 'LeQuan Hylton', 'LeQuan', 'Hylton', 'active'),
  ('james.erodgers@yahoo.com', 'James Rodgers', 'James Rodgers', 'James', 'Rodgers', 'active'),
  ('rgwalt6145@aol.com', 'rgwalt6145', 'rgwalt6145', NULL, NULL, 'active'),
  ('faburrell1@verizon.net', 'Felecia Burrell', 'Felecia Burrell', 'Felecia', 'Burrell', 'active'),
  ('beulenner@aol.com', 'beulenner', 'beulenner', NULL, NULL, 'active'),
  ('foursharpes@yahoo.com', 'FAMILY SHARPE', 'FAMILY SHARPE', 'FAMILY', 'SHARPE', 'active'),
  ('2000nupsi07@gmail.com', 'Dante Jackson', 'Dante Jackson', 'Dante', 'Jackson', 'active'),
  ('mnichols818@hotmail.com', 'Milton Nichols (mnichols818)', 'Milton Nichols', 'Milton', 'Nichols', 'active'),
  ('jessewalker318@gmail.com', 'jessewalker318', 'jessewalker318', NULL, NULL, 'active'),
  ('luther.robinson1@gmail.com', 'Luther Robinson', 'Luther Robinson', 'Luther', 'Robinson', 'active'),
  ('davybeave@aol.com', 'davybeave', 'davybeave', NULL, NULL, 'active'),
  ('clifftaylor20@gmail.com', 'clifftaylor20', 'clifftaylor20', NULL, NULL, 'active'),
  ('kristenkirby22@gmail.com', 'Kristen Greene', 'Kristen Greene', 'Kristen', 'Greene', 'active'),
  ('kadih1@msn.com', 'Kofi Adih', 'Kofi Adih', 'Kofi', 'Adih', 'active'),
  ('shedrickmccall@gmail.com', 'Shedrick McCall', 'Shedrick McCall', 'Shedrick', 'McCall', 'active'),
  ('abck115@aol.com', 'abck115', 'abck115', NULL, NULL, 'active'),
  ('joeljean86@hotmail.com', 'Joel Jean', 'Joel Jean', 'Joel', 'Jean', 'active'),
  ('miltonmnichols2@gmail.com', 'Milton Nichols (miltonmnichols2)', 'Milton Nichols', 'Milton', 'Nichols', 'active'),
  ('donotreply.resumebuilder@asamra.hoffman.army.mil', 'Asamra Hoffman', 'Asamra Hoffman', 'Asamra', 'Hoffman', 'active'),
  ('archie.crawford1@gmail.com', 'archie.crawford1', 'archie.crawford1', NULL, NULL, 'active'),
  ('chillman38@aol.com', 'chillman38', 'chillman38', NULL, NULL, 'active')
ON CONFLICT (email) DO UPDATE SET
  member_name = EXCLUDED.member_name,
  full_name = EXCLUDED.full_name,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  membership_status = EXCLUDED.membership_status,
  updated_at = now();

-- 2. Also ensure they're in member_accounts if they have investment data
-- Update existing member_accounts with the emails
UPDATE member_accounts SET 
  email = CASE member_name
    WHEN 'Phillip Kirby' THEN 'pkirby@kirbycpa.com'
    WHEN 'LeQuan Hylton' THEN 'lequan.hylton@gmail.com'
    WHEN 'James Rodgers' THEN 'james.erodgers@yahoo.com'
    WHEN 'Felecia Burrell' THEN 'faburrell1@verizon.net'
    WHEN 'FAMILY SHARPE' THEN 'foursharpes@yahoo.com'
    WHEN 'Dante Jackson' THEN '2000nupsi07@gmail.com'
    WHEN 'Milton Nichols' THEN 'mnichols818@hotmail.com' -- First Milton
    WHEN 'Luther Robinson' THEN 'luther.robinson1@gmail.com'
    WHEN 'Kristen Greene' THEN 'kristenkirby22@gmail.com'
    WHEN 'Kofi Adih' THEN 'kadih1@msn.com'
    WHEN 'Shedrick McCall' THEN 'shedrickmccall@gmail.com'
    WHEN 'Joel Jean' THEN 'joeljean86@hotmail.com'
    WHEN 'Asamra Hoffman' THEN 'donotreply.resumebuilder@asamra.hoffman.army.mil'
    ELSE email
  END,
  updated_at = now()
WHERE member_name IN (
  'Phillip Kirby', 'LeQuan Hylton', 'James Rodgers', 'Felecia Burrell', 
  'FAMILY SHARPE', 'Dante Jackson', 'Milton Nichols', 'Luther Robinson',
  'Kristen Greene', 'Kofi Adih', 'Shedrick McCall', 'Joel Jean', 'Asamra Hoffman'
);

-- 3. Create missing member_accounts for members who don't have investment accounts yet
INSERT INTO member_accounts (
  email, member_name, 
  current_units, total_contributions, current_value, 
  ownership_percentage, is_active
)
SELECT 
  m.email, m.member_name,
  0.0000, 0.00, 0.00, 0.0000, true
FROM members m
LEFT JOIN member_accounts ma ON m.email = ma.email
WHERE ma.id IS NULL;

-- 4. Run the link function to make sure everything is connected
SELECT link_member_data();

-- 5. Quick verification query - run this to see all members with emails
-- SELECT email, member_name, full_name, membership_status 
-- FROM complete_member_profiles 
-- ORDER BY full_name;