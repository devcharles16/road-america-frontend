// src/services/adminUsersService.ts
import { supabase } from "../lib/supabaseClient";

import { API_BASE_URL } from "../config/api";

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

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
};

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    return res.json() as Promise<T>;
  }

  // Default generic message
  let errorMessage = `Request failed with status ${res.status}.`;

  // Try to read the response body (might be JSON or plain text)
  let rawText = "";
  try {
    rawText = await res.text();
  } catch {
    // ignore
  }

  // SPECIAL CASE: 403 Forbidden → clean, generic message
  if (res.status === 403) {
    throw new Error("You don’t have permission to perform this action.");
  }

  // If we got a body, try to parse { error: "..."} or { message: "..." }
  if (rawText) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed?.error || parsed?.message) {
        errorMessage = parsed.error || parsed.message;
      } else {
        errorMessage = rawText;
      }
    } catch {
      // Not JSON, just use the raw text
      errorMessage = rawText;
    }
  }

  throw new Error(errorMessage);
}

export async function adminListUsers(): Promise<AdminUserRow[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<AdminUserRow[]>(res);
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
