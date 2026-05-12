-- Run this in Supabase SQL Editor or via supabase db push

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_coach            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS goal_title           text,
  ADD COLUMN IF NOT EXISTS goal_deadline        date,
  ADD COLUMN IF NOT EXISTS goal_preferences     jsonb;

-- Mark existing users as already onboarded so they don't see the new wizard
UPDATE users SET onboarding_completed = true WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Re-apply the default of false only for NEW rows (existing rows are now true)
ALTER TABLE users ALTER COLUMN onboarding_completed SET DEFAULT false;
