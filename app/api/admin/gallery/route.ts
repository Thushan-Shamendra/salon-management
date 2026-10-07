import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Gallery, { normalizeCropSettings } from "@/models/Gallery";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-constants";

// GET /api/admin/gallery - ADMIN ONLY: list all gallery photos and real statistics
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

    const [photos, totalPhotos, activePhotos, hiddenPhotos, featuredPhotos] =
      await Promise.all([
        Gallery.find().sort({ displayOrder: 1, createdAt: -1 }).lean(),
        Gallery.countDocuments(),
        Gallery.countDocuments({ isActive: true }),
        Gallery.countDocuments({ isActive: false }),
        Gallery.countDocuments({ isFeatured: true }),
      ]);

    const formattedPhotos = photos.map((photo) => {
      const normalizedCrops = normalizeCropSettings(photo);
      return {
        ...photo,
        cropSettings: normalizedCrops,
        cropPosition: normalizedCrops.gallery,
      };
    });

    return NextResponse.json({
      success: true,
      photos: formattedPhotos,
      stats: {
        totalPhotos,
        activePhotos,
        hiddenPhotos,
        featuredPhotos,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/gallery error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load gallery photos" },
      { status: 500 }
    );
  }
}

// POST /api/admin/gallery - ADMIN ONLY: create gallery photo
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
      title,
      description,
      category,
      image,
      imagePublicId,
      altText,
      isActive,
      isFeatured,
      displayOrder,
      cropSettings,
      cropPosition,
    } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Photo title is required" },
        { status: 400 }
      );
    }

    if (title.trim().length > 120) {
      return NextResponse.json(
        { success: false, message: "Title cannot exceed 120 characters" },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json(
        { success: false, message: "Category is required" },
        { status: 400 }
      );
    }

    if (!image || typeof image !== "string" || !image.trim()) {
      return NextResponse.json(
        { success: false, message: "Image URL is required" },
        { status: 400 }
      );
    }

    if (
      !imagePublicId ||
      typeof imagePublicId !== "string" ||
      !imagePublicId.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "Image publicId is required" },
        { status: 400 }
      );
    }

    // Security check: Ensure image publicId belongs to the gallery folder namespace
    const trimmedPublicId = imagePublicId.trim();
    if (!trimmedPublicId.startsWith(CLOUDINARY_FOLDERS.GALLERY)) {
      return NextResponse.json(
        {
          success: false,
          message: `Image must be uploaded to ${CLOUDINARY_FOLDERS.GALLERY}`,
        },
        { status: 400 }
      );
    }

    if (description && typeof description === "string" && description.trim().length > 500) {
      return NextResponse.json(
        { success: false, message: "Description cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    if (altText && typeof altText === "string" && altText.trim().length > 160) {
      return NextResponse.json(
        { success: false, message: "Alt text cannot exceed 160 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const photo = await Gallery.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      category: category.trim(),
      image: image.trim(),
      imagePublicId: trimmedPublicId,
      altText: altText ? altText.trim() : "",
      isActive: typeof isActive === "boolean" ? isActive : true,
      isFeatured: typeof isFeatured === "boolean" ? isFeatured : false,
      displayOrder: typeof displayOrder === "number" ? displayOrder : Number(displayOrder) || 0,
      cropSettings: normalizeCropSettings({ cropSettings, cropPosition }),
      cropPosition: normalizeCropSettings({ cropSettings, cropPosition }).gallery,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Gallery photo added successfully",
        photo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/gallery error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add gallery photo" },
      { status: 500 }
    );
  }
}
