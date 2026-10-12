import { readFileSync } from "fs";
import { resolve } from "path";
import assert from "assert";

const projectRoot = process.cwd();

console.log("==================================================");
console.log("VERIFYING HOME PRODUCTS & PROMOTIONS SECTIONS");
console.log("==================================================");

// 1. Verify app/page.tsx imports and queries
const pageContent = readFileSync(resolve(projectRoot, "app/page.tsx"), "utf8");

assert(
  pageContent.includes('import ProductsPreview from "@/components/home/ProductsPreview";') &&
  pageContent.includes('import PromotionsPreview from "@/components/home/PromotionsPreview";') &&
  pageContent.includes('import RetailProduct from "@/models/RetailProduct";') &&
  pageContent.includes('import Promotion from "@/models/Promotion";'),
  "Test 1: app/page.tsx imports ProductsPreview, PromotionsPreview, and models"
);
console.log("✅ [PASS] Test 1: app/page.tsx imports ProductsPreview, PromotionsPreview, and models");

// Products query
assert(
  pageContent.includes("RetailProduct.find({ isActive: true })") &&
  pageContent.includes(".sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })") &&
  pageContent.includes(".limit(4)"),
  "Test 2: RetailProduct query filters isActive, sorts by isFeatured DESC, displayOrder ASC, createdAt DESC, limit(4)"
);
console.log("✅ [PASS] Test 2: RetailProduct query is active-only, sorted by isFeatured DESC, displayOrder ASC, createdAt DESC, limit(4)");

// Promotions query
assert(
  pageContent.includes("Promotion.find({") &&
  pageContent.includes("isActive: true") &&
  pageContent.includes("startDate: { $lte: now }") &&
  pageContent.includes("endDate: { $gte: now }") &&
  pageContent.includes(".sort({ isFeatured: -1, displayOrder: 1, endDate: 1 })") &&
  pageContent.includes(".limit(3)"),
  "Test 3: Promotion query filters active, current (startDate <= now and endDate >= now), sorts by isFeatured DESC, displayOrder ASC, endDate ASC, limit(3)"
);
console.log("✅ [PASS] Test 3: Promotion query filters active, current, sorted with limit(3)");

// Section order in JSX
const idxWeddingBeauty = pageContent.indexOf("<WeddingPreview />");
const idxWeddingPackages = pageContent.indexOf("<WeddingPackagesPreview");
const idxProductsPreview = pageContent.indexOf("<ProductsPreview");
const idxPromotionsPreview = pageContent.indexOf("<PromotionsPreview");
const idxWhyChooseUs = pageContent.indexOf("<WhyChooseUs />");

assert(
  idxWeddingBeauty !== -1 &&
  idxWeddingPackages !== -1 &&
  idxProductsPreview !== -1 &&
  idxPromotionsPreview !== -1 &&
  idxWhyChooseUs !== -1,
  "Test 4: All sections exist in JSX"
);

assert(
  idxWeddingBeauty < idxWeddingPackages &&
  idxWeddingPackages < idxProductsPreview &&
  idxProductsPreview < idxPromotionsPreview &&
  idxPromotionsPreview < idxWhyChooseUs,
  "Test 5: Section ordering matches: Wedding Beauty -> Wedding Packages -> Products Preview -> Promotions Preview -> Why Choose Salvora"
);
console.log("✅ [PASS] Test 4 & 5: Section order strictly matches required layout");

// 2. Verify components/home/ProductsPreview.tsx
const productsPreviewContent = readFileSync(
  resolve(projectRoot, "components/home/ProductsPreview.tsx"),
  "utf8"
);

assert(
  productsPreviewContent.includes("if (!products || products.length === 0)") &&
  productsPreviewContent.includes("return null;"),
  "Test 6: ProductsPreview hides entire section when products is empty"
);
console.log("✅ [PASS] Test 6: ProductsPreview hides entire section when products is empty");

assert(
  productsPreviewContent.includes("products.slice(0, 4)"),
  "Test 7: ProductsPreview limits max products to 4"
);
console.log("✅ [PASS] Test 7: ProductsPreview limits max products to 4");

assert(
  productsPreviewContent.includes("OUR PRODUCTS") &&
  productsPreviewContent.includes("Beauty Essentials") &&
  productsPreviewContent.includes("For Your Routine") &&
  productsPreviewContent.includes("Discover selected professional beauty products available from SALVORA."),
  "Test 8: ProductsPreview matches header copy"
);
console.log("✅ [PASS] Test 8: ProductsPreview matches header copy");

assert(
  productsPreviewContent.includes('href="/products"') &&
  productsPreviewContent.includes("View All Products"),
  "Test 9: ProductsPreview links to /products"
);
console.log("✅ [PASS] Test 9: ProductsPreview links to /products");

assert(
  productsPreviewContent.includes("grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"),
  "Test 10: ProductsPreview responsive grid: Desktop 4, Tablet 2, Mobile 1"
);
console.log("✅ [PASS] Test 10: ProductsPreview responsive grid matches Desktop 4, Tablet 2, Mobile 1");

// 3. Verify components/home/PromotionsPreview.tsx
const promotionsPreviewContent = readFileSync(
  resolve(projectRoot, "components/home/PromotionsPreview.tsx"),
  "utf8"
);

assert(
  promotionsPreviewContent.includes("if (!promotions || promotions.length === 0)") &&
  promotionsPreviewContent.includes("return null;"),
  "Test 11: PromotionsPreview hides entire section when promotions is empty"
);
console.log("✅ [PASS] Test 11: PromotionsPreview hides entire section when promotions is empty");

assert(
  promotionsPreviewContent.includes("promotions.slice(0, 3)"),
  "Test 12: PromotionsPreview limits max promotions to 3"
);
console.log("✅ [PASS] Test 12: PromotionsPreview limits max promotions to 3");

assert(
  promotionsPreviewContent.includes("SPECIAL OFFERS") &&
  promotionsPreviewContent.includes("Latest Promotions") &&
  promotionsPreviewContent.includes("Explore current beauty offers, product deals and wedding specials from SALVORA."),
  "Test 13: PromotionsPreview matches header copy"
);
console.log("✅ [PASS] Test 13: PromotionsPreview matches header copy");

assert(
  promotionsPreviewContent.includes('href="/promotions"') &&
  promotionsPreviewContent.includes("View All Promotions"),
  "Test 14: PromotionsPreview links to /promotions"
);
console.log("✅ [PASS] Test 14: PromotionsPreview links to /promotions");

assert(
  promotionsPreviewContent.includes("grid-cols-1 md:grid-cols-2 lg:grid-cols-3"),
  "Test 15: PromotionsPreview responsive grid: Desktop 3, Tablet 2, Mobile 1"
);
console.log("✅ [PASS] Test 15: PromotionsPreview responsive grid matches Desktop 3, Tablet 2, Mobile 1");

console.log("==================================================");
console.log("ALL 15 VERIFICATION TESTS PASSED!");
console.log("==================================================");
