-- Drop the old unique constraint on user_id that prevents multiple profiles per user
ALTER TABLE public.voice_profiles DROP CONSTRAINT IF EXISTS voice_profiles_user_id_key;