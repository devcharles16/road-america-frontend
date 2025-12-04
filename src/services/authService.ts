// src/services/authService.ts
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type RegisterClientInput = {
  name?: string;
  email: string;
  phone?: string;
  password: string;
};

export type RegisteredClient = {
  id: string;
  email: string;
  role: "client";
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API error (${res.status}): ${text || res.statusText || "Unknown error"}`
    );
  }
  return res.json() as Promise<T>;
}

export async function registerClient(
  input: RegisterClientInput
): Promise<RegisteredClient> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return handleResponse<RegisteredClient>(res);
}
