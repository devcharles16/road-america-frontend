// Single source of truth for "what should a Gold or Silver authorization
// cost," used by both session creation (bookingRouter.js) and webhook
// verification (stripeWebhookRouter.js) — so the webhook is independently
// re-deriving the expected amount from current pricing, not just trusting
// whatever was stored when the session was created minutes (or longer)
// earlier.
export function computeAuthorizationAmount(quote, pkg) {
  return pkg === 'silver' ? quote.silverFee : quote.goldTotal;
}

export function computeAuthorizationAmountCents(quote, pkg) {
  const amount = computeAuthorizationAmount(quote, pkg);
  if (amount == null || amount === '') return null;
  const cents = Math.round(Number(amount) * 100);
  return Number.isFinite(cents) && cents > 0 ? cents : null;
}

// Used as the Stripe idempotency key on checkout.sessions.create()
// (bookingRouter.js) — deterministic, not random, so a genuine retry of
// the exact same request (double-click, a second tab, a client-side
// network retry) reaches Stripe with the SAME key and gets back the SAME
// Checkout Session instead of creating a second one, while a legitimate
// price change (amountCents differs) naturally busts the cache instead of
// returning a stale response for a request that's actually different.
export function buildCheckoutIdempotencyKey({ referenceId, pkg, amountCents }) {
  return `checkout_${referenceId}_${pkg}_${amountCents}`;
}
