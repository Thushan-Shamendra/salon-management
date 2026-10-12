import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import IntegrationSettings from "@/models/IntegrationSettings";
import { encryptSecret } from "@/lib/integrations/secrets";
import { verifyAdminPassword } from "@/lib/integrations/verify-password";

// PATCH /api/admin/integrations/google - Save Google Places API key override
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
    const { apiKey, currentPassword } = body;

    if (apiKey !== undefined && typeof apiKey !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid API Key format" },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey?.trim();

    // If updating the API key, require password verification
    if (trimmedKey) {
      if (!currentPassword) {
        return NextResponse.json(
          {
            success: false,
            message: "Current admin password is required to update the Google Places API key",
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
    } else {
      return NextResponse.json(
        { success: false, message: "Please provide a valid Google Places API key" },
        { status: 400 }
      );
    }

    await connectDB();
    let settingsDoc = await IntegrationSettings.findOne();
    if (!settingsDoc) {
      settingsDoc = new IntegrationSettings();
    }

    if (!settingsDoc.googlePlaces) {
      settingsDoc.googlePlaces = {};
    }

    settingsDoc.googlePlaces.encryptedApiKey = encryptSecret(trimmedKey);
    settingsDoc.updatedBy = user._id;
    await settingsDoc.save();

    return NextResponse.json({
      success: true,
      message: "Google Places API configuration updated successfully",
      configured: true,
      source: "admin",
    });
  } catch (error) {
    console.error("Google integration update error:", error instanceof Error ? error.message : "Error");
    return NextResponse.json(
      { success: false, message: "Unable to save integration configuration." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/integrations/google - Clear Google Places override
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
      { $unset: { googlePlaces: 1 }, $set: { updatedBy: user._id } }
    );

    return NextResponse.json({
      success: true,
      message: "Google Places admin override cleared. Reverted to environment defaults.",
    });
  } catch (error) {
    console.error("Google clear override error:", error instanceof Error ? error.message : "Error");
    return NextResponse.json(
      { success: false, message: "Unable to clear integration override." },
      { status: 500 }
    );
  }
}
