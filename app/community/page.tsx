import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CommunityFeed from "@/components/community/CommunityFeed";
import { getCurrentUser } from "@/lib/auth";
import { SparklesIcon } from "@/components/ui/icons";

export const metadata = {
  title: "Salon Community Hub | Lumina Salon",
  description: "Share salon transformations, beauty tips, and inspiration with our community.",
};

export default async function CommunityPage() {
  const user = await getCurrentUser();
  return <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]">
    <Navbar />
    <main className="flex-1 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 border-b border-stone-200/80 pb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#B7925A]/30 bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#B7925A]"><SparklesIcon className="h-3.5 w-3.5"/><span>Member Community Hub</span></div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-stone-900 sm:text-4xl">Transformations & Inspiration</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">Share hair transformations, beauty tips, and salon experiences with the Lumina community.</p>
        </div>
        <CommunityFeed userId={user?._id.toString() || null} userName={user?.name || null}/>
      </div>
    </main>
    <Footer />
  </div>;
}
