import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type UserRow = {
  id: string;
  email: string;
  role?: string | null;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminUsersPage] loadUsers error:", error);
      setUsers([]);
      setErrorMsg(error.message || "Failed to load users.");
      setLoading(false);
      return;
    }

    setUsers((data ?? []) as UserRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      // Prevent state updates if the component unmounts while awaiting the request
      try {
        await loadUsers();
      } finally {
        if (!alive) return;
      }
    })();

    return () => {
      alive = false;
    };
  }, [loadUsers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-white">Users</h1>
        <button
          type="button"
          onClick={loadUsers}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-white/70">Loading users...</p>
      ) : (
        <>
          {errorMsg ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-200">{errorMsg}</p>
              <p className="mt-1 text-xs text-red-200/70">
                If you see users in Supabase but not here, it’s usually because this page must query
                <span className="font-semibold"> profiles</span> and your RLS policy may be blocking admin reads.
              </p>
            </div>
          ) : null}

          {users.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-white font-medium">No users to display</p>
              <p className="text-white/60 text-sm mt-1">
                This usually means the <span className="font-semibold">profiles</span> table is empty, or access is
                blocked by Row Level Security.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-4 py-3 text-left font-medium text-white/80">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-white/80">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-white/80">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 last:border-b-0">
                      <td className="px-4 py-3 text-white">{u.email}</td>
                      <td className="px-4 py-3 text-white/80">{u.role ?? "user"}</td>
                      <td className="px-4 py-3 text-white/60">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
