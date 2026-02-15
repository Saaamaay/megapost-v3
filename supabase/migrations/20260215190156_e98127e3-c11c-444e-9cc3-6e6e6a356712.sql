
-- Table to track deleted accounts for trial abuse prevention
-- Stores SHA-256 hashed emails only (no PII)
CREATE TABLE public.deleted_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_hash TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_deleted_accounts_email_hash ON public.deleted_accounts (email_hash);

-- Enable RLS but no policies = only service role can access
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;
