import { useEffect, useState } from "react";
import {
  adminListPosts,
  adminCreatePost,
  adminUpdatePost,
  adminDeletePost,
  type BlogPost,
  type BlogStatus,
} from "../services/blogService";
import { supabase } from "../lib/supabaseClient";
//import { useNavigate } from "react-router-dom";

const emptyForm = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "draft" as BlogStatus,
  imageUrl: "",
};


const AdminBlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  //const navigate = useNavigate();

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await adminListPosts();
      setPosts(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
        "Failed to load blog posts. You may not have access to this area."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      status: post.status,
      imageUrl: post.imageUrl || "",
    });
  }
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);

      // Get current session to use user id for folder path
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || "unknown-admin";

      const ext = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${ext || "jpg"}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        setError("Failed to upload image.");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        setError("Could not get image URL after upload.");
        return;
      }

      setForm((f) => ({ ...f, imageUrl: publicUrl }));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unexpected error uploading image.");
    } finally {
      setUploadingImage(false);
    }
  }


  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await adminUpdatePost(editingId, {
          title: form.title,
          slug: form.slug || undefined,
          excerpt: form.excerpt || undefined,
          content: form.content,
          status: form.status,
          imageUrl: form.imageUrl || undefined,
        });
        setPosts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
      } else {
        const created = await adminCreatePost({
          title: form.title,
          slug: form.slug || undefined,
          excerpt: form.excerpt || undefined,
          content: form.content,
          status: form.status,
          imageUrl: form.imageUrl || undefined,
        });
        setPosts((prev) => [created, ...prev]);
      }
      startNew();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to save blog post.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await adminDeletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) startNew();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to delete blog post.");
    }
  }

  return (
    <section className="bg-brand-dark py-10 text-white min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-redSoft">
              Admin
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold">
              Blog Editor
            </h1>
            <p className="mt-2 text-xs text-white/70 max-w-xl">
              Create and manage blog posts that appear on the public blog page.
              Only published posts are visible to customers.
            </p>
          </div>
          <button
            onClick={startNew}
            className="self-start rounded-full border border-white/30 px-4 py-2 text-[11px] font-semibold text-white hover:border-brand-redSoft"
          >
            + New Post
          </button>
        </div>

        {error && (
          <p className="mb-4 text-xs text-red-400">{error}</p>
        )}

        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Post list */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-soft-card">
            <h2 className="text-sm font-semibold mb-3">Posts</h2>
            {loading ? (
              <p className="text-xs text-white/60">Loading posts…</p>
            ) : posts.length === 0 ? (
              <p className="text-xs text-white/60">
                No posts yet. Use &quot;New Post&quot; to create your first
                article.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 ${editingId === post.id ? "bg-white/10" : "bg-black/40"
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">
                        {post.title}
                      </p>
                      <p className="text-[10px] text-white/50 truncate">
                        {post.status.toUpperCase()} · {post.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(post)}
                        className="text-[11px] text-brand-redSoft hover:text-brand-red"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-[11px] text-white/50 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Editor */}
          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-soft-card space-y-3"
          >
            <h2 className="text-sm font-semibold mb-1">
              {editingId ? "Edit Post" : "New Post"}
            </h2>

            <div>
              <label className="block text-[11px] text-white/70 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-brand-redSoft"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/70 mb-1">
                Featured image
              </label>
              {form.imageUrl && (
                <div className="mb-2">
                  <img
                    src={form.imageUrl}
                    alt="Blog featured"
                    className="h-32 w-full max-w-xs rounded-lg object-cover border border-white/15"
                  />
                </div>
              )}
              <div className="flex items-center gap-3 text-[11px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-xs text-white/70"
                />
                {uploadingImage && (
                  <span className="text-white/60">Uploading…</span>
                )}
              </div>
              <p className="mt-1 text-[10px] text-white/40">
                Recommended: 1200x630px JPG or PNG.
              </p>
            </div>

            <div>
              <label className="block text-[11px] text-white/70 mb-1">
                Slug (optional)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="auto-generated-from-title if left blank"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-brand-redSoft"
              />
            </div>

            <div>
              <label className="block text-[11px] text-white/70 mb-1">
                Excerpt (short preview)
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, excerpt: e.target.value }))
                }
                rows={2}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-brand-redSoft"
              />
            </div>

            <div>
              <label className="block text-[11px] text-white/70 mb-1">
                Content
              </label>
              <textarea
                value={form.content}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
                rows={10}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-brand-redSoft"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-white/70">
                  Status:
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as BlogStatus,
                    }))
                  }
                  className="rounded-full border border-white/20 bg-[#121212]/60 px-3 py-1 text-[11px] outline-none focus:border-brand-redSoft"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-brand-red px-5 py-2 text-[11px] font-semibold text-white hover:bg-brand-redSoft disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AdminBlogPage;
