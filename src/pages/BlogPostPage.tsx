import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPostBySlug, type BlogPost } from "../services/blogService";

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPostBySlug(slug);
        if (!data) {
          setError("This article could not be found.");
        } else {
          setPost(data);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to load this article.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <main className="bg-brand-dark text-white min-h-screen px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-white/60">Loading article…</p>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="bg-brand-dark text-white min-h-screen px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="text-sm text-red-400">{error || "Article not found."}</p>
          <Link to="/blog" className="text-xs text-brand-redSoft hover:text-brand-red">
            ← Back to articles
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-dark text-white min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/blog"
          className="text-xs text-brand-redSoft hover:text-brand-red"
        >
          ← Back to articles
        </Link>

        <h1 className="mt-3 text-3xl font-display font-semibold">
          {post.title}
        </h1>
        {post.publishedAt && (
          <p className="mt-2 text-xs text-white/60">
            {new Date(post.publishedAt).toLocaleDateString()}
          </p>
        )}

        <article className="mt-6 prose prose-invert prose-sm max-w-none">
          {/* For now content is plain text; later we can support Markdown */}
          <p className="whitespace-pre-line text-sm text-white/80">
            {post.content}
          </p>
        </article>
      </div>
    </main>
  );
};

export default BlogPostPage;
