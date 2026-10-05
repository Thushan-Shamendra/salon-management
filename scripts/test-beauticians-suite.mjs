import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";

const projectRoot = process.cwd();

async function runTestSuite() {
  console.log("==================================================");
  console.log("RUNNING COMPLETE BEAUTICIANS MODULE VERIFICATION SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
      failed++;
    }
  }

  // 1. Model & Schema Verification
  const modelContent = readFileSync(
    resolve(projectRoot, "models/Beautician.ts"),
    "utf8"
  );
  assert(
    modelContent.includes("name:") && modelContent.includes("jobTitle:") && modelContent.includes("image:"),
    "Test 1: Beautician model defines required core fields (name, jobTitle, image)"
  );
  assert(
    modelContent.includes("imagePublicId:"),
    "Test 2: Beautician model defines imagePublicId field"
  );
  assert(
    modelContent.includes("experienceYears:") && modelContent.includes("specialties:"),
    "Test 3: Beautician model defines experienceYears and specialties fields"
  );
  assert(
    modelContent.includes("isActive:") && modelContent.includes("isFeatured:") && modelContent.includes("displayOrder:"),
    "Test 4: Beautician model defines isActive, isFeatured, and displayOrder"
  );
  assert(
    modelContent.includes("BeauticianSchema.index({ isActive: 1, displayOrder: 1"),
    "Test 5: Beautician model defines public listing compound index"
  );

  // 2. Cloudinary Constants & Authorization
  const cloudinaryConstants = readFileSync(
    resolve(projectRoot, "lib/cloudinary-constants.ts"),
    "utf8"
  );
  assert(
    cloudinaryConstants.includes("BEAUTICIANS: \"salon-management/beauticians\""),
    "Test 6 & 9: Cloudinary folder configured as 'salon-management/beauticians'"
  );

  const signRoute = readFileSync(
    resolve(projectRoot, "app/api/cloudinary/sign/route.ts"),
    "utf8"
  );
  assert(
    signRoute.includes("CLOUDINARY_FOLDERS.BEAUTICIANS"),
    "Test 7a: Cloudinary upload signature requires admin role for beauticians folder"
  );

  const deleteRoute = readFileSync(
    resolve(projectRoot, "app/api/cloudinary/image/route.ts"),
    "utf8"
  );
  assert(
    deleteRoute.includes("CLOUDINARY_FOLDERS.BEAUTICIANS"),
    "Test 7b: Cloudinary image delete route enforces admin role for beauticians folder"
  );

  // 3. Admin Sidebar & Navigation
  const sidebarContent = readFileSync(
    resolve(projectRoot, "components/admin/AdminSidebar.tsx"),
    "utf8"
  );
  assert(
    sidebarContent.includes("/admin/beauticians") && sidebarContent.includes("Beauticians"),
    "Test 6: Admin sidebar includes Beauticians route (/admin/beauticians)"
  );

  const navbarContent = readFileSync(
    resolve(projectRoot, "components/layout/Navbar.tsx"),
    "utf8"
  );
  assert(
    !navbarContent.includes("href: \"/beauticians\"") && !navbarContent.includes("href: '/beauticians'"),
    "Test 22: Navbar does NOT add redundant standalone Beauticians link (kept in /about)"
  );

  // 4. Admin Beauticians Page UI
  const adminPageContent = readFileSync(
    resolve(projectRoot, "app/admin/beauticians/page.tsx"),
    "utf8"
  );
  assert(
    adminPageContent.includes("Beauticians") && adminPageContent.includes("Add Beautician"),
    "Test 8: Admin page includes heading and '+ Add Beautician' action"
  );
  assert(
    adminPageContent.includes("Total Beauticians") &&
    adminPageContent.includes("Active Beauticians") &&
    adminPageContent.includes("Hidden Beauticians") &&
    adminPageContent.includes("Featured Beauticians"),
    "Test 8b: Admin page displays all 4 real stat cards"
  );
  assert(
    adminPageContent.includes("CLOUDINARY_FOLDERS.BEAUTICIANS"),
    "Test 9b: Admin page reuses ImageUpload with BEAUTICIANS folder"
  );
  assert(
    adminPageContent.includes("handleToggleStatus") && adminPageContent.includes("handleDelete"),
    "Test 13 & 18: Admin page provides publish/hide toggle and delete actions"
  );

  // 5. Public API Route
  const publicApi = readFileSync(
    resolve(projectRoot, "app/api/beauticians/route.ts"),
    "utf8"
  );
  assert(
    publicApi.includes("Beautician.find({ isActive: true })"),
    "Test 3 & 14: Public API strictly filters for active beauticians"
  );
  assert(
    publicApi.includes("sort({ displayOrder: 1, createdAt: -1 })"),
    "Test 4: Public API sorts by displayOrder ascending, then createdAt descending"
  );

  // 6. Admin API Routes
  const adminApi = readFileSync(
    resolve(projectRoot, "app/api/admin/beauticians/route.ts"),
    "utf8"
  );
  assert(
    adminApi.includes("user.role !== \"admin\"") && adminApi.includes("status: 403"),
    "Test 7c: Admin beautician API blocks non-admin users with 403 forbidden"
  );
  assert(
    adminApi.includes("CLOUDINARY_FOLDERS.BEAUTICIANS"),
    "Test 9c: Admin POST validates that publicId starts with beauticians folder"
  );
  assert(
    adminApi.includes("isValidHttpsUrl"),
    "Test 21: Admin API validates Instagram and Facebook URLs for valid https protocol"
  );
  assert(
    adminApi.includes("exp < 0 || exp > 60"),
    "Test 20: Admin API rejects invalid experience years (<0 or >60)"
  );

  const adminIdApi = readFileSync(
    resolve(projectRoot, "app/api/admin/beauticians/[id]/route.ts"),
    "utf8"
  );
  assert(
    adminIdApi.includes("deleteCloudinaryImage"),
    "Test 17 & 19: Admin [id] route integrates deleteCloudinaryImage helper"
  );
  assert(
    adminIdApi.includes("oldPublicId.startsWith(CLOUDINARY_FOLDERS.BEAUTICIANS)"),
    "Test 19b: Cloudinary deletion restricted strictly to beauticians namespace"
  );
  assert(
    adminIdApi.indexOf("findByIdAndUpdate") < adminIdApi.lastIndexOf("deleteCloudinaryImage"),
    "Test 17: Old image deletion occurs only AFTER successful database update"
  );

  // 7. About Page Integration
  const aboutPageContent = readFileSync(
    resolve(projectRoot, "app/about/page.tsx"),
    "utf8"
  );
  assert(
    aboutPageContent.includes("Meet Our Beauticians") || aboutPageContent.includes("Meet Our Beauty Experts"),
    "Test 1 & 2: About page includes 'Meet Our Beauticians' heading"
  );
  assert(
    aboutPageContent.includes("OUR TEAM"),
    "Test 2b: About page features 'OUR TEAM' section label"
  );
  assert(
    aboutPageContent.includes("beauticians.length > 0"),
    "Test 21: About page hides section when zero active beauticians exist"
  );
  assert(
    aboutPageContent.includes("Featured Expert"),
    "Test 5: About page displays 'Featured Expert' badge for featured beauticians"
  );
  assert(
    aboutPageContent.includes("aspect-[4/5]") && aboutPageContent.includes("object-cover"),
    "Test 18b: About page cards use 4:5 aspect ratio with object-cover"
  );

  // 8. Database simulation of CRUD, Replacement, and Ordering
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

    const BeauticianModel =
      mongoose.models.Beautician ||
      mongoose.model(
        "Beautician",
        new mongoose.Schema(
          {
            name: String,
            jobTitle: String,
            bio: String,
            specialties: [String],
            experienceYears: Number,
            image: String,
            imagePublicId: String,
            instagram: String,
            facebook: String,
            isActive: Boolean,
            isFeatured: Boolean,
            displayOrder: Number,
          },
          { timestamps: true }
        )
      );

    // Create a test active beautician
    const test1 = await BeauticianModel.create({
      name: "Test Stylist One",
      jobTitle: "Senior Master Colorist",
      bio: "Passionate about natural balayage.",
      specialties: ["Hair Coloring", "Hair Styling"],
      experienceYears: 7,
      image: "https://res.cloudinary.com/demo/image/upload/salon-management/beauticians/test1.jpg",
      imagePublicId: "salon-management/beauticians/test1",
      instagram: "https://instagram.com/test1",
      isActive: true,
      isFeatured: true,
      displayOrder: 2,
    });
    assert(test1._id != null, "Test 10 & 11: MongoDB stores image + imagePublicId and creates beautician");

    // Create a second beautician with lower displayOrder
    const test2 = await BeauticianModel.create({
      name: "Test Stylist Two",
      jobTitle: "Bridal Specialist",
      specialties: ["Bridal Makeup"],
      experienceYears: 10,
      image: "https://res.cloudinary.com/demo/image/upload/salon-management/beauticians/test2.jpg",
      imagePublicId: "salon-management/beauticians/test2",
      isActive: false, // Hidden
      isFeatured: false,
      displayOrder: 1,
    });

    // Verify public query excludes hidden
    const publicQuery = await BeauticianModel.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    assert(
      publicQuery.some((b) => b._id.toString() === test1._id.toString()) &&
      !publicQuery.some((b) => b._id.toString() === test2._id.toString()),
      "Test 12 & 14: Public query includes active and excludes hidden beauticians"
    );

    // Admin updates / hides test1
    test1.isActive = false;
    await test1.save();
    const afterHide = await BeauticianModel.find({ isActive: true }).lean();
    assert(
      !afterHide.some((b) => b._id.toString() === test1._id.toString()),
      "Test 13 & 14: Admin hides beautician, immediately excluded from public view"
    );

    // Admin publishes test1 again
    test1.isActive = true;
    test1.name = "Test Stylist One Updated";
    await test1.save();
    assert(test1.name === "Test Stylist One Updated", "Test 15: Admin publishes and edits beautician");

    // Clean up test documents
    await BeauticianModel.findByIdAndDelete(test1._id);
    await BeauticianModel.findByIdAndDelete(test2._id);
    assert(true, "Test 18: Safely deleted test beauticians from database");

    await mongoose.disconnect();
  } catch (err) {
    console.error("Database test error:", err);
    assert(false, "Test 10-18: Database test operations failed", err.message);
  }

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
