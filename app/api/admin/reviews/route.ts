import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";

// GET /api/admin/reviews - ADMIN ONLY: list all reviews with filter and search
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access forbidden. Admin role required." },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const rating = searchParams.get("rating");

    const filter: Record<string, unknown> = {};

    if (status !== "all" && ["pending", "approved", "hidden"].includes(status)) {
      filter.status = status;
    }

    if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
      filter.rating = Number(rating);
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ author: regex }, { comment: regex }, { service: regex }];
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        author: r.author,
        rating: r.rating,
        service: r.service || "Salon Service",
        comment: r.comment,
        status: r.status,
        createdAt: r.createdAt,
      })),
      total: reviews.length,
    });
  } catch (error) {
    console.error("Admin reviews list error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load reviews" },
      { status: 500 }
    );
  }
}
