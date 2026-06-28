-- Add missing unique constraint (prevent duplicate purchases)
alter table public.purchases
add constraint unique_user_book unique (user_id, book_id);

-- BOOKS: anyone can read active books (public catalog)
create policy "books_select_active"
on public.books for select
using (is_active = true);

-- WAITLIST: anyone can join
create policy "waitlist_insert_anyone"
on public.waitlist for insert
with check (true);

-- USERS, PURCHASES, WEBHOOK_EVENTS:
-- No policies = fully locked to anon/authenticated
-- Only service_role (NestJS backend) can access these
-- RLS is already enabled on all three from the schema migration