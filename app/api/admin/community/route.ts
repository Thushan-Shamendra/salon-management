import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CommunityPost from "@/models/CommunityPost";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 }) };
  if (user.role !== "admin") return { error: NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 }) };
  return { user };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;
    await connectDB();
    const params = new URL(request.url).searchParams;
    const search = params.get("search")?.trim() || "";
    const status = params.get("status") || "all";
    const filter: Record<string, unknown> = {};
    if (["pending", "approved", "hidden"].includes(status)) filter.status = status;
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ author: regex }, { content: regex }];
    }
    const posts = await CommunityPost.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, posts: posts.map((post) => ({
      id: post._id.toString(), author: post.author, authorId: post.authorId, content: post.content,
      images: post.images || [], status: post.status, featured: post.featured,
      likes: post.likes?.length || 0,
      comments: (post.comments || []).map((comment) => ({ id: comment._id.toString(), author: comment.author, content: comment.content, createdAt: comment.createdAt })),
      createdAt: post.createdAt,
    })) });
  } catch (error) {
    console.error("Admin community list error:", error);
    return NextResponse.json({ success: false, message: "Could not load community posts" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;
    const { id, status, featured, commentId } = await request.json();
    await connectDB();
    const post = await CommunityPost.findById(id);
    if (!post) return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    if (commentId) {
      post.comments = post.comments.filter((comment) => comment._id.toString() !== String(commentId));
    } else {
      if (status !== undefined) {
        if (!["pending", "approved", "hidden"].includes(status)) return NextResponse.json({ success: false, message: "Invalid moderation status" }, { status: 400 });
        post.status = status;
      }
      if (featured !== undefined) post.featured = Boolean(featured);
    }
    await post.save();
    return NextResponse.json({ success: true, message: commentId ? "Comment removed" : "Post updated" });
  } catch (error) {
    console.error("Admin community update error:", error);
    return NextResponse.json({ success: false, message: "Could not update community content" }, { status: 500 });
  }
}
