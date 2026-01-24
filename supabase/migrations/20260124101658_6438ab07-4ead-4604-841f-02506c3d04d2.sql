-- Add voice_profile_id to content_pillars for profile isolation
ALTER TABLE public.content_pillars 
ADD COLUMN voice_profile_id UUID REFERENCES public.voice_profiles(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_content_pillars_voice_profile ON public.content_pillars(voice_profile_id);