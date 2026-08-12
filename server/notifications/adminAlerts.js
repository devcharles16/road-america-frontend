// server/notifications/adminAlerts.js
import { sendEmail } from "../utils/email.js";


function splitVehicle(vehicle = "") {
  if (!vehicle) return { year: "-", make: "-", model: "-" };

  const parts = vehicle.trim().split(/\s+/);

  const year =
    parts.length && /^\d{4}$/.test(parts[0]) ? parts.shift() : "-";

  const make = parts.length ? parts.shift() : "-";
  const model = parts.length ? parts.join(" ") : "-";

  return { year, make, model };
}
function formatPickupWindow(value) {
  switch (value) {
    case "asap_1_3":
      return "ASAP (1–3 days)";
    case "this_week":
      return "This week";
    case "next_1_2_weeks":
      return "Next 1–2 weeks";
    case "flexible":
      return "Flexible / No rush";
    default:
      return "-";
  }
}
function formatVehicleHeightMod(value) {
  switch (value) {
    case "stock":
      return "Stock (no lift or lowering)";
    case "lifted":
      return "Lifted";
    case "lowered":
      return "Lowered";
    case "not_sure":
      return "Not sure";
    default:
      return "-";
  }
}




export async function sendNewQuoteAlert(payload) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;

  const {
    firstName,
    lastName,
    email,
    phone,
    pickup,
    dropoff,
    vehicle: vehicleRaw,
    runningCondition,
    vehicleHeightMod,
    transportType,
    preferredPickupWindow,

    referenceId,
  } = payload;


  const { year, make, model } = splitVehicle(vehicleRaw);

  const subject = "🚗 New Transport Quote Request – Road America";

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </head>
      <body style="margin:0; padding:0; background-color:#f4f4f5;">
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color:#f4f4f5; padding:20px;">
          <div style="max-width:600px; margin:0 auto; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:20px;">
            <h2 style="margin-top:0; color:#111827;">New Quote Request</h2>
            <p style="color:#374151;">You just received a new quote request from the website.</p>

            <table style="border-collapse:collapse; font-size:14px; width:100%; background-color:#ffffff;">
              <tbody>
                ${referenceId ? `
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Ref ID:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${referenceId}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">First Name:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${firstName || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Last Name:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${lastName || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Email:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${email || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Phone:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${phone || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Pickup:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${pickup || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Dropoff:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${dropoff || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Preferred Pickup Window:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${formatPickupWindow(preferredPickupWindow)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Vehicle Year:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${year}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Make:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${make}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Model:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${model}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Running Condition:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${runningCondition || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Vehicle Height / Mods:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${formatVehicleHeightMod(vehicleHeightMod)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Transport Type:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${transportType || "-"}</td>
                </tr>
              </tbody>
            </table>

            <p style="font-size:12px; color:#6b7280; margin-top:16px;">
              Work this email from your HubSpot Ticket
            </p>
          </div>
        </div>
      </body>
    </html>
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
    vehicleHeightMod,

    transportType,
    preferredPickupWindow,

    referenceId,
  } = payload;

  const { year, make, model } = splitVehicle(vehicleRaw);

  if (!email) {
    return { success: false, error: "No customer email provided" };
  }

  const subject = "We’ve Received Your Transport Quote Request";

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#2b2b2b; padding:24px; color:#f5f5f5;">
      <div style="max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(135deg,#303030,#383838);">

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
<tr>
  <td style="padding:4px 0;width:34%;color:#aaaaaa;">
    Pickup Window:
  </td>
  <td style="padding:4px 0;">
    ${formatPickupWindow(preferredPickupWindow)}
  </td>
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
  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Vehicle Height / Mods:</td>
  <td style="padding:4px 0;">${formatVehicleHeightMod(vehicleHeightMod)}</td>
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

export async function sendNewBusinessInquiryAlert(payload) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;

  const {
    firstName,
    lastName,
    businessName,
    jobTitle,
    email,
    phone,
    businessType,
    transportNeed,
    estimatedVolume,
    pickupCityState,
    deliveryCityState,
    additionalDetails,
  } = payload;

  const subject = "🏢 New Business Transport Inquiry – Road America";

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </head>
      <body style="margin:0; padding:0; background-color:#f4f4f5;">
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color:#f4f4f5; padding:20px;">
          <div style="max-width:600px; margin:0 auto; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; padding:20px;">
            <h2 style="margin-top:0; color:#111827;">New Business (B2B) Transport Inquiry</h2>
            <p style="color:#374151;">A commercial account submitted the Business Auto Transport inquiry form.</p>

            <table style="border-collapse:collapse; font-size:14px; width:100%; background-color:#ffffff;">
              <tbody>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Name:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${firstName || "-"} ${lastName || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Business:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${businessName || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Job Title:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${jobTitle || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Email:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${email || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Phone:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${phone || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Business Type:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${businessType || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Transport Need:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${transportNeed || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Estimated Volume:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${estimatedVolume || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Pickup:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${pickupCityState || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Delivery:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${deliveryCityState || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 8px; font-weight:600; color:#374151; background-color:#ffffff;">Details:</td>
                  <td style="padding:4px 8px; color:#111827; background-color:#ffffff;">${additionalDetails || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
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


// Customer-facing confirmation for the B2B business inquiry form
export async function sendBusinessInquiryConfirmationEmail(payload) {
  const {
    firstName,
    businessName,
    email,
    businessType,
    transportNeed,
    estimatedVolume,
    pickupCityState,
    deliveryCityState,
  } = payload;

  if (!email) {
    return { success: false, error: "No customer email provided" };
  }

  const subject = "We've Received Your Business Transport Inquiry";

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#2b2b2b; padding:24px; color:#f5f5f5;">
      <div style="max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(135deg,#303030,#383838);">

        <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);background:linear-gradient(to right,#8C0000,#2b0000);">
          <h1 style="margin:0;font-size:20px;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;">
            Road America Auto Transport
          </h1>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);">
            Commercial &amp; Fleet Vehicle Logistics
          </p>
        </div>

        <div style="padding:24px;">
          <p style="font-size:15px;margin:0 0 16px;">Hi ${firstName || "there"},</p>

          <p style="font-size:14px;margin:0 0 14px;">
            Thank you for reaching out to <strong style="color:#ffffff;">Road America Auto Transport</strong>
            on behalf of <strong style="color:#ffffff;">${businessName || "your business"}</strong>.
          </p>

          <p style="font-size:14px;margin:0 0 18px;">
            A member of our commercial team is reviewing your request and will follow up with a custom logistics plan.
          </p>

          <div style="margin:18px 0;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
            <table style="border-collapse:collapse;font-size:13px;width:100%;color:#e5e5e5;">
              <tbody>
                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Business Type:</td>
                  <td style="padding:4px 0;">${businessType || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Transport Need:</td>
                  <td style="padding:4px 0;">${transportNeed || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Estimated Volume:</td>
                  <td style="padding:4px 0;">${estimatedVolume || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Pickup:</td>
                  <td style="padding:4px 0;">${pickupCityState || "-"}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;width:34%;color:#aaaaaa;">Delivery:</td>
                  <td style="padding:4px 0;">${deliveryCityState || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style="font-size:13px;margin:0 0 14px;color:#d4d4d4;">
            If you need to update any details, just reply to this email and our team will be happy to assist.
          </p>

          <p style="font-size:13px;margin:0;color:#d4d4d4;">
            Warm regards,<br/>
            <span style="color:#ffffff;font-weight:600;">Road America Auto Transport</span>
          </p>
        </div>

        <div style="padding:14px 24px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#8a8a8a;">
          <p style="margin:0;">
            This message was sent regarding your recent business transport inquiry with Road America Auto Transport.
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
