-- Add profile_name for display in switcher and is_active to track active profile
ALTER TABLE public.voice_profiles 
ADD COLUMN profile_name TEXT,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;

-- Create a function to ensure only one profile is active per user
CREATE OR REPLACE FUNCTION public.ensure_single_active_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the new profile is being set to active, deactivate all other profiles for this user
  IF NEW.is_active = true THEN
    UPDATE public.voice_profiles 
    SET is_active = false 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce single active profile
CREATE TRIGGER ensure_single_active_profile_trigger
BEFORE INSERT OR UPDATE OF is_active ON public.voice_profiles
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.ensure_single_active_profile();

-- Update existing profiles to have a default name based on business_type or business_description
UPDATE public.voice_profiles 
SET profile_name = COALESCE(
  business_type,
  CASE 
    WHEN LENGTH(business_description) > 30 THEN SUBSTRING(business_description, 1, 30) || '...'
    ELSE business_description
  END,
  'My Business'
),
is_active = true
WHERE profile_name IS NULL;