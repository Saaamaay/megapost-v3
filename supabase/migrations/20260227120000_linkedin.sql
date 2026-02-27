-- LinkedIn Direct Posting: new table + columns on generated_posts

-- 1. linkedin_connections table
CREATE TABLE public.linkedin_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  linkedin_person_id text NOT NULL,
  linkedin_name text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: users can SELECT their own row only
ALTER TABLE public.linkedin_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own linkedin connection"
  ON public.linkedin_connections FOR SELECT
  USING (auth.uid() = user_id);

-- 2. New columns on generated_posts for LinkedIn share tracking
ALTER TABLE public.generated_posts
  ADD COLUMN linkedin_post_url text DEFAULT NULL,
  ADD COLUMN linkedin_shared_at timestamptz DEFAULT NULL;
