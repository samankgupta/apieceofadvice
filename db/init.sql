-- Supabase table definitions for A Piece Of Advice

-- Profiles table (map auth.users.id -> username)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamptz default now()
);

-- Advice table
create table if not exists advice (
  id uuid primary key default gen_random_uuid(),
  target_username text not null,
  -- store the target profile id to avoid breakage when a user changes their username
  target_profile_id uuid references public.profiles on delete set null,
  content text not null,
  from_name text,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

-- Notes: set RLS policies in Supabase to allow:
-- - authenticated users to upsert their profile (match auth.uid() = id)
-- - public inserts for `advice` (or insert only via an Edge Function if you prefer)
-- - public select on `advice` so everyone can view advice for a username

-- Example RLS policy SQL (run in Supabase SQL editor):
-- Enable row level security for profiles and create separate policies for insert and update.
alter table profiles enable row level security;

-- Allow authenticated users to INSERT a profile where the new row's id matches auth.uid().
DROP POLICY IF EXISTS profiles_insert ON profiles;
create policy profiles_insert on profiles
  for insert
  with check (auth.role() = 'authenticated' AND auth.uid() = id);

-- Allow authenticated users to UPDATE their own profile (existing row's id must match auth.uid()).
DROP POLICY IF EXISTS profiles_update ON profiles;
create policy profiles_update on profiles
  for update
  using (auth.role() = 'authenticated' AND auth.uid() = id)
  with check (auth.role() = 'authenticated' AND auth.uid() = id);

-- Allow authenticated users to SELECT their own profile row.
DROP POLICY IF EXISTS profiles_select_self ON profiles;
create policy profiles_select_self on profiles
  for select
  using (auth.role() = 'authenticated' AND auth.uid() = id);

-- Enable RLS for advice. Inserts are intentionally NOT allowed from the public
-- to enforce server-side validation via the `/api/submit` endpoint. The server
-- should use the SUPABASE_SERVICE_ROLE_KEY which bypasses RLS for trusted writes.
alter table advice enable row level security;

-- Allow public SELECT so the advice can be read for a username.
DROP POLICY IF EXISTS advice_select_public ON advice;
create policy advice_select_public on advice
  for select
  using (true);

-- Allow the owner of the profile (the user whose username matches target_username)
-- to DELETE advice entries for their username. This uses RLS so client-side
-- deletes (via anon key) are allowed only when the requester is authenticated
-- and their `profiles` row links their auth uid to the same username.
DROP POLICY IF EXISTS advice_delete_owner ON advice;
create policy advice_delete_owner on advice
  for delete
  using (
    -- owner if the advice targets the profile whose id equals the authenticated user
    target_profile_id = auth.uid()
  );

-- OPTIONAL: Create a trigger to auto-populate `profiles` when a new auth user is created.
-- This makes sure users who sign in with OAuth (Google) get a profiles row with a
-- sensible default username (email prefix). Run this in the Supabase SQL editor.

-- If a previous trigger exists it depends on the function, so drop the trigger first
DROP TRIGGER IF EXISTS create_profile ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use the email prefix as a default username. If that username is taken,
  -- try prepending a random 4-digit number until we find a unique value. If
  -- we still can't insert after several attempts, fall back to using the
  -- user's uuid as the username.
  DECLARE
    base text := COALESCE(NULLIF(split_part(NEW.email, '@', 1), ''), NEW.id::text);
    candidate text := base;
    attempts int := 0;
  BEGIN
    LOOP
      BEGIN
        INSERT INTO public.profiles (id, username)
        VALUES (NEW.id, candidate);
        -- inserted successfully
        RETURN NEW;
      EXCEPTION WHEN unique_violation THEN
        -- username taken; try another candidate by prepending a random 4-digit number
        attempts := attempts + 1;
        candidate := concat((floor(random()*9000 + 1000))::int::text, base);
        IF attempts > 6 THEN
          -- give up and use the uuid to guarantee uniqueness
          candidate := NEW.id::text;
        END IF;
        -- loop and try insert again
      END;
    END LOOP;
  END;
END;
$$;

-- Create trigger on auth.users so profile rows are created automatically.
DROP TRIGGER IF EXISTS create_profile ON auth.users;
CREATE TRIGGER create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Backfill: if advice rows exist with only target_username, map them to profiles
-- This will set target_profile_id for existing rows where a matching profile exists.
-- It is safe to re-run; it only updates rows where target_profile_id IS NULL and a matching profile is found.
DO $$
BEGIN
  UPDATE public.advice a
  SET target_profile_id = p.id
  FROM public.profiles p
  WHERE a.target_profile_id IS NULL
    AND a.target_username = p.username;
END
$$;
