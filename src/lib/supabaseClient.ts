import { createClient } from "@supabase/supabase-js";


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

(globalThis as any).__SUPABASE_CLIENT__ ??= {
  id: crypto.randomUUID(),
};

console.log(
  "%cSUPABASE CLIENT CREATED:",
  "color: green; font-weight: bold;",
  (globalThis as any).__SUPABASE_CLIENT__.id
);
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  
});