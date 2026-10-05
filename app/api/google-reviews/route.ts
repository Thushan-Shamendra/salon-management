import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";

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
  rating: number;
  totalReviews: number;
  reviews: NormalizedGoogleReview[];
  businessUrl: string;
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

// GET /api/google-reviews - Public display-only Google reviews endpoint
export async function GET() {
  try {
    await connectDB();
    const settings = await SalonSettings.findOne().lean();

    const googleSettings = settings?.googleReviews;

    // 1. Check if enabled
    if (!googleSettings || !googleSettings.enabled) {
      return NextResponse.json<GoogleReviewsResponse>({
        success: true,
        enabled: false,
        rating: 0,
        totalReviews: 0,
        reviews: [],
        businessUrl: "",
      });
    }

    const placeId = (googleSettings.placeId || "").trim();
    const businessUrl = (googleSettings.businessUrl || "").trim();
    const maxReviews = Math.min(5, Math.max(1, Number(googleSettings.maxReviews) || 5));

    // 2. Check if Place ID is present
    if (!placeId) {
      console.warn("Google Reviews enabled but placeId is not configured in SalonSettings.");
      return NextResponse.json<GoogleReviewsResponse>({
        success: true,
        enabled: false,
        configured: false,
        rating: 0,
        totalReviews: 0,
        reviews: [],
        businessUrl,
        message: "Google Place ID is not configured",
      });
    }

    // 3. Check server-side API Key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      console.warn("GOOGLE_PLACES_API_KEY environment variable is missing.");
      return NextResponse.json<GoogleReviewsResponse>({
        success: true,
        enabled: true,
        configured: false,
        rating: 0,
        totalReviews: 0,
        reviews: [],
        businessUrl,
        message: "Google Places API key is not configured",
      });
    }

    // 4. Fetch details from Google Places API
    const googleEndpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=name,rating,user_ratings_total,reviews,url&key=${encodeURIComponent(apiKey.trim())}`;

    const googleRes = await fetch(googleEndpoint, {
      next: { revalidate: 3600 }, // Cache response for 1 hour to respect API quotas
    });

    if (!googleRes.ok) {
      console.error("Google Places API HTTP error:", googleRes.status, googleRes.statusText);
      return NextResponse.json<GoogleReviewsResponse>({
        success: false,
        enabled: true,
        rating: 0,
        totalReviews: 0,
        reviews: [],
        businessUrl,
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
        rating: 0,
        totalReviews: 0,
        reviews: [],
        businessUrl,
        message: "Google reviews are temporarily unavailable",
      });
    }

    const result = data.result;
    const rating = typeof result.rating === "number" ? result.rating : 0;
    const totalReviews = typeof result.user_ratings_total === "number" ? result.user_ratings_total : 0;
    const resolvedBusinessUrl =
      businessUrl ||
      result.url ||
      `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${encodeURIComponent(
        placeId
      )}`;

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
      rating,
      totalReviews,
      reviews: normalizedReviews,
      businessUrl: resolvedBusinessUrl,
    });
  } catch (error) {
    console.error("GET /api/google-reviews internal error:", error);
    return NextResponse.json<GoogleReviewsResponse>(
      {
        success: false,
        enabled: true,
        rating: 0,
        totalReviews: 0,
        reviews: [],
        businessUrl: "",
        message: "Google reviews are temporarily unavailable",
      },
      { status: 200 } // Return 200 with error message so client UI handles gracefully
    );
  }
}
