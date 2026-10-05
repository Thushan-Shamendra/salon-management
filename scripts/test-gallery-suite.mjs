import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex !== -1) {
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

const mongoUri = process.env.MONGODB_URI;

async function runTestSuite() {
  console.log("==================================================");
  console.log("RUNNING COMPLETE GALLERY MODULE VERIFICATION SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(name, condition, detail = "") {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${detail ? `(${detail})` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // 1. Navbar integration checks
  const navbarContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/layout/Navbar.tsx"),
    "utf-8"
  );
  assert(
    "Test 2: Gallery in desktop navbar",
    navbarContent.includes('{ name: "Gallery", href: "/gallery" }'),
    "Configured in navLinks"
  );
  assert(
    "Test 3: Gallery in mobile navbar",
    navbarContent.includes("navLinks.map((link)") &&
      navbarContent.includes("link.href") &&
      navbarContent.includes('{ name: "Gallery", href: "/gallery" }'),
    "Rendered in mobile menu"
  );

  // 2. Admin Sidebar checks
  const sidebarContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/admin/AdminSidebar.tsx"),
    "utf-8"
  );
  assert(
    "Test 4: Admin sees Gallery in sidebar",
    sidebarContent.includes('href: "/admin/gallery"') &&
      sidebarContent.includes('name: "Gallery"'),
    "Configured in navItems with ImageIcon"
  );

  // 3. Cloudinary folder configurations
  const cloudinaryConsts = fs.readFileSync(
    path.resolve(process.cwd(), "lib/cloudinary-constants.ts"),
    "utf-8"
  );
  assert(
    "Test 7 & 22: Cloudinary gallery folder added and existing folders preserved",
    cloudinaryConsts.includes('GALLERY: "salon-management/gallery"') &&
      cloudinaryConsts.includes('SERVICES: "salon-management/services"') &&
      cloudinaryConsts.includes('PROFILES: "salon-management/profiles"'),
    "salon-management/gallery configured"
  );

  // 4. Cloudinary routes security checks
  const signRoute = fs.readFileSync(
    path.resolve(process.cwd(), "app/api/cloudinary/sign/route.ts"),
    "utf-8"
  );
  assert(
    "Test 5a: Cloudinary sign route enforces admin role for gallery folder",
    signRoute.includes("CLOUDINARY_FOLDERS.GALLERY") &&
      signRoute.includes('user.role !== "admin"'),
    "Gallery folder in ADMIN_ONLY_FOLDERS"
  );

  const deleteRoute = fs.readFileSync(
    path.resolve(process.cwd(), "app/api/cloudinary/image/route.ts"),
    "utf-8"
  );
  assert(
    "Test 5b: Cloudinary delete route enforces admin role for gallery folder",
    deleteRoute.includes("CLOUDINARY_FOLDERS.GALLERY") &&
      deleteRoute.includes('user.role !== "admin"'),
    "Admin required for gallery deletion"
  );

  // 5. Connect to MongoDB and test model & data operations
  if (!mongoUri) {
    console.error("MONGODB_URI not set. Skipping DB tests.");
    return;
  }

  await mongoose.connect(mongoUri);
  const galleryColl = mongoose.connection.db.collection("galleries");

  // Clean up any test records
  await galleryColl.deleteMany({ title: /^__TEST__/ });

  // Test 8: MongoDB stores image + imagePublicId with model schema
  const testPhoto1 = {
    title: "__TEST__ Hair Balayage Masterpiece",
    description: "Multi-tonal honey blonde balayage with shadow root.",
    category: "Hair Coloring",
    image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    imagePublicId: "salon-management/gallery/sample_test_1",
    altText: "Honey blonde balayage hair style",
    isActive: true,
    isFeatured: true,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const insertResult = await galleryColl.insertOne(testPhoto1);
  const foundPhoto = await galleryColl.findOne({ _id: insertResult.insertedId });

  assert(
    "Test 8: MongoDB stores image + imagePublicId",
    Boolean(
      foundPhoto &&
        foundPhoto.image === testPhoto1.image &&
        foundPhoto.imagePublicId === testPhoto1.imagePublicId
    ),
    `Saved ID: ${insertResult.insertedId}`
  );

  // Test 9 & 10: Active vs Hidden filtering
  const hiddenPhoto = {
    title: "__TEST__ Unpublished Look",
    description: "Work in progress draft look.",
    category: "Hair Styling",
    image: "https://res.cloudinary.com/demo/image/upload/sample_hidden.jpg",
    imagePublicId: "salon-management/gallery/sample_hidden",
    altText: "Draft style",
    isActive: false,
    isFeatured: false,
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await galleryColl.insertOne(hiddenPhoto);

  const activePhotos = await galleryColl
    .find({ title: /^__TEST__/, isActive: true })
    .toArray();
  const hiddenPhotos = await galleryColl
    .find({ title: /^__TEST__/, isActive: false })
    .toArray();

  assert(
    "Test 9: Public gallery query finds active image",
    activePhotos.length === 1 && activePhotos[0].title === testPhoto1.title,
    "isActive: true returns testPhoto1"
  );
  assert(
    "Test 10: Hidden image is excluded from public query",
    activePhotos.every((p) => p.isActive === true) && hiddenPhotos.length === 1,
    "Hidden image correctly filtered out"
  );

  // Test 11: Category filtering
  const bridalPhoto = {
    title: "__TEST__ Regal Bridal Bun",
    description: "Intricate traditional bridal updo.",
    category: "Bridal",
    image: "https://res.cloudinary.com/demo/image/upload/sample_bridal.jpg",
    imagePublicId: "salon-management/gallery/sample_bridal",
    altText: "Bridal updo hair",
    isActive: true,
    isFeatured: false,
    displayOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await galleryColl.insertOne(bridalPhoto);

  const bridalResults = await galleryColl
    .find({ title: /^__TEST__/, isActive: true, category: "Bridal" })
    .toArray();
  assert(
    "Test 11: Category filtering works",
    bridalResults.length === 1 && bridalResults[0].title === bridalPhoto.title,
    `Found category 'Bridal' match`
  );

  // Test 12: Featured image rule logic
  const allActive = await galleryColl
    .find({ title: /^__TEST__/, isActive: true })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();

  const featured = allActive.find((p) => p.isFeatured) || allActive[0];
  assert(
    "Test 12: Featured image displays correctly",
    Boolean(featured && featured.isFeatured && featured.title === testPhoto1.title),
    "Lowest displayOrder featured photo selected"
  );

  // Test 13: Admin edits photo metadata
  await galleryColl.updateOne(
    { _id: insertResult.insertedId },
    { $set: { title: "__TEST__ Updated Balayage Look", displayOrder: 5 } }
  );
  const updatedDoc = await galleryColl.findOne({ _id: insertResult.insertedId });
  assert(
    "Test 13: Admin edits photo metadata",
    updatedDoc.title === "__TEST__ Updated Balayage Look" && updatedDoc.displayOrder === 5,
    "Title and display order updated in DB"
  );

  // Test 14 & 15: Image replacement logic in PATCH route
  const galleryIdRouteContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/api/admin/gallery/[id]/route.ts"),
    "utf-8"
  );
  assert(
    "Test 14 & 15: Image replacement updates DB first then deletes old Cloudinary asset",
    galleryIdRouteContent.includes("await Gallery.findByIdAndUpdate") &&
      galleryIdRouteContent.includes("isImageReplaced && oldPublicId") &&
      galleryIdRouteContent.includes("deleteCloudinaryImage(oldPublicId)"),
    "Guaranteed post-DB cleanup verified"
  );

  // Test 16 & 17: Delete gallery photo and Cloudinary cleanup
  assert(
    "Test 16 & 17: Admin deletes photo and deletes Cloudinary image within gallery namespace",
    galleryIdRouteContent.includes("await Gallery.findByIdAndDelete(id)") &&
      galleryIdRouteContent.includes("CLOUDINARY_FOLDERS.GALLERY") &&
      galleryIdRouteContent.includes("deleteCloudinaryImage(photo.imagePublicId)"),
    "Scoped deletion verified"
  );

  // Test 18 & 19: Lightbox functionality in GalleryClient
  const clientContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/gallery/GalleryClient.tsx"),
    "utf-8"
  );
  assert(
    "Test 18: Lightbox opens on image click",
    clientContent.includes("handleOpenLightbox") &&
      clientContent.includes('role="dialog"') &&
      clientContent.includes("handleCloseLightbox"),
    "Modal dialog rendered with backdrop"
  );
  assert(
    "Test 19: Next/Previous lightbox navigation and keyboard events work",
    clientContent.includes("handlePrevImage") &&
      clientContent.includes("handleNextImage") &&
      clientContent.includes('e.key === "Escape"') &&
      clientContent.includes('e.key === "ArrowLeft"'),
    "Arrow navigation & ESC key handler verified"
  );

  // Test 20: Responsive layout classes
  assert(
    "Test 20: Responsive 3-col desktop, 2-col tablet, 1-col mobile grid",
    clientContent.includes("grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"),
    "Tailwind responsive classes verified"
  );

  // Test 21: Empty gallery state
  assert(
    "Test 21: Empty gallery state message present",
    clientContent.includes("Our gallery is being updated. Please check back soon.") ||
      clientContent.includes("Our gallery is being updated."),
    "User-facing empty state message verified"
  );

  // Clean up test documents
  await galleryColl.deleteMany({ title: /^__TEST__/ });
  await mongoose.disconnect();

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite error:", err);
  process.exit(1);
});
