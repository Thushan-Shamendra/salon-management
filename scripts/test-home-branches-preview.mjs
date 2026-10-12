import { readFileSync } from "fs";
import { resolve } from "path";
import assert from "assert";

const projectRoot = process.cwd();

console.log("==================================================");
console.log("VERIFYING HOME BRANCHES PREVIEW SECTION");
console.log("==================================================");

// 1. Verify app/page.tsx
const pageContent = readFileSync(resolve(projectRoot, "app/page.tsx"), "utf8");

assert(
  pageContent.includes('import BranchesPreview, {') &&
  pageContent.includes('} from "@/components/home/BranchesPreview";'),
  "Test 1: app/page.tsx imports BranchesPreview"
);
console.log("✅ [PASS] Test 1: app/page.tsx imports BranchesPreview");

assert(
  pageContent.includes("Branch.find({ isActive: true })") &&
  pageContent.includes(".sort({ isMain: -1, displayOrder: 1, name: 1 })") &&
  pageContent.includes(".limit(3)"),
  "Test 2: Branch query sorts isMain DESC, displayOrder ASC, name ASC, with limit(3)"
);
console.log("✅ [PASS] Test 2: Branch query sorts isMain DESC, displayOrder ASC, name ASC, limit(3)");

assert(
  pageContent.includes("<BranchesPreview branches={homeBranches} />"),
  "Test 3: app/page.tsx renders BranchesPreview with homeBranches"
);
console.log("✅ [PASS] Test 3: app/page.tsx renders BranchesPreview with homeBranches");

// 2. Verify components/home/BranchesPreview.tsx
const previewContent = readFileSync(
  resolve(projectRoot, "components/home/BranchesPreview.tsx"),
  "utf8"
);

assert(
  previewContent.includes("if (!branches || branches.length === 0)") &&
  previewContent.includes("Branch information is currently unavailable.") &&
  previewContent.includes('href="/contact"') &&
  previewContent.includes("Contact Us"),
  "Test 4: Empty state cleanly displays 'Branch information is currently unavailable.' with link to /contact"
);
console.log("✅ [PASS] Test 4: Empty state properly handled");

assert(
  previewContent.includes("branches.slice(0, 3)"),
  "Test 5: Defensively caps maximum branches displayed to 3"
);
console.log("✅ [PASS] Test 5: Defensively caps maximum branches displayed to 3");

assert(
  previewContent.includes("VISIT SALVORA") &&
  previewContent.includes("Contact Us") &&
  previewContent.includes("Find the SALVORA branch nearest to you and get in touch with our team."),
  "Test 6: Section header contains eyebrow, heading, and description"
);
console.log("✅ [PASS] Test 6: Section header contains eyebrow, heading, and description");

assert(
  previewContent.includes("grid-cols-1 md:grid-cols-2 lg:grid-cols-3"),
  "Test 7: Responsive grid layout: Mobile 1, Tablet 2, Desktop 3"
);
console.log("✅ [PASS] Test 7: Responsive grid layout matches specification");

assert(
  previewContent.includes("<iframe") &&
  previewContent.includes("getBranchMapData"),
  "Test 8: Map is rendered on top with iframe based on coordinates / embedUrl / address"
);
console.log("✅ [PASS] Test 8: Map is rendered on top based on coordinates/address");

assert(
  previewContent.includes("branch.isMain") &&
  previewContent.includes("MAIN BRANCH"),
  "Test 9: MAIN BRANCH badge rendered for main branch"
);
console.log("✅ [PASS] Test 9: MAIN BRANCH badge rendered for main branch");

assert(
  previewContent.includes("branch.address") &&
  previewContent.includes("branch.phone") &&
  previewContent.includes("branch.email") &&
  previewContent.includes("summarizeOpeningHours"),
  "Test 10: Details display address, phone, email, and dynamic opening hours summary"
);
console.log("✅ [PASS] Test 10: Details display real branch fields and hours summary");

assert(
  previewContent.includes("Call Us") &&
  previewContent.includes("Directions") &&
  previewContent.includes('href={`tel:${branch.phone}`}') &&
  previewContent.includes("directionsUrl"),
  "Test 11: Call Us and Directions buttons use real branch phone and directions URL"
);
console.log("✅ [PASS] Test 11: Action buttons link correctly");

assert(
  previewContent.includes("View All Branches") &&
  previewContent.includes('href="/contact"'),
  "Test 12: View All Branches links to /contact"
);
console.log("✅ [PASS] Test 12: View All Branches links to /contact");

// 3. Verify /contact page integrity
const contactPageContent = readFileSync(
  resolve(projectRoot, "app/contact/page.tsx"),
  "utf8"
);

assert(
  contactPageContent.includes("BranchContactSection") &&
  !contactPageContent.includes(".limit(3)"),
  "Test 13: /contact page remains full list without limit(3)"
);
console.log("✅ [PASS] Test 13: /contact page remains full list without limit(3)");

console.log("==================================================");
console.log("ALL 13 VERIFICATION TESTS PASSED!");
console.log("==================================================");
