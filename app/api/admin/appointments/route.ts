import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { normalizeAppointmentDate } from "@/lib/appointments";
import "@/models/Service";
import "@/models/User";

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status")?.trim();
    const service = searchParams.get("service")?.trim();
    const date = searchParams.get("date")?.trim();

    await connectDB();

    const query: Record<string, unknown> = {};

    if (status && ["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      query.status = status;
    }

    if (service && mongoose.Types.ObjectId.isValid(service)) {
      query.service = new mongoose.Types.ObjectId(service);
    }

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      query.appointmentDate = normalizeAppointmentDate(date);
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { customerPhone: searchRegex },
      ];
    }

    const appointments = await Appointment.find(query)
      .populate("service", "name price duration image isActive")
      .populate("customer", "name email phone")
      .sort({ appointmentDate: -1, startTime: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      appointments,
      total: appointments.length,
    });
  } catch (error) {
    console.error("GET /api/admin/appointments error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load admin appointments" },
      { status: 500 }
    );
  }
}
