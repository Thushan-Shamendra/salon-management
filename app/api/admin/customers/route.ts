import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// GET /api/admin/customers - ADMIN ONLY: list real MongoDB customer records
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access forbidden. Admin role required." },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";

    // Build query filter
    const filter: Record<string, unknown> = {
      role: "customer",
    };

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "disabled") {
      filter.isActive = false;
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const customers = await User.find(filter)
      .select("-password") // STRICT: Never expose password or password hash
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      customers: customers.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        phone: c.phone || "",
        role: c.role,
        isActive: c.isActive,
        profileImage: c.profileImage || "",
        createdAt: c.createdAt,
      })),
      total: customers.length,
    });
  } catch (error) {
    console.error("Admin customers list error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load customers" },
      { status: 500 }
    );
  }
}
