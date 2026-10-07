import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";
import { deleteCloudinaryImage, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";

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
      logoPublicId,
      aboutDescription,
      phone,
      phoneSecondary,
      whatsapp,
      email,
      address,
      openingHours,
      socialMedia,
      externalSystem,
    } = body;

    // Validate logo URL if provided
    if (logo !== undefined && logo !== null && typeof logo === "string" && logo.trim() !== "") {
      const trimmedLogo = logo.trim();
      const isHttps = trimmedLogo.startsWith("https://");
      const isLocal = trimmedLogo.startsWith("/") && !trimmedLogo.startsWith("//");
      if (!isHttps && !isLocal) {
        return NextResponse.json(
          {
            success: false,
            message: "Please enter a valid image URL (must begin with https:// or /)",
          },
          { status: 400 }
        );
      }
    }

    // Validate logoPublicId if provided
    if (
      logoPublicId !== undefined &&
      logoPublicId !== null &&
      typeof logoPublicId === "string" &&
      logoPublicId.trim() !== ""
    ) {
      const trimmedPublicId = logoPublicId.trim();
      if (!trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.SALON)) {
        return NextResponse.json(
          {
            success: false,
            message: `Logo must belong to ${CLOUDINARY_FOLDERS.SALON}`,
          },
          { status: 400 }
        );
      }
    }

    await connectDB();
    const settings = await getOrCreateSettings();

    const oldPublicId = settings.logoPublicId ? settings.logoPublicId.trim() : "";
    let shouldDeleteOldCloudinary = false;

    if (salonName !== undefined) settings.salonName = salonName.trim();

    // Update logo and logoPublicId
    if (logo !== undefined) {
      const newLogo = typeof logo === "string" ? logo.trim() : "";
      settings.logo = newLogo;
    }

    if (logoPublicId !== undefined) {
      const newPublicId = typeof logoPublicId === "string" ? logoPublicId.trim() : "";
      settings.logoPublicId = newPublicId;

      // If previous image was on Cloudinary and was replaced, removed, or switched to URL
      if (
        oldPublicId &&
        oldPublicId.startsWith(CLOUDINARY_FOLDERS.SALON) &&
        oldPublicId !== newPublicId
      ) {
        shouldDeleteOldCloudinary = true;
      }
    } else if (logo !== undefined && !logo) {
      // If logo was cleared and logoPublicId wasn't explicitly passed
      if (oldPublicId && oldPublicId.startsWith(CLOUDINARY_FOLDERS.SALON)) {
        settings.logoPublicId = "";
        shouldDeleteOldCloudinary = true;
      }
    }

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

    if (body.googleReviews && typeof body.googleReviews === "object") {
      const { enabled, placeId, businessUrl, maxReviews } = body.googleReviews;

      if (businessUrl && typeof businessUrl === "string" && businessUrl.trim() !== "") {
        const trimmedUrl = businessUrl.trim();
        if (!trimmedUrl.startsWith("https://")) {
          return NextResponse.json(
            {
              success: false,
              message: "Google Maps Business URL must be a valid https link (e.g., https://maps.google.com/...)",
            },
            { status: 400 }
          );
        }
      }

      if (maxReviews !== undefined && maxReviews !== null && maxReviews !== "") {
        const num = Number(maxReviews);
        if (isNaN(num) || num < 1 || num > 5) {
          return NextResponse.json(
            {
              success: false,
              message: "Maximum reviews to display must be between 1 and 5",
            },
            { status: 400 }
          );
        }
      }

      const currentGr = settings.googleReviews || {
        enabled: false,
        placeId: "",
        businessUrl: "",
        maxReviews: 5,
      };

      settings.googleReviews = {
        enabled: enabled !== undefined ? Boolean(enabled) : currentGr.enabled,
        placeId: typeof placeId === "string" ? placeId.trim() : currentGr.placeId,
        businessUrl: typeof businessUrl === "string" ? businessUrl.trim() : currentGr.businessUrl,
        maxReviews:
          maxReviews !== undefined && !isNaN(Number(maxReviews))
            ? Math.min(5, Math.max(1, Number(maxReviews)))
            : currentGr.maxReviews || 5,
      };
    }

    if (externalSystem !== undefined && typeof externalSystem === "object") {
      const { loginUrl, registerUrl, bookingUrl } = externalSystem;
      const urlEntries: [string, unknown][] = [
        ["Customer Login URL", loginUrl],
        ["Customer Registration URL", registerUrl],
        ["Book Appointment URL", bookingUrl],
      ];

      for (const [fieldName, urlVal] of urlEntries) {
        if (urlVal !== undefined && urlVal !== null && typeof urlVal === "string" && urlVal.trim() !== "") {
          const trimmed = urlVal.trim();
          if (!trimmed.startsWith("https://")) {
            return NextResponse.json(
              {
                success: false,
                message: `${fieldName} must be a valid https URL (e.g., https://...)`,
              },
              { status: 400 }
            );
          }
        }
      }

      settings.externalSystem = {
        loginUrl: typeof loginUrl === "string" ? loginUrl.trim() : "",
        registerUrl: typeof registerUrl === "string" ? registerUrl.trim() : "",
        bookingUrl: typeof bookingUrl === "string" ? bookingUrl.trim() : "",
      };
    }

    // 1. Save to MongoDB successfully first
    await settings.save();

    // 2. ONLY AFTER successful DB save, delete old Cloudinary image
    if (shouldDeleteOldCloudinary && oldPublicId) {
      try {
        await deleteCloudinaryImage(oldPublicId);
      } catch (cldErr) {
        console.error("Failed to delete previous salon logo from Cloudinary:", cldErr);
      }
    }

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
