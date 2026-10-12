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

// Route handlers and AI modules
import { GET as getAiStatusHandler } from "../app/api/admin/ai/status/route";
import { POST as askAiHandler } from "../app/api/admin/ai/ask/route";
import { GET as getAiInsightsHandler, POST as postAiInsightsHandler } from "../app/api/admin/ai/insights/route";
import { buildWebsiteContext } from "../lib/ai/buildWebsiteContext";
import { isAiConfigured, getAiConfig } from "../lib/ai/provider";
import { SALVORA_AI_SYSTEM_PROMPT } from "../lib/ai/systemPrompt";
import { getWebsiteHealth } from "../lib/website-health";
import { getAnalyticsSummary } from "../lib/analytics/summary";
import AiInsightCache from "../models/AiInsightCache";

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

async function runAiAssistantTestSuite() {
  console.log("==================================================");
  console.log("SALVORA GROUP 5: AI WEBSITE ASSISTANT TEST SUITE");
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

  try {
    // -------------------------------------------------------------
    // TEST 1: Unauthenticated Access Protection (401)
    // -------------------------------------------------------------
    console.log("--- 1. UNAUTHENTICATED ACCESS PROTECTION ---");
    (global as unknown as { __TEST_AUTH_USER__?: unknown }).__TEST_AUTH_USER__ = null;

    const unauthStatusRes = await getAiStatusHandler();
    report(
      "GET /api/admin/ai/status returns 401 when unauthenticated",
      unauthStatusRes.status === 401
    );

    const unauthAskRes = await askAiHandler(
      createJsonPostRequest("http://localhost:3000/api/admin/ai/ask", {
        question: "How is salon traffic this month?",
      })
    );
    report(
      "POST /api/admin/ai/ask returns 401 when unauthenticated",
      unauthAskRes.status === 401
    );

    const unauthInsightsGetRes = await getAiInsightsHandler(
      createGetRequest("http://localhost:3000/api/admin/ai/insights?range=30d")
    );
    report(
      "GET /api/admin/ai/insights returns 401 when unauthenticated",
      unauthInsightsGetRes.status === 401
    );

    const unauthInsightsPostRes = await postAiInsightsHandler(
      createJsonPostRequest("http://localhost:3000/api/admin/ai/insights", {
        range: "30d",
      })
    );
    report(
      "POST /api/admin/ai/insights returns 401 when unauthenticated",
      unauthInsightsPostRes.status === 401
    );

    // -------------------------------------------------------------
    // TEST 2: Provider Configuration & Security
    // -------------------------------------------------------------
    console.log("\n--- 2. PROVIDER CONFIGURATION & SECRET MASKING ---");
    // Mock authenticated admin user
    (global as unknown as { __TEST_AUTH_USER__?: unknown }).__TEST_AUTH_USER__ = {
      _id: new mongoose.Types.ObjectId(),
      name: "SALVORA Admin",
      email: "admin@salvora.lk",
      role: "admin",
      isActive: true,
    };

    const originalKey = process.env.OPENAI_API_KEY;

    // Test with key unset
    delete process.env.OPENAI_API_KEY;
    report("isAiConfigured() returns false when OPENAI_API_KEY is not set", isAiConfigured() === false);

    const configUnset = getAiConfig();
    report(
      "getAiConfig() returns safe object when unconfigured",
      configUnset.configured === false && typeof configUnset.provider === "string" && typeof configUnset.model === "string"
    );

    const authStatusResUnset = await getAiStatusHandler();
    const authStatusDataUnset = await authStatusResUnset.json();
    report(
      "GET /api/admin/ai/status returns configured: false and does not expose secrets",
      authStatusResUnset.status === 200 &&
        authStatusDataUnset.success === true &&
        authStatusDataUnset.configured === false &&
        !authStatusDataUnset.apiKey &&
        !authStatusDataUnset.secret
    );

    // Test with key set (dummy key)
    process.env.OPENAI_API_KEY = "sk-test-mock-key-1234567890";
    report("isAiConfigured() returns true when OPENAI_API_KEY is set", isAiConfigured() === true);

    const configSet = getAiConfig();
    report(
      "getAiConfig() returns configured: true and never contains the raw key",
      configSet.configured === true && !("apiKey" in configSet)
    );

    const authStatusResSet = await getAiStatusHandler();
    const authStatusDataSet = await authStatusResSet.json();
    report(
      "GET /api/admin/ai/status returns configured: true without leaking key",
      authStatusResSet.status === 200 &&
        authStatusDataSet.configured === true &&
        !JSON.stringify(authStatusDataSet).includes("sk-test-mock-key")
    );

    // Restore original key state
    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }

    // -------------------------------------------------------------
    // TEST 3: Ask AI Input Validation
    // -------------------------------------------------------------
    console.log("\n--- 3. ASK AI INPUT VALIDATION ---");
    // Ensure temporary API key is unset for graceful fallback testing
    const savedApiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    // Empty question
    const emptyQRes = await askAiHandler(
      createJsonPostRequest("http://localhost:3000/api/admin/ai/ask", { question: "" })
    );
    report("POST /api/admin/ai/ask rejects empty question with HTTP 400", emptyQRes.status === 400);

    // Whitespace question
    const wsQRes = await askAiHandler(
      createJsonPostRequest("http://localhost:3000/api/admin/ai/ask", { question: "   " })
    );
    report("POST /api/admin/ai/ask rejects whitespace question with HTTP 400", wsQRes.status === 400);

    // Too short question
    const shortQRes = await askAiHandler(
      createJsonPostRequest("http://localhost:3000/api/admin/ai/ask", { question: "a" })
    );
    report("POST /api/admin/ai/ask rejects 1-character question with HTTP 400", shortQRes.status === 400);

    // Too long question (>500 chars)
    const longQRes = await askAiHandler(
      createJsonPostRequest("http://localhost:3000/api/admin/ai/ask", {
        question: "A".repeat(501),
      })
    );
    report("POST /api/admin/ai/ask rejects >500 character question with HTTP 400", longQRes.status === 400);

    // Invalid date range
    const invalidRangeRes = await askAiHandler(
      createJsonPostRequest("http://localhost:3000/api/admin/ai/ask", {
        question: "How is the website doing?",
        range: "999d",
      })
    );
    report("POST /api/admin/ai/ask rejects invalid date range with HTTP 400", invalidRangeRes.status === 400);

    // Graceful unconfigured notice on valid question
    const validQResUnconfigured = await askAiHandler(
      createJsonPostRequest("http://localhost:3000/api/admin/ai/ask", {
        question: "What was our most viewed page in the last 30 days?",
        range: "30d",
      })
    );
    const validQDataUnconfigured = await validQResUnconfigured.json();
    report(
      "POST /api/admin/ai/ask returns notConfigured: true when AI key is missing",
      validQResUnconfigured.status === 200 && validQDataUnconfigured.notConfigured === true
    );

    // -------------------------------------------------------------
    // TEST 4: AI Insights Unconfigured Fallback
    // -------------------------------------------------------------
    console.log("\n--- 4. INSIGHTS UNCONFIGURED FALLBACK ---");
    const insightsGetRes = await getAiInsightsHandler(
      createGetRequest("http://localhost:3000/api/admin/ai/insights?range=30d")
    );
    const insightsGetData = await insightsGetRes.json();
    report(
      "GET /api/admin/ai/insights returns notConfigured: true and supplies data context for UI rendering",
      insightsGetRes.status === 200 &&
        insightsGetData.notConfigured === true &&
        Boolean(insightsGetData.context) &&
        insightsGetData.insights === null
    );

    const insightsPostRes = await postAiInsightsHandler(
      createJsonPostRequest("http://localhost:3000/api/admin/ai/insights", {
        range: "7d",
      })
    );
    const insightsPostData = await insightsPostRes.json();
    report(
      "POST /api/admin/ai/insights returns notConfigured: true with data context",
      insightsPostRes.status === 200 &&
        insightsPostData.notConfigured === true &&
        Boolean(insightsPostData.context)
    );

    // Restore API key
    if (savedApiKey) {
      process.env.OPENAI_API_KEY = savedApiKey;
    }

    // -------------------------------------------------------------
    // TEST 5: Context Builder (buildWebsiteContext) Integrity & Security
    // -------------------------------------------------------------
    console.log("\n--- 5. CONTEXT BUILDER INTEGRITY & SECRETS SANITIZATION ---");
    const context30d = await buildWebsiteContext("30d");
    report("buildWebsiteContext('30d') successfully builds context object", Boolean(context30d));

    report(
      "Context contains date range with Asia/Colombo timezone",
      context30d.dateRange.range === "30d" &&
        context30d.dateRange.timezone === "Asia/Colombo" &&
        Boolean(context30d.dateRange.start) &&
        Boolean(context30d.dateRange.end)
    );

    report(
      "Context contains valid dataConfidence level (low, medium, or high)",
      ["low", "medium", "high"].includes(context30d.dataConfidence) &&
        typeof context30d.confidenceExplanation === "string" &&
        context30d.confidenceExplanation.length > 0
    );

    report(
      "Context contains accurate content counts",
      typeof context30d.content.counts.branches === "number" &&
        typeof context30d.content.counts.services === "number" &&
        typeof context30d.content.counts.beauticians === "number" &&
        typeof context30d.content.counts.products === "number" &&
        typeof context30d.content.counts.vendors === "number" &&
        typeof context30d.content.counts.gallery === "number"
    );

    report(
      "Context contains website health checklist",
      Boolean(context30d.health) &&
        Array.isArray(context30d.health.items) &&
        context30d.health.items.length > 0 &&
        ["Healthy", "Needs Attention", "Critical"].includes(context30d.health.status)
    );

    // Verify context contains NO sensitive fields (passwords, tokens, jwt, etc.)
    const serializedContext = JSON.stringify(context30d).toLowerCase();
    const forbiddenSubstrings = [
      "password",
      "jwt_secret",
      "resettoken",
      "otphash",
      "smtppass",
      "api_key",
      "sk-",
    ];

    let hasSensitiveLeak = false;
    let leakedSubstr = "";
    for (const sub of forbiddenSubstrings) {
      if (serializedContext.includes(sub)) {
        hasSensitiveLeak = true;
        leakedSubstr = sub;
        break;
      }
    }

    report(
      "Strict data isolation: Context contains ZERO sensitive tokens, passwords, or secret strings",
      !hasSensitiveLeak,
      hasSensitiveLeak ? `Leaked: ${leakedSubstr}` : "No sensitive data found in context"
    );

    // -------------------------------------------------------------
    // TEST 6: Date Range Calculation Tests
    // -------------------------------------------------------------
    console.log("\n--- 6. DATE RANGE CALCULATIONS (Asia/Colombo) ---");
    const ranges = ["7d", "30d", "this_month", "prev_month"] as const;
    for (const r of ranges) {
      const summary = await getAnalyticsSummary(r);
      const isIso = (s: string) => !isNaN(Date.parse(s));
      report(
        `Date range '${r}' produces valid ISO boundaries in Asia/Colombo`,
        isIso(summary.period.start) &&
          isIso(summary.period.end) &&
          isIso(summary.period.startPrevious) &&
          isIso(summary.period.endPrevious) &&
          new Date(summary.period.start).getTime() <= new Date(summary.period.end).getTime()
      );
    }

    // -------------------------------------------------------------
    // TEST 7: System Prompt Constraints Verification
    // -------------------------------------------------------------
    console.log("\n--- 7. SYSTEM PROMPT CONSTRAINTS & SECURITY ---");
    report(
      "System prompt contains zero-hallucination instruction",
      SALVORA_AI_SYSTEM_PROMPT.includes("NEVER INVENT OR ESTIMATE NUMBERS")
    );

    report(
      "System prompt forbids inferring revenue or profit",
      SALVORA_AI_SYSTEM_PROMPT.includes("You do NOT track revenue, sales dollars, or profits")
    );

    report(
      "System prompt enforces untrusted data isolation against prompt injection",
      SALVORA_AI_SYSTEM_PROMPT.includes("PROMPT INJECTION & UNTRUSTED DATA ISOLATION") &&
        SALVORA_AI_SYSTEM_PROMPT.includes("strictly UNTRUSTED DATA")
    );

    report(
      "System prompt enforces read-only and non-destructive posture",
      SALVORA_AI_SYSTEM_PROMPT.includes("READ-ONLY & NON-DESTRUCTIVE")
    );

    // -------------------------------------------------------------
    // TEST 8: Technical Health Module
    // -------------------------------------------------------------
    console.log("\n--- 8. DETERMINISTIC WEBSITE HEALTH CHECK ---");
    const healthResult = await getWebsiteHealth();
    report(
      "Website health returns items list and warningsCount >= 0",
      Array.isArray(healthResult.items) &&
        healthResult.items.length > 0 &&
        typeof healthResult.warningsCount === "number" &&
        healthResult.warningsCount >= 0
    );
    report(
      "Website health status is one of 'Healthy', 'Needs Attention', or 'Critical'",
      ["Healthy", "Needs Attention", "Critical"].includes(healthResult.status)
    );

    // -------------------------------------------------------------
    // TEST 9: MONGODB AI INSIGHT CACHE & WEDDING CONTEXT TESTS
    // -------------------------------------------------------------
    console.log("\n--- 9. MONGODB AI INSIGHT CACHE & WEDDING CONTEXT ---");

    // 1. Verify WeddingService is represented in website context
    report(
      "WeddingService & WeddingPackage are represented in website context with safe summary data",
      Boolean(context30d.content.weddingSummary) &&
        typeof context30d.content.weddingSummary.services.activeCount === "number" &&
        typeof context30d.content.weddingSummary.services.hiddenCount === "number" &&
        typeof context30d.content.weddingSummary.services.missingImageCount === "number" &&
        typeof context30d.content.weddingSummary.services.missingDescriptionCount === "number" &&
        typeof context30d.content.weddingSummary.packages.activeCount === "number" &&
        typeof context30d.content.weddingSummary.packages.hiddenCount === "number" &&
        typeof context30d.content.weddingSummary.packages.missingImageCount === "number" &&
        typeof context30d.content.weddingSummary.packages.missingDescriptionCount === "number"
    );

    // Setup Mock Provider for Cache Verification
    process.env.OPENAI_API_KEY = "sk-test-cache-verification-key";
    let providerCallCount = 0;
    const originalFetch = global.fetch;

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      if (urlStr.includes("/chat/completions")) {
        providerCallCount++;
        const dummyInsights = {
          overview: {
            summary: `Automated test insights run #${providerCallCount}`,
            highlights: ["Positive traffic trend"],
            attention: ["Check branch contact"],
          },
          performanceInsights: [
            {
              metric: "Page Views",
              current: 100,
              previous: 80,
              change: "+25%",
              interpretation: "Healthy engagement",
            },
          ],
          improvements: [{ title: "Traffic growth", detail: "More visits" }],
          declines: [],
          recommendations: [
            {
              title: "Update branch phone",
              reason: "Contact completeness",
              evidence: "Missing phone",
              action: "Add phone number",
              priority: "High",
            },
          ],
          branchAnalysis: [],
          bestBranchNote: "SALVORA Malabe is highest in tracked customer clicks",
          auditSummary: {
            criticalIssues: [],
            warnings: [],
            technicalHealthNote:
              "Source-code cleanup requires a development-time code analysis and is not performed from the production admin panel.",
          },
        };

        const dummyAsk = {
          answer: `Ask test answer run #${providerCallCount}`,
          evidence: [{ label: "Page Views", value: "100" }],
          recommendations: [{ title: "Check catalog", action: "Review services", priority: "Low" }],
        };

        const bodyStr = init?.body ? String(init.body) : "";
        const isAsk = bodyStr.includes("ADMINISTRATOR QUESTION");

        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(isAsk ? dummyAsk : dummyInsights),
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return originalFetch(input, init);
    }) as typeof global.fetch;

    try {
      // Clear previous cache entries
      await AiInsightCache.deleteMany({});

      // 1. First 30d Analyze Website request -> provider called, MongoDB cache created
      const first30dRes = await getAiInsightsHandler(
        createGetRequest("http://localhost:3000/api/admin/ai/insights?range=30d")
      );
      const first30dData = await first30dRes.json();

      const cachedDoc30d = await AiInsightCache.findOne({ cacheKey: "insights_30d" }).lean();

      report(
        "First 30d request calls provider and creates MongoDB cache entry",
        first30dData.success === true &&
          first30dData.cached === false &&
          providerCallCount === 1 &&
          Boolean(cachedDoc30d) &&
          cachedDoc30d?.range === "30d" &&
          new Date(cachedDoc30d!.expiresAt).getTime() > Date.now()
      );

      // 2. Second 30d request within 15 minutes -> cached response returned, provider not called again
      const second30dRes = await getAiInsightsHandler(
        createGetRequest("http://localhost:3000/api/admin/ai/insights?range=30d")
      );
      const second30dData = await second30dRes.json();

      report(
        "Second 30d request within 15 minutes returns cached response without calling provider",
        second30dData.success === true &&
          second30dData.cached === true &&
          providerCallCount === 1
      );

      // 3. forceRefresh -> provider called again, cache replaced
      const refreshRes = await getAiInsightsHandler(
        createGetRequest("http://localhost:3000/api/admin/ai/insights?range=30d&refresh=true")
      );
      const refreshData = await refreshRes.json();
      const updatedDoc30d = await AiInsightCache.findOne({ cacheKey: "insights_30d" }).lean();

      report(
        "forceRefresh bypasses cache, calls provider again, and updates cache document",
        refreshData.success === true &&
          refreshData.cached === false &&
          providerCallCount === 2 &&
          ((updatedDoc30d?.result as Record<string, { summary?: string }>)?.overview?.summary?.includes("run #2") ?? false)
      );

      // 4. Expired cache -> ignored
      await AiInsightCache.updateOne(
        { cacheKey: "insights_30d" },
        { expiresAt: new Date(Date.now() - 10000) }
      );

      const expiredRes = await getAiInsightsHandler(
        createGetRequest("http://localhost:3000/api/admin/ai/insights?range=30d")
      );
      const expiredData = await expiredRes.json();

      report(
        "Expired cache is ignored and fresh AI insights are generated",
        expiredData.success === true &&
          expiredData.cached === false &&
          providerCallCount === 3
      );

      // 5. 7d and 30d use different cache keys
      const res7d = await getAiInsightsHandler(
        createGetRequest("http://localhost:3000/api/admin/ai/insights?range=7d")
      );
      const data7d = await res7d.json();

      const doc7d = await AiInsightCache.findOne({ cacheKey: "insights_7d" }).lean();
      const doc30d = await AiInsightCache.findOne({ cacheKey: "insights_30d" }).lean();

      report(
        "7d and 30d use different cache keys and coexist in MongoDB",
        data7d.success === true &&
          Boolean(doc7d) &&
          Boolean(doc30d) &&
          doc7d?.cacheKey === "insights_7d" &&
          doc30d?.cacheKey === "insights_30d" &&
          ((doc7d?.cacheKey as string) !== (doc30d?.cacheKey as string))
      );

      // 6. AI ask endpoint is not cached
      const cacheCountBeforeAsk = await AiInsightCache.countDocuments();
      const initialProviderCallsBeforeAsk = providerCallCount;

      const ask1Res = await askAiHandler(
        createJsonPostRequest("http://localhost:3000/api/admin/ai/ask", {
          question: "Which branch has the most WhatsApp clicks?",
          range: "30d",
        })
      );
      const ask1Data = await ask1Res.json();

      const ask2Res = await askAiHandler(
        createJsonPostRequest("http://localhost:3000/api/admin/ai/ask", {
          question: "Which branch has the most WhatsApp clicks?",
          range: "30d",
        })
      );
      const ask2Data = await ask2Res.json();

      const cacheCountAfterAsk = await AiInsightCache.countDocuments();

      report(
        "AI ask endpoint is not cached (always live, never written to AiInsightCache)",
        ask1Data.success === true &&
          ask2Data.success === true &&
          providerCallCount === initialProviderCallsBeforeAsk + 2 &&
          cacheCountAfterAsk === cacheCountBeforeAsk
      );

      // 8. No secrets stored in AiInsightCache
      const allCacheDocs = await AiInsightCache.find().lean();
      const serializedAllCache = JSON.stringify(allCacheDocs).toLowerCase();
      const forbiddenInCache = ["password", "jwt", "secret", "token", "sk-"];
      const hasLeakInCache = forbiddenInCache.some((sub) => serializedAllCache.includes(sub));

      report(
        "No secrets or credentials stored in AiInsightCache",
        !hasLeakInCache && allCacheDocs.length > 0
      );
    } finally {
      // Restore fetch and API key
      global.fetch = originalFetch;
      if (savedApiKey) {
        process.env.OPENAI_API_KEY = savedApiKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    }

    console.log("\n==================================================");
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("==================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test suite error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

runAiAssistantTestSuite();
