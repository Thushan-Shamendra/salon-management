import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";
import Branch, { IBranch } from "@/models/Branch";

export interface NormalizedGoogleReview {
  authorName: string;
  authorPhoto: string;
  rating: number;
  text: string;
  relativeTime: string;
  googleMapsUrl?: string;
}

export interface GoogleReviewsResponse {
  success: boolean;
  enabled: boolean;
  configured?: boolean;
  rating: number | null;
  totalReviews: number;
  reviewCount: number;
  reviews: NormalizedGoogleReview[];
  businessUrl: string;
  writeReviewUrl?: string | null;
  branch?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  message?: string;
}

interface RawGoogleReview {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  author_url?: string;
}

interface GooglePlacesApiResponse {
  status: string;
  error_message?: string;
  result?: {
    name?: string;
    rating?: number;
    user_ratings_total?: number;
    url?: string;
    reviews?: RawGoogleReview[];
  };
}

// GET /api/google-reviews - Public Google reviews endpoint with branch isolation & global fallback
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const branchParam = searchParams.get("branch");

    // ==============================================================
    // BRANCH EXPLICITLY REQUESTED
    // When a branch is specified, ONLY use that branch's configuration.
    // NEVER fall back to another branch or global SalonSettings reviews.
    // ==============================================================
    if (branchParam !== null && branchParam.trim() !== "") {
      const trimmedParam = branchParam.trim();
      let branchDoc: IBranch | null = null;

      if (mongoose.Types.ObjectId.isValid(trimmedParam)) {
        branchDoc = await Branch.findById(trimmedParam).lean();
      }
      if (!branchDoc) {
        branchDoc = await Branch.findOne({ slug: trimmedParam.toLowerCase() }).lean();
      }

      // Branch does not exist or is inactive
      if (!branchDoc || branchDoc.isActive === false) {
        return NextResponse.json<GoogleReviewsResponse>({
          success: true,
          enabled: false,
          configured: false,
          rating: null,
          totalReviews: 0,
          reviewCount: 0,
          reviews: [],
          businessUrl: "",
          writeReviewUrl: null,
          branch: branchDoc
            ? {
                _id: branchDoc._id.toString(),
                name: branchDoc.name,
                slug: branchDoc.slug,
              }
            : null,
          message: branchDoc
            ? "Google Reviews are not currently available for this branch."
            : "Branch not found",
        });
      }

      const branchInfo = {
        _id: branchDoc._id.toString(),
        name: branchDoc.name,
        slug: branchDoc.slug,
      };

      const branchWriteReviewUrl = branchDoc.googleReviewUrl?.trim() || null;
      const branchBusinessUrl =
        branchDoc.googleReviewUrl?.trim() || branchDoc.googleMapsUrl?.trim() || "";

      // Branch has reviews disabled or missing Google Place ID
      if (!branchDoc.reviewsEnabled || !branchDoc.googlePlaceId?.trim()) {
        return NextResponse.json<GoogleReviewsResponse>({
          success: true,
          enabled: false,
          configured: false,
          rating: null,
          totalReviews: 0,
          reviewCount: 0,
          reviews: [],
          businessUrl: branchBusinessUrl,
          writeReviewUrl: branchWriteReviewUrl,
          branch: branchInfo,
          message: "Google Reviews are not currently available for this branch.",
        });
      }

      // Branch has reviews enabled and Google Place ID configured
      const placeId = branchDoc.googlePlaceId.trim();
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;

      if (!apiKey || !apiKey.trim()) {
        return NextResponse.json<GoogleReviewsResponse>({
          success: true,
          enabled: true,
          configured: false,
          rating: null,
          totalReviews: 0,
          reviewCount: 0,
          reviews: [],
          businessUrl: branchBusinessUrl,
          writeReviewUrl: branchWriteReviewUrl,
          branch: branchInfo,
          message: "Google Places API key is not configured",
        });
      }

      const googleEndpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        placeId
      )}&fields=name,rating,user_ratings_total,reviews,url&key=${encodeURIComponent(
        apiKey.trim()
      )}`;

      const googleRes = await fetch(googleEndpoint, {
        next: { revalidate: 3600 },
      });

      if (!googleRes.ok) {
        console.error("Google Places API HTTP error:", googleRes.status, googleRes.statusText);
        return NextResponse.json<GoogleReviewsResponse>({
          success: false,
          enabled: true,
          configured: true,
          rating: null,
          totalReviews: 0,
          reviewCount: 0,
          reviews: [],
          businessUrl: branchBusinessUrl,
          writeReviewUrl: branchWriteReviewUrl,
          branch: branchInfo,
          message: "Google reviews are temporarily unavailable",
        });
      }

      const data: GooglePlacesApiResponse = await googleRes.json();

      if (data.status !== "OK" || !data.result) {
        console.error(
          "Google Places API responded with non-OK status:",
          data.status,
          data.error_message || ""
        );
        return NextResponse.json<GoogleReviewsResponse>({
          success: false,
          enabled: true,
          configured: true,
          rating: null,
          totalReviews: 0,
          reviewCount: 0,
          reviews: [],
          businessUrl: branchBusinessUrl,
          writeReviewUrl: branchWriteReviewUrl,
          branch: branchInfo,
          message: "Google reviews are temporarily unavailable",
        });
      }

      const result = data.result;
      const rating = typeof result.rating === "number" ? result.rating : null;
      const totalReviews =
        typeof result.user_ratings_total === "number" ? result.user_ratings_total : 0;
      const resolvedBusinessUrl =
        branchBusinessUrl ||
        result.url ||
        `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${encodeURIComponent(
          placeId
        )}`;

      const rawReviews = Array.isArray(result.reviews) ? result.reviews : [];
      const normalizedReviews: NormalizedGoogleReview[] = rawReviews
        .slice(0, 5)
        .map((r) => ({
          authorName: r.author_name || "Google Reviewer",
          authorPhoto: r.profile_photo_url || "",
          rating: typeof r.rating === "number" ? r.rating : 5,
          text: r.text || "",
          relativeTime: r.relative_time_description || "",
          googleMapsUrl: r.author_url || "",
        }));

      return NextResponse.json<GoogleReviewsResponse>({
        success: true,
        enabled: true,
        configured: true,
        rating,
        totalReviews,
        reviewCount: totalReviews,
        reviews: normalizedReviews,
        businessUrl: resolvedBusinessUrl,
        writeReviewUrl: branchWriteReviewUrl,
        branch: branchInfo,
      });
    }

    // ==============================================================
    // NO BRANCH PARAMETER PROVIDED -> GLOBAL FALLBACK ONLY
    // Maintains backward compatibility for legacy non-branch review usage.
    // ==============================================================
    const settings = await SalonSettings.findOne().lean();
    const globalGoogleSettings = settings?.googleReviews;

    if (!globalGoogleSettings || !globalGoogleSettings.enabled) {
      return NextResponse.json<GoogleReviewsResponse>({
        success: true,
        enabled: false,
        configured: false,
        rating: null,
        totalReviews: 0,
        reviewCount: 0,
        reviews: [],
        businessUrl: "",
        writeReviewUrl: null,
      });
    }

    const placeId = (globalGoogleSettings.placeId || "").trim();
    const businessUrl = (globalGoogleSettings.businessUrl || "").trim();
    const writeReviewUrl = businessUrl || null;

    if (!placeId) {
      return NextResponse.json<GoogleReviewsResponse>({
        success: true,
        enabled: false,
        configured: false,
        rating: null,
        totalReviews: 0,
        reviewCount: 0,
        reviews: [],
        businessUrl,
        writeReviewUrl,
        message: "Google Place ID is not configured",
      });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json<GoogleReviewsResponse>({
        success: true,
        enabled: true,
        configured: false,
        rating: null,
        totalReviews: 0,
        reviewCount: 0,
        reviews: [],
        businessUrl,
        writeReviewUrl,
        message: "Google Places API key is not configured",
      });
    }

    const googleEndpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=name,rating,user_ratings_total,reviews,url&key=${encodeURIComponent(
      apiKey.trim()
    )}`;

    const googleRes = await fetch(googleEndpoint, {
      next: { revalidate: 3600 },
    });

    if (!googleRes.ok) {
      console.error("Google Places API HTTP error:", googleRes.status, googleRes.statusText);
      return NextResponse.json<GoogleReviewsResponse>({
        success: false,
        enabled: true,
        configured: true,
        rating: null,
        totalReviews: 0,
        reviewCount: 0,
        reviews: [],
        businessUrl,
        writeReviewUrl,
        message: "Google reviews are temporarily unavailable",
      });
    }

    const data: GooglePlacesApiResponse = await googleRes.json();

    if (data.status !== "OK" || !data.result) {
      console.error(
        "Google Places API responded with non-OK status:",
        data.status,
        data.error_message || ""
      );
      return NextResponse.json<GoogleReviewsResponse>({
        success: false,
        enabled: true,
        configured: true,
        rating: null,
        totalReviews: 0,
        reviewCount: 0,
        reviews: [],
        businessUrl,
        writeReviewUrl,
        message: "Google reviews are temporarily unavailable",
      });
    }

    const result = data.result;
    const rating = typeof result.rating === "number" ? result.rating : null;
    const totalReviews =
      typeof result.user_ratings_total === "number" ? result.user_ratings_total : 0;
    const resolvedBusinessUrl =
      businessUrl ||
      result.url ||
      `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${encodeURIComponent(
        placeId
      )}`;

    const maxReviews =
      typeof globalGoogleSettings.maxReviews === "number" && globalGoogleSettings.maxReviews > 0
        ? globalGoogleSettings.maxReviews
        : 5;

    const rawReviews = Array.isArray(result.reviews) ? result.reviews : [];
    const normalizedReviews: NormalizedGoogleReview[] = rawReviews
      .slice(0, maxReviews)
      .map((r) => ({
        authorName: r.author_name || "Google Reviewer",
        authorPhoto: r.profile_photo_url || "",
        rating: typeof r.rating === "number" ? r.rating : 5,
        text: r.text || "",
        relativeTime: r.relative_time_description || "",
        googleMapsUrl: r.author_url || "",
      }));

    return NextResponse.json<GoogleReviewsResponse>({
      success: true,
      enabled: true,
      configured: true,
      rating,
      totalReviews,
      reviewCount: totalReviews,
      reviews: normalizedReviews,
      businessUrl: resolvedBusinessUrl,
      writeReviewUrl: writeReviewUrl || resolvedBusinessUrl || null,
    });
  } catch (error) {
    console.error("GET /api/google-reviews internal error:", error);
    return NextResponse.json<GoogleReviewsResponse>(
      {
        success: false,
        enabled: false,
        rating: null,
        totalReviews: 0,
        reviewCount: 0,
        reviews: [],
        businessUrl: "",
        writeReviewUrl: null,
        message: "Google reviews are temporarily unavailable",
      },
      { status: 200 }
    );
  }
}
