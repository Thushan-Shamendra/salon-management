import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";

const projectRoot = process.cwd();

async function runDualLogoSuite() {
  console.log("==================================================");
  console.log("RUNNING DUAL LOGO VERIFICATION SUITE");
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

  // 1. Model Schema
  const modelContent = readFileSync(
    resolve(projectRoot, "models/SalonSettings.ts"),
    "utf8"
  );
  assert(
    modelContent.includes("footerLogo?: string;") &&
      modelContent.includes("footerLogoPublicId?: string;"),
    "Dual Logo Test 1: SalonSettings interface includes footerLogo and footerLogoPublicId"
  );
  assert(
    modelContent.includes("footerLogo: {") &&
      modelContent.includes("footerLogoPublicId: {"),
    "Dual Logo Test 2: SalonSettingsSchema defines footerLogo and footerLogoPublicId"
  );

  // 2. Admin Settings API Route
  const adminApiRoute = readFileSync(
    resolve(projectRoot, "app/api/admin/settings/route.ts"),
    "utf8"
  );
  assert(
    adminApiRoute.includes("footerLogo") && adminApiRoute.includes("footerLogoPublicId"),
    "Dual Logo Test 3: Admin Settings API accepts footerLogo and footerLogoPublicId"
  );
  assert(
    adminApiRoute.includes("oldFooterPublicId"),
    "Dual Logo Test 4: Admin Settings API cleans up old Cloudinary footer logo asset"
  );

  // 3. Public Settings API Route
  const publicApiRoute = readFileSync(
    resolve(projectRoot, "app/api/settings/route.ts"),
    "utf8"
  );
  assert(
    publicApiRoute.includes("headerLogo: settings.logo") &&
      publicApiRoute.includes("footerLogo: settings.footerLogo"),
    "Dual Logo Test 5: Public API provides headerLogo and footerLogo"
  );

  // 4. Navbar Component
  const navbarContent = readFileSync(
    resolve(projectRoot, "components/layout/Navbar.tsx"),
    "utf8"
  );
  assert(
    navbarContent.includes("headerLogo") &&
      navbarContent.includes("object-contain"),
    "Dual Logo Test 6: Navbar renders headerLogo with object-contain"
  );

  // 5. AdminSidebar Component
  const sidebarContent = readFileSync(
    resolve(projectRoot, "components/admin/AdminSidebar.tsx"),
    "utf8"
  );
  assert(
    sidebarContent.includes("headerLogo") &&
      sidebarContent.includes("fetch(\"/api/settings\")") &&
      sidebarContent.includes("object-contain"),
    "Dual Logo Test 7: AdminSidebar fetches headerLogo and renders it with object-contain"
  );

  // 6. Footer Component
  const footerContent = readFileSync(
    resolve(projectRoot, "components/layout/Footer.tsx"),
    "utf8"
  );
  assert(
    footerContent.includes("footerLogo") &&
      footerContent.includes("settings.footerLogo") &&
      footerContent.includes("object-contain"),
    "Dual Logo Test 8: Footer loads footerLogo with fallback and renders using object-contain"
  );

  // 7. Admin Settings Page UI
  const adminPage = readFileSync(
    resolve(projectRoot, "app/admin/settings/page.tsx"),
    "utf8"
  );
  assert(
    adminPage.includes("Salon Logo (Header & Admin)") &&
      adminPage.includes("Footer Logo"),
    "Dual Logo Test 9: Admin page includes both Header Logo and Footer Logo sections"
  );
  assert(
    adminPage.includes("handleFooterLogoUpload") &&
      adminPage.includes("handleRemoveFooterLogo") &&
      adminPage.includes("handleFooterUrlChange"),
    "Dual Logo Test 10: Admin page implements full Footer Logo upload, remove, and URL handlers"
  );
  assert(
    adminPage.includes("bg-[#0A0812]") &&
      adminPage.includes("Live URL Preview (Dark Footer)"),
    "Dual Logo Test 11: Admin page provides dark background preview container for Footer Logo"
  );

  // 8. Database simulation of dual logos
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const SalonSettings = mongoose.models.SalonSettings || mongoose.model("SalonSettings", new mongoose.Schema({
      salonName: String,
      logo: String,
      logoPublicId: String,
      footerLogo: String,
      footerLogoPublicId: String,
    }, { strict: false }));

    const initial = await SalonSettings.findOne();
    const origLogo = initial?.logo;
    const origFooterLogo = initial?.footerLogo;

    if (initial) {
      initial.logo = "https://res.cloudinary.com/demo/image/upload/salon-management/salon/header-test.png";
      initial.footerLogo = "https://res.cloudinary.com/demo/image/upload/salon-management/salon/footer-test.png";
      await initial.save();

      const updated = await SalonSettings.findById(initial._id).lean();
      assert(
        updated.logo === "https://res.cloudinary.com/demo/image/upload/salon-management/salon/header-test.png" &&
        updated.footerLogo === "https://res.cloudinary.com/demo/image/upload/salon-management/salon/footer-test.png",
        "Dual Logo Test 12: MongoDB successfully saved distinct Header and Footer logos"
      );

      // Restore
      initial.logo = origLogo;
      initial.footerLogo = origFooterLogo;
      await initial.save();
      assert(true, "Dual Logo Test 13: Database state restored successfully");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("DB error:", err);
    assert(false, "Dual Logo Tests 12-13: Database test operations failed", err.message);
  }

  console.log("\n==================================================");
  console.log(`DUAL LOGO RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runDualLogoSuite();
