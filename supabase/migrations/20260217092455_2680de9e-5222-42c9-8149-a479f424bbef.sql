-- Remove the trigger on auth.users (not recommended to attach triggers to auth schema)
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_email_confirmation();
