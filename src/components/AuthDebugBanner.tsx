import { useAuth } from "../context/AuthContext";

export default function AuthDebugBanner() {
  const { user, role, loading } = useAuth();

  return (
    <div className="fixed bottom-3 right-3 z-50 rounded-xl border border-white/10 bg-black/80 px-3 py-2 text-[11px] text-white/80">
      <div><span className="text-white/40">loading:</span> {String(loading)}</div>
      <div><span className="text-white/40">user:</span> {user?.email || "null"}</div>
      <div><span className="text-white/40">role:</span> {role ?? "null"}</div>
    </div>
  );
}
