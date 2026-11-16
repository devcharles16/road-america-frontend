import express from 'express';
import supabase from '../supabaseClient.js';
import { generateBookingUrls } from '../utils/bookingLinks.js';

const router = express.Router();

const APPROVED_VALUE = process.env.HUBSPOT_APPROVED_STATUS_VALUE || 'Approved';
const WEBHOOK_SECRET = process.env.HUBSPOT_SYNC_WEBHOOK_SECRET;

function requireWebhookSecret(req, res, next) {
  if (!WEBHOOK_SECRET) {
    console.error('HUBSPOT_SYNC_WEBHOOK_SECRET is not configured on the server.');
    return res.status(500).json({ error: 'Sync endpoint is not configured.' });
  }
  const provided = req.get('X-Webhook-Secret');
  if (!provided || provided !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

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
      .select('id, reference_id, pricing_synced_at')
      .eq('reference_id', quoteNumber)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!quote) return res.status(404).json({ error: 'No quote matches that reference.' });

    // Reject stale/duplicate/out-of-order automation runs: only apply this
    // update if it is strictly newer than whatever we last applied for this
    // quote. This is what stops an older "Approved" event that arrives late
    // from clobbering a newer "Review Required" state.
    if (quote.pricing_synced_at && new Date(quote.pricing_synced_at).getTime() >= lastModified.getTime()) {
      return res.status(200).json({ ok: true, applied: false, reason: 'stale_or_duplicate' });
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

function safe(s) {
  return String(s ?? '').trim();
}
function safeUpper(s) {
  return safe(s).toUpperCase();
}

export default router;
