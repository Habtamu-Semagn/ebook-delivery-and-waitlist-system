SET check_function_bodies = false;
DROP EXTENSION pg_net;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
CREATE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;
CREATE TABLE public.books (id uuid DEFAULT gen_random_uuid() NOT NULL, title text NOT NULL, description text NOT NULL, price integer NOT NULL, file_url text NOT NULL, is_active boolean DEFAULT true, author text NOT NULL, created_at timestamp without time zone DEFAULT now());
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ADD CONSTRAINT books_pkey PRIMARY KEY (id);
GRANT ALL ON public.books TO anon;
GRANT ALL ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
CREATE TABLE public.purchases (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, book_id uuid NOT NULL, status text DEFAULT 'pending'::text, razorpay_order_id text, razorpay_payment_id text, created_at timestamp without time zone DEFAULT now());
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ADD CONSTRAINT purchases_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;
ALTER TABLE public.purchases ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);
ALTER TABLE public.purchases ADD CONSTRAINT purchases_razorpay_order_id_key UNIQUE (razorpay_order_id);
ALTER TABLE public.purchases ADD CONSTRAINT purchases_razorpay_payment_id_key UNIQUE (razorpay_payment_id);
ALTER TABLE public.purchases ADD CONSTRAINT purchases_status_check CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text]));
GRANT ALL ON public.purchases TO anon;
GRANT ALL ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
CREATE TABLE public.users (id uuid DEFAULT gen_random_uuid() NOT NULL, firebase_uid text NOT NULL, email text NOT NULL, created_at timestamp without time zone DEFAULT now());
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE public.users ADD CONSTRAINT users_firebase_uid_key UNIQUE (firebase_uid);
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE public.purchases ADD CONSTRAINT purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
CREATE TABLE public.waitlist (id uuid DEFAULT gen_random_uuid() NOT NULL, email text NOT NULL, created_at timestamp without time zone DEFAULT now());
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_email_key UNIQUE (email);
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);
GRANT ALL ON public.waitlist TO anon;
GRANT ALL ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
CREATE TABLE public.webhook_events (id uuid DEFAULT gen_random_uuid() NOT NULL, event_id text NOT NULL, status text DEFAULT 'pending'::text, payload jsonb NOT NULL, created_at timestamp without time zone DEFAULT now());
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_event_id_key UNIQUE (event_id);
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);
ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_status_check CHECK (status = ANY (ARRAY['pending'::text, 'processed'::text, 'failed'::text]));
GRANT ALL ON public.webhook_events TO anon;
GRANT ALL ON public.webhook_events TO authenticated;
GRANT ALL ON public.webhook_events TO service_role;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO') EXECUTE FUNCTION public.rls_auto_enable();
