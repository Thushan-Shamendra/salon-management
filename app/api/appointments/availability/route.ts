import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
import SalonSettings from "@/models/SalonSettings";
import Appointment from "@/models/Appointment";
import {
  isValidDateString,
  isPastDateInSriLanka,
  getDayOfWeekName,
  getOpeningHoursForDay,
  generateAvailableSlots,
  normalizeAppointmentDate,
} from "@/lib/appointments";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to view availability" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");
    const excludeAppointmentId = searchParams.get("excludeAppointmentId");

    if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return NextResponse.json(
        { success: false, message: "A valid serviceId parameter is required" },
        { status: 400 }
      );
    }

    if (!date || !isValidDateString(date)) {
      return NextResponse.json(
        { success: false, message: "A valid date (YYYY-MM-DD) parameter is required" },
        { status: 400 }
      );
    }

    // RULE 1: Past dates cannot be booked
    if (isPastDateInSriLanka(date)) {
      return NextResponse.json(
        { success: false, message: "Cannot check availability for past dates" },
        { status: 400 }
      );
    }

    await connectDB();

    // RULE 2 & RULE 8: Disabled services cannot be booked / must not appear
    const service = await Service.findOne({ _id: serviceId, isActive: true });
    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "The requested service is currently unavailable or inactive",
        },
        { status: 404 }
      );
    }

    // RULE 3 & RULE 4: Salon opening hours from MongoDB
    let settings = await SalonSettings.findOne();
    if (!settings) {
      settings = await SalonSettings.create({});
    }

    const dayName = getDayOfWeekName(date);
    const dayHours = getOpeningHoursForDay(settings.openingHours, dayName);

    // If salon day is marked closed or not configured
    if (!dayHours || dayHours.isClosed) {
      return NextResponse.json({
        success: true,
        date,
        day: dayName,
        service: {
          id: service._id.toString(),
          name: service.name,
          duration: service.duration,
          price: service.price,
          image: service.image,
        },
        openingHours: {
          open: dayHours?.open || "09:00",
          close: dayHours?.close || "19:00",
          isClosed: true,
        },
        slots: [],
        message: `The salon is closed on ${dayName}s.`,
      });
    }

    // RULE 6: Load existing non-cancelled appointments for that date
    const query: Record<string, unknown> = {
      appointmentDate: normalizeAppointmentDate(date),
      status: { $ne: "cancelled" },
    };

    if (excludeAppointmentId && mongoose.Types.ObjectId.isValid(excludeAppointmentId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeAppointmentId) };
    }

    const existingAppointments = await Appointment.find(query, "startTime endTime").lean();

    // RULE 5, RULE 6, RULE 7: Generate available slots
    const slots = generateAvailableSlots({
      openTime: dayHours.open,
      closeTime: dayHours.close,
      isClosed: dayHours.isClosed,
      serviceDuration: service.duration,
      existingBookings: existingAppointments.map((a) => ({
        startTime: a.startTime,
        endTime: a.endTime,
      })),
      dateStr: date,
    });

    return NextResponse.json({
      success: true,
      date,
      day: dayName,
      service: {
        id: service._id.toString(),
        name: service.name,
        duration: service.duration,
        price: service.price,
        image: service.image,
      },
      openingHours: {
        open: dayHours.open,
        close: dayHours.close,
        isClosed: false,
      },
      slots,
    });
  } catch (error) {
    console.error("GET /api/appointments/availability error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to calculate appointment availability" },
      { status: 500 }
    );
  }
}
