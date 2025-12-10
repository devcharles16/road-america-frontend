import { supabase } from "../lib/supabaseClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type BlogStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  status: BlogStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
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

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// PUBLIC
export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${API_BASE_URL}/api/blog`);
  return handleResponse<BlogPost[]>(res);
}

export async function fetchPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const res = await fetch(`${API_BASE_URL}/api/blog/${slug}`);
  if (res.status === 404) return null;
  return handleResponse<BlogPost>(res);
}

// ADMIN
export async function adminListPosts(): Promise<BlogPost[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/admin/blog`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<BlogPost[]>(res);
}

type BlogInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  status: BlogStatus;
};

export async function adminCreatePost(input: BlogInput): Promise<BlogPost> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/admin/blog`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  return handleResponse<BlogPost>(res);
}

export async function adminUpdatePost(
  id: string,
  input: Partial<BlogInput>
): Promise<BlogPost> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/admin/blog/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  return handleResponse<BlogPost>(res);
}

export async function adminDeletePost(id: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/admin/blog/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API error (${res.status}): ${text || res.statusText || "Unknown error"}`
    );
  }
}
