import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

for (const file of [".env.local", ".env"]) {
  const envPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex !== -1) {
          const key = trimmed.slice(0, eqIndex).trim();
          let value = trimmed.slice(eqIndex + 1).trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          if (key && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

async function resetAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@salon.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "TemporaryPass123!";
  const adminName = process.env.ADMIN_NAME || "Salon Administrator";
  const adminPhone = process.env.ADMIN_PHONE || "0770000000";

  if (!mongoUri) {
    console.error("Error: MONGODB_URI not found");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const usersCollection = mongoose.connection.db.collection("users");

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await usersCollection.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: hashedPassword,
        role: "admin",
        isActive: true,
        mustChangePassword: true,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        profileImage: "",
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log(`Admin account [${adminEmail}] successfully reset to initial password.`);
  console.log(`mustChangePassword set to: true`);

  await mongoose.disconnect();
}

resetAdmin().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
