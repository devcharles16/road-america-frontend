// Supabase access for payment_authorizations. Plain table, no custom
// Postgres functions — see payment_authorizations_setup.sql for why that's
// sufficient here (unlike booking_details). Every write is WHERE-guarded
// so duplicate or out-of-order Stripe webhook delivery is a safe no-op,
// never a wrong overwrite of an already-authorized row — see each
// function's comment for exactly how.
import supabase from '../supabaseClient.js';

// 'authorized' alone used to be the only active state. Now that capture
// exists, 'capturing' (in flight), 'captured' (done — must never be
// re-authorized), and 'capture_uncertain' (unresolved — must not be
// re-authorized while the real outcome is still unknown) are active too.
// Matches exactly what payment_authorizations_active_reference_idx
// enforces at the database layer — this is the application-level mirror
// of that same rule, not a separate decision.
const ACTIVE_AUTHORIZATION_STATUSES = ['authorized', 'capturing', 'captured', 'capture_uncertain'];

export async function hasActiveAuthorization(referenceId) {
  const { data, error } = await supabase
    .from('payment_authorizations')
    .select('id')
    .eq('reference_id', referenceId)
    .in('status', ACTIVE_AUTHORIZATION_STATUSES)
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
 *
 * stripePaymentIntentId must be the ID the caller already independently
 * verified via stripe.paymentIntents.retrieve() (see stripeWebhookRouter.js)
 * — persisted here so the row reflects the actual confirmed PaymentIntent,
 * not whatever (possibly absent) value was captured at session-creation
 * time.
 */
export async function markAuthorized(stripeCheckoutSessionId, { stripePaymentIntentId, authorizedAt, expiresAtEstimate }) {
  const { data, error } = await supabase
    .from('payment_authorizations')
    .update({
      status: 'authorized',
      stripe_payment_intent_id: stripePaymentIntentId,
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
 * Pure selection logic for stripeWebhookRouter.js's duplicate-authorization
 * defense: given every row currently 'authorized' for one reference_id,
 * decides which one to keep (the earliest by authorized_at — the first
 * authorization to actually land, regardless of the order rows happen to
 * be passed in) and which are duplicates to cancel. Takes no dependency on
 * Supabase or Stripe so it can be unit tested directly.
 */
export function selectDuplicateAuthorizations(authorizedRows) {
  if (!authorizedRows || authorizedRows.length < 2) return { keep: authorizedRows?.[0] || null, duplicates: [] };
  const sorted = [...authorizedRows].sort((a, b) => new Date(a.authorized_at) - new Date(b.authorized_at));
  const [keep, ...duplicates] = sorted;
  return { keep, duplicates };
}

/**
 * Marks a row as a detected duplicate: it independently reached
 * 'authorized', but another row for the same reference_id got there
 * first. Guarded by WHERE status = 'authorized' so this is a safe no-op
 * if a concurrent/retried delivery of the same detection already applied
 * it (or moved it on some other way) — matches applyTerminalStatus's
 * optimistic-concurrency reasoning. The caller is responsible for also
 * canceling the underlying Stripe PaymentIntent (see
 * stripeWebhookRouter.js) — this function only ever updates this table.
 */
export async function markDuplicateCanceled(id, reason) {
  const { error } = await supabase
    .from('payment_authorizations')
    .update({
      status: 'duplicate_canceled',
      status_reason: reason,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'authorized');
  if (error) throw error;
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

/**
 * Claims the one authorized row for this reference for a capture attempt,
 * atomically flipping it to 'capturing'. WHERE status = 'authorized' is
 * the entire duplicate-capture safeguard: two near-simultaneous requests
 * (a real double-click, or the HubSpot workflow re-firing) can't both
 * match this UPDATE, so at most one ever proceeds to call Stripe. Backed
 * at the database layer by payment_authorizations_active_reference_idx,
 * which also now covers 'capturing'/'captured'/'capture_uncertain' — see
 * payment_authorizations_capture.sql.
 *
 * Returns the row's own id, package, amount_cents, and
 * stripe_payment_intent_id on success (never trust a PaymentIntent ID or
 * amount supplied by the caller — this is the only place those values
 * come from), or null if there was nothing to claim (never authorized,
 * already capturing/captured/uncertain, or a confirmed capture_failed
 * that would need a fresh authorization first).
 */
export async function beginCapture(referenceId) {
  const { data, error } = await supabase
    .from('payment_authorizations')
    .update({ status: 'capturing', updated_at: new Date().toISOString() })
    .eq('reference_id', referenceId)
    .eq('status', 'authorized')
    .select('id, package, amount_cents, stripe_payment_intent_id')
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Read-only — used only when beginCapture() found nothing to claim, to
 * report WHY (already captured, mid-capture, confirmed failed, or
 * unresolved) instead of a single generic "nothing to capture" message.
 * Returns the most recently created row for this reference, or null if
 * there's never been one at all.
 */
export async function getLatestAuthorization(referenceId) {
  const { data, error } = await supabase
    .from('payment_authorizations')
    .select('status, captured_amount_cents, captured_at')
    .eq('reference_id', referenceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Confirmed success — either from the direct capture() response, or from
 * an explicit follow-up retrieve() after an ambiguous/timeout response.
 * WHERE status = 'capturing' guards against this running twice for the
 * same row.
 */
export async function markCaptured(id, { capturedAmountCents, capturedAt }) {
  const { error } = await supabase
    .from('payment_authorizations')
    .update({
      status: 'captured',
      captured_amount_cents: capturedAmountCents,
      captured_at: capturedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'capturing');
  if (error) throw error;
}

/**
 * A clear, certain answer that the capture did not happen — either a
 * direct rejection from Stripe (not ambiguous — see
 * isAmbiguousStripeError in stripeClient.js), or an ambiguous response
 * that a follow-up retrieve() then confirmed was never actually applied.
 * Deliberately does NOT reset status back to 'authorized' — a fresh
 * authorization attempt (a brand new row) is what makes a retry
 * possible, never an automatic reset of this one.
 */
export async function markCaptureFailed(id, reason) {
  const { error } = await supabase
    .from('payment_authorizations')
    .update({
      status: 'capture_failed',
      status_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'capturing');
  if (error) throw error;
}

/**
 * The capture outcome could not be determined — an ambiguous/timeout
 * response from capture(), AND the follow-up retrieve() either also
 * failed or returned something that doesn't clearly answer the
 * question. Per explicit requirement, this is a dead end: nothing in
 * this codebase ever moves a row out of this status automatically,
 * including back to 'authorized'. Resolving it requires a human to
 * check Stripe directly.
 */
export async function markCaptureUncertain(id, reason) {
  const { error } = await supabase
    .from('payment_authorizations')
    .update({
      status: 'capture_uncertain',
      status_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'capturing');
  if (error) throw error;
}
