-- Add performance tracking columns to generated_posts
ALTER TABLE public.generated_posts 
ADD COLUMN rating text CHECK (rating IN ('nailed_it', 'not_my_voice', NULL)),
ADD COLUMN is_viral boolean DEFAULT false,
ADD COLUMN performance_notes text;

-- Create policy for updating posts (users can rate their own posts)
CREATE POLICY "Users can update their own posts" 
ON public.generated_posts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);