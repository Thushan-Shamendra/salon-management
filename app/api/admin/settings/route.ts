import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";

// Helper to ensure singleton settings exist
async function getOrCreateSettings() {
  let settings = await SalonSettings.findOne();
  if (!settings) {
    settings = await SalonSettings.create({});
  }
  return settings;
}

// GET /api/admin/settings - ADMIN ONLY: fetch salon settings
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
    const settings = await getOrCreateSettings();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load website settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - ADMIN ONLY: update salon settings
export async function PUT(request: Request) {
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

    const body = await request.json();
    const {
      salonName,
      logo,
      aboutDescription,
      phone,
      phoneSecondary,
      whatsapp,
      email,
      address,
      openingHours,
      socialMedia,
    } = body;

    await connectDB();
    const settings = await getOrCreateSettings();

    if (salonName !== undefined) settings.salonName = salonName.trim();
    if (logo !== undefined) settings.logo = logo.trim();
    if (aboutDescription !== undefined) settings.aboutDescription = aboutDescription.trim();
    if (phone !== undefined) settings.phone = phone.trim();
    if (phoneSecondary !== undefined) settings.phoneSecondary = phoneSecondary.trim();
    if (whatsapp !== undefined) settings.whatsapp = whatsapp.trim();
    if (email !== undefined) settings.email = email.trim();
    if (address !== undefined) settings.address = address.trim();
    if (Array.isArray(openingHours)) settings.openingHours = openingHours;
    if (socialMedia && typeof socialMedia === "object") {
      settings.socialMedia = {
        facebook: socialMedia.facebook || "",
        instagram: socialMedia.instagram || "",
        tiktok: socialMedia.tiktok || "",
        whatsapp: socialMedia.whatsapp || "",
      };
    }

    await settings.save();

    return NextResponse.json({
      success: true,
      message: "Website settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("PUT /api/admin/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update website settings" },
      { status: 500 }
    );
  }
}
