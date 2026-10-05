import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";

// GET /api/settings - Public access to salon configuration
export async function GET() {
  try {
    await connectDB();
    const settings = await SalonSettings.findOne().lean();

    if (!settings) {
      return NextResponse.json({
        success: true,
        settings: {
          salonName: "LUMINA Luxury Salon",
          logo: "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        salonName: settings.salonName || "LUMINA Luxury Salon",
        logo: settings.logo || "",
        aboutDescription: settings.aboutDescription || "",
        phone: settings.phone || "",
        phoneSecondary: settings.phoneSecondary || "",
        whatsapp: settings.whatsapp || "",
        email: settings.email || "",
        address: settings.address || "",
        openingHours: settings.openingHours || [],
        socialMedia: settings.socialMedia || {},
      },
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load salon settings" },
      { status: 500 }
    );
  }
}
