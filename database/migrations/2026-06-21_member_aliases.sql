-- =============================================================================
-- Member name aliases
-- 2026-06-21
--
-- Maps alternate sender names (as they appear in Zelle/bank transactions)
-- to the canonical member_id. The Google Apps Script and import scripts
-- should query this table BEFORE falling back to fuzzy name matching.
--
-- Google Apps Script usage:
--   const res = supabase.from('member_aliases')
--     .select('member_id')
--     .ilike('alias_name', senderName)
--     .maybeSingle()
--   if (res.data) memberId = res.data.member_id
-- =============================================================================

-- Drop and recreate cleanly (table has no production data yet)
DROP TABLE IF EXISTS public.member_aliases CASCADE;

CREATE TABLE public.member_aliases (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_name  text        NOT NULL,
  member_id   uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT  member_aliases_alias_name_key UNIQUE (alias_name)
);

-- Index for fast case-insensitive lookup from scripts
CREATE INDEX member_aliases_alias_lower_idx
  ON public.member_aliases (lower(alias_name));

ALTER TABLE public.member_aliases ENABLE ROW LEVEL SECURITY;

-- Admins can manage aliases; members have no access
CREATE POLICY "admins_manage_aliases"
  ON public.member_aliases
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- Seed known aliases
-- =============================================================================
INSERT INTO public.member_aliases (alias_name, member_id, note)
SELECT
  'SHARPE HAULING LLC',
  m.id,
  'Tim Sharp sends via business account'
FROM public.members m
WHERE m.member_name ILIKE '%SHARP%TIM%'
   OR m.member_name ILIKE '%SHARP, TIM%'
LIMIT 1
ON CONFLICT (alias_name) DO NOTHING;

INSERT INTO public.member_aliases (alias_name, member_id, note)
SELECT
  'PHILLIP J KIRBY',
  m.id,
  'Missing Jr. suffix in Zelle sender name'
FROM public.members m
WHERE m.member_name ILIKE '%KIRBY%PHILLIP%'
   OR m.member_name ILIKE '%KIRBY, PHILLIP%'
LIMIT 1
ON CONFLICT (alias_name) DO NOTHING;

INSERT INTO public.member_aliases (alias_name, member_id, note)
SELECT
  'LUTHER ROBINSON JR',
  m.id,
  'Missing period after Jr in Zelle sender name'
FROM public.members m
WHERE m.member_name ILIKE '%ROBINSON%LUTHER%'
   OR m.member_name ILIKE '%ROBINSON, LUTHER%'
LIMIT 1
ON CONFLICT (alias_name) DO NOTHING;

-- =============================================================================
-- Joel Jean / Joel Jean Sr. disambiguation
-- Two real members: Jean, Joel (07d5ed31) and Jean, Joel Sr. (e2bb568f)
-- Add aliases for the Zelle sender name patterns each uses.
-- Update these if their actual Zelle names differ.
-- =============================================================================
INSERT INTO public.member_aliases (alias_name, member_id, note)
VALUES
  ('JOEL JEAN SR',  'e2bb568f-7e0f-4314-a660-bb9edf1f04be', 'Jean, Joel Sr. — Zelle sender without period'),
  ('JEAN JOEL SR',  'e2bb568f-7e0f-4314-a660-bb9edf1f04be', 'Jean, Joel Sr. — last-first format'),
  ('JOEL JEAN JR',  '07d5ed31-43f1-416a-b1c3-ca78f7653a59', 'Jean, Joel — if he sends with Jr suffix'),
  ('JOEL JEAN',     '07d5ed31-43f1-416a-b1c3-ca78f7653a59', 'Jean, Joel — no suffix')
ON CONFLICT (alias_name) DO UPDATE SET member_id = EXCLUDED.member_id, note = EXCLUDED.note;

-- Verify inserts — run after applying:
-- SELECT a.alias_name, m.member_name, a.note
-- FROM member_aliases a JOIN members m ON m.id = a.member_id
-- ORDER BY a.alias_name;
