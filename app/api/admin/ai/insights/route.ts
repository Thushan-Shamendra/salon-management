import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { isAiConfigured, generateAiChatCompletion, AiProviderError } from "@/lib/ai/provider";
import { SALVORA_AI_SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import { buildWebsiteContext, WebsiteContext } from "@/lib/ai/buildWebsiteContext";
import AiInsightCache from "@/models/AiInsightCache";

const ALLOWED_RANGES = ["7d", "30d", "this_month", "prev_month"];
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface StructuredInsights {
  overview: {
    summary: string;
    highlights: string[];
    attention: string[];
  };
  performanceInsights: Array<{
    metric: string;
    current: number;
    previous: number;
    change: string;
    interpretation: string;
  }>;
  improvements: Array<{
    title: string;
    detail: string;
  }>;
  declines: Array<{
    title: string;
    detail: string;
  }>;
  recommendations: Array<{
    title: string;
    reason: string;
    evidence: string;
    action: string;
    priority: "High" | "Medium" | "Low";
  }>;
  branchAnalysis: Array<{
    branchName: string;
    summary: string;
    strongestAction: string;
    needsAttention: string;
    recommendation: string;
  }>;
  bestBranchNote: string;
  auditSummary: {
    criticalIssues: string[];
    warnings: string[];
    technicalHealthNote: string;
  };
}

async function handleGenerateInsights(rangeParam: string = "30d", forceRefresh: boolean = false) {
  const range = ALLOWED_RANGES.includes(rangeParam) ? rangeParam : "30d";

  // Build trusted server-side context
  const context: WebsiteContext = await buildWebsiteContext(range);

  // If AI key is not configured, return safe unconfigured response with data context
  if (!isAiConfigured()) {
    return {
      success: false,
      notConfigured: true,
      message: "AI Assistant is not configured. Add your AI provider API key to enable SALVORA website insights.",
      context,
      insights: null,
    };
  }

  // MongoDB-backed cache key (distinct per range)
  const cacheKey = `insights_${range}`;

  // Check MongoDB cache unless forceRefresh is explicitly requested
  if (!forceRefresh) {
    try {
      await connectDB();
      const cachedDoc = await AiInsightCache.findOne({
        cacheKey,
        expiresAt: { $gt: new Date() },
      }).lean();

      if (cachedDoc && cachedDoc.result) {
        return {
          success: true,
          cached: true,
          insights: cachedDoc.result as unknown as StructuredInsights,
          context,
        };
      }
    } catch (cacheReadErr) {
      console.warn("AiInsightCache read error, proceeding with live AI generation:", cacheReadErr);
    }
  } else {
    // If forceRefresh, proactively clear old cache entry
    try {
      await connectDB();
      await AiInsightCache.deleteOne({ cacheKey });
    } catch (cacheDeleteErr) {
      console.warn("AiInsightCache delete on forceRefresh error:", cacheDeleteErr);
    }
  }

  const prompt = `SALVORA WEBSITE DATA CONTEXT:
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

TASK:
Generate comprehensive website executive insights strictly adhering to the facts in the context.

Respond with a JSON object conforming strictly to this schema:
{
  "overview": {
    "summary": "Overall statement on website activity during the period",
    "highlights": ["2-3 key positive highlights from real data"],
    "attention": ["1-3 items needing attention based on data or health warnings"]
  },
  "performanceInsights": [
    {
      "metric": "Metric name (e.g. WhatsApp Inquiries, Page Views, Calls, etc.)",
      "current": 0,
      "previous": 0,
      "change": "+X% or -X% or New",
      "interpretation": "Concise fact-based interpretation"
    }
  ],
  "improvements": [
    {
      "title": "Short title of what improved",
      "detail": "Measured evidence explaining the improvement"
    }
  ],
  "declines": [
    {
      "title": "Short title of what dropped or needs attention",
      "detail": "Measured evidence or health status"
    }
  ],
  "recommendations": [
    {
      "title": "Actionable title (e.g. Improve Wedding CTA Visibility)",
      "reason": "Why this recommendation matters",
      "evidence": "Measured facts from context",
      "action": "Clear step for salon management",
      "priority": "High" | "Medium" | "Low"
    }
  ],
  "branchAnalysis": [
    {
      "branchName": "Branch name",
      "summary": "Interaction summary based on real counts",
      "strongestAction": "Primary customer action for this branch",
      "needsAttention": "Area where this branch is lagging or has missing configs",
      "recommendation": "Branch-specific improvement step"
    }
  ],
  "bestBranchNote": "Fair explanation of which branch leads in tracked interactions and what that means (never claim unmeasured revenue).",
  "auditSummary": {
    "criticalIssues": ["List any critical health issues"],
    "warnings": ["List configuration warnings from health checks"],
    "technicalHealthNote": "Source-code cleanup requires a development-time code analysis and is not performed from the production admin panel."
  }
}
`;

  const aiRaw = await generateAiChatCompletion(
    [
      { role: "system", content: SALVORA_AI_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    {
      temperature: 0.2,
      responseFormatJson: true,
      maxTokens: 2500,
    }
  );

  let insights: StructuredInsights;
  try {
    insights = JSON.parse(aiRaw);
  } catch (err) {
    console.error("Failed to parse AI insights JSON:", err);
    throw new AiProviderError("Failed to parse structured response from AI model", "PARSE_ERROR");
  }

  // Ensure technical health note is accurate and safe
  if (!insights.auditSummary) {
    insights.auditSummary = {
      criticalIssues: [],
      warnings: [],
      technicalHealthNote: "Source-code cleanup requires a development-time code analysis and is not performed from the production admin panel.",
    };
  } else {
    insights.auditSummary.technicalHealthNote = "Source-code cleanup requires a development-time code analysis and is not performed from the production admin panel.";
  }

  // Save to MongoDB-backed AiInsightCache (15-minute TTL)
  try {
    await connectDB();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);
    await AiInsightCache.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        range,
        result: insights,
        generatedAt: now,
        expiresAt,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  } catch (cacheSaveErr) {
    console.warn("AiInsightCache write error:", cacheSaveErr);
  }

  return {
    success: true,
    cached: false,
    insights,
    context,
  };
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") || "30d";
    const forceRefresh = searchParams.get("refresh") === "true";

    const result = await handleGenerateInsights(rangeParam, forceRefresh);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiProviderError) {
      if (error.code === "NOT_CONFIGURED") {
        return NextResponse.json({
          success: false,
          notConfigured: true,
          message: error.message,
        });
      }
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 502 }
      );
    }

    console.error("GET /api/admin/ai/insights error:", error);
    return NextResponse.json(
      { success: false, message: "AI analysis could not be generated right now. Your website data remains available." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rangeParam = (body as { range?: string })?.range || "30d";
    const forceRefresh = Boolean(
      (body as { forceRefresh?: boolean; refresh?: boolean })?.forceRefresh ||
      (body as { forceRefresh?: boolean; refresh?: boolean })?.refresh
    );

    const result = await handleGenerateInsights(rangeParam, forceRefresh);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiProviderError) {
      if (error.code === "NOT_CONFIGURED") {
        return NextResponse.json({
          success: false,
          notConfigured: true,
          message: error.message,
        });
      }
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 502 }
      );
    }

    console.error("POST /api/admin/ai/insights error:", error);
    return NextResponse.json(
      { success: false, message: "AI analysis could not be generated right now. Your website data remains available." },
      { status: 500 }
    );
  }
}
