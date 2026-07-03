insert into public.purchases (user_id, book_id, status, payment_order_id)
values (
  (select id from public.users limit 1),
  'd4163d2f-0a22-4447-8b79-13da98055b30',
  'completed',
  'test_order_123'
);