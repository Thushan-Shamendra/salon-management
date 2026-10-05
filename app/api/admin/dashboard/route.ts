import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Service from "@/models/Service";
import Review from "@/models/Review";
import Appointment from "@/models/Appointment";
import Gallery from "@/models/Gallery";
import { getSriLankaNow, normalizeAppointmentDate } from "@/lib/appointments";

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

    const { dateStr: todayStr } = getSriLankaNow();
    const todayDate = normalizeAppointmentDate(todayStr);

    // Query REAL database statistics for all implemented models
    const [
      totalCustomers,
      activeCustomers,
      totalServices,
      activeServices,
      totalReviews,
      pendingReviews,
      allReviews,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      totalGalleryPhotos,
      activeGalleryPhotos,
      todaySchedule,
    ] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "customer", isActive: true }),
      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Review.countDocuments(),
      Review.countDocuments({ status: "pending" }),
      Review.find({}, "rating").lean(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ appointmentDate: todayDate }),
      Appointment.countDocuments({ status: "pending" }),
      Appointment.countDocuments({ status: "confirmed" }),
      Appointment.countDocuments({ status: "completed" }),
      Appointment.countDocuments({ status: "cancelled" }),
      Gallery.countDocuments(),
      Gallery.countDocuments({ isActive: true }),
      Appointment.find({ appointmentDate: todayDate })
        .populate("service", "name duration price")
        .populate("customer", "name phone email")
        .sort({ startTime: 1 })
        .lean(),
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
        // Real Gallery statistics
        totalGalleryPhotos,
        activeGalleryPhotos,
        // Real Appointment statistics
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        todayDate: todayStr,
        // Unimplemented modules explicitly marked as null
        totalCommunityPosts: null,
      },
      todaySchedule,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load dashboard statistics" },
      { status: 500 }
    );
  }
}
