-- 1. Drop the incorrect foreign key constraint pointing to auth.users
ALTER TABLE public.download_logs 
DROP CONSTRAINT IF EXISTS download_logs_user_id_fkey;

-- 2. Re-add the foreign key constraint pointing to your custom public.users table
ALTER TABLE public.download_logs 
ADD CONSTRAINT download_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;