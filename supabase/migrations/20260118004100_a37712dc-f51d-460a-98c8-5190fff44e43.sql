-- Add new columns for expanded voice profile
ALTER TABLE public.voice_profiles
ADD COLUMN IF NOT EXISTS business_location text,
ADD COLUMN IF NOT EXISTS employee_count text,
ADD COLUMN IF NOT EXISTS business_type text,
ADD COLUMN IF NOT EXISTS tone_casual_professional integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS tone_funny_sincere integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS tone_personal_formal integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS tone_grounded_inspiring integer DEFAULT 3;