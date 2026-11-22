// Stripe webhook handling. MUST be mounted in index.js BEFORE the global
// express.json() middleware — signature verification needs the exact raw
// request body, which express.json() would otherwise already have parsed
// and consumed by the time a request reaches here. This router defines
// its own express.raw() for the webhook route specifically rather than
// relying on anything mounted elsewhere, so it works correctly regardless
// of what else is registered, as long as this router itself is mounted
// early (see index.js).
import express from 'express';
import supabase from '../supabaseClient.js';
import { getStripeClient, getStripeEnvironment } from '../utils/stripeClient.js';
import { computeAuthorizationAmountCents } from '../utils/packagePricing.js';
import {
  markAuthorized,
  markAmountMismatch,
  markDuplicateCanceled,
  selectDuplicateAuthorizations,
  getAuthorizationByPaymentIntent,
  getAuthorizationBySession,
  applyTerminalStatus,
} from '../utils/paymentAuthorizations.js';
import {
  lockBookingDetailsForAuthorizedPayment,
  unlockBookingDetailsAfterAuthorizationLoss,
} from '../utils/bookingDetails.js';

const router = express.Router();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Re-derives the expected amount from CURRENT quotes/booking_selections
// data, independent of whatever was stored when the session was created —
// catches the case where pricing or the selected package changed in the
// time between session creation and the customer completing payment.
async function getCurrentExpectedAmountCents(referenceId) {
  const { data: quoteRow, error: quoteErr } = await supabase
    .from('quotes')
    .select('silver_paid_to_ra, gold_total_price')
    .eq('reference_id', referenceId)
    .maybeSingle();
  if (quoteErr) throw quoteErr;
  if (!quoteRow) return null;

  const { data: selection, error: selectionErr } = await supabase
    .from('booking_selections')
    .select('package')
    .eq('reference_id', referenceId)
    .maybeSingle();
  if (selectionErr) throw selectionErr;
  if (!selection) return null;

  const quote = { silverFee: quoteRow.silver_paid_to_ra, goldTotal: quoteRow.gold_total_price };
  return computeAuthorizationAmountCents(quote, selection.package);
}

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

  // Defense in depth beyond the startup key/environment check in
  // stripeClient.js: confirm this specific EVENT's own livemode flag
  // matches what this server is configured to process. A mismatch means
  // the webhook secret and the API key are pointed at different Stripe
  // environments — refuse rather than silently record a live event as a
  // sandbox one or vice versa.
  const expectedLive = getStripeEnvironment() === 'live';
  if (event.livemode !== expectedLive) {
    console.error(
      `Stripe webhook event ${event.id} livemode=${event.livemode} does not match this server's configured environment (expected live=${expectedLive}). Refusing to process.`
    );
    return res.status(400).send('Event environment mismatch.');
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

        // Amount verification: the authorized amount must match what the
        // currently selected package/approved quote actually computes to
        // — not just what Stripe's own session and PaymentIntent agree
        // with each other on, which only proves internal Stripe
        // consistency, not that the amount is still correct on our side.
        const expectedCents = await getCurrentExpectedAmountCents(referenceId);
        if (expectedCents == null) {
          console.error(`Could not re-derive an expected amount for ${referenceId} (missing quote or selection) — not recording as authorized.`);
          break;
        }
        if (paymentIntent.amount !== expectedCents) {
          console.error(
            `Amount mismatch for ${referenceId}: PaymentIntent authorized ${paymentIntent.amount}, current package/quote computes ${expectedCents}. Flagging for manual review, not recording as authorized.`
          );
          await markAmountMismatch(session.id, {
            detail: `PaymentIntent amount ${paymentIntent.amount} does not match currently expected ${expectedCents}`,
          });
          break;
        }

        const authorizedAt = new Date();
        const expiresAtEstimate = new Date(authorizedAt.getTime() + SEVEN_DAYS_MS);
        const applied = await markAuthorized(session.id, {
          stripePaymentIntentId: paymentIntentId,
          authorizedAt: authorizedAt.toISOString(),
          expiresAtEstimate: expiresAtEstimate.toISOString(),
        });
        if (!applied) {
          // Either a duplicate delivery of this same event, or a row that
          // was no longer 'pending' for some other reason — both are safe
          // no-ops, not an error.
          console.log(`checkout.session.completed for ${session.id} did not change any row (already applied, or no matching pending row).`);
          break;
        }

        // Duplicate-authorization defense in depth: payment_authorizations_
        // dedupe.sql's partial unique index (unique on reference_id WHERE
        // status in ('pending','authorized')) should make it impossible
        // for two rows for the same reference to both reach 'authorized',
        // but this closes the gap for anything that predates that
        // migration, or any other path that somehow still got here twice.
        // Keep only the earliest-authorized row for this reference, and
        // safely cancel (never capture) every later PaymentIntent.
        const { data: authorizedRows, error: dupErr } = await supabase
          .from('payment_authorizations')
          .select('id, stripe_payment_intent_id, authorized_at')
          .eq('reference_id', referenceId)
          .eq('status', 'authorized');
        if (dupErr) throw dupErr;

        const { keep, duplicates } = selectDuplicateAuthorizations(authorizedRows);
        for (const dup of duplicates) {
          console.error(
            `Duplicate authorization detected for ${referenceId}: canceling PaymentIntent ${dup.stripe_payment_intent_id} (row ${dup.id}), keeping the earliest authorization (row ${keep.id}).`
          );
          try {
            await stripe.paymentIntents.cancel(dup.stripe_payment_intent_id);
          } catch (cancelErr) {
            console.error(
              `Failed to cancel duplicate PaymentIntent ${dup.stripe_payment_intent_id} for ${referenceId} (it will still auto-expire in 7 days uncaptured if this cancel never succeeds):`,
              cancelErr
            );
          }
          try {
            await markDuplicateCanceled(
              dup.id,
              `Automatically canceled: reference ${referenceId} already had an earlier authorization (row ${keep.id}).`
            );
          } catch (markErr) {
            console.error(`Failed to mark duplicate row ${dup.id} as duplicate_canceled for ${referenceId}:`, markErr);
          }
        }

        // Locks the approved pickup/delivery details now that payment is
        // authorized — see lockBookingDetailsForAuthorizedPayment for why
        // this is what makes them immutable going forward. Logged, not
        // thrown: payment_authorizations is already the source of truth
        // for the authorization itself, and must not be rolled back or
        // retried over a failure in this separate, non-critical table.
        try {
          await lockBookingDetailsForAuthorizedPayment(referenceId);
        } catch (lockErr) {
          console.error(`Failed to lock booking_details for ${referenceId} after authorization:`, lockErr);
        }
        break;
      }

      // The customer's card was declined, or another failure occurred
      // during the Checkout page itself (before the session completed).
      // The row stays retryable — this never blocks a new
      // create-checkout-session-by-token call, since hasActiveAuthorization
      // only ever checks for status = 'authorized'.
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const existing = await getAuthorizationByPaymentIntent(paymentIntent.id);
        if (!existing) {
          console.error('payment_intent.payment_failed for unknown PaymentIntent', paymentIntent.id);
          break;
        }
        if (existing.status !== 'pending') {
          // Already resolved by another event (e.g. a concurrent
          // cancellation) — leave it as-is rather than overwrite.
          break;
        }
        await applyTerminalStatus(existing.id, 'pending', {
          status: 'failed',
          reason: paymentIntent.last_payment_error?.message || 'Payment attempt failed',
          at: new Date().toISOString(),
        });
        break;
      }

      // The Checkout Session's own 24-hour window lapsed with no payment
      // ever completed — distinct from a PaymentIntent that was genuinely
      // authorized and later expired after 7 days uncaptured.
      case 'checkout.session.expired': {
        const session = event.data.object;
        const existing = await getAuthorizationBySession(session.id);
        if (!existing) {
          console.error('checkout.session.expired for unknown session', session.id);
          break;
        }
        if (existing.status !== 'pending') break; // already resolved otherwise
        await applyTerminalStatus(existing.id, 'pending', {
          status: 'failed',
          reason: 'Checkout session expired without completing payment',
          at: new Date().toISOString(),
        });
        break;
      }

      // Covers two distinct cases, told apart by the row's status BEFORE
      // this event, not by cancellation_reason alone:
      //   - was 'authorized' (really did reach requires_capture, Stripe
      //     now reports it canceled) -> a real authorization was lost.
      //     'expired' if Stripe's automatic 7-day expiry, 'canceled' if
      //     an explicit cancellation.
      //   - was 'pending' (never reached requires_capture at all) -> this
      //     was never a real authorization in the first place; 'failed',
      //     not 'expired', so it doesn't read as "a hold was lost" when
      //     none ever existed.
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        const existing = await getAuthorizationByPaymentIntent(paymentIntent.id);
        if (!existing) {
          console.error('payment_intent.canceled for unknown PaymentIntent', paymentIntent.id);
          break;
        }

        const reason = paymentIntent.cancellation_reason || null;
        if (existing.status === 'authorized') {
          const applied = await applyTerminalStatus(existing.id, 'authorized', {
            status: reason === 'automatic' ? 'expired' : 'canceled',
            reason,
            at: new Date().toISOString(),
          });

          // A real authorization was just lost — reopen booking_details
          // for a new payment attempt. metadata.reference_id is set on the
          // PaymentIntent at session creation (bookingRouter.js), so it's
          // available directly on this event without an extra lookup.
          if (applied) {
            const referenceId = paymentIntent.metadata?.reference_id;
            if (referenceId) {
              try {
                await unlockBookingDetailsAfterAuthorizationLoss(referenceId);
              } catch (unlockErr) {
                console.error(`Failed to unlock booking_details for ${referenceId} after authorization loss:`, unlockErr);
              }
            } else {
              console.error(`payment_intent.canceled for ${paymentIntent.id} has no metadata.reference_id — cannot unlock booking_details.`);
            }
          }
        } else if (existing.status === 'pending') {
          await applyTerminalStatus(existing.id, 'pending', {
            status: 'failed',
            reason,
            at: new Date().toISOString(),
          });
        }
        // Any other existing status: already terminal, nothing to do —
        // duplicate or out-of-order delivery of an event whose outcome
        // was already applied.
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
