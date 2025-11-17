-- Fix member emails to match the correct member accounts
-- This updates both members and member_accounts tables with the correct email mappings

-- 1. Update member_accounts table with correct emails based on member names
UPDATE member_accounts SET 
  email = CASE 
    WHEN member_name = 'Burrell, Felecia' THEN 'faburrell1@verizon.net'
    WHEN member_name = 'Kirby, Phillip J. Jr.' THEN 'pkirby@kirbycpa.com'
    -- WHEN member_name = 'Mauney, Larry' THEN 'larry.mauney@email.com' -- No email provided
    WHEN member_name = 'Sharpe, Tim' THEN 'foursharpes@yahoo.com' -- Tim Sharpe uses FAMILY SHARPE email
    WHEN member_name = 'Cheatham, Davy' THEN 'beulenner@aol.com'
    WHEN member_name = 'Jean, Joel L.' THEN 'foursharpes@yahoo.com'
    WHEN member_name = 'Jean, Joel Sr.' THEN 'chillman38@aol.com'
    WHEN member_name = 'Walker, Jessee J.' THEN 'jessewalker318@gmail.com'
    WHEN member_name = 'Taylor, Cliffton' THEN 'clifftaylor20@gmail.com'
    -- WHEN member_name = 'McCall, Anthony' THEN 'anthony.mccall@email.com' -- No email provided
    WHEN member_name = 'McCall, Shedrick D.' THEN 'shedrickmccall@gmail.com'
    WHEN member_name = 'Robinson, Luther Jr.' THEN 'luther.robinson1@gmail.com'
    WHEN member_name = 'Gwaltney, Rheba G.' THEN 'rgwalt6145@aol.com'
    WHEN member_name = 'Adih, Kofi S.' THEN 'kadih1@msn.com'
    WHEN member_name = 'Greene, Kristen' THEN 'kristenkirby22@gmail.com'
    WHEN member_name = 'Nichols, Milton' THEN 'miltonmnichols2@gmail.com'
    WHEN member_name = 'Hylton, Lequan' THEN 'lequan.hylton@gmail.com'
    WHEN member_name = 'Jackson, Dante' THEN '2000nupsi07@gmail.com'
    WHEN member_name = 'Rodgers, James' THEN 'james.erodgers@yahoo.com'
    WHEN member_name = 'Crawford, Archie' THEN 'archie.crawford1@gmail.com'
    ELSE email
  END,
  updated_at = now()
WHERE member_name IN (
  'Burrell, Felecia', 'Kirby, Phillip J. Jr.', 'Sharpe, Tim',
  'Cheatham, Davy', 'Jean, Joel L.', 'Jean, Joel Sr.', 'Walker, Jessee J.',
  'Taylor, Cliffton', 'McCall, Shedrick D.', 'Robinson, Luther Jr.',
  'Gwaltney, Rheba G.', 'Adih, Kofi S.', 'Greene, Kristen', 'Nichols, Milton',
  'Hylton, Lequan', 'Jackson, Dante', 'Rodgers, James', 'Crawford, Archie'
);

-- 2. Update members table to match the member_accounts
UPDATE members SET 
  email = CASE 
    WHEN member_name = 'Phillip Kirby' AND email = 'pkirby@kirbycpa.com' THEN 'pkirby@kirbycpa.com'
    WHEN member_name = 'LeQuan Hylton' AND email = 'lequan.hylton@gmail.com' THEN 'lequan.hylton@gmail.com'
    WHEN member_name = 'James Rodgers' AND email = 'james.erodgers@yahoo.com' THEN 'james.erodgers@yahoo.com' -- James Rodgers correct email
    WHEN member_name = 'Felecia Burrell' AND email = 'faburrell1@verizon.net' THEN 'faburrell1@verizon.net'
    WHEN member_name = 'FAMILY SHARPE' AND email = 'foursharpes@yahoo.com' THEN 'foursharpes@yahoo.com'
    WHEN member_name = 'Dante Jackson' AND email = '2000nupsi07@gmail.com' THEN '2000nupsi07@gmail.com'
    WHEN member_name = 'Luther Robinson' AND email = 'luther.robinson1@gmail.com' THEN 'luther.robinson1@gmail.com'
    WHEN member_name = 'Kristen Greene' AND email = 'kristenkirby22@gmail.com' THEN 'kristenkirby22@gmail.com'
    WHEN member_name = 'Kofi Adih' AND email = 'kadih1@msn.com' THEN 'kadih1@msn.com'
    WHEN member_name = 'Shedrick McCall' AND email = 'shedrickmccall@gmail.com' THEN 'shedrickmccall@gmail.com'
    WHEN member_name = 'Joel Jean' AND email = 'joeljean86@hotmail.com' THEN 'joeljean86@hotmail.com'
    WHEN member_name = 'Milton Nichols (miltonmnichols2)' AND email = 'miltonmnichols2@gmail.com' THEN 'miltonmnichols2@gmail.com'
    WHEN member_name = 'archie.crawford1' AND email = 'archie.crawford1@gmail.com' THEN 'archie.crawford1@gmail.com'
    WHEN member_name = 'beulenner' AND email = 'beulenner@aol.com' THEN 'beulenner@aol.com'
    WHEN member_name = 'rgwalt6145' AND email = 'rgwalt6145@aol.com' THEN 'rgwalt6145@aol.com'
    WHEN member_name = 'jessewalker318' AND email = 'jessewalker318@gmail.com' THEN 'jessewalker318@gmail.com'
    WHEN member_name = 'clifftaylor20' AND email = 'clifftaylor20@gmail.com' THEN 'clifftaylor20@gmail.com'
    WHEN member_name = 'chillman38' AND email = 'chillman38@aol.com' THEN 'chillman38@aol.com'
    ELSE email
  END,
  full_name = CASE
    -- Update full names to match the investment account names for better linking
    WHEN email = 'faburrell1@verizon.net' THEN 'Burrell, Felecia'
    WHEN email = 'pkirby@kirbycpa.com' THEN 'Kirby, Phillip J. Jr.'
    WHEN email = 'foursharpes@yahoo.com' AND member_name = 'FAMILY SHARPE' THEN 'Jean, Joel L.' -- First Joel
    WHEN email = 'beulenner@aol.com' THEN 'Cheatham, Davy'
    WHEN email = 'jessewalker318@gmail.com' THEN 'Walker, Jessee J.'
    WHEN email = 'clifftaylor20@gmail.com' THEN 'Taylor, Cliffton'
    WHEN email = 'shedrickmccall@gmail.com' THEN 'McCall, Shedrick D.'
    WHEN email = 'luther.robinson1@gmail.com' THEN 'Robinson, Luther Jr.'
    WHEN email = 'rgwalt6145@aol.com' THEN 'Gwaltney, Rheba G.'
    WHEN email = 'kadih1@msn.com' THEN 'Adih, Kofi S.'
    WHEN email = 'kristenkirby22@gmail.com' THEN 'Greene, Kristen'
    WHEN email = 'miltonmnichols2@gmail.com' THEN 'Nichols, Milton'
    WHEN email = 'lequan.hylton@gmail.com' THEN 'Hylton, Lequan'
    WHEN email = '2000nupsi07@gmail.com' THEN 'Jackson, Dante'
    WHEN email = 'james.erodgers@yahoo.com' THEN 'Rodgers, James'
    WHEN email = 'archie.crawford1@gmail.com' THEN 'Crawford, Archie'
    WHEN email = 'chillman38@aol.com' THEN 'Jean, Joel Sr.'
    ELSE full_name
  END,
  updated_at = now();

-- 3. Remove the missing members section since we don't have their emails
-- Larry Mauney and Anthony McCall don't have provided emails, so we'll skip them for now

-- 4. Run the link function to connect everything
SELECT link_member_data();

-- 5. Verification query to see the results
SELECT 
  ma.member_name,
  ma.email,
  ma.current_value,
  ma.current_units,
  m.membership_status
FROM member_accounts ma
LEFT JOIN members m ON ma.email = m.email
ORDER BY ma.member_name;