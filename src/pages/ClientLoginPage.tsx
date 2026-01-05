import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const ClientLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    console.log("[ClientLogin] submit", { email: email.trim() });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      console.log("[ClientLogin] signInWithPassword result", {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message ?? null,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // If Supabase returns no user at all, treat as failure
      if (!data?.user) {
        setError("Login failed. No user returned.");
        return;
      }

      // Hand off routing to the post-login redirect page
      navigate("/post-login", { replace: true });
    } catch (err: any) {
      console.error("[ClientLogin] exception", err);
      setError(err?.message ?? "Login failed.");
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
        <h1 className="mt-2 font-display text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-white/70">
          Log in to view your active and past shipments. Use the email and
          password provided by your transport coordinator.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl bg-black/40 p-5 shadow-soft-card border border-white/10"
        >
          <div>
            <label className="block text-xs text-white/70 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs text-white/70 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white shadow-soft-card hover:bg-brand-redSoft disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Log In"}
          </button>

          <p className="text-[11px] text-white/60 mt-3">
            Don&apos;t have an account yet?{" "}
            <Link
              to="/register"
              className="text-brand-redSoft hover:text-brand-red underline"
            >
              Create one here.
            </Link>
          </p>

          <p className="text-[11px] text-white/60 mt-2">
            Admin or employee?{" "}
            <Link
              to="/admin/login"
              className="text-brand-redSoft hover:text-brand-red underline"
            >
              Use the admin login instead.
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default ClientLoginPage;
