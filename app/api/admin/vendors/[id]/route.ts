import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Vendor, { VENDOR_CATEGORIES, VendorCategory } from "@/models/Vendor";
import Branch from "@/models/Branch";
import { deleteCloudinaryImage, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(emailString: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailString.trim());
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/admin/vendors/[id] - Fetch single vendor by ID
export async function GET(request: Request, context: RouteContext) {
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
    void Branch;
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid vendor ID" },
        { status: 400 }
      );
    }

    const vendor = await Vendor.findById(id)
      .populate("branchIds", "_id name slug")
      .lean();

    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error) {
    console.error("GET /api/admin/vendors/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load vendor" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/vendors/[id] - Update existing vendor
export async function PATCH(request: Request, context: RouteContext) {
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
    void Branch;
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid vendor ID" },
        { status: 400 }
      );
    }

    const existingVendor = await Vendor.findById(id);
    if (!existingVendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      category,
      description,
      image,
      imagePublicId,
      logo,
      logoPublicId,
      phone,
      whatsapp,
      email,
      website,
      instagram,
      facebook,
      branchIds,
      isFeatured,
      isActive,
      displayOrder,
    } = body || {};

    // 1. Validate name if updated
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { success: false, message: "Vendor name cannot be empty" },
          { status: 400 }
        );
      }
      existingVendor.name = name.trim();
    }

    // 2. Validate category if updated
    if (category !== undefined) {
      const trimmedCategory = typeof category === "string" ? (category.trim() as VendorCategory) : "";
      if (!VENDOR_CATEGORIES.includes(trimmedCategory as VendorCategory)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid category. Must be one of: ${VENDOR_CATEGORIES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      existingVendor.category = trimmedCategory as VendorCategory;
    }

    // 3. Description
    if (description !== undefined) {
      existingVendor.description = typeof description === "string" ? description.trim() : "";
    }

    // 4. Main image update with Cloudinary cleanup if replaced
    if (image !== undefined) {
      if (typeof image !== "string" || !image.trim()) {
        return NextResponse.json(
          { success: false, message: "Main vendor image cannot be empty" },
          { status: 400 }
        );
      }

      const oldImagePublicId = existingVendor.imagePublicId;
      existingVendor.image = image.trim();

      if (imagePublicId !== undefined) {
        existingVendor.imagePublicId = typeof imagePublicId === "string" ? imagePublicId.trim() : "";
      }

      // If image changed and had an old public ID in vendors folder, clean up old asset
      if (
        oldImagePublicId &&
        oldImagePublicId !== existingVendor.imagePublicId &&
        oldImagePublicId.startsWith(CLOUDINARY_FOLDERS.VENDORS)
      ) {
        try {
          await deleteCloudinaryImage(oldImagePublicId);
        } catch (cldErr) {
          console.error("Failed to delete previous vendor image:", cldErr);
        }
      }
    }

    // 5. Logo update with Cloudinary cleanup if replaced
    if (logo !== undefined) {
      const oldLogoPublicId = existingVendor.logoPublicId;
      existingVendor.logo = typeof logo === "string" ? logo.trim() : "";

      if (logoPublicId !== undefined) {
        existingVendor.logoPublicId = typeof logoPublicId === "string" ? logoPublicId.trim() : "";
      }

      if (
        oldLogoPublicId &&
        oldLogoPublicId !== existingVendor.logoPublicId &&
        oldLogoPublicId.startsWith(CLOUDINARY_FOLDERS.VENDORS)
      ) {
        try {
          await deleteCloudinaryImage(oldLogoPublicId);
        } catch (cldErr) {
          console.error("Failed to delete previous vendor logo:", cldErr);
        }
      }
    }

    // 6. Contact & Social details
    if (phone !== undefined) {
      existingVendor.phone = typeof phone === "string" ? phone.trim() : "";
    }

    if (whatsapp !== undefined) {
      existingVendor.whatsapp = typeof whatsapp === "string" ? whatsapp.trim() : "";
    }

    if (email !== undefined) {
      if (email && typeof email === "string" && email.trim() && !isValidEmail(email)) {
        return NextResponse.json(
          { success: false, message: "Please enter a valid email address" },
          { status: 400 }
        );
      }
      existingVendor.email = typeof email === "string" ? email.toLowerCase().trim() : "";
    }

    if (website !== undefined) {
      if (website && typeof website === "string" && website.trim() && !isValidUrl(website)) {
        return NextResponse.json(
          { success: false, message: "Website must be a valid HTTP or HTTPS URL" },
          { status: 400 }
        );
      }
      existingVendor.website = typeof website === "string" ? website.trim() : "";
    }

    if (instagram !== undefined) {
      if (instagram && typeof instagram === "string" && instagram.trim() && !isValidUrl(instagram)) {
        return NextResponse.json(
          { success: false, message: "Instagram must be a valid URL" },
          { status: 400 }
        );
      }
      existingVendor.instagram = typeof instagram === "string" ? instagram.trim() : "";
    }

    if (facebook !== undefined) {
      if (facebook && typeof facebook === "string" && facebook.trim() && !isValidUrl(facebook)) {
        return NextResponse.json(
          { success: false, message: "Facebook must be a valid URL" },
          { status: 400 }
        );
      }
      existingVendor.facebook = typeof facebook === "string" ? facebook.trim() : "";
    }

    // 7. Branches
    if (branchIds !== undefined) {
      if (Array.isArray(branchIds)) {
        for (const bId of branchIds) {
          if (!mongoose.Types.ObjectId.isValid(bId)) {
            return NextResponse.json(
              { success: false, message: `Invalid branch ID: ${bId}` },
              { status: 400 }
            );
          }
        }

        if (branchIds.length > 0) {
          const foundBranches = await Branch.find({
            _id: { $in: branchIds },
          }).select("_id");

          if (foundBranches.length !== branchIds.length) {
            return NextResponse.json(
              { success: false, message: "One or more selected branches do not exist" },
              { status: 400 }
            );
          }
        }

        existingVendor.branchIds = branchIds.map(
          (b) => new mongoose.Types.ObjectId(b)
        );
      } else {
        existingVendor.branchIds = [];
      }
    }

    // 8. Flags & display order
    if (isFeatured !== undefined) {
      existingVendor.isFeatured = Boolean(isFeatured);
    }

    if (isActive !== undefined) {
      existingVendor.isActive = Boolean(isActive);
    }

    if (displayOrder !== undefined) {
      existingVendor.displayOrder = typeof displayOrder === "number" ? displayOrder : 0;
    }

    await existingVendor.save();

    const updated = await Vendor.findById(id)
      .populate("branchIds", "_id name slug")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Vendor updated successfully",
      vendor: updated,
    });
  } catch (error) {
    console.error("PATCH /api/admin/vendors/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/vendors/[id] - Delete vendor and clean up Cloudinary assets
export async function DELETE(request: Request, context: RouteContext) {
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
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid vendor ID" },
        { status: 400 }
      );
    }

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 }
      );
    }

    const imagePublicId = vendor.imagePublicId;
    const logoPublicId = vendor.logoPublicId;

    // 1. Delete from database
    await Vendor.findByIdAndDelete(id);

    // 2. Clean up Cloudinary assets
    if (imagePublicId && imagePublicId.startsWith(CLOUDINARY_FOLDERS.VENDORS)) {
      try {
        await deleteCloudinaryImage(imagePublicId);
      } catch (cldErr) {
        console.error("Failed to delete vendor image from Cloudinary:", cldErr);
      }
    }

    if (logoPublicId && logoPublicId.startsWith(CLOUDINARY_FOLDERS.VENDORS)) {
      try {
        await deleteCloudinaryImage(logoPublicId);
      } catch (cldErr) {
        console.error("Failed to delete vendor logo from Cloudinary:", cldErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/vendors/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
