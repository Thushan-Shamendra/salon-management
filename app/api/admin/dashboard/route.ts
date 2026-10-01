import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Service from "@/models/Service";
import Review from "@/models/Review";
import CommunityPost from "@/models/CommunityPost";

// GET /api/admin/dashboard - ADMIN ONLY
export async function GET() {
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

    // Query REAL database statistics for implemented models
    const [totalCustomers, activeCustomers, totalServices, activeServices, totalReviews, pendingReviews, allReviews, totalCommunityPosts] =
      await Promise.all([
        User.countDocuments({ role: "customer" }),
        User.countDocuments({ role: "customer", isActive: true }),
        Service.countDocuments(),
        Service.countDocuments({ isActive: true }),
        Review.countDocuments(),
        Review.countDocuments({ status: "pending" }),
        Review.find({ status: "approved" }, "rating").lean(),
        CommunityPost.countDocuments(),
      ]);

    const averageRating =
      allReviews.length > 0
        ? Number(
            (
              allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
              allReviews.length
            ).toFixed(1)
          )
        : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        activeCustomers,
        totalServices,
        activeServices,
        totalReviews,
        pendingReviews,
        averageRating,
        // Appointment management is not implemented yet.
        totalAppointments: null,
        todayAppointments: null,
        totalCommunityPosts,
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load dashboard statistics" },
      { status: 500 }
    );
  }
}
