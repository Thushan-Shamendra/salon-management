import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// PATCH /api/admin/customers/[id] - ADMIN ONLY: update isActive status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Invalid isActive boolean flag" },
        { status: 400 }
      );
    }

    await connectDB();

    const customer = await User.findOne({ _id: id, role: "customer" });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    customer.isActive = isActive;
    await customer.save();

    return NextResponse.json({
      success: true,
      message: `Customer account ${isActive ? "enabled" : "disabled"} successfully`,
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        isActive: customer.isActive,
      },
    });
  } catch (error) {
    console.error("Admin customer update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update customer status" },
      { status: 500 }
    );
  }
}
