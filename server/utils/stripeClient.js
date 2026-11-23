// Thin wrapper so every caller gets the same configured client, plus an
// explicit environment safeguard: STRIPE_ENVIRONMENT must be set to
// 'sandbox' or 'live', and must AGREE with what STRIPE_SECRET_KEY's own
// prefix says it is. A live key (sk_live_...) is refused unless
// STRIPE_ENVIRONMENT is explicitly 'live' — so accidentally dropping a
// live key into a sandbox deployment (or vice versa) fails loudly at
// startup instead of silently processing real charges as if they were
// sandbox test transactions.
import Stripe from 'stripe';

let client = null;
let cachedMode = null;

export function getStripeClient() {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set');

  const environment = process.env.STRIPE_ENVIRONMENT;
  if (environment !== 'sandbox' && environment !== 'live') {
    throw new Error("STRIPE_ENVIRONMENT must be set to 'sandbox' or 'live'");
  }

  const keyLooksLive = secretKey.startsWith('sk_live_');
  const keyLooksTest = secretKey.startsWith('sk_test_');
  if (!keyLooksLive && !keyLooksTest) {
    throw new Error('STRIPE_SECRET_KEY does not look like a Stripe secret key (expected sk_test_... or sk_live_...)');
  }
  if (keyLooksLive && environment !== 'live') {
    throw new Error("STRIPE_SECRET_KEY is a live key but STRIPE_ENVIRONMENT is not 'live' — refusing to start to avoid accidentally processing real charges.");
  }
  if (keyLooksTest && environment !== 'sandbox') {
    throw new Error("STRIPE_SECRET_KEY is a sandbox/test key but STRIPE_ENVIRONMENT is not 'sandbox' — refusing to start.");
  }

  cachedMode = environment;
  client = new Stripe(secretKey);
  return client;
}

/** 'sandbox' | 'live' — only valid after getStripeClient() has run once. */
export function getStripeEnvironment() {
  return cachedMode;
}

// Used by the capture flow (hubspotSyncRouter.js) to decide whether a
// failed stripe.paymentIntents.capture() call means "Stripe definitely
// did not process this" (safe to record as a clean failure) or "we don't
// actually know what Stripe's server did" (never safe to assume either
// way — must retrieve the PaymentIntent directly to find out). A
// StripeConnectionError means the request may never have reached Stripe,
// or may have reached it but the response was lost — genuinely ambiguous
// either way. A StripeAPIError (Stripe's own 5xx) means Stripe itself
// hit an error, which can likewise happen before or after the capture
// was actually applied internally. Every other Stripe error type (an
// invalid-request rejection, e.g. "already canceled", a rate limit which
// means the request never started, etc.) is a certain, trustworthy
// answer — no retrieve needed. An error with no `.type` at all (not a
// Stripe SDK error — e.g. a raw network exception) is treated the same
// as ambiguous, out of caution: better to double-check with Stripe than
// to assume a failure that didn't happen.
const AMBIGUOUS_STRIPE_ERROR_TYPES = new Set(['StripeConnectionError', 'StripeAPIError']);

export function isAmbiguousStripeError(err) {
  if (!err) return false;
  if (!err.type) return true;
  return AMBIGUOUS_STRIPE_ERROR_TYPES.has(err.type);
}
