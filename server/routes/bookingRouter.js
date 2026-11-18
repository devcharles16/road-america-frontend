import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import supabase from '../supabaseClient.js';
import { verifyBookingToken } from '../utils/bookingLinks.js';
import { syncSelectedPackageToHubspot } from '../utils/hubspotTickets.js';
import { getStripeClient } from '../utils/stripeClient.js';
import { hasActiveAuthorization, recordPendingAuthorization } from '../utils/paymentAuthorizations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const normalizeEmail = s => String(s || '').trim().toLowerCase();
const validRef = s => /^RA-\d{5,12}$/i.test(String(s || ''));
const safe = s => String(s ?? '').trim();

// Maps the real `quotes` columns to the fields this router needs. The five
// pricing columns are written by the HubSpot pricing-sync webhook
// (server/routes/hubspotSyncRouter.js) — until that sync runs for a given
// quote, pricingStatus is null here, which correctly fails closed below.
async function getQuote(referenceId) {
  const { data, error } = await supabase.from('quotes').select('*').eq('reference_id', referenceId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    reference: data.reference_id,
    email: normalizeEmail(data.customer_email),
    vehicle: [data.vehicle_year, data.vehicle_make, data.vehicle_model].filter(Boolean).join(' '),
    pickup: [data.pickup_city, data.pickup_state].filter(Boolean).join(', '),
    delivery: [data.delivery_city, data.delivery_state].filter(Boolean).join(', '),
    transport: data.transport_type || 'Open transport',
    pickupWindow: data.pickup_window || 'To be confirmed',
    silverTotal: data.silver_total_price,
    silverFee: data.silver_paid_to_ra,
    silverCarrier: data.silver_paid_to_carrier,
    goldTotal: data.gold_total_price,
    pricingStatus: data.pricing_status,
    runningCondition: data.running_condition,
    modifications: data.vehicle_height_mod,
  };
}

function isBookable(quote) {
  return safe(quote?.pricingStatus).toLowerCase() === 'approved';
}

function quoteToResponse(quote, pkg) {
  return {
    reference: quote.reference,
    vehicle: quote.vehicle,
    pickup: quote.pickup,
    delivery: quote.delivery,
    transport: quote.transport,
    pickupWindow: quote.pickupWindow,
    package: pkg,
    total: pkg === 'silver' ? quote.silverTotal : quote.goldTotal,
    fee: pkg === 'silver' ? quote.silverFee : quote.goldTotal,
    carrier: pkg === 'silver' ? quote.silverCarrier : 0,
  };
}

router.get('/silver', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/booking.html'));
});
router.get('/gold', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/booking.html'));
});

// Primary path: the signed link HubSpot sends the customer. No email
// re-entry needed — the token itself is the credential, and it's bound to
// exactly one reference id, so it can't be used to reach another customer's
// quote (see server/utils/bookingLinks.js).
router.post('/api/lookup-by-token', async (req, res) => {
  try {
    const pkg = req.body?.package;
    if (!['silver', 'gold'].includes(pkg)) return res.status(400).json({ error: 'Invalid package.' });

    const result = verifyBookingToken(req.body?.token);
    if (!result.valid) {
      if (result.reason === 'expired') {
        return res.status(401).json({ error: 'This booking link has expired.', expired: true, reference: result.referenceId });
      }
      return res.status(401).json({ error: 'This booking link is not valid.' });
    }

    const quote = await getQuote(result.referenceId);
    if (!quote) return res.status(404).json({ error: 'We could not find that quote.' });
    if (!isBookable(quote)) return res.status(409).json({ error: 'This quote requires review. Please contact our team.' });

    const total = pkg === 'silver' ? quote.silverTotal : quote.goldTotal;
    if (total == null || total === '') return res.status(409).json({ error: 'Pricing is not ready. Please contact our team.' });

    res.json(quoteToResponse(quote, pkg));
  } catch (err) {
    console.error('Booking token lookup error', err);
    res.status(500).json({ error: 'Unable to retrieve your quote right now.' });
  }
});

// Fallback path: manual quote reference + email entry, for links that have
// expired or were never followed directly (e.g. forwarded without the
// query string). Weaker than the signed-link path — kept only as a
// fallback, not the primary mechanism, per the prior security review.
router.post('/api/lookup', async (req, res) => {
  try {
    const reference = safe(req.body.reference).toUpperCase();
    const email = normalizeEmail(req.body.email);
    if (!validRef(reference) || !email || email.length > 254) return res.status(400).json({ error: 'Enter your quote reference and email.' });
    const quote = await getQuote(reference);
    if (!quote || !quote.email || quote.email !== email) return res.status(404).json({ error: 'We could not verify that quote and email combination.' });
    if (!isBookable(quote)) return res.status(409).json({ error: 'This quote requires review. Please contact our team.' });
    const pkg = req.body.package;
    if (!['silver', 'gold'].includes(pkg)) return res.status(400).json({ error: 'Invalid package.' });
    const total = pkg === 'silver' ? quote.silverTotal : quote.goldTotal;
    if (total == null || total === '') return res.status(409).json({ error: 'Pricing is not ready. Please contact our team.' });
    res.json(quoteToResponse(quote, pkg));
  } catch (err) {
    console.error('Booking lookup error', err);
    res.status(500).json({ error: 'Unable to retrieve your quote right now.' });
  }
});

async function confirmSelection({ reference, email, pkg }) {
  const quote = await getQuote(reference);
  if (!quote) return { status: 404, body: { error: 'Quote could not be verified.' } };
  if (email && (!quote.email || quote.email !== email)) return { status: 404, body: { error: 'Quote could not be verified.' } };
  if (!isBookable(quote)) return { status: 409, body: { error: 'This quote requires manual review.' } };

  const price = pkg === 'silver' ? quote.silverTotal : quote.goldTotal;
  if (price == null || price === '') return { status: 409, body: { error: 'Pricing is not ready.' } };

  // Plain insert, not upsert — lets us distinguish "you already picked this
  // same package" (idempotent, succeed) from "you already picked the OTHER
  // package" (conflict, must not silently overwrite). The unique(reference_id)
  // constraint on booking_selections makes "first confirmed selection wins"
  // safe under concurrent requests: Postgres guarantees exactly one of two
  // racing inserts for the same reference_id succeeds.
  const { error: insertErr } = await supabase
    .from('booking_selections')
    .insert({ reference_id: reference, package: pkg, customer_email: email || quote.email });

  if (!insertErr) {
    // Fire only after the Supabase insert has actually succeeded. Not
    // awaited-and-propagated as an error — a HubSpot sync failure must not
    // turn into a failed booking confirmation for the customer, and a later
    // resubmit of this same confirmation will retry it (see below).
    await syncSelectedPackageToHubspot(reference, pkg);
    return { status: 200, body: { ok: true, message: 'Your package selection has been received. Our team will follow up with next steps.' } };
  }

  if (insertErr.code === '23505') {
    const { data: existing, error: selectErr } = await supabase
      .from('booking_selections')
      .select('package')
      .eq('reference_id', reference)
      .maybeSingle();
    if (selectErr) throw selectErr;

    if (existing?.package === pkg) {
      // Same package, resubmitted (double-click, retry, etc.) — idempotent.
      // Re-synced to HubSpot too, so a prior sync failure gets a retry.
      await syncSelectedPackageToHubspot(reference, pkg);
      return { status: 200, body: { ok: true, message: 'Your package selection has been received. Our team will follow up with next steps.' } };
    }
    return {
      status: 409,
      body: { error: `A package has already been selected for this quote (${existing?.package || 'unknown'}). Contact us if you need to change it.` },
    };
  }

  throw insertErr;
}

router.post('/api/confirm-by-token', async (req, res) => {
  try {
    const pkg = safe(req.body?.package).toLowerCase();
    if (!['silver', 'gold'].includes(pkg)) return res.status(400).json({ error: 'Invalid request.' });

    const result = verifyBookingToken(req.body?.token);
    if (!result.valid) {
      if (result.reason === 'expired') return res.status(401).json({ error: 'This booking link has expired.', expired: true });
      return res.status(401).json({ error: 'This booking link is not valid.' });
    }

    const outcome = await confirmSelection({ reference: result.referenceId, email: null, pkg });
    res.status(outcome.status).json(outcome.body);
  } catch (err) {
    console.error('Booking confirmation error', err);
    res.status(500).json({ error: 'We could not confirm your selection. Please contact our team.' });
  }
});

router.post('/api/confirm', async (req, res) => {
  try {
    const reference = safe(req.body.reference).toUpperCase();
    const email = normalizeEmail(req.body.email);
    const pkg = safe(req.body.package).toLowerCase();
    if (!validRef(reference) || !email || !['silver', 'gold'].includes(pkg)) return res.status(400).json({ error: 'Invalid request.' });

    const outcome = await confirmSelection({ reference, email, pkg });
    res.status(outcome.status).json(outcome.body);
  } catch (err) {
    console.error('Booking confirmation error', err);
    res.status(500).json({ error: 'We could not confirm your selection. Please contact our team.' });
  }
});

// Creates a Stripe Checkout Session (manual capture — an authorization
// hold, never an immediate charge) for the package already confirmed in
// booking_selections. The amount and package are both read server-side
// from Supabase, never from the request body — req.body.package, if a
// client ever sent one, is never consulted anywhere in this handler.
router.post('/api/create-checkout-session-by-token', async (req, res) => {
  try {
    const result = verifyBookingToken(req.body?.token);
    if (!result.valid) {
      if (result.reason === 'expired') return res.status(401).json({ error: 'This booking link has expired.', expired: true });
      return res.status(401).json({ error: 'This booking link is not valid.' });
    }
    const referenceId = result.referenceId;

    const quote = await getQuote(referenceId);
    if (!quote) return res.status(404).json({ error: 'We could not find that quote.' });
    if (!isBookable(quote)) return res.status(409).json({ error: 'This quote requires review. Please contact our team.' });

    const { data: selection, error: selectionErr } = await supabase
      .from('booking_selections')
      .select('package')
      .eq('reference_id', referenceId)
      .maybeSingle();
    if (selectionErr) throw selectionErr;
    if (!selection) return res.status(409).json({ error: 'Please select a package before continuing to payment.' });
    const pkg = selection.package;

    if (await hasActiveAuthorization(referenceId)) {
      return res.status(409).json({ error: 'This booking has already been authorized for payment.' });
    }

    const amount = pkg === 'silver' ? quote.silverFee : quote.goldTotal;
    if (amount == null || amount === '') return res.status(409).json({ error: 'Pricing is not ready. Please contact our team.' });
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      console.error('Invalid authorization amount for', referenceId, amount);
      return res.status(500).json({ error: 'Unable to start payment authorization right now.' });
    }

    const baseUrl = process.env.BOOKING_SITE_URL || 'https://www.roadamericatransport.com';
    const rawToken = req.body.token;
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      client_reference_id: referenceId,
      metadata: { reference_id: referenceId, package: pkg },
      payment_intent_data: {
        capture_method: 'manual',
        metadata: { reference_id: referenceId, package: pkg },
      },
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${pkg === 'gold' ? 'Gold' : 'Silver'} package booking authorization — ${referenceId}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/book/${pkg}?token=${encodeURIComponent(rawToken)}&payment=success`,
      cancel_url: `${baseUrl}/book/${pkg}?token=${encodeURIComponent(rawToken)}&payment=canceled`,
    });

    await recordPendingAuthorization({
      referenceId,
      pkg,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: session.payment_intent || null,
      amountCents,
      currency: 'usd',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Create checkout session error', err);
    res.status(500).json({ error: 'Unable to start payment authorization right now.' });
  }
});

// Lets booking.html poll the real, server-confirmed authorization status
// after returning from Stripe Checkout — the redirect itself proves
// nothing (a customer can navigate to the success URL without having
// completed payment), so this is what the UI actually trusts, not the
// URL it landed on. Returns the most recent attempt for this reference,
// since repeated checkout attempts are expected (abandoned sessions).
router.post('/api/payment-status-by-token', async (req, res) => {
  try {
    const result = verifyBookingToken(req.body?.token);
    if (!result.valid) {
      if (result.reason === 'expired') return res.status(401).json({ error: 'This booking link has expired.', expired: true });
      return res.status(401).json({ error: 'This booking link is not valid.' });
    }

    const { data, error } = await supabase
      .from('payment_authorizations')
      .select('status, package, amount_cents, authorized_at')
      .eq('reference_id', result.referenceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    res.json({ authorization: data || null });
  } catch (err) {
    console.error('Payment status lookup error', err);
    res.status(500).json({ error: 'Unable to check payment status right now.' });
  }
});

export default router;
