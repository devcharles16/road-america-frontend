// src/pages/ClientRegisterPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerClient } from "../services/authService";
import { supabase } from "../lib/supabaseClient";


const ClientRegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
     await registerClient({
  fullName: name.trim() || undefined,
  email: email.trim(),
  password,
});
// Save phone into profiles (optional)
if (phone.trim()) {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (userId) {
    const { error: phoneError } = await supabase
      .from("profiles")
      .update({ phone: phone.trim() })
      .eq("id", userId);

    if (phoneError) {
      console.error("Failed to save phone to profile:", phoneError);
      // Don't block registration success just because phone save failed
    }
  }
}

      setSuccess(
  `Account created for ${email}. You can now log in to view your shipments.`
  
);

      // Optionally auto-redirect after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Something went wrong while creating your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-brand-dark py-12 text-white min-h-[70vh] flex items-center">
      <div className="mx-auto max-w-md px-4 w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-redSoft">
          Client Portal
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          Create Your Client Account
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Create a login to view your active and past shipments, track status,
          and keep your contact details up to date.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl bg-black/40 p-5 shadow-soft-card border border-white/10"
        >
          <div>
            <label className="block text-xs text-white/70 mb-1">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and last name"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
            />
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
            />
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-white/70 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
              />
            </div>
            <div>
              <label className="block text-xs text-white/70 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && (
            <p className="text-xs text-emerald-400">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white shadow-soft-card hover:bg-brand-redSoft disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-[11px] text-white/60 mt-3">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-redSoft hover:text-brand-red underline"
            >
              Log in here.
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default ClientRegisterPage;
