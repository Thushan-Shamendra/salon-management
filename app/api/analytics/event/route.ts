import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import AnalyticsEvent from "@/models/AnalyticsEvent";
import {
  ANALYTICS_EVENT_TYPES,
  AnalyticsEventType,
} from "@/lib/analytics-constants";

export async function POST(request: Request) {
  try {
    // 1. Guard against oversized payloads (max 5KB)
    const rawText = await request.text().catch(() => null);
    if (!rawText) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    if (rawText.length > 5120) {
      return NextResponse.json(
        { success: false, message: "Payload too large" },
        { status: 413 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { eventType, page, branchId, entityType, entityId, metadata } = body as {
      eventType?: unknown;
      page?: unknown;
      branchId?: unknown;
      entityType?: unknown;
      entityId?: unknown;
      metadata?: unknown;
    };

    // 2. Validate eventType
    if (
      !eventType ||
      typeof eventType !== "string" ||
      !ANALYTICS_EVENT_TYPES.includes(eventType as AnalyticsEventType)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid or unsupported eventType" },
        { status: 400 }
      );
    }

    // 3. Sanitize page
    let sanitizedPage: string | undefined = undefined;
    if (page && typeof page === "string") {
      sanitizedPage = page.slice(0, 200).trim();
    }

    // 4. Validate branchId
    let validBranchId: mongoose.Types.ObjectId | null = null;
    if (branchId !== undefined && branchId !== null && branchId !== "") {
      if (typeof branchId !== "string" || !mongoose.Types.ObjectId.isValid(branchId.trim())) {
        return NextResponse.json(
          { success: false, message: "Invalid branchId format" },
          { status: 400 }
        );
      }
      validBranchId = new mongoose.Types.ObjectId(branchId.trim());
    }

    // 5. Sanitize entityType
    let sanitizedEntityType: string | undefined = undefined;
    if (entityType && typeof entityType === "string") {
      sanitizedEntityType = entityType.slice(0, 50).trim();
    }

    // 6. Validate entityId
    let validEntityId: mongoose.Types.ObjectId | null = null;
    if (entityId !== undefined && entityId !== null && entityId !== "") {
      if (typeof entityId !== "string" || !mongoose.Types.ObjectId.isValid(entityId.trim())) {
        return NextResponse.json(
          { success: false, message: "Invalid entityId format" },
          { status: 400 }
        );
      }
      validEntityId = new mongoose.Types.ObjectId(entityId.trim());
    }

    // 7. Whitelist allowed metadata fields only (label, source, category)
    let sanitizedMetadata:
      | { label?: string; source?: string; category?: string }
      | undefined = undefined;

    if (metadata && typeof metadata === "object") {
      const meta = metadata as Record<string, unknown>;
      sanitizedMetadata = {};
      if (typeof meta.label === "string") {
        sanitizedMetadata.label = meta.label.slice(0, 200).trim();
      }
      if (typeof meta.source === "string") {
        sanitizedMetadata.source = meta.source.slice(0, 100).trim();
      }
      if (typeof meta.category === "string") {
        sanitizedMetadata.category = meta.category.slice(0, 100).trim();
      }
    }

    await connectDB();

    // 8. Record event
    await AnalyticsEvent.create({
      eventType: eventType as AnalyticsEventType,
      page: sanitizedPage,
      branchId: validBranchId || undefined,
      entityType: sanitizedEntityType,
      entityId: validEntityId || undefined,
      metadata: sanitizedMetadata,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Fail gracefully without disrupting clients
    console.error("POST /api/analytics/event error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, message: "Failed to record event" },
      { status: 500 }
    );
  }
}
