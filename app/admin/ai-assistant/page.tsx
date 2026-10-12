"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  SparklesIcon,
  StoreIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { StructuredInsights } from "@/app/api/admin/ai/insights/route";
import { WebsiteContext } from "@/lib/ai/buildWebsiteContext";

type DateRange = "7d" | "30d" | "this_month" | "prev_month";
type ActiveTab = "overview" | "performance" | "branches" | "audit";

interface AskResponse {
  answer: string;
  evidence: Array<{ label: string; value: string }>;
  recommendations: Array<{ title: string; action: string; priority: "High" | "Medium" | "Low" }>;
  dataConfidence?: "low" | "medium" | "high";
  confidenceExplanation?: string;
}

const SUGGESTED_QUESTIONS = [
  "How is the website performing?",
  "Which branch is performing best?",
  "What should we improve this month?",
  "Which pages need attention?",
  "How are customers contacting us?",
  "Are there any website problems?",
  "How can we get more Google Reviews?",
];

function formatMarkdownToCleanElements(text: string) {
  // Safe paragraph and bullet renderer without dangerouslySetInnerHTML
  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`space-${idx}`} className="h-2" />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={idx} className="text-sm font-bold text-stone-900 mt-2 mb-1">
          {trimmed.slice(4)}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={idx} className="text-base font-bold text-stone-900 mt-3 mb-1.5">
          {trimmed.slice(3)}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={idx} className="text-lg font-extrabold text-stone-900 mt-3 mb-2">
          {trimmed.slice(2)}
        </h2>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-xs text-stone-700 leading-relaxed">
          <span className="text-[#7C3AED] font-bold text-sm leading-none">•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const dotIndex = trimmed.indexOf(". ");
      elements.push(
        <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-xs text-stone-700 leading-relaxed">
          <span className="font-bold text-[#7C3AED]">{trimmed.slice(0, dotIndex + 1)}</span>
          <span>{trimmed.slice(dotIndex + 2)}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={idx} className="text-xs text-stone-700 leading-relaxed my-1">
          {trimmed}
        </p>
      );
    }
  });

  return elements;
}

export default function AiAssistantPage() {
  const [range, setRange] = useState<DateRange>("30d");
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [insights, setInsights] = useState<StructuredInsights | null>(null);
  const [context, setContext] = useState<WebsiteContext | null>(null);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [notConfigured, setNotConfigured] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ask AI state
  const [question, setQuestion] = useState<string>("");
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(false);
  const [askResponse, setAskResponse] = useState<AskResponse | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  // Load insights for selected date range
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(`/api/admin/ai/insights?range=${range}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (isMounted) {
          if (data.notConfigured) {
            setNotConfigured(true);
            if (data.context) setContext(data.context);
          } else if (res.ok && data.success) {
            setNotConfigured(false);
            setInsights(data.insights);
            setContext(data.context);
          } else {
            setErrorMessage(data.message || "Failed to generate AI insights");
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError" && isMounted) {
          console.error("AI insights fetch error:", err);
          setErrorMessage("Network error connecting to AI insights service");
        }
      } finally {
        if (isMounted) setLoadingInsights(false);
      }
    }

    load();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [range]);

  const handleRangeChange = (newRange: DateRange) => {
    if (newRange !== range) {
      setLoadingInsights(true);
      setRange(newRange);
    }
  };

  const handleManualAnalyze = async () => {
    try {
      setLoadingInsights(true);
      setErrorMessage(null);
      const res = await fetch(`/api/admin/ai/insights?range=${range}&refresh=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range, forceRefresh: true }),
      });
      const data = await res.json();
      if (data.notConfigured) {
        setNotConfigured(true);
        if (data.context) setContext(data.context);
      } else if (res.ok && data.success) {
        setNotConfigured(false);
        setInsights(data.insights);
        setContext(data.context);
      } else {
        setErrorMessage(data.message || "Failed to generate AI insights");
      }
    } catch (err) {
      console.error("Manual analyze error:", err);
      setErrorMessage("Network error connecting to AI insights service");
    } finally {
      setLoadingInsights(false);
    }
  };

  // Handle Ask AI question submission
  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    try {
      setLoadingQuestion(true);
      setAskError(null);

      const res = await fetch("/api/admin/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          range,
        }),
      });

      const data = await res.json();

      if (data.notConfigured) {
        setNotConfigured(true);
        setAskError("AI Assistant is not configured. Add your AI provider API key in your environment variables.");
      } else if (res.ok && data.success) {
        setAskResponse(data);
      } else {
        setAskError(data.message || "Failed to process question");
      }
    } catch (err) {
      console.error("Ask AI error:", err);
      setAskError("Network error while communicating with AI Assistant");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const dataConfidence = context?.dataConfidence || "low";
  const confidenceColor =
    dataConfidence === "high"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : dataConfidence === "medium"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-stone-100 text-stone-600 border-stone-200";

  return (
    <div className="space-y-7 animate-fadeIn pb-14">
      {/* ========================================================== */}
      {/* 1. HEADER: TITLE + DATE RANGE FILTER + RE-ANALYZE BUTTON   */}
      {/* ========================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100 shadow-2xs">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
              AI Website Assistant
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-2xl">
            Use SALVORA&apos;s real website analytics and content data to understand performance, identify issues, and discover opportunities for improvement.
          </p>
        </div>

        {/* Range Selector & Action Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl border border-stone-200/90 bg-stone-100 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleRangeChange("7d")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                range === "7d"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => handleRangeChange("30d")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                range === "30d"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => handleRangeChange("this_month")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                range === "this_month"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handleRangeChange("prev_month")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                range === "prev_month"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Previous Month
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualAnalyze}
            disabled={loadingInsights}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#6D28D9] transition-all disabled:opacity-60 cursor-pointer"
          >
            <SparklesIcon className={`h-4 w-4 ${loadingInsights ? "animate-spin" : ""}`} />
            <span>{loadingInsights ? "Analyzing..." : "Analyze Website"}</span>
          </button>
        </div>
      </div>

      {/* Unconfigured Provider Notice */}
      {notConfigured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-900">
                AI Assistant Not Configured
              </h2>
              <p className="text-xs text-amber-700 mt-0.5">
                Add your AI provider API key (e.g. <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">OPENAI_API_KEY</code> in your environment variables) to enable automated SALVORA website insights.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="shrink-0 rounded-xl bg-amber-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-800 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. ASK SALVORA AI INTERACTIVE CARD                         */}
      {/* ========================================================== */}
      <div className="rounded-2xl border border-purple-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#7C3AED]">
              <SearchIcon className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-stone-900">Ask SALVORA AI</h2>
          </div>
          <span className="text-[11px] text-stone-400 font-medium">
            Answers strictly from real MongoDB data
          </span>
        </div>

        {/* Question Form */}
        <div className="mt-4">
          <div className="relative">
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about website performance, customer inquiries, branches, or content..."
              className="w-full rounded-xl border border-stone-200 p-3.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              maxLength={500}
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-stone-400">
              {question.length}/500 characters
            </span>
            <button
              type="button"
              onClick={() => handleAsk()}
              disabled={loadingQuestion || !question.trim() || notConfigured}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#6D28D9] transition-all disabled:opacity-50 cursor-pointer"
            >
              <SparklesIcon className={`h-3.5 w-3.5 ${loadingQuestion ? "animate-spin" : ""}`} />
              <span>{loadingQuestion ? "Consulting AI..." : "Ask AI"}</span>
            </button>
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
            Suggested Questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setQuestion(q);
                  handleAsk(q);
                }}
                disabled={loadingQuestion || notConfigured}
                className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-purple-300 hover:bg-purple-50/50 hover:text-[#7C3AED] transition-all disabled:opacity-50 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Ask AI Error */}
        {askError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            <span>{askError}</span>
          </div>
        )}

        {/* Ask AI Response Display */}
        {askResponse && (
          <div className="mt-5 rounded-2xl border border-purple-200/90 bg-purple-50/20 p-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#7C3AED] text-white">
                  <SparklesIcon className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-bold text-purple-900">AI Response</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${confidenceColor}`}>
                Data Confidence: {dataConfidence.toUpperCase()}
              </span>
            </div>

            {/* Answer Content */}
            <div className="mt-3.5">
              {formatMarkdownToCleanElements(askResponse.answer)}
            </div>

            {/* Measured Evidence Pills */}
            {askResponse.evidence && askResponse.evidence.length > 0 && (
              <div className="mt-4 pt-3 border-t border-purple-100">
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Measured Evidence:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {askResponse.evidence.map((item, i) => (
                    <div key={i} className="rounded-xl border border-purple-200/70 bg-white p-2.5">
                      <p className="text-[10px] text-stone-500 font-semibold truncate">
                        {item.label}
                      </p>
                      <p className="text-sm font-extrabold text-stone-900 mt-0.5">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations List */}
            {askResponse.recommendations && askResponse.recommendations.length > 0 && (
              <div className="mt-4 pt-3 border-t border-purple-100">
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Recommended Actions:
                </p>
                <div className="space-y-2">
                  {askResponse.recommendations.map((rec, i) => (
                    <div key={i} className="rounded-xl border border-stone-200 bg-white p-3 text-xs flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-stone-900">{rec.title}</p>
                        <p className="text-stone-600 mt-0.5">{rec.action}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          rec.priority === "High"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : rec.priority === "Medium"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-stone-100 text-stone-600 border border-stone-200"
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* 3. SECTION TABS: OVERVIEW | PERFORMANCE | BRANCHES | AUDIT */}
      {/* ========================================================== */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1" aria-label="Insight categories">
          {[
            { id: "overview", label: "Website Overview" },
            { id: "performance", label: "Performance Insights" },
            { id: "branches", label: "Branch Analysis" },
            { id: "audit", label: "Website Audit" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ========================================================== */}
      {/* 4. TAB 1: WEBSITE OVERVIEW                                 */}
      {/* ========================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Main AI Overview Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Website Activity Summary ({context?.dateRange.label || "Last 30 Days"})
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Overall customer interaction level and key observations
                </p>
              </div>
              <span className={`self-start sm:self-auto rounded-full px-3 py-1 text-xs font-bold border ${confidenceColor}`}>
                Data Confidence: {dataConfidence.toUpperCase()}
              </span>
            </div>

            {/* Overview Statement */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-stone-900 leading-relaxed">
                {insights?.overview.summary ||
                  (notConfigured
                    ? "Connect an AI provider to view automated natural-language summary."
                    : loadingInsights
                    ? "Generating website overview..."
                    : "No overview generated yet.")}
              </p>
            </div>

            {/* Highlights vs Attention Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Highlights */}
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Highlights
                  </h4>
                </div>
                <div className="space-y-2">
                  {insights?.overview.highlights && insights.overview.highlights.length > 0 ? (
                    insights.overview.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-stone-700">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{h}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-400">
                      {loadingInsights ? "Loading highlights..." : "No highlights recorded for this period."}
                    </p>
                  )}
                </div>
              </div>

              {/* Attention Items */}
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircleIcon className="h-4 w-4 text-amber-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Attention Items
                  </h4>
                </div>
                <div className="space-y-2">
                  {insights?.overview.attention && insights.overview.attention.length > 0 ? (
                    insights.overview.attention.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-stone-700">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-400">
                      {loadingInsights ? "Loading attention items..." : "No urgent issues detected."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Content Inventory from Context */}
          {context && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 mb-3">
                Live Content Inventory ({context.content.salonName})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {Object.entries(context.content.counts).map(([key, val]) => (
                  <div key={key} className="rounded-xl border border-stone-100 bg-stone-50/60 p-3 text-center">
                    <p className="text-lg font-extrabold text-stone-900">{val}</p>
                    <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mt-0.5 truncate">
                      {key.replace(/([A-Z])/g, " $1")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 5. TAB 2: PERFORMANCE INSIGHTS                             */}
      {/* ========================================================== */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {/* Metrics Comparison Table */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs overflow-hidden">
            <div className="pb-4 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                Period-over-Period Performance Comparison
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Comparing {context?.dateRange.label || "selected period"} against previous baseline
              </p>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3">Current</th>
                    <th className="py-2.5 px-3">Previous</th>
                    <th className="py-2.5 px-3">Change</th>
                    <th className="py-2.5 px-3">AI Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {insights?.performanceInsights && insights.performanceInsights.length > 0 ? (
                    insights.performanceInsights.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-3 px-3 font-bold text-stone-900">{item.metric}</td>
                        <td className="py-3 px-3 font-semibold text-stone-800">{item.current}</td>
                        <td className="py-3 px-3 text-stone-500">{item.previous}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 font-bold text-[11px] ${
                              item.change.startsWith("+")
                                ? "bg-emerald-50 text-emerald-700"
                                : item.change.startsWith("-")
                                ? "bg-red-50 text-red-700"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {item.change}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-stone-600 max-w-md">{item.interpretation}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        {loadingInsights
                          ? "Generating performance insights..."
                          : "No performance comparison generated yet. Click 'Analyze Website'."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* What Improved vs What Needs Attention */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What Improved */}
            <div className="rounded-2xl border border-emerald-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <TrendingUpIcon className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900">What Improved</h3>
              </div>
              <div className="mt-4 space-y-3">
                {insights?.improvements && insights.improvements.length > 0 ? (
                  insights.improvements.map((item, i) => (
                    <div key={i} className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
                      <p className="text-xs font-bold text-stone-900">{item.title}</p>
                      <p className="text-xs text-stone-600 mt-1">{item.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 py-4 text-center">
                    {loadingInsights ? "Loading..." : "No significant positive shifts recorded."}
                  </p>
                )}
              </div>
            </div>

            {/* What Needs Attention */}
            <div className="rounded-2xl border border-amber-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <TrendingDownIcon className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">What Needs Attention</h3>
              </div>
              <div className="mt-4 space-y-3">
                {insights?.declines && insights.declines.length > 0 ? (
                  insights.declines.map((item, i) => (
                    <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/30 p-3">
                      <p className="text-xs font-bold text-stone-900">{item.title}</p>
                      <p className="text-xs text-stone-600 mt-1">{item.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-400 py-4 text-center">
                    {loadingInsights ? "Loading..." : "No major declines detected."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 6. TAB 3: BRANCH ANALYSIS                                  */}
      {/* ========================================================== */}
      {activeTab === "branches" && (
        <div className="space-y-6">
          {/* Best Branch Note Banner */}
          {insights?.bestBranchNote && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-[#7C3AED] mb-1.5">
                <StoreIcon className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Branch Interaction Leader
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
                {insights.bestBranchNote}
              </p>
            </div>
          )}

          {/* Branch Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {insights?.branchAnalysis && insights.branchAnalysis.length > 0 ? (
              insights.branchAnalysis.map((b, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <StoreIcon className="h-4 w-4 text-[#7C3AED]" />
                        <h4 className="text-sm font-bold text-stone-900">{b.branchName}</h4>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-stone-700 leading-relaxed">
                      {b.summary}
                    </p>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="rounded-lg bg-emerald-50/60 p-2.5 border border-emerald-100">
                        <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                          Strongest Channel
                        </span>
                        <span className="text-stone-700 mt-0.5 block">{b.strongestAction}</span>
                      </div>

                      <div className="rounded-lg bg-amber-50/60 p-2.5 border border-amber-100">
                        <span className="font-bold text-amber-800 block text-[11px] uppercase tracking-wider">
                          Needs Attention
                        </span>
                        <span className="text-stone-700 mt-0.5 block">{b.needsAttention}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 text-xs">
                    <span className="font-bold text-purple-900 block text-[11px] uppercase tracking-wider">
                      Recommendation
                    </span>
                    <p className="text-stone-600 mt-0.5">{b.recommendation}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-400">
                {loadingInsights
                  ? "Analyzing branch performance..."
                  : "No branch analysis generated yet. Click 'Analyze Website'."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 7. TAB 4: WEBSITE AUDIT & RECOMMENDATIONS                  */}
      {/* ========================================================== */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {/* Prioritized Recommendations for This Month */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="pb-4 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                What Should We Improve This Month?
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Prioritized actionable recommendations backed by real traffic and configuration data
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights?.recommendations && insights.recommendations.length > 0 ? (
                insights.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-stone-200/80 bg-stone-50/40 p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                          {rec.title}
                        </h4>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                            rec.priority === "High"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : rec.priority === "Medium"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-stone-100 text-stone-600 border border-stone-200"
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                        <strong className="text-stone-800">Reason:</strong> {rec.reason}
                      </p>

                      <div className="mt-2.5 rounded-lg bg-white p-2 border border-stone-200/70 text-[11px] text-stone-700">
                        <strong className="text-[#7C3AED]">Evidence:</strong> {rec.evidence}
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-stone-200/60 text-xs">
                      <strong className="text-emerald-700">Action:</strong> {rec.action}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-stone-400">
                  {loadingInsights
                    ? "Generating recommendations..."
                    : "No recommendations available yet. Click 'Analyze Website'."}
                </div>
              )}
            </div>
          </div>

          {/* Audit Summary & Technical Health Safety Notice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deterministic Health Audit */}
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-stone-900">Configuration Audit</h3>
                </div>
                <span className="text-xs font-bold text-stone-700">
                  Status: {context?.health.status || "Healthy"}
                </span>
              </div>

              <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {context?.health.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2.5 rounded-xl p-2.5 border text-xs ${
                      item.status === "ok"
                        ? "border-emerald-100 bg-emerald-50/30 text-stone-700"
                        : item.status === "critical"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {item.status === "ok" ? (
                        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircleIcon className="h-3.5 w-3.5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-[11px] opacity-80 mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Health Safety Notice */}
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                  <span className="text-stone-400 font-mono text-xs">⚙️</span>
                  <h3 className="text-sm font-bold text-stone-900">Technical Health Policy</h3>
                </div>

                <div className="mt-4 space-y-3 text-xs text-stone-700 leading-relaxed">
                  <p>
                    SALVORA AI is designed strictly as a <strong>read-only analytical advisor</strong>.
                  </p>
                  <div className="rounded-xl bg-purple-50/50 border border-purple-100 p-3.5 text-purple-900 text-xs">
                    <p className="font-semibold mb-1">Runtime Code Safety:</p>
                    <p className="text-[11px] leading-relaxed">
                      {insights?.auditSummary.technicalHealthNote ||
                        "Source-code cleanup requires a development-time code analysis and is not performed from the production admin panel."}
                    </p>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Production Vercel deployments do not allow autonomous deletion of source files, models, or database collections. All recommendations must be reviewed and executed by human developers and salon administrators.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100">
                <Link
                  href="/admin/settings"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:underline"
                >
                  <span>Edit Website Settings →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
