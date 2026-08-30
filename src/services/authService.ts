import { supabase } from "../lib/supabaseClient";

export async function registerClient(input: {
  email: string;
  password: string;
  fullName: string;
  captchaToken?: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: { full_name: input.fullName || "" },
      ...(input.captchaToken ? { captchaToken: input.captchaToken } : {}),
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
