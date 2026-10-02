import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { checkCancellationEligibility } from "@/lib/appointments";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }

    // Security: Appointment must belong to logged in customer (or admin)
    if (appointment.customer.toString() !== user._id.toString() && user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "You are not authorized to cancel this appointment" },
        { status: 403 }
      );
    }

    // Status checks
    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { success: false, message: "This appointment is already cancelled" },
        { status: 400 }
      );
    }

    if (appointment.status === "completed") {
      return NextResponse.json(
        { success: false, message: "Cannot cancel a completed appointment" },
        { status: 400 }
      );
    }

    // RULE 13: Time window cancellation check (2-hour policy) for customers
    if (user.role !== "admin") {
      const eligibility = checkCancellationEligibility(
        appointment.appointmentDate,
        appointment.startTime
      );

      if (!eligibility.eligible) {
        return NextResponse.json(
          { success: false, message: eligibility.message },
          { status: 400 }
        );
      }
    }

    let reason = "Cancelled by customer";
    try {
      const body = await request.json();
      if (body?.reason && typeof body.reason === "string") {
        reason = body.reason.trim().slice(0, 500);
      }
    } catch {
      // Empty body is acceptable
    }

    appointment.status = "cancelled";
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason;

    await appointment.save();

    return NextResponse.json({
      success: true,
      message: "Appointment successfully cancelled",
      appointment,
    });
  } catch (error) {
    console.error("PATCH /api/account/appointments/[id]/cancel error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
