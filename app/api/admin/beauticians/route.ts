import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Beautician from "@/models/Beautician";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";

function isValidHttpsUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim());
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

// GET /api/admin/beauticians - ADMIN ONLY: list all beauticians with real statistics
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
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const [beauticians, totalBeauticians, activeBeauticians, hiddenBeauticians, featuredBeauticians] =
      await Promise.all([
        Beautician.find().sort({ displayOrder: 1, createdAt: -1 }).lean(),
        Beautician.countDocuments(),
        Beautician.countDocuments({ isActive: true }),
        Beautician.countDocuments({ isActive: false }),
        Beautician.countDocuments({ isFeatured: true }),
      ]);

    return NextResponse.json({
      success: true,
      beauticians,
      stats: {
        totalBeauticians,
        activeBeauticians,
        hiddenBeauticians,
        featuredBeauticians,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/beauticians error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load beauticians" },
      { status: 500 }
    );
  }
}

// POST /api/admin/beauticians - ADMIN ONLY: create beautician profile
export async function POST(request: Request) {
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
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      jobTitle,
      bio,
      specialties,
      experienceYears,
      image,
      imagePublicId,
      instagram,
      facebook,
      isActive,
      isFeatured,
      displayOrder,
    } = body;

    // Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Beautician name is required" },
        { status: 400 }
      );
    }
    if (name.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: "Name cannot exceed 100 characters" },
        { status: 400 }
      );
    }

    // Validate jobTitle
    if (!jobTitle || typeof jobTitle !== "string" || !jobTitle.trim()) {
      return NextResponse.json(
        { success: false, message: "Job title is required" },
        { status: 400 }
      );
    }
    if (jobTitle.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: "Job title cannot exceed 100 characters" },
        { status: 400 }
      );
    }

    // Validate bio (optional)
    if (bio !== undefined && typeof bio === "string" && bio.trim().length > 500) {
      return NextResponse.json(
        { success: false, message: "Bio cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    // Validate experienceYears (optional, 0 - 60)
    let parsedExperience = 0;
    if (experienceYears !== undefined && experienceYears !== null && experienceYears !== "") {
      const exp = Number(experienceYears);
      if (isNaN(exp) || exp < 0 || exp > 60) {
        return NextResponse.json(
          {
            success: false,
            message: "Years of experience must be a valid number between 0 and 60",
          },
          { status: 400 }
        );
      }
      parsedExperience = exp;
    }

    // Validate image & imagePublicId
    if (!image || typeof image !== "string" || !image.trim()) {
      return NextResponse.json(
        { success: false, message: "Profile photo is required" },
        { status: 400 }
      );
    }

    if (!imagePublicId || typeof imagePublicId !== "string" || !imagePublicId.trim()) {
      return NextResponse.json(
        { success: false, message: "Profile photo public ID is required" },
        { status: 400 }
      );
    }

    const trimmedPublicId = imagePublicId.trim();
    if (!trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.BEAUTICIANS)) {
      return NextResponse.json(
        {
          success: false,
          message: `Profile photo must belong to ${CLOUDINARY_FOLDERS.BEAUTICIANS}`,
        },
        { status: 400 }
      );
    }

    // Validate social URLs
    if (instagram && typeof instagram === "string" && instagram.trim() !== "") {
      if (!isValidHttpsUrl(instagram)) {
        return NextResponse.json(
          {
            success: false,
            message: "Instagram URL must be a valid https link (e.g., https://instagram.com/username)",
          },
          { status: 400 }
        );
      }
    }

    if (facebook && typeof facebook === "string" && facebook.trim() !== "") {
      if (!isValidHttpsUrl(facebook)) {
        return NextResponse.json(
          {
            success: false,
            message: "Facebook URL must be a valid https link (e.g., https://facebook.com/username)",
          },
          { status: 400 }
        );
      }
    }

    // Parse specialties
    let parsedSpecialties: string[] = [];
    if (Array.isArray(specialties)) {
      parsedSpecialties = specialties
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean);
    } else if (typeof specialties === "string" && specialties.trim()) {
      parsedSpecialties = specialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Parse displayOrder
    let parsedOrder = 0;
    if (displayOrder !== undefined && displayOrder !== null && displayOrder !== "") {
      const ord = Number(displayOrder);
      if (!isNaN(ord)) parsedOrder = ord;
    }

    await connectDB();

    const beautician = await Beautician.create({
      name: name.trim(),
      jobTitle: jobTitle.trim(),
      bio: typeof bio === "string" ? bio.trim() : "",
      specialties: parsedSpecialties,
      experienceYears: parsedExperience,
      image: image.trim(),
      imagePublicId: trimmedPublicId,
      instagram: typeof instagram === "string" ? instagram.trim() : "",
      facebook: typeof facebook === "string" ? facebook.trim() : "",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
      displayOrder: parsedOrder,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Beautician added successfully",
        beautician,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/beauticians error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create beautician profile" },
      { status: 500 }
    );
  }
}
