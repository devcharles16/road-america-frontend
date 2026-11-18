// Stripe webhook handling. MUST be mounted in index.js BEFORE the global
// express.json() middleware — signature verification needs the exact raw
// request body, which express.json() would otherwise already have parsed
// and consumed by the time a request reaches here. This router defines
// its own express.raw() for the webhook route specifically rather than
// relying on anything mounted elsewhere, so it works correctly regardless
// of what else is registered, as long as this router itself is mounted
// early (see index.js).
import express from 'express';
import { getStripeClient } from '../utils/stripeClient.js';
import { markAuthorized, markCanceled } from '../utils/paymentAuthorizations.js';

const router = express.Router();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured on the server.');
    return res.status(500).send('Webhook not configured.');
  }

  let event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook signature verification failed.`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const referenceId = session.client_reference_id;
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

        if (!paymentIntentId) {
          console.error('checkout.session.completed with no payment_intent for session', session.id);
          break;
        }

        // Never trust the session object alone as proof of authorization —
        // retrieve the PaymentIntent directly from Stripe and confirm its
        // actual current status before recording anything as authorized.
        const stripe = getStripeClient();
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'requires_capture') {
          console.error(
            `PaymentIntent ${paymentIntentId} for ${referenceId} has status "${paymentIntent.status}", not requires_capture — not recording as authorized.`
          );
          break;
        }

        if (paymentIntent.amount !== session.amount_total) {
          console.error(
            `Amount mismatch for session ${session.id}: PaymentIntent ${paymentIntent.amount} vs session ${session.amount_total}. Recording anyway — Stripe's PaymentIntent amount is authoritative — but this is worth investigating.`
          );
        }

        const authorizedAt = new Date();
        const expiresAtEstimate = new Date(authorizedAt.getTime() + SEVEN_DAYS_MS);
        const applied = await markAuthorized(session.id, {
          authorizedAt: authorizedAt.toISOString(),
          expiresAtEstimate: expiresAtEstimate.toISOString(),
        });
        if (!applied) {
          // Either a duplicate delivery of this same event, or a row that
          // was never 'pending' to begin with — both are safe no-ops.
          console.log(`checkout.session.completed for ${session.id} did not change any row (already applied, or no matching pending row).`);
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        await markCanceled(paymentIntent.id, {
          reason: paymentIntent.cancellation_reason || null,
          canceledAt: new Date().toISOString(),
        });
        break;
      }

      default:
        // Not every Stripe event is relevant to this flow — unhandled
        // types are intentionally ignored, not an error.
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handling error:', err);
    // 500 so Stripe retries — the duplicate-delivery handling above is
    // exactly what makes a retry here safe.
    res.status(500).send('Webhook handler error.');
  }
});

export default router;
