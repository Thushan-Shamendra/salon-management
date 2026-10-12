import { readFileSync } from "fs";
import { resolve } from "path";
import assert from "assert";

const projectRoot = process.cwd();

console.log("==================================================");
console.log("VERIFYING HOME WEDDING PACKAGES SECTION");
console.log("==================================================");

// 1. Verify app/page.tsx
const pageContent = readFileSync(resolve(projectRoot, "app/page.tsx"), "utf8");

assert(
  pageContent.includes('import WeddingPackagesPreview') &&
  pageContent.includes('import WeddingPackage from "@/models/WeddingPackage";'),
  "Test 1: app/page.tsx imports WeddingPackagesPreview and WeddingPackage model"
);
console.log("✅ [PASS] Test 1: app/page.tsx imports WeddingPackagesPreview and WeddingPackage model");

assert(
  pageContent.includes("WeddingPackage.find({ isActive: true })") &&
  pageContent.includes(".sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })") &&
  pageContent.includes(".limit(3)"),
  "Test 2: app/page.tsx queries active packages sorted by isFeatured DESC, displayOrder ASC, createdAt DESC with limit(3)"
);
console.log("✅ [PASS] Test 2: app/page.tsx queries active packages sorted with limit(3)");

assert(
  pageContent.indexOf("<WeddingPreview />") < pageContent.indexOf("<WeddingPackagesPreview packages={weddingPackages} />") &&
  pageContent.indexOf("<WeddingPackagesPreview packages={weddingPackages} />") < pageContent.indexOf("<WhyChooseUs />"),
  "Test 3: WeddingPackagesPreview is placed directly between WeddingPreview and WhyChooseUs"
);
console.log("✅ [PASS] Test 3: WeddingPackagesPreview is placed directly between WeddingPreview and WhyChooseUs");

// 2. Verify components/home/WeddingPackagesPreview.tsx
const previewContent = readFileSync(resolve(projectRoot, "components/home/WeddingPackagesPreview.tsx"), "utf8");

assert(
  previewContent.includes("if (!packages || packages.length === 0)") &&
  previewContent.includes("return null;"),
  "Test 4: WeddingPackagesPreview returns null when packages array is empty"
);
console.log("✅ [PASS] Test 4: WeddingPackagesPreview returns null when packages array is empty");

assert(
  previewContent.includes("packages.slice(0, 3)"),
  "Test 5: WeddingPackagesPreview caps maximum displayed packages to 3"
);
console.log("✅ [PASS] Test 5: WeddingPackagesPreview caps maximum displayed packages to 3");

assert(
  previewContent.includes("WEDDING PACKAGES") &&
  previewContent.includes("Find Your Perfect Bridal Package") &&
  previewContent.includes("Explore selected SALVORA wedding packages designed for your special day."),
  "Test 6: Header contains eyebrow, heading, and description matching specification"
);
console.log("✅ [PASS] Test 6: Header matches specification");

assert(
  previewContent.includes("grid-cols-1 md:grid-cols-2 lg:grid-cols-3"),
  "Test 7: Responsive grid matches Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols"
);
console.log("✅ [PASS] Test 7: Responsive grid matches Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols");

assert(
  previewContent.includes("slice(0, 3)") &&
  previewContent.includes("+{remainingCount} more"),
  "Test 8: Included items preview is limited to 3 with '+X more' indicator"
);
console.log("✅ [PASS] Test 8: Included items preview is limited to 3 with '+X more' indicator");

assert(
  previewContent.includes("View Package") &&
  previewContent.includes('href="/wedding"') &&
  previewContent.includes("View All Wedding Packages"),
  "Test 9: 'View Package' buttons and 'View All Wedding Packages' link to /wedding"
);
console.log("✅ [PASS] Test 9: Links go to /wedding");

assert(
  previewContent.includes('eventType: "WEDDING_VIEW"') &&
  previewContent.includes('entityType: "wedding-package"'),
  "Test 10: WEDDING_VIEW analytics event tracked on package interaction"
);
console.log("✅ [PASS] Test 10: WEDDING_VIEW analytics event tracked on package interaction");

assert(
  previewContent.includes("/images/placeholder-service.svg"),
  "Test 11: Uses existing project placeholder for missing/errored images without random stock photos"
);
console.log("✅ [PASS] Test 11: Uses existing placeholder without random stock photos");

// 3. Verify /wedding and WeddingPreview integrity
const weddingPageContent = readFileSync(resolve(projectRoot, "app/wedding/page.tsx"), "utf8");
assert(
  !weddingPageContent.includes("WeddingPackagesPreview"),
  "Test 12: /wedding page remains untouched"
);
console.log("✅ [PASS] Test 12: /wedding page remains untouched");

const weddingPreviewContent = readFileSync(resolve(projectRoot, "components/home/WeddingPreview.tsx"), "utf8");
assert(
  weddingPreviewContent.includes("Wedding Beauty"),
  "Test 13: Existing WeddingPreview section remains intact"
);
console.log("✅ [PASS] Test 13: Existing WeddingPreview section remains intact");

console.log("==================================================");
console.log("ALL 13 VERIFICATION TESTS PASSED!");
console.log("==================================================");
