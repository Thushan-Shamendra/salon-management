"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import { HeartIcon, MessageCircleIcon, SearchIcon, SparklesIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from "@/components/ui/icons";

type AdminPost = { id: string; author: string; content: string; images: string[]; status: "pending" | "approved" | "hidden"; featured: boolean; likes: number; comments: { id: string; author: string; content: string }[]; createdAt: string };

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams(); if (search.trim()) params.set("search", search.trim()); if (filter !== "all") params.set("status", filter);
      const response = await fetch(`/api/admin/community?${params}`); const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not load community posts");
      setPosts(data.posts || []);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load posts"); }
    finally { setLoading(false); }
  }, [search, filter]);
  useEffect(() => { const timer = setTimeout(() => void load(), 200); return () => clearTimeout(timer); }, [load]);

  const updatePost = async (post: AdminPost, changes: { status?: AdminPost["status"]; featured?: boolean; commentId?: string }) => {
    setBusy(post.id); setNotice("");
    try {
      const response = await fetch("/api/admin/community", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post.id, ...changes }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Could not update post");
      if (changes.commentId) setPosts((current) => current.map((item) => item.id === post.id ? { ...item, comments: item.comments.filter((comment) => comment.id !== changes.commentId) } : item));
      else setPosts((current) => current.map((item) => item.id === post.id ? { ...item, ...changes } : item));
      setNotice(data.message);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update post"); }
    finally { setBusy(""); }
  };
  const deletePost = async (post: AdminPost) => {
    if (!window.confirm("Permanently delete this community post?")) return;
    setBusy(post.id);
    try { const response = await fetch(`/api/community/${post.id}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setPosts((current) => current.filter((item) => item.id !== post.id)); setNotice("Post permanently deleted"); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete post"); }
    finally { setBusy(""); }
  };

  return <div className="animate-fadeIn space-y-7">
    <AdminPageHeader title="Community Moderation" description="Review member posts, manage comments, and feature salon transformations." breadcrumbs={[{ label: "Community" }]}/>
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row">
      <div className="relative flex-1"><SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search author or post" className="w-full rounded-xl border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#B7925A]"/></div>
      <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"><option value="all">All posts</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="hidden">Hidden</option></select>
    </div>
    {loading ? <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">Loading community posts…</div> : posts.length === 0 ? <EmptyState icon={MessageCircleIcon} title="No community posts" description="Posts awaiting approval and published community content will appear here."/> :
      <div className="space-y-5">{posts.map((post) => <article key={post.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-stone-900">{post.author}</strong><StatusBadge status={post.status}/><span className="text-xs text-stone-400">{new Date(post.createdAt).toLocaleString()}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{post.content}</p></div><div className="flex items-center gap-3 text-xs text-stone-500"><span className="inline-flex items-center gap-1"><HeartIcon className="h-4 w-4 text-[#B7925A]"/>{post.likes}</span><span className="inline-flex items-center gap-1"><MessageCircleIcon className="h-4 w-4"/>{post.comments.length}</span></div></div>
        {post.images.length > 0 && <div className="mt-4 flex flex-wrap gap-3">{post.images.map((image) => <a key={image} href={image} target="_blank" rel="noreferrer" className="block h-28 w-36 overflow-hidden rounded-xl bg-stone-100">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={image} alt="Community post" className="h-full w-full object-cover"/></a>)}</div>}
        {post.comments.length > 0 && <div className="mt-4 space-y-2 border-t border-stone-100 pt-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Comments</h3>{post.comments.map((comment) => <div key={comment.id} className="flex items-start justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2"><p className="text-xs text-stone-700"><strong>{comment.author}: </strong>{comment.content}</p><button disabled={busy === post.id} onClick={() => void updatePost(post, { commentId: comment.id })} className="shrink-0 text-xs text-red-600">Remove</button></div>)}</div>}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">{post.status !== "approved" && <button disabled={busy === post.id} onClick={() => void updatePost(post, { status: "approved" })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"><CheckCircleIcon className="h-4 w-4"/>Approve</button>}{post.status !== "hidden" && <button disabled={busy === post.id} onClick={() => void updatePost(post, { status: "hidden" })} className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-700"><XCircleIcon className="h-4 w-4"/>Hide</button>}<button disabled={busy === post.id} onClick={() => void updatePost(post, { featured: !post.featured })} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><SparklesIcon className="h-4 w-4"/>{post.featured ? "Unfeature" : "Feature"}</button><button disabled={busy === post.id} onClick={() => void deletePost(post)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"><TrashIcon className="h-4 w-4"/>Delete</button></div>
      </article>)}</div>}
  </div>;
}
