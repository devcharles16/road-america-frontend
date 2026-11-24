// src/services/notificationPreferencesService.ts
//
// PUBLIC, token-gated endpoints — no login/session required. The
// signed token (from the link in a status email) is the authorization.
import { API_BASE_URL } from "../config/api";

export type NotificationPreference = {
  email: string;
  enabled: boolean;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/** Read-only — safe to call on page load, including from a link preview/scanner. */
export async function getNotificationPreference(token: string): Promise<NotificationPreference> {
  const res = await fetch(
    `${API_BASE_URL}/api/notification-preferences?token=${encodeURIComponent(token)}`
  );
  return handleResponse<NotificationPreference>(res);
}

/** The only mutating action — call only from an explicit user action (a button click). */
export async function setNotificationPreference(
  token: string,
  enabled: boolean
): Promise<NotificationPreference> {
  const res = await fetch(`${API_BASE_URL}/api/notification-preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, enabled }),
  });
  return handleResponse<NotificationPreference>(res);
}
