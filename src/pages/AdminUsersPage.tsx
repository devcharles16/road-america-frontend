import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type UserRow = {
  id: string;
  email: string;
  role?: string | null;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase
        .from("users") // or "profiles"
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) setUsers(data);
      setLoading(false);
    }

    loadUsers();
  }, []);

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Users</h1>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-white/5">
              <td>{u.email}</td>
              <td>{u.role ?? "user"}</td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
