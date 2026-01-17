-- Create generated_posts table
CREATE TABLE public.generated_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_generated_posts_user_id ON public.generated_posts(user_id);
CREATE INDEX idx_generated_posts_created_at ON public.generated_posts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own posts" 
ON public.generated_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posts" 
ON public.generated_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.generated_posts 
FOR DELETE 
USING (auth.uid() = user_id);