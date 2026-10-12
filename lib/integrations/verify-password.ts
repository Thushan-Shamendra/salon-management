import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";

/**
 * Validates the current admin user's password.
 * Returns true if valid, false otherwise.
 */
export async function verifyAdminPassword(
  userId: string,
  candidatePassword?: string
): Promise<boolean> {
  if (!candidatePassword || typeof candidatePassword !== "string") {
    return false;
  }

  await connectDB();
  const user = await User.findById(userId);
  if (!user || !user.password) {
    return false;
  }

  return await bcrypt.compare(candidatePassword, user.password);
}
