// src/pages/AdminUsersPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, type NewUserRole } from "../services/adminUsersService";

const roleOptions: NewUserRole[] = ["admin", "employee", "client"];

const AdminUsersPage = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<NewUserRole>("client");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await createUser({
        email: email.trim(),
        password,
        role,
      });

      setSuccess(
        `User created: ${created.email} (${created.role.toUpperCase()})`
      );
      setEmail("");
      setPassword("");
      setRole("client");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Something went wrong creating the user. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-brand-dark py-10 text-white min-h-[70vh]">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-redSoft">
              Admin
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold">
              User Management
            </h1>
            <p className="mt-2 text-xs text-white/70">
              Create admin, employee, or client accounts. Employees can create
              client users only. Admins can create any role.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/shipments")}
            className="rounded-full border border-white/30 px-4 py-2 text-[11px] font-semibold text-white hover:border-brand-redSoft"
          >
            Back to Shipments
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-soft-card">
          <h2 className="text-sm font-semibold text-white/80">
            Create New User
          </h2>
          <p className="mt-1 text-[11px] text-white/60">
            New users will receive a login using the email and password you
            provide. They can change their password later.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
            <div>
              <label className="mb-1 block text-xs text-white/70">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/70">
                  Temporary Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. R@uTemp2026!"
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                  required
                />
                <p className="mt-1 text-[10px] text-white/50">
                  Share this password with the user. They should change it after
                  their first login.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/70">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as NewUserRole)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-redSoft"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-white/50">
                  Employees can only create <span className="font-semibold">Client</span>{" "}
                  accounts. Admins can create any role. The backend enforces
                  this even if the wrong role is selected.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 mt-1">{error}</p>
            )}

            {success && (
              <p className="text-xs text-emerald-400 mt-1">{success}</p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-brand-red px-6 py-3 text-xs font-semibold text-white shadow-soft-card hover:bg-brand-redSoft disabled:opacity-60"
              >
                {loading ? "Creating user..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AdminUsersPage;
