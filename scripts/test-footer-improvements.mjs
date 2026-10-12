import { readFileSync } from "fs";
import { resolve } from "path";
import assert from "assert";

const projectRoot = process.cwd();

console.log("==================================================");
console.log("VERIFYING SALVORA FOOTER IMPROVEMENTS");
console.log("==================================================");

// 1. Read components/layout/Footer.tsx
const footerContent = readFileSync(
  resolve(projectRoot, "components/layout/Footer.tsx"),
  "utf8"
);

// Test 1: Service query with max 5
assert(
  footerContent.includes("Service.find") &&
  footerContent.includes(".limit(5)"),
  "Test 1: Footer queries Service with limit(5)"
);
console.log("✅ [PASS] Test 1: Footer queries Service with limit(5)");

// Test 2: WeddingService and WeddingPackage query
assert(
  footerContent.includes("WeddingService.find") &&
  footerContent.includes("WeddingPackage.find"),
  "Test 2: Footer queries real active WeddingService and WeddingPackage"
);
console.log("✅ [PASS] Test 2: Footer queries WeddingService and WeddingPackage");

// Test 3: Branch query sorts isMain DESC, displayOrder ASC, limit 3
assert(
  footerContent.includes("Branch.find") &&
  footerContent.includes("isMain: -1") &&
  footerContent.includes(".limit(3)"),
  "Test 3: Footer queries Branch sorted with isMain: -1, limit(3)"
);
console.log("✅ [PASS] Test 3: Footer queries Branch sorted isMain DESC with limit(3)");

// Test 4: Branch-wise opening hours (not single global hours)
assert(
  footerContent.includes("openingHours") &&
  !footerContent.includes("hoursWeekday") &&
  !footerContent.includes("hoursSunday"),
  "Test 4: Removed single global opening hours in favor of branch-wise opening hours"
);
console.log("✅ [PASS] Test 4: Global opening hours removed; branch-wise opening hours enabled");

// Test 5: Closed handling in hours formatter
assert(
  footerContent.includes('"Closed"') || footerContent.includes("'Closed'"),
  "Test 5: Opening hours handles Closed days correctly"
);
console.log("✅ [PASS] Test 5: Opening hours handles Closed days correctly");

// Test 6: No Lumina references
assert(
  !footerContent.toLowerCase().includes("lumina"),
  "Test 6: No Lumina brand/email references in Footer"
);
console.log("✅ [PASS] Test 6: Zero Lumina brand/email references in Footer");

// Test 7: Navigation links
assert(
  footerContent.includes("View All Services") &&
  footerContent.includes('href="/services"'),
  "Test 7: View All Services links to /services"
);
console.log("✅ [PASS] Test 7: View All Services links to /services");

assert(
  footerContent.includes("View Wedding Services") &&
  footerContent.includes('href="/wedding"'),
  "Test 8: View Wedding Services links to /wedding"
);
console.log("✅ [PASS] Test 8: View Wedding Services links to /wedding");

assert(
  footerContent.includes("View All Products") &&
  footerContent.includes('href="/products"'),
  "Test 9: View All Products links to /products"
);
console.log("✅ [PASS] Test 9: View All Products links to /products");

assert(
  footerContent.includes("View All Branches") &&
  footerContent.includes('href="/contact"'),
  "Test 10: View All Branches links to /contact"
);
console.log("✅ [PASS] Test 10: View All Branches links to /contact");

// Test 11: Empty state guards
assert(
  footerContent.includes("serviceLinks.length > 0") &&
  footerContent.includes("weddingItems.length > 0") &&
  footerContent.includes("productCategoryLinks.length > 0") &&
  footerContent.includes("branches.length > 0"),
  "Test 11: All dynamic catalog sections cleanly hide when empty"
);
console.log("✅ [PASS] Test 11: Clean empty state guards for all catalog sections");

// Test 12: Company Logo under Branch section
assert(
  footerContent.includes("/images/salvora-suite-logo.png") &&
  footerContent.indexOf("View All Branches") < footerContent.indexOf("/images/salvora-suite-logo.png"),
  "Test 12: Logo appears below View All Branches in branch section"
);
console.log("✅ [PASS] Test 12: Company logo appears below View All Branches");

// Test 13: Company Logo link and attributes
assert(
  footerContent.includes('href="https://raxwo.net/"') &&
  footerContent.includes('target="_blank"') &&
  footerContent.includes('rel="noopener noreferrer"') &&
  footerContent.includes('Raxwo (Pvt) Ltd'),
  "Test 13: Logo links to https://raxwo.net/ in new tab with Raxwo (Pvt) Ltd label"
);
console.log("✅ [PASS] Test 13: Logo links to https://raxwo.net/ in a new tab");

// Test 14: Updated Copyright text
assert(
  footerContent.includes("A Product of") &&
  footerContent.includes("All rights reserved.") &&
  footerContent.includes("Raxwo (Pvt) Ltd") &&
  footerContent.includes('href="https://raxwo.net/"'),
  "Test 14: Copyright displays '© {currentYear} Salvora. A Product of Raxwo (Pvt) Ltd. All rights reserved.' with only Raxwo (Pvt) Ltd linked"
);
console.log("✅ [PASS] Test 14: Copyright text accurately links Raxwo (Pvt) Ltd");

console.log("==================================================");
console.log("ALL 14 FOOTER TESTS PASSED!");
console.log("==================================================");
