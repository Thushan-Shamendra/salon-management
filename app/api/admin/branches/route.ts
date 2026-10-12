import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import Branch, { generateSlug, IBranchOpeningHour } from "@/models/Branch";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// GET /api/admin/branches - list all branches sorted by displayOrder asc, then createdAt asc
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const branches = await Branch.find().sort({
      displayOrder: 1,
      createdAt: 1,
    });

    return NextResponse.json({
      success: true,
      branches,
    });
  } catch (error) {
    console.error("Admin branches GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load branches" },
      { status: 500 }
    );
  }
}

// POST /api/admin/branches - create a new branch
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      phone,
      whatsappNumber,
      email,
      address,
      latitude,
      longitude,
      googleMapsUrl,
      googlePlaceId,
      googleReviewUrl,
      reviewsEnabled,
      openingHours,
      isActive,
      displayOrder,
    } = body;

    // Required fields validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Branch name is required" },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { success: false, message: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!address?.trim()) {
      return NextResponse.json(
        { success: false, message: "Address is required" },
        { status: 400 }
      );
    }

    // Optional email validation
    if (email?.trim() && !isValidEmail(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Latitude validation
    let parsedLat: number | undefined = undefined;
    if (latitude !== undefined && latitude !== null && latitude !== "") {
      const numLat = Number(latitude);
      if (isNaN(numLat) || numLat < -90 || numLat > 90) {
        return NextResponse.json(
          { success: false, message: "Latitude must be a number between -90 and 90" },
          { status: 400 }
        );
      }
      parsedLat = numLat;
    }

    // Longitude validation
    let parsedLng: number | undefined = undefined;
    if (longitude !== undefined && longitude !== null && longitude !== "") {
      const numLng = Number(longitude);
      if (isNaN(numLng) || numLng < -180 || numLng > 180) {
        return NextResponse.json(
          { success: false, message: "Longitude must be a number between -180 and 180" },
          { status: 400 }
        );
      }
      parsedLng = numLng;
    }

    // Google Maps URL validation
    if (googleMapsUrl?.trim() && !isValidUrl(googleMapsUrl.trim())) {
      return NextResponse.json(
        { success: false, message: "Google Maps URL must be a valid HTTP or HTTPS URL" },
        { status: 400 }
      );
    }

    // Google Review URL validation
    if (googleReviewUrl?.trim() && !isValidUrl(googleReviewUrl.trim())) {
      return NextResponse.json(
        { success: false, message: "Google Review URL must be a valid HTTP or HTTPS URL" },
        { status: 400 }
      );
    }

    // Display order validation
    const orderNum =
      displayOrder !== undefined && displayOrder !== null && displayOrder !== ""
        ? Math.max(0, Number(displayOrder) || 0)
        : 0;

    // Validate opening hours
    const parsedHours: IBranchOpeningHour[] = [];
    if (Array.isArray(openingHours)) {
      for (const item of openingHours) {
        if (!item || typeof item !== "object") continue;
        const day = String(item.day || "").trim();
        if (!day) continue;
        const isClosed = Boolean(item.isClosed);
        const openTime = item.openTime ? String(item.openTime).trim() : "";
        const closeTime = item.closeTime ? String(item.closeTime).trim() : "";

        if (!isClosed && (!openTime || !closeTime)) {
          return NextResponse.json(
            {
              success: false,
              message: `Both open time and close time are required for ${day} when not closed`,
            },
            { status: 400 }
          );
        }

        parsedHours.push({
          day,
          isClosed,
          openTime: isClosed ? "" : openTime || "09:00",
          closeTime: isClosed ? "" : closeTime || "19:00",
        });
      }
    }

    // Slug generation and uniqueness check
    const trimmedName = name.trim();
    const generatedSlug = generateSlug(trimmedName) || `branch-${Date.now()}`;

    // Cleanly reject duplicate branch names or slugs
    const existingBranch = await Branch.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        { slug: generatedSlug },
      ],
    });

    if (existingBranch) {
      return NextResponse.json(
        {
          success: false,
          message: "A branch with this name or slug already exists",
        },
        { status: 400 }
      );
    }

    const newBranch = await Branch.create({
      name: trimmedName,
      slug: generatedSlug,
      phone: phone.trim(),
      whatsappNumber: whatsappNumber?.trim() || "",
      email: email?.trim() || "",
      address: address.trim(),
      latitude: parsedLat,
      longitude: parsedLng,
      googleMapsUrl: googleMapsUrl?.trim() || "",
      googlePlaceId: googlePlaceId?.trim() || "",
      googleReviewUrl: googleReviewUrl?.trim() || "",
      reviewsEnabled: Boolean(reviewsEnabled),
      openingHours: parsedHours,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      displayOrder: orderNum,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Branch created successfully",
        branch: newBranch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create branch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create branch" },
      { status: 500 }
    );
  }
}
