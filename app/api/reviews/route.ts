import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Public approved salon reviews
const APPROVED_REVIEWS = [
  {
    id: "rev-1",
    author: "Kavindi Wickramasinghe",
    rating: 5,
    service: "Keratin Treatment & Cut",
    date: "March 2026",
    comment:
      "The best salon experience in Colombo hands down. My stylist took the time to assess my hair texture before recommending a tailored treatment. My hair has never felt so silky and manageable!",
  },
  {
    id: "rev-2",
    author: "Roshini Senanayake",
    rating: 5,
    service: "Hydra Glow Facial",
    date: "February 2026",
    comment:
      "Such a calming oasis. The private aesthetic suites and gentle facial techniques made my skin radiate instantly for my sister's engagement. Truly personalized and hygienic care.",
  },
  {
    id: "rev-3",
    author: "Tariq Mansoor",
    rating: 5,
    service: "Executive Haircut & Scalp Spa",
    date: "March 2026",
    comment:
      "Precision haircut and an exceptionally relaxing scalp therapy. Professional hospitality from the moment you step through the doors. The online booking process was super smooth.",
  },
  {
    id: "rev-4",
    author: "Shenali Perera",
    rating: 5,
    service: "Honey Balayage & Gloss",
    date: "March 2026",
    comment:
      "Transformed my dark hair into a vibrant warm dimensional balayage with zero breakage. The attention to detail was exceptional.",
  },
];

// GET /api/reviews - PUBLIC: anyone can read approved reviews
export async function GET() {
  return NextResponse.json({
    success: true,
    averageRating: 4.9,
    totalReviews: 320,
    reviews: APPROVED_REVIEWS,
  });
}

// POST /api/reviews - PROTECTED: requires authenticated customer session
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rating, comment, service } = body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return NextResponse.json(
        {
          success: false,
          message: "A rating between 1 and 5 stars is required",
        },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string" || comment.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Please write a review comment (minimum 5 characters)",
        },
        { status: 400 }
      );
    }

    const newReview = {
      id: `rev-${Date.now()}`,
      author: user.name,
      rating: Number(rating),
      service: service?.trim() || "Salon Service",
      comment: comment.trim(),
      date: "Just now",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your review has been submitted for approval.",
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit review",
      },
      { status: 500 }
    );
  }
}
