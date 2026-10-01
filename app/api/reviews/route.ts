import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Review from "@/models/Review";

const INITIAL_APPROVED_REVIEWS = [
  {
    author: "Kavindi Wickramasinghe",
    rating: 5,
    service: "Keratin Treatment & Cut",
    comment:
      "The best salon experience in Colombo hands down. My stylist took the time to assess my hair texture before recommending a tailored treatment. My hair has never felt so silky and manageable!",
    status: "approved" as const,
  },
  {
    author: "Roshini Senanayake",
    rating: 5,
    service: "Hydra Glow Facial",
    comment:
      "Such a calming oasis. The private aesthetic suites and gentle facial techniques made my skin radiate instantly for my sister's engagement. Truly personalized and hygienic care.",
    status: "approved" as const,
  },
  {
    author: "Tariq Mansoor",
    rating: 5,
    service: "Executive Haircut & Scalp Spa",
    comment:
      "Precision haircut and an exceptionally relaxing scalp therapy. Professional hospitality from the moment you step through the doors. The online booking process was super smooth.",
    status: "approved" as const,
  },
  {
    author: "Shenali Perera",
    rating: 5,
    service: "Honey Balayage & Gloss",
    comment:
      "Transformed my dark hair into a vibrant warm dimensional balayage with zero breakage. The attention to detail was exceptional.",
    status: "approved" as const,
  },
];

// Seed initial approved reviews if collection is completely empty
async function ensureSeededReviews() {
  const count = await Review.countDocuments();
  if (count === 0) {
    await Review.insertMany(INITIAL_APPROVED_REVIEWS);
  }
}

// GET /api/reviews - PUBLIC: anyone can read approved reviews
export async function GET() {
  try {
    await connectDB();
    await ensureSeededReviews();

    const reviews = await Review.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .lean();

    const total = reviews.length;
    const avg =
      total > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) / total
            ).toFixed(1)
          )
        : 5.0;

    return NextResponse.json({
      success: true,
      averageRating: avg,
      totalReviews: total,
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        author: r.author,
        rating: r.rating,
        service: r.service,
        comment: r.comment,
        status: r.status,
        date: new Date(r.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      })),
    });
  } catch (err) {
    console.error("GET /api/reviews error:", err);
    return NextResponse.json(
      { success: false, message: "Could not load approved reviews" },
      { status: 500 }
    );
  }
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

    await connectDB();
    await ensureSeededReviews();

    const newReview = await Review.create({
      author: user.name,
      rating: Number(rating),
      service: service?.trim() || "Salon Service",
      comment: comment.trim(),
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your review has been submitted for approval.",
        review: {
          id: newReview._id.toString(),
          author: newReview.author,
          rating: newReview.rating,
          service: newReview.service,
          comment: newReview.comment,
          status: newReview.status,
          date: "Just now",
        },
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
