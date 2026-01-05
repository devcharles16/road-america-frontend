import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Ensure ONE client across navigations / HMR
const globalAny = globalThis as any;

if (!globalAny.__SUPABASE__) {
  globalAny.__SUPABASE__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  });

  console.log(
    "%cSUPABASE CLIENT CREATED (singleton)",
    "color: green; font-weight: bold;"
  );
}

export const supabase: SupabaseClient = globalAny.__SUPABASE__;
