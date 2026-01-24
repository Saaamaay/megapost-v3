-- Delete all existing posts for clean slate
DELETE FROM public.generated_posts;

-- Add voice_profile_id column to link posts to specific business profiles
ALTER TABLE public.generated_posts 
ADD COLUMN voice_profile_id UUID REFERENCES public.voice_profiles(id) ON DELETE CASCADE;

-- Create index for efficient querying
CREATE INDEX idx_generated_posts_voice_profile ON public.generated_posts(voice_profile_id);