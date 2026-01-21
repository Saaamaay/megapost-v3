-- Create content_pillars table for storing user's content ideas
CREATE TABLE public.content_pillars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT DEFAULT '💡',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.content_pillars ENABLE ROW LEVEL SECURITY;

-- Users can view their own pillars
CREATE POLICY "Users can view their own pillars"
ON public.content_pillars
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own pillars
CREATE POLICY "Users can create their own pillars"
ON public.content_pillars
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own pillars
CREATE POLICY "Users can delete their own pillars"
ON public.content_pillars
FOR DELETE
USING (auth.uid() = user_id);