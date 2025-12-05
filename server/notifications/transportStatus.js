import { sendEmail } from "../utils/email.js";

const STATUS_MESSAGES = {
  Submitted: "Your transport request has been received and is now in our system.",
  "Driver Assigned": "A professional driver has been assigned to your vehicle.",
  "In Transit": "Your vehicle is currently in transit to its destination.",
  Delivered: "Your vehicle has been successfully delivered.",
  Cancelled: "Your transport request has been cancelled.",
};

export async function sendStatusUpdate(customerEmail, customerName, status, orderId) {
  const message =
    STATUS_MESSAGES[status] ||
    "There has been an update to your vehicle transport status.";

  const subject = `Your Transport Status: ${status}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#0b0b0b; padding:24px; color:#f5f5f5;">
      <div style="max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(135deg,#111,#1a1a1a);">
        <div style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.06);background:linear-gradient(to right,#8C0000,#2b0000);">
          <h1 style="margin:0;font-size:20px;letter-spacing:0.08em;text-transform:uppercase;color:#fff;">
            Road America Auto Transport
          </h1>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);">
            Luxury Vehicle Transport • Nationwide
          </p>
        </div>
        <div style="padding:24px;">
          <p style="font-size:15px;margin:0 0 16px;">Hi ${customerName},</p>
          <p style="font-size:14px;margin:0 0 16px;">${message}</p>

          <div style="margin:20px 0;padding:12px 16px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
            <p style="margin:0 0 4px;font-size:12px;color:#999;">Order ID</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#fff;">${orderId}</p>
            <p style="margin:12px 0 0;font-size:12px;color:#bbb;">Current Status:
              <span style="padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.2);margin-left:6px;font-size:11px;text-transform:uppercase;letter-spacing:0.09em;">
                ${status}
              </span>
            </p>
          </div>

          <p style="font-size:13px;margin:0 0 16px;color:#ccc;">
            You can reply directly to this email if you have any questions about your transport.
          </p>

          <p style="font-size:13px;margin:0;color:#999;">
            Thank you for choosing <strong style="color:#fff;">Road America Auto Transport</strong>.
          </p>
        </div>
        <div style="padding:14px 24px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#777;">
          <p style="margin:0;">This is an automated notification. If you did not request this update, please contact us.</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: customerEmail,
    subject,
    html,
  });
}
