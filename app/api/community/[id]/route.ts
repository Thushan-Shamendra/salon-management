import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CommunityPost from "@/models/CommunityPost";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "customer") return NextResponse.json({ success: false, message: "Log in to interact with community posts" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    await connectDB();
    const post = await CommunityPost.findOne({ _id: id, status: "approved" });
    if (!post) return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    if (body.action === "like") {
      const userId = user._id.toString();
      const liked = post.likes.includes(userId);
      if (liked) post.likes = post.likes.filter((id) => id !== userId);
      else post.likes.push(userId);
      await post.save();
      return NextResponse.json({ success: true, liked: !liked, likes: post.likes.length });
    }
    if (body.action === "comment") {
      const content = typeof body.content === "string" ? body.content.trim() : "";
      if (content.length < 1 || content.length > 500) return NextResponse.json({ success: false, message: "Comments must be between 1 and 500 characters" }, { status: 400 });
      post.comments.push({ authorId: user._id.toString(), author: user.name, content } as never);
      await post.save();
      const comment = post.comments[post.comments.length - 1];
      return NextResponse.json({ success: true, comment: { id: comment._id.toString(), author: comment.author, authorId: comment.authorId, content: comment.content, createdAt: comment.createdAt } }, { status: 201 });
    }
    return NextResponse.json({ success: false, message: "Unknown community action" }, { status: 400 });
  } catch (error) {
    console.error("Community interaction error:", error);
    return NextResponse.json({ success: false, message: "Could not update community post" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    const { id } = await params;
    await connectDB();
    const post = await CommunityPost.findById(id);
    if (!post) return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    if (user.role !== "admin" && post.authorId !== user._id.toString()) return NextResponse.json({ success: false, message: "You can only delete your own posts" }, { status: 403 });
    await post.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete community post error:", error);
    return NextResponse.json({ success: false, message: "Could not delete post" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    const { id } = await params;
    const { commentId } = await request.json();
    if (typeof commentId !== "string") return NextResponse.json({ success: false, message: "Comment ID is required" }, { status: 400 });
    await connectDB();
    const post = await CommunityPost.findById(id);
    if (!post) return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    const comment = post.comments.find((item) => item._id.toString() === commentId);
    if (!comment) return NextResponse.json({ success: false, message: "Comment not found" }, { status: 404 });
    if (user.role !== "admin" && comment.authorId !== user._id.toString()) return NextResponse.json({ success: false, message: "You can only delete your own comments" }, { status: 403 });
    post.comments = post.comments.filter((item) => item._id.toString() !== commentId);
    await post.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete community comment error:", error);
    return NextResponse.json({ success: false, message: "Could not delete comment" }, { status: 500 });
  }
}
