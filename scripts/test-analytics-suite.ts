import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex !== -1) {
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

// Route handlers
import { POST as recordEventHandler } from "../app/api/analytics/event/route";
import { GET as getAnalyticsSummaryHandler } from "../app/api/admin/analytics/summary/route";
import { GET as getDashboardHandler } from "../app/api/admin/dashboard/route";
import AnalyticsEvent from "../models/AnalyticsEvent";
import Branch from "../models/Branch";

function createJsonPostRequest(url: string, body: Record<string, unknown>): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createGetRequest(url: string): Request {
  return new Request(url, {
    method: "GET",
  });
}

async function runAnalyticsTestSuite() {
  console.log("==================================================");
  console.log("SALVORA GROUP 4: FIRST-PARTY ANALYTICS & DASHBOARD TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function report(name: string, condition: boolean, detail = "") {
    if (condition) {
      console.log(`✅ [PASS] ${name}${detail ? ` - ${detail}` : ""}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${name}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // Connect to DB directly
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI not found in environment");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected for test verification.\n");

  const testEventIds: mongoose.Types.ObjectId[] = [];

  try {
    // Retrieve an active branch for testing if available
    const activeBranch = await Branch.findOne({ isActive: true });
    const sampleBranchId = activeBranch ? activeBranch._id.toString() : new mongoose.Types.ObjectId().toString();

    console.log("--- PART 1: PUBLIC EVENT INGESTION (/api/analytics/event) ---");

    // Test 1: Record valid PAGE_VIEW
    {
      const req = createJsonPostRequest("http://localhost:3000/api/analytics/event", {
        eventType: "PAGE_VIEW",
        page: "/services",
        branchId: sampleBranchId,
      });
      const res = await recordEventHandler(req);
      const data = await res.json();
      report("Record PAGE_VIEW event", res.status === 200 && data.success === true, `HTTP ${res.status}`);

      // Verify in DB
      const inserted = await AnalyticsEvent.findOne({ page: "/services", eventType: "PAGE_VIEW" }).sort({ createdAt: -1 });
      if (inserted) testEventIds.push(inserted._id as mongoose.Types.ObjectId);
      report("PAGE_VIEW persisted in MongoDB", Boolean(inserted), `ID: ${inserted?._id}`);
    }

    // Test 2: Record valid WHATSAPP_CLICK with branchId and metadata
    {
      const req = createJsonPostRequest("http://localhost:3000/api/analytics/event", {
        eventType: "WHATSAPP_CLICK",
        page: "/contact",
        branchId: sampleBranchId,
        metadata: {
          label: "SALVORA Malabe",
          source: "FloatingWhatsApp",
        },
      });
      const res = await recordEventHandler(req);
      const data = await res.json();
      report("Record WHATSAPP_CLICK event", res.status === 200 && data.success === true, `HTTP ${res.status}`);

      const inserted = await AnalyticsEvent.findOne({ eventType: "WHATSAPP_CLICK" }).sort({ createdAt: -1 });
      if (inserted) testEventIds.push(inserted._id as mongoose.Types.ObjectId);
      report("WHATSAPP_CLICK metadata persisted", inserted?.metadata?.source === "FloatingWhatsApp");
    }

    // Test 3: Record valid CALL_CLICK
    {
      const req = createJsonPostRequest("http://localhost:3000/api/analytics/event", {
        eventType: "CALL_CLICK",
        page: "/",
        branchId: sampleBranchId,
        metadata: {
          source: "QuickCall",
        },
      });
      const res = await recordEventHandler(req);
      const data = await res.json();
      report("Record CALL_CLICK event", res.status === 200 && data.success === true);

      const inserted = await AnalyticsEvent.findOne({ eventType: "CALL_CLICK" }).sort({ createdAt: -1 });
      if (inserted) testEventIds.push(inserted._id as mongoose.Types.ObjectId);
    }

    // Test 4: Record valid BOOKING_CLICK
    {
      const req = createJsonPostRequest("http://localhost:3000/api/analytics/event", {
        eventType: "BOOKING_CLICK",
        page: "/wedding",
        metadata: {
          label: "Bridal Package Gold",
          source: "Navbar",
        },
      });
      const res = await recordEventHandler(req);
      const data = await res.json();
      report("Record BOOKING_CLICK event", res.status === 200 && data.success === true);

      const inserted = await AnalyticsEvent.findOne({ eventType: "BOOKING_CLICK" }).sort({ createdAt: -1 });
      if (inserted) testEventIds.push(inserted._id as mongoose.Types.ObjectId);
    }

    // Test 5: Reject invalid/unauthorized event types
    {
      const req = createJsonPostRequest("http://localhost:3000/api/analytics/event", {
        eventType: "MALICIOUS_EVENT_CLICK",
        page: "/test",
      });
      const res = await recordEventHandler(req);
      const data = await res.json();
      report("Reject invalid event type", res.status === 400 && data.success === false, `Status ${res.status}: ${data.message}`);
    }

    // Test 6: Reject oversized payload (>5KB)
    {
      const hugeString = "A".repeat(6000);
      const req = createJsonPostRequest("http://localhost:3000/api/analytics/event", {
        eventType: "PAGE_VIEW",
        page: "/oversized",
        metadata: {
          label: hugeString,
        },
      });
      const res = await recordEventHandler(req);
      const data = await res.json();
      report("Reject oversized payload (>5KB)", res.status === 413 && data.success === false, `Status ${res.status}`);
    }

    // Test 7: Reject invalid branchId format
    {
      const req = createJsonPostRequest("http://localhost:3000/api/analytics/event", {
        eventType: "PAGE_VIEW",
        page: "/test",
        branchId: "invalid-not-an-objectid",
      });
      const res = await recordEventHandler(req);
      const data = await res.json();
      report("Reject invalid branchId format", res.status === 400 && data.success === false, `Status ${res.status}`);
    }

    console.log("\n--- PART 2: ADMIN ANALYTICS SUMMARY (/api/admin/analytics/summary) ---");

    // Test 8: Unauthenticated access rejected with 401
    {
      (global as unknown as { __TEST_AUTH_USER__?: unknown }).__TEST_AUTH_USER__ = undefined;
      const req = createGetRequest("http://localhost:3000/api/admin/analytics/summary?range=30d");
      const res = await getAnalyticsSummaryHandler(req);
      report("Unauthenticated summary rejected with 401", res.status === 401, `Status ${res.status}`);
    }

    // Set mock admin user for subsequent authenticated admin endpoints
    (global as unknown as { __TEST_AUTH_USER__?: unknown }).__TEST_AUTH_USER__ = {
      _id: new mongoose.Types.ObjectId(),
      name: "SALVORA SuperAdmin",
      email: "admin@salvora.lk",
      role: "admin",
      isActive: true,
    };

    // Test 9: Authenticated 30d range
    {
      const req = createGetRequest("http://localhost:3000/api/admin/analytics/summary?range=30d");
      const res = await getAnalyticsSummaryHandler(req);
      const data = await res.json();
      report("Authenticated summary 30d returns 200", res.status === 200 && data.success === true);
      report("30d returns 30 daily buckets", Array.isArray(data.chart?.buckets) && data.chart.buckets.length === 30, `Buckets count: ${data.chart?.buckets?.length}`);
      report("Summary returns topPages list", Array.isArray(data.topPages));
      report("Summary returns branchPerformance list", Array.isArray(data.branchPerformance));
      report("Summary returns metrics object with safe changes", typeof data.metrics?.pageViews?.value === "number" && typeof data.metrics?.whatsappClicks?.value === "number");
    }

    // Test 10: Authenticated 7d range
    {
      const req = createGetRequest("http://localhost:3000/api/admin/analytics/summary?range=7d");
      const res = await getAnalyticsSummaryHandler(req);
      const data = await res.json();
      report("Authenticated summary 7d returns 200", res.status === 200 && data.success === true);
      report("7d returns 7 daily buckets", Array.isArray(data.chart?.buckets) && data.chart.buckets.length === 7, `Buckets count: ${data.chart?.buckets?.length}`);
    }

    // Test 11: Authenticated today range
    {
      const req = createGetRequest("http://localhost:3000/api/admin/analytics/summary?range=today");
      const res = await getAnalyticsSummaryHandler(req);
      const data = await res.json();
      report("Authenticated summary today returns 200", res.status === 200 && data.success === true);
      report("today returns 24 hourly buckets", Array.isArray(data.chart?.buckets) && data.chart.buckets.length === 24, `Buckets count: ${data.chart?.buckets?.length}`);
    }

    console.log("\n--- PART 3: ADMIN DASHBOARD STATS & HEALTH CHECK (/api/admin/dashboard) ---");

    // Test 12: Admin dashboard stats returns real counts
    {
      const res = await getDashboardHandler();
      const data = await res.json();
      report("Admin dashboard stats returns 200", res.status === 200 && data.success === true);
      report("Dashboard contains branches stats", typeof data.stats?.branches?.total === "number");
      report("Dashboard contains services stats", typeof data.stats?.services?.total === "number");
      report("Dashboard contains beauticians stats", typeof data.stats?.beauticians?.total === "number");
      report("Dashboard contains gallery stats", typeof data.stats?.gallery?.total === "number");
      report("Dashboard contains products stats", typeof data.stats?.products?.total === "number");
      report("Dashboard contains vendors stats", typeof data.stats?.vendors?.total === "number");
      report("Dashboard contains wedding stats", typeof data.stats?.weddingServices?.total === "number");
      report("Dashboard contains deterministic websiteHealth", data.websiteHealth && Array.isArray(data.websiteHealth.items));
      report("Website health has valid status", ["Healthy", "Needs Attention", "Critical"].includes(data.websiteHealth?.status), `Status: ${data.websiteHealth?.status}`);
    }

  } finally {
    // Cleanup inserted test events
    if (testEventIds.length > 0) {
      const deleteResult = await AnalyticsEvent.deleteMany({ _id: { $in: testEventIds } });
      console.log(`\n🧹 Cleaned up ${deleteResult.deletedCount} test analytics events from database.`);
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  console.log("\n==================================================");
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAnalyticsTestSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
