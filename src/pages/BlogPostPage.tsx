import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
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
      <main className="bg-brand-dark text-text-primary min-h-screen px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-text-muted">Loading article…</p>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="bg-brand-dark text-text-primary min-h-screen px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="text-sm text-accent-dark-red">{error || "Article not found."}</p>
          <Link to="/blog" className="text-xs text-primary hover:text-primary-hover">
            ← Back to articles
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-dark text-text-primary min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/blog"
          className="text-xs text-primary hover:text-primary-hover"
        >
          ← Back to articles
        </Link>

        <h1 className="mt-3 text-3xl font-display font-semibold">
          {post.title}
        </h1>
        {post.publishedAt && (
          <p className="mt-2 text-xs text-text-muted">
            {new Date(post.publishedAt).toLocaleDateString()}
          </p>
        )}

        {post.imageUrl && (
          <div className="mt-6 mb-4 rounded-2xl overflow-hidden border border-[#172B3D]/10">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        <article className="mt-6 prose prose-sm max-w-none prose-headings:font-display prose-headings:text-text-primary prose-p:text-text-supporting prose-li:text-text-supporting prose-strong:text-text-primary prose-blockquote:text-text-muted prose-a:text-primary hover:prose-a:text-primary-hover prose-img:rounded-xl">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

      </div>
    </main>
  );
};

export default BlogPostPage;
