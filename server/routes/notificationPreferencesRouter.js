// Public, token-gated "Manage shipment notifications" endpoints. No
// account/login required — the signed token itself (see
// utils/notificationPreferenceLinks.js) is the authorization, scoped
// to exactly one customer email and this one purpose, never a booking
// token and never a login session.
//
// GET is strictly read-only — it must never change anything, since
// email security scanners and link-preview bots routinely open every
// link in an email automatically. Only POST (an explicit button click
// on the confirmation page) changes the stored preference.
import express from 'express';
import supabase from '../supabaseClient.js';
import { verifyNotificationPreferenceToken } from '../utils/notificationPreferenceLinks.js';

const router = express.Router();

function tokenErrorResponse(reason) {
  if (reason === 'expired') {
    return { status: 410, body: { error: 'This notification-preferences link has expired. You can use the link from your most recent status email, or contact us.' } };
  }
  return { status: 401, body: { error: 'This notification-preferences link is not valid.' } };
}

/**
 * GET /api/notification-preferences?token=...
 * Read-only. Returns the current preference for the token's email.
 */
router.get('/notification-preferences', async (req, res) => {
  const result = verifyNotificationPreferenceToken(req.query?.token);
  if (!result.valid) {
    const { status, body } = tokenErrorResponse(result.reason);
    return res.status(status).json(body);
  }

  try {
    const { data, error } = await supabase
      .from('customer_notification_preferences')
      .select('shipment_status_emails_enabled')
      .eq('customer_email', result.email)
      .maybeSingle();
    if (error) throw error;

    const enabled = data ? data.shipment_status_emails_enabled : true;
    return res.json({ email: result.email, enabled });
  } catch (err) {
    console.error(`Failed to read notification preference for ${result.email}:`, err);
    return res.status(500).json({ error: 'Unable to load your notification preference right now.' });
  }
});

/**
 * POST /api/notification-preferences
 * Body: { token, enabled }
 * The only mutating action — driven by an explicit button click on the
 * confirmation page, never by the GET above.
 */
router.post('/notification-preferences', async (req, res) => {
  const result = verifyNotificationPreferenceToken(req.body?.token);
  if (!result.valid) {
    const { status, body } = tokenErrorResponse(result.reason);
    return res.status(status).json(body);
  }

  const enabled = req.body?.enabled;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled must be true or false.' });
  }

  try {
    const { error } = await supabase
      .from('customer_notification_preferences')
      .upsert(
        { customer_email: result.email, shipment_status_emails_enabled: enabled, updated_at: new Date().toISOString() },
        { onConflict: 'customer_email' }
      );
    if (error) throw error;

    return res.json({ email: result.email, enabled });
  } catch (err) {
    console.error(`Failed to update notification preference for ${result.email}:`, err);
    return res.status(500).json({ error: 'Unable to update your notification preference right now.' });
  }
});

export default router;
