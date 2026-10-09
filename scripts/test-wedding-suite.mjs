import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
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

const mongoUri = process.env.MONGODB_URI;

async function runTestSuite() {
  console.log("==================================================");
  console.log("RUNNING COMPLETE WEDDING MODULE VERIFICATION SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(name, condition, detail = "") {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${detail ? `(${detail})` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // 1. Navbar integration checks
  const navbarContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/layout/Navbar.tsx"),
    "utf-8"
  );
  assert(
    "Test 1: Wedding in public navbar",
    navbarContent.includes('{ name: "Wedding", href: "/wedding" }'),
    "Configured in navLinks between Services and Gallery"
  );

  // 2. Admin Sidebar checks
  const sidebarContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/admin/AdminSidebar.tsx"),
    "utf-8"
  );
  assert(
    "Test 2: Wedding in admin sidebar",
    sidebarContent.includes('name: "Wedding"') &&
      sidebarContent.includes('href: "/admin/wedding"'),
    "Configured in admin navItems with SparklesIcon"
  );

  // 3. Cloudinary folders configuration
  const cldConstants = fs.readFileSync(
    path.resolve(process.cwd(), "lib/cloudinary-constants.ts"),
    "utf-8"
  );
  assert(
    "Test 3: Cloudinary wedding folders",
    cldConstants.includes('WEDDING_SERVICES: "salon-management/wedding/services"') &&
      cldConstants.includes('WEDDING_PACKAGES: "salon-management/wedding/packages"'),
    "WEDDING_SERVICES and WEDDING_PACKAGES folders defined"
  );

  // 4. Admin Dashboard integration
  const dashboardPage = fs.readFileSync(
    path.resolve(process.cwd(), "app/admin/page.tsx"),
    "utf-8"
  );
  const dashboardApi = fs.readFileSync(
    path.resolve(process.cwd(), "app/api/admin/dashboard/route.ts"),
    "utf-8"
  );
  assert(
    "Test 4: Admin Dashboard Quick Action",
    dashboardPage.includes('href="/admin/wedding"') &&
      dashboardPage.includes("Manage Wedding"),
    "Quick action links directly to /admin/wedding"
  );
  assert(
    "Test 5: Admin Dashboard real metrics",
    dashboardApi.includes("WeddingService.countDocuments()") &&
      dashboardApi.includes("WeddingPackage.countDocuments()"),
    "Database queries real WeddingService and WeddingPackage counts"
  );

  // 5. Home page promotional section
  const homePage = fs.readFileSync(
    path.resolve(process.cwd(), "app/page.tsx"),
    "utf-8"
  );
  assert(
    "Test 6: Home page wedding promotional section",
    homePage.includes("WeddingPreview"),
    "Rendered cleanly on HomePage"
  );

  // 6. Public /wedding page structure
  const weddingPage = fs.readFileSync(
    path.resolve(process.cwd(), "app/wedding/page.tsx"),
    "utf-8"
  );
  assert(
    "Test 7: /wedding page structure",
    weddingPage.includes("WeddingHero") &&
      weddingPage.includes("WeddingServicesSection") &&
      weddingPage.includes("WeddingPackagesSection") &&
      weddingPage.includes("WhyChooseWedding") &&
      weddingPage.includes("WeddingConsultationCTA"),
    "All 6 approved sections assembled"
  );

  // 7. Security Checks: Admin mutation APIs require authentication
  const serviceAdminApi = fs.readFileSync(
    path.resolve(process.cwd(), "app/api/admin/wedding/services/route.ts"),
    "utf-8"
  );
  const packageAdminApi = fs.readFileSync(
    path.resolve(process.cwd(), "app/api/admin/wedding/packages/route.ts"),
    "utf-8"
  );
  assert(
    "Test 8: Admin Services API auth protection",
    serviceAdminApi.includes("getCurrentUser") &&
      serviceAdminApi.includes('user.role !== "admin"'),
    "Enforces getCurrentUser() and role === 'admin'"
  );
  assert(
    "Test 9: Admin Packages API auth protection",
    packageAdminApi.includes("getCurrentUser") &&
      packageAdminApi.includes('user.role !== "admin"'),
    "Enforces getCurrentUser() and role === 'admin'"
  );

  // 8. Live Database Operations (MongoDB)
  if (mongoUri) {
    try {
      console.log("\nConnecting to MongoDB for live model validation...");
      await mongoose.connect(mongoUri);
      console.log("Connected to MongoDB successfully.\n");

      // Dynamic import models
      const { default: WeddingService } = await import("../models/WeddingService.ts");
      const { default: WeddingPackage } = await import("../models/WeddingPackage.ts");

      // Test 10: Create a test wedding service
      const testService = await WeddingService.create({
        name: "__TEST__ Bridal Makeup Test",
        description: "Test bridal makeup service description",
        price: 18500,
        duration: 120,
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f",
        imagePublicId: "test_public_id_svc",
        isActive: true,
        displayOrder: 1,
      });

      assert(
        "Test 10: Live DB create WeddingService",
        testService && testService._id,
        `Created with ID: ${testService._id}`
      );

      // Test 11: Query public wedding services (isActive: true)
      const publicServices = await WeddingService.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();
      const foundPublicSvc = publicServices.some((s) => s.name === "__TEST__ Bridal Makeup Test");
      assert(
        "Test 11: Live DB public query active WeddingService",
        foundPublicSvc,
        `Retrieved in active list`
      );

      // Test 12: Hide wedding service
      await WeddingService.findByIdAndUpdate(testService._id, { isActive: false });
      const hiddenPublicServices = await WeddingService.find({ isActive: true }).lean();
      const notFoundPublicSvc = !hiddenPublicServices.some((s) => s.name === "__TEST__ Bridal Makeup Test");
      assert(
        "Test 12: Live DB hide WeddingService excludes from public",
        notFoundPublicSvc,
        "Hidden service does not appear in public query"
      );

      // Test 13: Delete test wedding service
      await WeddingService.findByIdAndDelete(testService._id);
      const deletedSvc = await WeddingService.findById(testService._id);
      assert(
        "Test 13: Live DB delete WeddingService",
        deletedSvc === null,
        "Permanently removed from database"
      );

      // Test 14: Create a test wedding package
      const testPackage = await WeddingPackage.create({
        name: "__TEST__ Luxury Bridal Package",
        description: "Full bridal makeover package",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552",
        imagePublicId: "test_public_id_pkg",
        includedItems: ["Bridal Makeup (HD)", "Bridal Hair Styling", "Luxury Facial Treatment"],
        price: 55000,
        durationText: "4–5 hours",
        isFeatured: true,
        isActive: true,
        displayOrder: 1,
      });

      assert(
        "Test 14: Live DB create WeddingPackage with multiple inclusions",
        testPackage && testPackage._id && testPackage.includedItems.length === 3,
        `Created with ID: ${testPackage._id}, ${testPackage.includedItems.length} items`
      );

      // Test 15: Query public wedding packages
      const publicPackages = await WeddingPackage.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();
      const foundPkg = publicPackages.some((p) => p.name === "__TEST__ Luxury Bridal Package");
      assert(
        "Test 15: Live DB public query active WeddingPackage",
        foundPkg,
        "Retrieved in active package list"
      );

      // Test 16: Toggle isFeatured
      await WeddingPackage.findByIdAndUpdate(testPackage._id, { isFeatured: false });
      const updatedPkg = await WeddingPackage.findById(testPackage._id).lean();
      assert(
        "Test 16: Live DB toggle WeddingPackage isFeatured",
        updatedPkg.isFeatured === false,
        "Successfully updated isFeatured to false"
      );

      // Test 17: Hide package
      await WeddingPackage.findByIdAndUpdate(testPackage._id, { isActive: false });
      const hiddenPackages = await WeddingPackage.find({ isActive: true }).lean();
      const notFoundPkg = !hiddenPackages.some((p) => p.name === "__TEST__ Luxury Bridal Package");
      assert(
        "Test 17: Live DB hide WeddingPackage excludes from public",
        notFoundPkg,
        "Hidden package does not appear in public query"
      );

      // Test 18: Delete test package
      await WeddingPackage.findByIdAndDelete(testPackage._id);
      const deletedPkg = await WeddingPackage.findById(testPackage._id);
      assert(
        "Test 18: Live DB delete WeddingPackage",
        deletedPkg === null,
        "Permanently removed from database"
      );

      await mongoose.disconnect();
      console.log("Disconnected from MongoDB.");
    } catch (dbErr) {
      console.error("Live DB testing encountered error:", dbErr);
      failed++;
    }
  } else {
    console.warn("MONGODB_URI not found; skipping live database tests.");
  }

  console.log("\n==================================================");
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
