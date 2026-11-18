// Supabase access for payment_authorizations. Plain table, no custom
// Postgres functions — see payment_authorizations_setup.sql for why that's
// sufficient here (unlike booking_details). Every write is WHERE-guarded
// so duplicate Stripe webhook delivery is a safe no-op, not a double-apply.
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
  referenceId, pkg, stripeCheckoutSessionId, stripePaymentIntentId, amountCents, currency,
}) {
  const { error } = await supabase.from('payment_authorizations').insert({
    reference_id: referenceId,
    package: pkg,
    stripe_checkout_session_id: stripeCheckoutSessionId,
    stripe_payment_intent_id: stripePaymentIntentId,
    amount_cents: amountCents,
    currency,
    status: 'pending',
  });
  if (error) throw error;
}

/**
 * Marks a session's row authorized. WHERE status = 'pending' makes this
 * idempotent against duplicate checkout.session.completed deliveries for
 * the same session — a second delivery finds 0 matching rows and is a
 * harmless no-op, never a double-apply.
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
 * Marks whichever row(s) match this PaymentIntent canceled/expired, per
 * Stripe's cancellation_reason. Idempotent by nature — re-applying the
 * same terminal state to an already-canceled row is harmless, so no
 * WHERE-status guard is needed here (unlike markAuthorized, this isn't
 * racing against a concurrent "wrong" transition, only against itself).
 */
export async function markCanceled(stripePaymentIntentId, { reason, canceledAt }) {
  const status = reason === 'automatic' ? 'expired' : 'canceled';
  const { error } = await supabase
    .from('payment_authorizations')
    .update({
      status,
      cancellation_reason: reason || null,
      canceled_at: canceledAt,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', stripePaymentIntentId);
  if (error) throw error;
}
