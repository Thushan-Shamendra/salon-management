import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// 1. Ensure environment variables from .env.local or .env are loaded if not already present
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

async function seedAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("Error: MONGODB_URI is not set in environment or .env.local");
    process.exit(1);
  }

  const adminName = process.env.ADMIN_NAME;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPhone = process.env.ADMIN_PHONE;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;

  // Validate all required bootstrap environment variables
  if (!adminName || !adminEmail || !adminPhone || !adminPassword) {
    console.error(
      "Error: Missing required admin configuration. Ensure ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, and ADMIN_INITIAL_PASSWORD are defined."
    );
    process.exit(1);
  }

  const normalizedEmail = adminEmail.toLowerCase().trim();

  try {
    await mongoose.connect(mongoUri);

    const usersCollection = mongoose.connection.db.collection("users");

    // Check whether an admin already exists with this email or any admin account exists
    const existingAdminByEmail = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (existingAdminByEmail) {
      console.log("Admin account already exists.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Check whether any active admin already exists in the system
    const anyAdmin = await usersCollection.findOne({ role: "admin" });
    if (anyAdmin) {
      console.log("Admin account already exists.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash the initial temporary password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create the initial admin user with mustChangePassword: true
    await usersCollection.insertOne({
      name: adminName.trim(),
      email: normalizedEmail,
      phone: adminPhone.trim(),
      password: hashedPassword,
      role: "admin",
      isActive: true,
      mustChangePassword: true,
      profileImage: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Never print the password or password hash to the terminal
    console.log("Initial admin account created successfully.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin account:", error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

seedAdmin();
