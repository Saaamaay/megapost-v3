
CREATE TABLE public.welcome_emails_sent (
  email TEXT PRIMARY KEY,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.welcome_emails_sent ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - only accessed by edge function via service role
