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
