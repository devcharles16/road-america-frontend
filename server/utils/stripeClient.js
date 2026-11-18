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
