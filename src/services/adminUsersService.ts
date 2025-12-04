// src/services/adminUsersService.ts
import { supabase } from "../lib/supabaseClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type NewUserRole = "admin" | "employee" | "client";

export type CreateUserInput = {
  email: string;
  password: string;
  role: NewUserRole;
};

export type CreatedUser = {
  id: string;
  email: string;
  role: NewUserRole;
};

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API error (${res.status}): ${text || res.statusText || "Unknown error"}`
    );
  }
  return res.json() as Promise<T>;
}

export async function createUser(
  input: CreateUserInput
): Promise<CreatedUser> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  return handleResponse<CreatedUser>(res);
}
