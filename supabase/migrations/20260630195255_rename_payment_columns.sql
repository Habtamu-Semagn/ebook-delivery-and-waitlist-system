alter table public.purchases
rename column razorpay_order_id to payment_order_id;

alter table public.purchases
rename column razorpay_payment_id to payment_id;