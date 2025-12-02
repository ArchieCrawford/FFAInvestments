-- RPC: Safely link an existing member row to the currently authenticated Supabase user
-- Ensures only the intended auth user can claim a member and records the claim timestamp

create or replace function public.claim_member_for_current_user(p_member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member record;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to claim a member account.' using errcode = '42501';
  end if;

  select id, auth_user_id, claimed_at into v_member
  from public.members
  where id = p_member_id
  for update;

  if not found then
    raise exception 'Member not found for supplied ID.' using errcode = 'P0002';
  end if;

  if v_member.auth_user_id is not null and v_member.auth_user_id <> v_user_id then
    raise exception 'This member is already claimed by another user.' using errcode = 'P0001';
  end if;

  update public.members
  set auth_user_id = v_user_id,
      claimed_at = coalesce(v_member.claimed_at, now()),
      updated_at = now()
  where id = p_member_id
  returning id, auth_user_id, claimed_at
  into v_member;

  if not found then
    raise exception 'Unable to claim member. Please try again.' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'member_id', v_member.id,
    'auth_user_id', v_member.auth_user_id,
    'claimed_at', v_member.claimed_at
  );
end;
$$;