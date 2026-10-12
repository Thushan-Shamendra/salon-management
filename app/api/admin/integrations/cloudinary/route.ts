import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import IntegrationSettings from "@/models/IntegrationSettings";
import { encryptSecret } from "@/lib/integrations/secrets";
import { verifyAdminPassword } from "@/lib/integrations/verify-password";

// PATCH /api/admin/integrations/cloudinary - Save Cloudinary override
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cloudName, apiKey, apiSecret, currentPassword } = body;

    // Validate types
    if (cloudName !== undefined && typeof cloudName !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid Cloud Name format" },
        { status: 400 }
      );
    }
    if (apiKey !== undefined && typeof apiKey !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid API Key format" },
        { status: 400 }
      );
    }
    if (apiSecret !== undefined && typeof apiSecret !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid API Secret format" },
        { status: 400 }
      );
    }

    const trimmedSecret = apiSecret?.trim();

    // If an API secret is being provided/updated, verify admin password
    if (trimmedSecret) {
      if (!currentPassword) {
        return NextResponse.json(
          {
            success: false,
            message: "Current admin password is required to update the Cloudinary API secret",
          },
          { status: 400 }
        );
      }

      const isPasswordValid = await verifyAdminPassword(user._id.toString(), currentPassword);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: "Current admin password is incorrect" },
          { status: 400 }
        );
      }
    }

    await connectDB();
    let settingsDoc = await IntegrationSettings.findOne();
    if (!settingsDoc) {
      settingsDoc = new IntegrationSettings();
    }

    if (!settingsDoc.cloudinary) {
      settingsDoc.cloudinary = {};
    }

    if (cloudName !== undefined) {
      settingsDoc.cloudinary.cloudName = cloudName.trim();
    }

    if (apiKey !== undefined) {
      settingsDoc.cloudinary.apiKey = apiKey.trim();
    }

    // Only update secret if a non-empty string was explicitly provided
    if (trimmedSecret) {
      settingsDoc.cloudinary.encryptedApiSecret = encryptSecret(trimmedSecret);
    }

    settingsDoc.updatedBy = user._id;
    await settingsDoc.save();

    return NextResponse.json({
      success: true,
      message: "Cloudinary settings updated successfully",
      configured: true,
      source: "admin",
    });
  } catch (error) {
    console.error("Cloudinary integration update error:", error instanceof Error ? error.message : "Error");
    return NextResponse.json(
      { success: false, message: "Unable to save integration configuration." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/integrations/cloudinary - Clear Cloudinary admin override
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    await connectDB();
    await IntegrationSettings.updateOne(
      {},
      { $unset: { cloudinary: 1 }, $set: { updatedBy: user._id } }
    );

    return NextResponse.json({
      success: true,
      message: "Cloudinary admin override cleared. Reverted to environment defaults.",
    });
  } catch (error) {
    console.error("Cloudinary clear override error:", error instanceof Error ? error.message : "Error");
    return NextResponse.json(
      { success: false, message: "Unable to clear integration override." },
      { status: 500 }
    );
  }
}
