import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
import SalonSettings from "@/models/SalonSettings";
import Appointment from "@/models/Appointment";
import {
  isValidDateString,
  isValidTimeString,
  isPastDateInSriLanka,
  getSriLankaNow,
  timeToMinutes,
  minutesToTime,
  isOverlapping,
  getDayOfWeekName,
  getOpeningHoursForDay,
  normalizeAppointmentDate,
} from "@/lib/appointments";

export async function POST(request: Request) {
  try {
    // 1. Authenticate customer from session/JWT
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to book an appointment" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account is inactive. Please contact support." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { serviceId, date, time, note } = body;

    // 2. Validate input fields
    if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return NextResponse.json(
        { success: false, message: "A valid service must be selected" },
        { status: 400 }
      );
    }

    if (!date || !isValidDateString(date)) {
      return NextResponse.json(
        { success: false, message: "A valid appointment date (YYYY-MM-DD) is required" },
        { status: 400 }
      );
    }

    if (!time || !isValidTimeString(time)) {
      return NextResponse.json(
        { success: false, message: "A valid appointment time (HH:mm) is required" },
        { status: 400 }
      );
    }

    // RULE 1: Past dates/times cannot be booked
    if (isPastDateInSriLanka(date)) {
      return NextResponse.json(
        { success: false, message: "Cannot book appointments for past dates" },
        { status: 400 }
      );
    }

    const { dateStr: todayStr, minutes: currentMinutes } = getSriLankaNow();
    const proposedStartMin = timeToMinutes(time);

    if (date === todayStr && proposedStartMin <= currentMinutes) {
      return NextResponse.json(
        { success: false, message: "Cannot book a time slot in the past" },
        { status: 400 }
      );
    }

    await connectDB();

    // RULE 2 & 8: Validate active service
    const service = await Service.findOne({ _id: serviceId, isActive: true });
    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "The requested service is not available for booking",
        },
        { status: 400 }
      );
    }

    // RULE 3 & 4: Load SalonSettings & validate opening hours
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
          message: `The salon is closed on ${dayName}s. Please choose another date.`,
        },
        { status: 400 }
      );
    }

    const openMin = timeToMinutes(dayHours.open);
    const closeMin = timeToMinutes(dayHours.close);

    // RULE 5 & RULE 7: End time calculation and closing time boundary
    const proposedEndMin = proposedStartMin + service.duration;

    if (proposedStartMin < openMin || proposedEndMin > closeMin) {
      return NextResponse.json(
        {
          success: false,
          message: `Appointment duration (${service.duration} mins) must fit within salon hours (${dayHours.open} - ${dayHours.close}).`,
        },
        { status: 400 }
      );
    }

    const endTime = minutesToTime(proposedEndMin);

    // RULE 6 & DOUBLE BOOKING PROTECTION (Section 9):
    // Re-check for overlap immediately before creating
    const normalizedDate = normalizeAppointmentDate(date);
    const existingAppointments = await Appointment.find({
      appointmentDate: normalizedDate,
      status: { $ne: "cancelled" },
    }).lean();

    const hasConflict = existingAppointments.some((appt) => {
      const apptStart = timeToMinutes(appt.startTime);
      const apptEnd = timeToMinutes(appt.endTime);
      return isOverlapping(proposedStartMin, proposedEndMin, apptStart, apptEnd);
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

    // Sanitize optional note
    const sanitizedNote =
      typeof note === "string" ? note.trim().slice(0, 500) : "";

    // RULE 10 & SNAPSHOT VALUES:
    // Create appointment with trusted server-side snapshots
    const appointment = await Appointment.create({
      customer: user._id,
      service: service._id,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || "",
      appointmentDate: normalizedDate,
      startTime: time,
      endTime,
      duration: service.duration, // snapshot
      price: service.price, // snapshot
      note: sanitizedNote,
      status: "pending", // default pending
    });

    // Populate service details for response
    await appointment.populate("service", "name image");

    return NextResponse.json(
      {
        success: true,
        message: "Appointment booked successfully",
        appointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/appointments error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to book appointment" },
      { status: 500 }
    );
  }
}
