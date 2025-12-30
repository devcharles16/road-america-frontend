// server/notifications/adminAlerts.js
import { sendEmail } from "../utils/email.js";

const adminEmail = process.env.ADMIN_ALERT_EMAIL;
function splitVehicle(vehicle = "") {
  if (!vehicle) return { year: "-", make: "-", model: "-" };

  const parts = vehicle.trim().split(/\s+/);

  const year =
    parts.length && /^\d{4}$/.test(parts[0]) ? parts.shift() : "-";

  const make = parts.length ? parts.shift() : "-";
  const model = parts.length ? parts.join(" ") : "-";

  return { year, make, model };
}

export async function sendNewQuoteAlert(payload) {
  const {
  firstName,
  lastName,
  email,
  phone,
  pickup,
  dropoff,
  vehicle: vehicleRaw,
  runningCondition,
  transportType,
  referenceId,
} = payload;


  const { year, make, model } = splitVehicle(vehicleRaw);

  const subject = "🚗 New Transport Quote Request – Road America";

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding:20px;">
      <h2 style="margin-top:0;">New Quote Request</h2>
      <p>You just received a new quote request from the website.</p>

      <table style="border-collapse:collapse;font-size:14px;">
        <tbody>
          ${referenceId ? `
          <tr>
            <td style="padding:4px 8px;font-weight:600;">Ref ID:</td>
            <td style="padding:4px 8px;">${referenceId}</td>
          </tr>` : ""}
          <tr>
          <tr>
            <td style="padding:4px 8px;font-weight:600;">First Name:</td>
            <td style="padding:4px 8px;">${firstName || "-"}</td>
          </tr>
          <tr>
            <td style="padding:4px 8px;font-weight:600;">Last Name:</td>
            <td style="padding:4px 8px;">${lastName || "-"}</td>
          </tr>


</tr>
          <tr>
            <td style="padding:4px 8px;font-weight:600;">Email:</td>
            <td style="padding:4px 8px;">${email || "-"}</td>
          </tr>
          <tr>
            <td style="padding:4px 8px;font-weight:600;">Phone:</td>
            <td style="padding:4px 8px;">${phone || "-"}</td>
          </tr>
          <tr>
            <td style="padding:4px 8px;font-weight:600;">Pickup:</td>
            <td style="padding:4px 8px;">${pickup || "-"}</td>
          </tr>
          <tr>
            <td style="padding:4px 8px;font-weight:600;">Dropoff:</td>
            <td style="padding:4px 8px;">${dropoff || "-"}</td>
          </tr>
          <tr>
            <td style="padding:4px 8px;font-weight:600;">Vehicle Year:</td>
            <td style="padding:4px 8px;">${year}</td>
          </tr>
          <tr>
            <td style="padding:4px 8px;font-weight:600;">Make:</td>
            <td style="padding:4px 8px;">${make}</td>
          </tr>
          <tr>
            <td style="padding:4px 8px;font-weight:600;">Model:</td>
            <td style="padding:4px 8px;">${model}</td>
          </tr>
          <tr>
  <td style="padding:4px 8px;font-weight:600;">Running Condition:</td>
  <td style="padding:4px 8px;">${runningCondition || "-"}</td>
</tr>

          <tr>
            <td style="padding:4px 8px;font-weight:600;">Transport Type:</td>
            <td style="padding:4px 8px;">${transportType || "-"}</td>
          </tr>
        </tbody>
      </table>

      <p style="font-size:12px;color:#666;margin-top:16px;">
        Work this email from your HubSpot Ticket
      </p>
    </div>
  `;

  if (!adminEmail) {
    console.error("ADMIN_ALERT_EMAIL is not set.");
    return { success: false, error: "ADMIN_ALERT_EMAIL not configured" };
  }

  return await sendEmail({
    to: adminEmail,
    subject,
    html,
  });
}


// ✨ NEW: Customer-facing quote confirmation email
export async function sendQuoteConfirmationEmail(payload) {
  const {
    firstName,
    lastName,
    email,
    pickup,
    dropoff,
    vehicle: vehicleRaw,
    runningCondition,
    transportType,
    referenceId,
  } = payload;

  const { year, make, model } = splitVehicle(vehicleRaw);

  if (!email) {
    return { success: false, error: "No customer email provided" };
  }

  const subject = "We’ve Received Your Transport Quote Request";

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0b0b0b; padding:24px; color:#f5f5f5;">
      <div style="max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(135deg,#101010,#181818);">

        <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);background:linear-gradient(to right,#8C0000,#2b0000);">
          <h1 style="margin:0;font-size:20px;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;">
            Road America Auto Transport
          </h1>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);">
            Luxury Vehicle Transport • Nationwide
          </p>
        </div>

        <div style="padding:24px;">
          <p style="font-size:15px;margin:0 0 16px;">Hi ${firstName || "there"},</p>

          <p style="font-size:14px;margin:0 0 14px;">
            Thank you for requesting a transport quote with
            <strong style="color:#ffffff;">Road America Auto Transport</strong>.
          </p>

          <p style="font-size:14px;margin:0 0 18px;">
            We’ve received your details and a transport specialist will review your route and send a tailored quote shortly.
          </p>

          <div style="margin:18px 0;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
            ${referenceId ? `
            <p style="margin:0 0 8px;font-size:12px;color:#aaaaaa;">
              <span style="font-weight:600;color:#ffffff;">Reference ID:</span> ${referenceId}
            </p>` : ""}

            <table style="border-collapse:collapse;font-size:13px;width:100%;color:#e5e5e5;">
              <tbody>
                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Pickup:</td>
                  <td style="padding:4px 0;">${pickup || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Dropoff:</td>
                  <td style="padding:4px 0;">${dropoff || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Year:</td>
                  <td style="padding:4px 0;">${year}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Make:</td>
                  <td style="padding:4px 0;">${make}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Model:</td>
                  <td style="padding:4px 0;">${model}</td>
                </tr>
                <tr>
  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Condition:</td>
  <td style="padding:4px 0;">${runningCondition || "-"}</td>
</tr>

                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Transport Type:</td>
                  <td style="padding:4px 0;">${transportType || "-"} transport</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style="font-size:13px;margin:0 0 14px;color:#d4d4d4;">
            If you need to update any details, just reply to this email and our team will be happy to assist.
          </p>

          <p style="font-size:13px;margin:0 0 4px;color:#d4d4d4;">
            We look forward to taking great care of your vehicle.
          </p>

          <p style="font-size:13px;margin:0;color:#d4d4d4;">
            Warm regards,<br/>
            <span style="color:#ffffff;font-weight:600;">Road America Auto Transport</span>
          </p>
        </div>

        <div style="padding:14px 24px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#8a8a8a;">
          <p style="margin:0;">
            This message was sent regarding your recent quote request with Road America Auto Transport.
          </p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}

