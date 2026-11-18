// Supabase access for payment_authorizations. Plain table, no custom
// Postgres functions — see payment_authorizations_setup.sql for why that's
// sufficient here (unlike booking_details). Every write is WHERE-guarded
// so duplicate or out-of-order Stripe webhook delivery is a safe no-op,
// never a wrong overwrite of an already-authorized row — see each
// function's comment for exactly how.
import supabase from '../supabaseClient.js';

export async function hasActiveAuthorization(referenceId) {
  const { data, error } = await supabase
    .from('payment_authorizations')
    .select('id')
    .eq('reference_id', referenceId)
    .eq('status', 'authorized')
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function recordPendingAuthorization({
  referenceId, pkg, stripeCheckoutSessionId, stripePaymentIntentId, amountCents, currency, livemode,
}) {
  const { error } = await supabase.from('payment_authorizations').insert({
    reference_id: referenceId,
    package: pkg,
    stripe_checkout_session_id: stripeCheckoutSessionId,
    stripe_payment_intent_id: stripePaymentIntentId,
    amount_cents: amountCents,
    currency,
    livemode,
    status: 'pending',
  });
  if (error) throw error;
}

/**
 * Marks a session's row authorized. WHERE status = 'pending' is what makes
 * this safe against both duplicate delivery (a second checkout.session.
 * completed for the same session finds the row already 'authorized', not
 * 'pending', and no-ops) and out-of-order delivery (if a cancellation was
 * somehow processed first, the row is 'canceled'/'failed', not 'pending',
 * so this also no-ops rather than resurrecting it back to 'authorized').
 */
export async function markAuthorized(stripeCheckoutSessionId, { authorizedAt, expiresAtEstimate }) {
  const { data, error } = await supabase
    .from('payment_authorizations')
    .update({
      status: 'authorized',
      authorized_at: authorizedAt,
      expires_at_estimate: expiresAtEstimate,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', stripeCheckoutSessionId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/**
 * Marks a session's row as a confirmed amount mismatch — reached
 * requires_capture, but the authorized amount no longer matches what the
 * quote/package currently compute to. Never auto-resolved; status stays
 * here until a human investigates. Same WHERE-guard reasoning as
 * markAuthorized.
 */
export async function markAmountMismatch(stripeCheckoutSessionId, { detail }) {
  const { data, error } = await supabase
    .from('payment_authorizations')
    .update({
      status: 'amount_mismatch',
      status_reason: detail,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', stripeCheckoutSessionId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/**
 * Finds the current row for a PaymentIntent, so the caller can branch on
 * its existing status before deciding a target status — see
 * stripeWebhookRouter.js for why this matters (distinguishing "was
 * genuinely authorized, now canceled/expired" from "never got authorized
 * at all, this is just a failed/abandoned attempt").
 */
export async function getAuthorizationByPaymentIntent(stripePaymentIntentId) {
  const { data, error } = await supabase
    .from('payment_authorizations')
    .select('id, status')
    .eq('stripe_payment_intent_id', stripePaymentIntentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Finds the current row for a Checkout Session (used by checkout.session.
 * expired, which has no payment_intent reliably available on an
 * abandoned/never-started session).
 */
export async function getAuthorizationBySession(stripeCheckoutSessionId) {
  const { data, error } = await supabase
    .from('payment_authorizations')
    .select('id, status')
    .eq('stripe_checkout_session_id', stripeCheckoutSessionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Applies a terminal status transition, guarded by the exact prior status
 * the caller read (optimistic concurrency) — if the row has moved on since
 * (e.g. a concurrent webhook already resolved it), this is a safe no-op:
 * the WHERE won't match, 0 rows change, and whichever webhook delivery
 * actually reflects Stripe's current truth will have already applied (or
 * will on its own retry). This is what lets the caller safely branch
 * "was authorized -> canceled/expired" vs "was never authorized -> failed"
 * without a race against a concurrent authorization.
 */
export async function applyTerminalStatus(id, fromStatus, { status, reason, at }) {
  const update = { status, status_reason: reason || null, updated_at: new Date().toISOString() };
  if (status === 'canceled' || status === 'expired' || status === 'failed') update.canceled_at = at;

  const { data, error } = await supabase
    .from('payment_authorizations')
    .update(update)
    .eq('id', id)
    .eq('status', fromStatus)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return !!data;
}
