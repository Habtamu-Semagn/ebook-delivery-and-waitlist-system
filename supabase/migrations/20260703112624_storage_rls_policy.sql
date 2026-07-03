-- Allow users to download only books they have purchased
create policy "purchased_users_can_download"
on storage.objects for select
using (
  bucket_id = 'ebooks'
  and exists (
    select 1 from public.purchases p
    join public.users u on u.id = p.user_id
    where p.status = 'completed'
    and u.firebase_uid = (storage.foldername(name))[1]
  )
);