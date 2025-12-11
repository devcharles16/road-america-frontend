import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPublishedPosts, type BlogPost } from "../services/blogService";

const BlogListPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPublishedPosts();
        setPosts(data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load blog posts.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="bg-brand-dark text-white min-h-screen px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-display font-semibold">Transport Insights</h1>
        <p className="text-sm text-white/70 mt-2 max-w-2xl">
          Guides, tips, and updates from the Road America Auto Transport team
          to help you move vehicles with confidence.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-white/60">Loading posts…</p>
        ) : error ? (
          <p className="mt-8 text-sm text-red-400">{error}</p>
        ) : posts.length === 0 ? (
          <p className="mt-8 text-sm text-white/60">
            No articles have been published yet. Check back soon.
          </p>
        ) : (
          <div className="mt-8 space-y-6">
            {posts.map((post) => (
              <Link
  key={post.id}
  to={`/blog/${post.slug}`}
  className="block rounded-2xl border border-white/10 bg-black/50 overflow-hidden hover:border-brand-redSoft hover:bg-black/70 transition"
>
  {post.imageUrl && (
    <div className="h-40 w-full overflow-hidden">
      <img
        src={post.imageUrl}
        alt={post.title}
        className="h-full w-full object-cover"
      />
    </div>
  )}
  <div className="p-5">
    <h2 className="text-lg font-semibold">{post.title}</h2>
    {post.publishedAt && (
      <p className="mt-1 text-[11px] uppercase tracking-wide text-white/50">
        {new Date(post.publishedAt).toLocaleDateString()}
      </p>
    )}
    {post.excerpt && (
      <p className="mt-2 text-sm text-white/70">{post.excerpt}</p>
    )}
    <p className="mt-3 text-[11px] text-brand-redSoft">
      Read article →
    </p>
  </div>
</Link>

            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default BlogListPage;
