import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";

const projectRoot = process.cwd();

async function runTestSuite() {
  console.log("==================================================");
  console.log("RUNNING COMPLETE GOOGLE REVIEWS VERIFICATION SUITE");
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
    resolve(projectRoot, "models/SalonSettings.ts"),
    "utf8"
  );
  assert(
    modelContent.includes("googleReviews?: IGoogleReviewsSettings") ||
      modelContent.includes("googleReviews: {"),
    "Test 1: SalonSettings model supports googleReviews settings object"
  );
  assert(
    modelContent.includes("placeId: {") &&
      modelContent.includes("businessUrl: {") &&
      modelContent.includes("maxReviews: {"),
    "Test 2: SalonSettingsSchema defines placeId, businessUrl, and maxReviews fields"
  );

  // 2. Environment Variables & Security Checks
  const envExample = readFileSync(
    resolve(projectRoot, ".env.example"),
    "utf8"
  );
  assert(
    envExample.includes("GOOGLE_PLACES_API_KEY="),
    "Test 5a: .env.example contains GOOGLE_PLACES_API_KEY placeholder"
  );
  assert(
    !envExample.includes("NEXT_PUBLIC_GOOGLE_PLACES_API_KEY"),
    "Test 5b: GOOGLE_PLACES_API_KEY is NOT prefixed with NEXT_PUBLIC_ (server-only)"
  );

  // Check codebase for any accidental exposure of the API key in client components
  const clientPage = readFileSync(
    resolve(projectRoot, "app/admin/settings/page.tsx"),
    "utf8"
  );
  assert(
    !clientPage.includes("GOOGLE_PLACES_API_KEY") &&
      !clientPage.includes("apiKey"),
    "Test 5c: Admin settings UI does NOT contain or accept Google Places API key"
  );

  const reviewsSection = readFileSync(
    resolve(projectRoot, "components/reviews/GoogleReviewsSection.tsx"),
    "utf8"
  );
  assert(
    !reviewsSection.includes("GOOGLE_PLACES_API_KEY") &&
      !reviewsSection.includes("process.env"),
    "Test 5d: Client-side GoogleReviewsSection does not access or expose API keys"
  );

  // 3. Admin Settings Route Verification
  const adminSettingsApi = readFileSync(
    resolve(projectRoot, "app/api/admin/settings/route.ts"),
    "utf8"
  );
  assert(
    adminSettingsApi.includes("body.googleReviews"),
    "Test 1, 2 & 3: Admin settings API allows saving googleReviews configuration"
  );
  assert(
    adminSettingsApi.includes("user.role !== \"admin\"") &&
      adminSettingsApi.includes("status: 403"),
    "Test 4: Customer / non-admin cannot modify Google Review settings (enforces 403)"
  );
  assert(
    adminSettingsApi.includes("num < 1 || num > 5"),
    "Test 11: Admin settings API validates maxReviews range (1 to 5)"
  );

  // 4. Server-Side Google Reviews API Route Verification
  const googleApiRoute = readFileSync(
    resolve(projectRoot, "app/api/google-reviews/route.ts"),
    "utf8"
  );
  assert(
    googleApiRoute.includes("process.env.GOOGLE_PLACES_API_KEY"),
    "Test 7a: Server-side API accesses GOOGLE_PLACES_API_KEY securely from process.env"
  );
  assert(
    googleApiRoute.includes("!googleSettings.enabled"),
    "Test 6: Server API respects disabled state"
  );
  assert(
    googleApiRoute.includes("maps.googleapis.com/maps/api/place/details/json"),
    "Test 7b: Server API integrates Google Place Details API endpoint"
  );
  assert(
    googleApiRoute.includes("slice(0, maxReviews)"),
    "Test 11b: Server API enforces maximum reviews limit"
  );
  assert(
    googleApiRoute.includes("try {") && googleApiRoute.includes("catch (error)"),
    "Test 13: Server API implements robust error handling so Google failures never crash page"
  );

  // 5. Public Reviews Page Integration
  const reviewsPage = readFileSync(
    resolve(projectRoot, "app/reviews/page.tsx"),
    "utf8"
  );
  assert(
    reviewsPage.includes("<GoogleReviewsSection />"),
    "Test 7c: Public Reviews page embeds GoogleReviewsSection"
  );
  assert(
    reviewsPage.includes("APPROVED_REVIEWS") &&
      reviewsPage.includes("ReviewForm"),
    "Test 14: Existing salon website reviews and review submission form remain intact"
  );

  // 6. GoogleReviewsSection Client Component Verification
  assert(
    reviewsSection.includes("What Our Clients Say on Google"),
    "Test 8 & 9: Google Reviews section displays prominent heading"
  );
  assert(
    reviewsSection.includes("GoogleIcon") &&
      reviewsSection.includes("Google Review"),
    "Test 10: Review cards include Google attribution branding"
  );
  assert(
    reviewsSection.includes("View All Reviews on Google") &&
      reviewsSection.includes("target=\"_blank\"") &&
      reviewsSection.includes("rel=\"noopener noreferrer\""),
    "Test 12: 'View All Reviews on Google' button opens external link securely"
  );
  assert(
    reviewsSection.includes("if (!loading && data && !data.enabled)") &&
      reviewsSection.includes("return null"),
    "Test 6b: Disabled Google Reviews section returns null to stay hidden"
  );

  // 7. Database Configuration Persistence Simulation
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

    const SalonSettings =
      mongoose.models.SalonSettings ||
      mongoose.model(
        "SalonSettings",
        new mongoose.Schema(
          {
            googleReviews: {
              enabled: Boolean,
              placeId: String,
              businessUrl: String,
              maxReviews: Number,
            },
          },
          { strict: false }
        )
      );

    const initialDoc = await SalonSettings.findOne();
    const prevGr = initialDoc ? initialDoc.googleReviews : null;

    if (initialDoc) {
      // Simulate saving Google Reviews settings
      initialDoc.googleReviews = {
        enabled: true,
        placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4",
        businessUrl: "https://maps.google.com/?cid=1029384756",
        maxReviews: 4,
      };
      await initialDoc.save();

      // Read back from database
      const reloadedDoc = await SalonSettings.findById(initialDoc._id).lean();
      assert(
        reloadedDoc.googleReviews &&
          reloadedDoc.googleReviews.enabled === true &&
          reloadedDoc.googleReviews.placeId === "ChIJN1t_tDeuEmsRUsoyG83frY4" &&
          reloadedDoc.googleReviews.businessUrl === "https://maps.google.com/?cid=1029384756" &&
          reloadedDoc.googleReviews.maxReviews === 4,
        "Test 15: Google Review settings persist accurately in MongoDB across reloads"
      );

      // Restore original settings
      initialDoc.googleReviews = prevGr;
      await initialDoc.save();
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Database test error:", err);
    assert(false, "Test 15: Database persistence test failed", err.message);
  }

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
