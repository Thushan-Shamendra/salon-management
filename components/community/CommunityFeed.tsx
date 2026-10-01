"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { HeartIcon, MessageCircleIcon, SparklesIcon, TrashIcon } from "@/components/ui/icons";

type Comment = { id: string; author: string; authorId: string; content: string; createdAt: string };
type Post = { id: string; author: string; authorId: string; content: string; images: string[]; featured: boolean; likes: number; liked: boolean; comments: Comment[]; createdAt: string };

export default function CommunityFeed({ userId, userName }: { userId: string | null; userName: string | null }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const loadPosts = useCallback(async () => {
    try {
      setError("");
      const response = await fetch("/api/community");
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not load posts");
      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load community posts");
    } finally {
      setLoading(false);
    }
  }, []);

  // Data is loaded after mount from the API; this one-time state update is required for the client feed.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const submitPost = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true); setNotice(""); setError("");
    try {
      const images = [...imageUrls.split(/\n|,/).map((value) => value.trim()).filter(Boolean), ...uploadedImages];
      const response = await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, images }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not submit post");
      setContent(""); setImageUrls(""); setUploadedImages([]); setNotice(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit post");
    } finally { setSubmitting(false); }
  };

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1024 * 1024)) {
      setError("Choose JPEG, PNG, or WebP images up to 1 MB each."); return;
    }
    const currentUrls = imageUrls.split(/\n|,/).map((value) => value.trim()).filter(Boolean);
    if (currentUrls.length + uploadedImages.length + selected.length > 3) { setError("Add up to three images per post."); return; }
    try {
      const encoded = await Promise.all(selected.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Image could not be read")); reader.onerror = () => reject(new Error("Image could not be read")); reader.readAsDataURL(file);
      })));
      setUploadedImages((current) => [...current, ...encoded]); setError("");
    } catch { setError("Could not read selected image files."); }
  };

  const interact = async (post: Post, action: "like" | "comment") => {
    if (!userId) return;
    const draft = commentDrafts[post.id] || "";
    try {
      const response = await fetch(`/api/community/${post.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, content: draft }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update post");
      setPosts((current) => current.map((item) => item.id !== post.id ? item : action === "like"
        ? { ...item, liked: data.liked, likes: data.likes }
        : { ...item, comments: [...item.comments, data.comment] }));
      if (action === "comment") setCommentDrafts((current) => ({ ...current, [post.id]: "" }));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update post"); }
  };

  const deletePost = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    const response = await fetch(`/api/community/${postId}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) { setError(data.message || "Could not delete post"); return; }
    setPosts((current) => current.filter((post) => post.id !== postId));
  };

  const deleteComment = async (post: Post, commentId: string) => {
    const response = await fetch(`/api/community/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId }) });
    const data = await response.json();
    if (!response.ok) { setError(data.message || "Could not delete comment"); return; }
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, comments: item.comments.filter((comment) => comment.id !== commentId) } : item));
  };

  return <>
    {userId ? <form onSubmit={submitPost} className="mb-9 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7 shadow-sm">
      <h2 className="font-serif text-xl text-stone-900">Share with the community</h2>
      <p className="mt-1 text-sm text-stone-500">Posting as {userName}. New posts appear after admin approval.</p>
      <textarea value={content} onChange={(event) => setContent(event.target.value)} required minLength={2} maxLength={1200} rows={3} placeholder="Share a transformation, care tip, or salon experience…" className="mt-4 w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-[#B7925A]" />
      <label className="mt-3 block text-xs font-semibold text-stone-600">Image URLs (optional, up to 3; one per line)
        <textarea value={imageUrls} onChange={(event) => setImageUrls(event.target.value)} rows={2} placeholder="https://…" className="mt-1 w-full rounded-xl border border-stone-200 p-3 text-sm font-normal outline-none focus:border-[#B7925A]" />
      </label>
      <label className="mt-3 block text-xs font-semibold text-stone-600">Or upload JPEG, PNG, or WebP images (up to 1 MB each)
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void addImages(event.target.files)} className="mt-1 block w-full rounded-xl border border-stone-200 p-2 text-xs font-normal" />
      </label>
      {uploadedImages.length > 0 && <div className="mt-3 flex gap-2">{uploadedImages.map((image, index) => <div key={index} className="relative h-16 w-16 overflow-hidden rounded-lg bg-stone-100">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={image} alt={`Selected upload ${index + 1}`} className="h-full w-full object-cover"/><button type="button" aria-label="Remove uploaded image" onClick={() => setUploadedImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-0 top-0 rounded-bl bg-white/90 px-1 text-xs text-red-600">×</button></div>)}</div>}
      <button disabled={submitting} className="mt-3 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Submitting…" : "Submit for review"}</button>
    </form> : <div className="mb-9 flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-600">Join the conversation and share your salon experience.</p>
      <Link href="/login?redirect=/community" className="shrink-0 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white">Log in</Link>
    </div>}
    {notice && <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p className="py-12 text-center text-stone-500">Loading community posts…</p> : posts.length === 0 ? <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-500">No approved posts yet. Be the first to share!</div> :
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <article key={post.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {post.images.map((image, index) => <div key={`${image}-${index}`} className="aspect-[4/3] bg-stone-100">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={image} alt="Community post" className="h-full w-full object-cover" /></div>)}
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><span className="font-semibold text-stone-900">{post.author}</span><span className="ml-2 text-xs text-stone-400">{new Date(post.createdAt).toLocaleDateString()}</span></div>{post.featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800"><SparklesIcon className="h-3 w-3"/> Featured</span>}</div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{post.content}</p>
          <div className="mt-4 flex items-center gap-4 border-t border-stone-100 pt-3 text-sm text-stone-600">
            <button type="button" onClick={() => void interact(post, "like")} disabled={!userId} aria-pressed={post.liked} className="inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"><HeartIcon className={`h-4 w-4 ${post.liked ? "fill-rose-500 text-rose-500" : "text-[#B7925A]"}`} />{post.likes}</button>
            <span className="inline-flex items-center gap-1.5"><MessageCircleIcon className="h-4 w-4"/>{post.comments.length}</span>
            {userId === post.authorId && <button type="button" onClick={() => void deletePost(post.id)} className="ml-auto inline-flex items-center gap-1 text-xs text-red-600"><TrashIcon className="h-3.5 w-3.5"/> Delete</button>}
          </div>
          <div className="mt-3 space-y-2">{post.comments.map((comment) => <div key={comment.id} className="flex items-start justify-between gap-2 rounded-lg bg-stone-50 px-3 py-2 text-xs"><div><strong className="text-stone-800">{comment.author}</strong><span className="ml-2 text-stone-600">{comment.content}</span></div>{userId === comment.authorId && <button type="button" onClick={() => void deleteComment(post, comment.id)} className="shrink-0 text-red-600">Delete</button>}</div>)}</div>
          {userId && <form onSubmit={(event) => { event.preventDefault(); void interact(post, "comment"); }} className="mt-3 flex gap-2"><input value={commentDrafts[post.id] || ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} maxLength={500} placeholder="Write a comment…" className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-xs outline-none focus:border-[#B7925A]"/><button className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white">Send</button></form>}
        </div>
      </article>)}</div>}
  </>;
}
