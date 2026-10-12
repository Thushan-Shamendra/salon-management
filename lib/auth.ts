import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import User, { IUser } from "@/models/User";

export async function getCurrentUser(): Promise<IUser | null> {
  if (
    process.env.NODE_ENV !== "production" &&
    (global as unknown as { __TEST_AUTH_USER__?: IUser }).__TEST_AUTH_USER__
  ) {
    return (global as unknown as { __TEST_AUTH_USER__?: IUser }).__TEST_AUTH_USER__ as IUser;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);

    await connectDB();

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}