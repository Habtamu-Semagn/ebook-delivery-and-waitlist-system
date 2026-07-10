INSERT INTO purchases (

  id, 

  user_id, 

  book_id, 

  status, 

  payment_order_id, 

  created_at, 

  updated_at

) VALUES (

  gen_random_uuid(),

  'bfe66d9a-7c7c-465d-83bc-0ccfa8315181',      -- Must be a valid UUID from your auth.users / profiles table

  'd4163d2f-0a22-4447-8b79-13da98055b30',      -- Must be a valid UUID from your books table

  'pending',

  'cs_test_Reconcile_123',  -- A dummy stripe checkout session ID (or a real mock one)

  NOW() - INTERVAL '30 seconds', -- Ensures it looks "old" to your adjusted code

  NOW() - INTERVAL '30 seconds'

);