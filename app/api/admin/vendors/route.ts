import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Vendor, { VENDOR_CATEGORIES, VendorCategory } from "@/models/Vendor";
import Branch from "@/models/Branch";

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

// GET /api/admin/vendors - List all vendors with counts and populated branches
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
    void Branch; // Ensure Branch model registered in Mongoose

    const vendors = await Vendor.find()
      .populate("branchIds", "_id name slug")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const total = vendors.length;
    const active = vendors.filter((v) => v.isActive).length;
    const hidden = vendors.filter((v) => !v.isActive).length;
    const featured = vendors.filter((v) => v.isFeatured).length;

    return NextResponse.json({
      success: true,
      vendors,
      counts: {
        total,
        active,
        hidden,
        featured,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/vendors error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load vendors" },
      { status: 500 }
    );
  }
}

// POST /api/admin/vendors - Create a new vendor
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

    // 1. Required fields validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Vendor name is required" },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json(
        { success: false, message: "Category is required" },
        { status: 400 }
      );
    }

    const trimmedCategory = category.trim() as VendorCategory;
    if (!VENDOR_CATEGORIES.includes(trimmedCategory)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid category. Must be one of: ${VENDOR_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!image || typeof image !== "string" || !image.trim()) {
      return NextResponse.json(
        { success: false, message: "Main vendor image is required" },
        { status: 400 }
      );
    }

    // 2. Validate URLs if provided
    if (website && typeof website === "string" && website.trim() && !isValidUrl(website)) {
      return NextResponse.json(
        { success: false, message: "Website must be a valid HTTP or HTTPS URL" },
        { status: 400 }
      );
    }

    if (instagram && typeof instagram === "string" && instagram.trim() && !isValidUrl(instagram)) {
      return NextResponse.json(
        { success: false, message: "Instagram must be a valid URL" },
        { status: 400 }
      );
    }

    if (facebook && typeof facebook === "string" && facebook.trim() && !isValidUrl(facebook)) {
      return NextResponse.json(
        { success: false, message: "Facebook must be a valid URL" },
        { status: 400 }
      );
    }

    // 3. Validate email if provided
    if (email && typeof email === "string" && email.trim() && !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    await connectDB();

    // 4. Validate branch IDs if provided
    let validBranchIds: mongoose.Types.ObjectId[] = [];
    if (Array.isArray(branchIds) && branchIds.length > 0) {
      for (const bId of branchIds) {
        if (!mongoose.Types.ObjectId.isValid(bId)) {
          return NextResponse.json(
            { success: false, message: `Invalid branch ID: ${bId}` },
            { status: 400 }
          );
        }
      }

      const foundBranches = await Branch.find({
        _id: { $in: branchIds },
      }).select("_id");

      if (foundBranches.length !== branchIds.length) {
        return NextResponse.json(
          { success: false, message: "One or more selected branches do not exist" },
          { status: 400 }
        );
      }

      validBranchIds = branchIds.map((id) => new mongoose.Types.ObjectId(id));
    }

    // 5. Create new Vendor
    const newVendor = await Vendor.create({
      name: name.trim(),
      category: trimmedCategory,
      description: typeof description === "string" ? description.trim() : "",
      image: image.trim(),
      imagePublicId: typeof imagePublicId === "string" ? imagePublicId.trim() : "",
      logo: typeof logo === "string" ? logo.trim() : "",
      logoPublicId: typeof logoPublicId === "string" ? logoPublicId.trim() : "",
      phone: typeof phone === "string" ? phone.trim() : "",
      whatsapp: typeof whatsapp === "string" ? whatsapp.trim() : "",
      email: typeof email === "string" ? email.toLowerCase().trim() : "",
      website: typeof website === "string" ? website.trim() : "",
      instagram: typeof instagram === "string" ? instagram.trim() : "",
      facebook: typeof facebook === "string" ? facebook.trim() : "",
      branchIds: validBranchIds,
      isFeatured: typeof isFeatured === "boolean" ? isFeatured : false,
      isActive: typeof isActive === "boolean" ? isActive : true,
      displayOrder: typeof displayOrder === "number" ? displayOrder : 0,
    });

    const populated = await Vendor.findById(newVendor._id)
      .populate("branchIds", "_id name slug")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Vendor created successfully",
        vendor: populated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/vendors error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create vendor" },
      { status: 500 }
    );
  }
}
