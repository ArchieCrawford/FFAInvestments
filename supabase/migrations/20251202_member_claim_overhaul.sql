-- Member claim system hardening migration

set check_function_bodies = off;

-- Ensure canonical columns exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'member_name') THEN
    ALTER TABLE public.members ADD COLUMN member_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'full_name') THEN
    ALTER TABLE public.members ADD COLUMN full_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'first_name') THEN
    ALTER TABLE public.members ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'last_name') THEN
    ALTER TABLE public.members ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'role') THEN
    ALTER TABLE public.members ADD COLUMN role text NOT NULL DEFAULT 'member';
    ALTER TABLE public.members ADD CONSTRAINT members_role_check CHECK (role IN ('member','admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'membership_status') THEN
    ALTER TABLE public.members ADD COLUMN membership_status text DEFAULT 'active';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'dues_status') THEN
    ALTER TABLE public.members ADD COLUMN dues_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'auth_user_id') THEN
    ALTER TABLE public.members ADD COLUMN auth_user_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'claimed_at') THEN
    ALTER TABLE public.members ADD COLUMN claimed_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'invite_token') THEN
    ALTER TABLE public.members ADD COLUMN invite_token text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'invite_token_expires_at') THEN
    ALTER TABLE public.members ADD COLUMN invite_token_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'member_account_id') THEN
    ALTER TABLE public.members ADD COLUMN member_account_id uuid REFERENCES public.member_accounts(id);
  END IF;
END $$;

-- Remove deprecated linkage column
ALTER TABLE public.members DROP COLUMN IF EXISTS profile_user_id;

-- Tighten up constraints & indexes
ALTER TABLE public.members
  ALTER COLUMN email SET NOT NULL,
  ADD CONSTRAINT IF NOT EXISTS members_email_unique UNIQUE (email);

ALTER TABLE public.members
  ADD CONSTRAINT IF NOT EXISTS members_membership_status_check CHECK (membership_status IN ('active','inactive','pending','invited')),
  ADD CONSTRAINT IF NOT EXISTS members_dues_status_check CHECK (dues_status IN ('current','overdue','pending'));

CREATE INDEX IF NOT EXISTS idx_members_auth_user_id ON public.members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON public.members(membership_status);

-- Enforce RLS + policies geared towards RPC usage
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
REVOKE UPDATE ON public.members FROM anon, authenticated;

DROP POLICY IF EXISTS "Members can read all member info" ON public.members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can claim" ON public.members;

CREATE POLICY "Members can read all member info" ON public.members
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage members" ON public.members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can claim" ON public.members
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Claim RPC
CREATE OR REPLACE FUNCTION public.claim_member_for_current_user(member_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_member record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING errcode = '42501', message = 'not_authenticated';
  END IF;

  SELECT id, email, auth_user_id, claimed_at
    INTO v_member
  FROM public.members
  WHERE id = member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING errcode = 'P0002', message = 'member_not_found';
  END IF;

  IF v_member.auth_user_id IS NOT NULL AND v_member.auth_user_id <> v_user_id THEN
    RAISE EXCEPTION USING errcode = 'P0001', message = 'already_claimed_by_another';
  END IF;

  UPDATE public.members
  SET auth_user_id = v_user_id,
      claimed_at = now(),
      updated_at = now()
  WHERE id = member_id
  RETURNING id, email, auth_user_id, claimed_at
  INTO v_member;

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member.id,
    'email', v_member.email,
    'claimed_at', v_member.claimed_at
  );
END;
$$;
