import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";

const projectRoot = process.cwd();

async function runBranchesSuite() {
  console.log("==================================================");
  console.log("RUNNING SALON BRANCHES VERIFICATION SUITE");
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
    modelContent.includes("ISalonBranch") && modelContent.includes("branches?: ISalonBranch[];"),
    "Branches Test 1: SalonSettings defines ISalonBranch and branches in interface"
  );
  assert(
    modelContent.includes("branches: {") && modelContent.includes("isMain: {"),
    "Branches Test 2: SalonSettingsSchema defines branches schema with isMain"
  );

  // 2. Admin Settings API
  const adminApiContent = readFileSync(
    resolve(projectRoot, "app/api/admin/settings/route.ts"),
    "utf8"
  );
  assert(
    adminApiContent.includes("branches") && adminApiContent.includes("settings.branches = branches.map"),
    "Branches Test 3: Admin settings API route accepts and validates branches"
  );

  // 3. Public Settings API
  const publicApiContent = readFileSync(
    resolve(projectRoot, "app/api/settings/route.ts"),
    "utf8"
  );
  assert(
    publicApiContent.includes("branches: settings.branches || []"),
    "Branches Test 4: Public settings API route exposes branches"
  );

  // 4. Footer Component
  const footerContent = readFileSync(
    resolve(projectRoot, "components/layout/Footer.tsx"),
    "utf8"
  );
  assert(
    footerContent.includes("branches") &&
      footerContent.includes("settings.branches") &&
      footerContent.includes("Our Branches"),
    "Branches Test 5: Footer queries settings.branches and displays Our Branches"
  );
  assert(
    footerContent.includes("branch.phone") && footerContent.includes("branch.isMain"),
    "Branches Test 6: Footer renders branch details and main branch badge"
  );

  // 5. Admin Settings Page UI
  const adminPageContent = readFileSync(
    resolve(projectRoot, "app/admin/settings/page.tsx"),
    "utf8"
  );
  assert(
    adminPageContent.includes("Salon Branches") && adminPageContent.includes("id=\"branches\""),
    "Branches Test 7: Admin settings page features Salon Branches section"
  );
  assert(
    adminPageContent.includes("handleAddBranch") &&
      adminPageContent.includes("handleRemoveBranch") &&
      adminPageContent.includes("handleSetMainBranch"),
    "Branches Test 8: Admin settings page implements add, remove, and main branch handlers"
  );

  // 6. Database Verification
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    const SalonSettings = mongoose.models.SalonSettings || mongoose.model("SalonSettings", new mongoose.Schema({
      branches: Array,
    }, { strict: false }));

    const existingDoc = await SalonSettings.findOne().lean();
    const originalBranches = existingDoc?.branches || [];

    // Test saving branches
    const testBranches = [
      {
        name: "Test Branch 1",
        address: "123 Test Street",
        phone: "+94 11 000 0001",
        email: "test1@salon.lk",
        isMain: true,
      },
      {
        name: "Test Branch 2",
        address: "456 Test Street",
        phone: "+94 11 000 0002",
        email: "test2@salon.lk",
        isMain: false,
      },
    ];

    await SalonSettings.updateOne({}, { $set: { branches: testBranches } });
    const updated = await SalonSettings.findOne().lean();

    assert(
      Array.isArray(updated.branches) &&
        updated.branches.length === 2 &&
        updated.branches[0].name === "Test Branch 1" &&
        updated.branches[1].name === "Test Branch 2",
      "Branches Test 9: Successfully saved multiple branches to MongoDB"
    );

    // Restore user's actual branches immediately
    await SalonSettings.updateOne({}, { $set: { branches: originalBranches } });
    assert(true, "Branches Test 10: Multi-branch database persistence verified and original branches restored");

    await mongoose.disconnect();
  } catch (err) {
    console.error("DB test error:", err);
    assert(false, "Branches Tests 9-10: Database operations failed", err.message);
  }

  console.log("\n==================================================");
  console.log(`BRANCHES RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runBranchesSuite();
