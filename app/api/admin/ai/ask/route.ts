import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  isAiConfiguredAsync,
  generateAiChatCompletion,
  AiProviderError,
} from "@/lib/ai/provider";
import { SALVORA_AI_SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import { buildWebsiteContext } from "@/lib/ai/buildWebsiteContext";

const ALLOWED_RANGES = ["7d", "30d", "this_month", "prev_month"];

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request payload" },
        { status: 400 }
      );
    }

    const { question, range = "30d" } = body as { question?: unknown; range?: unknown };

    if (!question || typeof question !== "string" || question.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "A question of at least 2 characters is required" },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length > 500) {
      return NextResponse.json(
        { success: false, message: "Question exceeds maximum length of 500 characters" },
        { status: 400 }
      );
    }

    if (typeof range !== "string" || !ALLOWED_RANGES.includes(range)) {
      return NextResponse.json(
        { success: false, message: `Invalid range. Allowed values: ${ALLOWED_RANGES.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if AI provider has been configured (admin override or env)
    if (!(await isAiConfiguredAsync())) {
      return NextResponse.json({
        success: false,
        notConfigured: true,
        message: "AI Assistant is not configured. Add your AI provider API key to enable SALVORA website insights.",
      });
    }

    // Build trusted server-side context (never trust client-supplied metrics)
    const context = await buildWebsiteContext(range);

    const userPrompt = `SALVORA WEBSITE DATA CONTEXT (Strict Truth Source):
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

ADMINISTRATOR QUESTION:
"${trimmedQuestion}"

Respond with a JSON object strictly conforming to this schema:
{
  "answer": "Clear, professional, fact-based answer referencing only the supplied data. If data is sparse or unmeasured, clearly state so.",
  "evidence": [
    { "label": "Short metric or fact name", "value": "Measured value or count" }
  ],
  "recommendations": [
    {
      "title": "Short recommendation title",
      "action": "Practical action for salon administrators",
      "priority": "High" | "Medium" | "Low"
    }
  ]
}
`;

    const aiResponseRaw = await generateAiChatCompletion(
      [
        { role: "system", content: SALVORA_AI_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.2,
        responseFormatJson: true,
      }
    );

    let parsedResult: {
      answer: string;
      evidence?: Array<{ label: string; value: string }>;
      recommendations?: Array<{ title: string; action: string; priority: "High" | "Medium" | "Low" }>;
    };

    try {
      parsedResult = JSON.parse(aiResponseRaw);
    } catch {
      parsedResult = {
        answer: aiResponseRaw,
        evidence: [],
        recommendations: [],
      };
    }

    return NextResponse.json({
      success: true,
      answer: parsedResult.answer || "No response generated.",
      evidence: Array.isArray(parsedResult.evidence) ? parsedResult.evidence : [],
      recommendations: Array.isArray(parsedResult.recommendations)
        ? parsedResult.recommendations
        : [],
      dataConfidence: context.dataConfidence,
      confidenceExplanation: context.confidenceExplanation,
      range: context.dateRange.range,
    });
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

    console.error("POST /api/admin/ai/ask error:", error);
    return NextResponse.json(
      { success: false, message: "AI analysis could not be generated right now. Your website data remains available." },
      { status: 500 }
    );
  }
}
