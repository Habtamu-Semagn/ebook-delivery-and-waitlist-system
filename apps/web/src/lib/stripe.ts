interface StartCheckoutArgs {
  bookId: string;
  bookTitle: string;
  amount: number; // smallest currency unit (e.g. cents/paise)
  currency: string;
  onFailure?: (error: unknown) => void;
}

/**
 * Calls the NestJS backend to create a Stripe Checkout Session, then redirects
 * the browser to Stripe's hosted checkout page. Stripe handles the payment UI
 * itself, so there's no client-side script to load and no in-page modal —
 * the user is sent to checkout.stripe.com and back.
 *
 * Backend route is a placeholder — point it at your real endpoint. It should
 * create a Checkout Session server-side (using your Stripe secret key) with
 * success_url / cancel_url set to your app's /success and /books/:slug routes,
 * and return { url } — the Checkout Session's redirect URL.
 */
export async function startCheckout({
  bookId,
  bookTitle,
  amount,
  currency,
  onFailure,
}: StartCheckoutArgs) {
  try {
    const res = await fetch('/api/checkout-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId,
        bookTitle,
        amount,
        currency,
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}&bookId=${bookId}`,
        cancelUrl: window.location.href,
      }),
    });

    if (!res.ok) throw new Error('Failed to create checkout session');
    const session = await res.json(); // expects { url: string }

    if (!session.url) throw new Error('Checkout session missing redirect URL');
    window.location.href = session.url;
  } catch (err) {
    onFailure?.(err);
  }
}