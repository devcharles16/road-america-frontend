
import { API_BASE_URL } from "../config/api";
import { getAccessTokenOrThrow } from "./apiClient";
import { supabase } from "../lib/supabaseClient";

export type BlogStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  status: BlogStatus;
  imageUrl?: string | null;
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



// PUBLIC
export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog")
    .select(
      "id, slug, title, excerpt, status, imageUrl, publishedAt, createdAt, updatedAt"
    )
    .eq("status", "published")
    .order("publishedAt", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    throw new Error(error.message);
  }

  // Cast to BlogPost[] but keeping content empty to save bandwidth
  // The list view doesn't need the full content body
  return (data || []).map((post: any) => ({
    ...post,
    content: "", // satisfy the type definition
  })) as BlogPost[];
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
  const token = await getAccessTokenOrThrow();
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
  imageUrl?: string | null;
};

export async function adminCreatePost(input: BlogInput): Promise<BlogPost> {
  const token = await getAccessTokenOrThrow();
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
  const token = await getAccessTokenOrThrow();
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
  const token = await getAccessTokenOrThrow();
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
