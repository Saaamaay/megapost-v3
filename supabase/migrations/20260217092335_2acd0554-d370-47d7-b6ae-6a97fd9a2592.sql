-- Create a webhook trigger on auth.users to fire when email_confirmed_at changes
-- We use pg_net to call our edge function
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  payload jsonb;
  function_url text;
BEGIN
  -- Only fire when email_confirmed_at transitions from NULL to a value
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    payload := jsonb_build_object(
      'type', 'UPDATE',
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'email_confirmed_at', NEW.email_confirmed_at
      ),
      'old_record', jsonb_build_object(
        'id', OLD.id,
        'email', OLD.email,
        'email_confirmed_at', OLD.email_confirmed_at
      )
    );

    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-welcome-email';
    
    -- Use pg_net to make async HTTP call
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_confirmation();
