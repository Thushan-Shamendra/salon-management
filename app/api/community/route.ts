import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CommunityPost from "@/models/CommunityPost";

function cleanImages(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 3) return null;
  const images: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const image = item.trim();
    const remoteOrLocal = image.length <= 1500 && (image.startsWith("/") || /^https?:\/\//i.test(image));
    let embeddedImage = false;
    if (image.length <= 1_500_000) {
      const match = image.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/i);
      if (match) {
        const bytes = Buffer.from(match[2], "base64");
        const mime = match[1].toLowerCase();
        embeddedImage = mime === "jpeg"
          ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
          : mime === "png"
            ? bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
            : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
      }
    }
    if (!remoteOrLocal && !embeddedImage) return null;
    images.push(image);
  }
  return images;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    await connectDB();
    const posts = await CommunityPost.find({ status: "approved" })
      .sort({ featured: -1, createdAt: -1 }).limit(60).lean();
    return NextResponse.json({
      success: true,
      posts: posts.map((post) => ({
        id: post._id.toString(), author: post.author, profileImage: post.profileImage,
        authorId: post.authorId, content: post.content, images: post.images || [],
        featured: post.featured, likes: post.likes?.length || 0,
        liked: Boolean(user && post.likes?.includes(user._id.toString())),
        comments: (post.comments || []).map((comment) => ({
          id: comment._id.toString(), author: comment.author, authorId: comment.authorId,
          content: comment.content, createdAt: comment.createdAt,
        })), createdAt: post.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/community error:", error);
    return NextResponse.json({ success: false, message: "Could not load community posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "customer") return NextResponse.json({ success: false, message: "Log in as a customer to post" }, { status: 401 });
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const images = cleanImages(body.images);
    if (content.length < 2 || content.length > 1200) return NextResponse.json({ success: false, message: "Write a post between 2 and 1,200 characters" }, { status: 400 });
    if (!images) return NextResponse.json({ success: false, message: "Add up to three valid image URLs" }, { status: 400 });
    await connectDB();
    const post = await CommunityPost.create({
      authorId: user._id.toString(), author: user.name, profileImage: user.profileImage || "",
      content, images, status: "pending",
    });
    return NextResponse.json({ success: true, message: "Your post was submitted for admin approval", id: post._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("POST /api/community error:", error);
    return NextResponse.json({ success: false, message: "Could not create community post" }, { status: 500 });
  }
}
