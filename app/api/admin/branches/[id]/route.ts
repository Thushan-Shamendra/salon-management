import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import Branch, { generateSlug, IBranchOpeningHour } from "@/models/Branch";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

// GET /api/admin/branches/[id]
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid branch ID" },
        { status: 400 }
      );
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return NextResponse.json(
        { success: false, message: "Branch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      branch,
    });
  } catch (error) {
    console.error("Get branch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load branch" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/branches/[id]
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid branch ID" },
        { status: 400 }
      );
    }

    const existingBranch = await Branch.findById(id);
    if (!existingBranch) {
      return NextResponse.json(
        { success: false, message: "Branch not found" },
        { status: 404 }
      );
    }

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
      isMain,
    } = body;

    const updateData: Record<string, unknown> = {};

    // Validate and update name + slug
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return NextResponse.json(
          { success: false, message: "Branch name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = trimmedName;

      // If name changed, generate and check new slug cleanly
      if (trimmedName.toLowerCase() !== existingBranch.name.toLowerCase()) {
        const newSlug = generateSlug(trimmedName) || `branch-${Date.now()}`;
        const duplicate = await Branch.findOne({
          _id: { $ne: id },
          $or: [
            { name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
            { slug: newSlug },
          ],
        });

        if (duplicate) {
          return NextResponse.json(
            { success: false, message: "Another branch with this name or slug already exists" },
            { status: 400 }
          );
        }
        updateData.slug = newSlug;
      }
    }

    // Phone
    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      if (!trimmedPhone) {
        return NextResponse.json(
          { success: false, message: "Phone number cannot be empty" },
          { status: 400 }
        );
      }
      updateData.phone = trimmedPhone;
    }

    // WhatsApp
    if (whatsappNumber !== undefined) {
      updateData.whatsappNumber = String(whatsappNumber).trim();
    }

    // Email
    if (email !== undefined) {
      const trimmedEmail = String(email).trim();
      if (trimmedEmail && !isValidEmail(trimmedEmail)) {
        return NextResponse.json(
          { success: false, message: "Please provide a valid email address" },
          { status: 400 }
        );
      }
      updateData.email = trimmedEmail;
    }

    // Address
    if (address !== undefined) {
      const trimmedAddress = String(address).trim();
      if (!trimmedAddress) {
        return NextResponse.json(
          { success: false, message: "Address cannot be empty" },
          { status: 400 }
        );
      }
      updateData.address = trimmedAddress;
    }

    // Latitude
    if (latitude !== undefined) {
      if (latitude === null || latitude === "") {
        updateData.latitude = undefined;
      } else {
        const numLat = Number(latitude);
        if (isNaN(numLat) || numLat < -90 || numLat > 90) {
          return NextResponse.json(
            { success: false, message: "Latitude must be a number between -90 and 90" },
            { status: 400 }
          );
        }
        updateData.latitude = numLat;
      }
    }

    // Longitude
    if (longitude !== undefined) {
      if (longitude === null || longitude === "") {
        updateData.longitude = undefined;
      } else {
        const numLng = Number(longitude);
        if (isNaN(numLng) || numLng < -180 || numLng > 180) {
          return NextResponse.json(
            { success: false, message: "Longitude must be a number between -180 and 180" },
            { status: 400 }
          );
        }
        updateData.longitude = numLng;
      }
    }

    // Google Maps URL
    if (googleMapsUrl !== undefined) {
      const trimmedUrl = String(googleMapsUrl).trim();
      if (trimmedUrl && !isValidUrl(trimmedUrl)) {
        return NextResponse.json(
          { success: false, message: "Google Maps URL must be a valid HTTP or HTTPS URL" },
          { status: 400 }
        );
      }
      updateData.googleMapsUrl = trimmedUrl;
    }

    // Google Place ID
    if (googlePlaceId !== undefined) {
      updateData.googlePlaceId = String(googlePlaceId).trim();
    }

    // Google Review URL
    if (googleReviewUrl !== undefined) {
      const trimmedReviewUrl = String(googleReviewUrl).trim();
      if (trimmedReviewUrl && !isValidUrl(trimmedReviewUrl)) {
        return NextResponse.json(
          { success: false, message: "Google Review URL must be a valid HTTP or HTTPS URL" },
          { status: 400 }
        );
      }
      updateData.googleReviewUrl = trimmedReviewUrl;
    }

    // Reviews enabled
    if (reviewsEnabled !== undefined) {
      updateData.reviewsEnabled = Boolean(reviewsEnabled);
    }

    // Display order
    if (displayOrder !== undefined) {
      updateData.displayOrder = Math.max(0, Number(displayOrder) || 0);
    }

    // Is active
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Opening hours
    if (openingHours !== undefined) {
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
      updateData.openingHours = parsedHours;
    }

    if (isMain !== undefined) {
      const shouldBeMain = Boolean(isMain);
      if (shouldBeMain) {
        await Branch.updateMany({ _id: { $ne: id } }, { isMain: false });
      }
      updateData.isMain = shouldBeMain;
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Branch updated successfully",
      branch: updatedBranch,
    });
  } catch (error) {
    console.error("Update branch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update branch" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/branches/[id]
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid branch ID" },
        { status: 400 }
      );
    }

    const branchToDel = await Branch.findById(id);
    if (!branchToDel) {
      return NextResponse.json(
        { success: false, message: "Branch not found" },
        { status: 404 }
      );
    }

    if (branchToDel.isMain) {
      return NextResponse.json(
        {
          success: false,
          message: "Main branch cannot be deleted. Its details are managed in Website Settings.",
        },
        { status: 400 }
      );
    }

    await Branch.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    console.error("Delete branch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete branch" },
      { status: 500 }
    );
  }
}
