-- Add brand_beliefs column to voice_profiles table
-- This stores the user's 3 "We believe..." statements that make their content distinctive

ALTER TABLE public.voice_profiles
ADD COLUMN brand_beliefs text[] DEFAULT '{}'::text[];