import Link from "next/link";
import { ArrowRightIcon, HeartIcon, MessageCircleIcon, SparklesIcon } from "@/components/ui/icons";
import { connectDB } from "@/lib/mongodb";
import CommunityPost from "@/models/CommunityPost";

export default async function CommunityPreview() {
  let posts: { id: string; author: string; content: string; image: string; likes: number; comments: number }[] = [];
  try {
    await connectDB();
    const records = await CommunityPost.find({ status: "approved" }).sort({ featured: -1, createdAt: -1 }).limit(3).lean();
    posts = records.map((post) => ({ id: post._id.toString(), author: post.author, content: post.content, image: post.images?.[0] || "", likes: post.likes?.length || 0, comments: post.comments?.length || 0 }));
  } catch { /* The public page can render while the database is unavailable. */ }

  return <section className="bg-[#FAF7F2] py-16 md:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A]"><SparklesIcon className="h-3.5 w-3.5"/>Community Stories</div><h2 className="font-serif text-3xl font-normal tracking-tight text-[#1C1917] sm:text-4xl">Real Transformations & Inspiration</h2><p className="mt-3 text-sm leading-relaxed text-[#78716C]">Explore salon experiences and beauty tips shared by our community.</p></div><Link href="/community" className="inline-flex items-center gap-2 self-start rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-900 hover:border-[#B7925A] hover:text-[#B7925A]">Visit the Community<ArrowRightIcon className="h-4 w-4"/></Link></div>
    {posts.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <article key={post.id} className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">{post.image ? <div className="aspect-[4/3] bg-stone-100">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={post.image} alt="Salon community post" className="h-full w-full object-cover"/></div> : <div className="flex aspect-[4/3] items-center justify-center bg-white text-[#B7925A]"><SparklesIcon className="h-12 w-12"/></div>}<div className="p-5"><div className="mb-2 text-sm font-semibold text-stone-900">{post.author}</div><p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{post.content}</p><div className="mt-4 flex gap-4 border-t border-stone-100 pt-3 text-xs text-stone-500"><span className="inline-flex items-center gap-1"><HeartIcon className="h-4 w-4 text-[#B7925A]"/>{post.likes}</span><span className="inline-flex items-center gap-1"><MessageCircleIcon className="h-4 w-4"/>{post.comments}</span></div></div></article>)}</div> : <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">No approved community posts yet. Visit the community hub to join in.</div>}
  </div></section>;
}
