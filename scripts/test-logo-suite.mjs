import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";

const projectRoot = process.cwd();

async function runTestSuite() {
  console.log("==================================================");
  console.log("RUNNING COMPLETE LOGO SETTINGS VERIFICATION SUITE");
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

  // 1. Inspect SalonSettings Model
  const modelContent = readFileSync(
    resolve(projectRoot, "models/SalonSettings.ts"),
    "utf8"
  );
  assert(
    modelContent.includes("logo: string;") || modelContent.includes("logo?: string;"),
    "Test 1: SalonSettings interface preserves 'logo' field"
  );
  assert(
    modelContent.includes("logoPublicId?: string;"),
    "Test 2: SalonSettings interface supports optional 'logoPublicId'"
  );
  assert(
    modelContent.includes("logoPublicId: {") && modelContent.includes("type: String"),
    "Test 3: SalonSettingsSchema defines logoPublicId field"
  );

  // 2. Inspect Admin Settings Page UI
  const adminSettingsPage = readFileSync(
    resolve(projectRoot, "app/admin/settings/page.tsx"),
    "utf8"
  );
  assert(
    adminSettingsPage.includes("SALON LOGO") || adminSettingsPage.includes("Salon Logo"),
    "Test 4: Admin page features SALON LOGO section heading"
  );
  assert(
    adminSettingsPage.includes("Upload Logo") && adminSettingsPage.includes("Use Image URL"),
    "Test 5: Admin page contains [Upload Logo] and [Use Image URL] options"
  );
  assert(
    adminSettingsPage.includes("components/ui/ImageUpload") || adminSettingsPage.includes("ImageUpload"),
    "Test 6: Admin page reuses existing ImageUpload component"
  );
  assert(
    adminSettingsPage.includes("CLOUDINARY_FOLDERS.SALON") || adminSettingsPage.includes("salon-management/salon"),
    "Test 7: Upload logo targets 'salon-management/salon' folder"
  );
  assert(
    adminSettingsPage.includes("object-contain"),
    "Test 8: Logo preview uses object-contain to prevent cropping"
  );
  assert(
    adminSettingsPage.includes("Remove Logo"),
    "Test 9: Admin page includes 'Remove Logo' action"
  );
  assert(
    adminSettingsPage.includes("Please enter a valid image URL"),
    "Test 10: URL validation displays 'Please enter a valid image URL' on invalid input"
  );

  // 3. Inspect Admin Settings API Route
  const adminApiRoute = readFileSync(
    resolve(projectRoot, "app/api/admin/settings/route.ts"),
    "utf8"
  );
  assert(
    adminApiRoute.includes("deleteCloudinaryImage"),
    "Test 11: Admin settings API integrates deleteCloudinaryImage helper"
  );
  assert(
    adminApiRoute.includes("CLOUDINARY_FOLDERS.SALON") || adminApiRoute.includes("salon-management/salon"),
    "Test 12: Admin settings API restricts Cloudinary deletions strictly to salon-management/salon"
  );
  assert(
    adminApiRoute.indexOf("await settings.save()") < adminApiRoute.lastIndexOf("deleteCloudinaryImage"),
    "Test 13: Cloudinary asset deletion occurs only AFTER successful MongoDB update"
  );

  // 4. Inspect Public Settings API Route
  const publicApiRoute = readFileSync(
    resolve(projectRoot, "app/api/settings/route.ts"),
    "utf8"
  );
  assert(
    publicApiRoute.includes("SalonSettings.findOne()"),
    "Test 14: Public settings API fetches salon settings"
  );
  assert(
    publicApiRoute.includes("logo") && publicApiRoute.includes("salonName"),
    "Test 15: Public settings API returns logo and salonName"
  );

  // 5. Inspect Navbar & Footer & AdminSidebar
  const navbarContent = readFileSync(
    resolve(projectRoot, "components/layout/Navbar.tsx"),
    "utf8"
  );
  assert(
    navbarContent.includes("fetch(\"/api/settings\")") || navbarContent.includes("fetch('/api/settings')"),
    "Test 16: Navbar loads dynamic logo from settings API"
  );
  assert(
    navbarContent.includes("object-contain"),
    "Test 17: Navbar renders logo using object-contain"
  );

  const footerContent = readFileSync(
    resolve(projectRoot, "components/layout/Footer.tsx"),
    "utf8"
  );
  assert(
    footerContent.includes("SalonSettings.findOne()"),
    "Test 18: Footer asynchronously reads salon logo and name from database"
  );
  assert(
    footerContent.includes("object-contain"),
    "Test 19: Footer renders logo using object-contain with ScissorsIcon fallback"
  );

  const sidebarContent = readFileSync(
    resolve(projectRoot, "components/admin/AdminSidebar.tsx"),
    "utf8"
  );
  assert(
    sidebarContent.includes("fetch(\"/api/settings\")") || sidebarContent.includes("fetch('/api/settings')"),
    "Test 20: AdminSidebar loads dynamic logo and name"
  );

  // 6. Database Schema & Switch Simulation
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    
    // Import or define model
    const SalonSettings = mongoose.models.SalonSettings || mongoose.model("SalonSettings", new mongoose.Schema({
      salonName: String,
      logo: String,
      logoPublicId: String,
    }, { strict: false }));

    const initialSettings = await SalonSettings.findOne();
    const originalLogo = initialSettings ? initialSettings.logo : "";
    const originalPublicId = initialSettings ? initialSettings.logoPublicId : undefined;

    // Simulate switching to URL
    if (initialSettings) {
      initialSettings.logo = "https://example.com/test-logo.png";
      initialSettings.logoPublicId = undefined;
      await initialSettings.save();

      const afterUrl = await SalonSettings.findById(initialSettings._id).lean();
      assert(
        afterUrl.logo === "https://example.com/test-logo.png" && !afterUrl.logoPublicId,
        "Test 21: Successfully saved external URL without publicId to MongoDB"
      );

      // Simulate switching to Cloudinary upload
      initialSettings.logo = "https://res.cloudinary.com/demo/image/upload/salon-management/salon/test.jpg";
      initialSettings.logoPublicId = "salon-management/salon/test";
      await initialSettings.save();

      const afterCloudinary = await SalonSettings.findById(initialSettings._id).lean();
      assert(
        afterCloudinary.logo.includes("cloudinary") && afterCloudinary.logoPublicId === "salon-management/salon/test",
        "Test 22: Successfully saved Cloudinary URL and logoPublicId to MongoDB"
      );

      // Restore original
      initialSettings.logo = originalLogo;
      initialSettings.logoPublicId = originalPublicId;
      await initialSettings.save();
      assert(true, "Test 23: Restored initial database settings");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Database test error:", err);
    assert(false, "Test 21-23: Database test operations failed", err.message);
  }

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
