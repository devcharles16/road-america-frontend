import { useEffect, useState } from "react";
import { adminListUsers, type AdminUserRow } from "../services/adminUsersService";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const rows = await adminListUsers();
      setUsers(rows);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="bg-brand-dark py-10 text-white min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Users</h1>
            <p className="text-white/70 text-sm">
              Admin view of profiles in the system.
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15 active:bg-white/20"
            type="button"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6">
            <p className="text-white/80">Loading users…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="font-medium">Couldn’t load users</p>
            <p className="text-white/80 mt-1">{error}</p>
            <p className="text-white/60 mt-3 text-sm">
              This is usually caused by RLS blocking admins from selecting{" "}
              <code className="text-white/80">profiles</code>.
            </p>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center">
            <p className="text-lg font-semibold">No users found</p>
            <p className="text-white/70 mt-2">
              If you see users under Authentication → Users, but none here, then
              profiles are missing or RLS is blocking access.
            </p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/80">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => {
                  const name = u.full_name || "—";
                  return (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">{name}</td>
                      <td className="px-4 py-3">{u.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-white/10 px-2 py-1">
                          {u.role ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{fmtDate(u.created_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-white/70">
                        {u.id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
