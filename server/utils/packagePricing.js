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
