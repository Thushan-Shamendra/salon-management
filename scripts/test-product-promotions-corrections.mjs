/**
 * Non-destructive verification test for Product WhatsApp & Promotion Timezone corrections.
 * Strictly tests logic and pure modules without database writes.
 */

import { normalizeWhatsAppNumber } from "../lib/phone.ts";
import {
  parseColomboStartDate,
  parseColomboEndDate,
  formatInColomboTimezone,
} from "../lib/colombo-timezone.ts";
import fs from "fs";
import path from "path";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("==================================================");
console.log("SALVORA PRODUCT & PROMOTION CORRECTIONS VERIFICATION");
console.log("==================================================\n");

// Helper simulating server/client resolution logic
function resolveProductWhatsApp({
  selectedBranchWhatsapp,
  productBranchWhatsapp,
  branches,
  totalBranchCount,
  settingsWhatsapp,
}) {
  const normSelected = normalizeWhatsAppNumber(selectedBranchWhatsapp);
  if (normSelected) return normSelected;

  const normProduct = normalizeWhatsAppNumber(productBranchWhatsapp);
  if (normProduct) return normProduct;

  const mainBranch = (branches || []).find((b) => b.isMain);
  const mainBranchWhatsapp = normalizeWhatsAppNumber(mainBranch?.whatsappNumber);
  if (mainBranchWhatsapp) return mainBranchWhatsapp;

  const firstActive = (branches || []).find((b) => normalizeWhatsAppNumber(b.whatsappNumber));
  const firstActiveWhatsapp = normalizeWhatsAppNumber(firstActive?.whatsappNumber);
  if (firstActiveWhatsapp) return firstActiveWhatsapp;

  if (totalBranchCount === 0 && settingsWhatsapp) {
    return normalizeWhatsAppNumber(settingsWhatsapp);
  }

  return "";
}

// 1. Main Branch: phone exists, whatsappNumber exists -> Buy/Enquire uses whatsappNumber, NOT phone
console.log("1. Main Branch phone vs whatsappNumber:");
{
  const branches = [
    {
      _id: "branch-main",
      name: "Colombo Main Branch",
      isMain: true,
      phone: "+94 11 234 5678",
      whatsappNumber: "076 123 4567",
      isActive: true,
    },
    {
      _id: "branch-2",
      name: "Kandy Branch",
      isMain: false,
      phone: "+94 81 234 5678",
      whatsappNumber: "077 765 4321",
      isActive: true,
    },
  ];

  const resolved = resolveProductWhatsApp({
    branches,
    totalBranchCount: 2,
    settingsWhatsapp: "071 999 9999",
  });

  assert(
    resolved === "94761234567",
    `Main branch whatsappNumber used (got ${resolved}, expected 94761234567)`
  );
  assert(
    resolved !== "94112345678",
    "Does NOT use main branch phone number for WhatsApp"
  );
}

// 2. Main Branch has no WhatsApp -> first active branch WhatsApp is used
console.log("\n2. Main Branch has no WhatsApp -> First active branch WhatsApp used:");
{
  const branches = [
    {
      _id: "branch-main",
      name: "Colombo Main Branch",
      isMain: true,
      phone: "+94 11 234 5678",
      whatsappNumber: "", // No WhatsApp on main
      isActive: true,
    },
    {
      _id: "branch-2",
      name: "Kandy Branch",
      isMain: false,
      phone: "+94 81 234 5678",
      whatsappNumber: "077 765 4321",
      isActive: true,
    },
  ];

  const resolved = resolveProductWhatsApp({
    branches,
    totalBranchCount: 2,
    settingsWhatsapp: "071 999 9999",
  });

  assert(
    resolved === "94777654321",
    `Fallback to first active branch whatsappNumber (got ${resolved}, expected 94777654321)`
  );
}

// 3. No branch WhatsApp exists -> fallback to /contact
console.log("\n3. No branch WhatsApp exists -> Fallback to /contact:");
{
  const branches = [
    {
      _id: "branch-main",
      name: "Colombo Main Branch",
      isMain: true,
      phone: "+94 11 234 5678",
      whatsappNumber: "",
      isActive: true,
    },
    {
      _id: "branch-2",
      name: "Kandy Branch",
      isMain: false,
      phone: "+94 81 234 5678",
      whatsappNumber: "",
      isActive: true,
    },
  ];

  const resolved = resolveProductWhatsApp({
    branches,
    totalBranchCount: 2,
    settingsWhatsapp: "071 999 9999", // settings NOT used when branches exist
  });

  assert(
    resolved === "",
    `Returns empty string when no branch WhatsApp exists (got "${resolved}"), routing to /contact`
  );
}

// 4. Promotion: endDate = 2026-10-31 -> active at 2026-10-31 23:00 Asia/Colombo
console.log("\n4. Promotion active at 2026-10-31 23:00 Asia/Colombo:");
{
  const startDate = parseColomboStartDate("2026-10-01");
  const endDate = parseColomboEndDate("2026-10-31");
  const testTimeAt23 = new Date("2026-10-31T23:00:00.000+05:30");

  const isActive = testTimeAt23 <= endDate;
  assert(
    isActive,
    `Promotion is active at 23:00 Asia/Colombo (test: ${testTimeAt23.toISOString()}, end: ${endDate.toISOString()})`
  );
  assert(
    startDate.toISOString() === "2026-09-30T18:30:00.000Z",
    "Start boundary stored correctly in UTC as 2026-09-30T18:30:00.000Z"
  );
  assert(
    endDate.toISOString() === "2026-10-31T18:29:59.999Z",
    "End boundary stored correctly in UTC as 2026-10-31T18:29:59.999Z"
  );
  assert(
    formatInColomboTimezone(endDate) === "2026-10-31",
    "formatInColomboTimezone converts end boundary back to 2026-10-31"
  );
}

// 5. Same promotion -> expired after 2026-11-01 00:00 Asia/Colombo
console.log("\n5. Same promotion expired after 2026-11-01 00:00 Asia/Colombo:");
{
  const endDate = parseColomboEndDate("2026-10-31");
  const testTimeAt00 = new Date("2026-11-01T00:00:00.000+05:30");

  const isActive = testTimeAt00 <= endDate;
  assert(
    !isActive,
    `Promotion is expired at 00:00 Asia/Colombo on next day (test: ${testTimeAt00.toISOString()}, end: ${endDate.toISOString()})`
  );
}

// 6. No Product/Promotion demo records introduced
console.log("\n6. No demo data in source files:");
{
  const productsPageCode = fs.readFileSync(path.resolve("app/products/page.tsx"), "utf8");
  const promotionsPageCode = fs.readFileSync(path.resolve("app/promotions/page.tsx"), "utf8");

  assert(
    !productsPageCode.includes("DEMO_PRODUCTS"),
    "app/products/page.tsx contains no DEMO_PRODUCTS"
  );
  assert(
    !promotionsPageCode.includes("DEMO_PROMOTIONS"),
    "app/promotions/page.tsx contains no DEMO_PROMOTIONS"
  );
}

console.log("\n==================================================");
console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
