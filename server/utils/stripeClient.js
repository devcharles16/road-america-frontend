// Thin wrapper so every caller gets the same configured client. Sandbox
// vs. live is entirely determined by which key is in STRIPE_SECRET_KEY —
// nothing in this codebase distinguishes the two beyond that.
import Stripe from 'stripe';

let client = null;

export function getStripeClient() {
  if (client) return client;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set');
  client = new Stripe(secretKey);
  return client;
}
