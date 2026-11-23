import express from 'express';
import supabase from '../supabaseClient.js';
import { generateBookingUrls } from '../utils/bookingLinks.js';
import { getStripeClient, isAmbiguousStripeError } from '../utils/stripeClient.js';
import { beginCapture, getLatestAuthorization, markCaptured, markCaptureFailed, markCaptureUncertain } from '../utils/paymentAuthorizations.js';
import { finalizeCaptureOutcome } from '../utils/hubspotTickets.js';

const router = express.Router();

const APPROVED_VALUE = process.env.HUBSPOT_APPROVED_STATUS_VALUE || 'Approved';

// Each HubSpot-triggered endpoint gets its own secret, so one can be
// rotated without affecting the other — the capture endpoint moves real
// money and deliberately doesn't share a trust boundary with the pricing
// sync.
function requireSharedSecret(envVarName) {
  return (req, res, next) => {
    const expected = process.env[envVarName];
    if (!expected) {
      console.error(`${envVarName} is not configured on the server.`);
      return res.status(500).json({ error: 'Sync endpoint is not configured.' });
    }
    const provided = req.get('X-Webhook-Secret');
    if (!provided || provided !== expected) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    next();
  };
}

const requireWebhookSecret = requireSharedSecret('HUBSPOT_SYNC_WEBHOOK_SECRET');
const requireCaptureWebhookSecret = requireSharedSecret('HUBSPOT_CAPTURE_WEBHOOK_SECRET');

function toNumberOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * POST /api/integrations/hubspot-pricing
 *
 * Called by Zapier whenever a HubSpot ticket's CD Pricing Status property
 * changes. See the summary for the exact Zap configuration this expects
 * (trigger scoping, payload shape, and why hs_lastmodifieddate must come
 * from the trigger step itself, not a re-fetched "current ticket" lookup).
 */
router.post('/hubspot-pricing', requireWebhookSecret, async (req, res) => {
  try {
    const body = req.body || {};

    const quoteNumber = safeUpper(body.quote_number);
    if (!/^RA-\d{5,12}$/i.test(quoteNumber)) {
      return res.status(400).json({ error: 'quote_number is missing or not a valid RA reference.' });
    }

    const lastModified = body.hs_lastmodifieddate ? new Date(body.hs_lastmodifieddate) : null;
    if (!lastModified || Number.isNaN(lastModified.getTime())) {
      return res.status(400).json({ error: 'hs_lastmodifieddate is missing or not a valid date.' });
    }

    const { data: quote, error: fetchErr } = await supabase
      .from('quotes')
      .select('id, reference_id, pricing_synced_at, pricing_status')
      .eq('reference_id', quoteNumber)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!quote) return res.status(404).json({ error: 'No quote matches that reference.' });

    // Reject stale/duplicate/out-of-order automation runs: only apply this
    // update if it is strictly newer than whatever we last applied for this
    // quote. This is what stops an older "Approved" event that arrives late
    // from clobbering a newer "Review Required" state. Pricing itself is
    // NEVER re-applied here, regardless of what's in this request's body —
    // that's the whole point of this guard.
    if (quote.pricing_synced_at && new Date(quote.pricing_synced_at).getTime() >= lastModified.getTime()) {
      // Still safe to hand back booking URLs on a duplicate, but only if
      // the quote is ALREADY approved from whatever sync actually applied
      // this pricing_synced_at value. The signed link encodes no pricing
      // data (see bookingLinks.js) — regenerating it here trusts nothing
      // from this (possibly stale) request body, only the quote's current,
      // already-safely-set pricing_status. Never generated for anything
      // other than a currently-approved quote.
      const alreadyApproved = safe(quote.pricing_status).toLowerCase() === 'approved';
      const bookingUrls = alreadyApproved ? generateBookingUrls(quote.reference_id) : {};
      return res.status(200).json({ ok: true, applied: false, reason: 'stale_or_duplicate', ...bookingUrls });
    }

    const cdStatusRaw = safe(body.cd_pricing_status);
    const isApproved = cdStatusRaw.toLowerCase() === APPROVED_VALUE.toLowerCase();

    const goldTotal = toNumberOrNull(body.gold_package__total_price);
    const silverTotal = toNumberOrNull(body.silver_package__total_price);
    const silverToRa = toNumberOrNull(body.silver_package__paid_to_ra);
    const silverToCarrier = toNumberOrNull(body.silver_package__paid_to_carrier);
    const pricingComplete = goldTotal != null && silverTotal != null && silverToRa != null && silverToCarrier != null;

    const bookable = isApproved && pricingComplete;

    const update = {
      gold_total_price: goldTotal,
      silver_total_price: silverTotal,
      silver_paid_to_ra: silverToRa,
      silver_paid_to_carrier: silverToCarrier,
      pricing_synced_at: lastModified.toISOString(),
      // Explicitly revokes booking eligibility the moment HubSpot no longer
      // says Approved, or if the pricing fields aren't all valid yet — this
      // table has no other place that ever sets pricing_status, so there's
      // no other path by which eligibility could be silently restored.
      pricing_status: bookable ? 'approved' : (cdStatusRaw || 'review_required'),
    };

    const { error: updateErr } = await supabase.from('quotes').update(update).eq('id', quote.id);
    if (updateErr) throw updateErr;

    if (isApproved && !pricingComplete) {
      // Recorded as not-bookable above, but this combination (Approved +
      // incomplete pricing) is a genuine anomaly worth surfacing in the Zap's
      // run history rather than silently swallowing.
      return res.status(422).json({
        ok: true,
        applied: true,
        pricingStatus: update.pricing_status,
        error: 'Status is Approved but one or more pricing fields are missing or invalid; booking eligibility was not granted.',
      });
    }

    const bookingUrls = bookable ? generateBookingUrls(quote.reference_id) : {};
    return res.status(200).json({ ok: true, applied: true, pricingStatus: update.pricing_status, ...bookingUrls });
  } catch (err) {
    console.error('HubSpot pricing sync error', err);
    return res.status(500).json({ error: 'Unable to process pricing sync.' });
  }
});

// Maps a row's current status, when beginCapture() found nothing to
// claim, to one of this endpoint's distinguished outcomes.
const STATUS_TO_RESULT = {
  captured: 'already_captured',
  capturing: 'capture_in_progress',
  capture_failed: 'capture_failed',
  capture_uncertain: 'capture_uncertain',
};

const RESULT_MESSAGES = {
  already_captured: 'This booking has already been captured.',
  capture_in_progress: 'A capture is already in progress for this booking. Try again shortly.',
  capture_failed:
    'The prior authorization could not be captured (expired, canceled, or rejected). A new authorization is required before capture can be attempted again.',
  capture_uncertain:
    'A previous capture attempt for this booking has an uncertain outcome and requires manual review in Stripe before any further action.',
  no_active_authorization: 'No active authorization is available to capture for this reference.',
};

// 'captured' and 'already_captured' are not errors — the money is
// authorized-and-captured either way, which is the actually-desired end
// state. Everything else needs some other action (wait, re-authorize, or
// a human in Stripe) before it can be resolved.
const RESULT_HTTP_STATUS = {
  captured: 200,
  already_captured: 200,
  capture_in_progress: 409,
  capture_failed: 409,
  capture_uncertain: 409,
  no_active_authorization: 409,
};

function captureResponse(res, result, extra = {}) {
  return res.status(RESULT_HTTP_STATUS[result] || 500).json({ result, message: RESULT_MESSAGES[result], ...extra });
}

/**
 * POST /api/integrations/hubspot-capture-request
 *
 * Called by a HubSpot workflow when an authorized employee sets the
 * Payment Capture Request property to "Request Capture". HubSpot is
 * trusted for exactly two things here — that a capture was requested for
 * this reference, and optionally which ticket asked (validated against
 * the reference before ever being used — see resolveTicketId) — nothing
 * else: the PaymentIntent ID, the amount, and the authorization's
 * current status are always looked up server-side from
 * payment_authorizations, never accepted from this request body.
 *
 * Every response carries a `result` the Zap can branch on directly:
 * captured, already_captured, capture_in_progress, capture_failed,
 * capture_uncertain, no_active_authorization, invalid_request, or
 * server_error (see README/deployment notes for the full table).
 */
router.post('/hubspot-capture-request', requireCaptureWebhookSecret, async (req, res) => {
  const referenceId = safeUpper(req.body?.quote_number);
  const ticketId = req.body?.ticket_id ? String(req.body.ticket_id).trim() : null;

  if (!/^RA-\d{5,12}$/i.test(referenceId)) {
    // No valid reference to look anything up by, and nothing to validate
    // a supplied ticket id against — deliberately not attempting any
    // HubSpot write here (including the reset): a malformed request
    // means the Zap itself is misconfigured, and leaving the ticket at
    // "Request Capture" is an honest, visible signal of that, same
    // reasoning as the unexpected-error path below.
    return res.status(400).json({ result: 'invalid_request', message: 'quote_number is missing or not a valid RA reference.' });
  }

  try {
    const claimed = await beginCapture(referenceId);
    if (!claimed) {
      const latest = await getLatestAuthorization(referenceId);
      const result = STATUS_TO_RESULT[latest?.status] || 'no_active_authorization';

      const extra = {};
      if (result === 'already_captured' && latest) {
        extra.amountCents = latest.captured_amount_cents;
        extra.capturedAt = latest.captured_at;
      }

      await finalizeCaptureOutcome(referenceId, {
        ticketId,
        result,
        amountCents: extra.amountCents,
        capturedAt: extra.capturedAt,
        error: result === 'already_captured' ? null : RESULT_MESSAGES[result],
      });
      return captureResponse(res, result, extra);
    }

    const stripe = getStripeClient();
    const idempotencyKey = `capture_${claimed.id}`;

    let captureResult;
    try {
      captureResult = await stripe.paymentIntents.capture(
        claimed.stripe_payment_intent_id,
        { amount_to_capture: claimed.amount_cents },
        { idempotencyKey }
      );
    } catch (captureErr) {
      if (!isAmbiguousStripeError(captureErr)) {
        // A clear, certain rejection (e.g. the authorization already
        // expired or was canceled) — no ambiguity, no need to check again.
        const reason = captureErr.message || 'Stripe rejected the capture request.';
        await markCaptureFailed(claimed.id, reason);
        await finalizeCaptureOutcome(referenceId, { ticketId, result: 'capture_failed', error: reason });
        return captureResponse(res, 'capture_failed', { detail: reason });
      }

      // Ambiguous/timeout response — we genuinely don't know whether
      // Stripe applied the capture before the connection/response was
      // lost. Never assume either way: ask Stripe directly.
      let resolved;
      try {
        resolved = await stripe.paymentIntents.retrieve(claimed.stripe_payment_intent_id);
      } catch (retrieveErr) {
        const reason = `Capture response was ambiguous (${captureErr.message}) and the follow-up retrieve also failed (${retrieveErr.message}). Requires manual review in Stripe.`;
        await markCaptureUncertain(claimed.id, reason);
        await finalizeCaptureOutcome(referenceId, { ticketId, result: 'capture_uncertain', error: RESULT_MESSAGES.capture_uncertain });
        return captureResponse(res, 'capture_uncertain');
      }

      if (resolved.status === 'succeeded') {
        const capturedAt = new Date();
        const capturedAmountCents = resolved.amount_received ?? claimed.amount_cents;
        await markCaptured(claimed.id, { capturedAmountCents, capturedAt: capturedAt.toISOString() });
        await finalizeCaptureOutcome(referenceId, { ticketId, result: 'captured', amountCents: capturedAmountCents, capturedAt });
        return captureResponse(res, 'captured', { amountCents: capturedAmountCents, capturedAt });
      }

      // Confirmed NOT captured. Per explicit requirement, this never
      // resets the row back to 'authorized' — a fresh authorization (a
      // new row) is what makes a retry possible, not an automatic reset
      // of this one.
      const reason = `Capture attempt was ambiguous (${captureErr.message}); retrieve confirmed it was not captured (PaymentIntent status "${resolved.status}").`;
      await markCaptureFailed(claimed.id, reason);
      await finalizeCaptureOutcome(referenceId, { ticketId, result: 'capture_failed', error: 'Capture did not go through. Contact support before retrying.' });
      return captureResponse(res, 'capture_failed', { detail: reason });
    }

    if (captureResult.status === 'succeeded') {
      const capturedAt = new Date();
      const capturedAmountCents = captureResult.amount_received ?? claimed.amount_cents;
      await markCaptured(claimed.id, { capturedAmountCents, capturedAt: capturedAt.toISOString() });
      await finalizeCaptureOutcome(referenceId, { ticketId, result: 'captured', amountCents: capturedAmountCents, capturedAt });
      return captureResponse(res, 'captured', { amountCents: capturedAmountCents, capturedAt });
    }

    // capture() returned without throwing, but with a status other than
    // 'succeeded' — not expected, but handled conservatively as
    // uncertain rather than assumed failed, since no error was actually
    // raised.
    const reason = `Capture call returned without error but PaymentIntent status is "${captureResult.status}", not "succeeded". Requires manual review.`;
    await markCaptureUncertain(claimed.id, reason);
    await finalizeCaptureOutcome(referenceId, { ticketId, result: 'capture_uncertain', error: RESULT_MESSAGES.capture_uncertain });
    return captureResponse(res, 'capture_uncertain');
  } catch (err) {
    // A genuinely unexpected failure — deliberately does NOT call
    // finalizeCaptureOutcome: Payment Capture Request is left as
    // "Request Capture" rather than reset, so the stuck state itself is
    // a visible signal that this needs human attention, instead of
    // silently clearing it over an error nobody classified.
    console.error(`HubSpot capture request error for ${referenceId}:`, err);
    return res.status(500).json({ result: 'server_error', message: 'Unable to process capture request.' });
  }
});

function safe(s) {
  return String(s ?? '').trim();
}
function safeUpper(s) {
  return safe(s).toUpperCase();
}

export default router;
