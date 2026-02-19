-- Add generation_id column to track generation batches
-- Each generation action (regardless of platform count) shares the same generation_id
ALTER TABLE public.generated_posts ADD COLUMN generation_id uuid DEFAULT NULL;

-- Index for efficient monthly generation counting
CREATE INDEX idx_generated_posts_generation_id ON public.generated_posts (user_id, generation_id, created_at);