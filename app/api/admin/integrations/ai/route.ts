import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import IntegrationSettings from "@/models/IntegrationSettings";
import { encryptSecret } from "@/lib/integrations/secrets";
import { verifyAdminPassword } from "@/lib/integrations/verify-password";

// PATCH /api/admin/integrations/ai - Save AI Provider override
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
    const { provider, model, baseUrl, apiKey, currentPassword } = body;

    if (provider !== undefined && typeof provider !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid Provider format" },
        { status: 400 }
      );
    }
    if (model !== undefined && typeof model !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid Model format" },
        { status: 400 }
      );
    }
    if (baseUrl !== undefined && typeof baseUrl !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid Base URL format" },
        { status: 400 }
      );
    }
    if (apiKey !== undefined && typeof apiKey !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid API Key format" },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey?.trim();

    // If an API key is being provided/updated, verify admin password
    if (trimmedKey) {
      if (!currentPassword) {
        return NextResponse.json(
          {
            success: false,
            message: "Current admin password is required to update the AI API key",
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

    if (!settingsDoc.ai) {
      settingsDoc.ai = {};
    }

    if (provider !== undefined) {
      settingsDoc.ai.provider = provider.trim() || "openai";
    }

    if (model !== undefined) {
      settingsDoc.ai.model = model.trim() || "gpt-4o-mini";
    }

    if (baseUrl !== undefined) {
      settingsDoc.ai.baseUrl = baseUrl.trim();
    }

    // Only update secret if non-empty string was supplied
    if (trimmedKey) {
      settingsDoc.ai.encryptedApiKey = encryptSecret(trimmedKey);
    }

    settingsDoc.updatedBy = user._id;
    await settingsDoc.save();

    return NextResponse.json({
      success: true,
      message: "AI Provider configuration updated successfully",
      configured: true,
      source: "admin",
    });
  } catch (error) {
    console.error("AI integration update error:", error instanceof Error ? error.message : "Error");
    return NextResponse.json(
      { success: false, message: "Unable to save integration configuration." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/integrations/ai - Clear AI Provider admin override
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
      { $unset: { ai: 1 }, $set: { updatedBy: user._id } }
    );

    return NextResponse.json({
      success: true,
      message: "AI Provider admin override cleared. Reverted to environment defaults.",
    });
  } catch (error) {
    console.error("AI clear override error:", error instanceof Error ? error.message : "Error");
    return NextResponse.json(
      { success: false, message: "Unable to clear integration override." },
      { status: 500 }
    );
  }
}
