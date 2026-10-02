import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
// Ensure Service model is registered for populate
import "@/models/Service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Security: Only query appointments belonging strictly to the logged-in user
    const appointments = await Appointment.find({ customer: user._id })
      .populate("service", "name description image price duration")
      .sort({ appointmentDate: -1, startTime: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("GET /api/account/appointments error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load account appointments" },
      { status: 500 }
    );
  }
}
