import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import supabase from '../supabaseClient.js';
import { verifyBookingToken } from '../utils/bookingLinks.js';
import { syncSelectedPackageToHubspot, syncBookingDetailsToHubspot } from '../utils/hubspotTickets.js';
import { getStripeClient } from '../utils/stripeClient.js';
import { hasActiveAuthorization, recordPendingAuthorization } from '../utils/paymentAuthorizations.js';
import { computeAuthorizationAmountCents, buildCheckoutIdempotencyKey } from '../utils/packagePricing.js';
import { validateBookingDetails, upsertBookingDetails, confirmBookingRevision } from '../utils/bookingDetails.js';
import { sendRouteChangeReviewAlert } from '../notifications/adminAlerts.js';

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

async function hasConfirmedSelection(referenceId) {
  const { data, error } = await supabase
    .from('booking_selections')
    .select('package')
    .eq('reference_id', referenceId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// Guided booking details: pickup/delivery address, contacts, vehicle
// availability, terms acceptance. Token-only — no email-fallback path.
// This step collects street addresses and phone numbers, which is more
// sensitive than the existing package-confirmation step, so it does not
// carry over the confirm/lookup routes' weaker email-fallback pattern.
router.post('/api/submit-details-by-token', async (req, res) => {
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
    if (!(await hasConfirmedSelection(referenceId))) {
      return res.status(409).json({ error: 'Please select a package before continuing.' });
    }

    const validation = validateBookingDetails(req.body || {});
    if (!validation.valid) return res.status(400).json({ error: validation.error });
    const { fields } = validation;

    // actorType/actorId are NOT read from req.body anywhere in this file —
    // this customer-facing endpoint always writes as 'customer' (the
    // upsertBookingDetails default below). An employee-assisted editing
    // endpoint, when built, must derive actorType/actorId from the
    // authenticated session, never from the request body.
    const outcome = await upsertBookingDetails(referenceId, fields);

    if (outcome.locked) {
      return res.status(409).json({
        error: 'Your booking details are finalized and can no longer be edited online. Please contact our team for any corrections.',
        locked: true,
      });
    }

    if (outcome.justEnteredReview) {
      try {
        await sendRouteChangeReviewAlert({
          referenceId,
          pickup: `${fields.pickupCity}, ${fields.pickupState}`,
          delivery: `${fields.deliveryCity}, ${fields.deliveryState}`,
        });
      } catch (err) {
        console.error('Material-change review alert failed for', referenceId, err);
      }
    }

    // Pickup/Delivery POC, Earliest Pickup Date, Special Instructions
    // only — Customer Card Hold Status is deliberately never touched
    // here. It has exactly one pair of writers, the Stripe webhook's
    // authorization/cancellation handlers, so this sync (which can be
    // delayed or retried) can never overwrite a confirmed authorization.
    try {
      await syncBookingDetailsToHubspot(referenceId, fields);
    } catch (err) {
      console.error(`HubSpot booking-details sync failed for ${referenceId}:`, err.message);
    }

    // Both halves are required: status alone doesn't prove the latest
    // revision was ever confirmed, and pendingCustomerConfirmation alone
    // doesn't prove staff approved it. See booking_details_setup.sql.
    const readyForPayment = outcome.status === 'ready_for_payment' && !outcome.pendingCustomerConfirmation;

    return res.json({
      ok: true,
      status: outcome.status,
      readyForPayment,
      reviewRequired: outcome.status === 'review_required',
      pendingCustomerConfirmation: outcome.pendingCustomerConfirmation,
      revision: outcome.revision,
    });
  } catch (err) {
    console.error('Booking details submission error', err);
    res.status(500).json({ error: 'We could not save your booking details right now.' });
  }
});

// Confirms a specific revision of this booking's details, clearing
// pending_customer_confirmation only if the revision named still matches
// what's currently on the row. Token-only, same reasoning as the submit
// endpoint.
router.post('/api/confirm-revision-by-token', async (req, res) => {
  try {
    const result = verifyBookingToken(req.body?.token);
    if (!result.valid) {
      if (result.reason === 'expired') return res.status(401).json({ error: 'This booking link has expired.', expired: true });
      return res.status(401).json({ error: 'This booking link is not valid.' });
    }

    const revision = Number(req.body?.revision);
    if (!Number.isInteger(revision) || revision < 1) {
      return res.status(400).json({ error: 'A valid revision number is required.' });
    }

    const outcome = await confirmBookingRevision(result.referenceId, revision);
    if (!outcome.confirmed) {
      if (outcome.reason === 'stale_revision') {
        return res.status(409).json({
          error: 'Your booking details have changed since you last reviewed them. Please review the latest version before confirming.',
          currentRevision: outcome.currentRevision,
        });
      }
      return res.status(404).json({ error: 'We could not find that booking.' });
    }

    return res.json({ ok: true, confirmedRevision: outcome.currentRevision });
  } catch (err) {
    console.error('Booking revision confirmation error', err);
    res.status(500).json({ error: 'We could not confirm your booking details right now.' });
  }
});

// Prefill/resume support: returns the previously-saved booking details, if
// any, for this token's reference — including status and
// pending_customer_confirmation, so the client can decide whether to
// re-show the form, jump straight to payment, or show a review-pending
// banner, instead of always starting from a blank form. Also reports the
// confirmed package (if any) even when no booking_details row exists yet —
// a reference can have a confirmed booking_selections row with nothing in
// booking_details (e.g. confirmed before this step existed, or an earlier
// visit that didn't get that far), and the client needs that to resume
// straight into the details form instead of re-showing "Confirm selection".
// Token-only.
router.post('/api/booking-details-by-token', async (req, res) => {
  try {
    const result = verifyBookingToken(req.body?.token);
    if (!result.valid) {
      if (result.reason === 'expired') return res.status(401).json({ error: 'This booking link has expired.', expired: true });
      return res.status(401).json({ error: 'This booking link is not valid.' });
    }

    const [detailsResult, selectionResult] = await Promise.all([
      supabase
        .from('booking_details')
        .select('pickup_address, pickup_unit, pickup_city, pickup_state, pickup_zip, pickup_contact_name, pickup_contact_phone, delivery_address, delivery_unit, delivery_city, delivery_state, delivery_zip, delivery_contact_name, delivery_contact_phone, vehicle_available_date, special_instructions, status, revision, pending_customer_confirmation')
        .eq('reference_id', result.referenceId)
        .maybeSingle(),
      supabase.from('booking_selections').select('package').eq('reference_id', result.referenceId).maybeSingle(),
    ]);
    if (detailsResult.error) throw detailsResult.error;
    if (selectionResult.error) throw selectionResult.error;

    res.json({ details: detailsResult.data || null, confirmedPackage: selectionResult.data?.package || null });
  } catch (err) {
    console.error('Booking details lookup error', err);
    res.status(500).json({ error: 'Unable to retrieve your booking details right now.' });
  }
});

// Creates a Stripe Checkout Session (manual capture — an authorization
// hold, never an immediate charge) for the package already confirmed in
// booking_selections, and the guided booking details already confirmed as
// ready for payment. The amount and package are both read server-side
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

    // Guided booking details (pickup/delivery address, contacts,
    // availability, terms) must be confirmed and clear of any pending
    // material-change review before Stripe is ever reached. This is the
    // one new gate on the existing, already-verified Stripe flow — it
    // does not change amount computation, session creation, or webhook
    // handling for a reference that already passes it.
    const { data: details, error: detailsErr } = await supabase
      .from('booking_details')
      .select('status, pending_customer_confirmation')
      .eq('reference_id', referenceId)
      .maybeSingle();
    if (detailsErr) throw detailsErr;
    if (!details || details.status !== 'ready_for_payment' || details.pending_customer_confirmation) {
      return res.status(409).json({ error: 'Please complete your pickup and delivery details before continuing to payment.' });
    }

    if (await hasActiveAuthorization(referenceId)) {
      return res.status(409).json({ error: 'This booking has already been authorized for payment.' });
    }

    const amountCents = computeAuthorizationAmountCents(quote, pkg);
    if (amountCents == null) {
      return res.status(409).json({ error: 'Pricing is not ready. Please contact our team.' });
    }

    const baseUrl = process.env.BOOKING_SITE_URL || 'https://www.roadamericatransport.com';
    const rawToken = req.body.token;
    const stripe = getStripeClient();

    // See buildCheckoutIdempotencyKey for why this is deterministic rather
    // than random. Stripe retains idempotency keys for 24h, matching this
    // Checkout Session's own expiry window, so a later genuine retry (old
    // session expired) correctly creates a fresh one.
    const idempotencyKey = buildCheckoutIdempotencyKey({ referenceId, pkg, amountCents });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // payment_method_types is no longer accepted on Checkout Session
      // creation for this account — Stripe rejects it with a 400
      // ("Payment methods are now managed from your Dashboard settings").
      // Omitting it lets Stripe use whatever's enabled in Settings ->
      // Payment methods instead. Stripe itself automatically excludes any
      // enabled method that doesn't support capture_method: 'manual' from
      // a given session, so this is safe without re-adding the parameter —
      // but see the deployment report for what to verify in the Dashboard.
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
    }, { idempotencyKey });

    try {
      await recordPendingAuthorization({
        referenceId,
        pkg,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: session.payment_intent || null,
        amountCents,
        currency: 'usd',
        livemode: session.livemode,
      });
    } catch (insertErr) {
      // Two distinct conflicts are possible here, and only one of them is
      // actually a problem:
      //   - stripe_checkout_session_id already recorded: Stripe's own
      //     idempotency dedup (see idempotencyKey above) returned the
      //     identical, already-recorded session — the common double-
      //     click/retry case. Not an error; the row already exists and
      //     session.url is still correct to return as-is.
      //   - payment_authorizations_active_reference_idx (see
      //     payment_authorizations_dedupe.sql): a DIFFERENT active
      //     (pending or authorized) attempt for this same reference
      //     already exists. That means Stripe just created a genuinely
      //     new, live, payable session for a booking that must only ever
      //     have one active attempt at a time — since it was never
      //     recorded, nothing else will ever reference it, so expire it
      //     immediately rather than silently leaving an un-tracked,
      //     payable session behind.
      if (insertErr.code === '23505' && String(insertErr.message || '').includes('active_reference')) {
        try {
          await stripe.checkout.sessions.expire(session.id);
        } catch (expireErr) {
          console.error(`Failed to expire orphaned duplicate Checkout Session ${session.id} for ${referenceId}:`, expireErr);
        }
        return res.status(409).json({ error: 'A payment attempt for this booking is already in progress. Please wait a moment and try again.' });
      }
      if (insertErr.code !== '23505') throw insertErr;
      // Else: conflict was on stripe_checkout_session_id — fine, fall through.
    }

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
