/**
 * Non-destructive verification test for Retail Products & Promotions modules
 * Strictly read-only: does not modify, delete, or seed MongoDB records.
 */

import { CLOUDINARY_FOLDERS } from "../lib/cloudinary-constants.js";
import { ANALYTICS_EVENT_TYPES } from "../lib/analytics-constants.js";
import { RETAIL_PRODUCT_CATEGORIES, STOCK_STATUSES } from "../lib/retail-product-constants.js";
import { PROMOTION_TYPES, DISCOUNT_TYPES, CTA_TYPES } from "../lib/promotion-constants.js";

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
console.log("SALVORA RETAIL PRODUCTS & PROMOTIONS VERIFICATION");
console.log("==================================================\n");

// 1. Cloudinary Constants Check
console.log("1. Cloudinary Constants:");
assert(
  CLOUDINARY_FOLDERS.RETAIL_PRODUCTS === "salon-management/retail-products",
  "CLOUDINARY_FOLDERS has RETAIL_PRODUCTS"
);
assert(
  CLOUDINARY_FOLDERS.PROMOTIONS === "salon-management/promotions",
  "CLOUDINARY_FOLDERS has PROMOTIONS"
);
assert(
  CLOUDINARY_FOLDERS.PRODUCTS === "salon-management/products",
  "CLOUDINARY_FOLDERS preserves original PRODUCTS for ProductBrand"
);

// 2. Analytics Event Constants Check
console.log("\n2. Analytics Event Constants:");
assert(
  ANALYTICS_EVENT_TYPES.includes("PRODUCT_CLICK"),
  "ANALYTICS_EVENT_TYPES includes PRODUCT_CLICK"
);
assert(
  ANALYTICS_EVENT_TYPES.includes("PROMOTION_CLICK"),
  "ANALYTICS_EVENT_TYPES includes PROMOTION_CLICK"
);

// 3. Retail Products Model Specifications
console.log("\n3. Retail Product Specifications:");
assert(
  RETAIL_PRODUCT_CATEGORIES.includes("hair_care") &&
  RETAIL_PRODUCT_CATEGORIES.includes("skin_care") &&
  RETAIL_PRODUCT_CATEGORIES.includes("nail_care") &&
  RETAIL_PRODUCT_CATEGORIES.includes("styling") &&
  RETAIL_PRODUCT_CATEGORIES.includes("makeup"),
  "RETAIL_PRODUCT_CATEGORIES contains all 5 mockup categories"
);
assert(
  STOCK_STATUSES.includes("in_stock") &&
  STOCK_STATUSES.includes("low_stock") &&
  STOCK_STATUSES.includes("out_of_stock"),
  "STOCK_STATUSES contains in_stock, low_stock, out_of_stock"
);

// 4. Promotions Model Specifications
console.log("\n4. Promotion Specifications:");
assert(
  PROMOTION_TYPES.includes("service_offer") &&
  PROMOTION_TYPES.includes("product_deal") &&
  PROMOTION_TYPES.includes("wedding_offer") &&
  PROMOTION_TYPES.includes("branch_offer") &&
  PROMOTION_TYPES.includes("limited_time"),
  "PROMOTION_TYPES contains all mockup offer types"
);
assert(
  DISCOUNT_TYPES.includes("percentage") &&
  DISCOUNT_TYPES.includes("fixed_amount") &&
  DISCOUNT_TYPES.includes("custom_text"),
  "DISCOUNT_TYPES supported"
);
assert(
  CTA_TYPES.includes("whatsapp") &&
  CTA_TYPES.includes("booking") &&
  CTA_TYPES.includes("service_link") &&
  CTA_TYPES.includes("product_link") &&
  CTA_TYPES.includes("wedding_link"),
  "CTA_TYPES supported"
);

console.log("\n==================================================");
console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
