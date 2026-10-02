import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Appointment, { AppointmentStatus } from "@/models/Appointment";
import SalonSettings from "@/models/SalonSettings";
import {
  isValidDateString,
  isValidTimeString,
  isPastDateInSriLanka,
  getDayOfWeekName,
  getOpeningHoursForDay,
  timeToMinutes,
  minutesToTime,
  isOverlapping,
  normalizeAppointmentDate,
} from "@/lib/appointments";
import "@/models/Service";
import "@/models/User";

// GET /api/admin/appointments/[id] - ADMIN ONLY
export async function GET(
  _request: Request,
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

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access forbidden. Admin role required." },
        { status: 403 }
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

    const appointment = await Appointment.findById(id)
      .populate("service", "name description price duration image isActive")
      .populate("customer", "name email phone role isActive");

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("GET /api/admin/appointments/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load appointment details" },
      { status: 500 }
    );
  }
}

// Allowed status transitions map
const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// PATCH /api/admin/appointments/[id] - ADMIN ONLY
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

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access forbidden. Admin role required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, status, date, time, reason } = body;

    await connectDB();

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }

    // ACTION: RESCHEDULING (Section 17)
    if (action === "reschedule" || (date && time)) {
      if (appointment.status === "completed") {
        return NextResponse.json(
          { success: false, message: "Cannot reschedule a completed appointment" },
          { status: 400 }
        );
      }

      if (!date || !isValidDateString(date)) {
        return NextResponse.json(
          { success: false, message: "A valid date (YYYY-MM-DD) is required" },
          { status: 400 }
        );
      }

      if (!time || !isValidTimeString(time)) {
        return NextResponse.json(
          { success: false, message: "A valid time (HH:mm) is required" },
          { status: 400 }
        );
      }

      if (isPastDateInSriLanka(date)) {
        return NextResponse.json(
          { success: false, message: "Cannot reschedule to a past date" },
          { status: 400 }
        );
      }

      // Check salon opening hours
      let settings = await SalonSettings.findOne();
      if (!settings) {
        settings = await SalonSettings.create({});
      }

      const dayName = getDayOfWeekName(date);
      const dayHours = getOpeningHoursForDay(settings.openingHours, dayName);

      if (!dayHours || dayHours.isClosed) {
        return NextResponse.json(
          {
            success: false,
            message: `The salon is closed on ${dayName}s. Cannot reschedule.`,
          },
          { status: 400 }
        );
      }

      const proposedStartMin = timeToMinutes(time);
      const proposedEndMin = proposedStartMin + appointment.duration;
      const openMin = timeToMinutes(dayHours.open);
      const closeMin = timeToMinutes(dayHours.close);

      if (proposedStartMin < openMin || proposedEndMin > closeMin) {
        return NextResponse.json(
          {
            success: false,
            message: `Rescheduled slot (${appointment.duration} mins) must fit within salon hours (${dayHours.open} - ${dayHours.close}).`,
          },
          { status: 400 }
        );
      }

      // Overlap conflict check: EXCLUDE current appointment from check
      const normalizedDate = normalizeAppointmentDate(date);
      const otherAppointments = await Appointment.find({
        _id: { $ne: appointment._id },
        appointmentDate: normalizedDate,
        status: { $ne: "cancelled" },
      }).lean();

      const hasConflict = otherAppointments.some((other) => {
        const otherStart = timeToMinutes(other.startTime);
        const otherEnd = timeToMinutes(other.endTime);
        return isOverlapping(proposedStartMin, proposedEndMin, otherStart, otherEnd);
      });

      if (hasConflict) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This appointment time is no longer available. Please choose another time.",
          },
          { status: 409 }
        );
      }

      // Apply reschedule
      appointment.appointmentDate = normalizedDate;
      appointment.startTime = time;
      appointment.endTime = minutesToTime(proposedEndMin);

      // If status transition was also provided or if it was cancelled, reset to confirmed/pending
      if (status && status !== appointment.status) {
        appointment.status = status;
      } else if (appointment.status === "cancelled") {
        appointment.status = "confirmed";
      }

      await appointment.save();
      await appointment.populate("service", "name image price duration");

      return NextResponse.json({
        success: true,
        message: "Appointment rescheduled successfully",
        appointment,
      });
    }

    // ACTION: STATUS UPDATE (Section 16)
    if (status) {
      if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status value" },
          { status: 400 }
        );
      }

      const currentStatus = appointment.status;
      const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

      if (status !== currentStatus && !allowedNext.includes(status as AppointmentStatus)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid status transition from "${currentStatus}" to "${status}"`,
          },
          { status: 400 }
        );
      }

      appointment.status = status as AppointmentStatus;

      if (status === "cancelled") {
        appointment.cancelledAt = new Date();
        appointment.cancellationReason =
          reason?.trim() || "Cancelled by administrator";
      }

      await appointment.save();
      await appointment.populate("service", "name image price duration");

      return NextResponse.json({
        success: true,
        message: `Appointment marked as ${status} successfully`,
        appointment,
      });
    }

    return NextResponse.json(
      { success: false, message: "No valid action or status provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/admin/appointments/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
