// src/pages/ManageNotificationsPage.tsx
//
// Opening this page (a GET) never changes anything by itself — it only
// loads and displays the current preference. Changing it always
// requires an explicit button click, since corporate email security
// scanners and link-preview bots routinely open every link in an email
// automatically; if loading this page mutated state, an automated
// scanner opening the link would silently opt the customer out (or
// back in) without them ever clicking anything.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getNotificationPreference,
  setNotificationPreference,
} from "../services/notificationPreferencesService";
import LoadingState from "../components/LoadingState";

const ManageNotificationsPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("This link is missing its access code. Please use the link from your status email.");
      setLoading(false);
      return;
    }

    let alive = true;
    getNotificationPreference(token)
      .then((pref) => {
        if (!alive) return;
        setEmail(pref.email);
        setEnabled(pref.enabled);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.message || "This link is not valid.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  async function handleToggle(nextEnabled: boolean) {
    if (saving) return;
    setSaving(true);
    setSavedMessage(null);
    setError(null);
    try {
      const result = await setNotificationPreference(token, nextEnabled);
      setEnabled(result.enabled);
      setSavedMessage(
        result.enabled
          ? "Shipment status emails are turned on."
          : "Shipment status emails are turned off."
      );
    } catch (err: any) {
      setError(err?.message || "Something went wrong saving your preference. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-brand-dark py-12 text-text-primary min-h-[70vh] flex items-center">
      <div className="mx-auto max-w-md px-4 w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-redSoft">
          Shipment Notifications
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          Manage Shipment Status Emails
        </h1>

        <div className="mt-6 rounded-2xl bg-background-warm p-5 shadow-soft-card border border-[#172B3D]/10">
          {loading ? (
            <LoadingState message="Loading your preference..." />
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            <>
              <p className="text-sm text-text-primary">
                These are optional progress updates for your vehicle shipments
                (e.g. carrier assigned, in transit, delivered) for{" "}
                <strong>{email}</strong>. This covers all of your shipments —
                you don't need to set this separately for each one.
              </p>

              <p className="mt-4 text-sm font-semibold">
                Status emails are currently{" "}
                <span className={enabled ? "text-emerald-500" : "text-red-400"}>
                  {enabled ? "ON" : "OFF"}
                </span>
                .
              </p>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={saving || enabled === true}
                  onClick={() => handleToggle(true)}
                  className="flex-1 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-redSoft disabled:opacity-50"
                >
                  Turn On
                </button>
                <button
                  type="button"
                  disabled={saving || enabled === false}
                  onClick={() => handleToggle(false)}
                  className="flex-1 rounded-full border border-[#172B3D]/20 px-4 py-2 text-sm font-semibold text-text-primary hover:bg-[#172B3D]/5 disabled:opacity-50"
                >
                  Turn Off
                </button>
              </div>

              {savedMessage && (
                <p className="mt-3 text-xs text-emerald-500">{savedMessage}</p>
              )}

              <p className="mt-6 text-[11px] text-text-muted">
                This only affects optional progress updates. You'll still
                receive your quote, booking, and payment-related
                communications either way.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ManageNotificationsPage;
