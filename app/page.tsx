import { PageCustomization } from "@/components/customization/PageCustomization";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import AboutPreview from "@/components/home/AboutPreview";
import FeaturedServices from "@/components/home/FeaturedServices";
import WeddingPreview from "@/components/home/WeddingPreview";
import WeddingPackagesPreview, {
  HomeWeddingPackageData,
} from "@/components/home/WeddingPackagesPreview";
import ProductsPreview from "@/components/home/ProductsPreview";
import PromotionsPreview from "@/components/home/PromotionsPreview";
import { PublicRetailProduct } from "@/components/products/ProductCard";
import { PublicPromotion } from "@/components/promotions/PromotionCard";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import BeauticiansPreview from "@/components/home/BeauticiansPreview";
import GalleryPreview from "@/components/home/GalleryPreview";
import ReviewPreview from "@/components/home/ReviewPreview";
import BookingCTA from "@/components/home/BookingCTA";
import BranchesPreview, {
  HomeBranchCardData,
} from "@/components/home/BranchesPreview";
import Footer from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import SalonSettings, { normalizePageVisibility } from "@/models/SalonSettings";
import Branch from "@/models/Branch";
import Service from "@/models/Service";
import WeddingPackage from "@/models/WeddingPackage";
import RetailProduct from "@/models/RetailProduct";
import Promotion from "@/models/Promotion";
import { normalizeWhatsAppNumber } from "@/lib/phone";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let bookingUrl = "";
  let serviceCount = 0;
  let weddingPackages: HomeWeddingPackageData[] = [];
  let products: PublicRetailProduct[] = [];
  let promotions: PublicPromotion[] = [];
  let homeBranches: HomeBranchCardData[] = [];
  let whatsappNumber = "";
  let salonName = "Salvora";
  let pageVisibility = normalizePageVisibility(null);

  try {
    await connectDB();
    const now = new Date();
    const [settings, branchDocs, count, packagesDoc, dbProducts, dbPromotions] = await Promise.all([
      SalonSettings.findOne().lean(),
      Branch.find({ isActive: true })
        .sort({ isMain: -1, displayOrder: 1, name: 1 })
        .limit(3)
        .lean(),
      Service.countDocuments({ isActive: { $ne: false } }),
      WeddingPackage.find({ isActive: true })
        .sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })
        .limit(3)
        .lean(),
      RetailProduct.find({ isActive: true })
        .populate("branchIds", "_id name whatsappNumber")
        .sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })
        .limit(4)
        .lean(),
      Promotion.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
        .populate("branchIds", "_id name whatsappNumber")
        .sort({ isFeatured: -1, displayOrder: 1, endDate: 1 })
        .limit(3)
        .lean(),
    ]);

    if (settings) {
      if (settings.salonName) {
        salonName = settings.salonName;
      }
      if (settings.externalSystem?.bookingUrl) {
        bookingUrl = settings.externalSystem.bookingUrl;
      }
      pageVisibility = normalizePageVisibility(settings.pageVisibility);
    }

    const branchDoc = branchDocs.find((b) => b.isMain) || branchDocs[0];
    const mainBranchWhatsapp = normalizeWhatsAppNumber(branchDoc?.whatsappNumber);
    if (mainBranchWhatsapp) {
      whatsappNumber = mainBranchWhatsapp;
    } else {
      const firstBranchWithWa = branchDocs.find((b) => normalizeWhatsAppNumber(b.whatsappNumber));
      if (firstBranchWithWa) {
        whatsappNumber = normalizeWhatsAppNumber(firstBranchWithWa.whatsappNumber);
      } else if (settings?.whatsapp) {
        whatsappNumber = normalizeWhatsAppNumber(settings.whatsapp);
      }
    }

    if (Array.isArray(branchDocs) && branchDocs.length > 0) {
      homeBranches = branchDocs.slice(0, 3).map((b) => ({
        _id: b._id.toString(),
        name: b.name,
        slug: b.slug,
        phone: b.phone || "",
        whatsappNumber: b.whatsappNumber || undefined,
        email: b.email || undefined,
        address: b.address || "",
        latitude: typeof b.latitude === "number" ? b.latitude : undefined,
        longitude: typeof b.longitude === "number" ? b.longitude : undefined,
        googleMapsUrl: b.googleMapsUrl || undefined,
        isMain: Boolean(b.isMain),
        openingHours: Array.isArray(b.openingHours)
          ? b.openingHours.map((h) => ({
              day: String(h.day),
              isClosed: Boolean(h.isClosed),
              openTime: h.openTime ? String(h.openTime) : undefined,
              closeTime: h.closeTime ? String(h.closeTime) : undefined,
            }))
          : undefined,
      }));
    }

    serviceCount = count;

    if (Array.isArray(packagesDoc) && packagesDoc.length > 0) {
      weddingPackages = packagesDoc.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description || "",
        image: p.image || "",
        includedItems: Array.isArray(p.includedItems) ? p.includedItems : [],
        price: typeof p.price === "number" ? p.price : 0,
        durationText: p.durationText || "",
        isFeatured: Boolean(p.isFeatured),
      }));
    }

    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      products = dbProducts.map((p) => {
        let bPhone = "";
        if (Array.isArray(p.branchIds) && p.branchIds.length > 0) {
          const firstB = p.branchIds[0] as unknown as { whatsappNumber?: string };
          if (firstB?.whatsappNumber) {
            bPhone = firstB.whatsappNumber;
          }
        }
        return {
          _id: p._id.toString(),
          name: p.name,
          slug: p.slug,
          category: p.category,
          brand: p.brand || undefined,
          image: p.image,
          description: p.description || undefined,
          shortDescription: p.shortDescription || undefined,
          price: p.price,
          salePrice: p.salePrice || undefined,
          stockStatus: p.stockStatus,
          size: p.size || undefined,
          sku: p.sku || undefined,
          isFeatured: Boolean(p.isFeatured),
          branchWhatsapp: bPhone || undefined,
        };
      });
    }

    if (Array.isArray(dbPromotions) && dbPromotions.length > 0) {
      promotions = dbPromotions.map((p) => {
        let bPhone = "";
        if (Array.isArray(p.branchIds) && p.branchIds.length > 0) {
          const firstB = p.branchIds[0] as unknown as { whatsappNumber?: string };
          if (firstB?.whatsappNumber) {
            bPhone = firstB.whatsappNumber;
          }
        }
        return {
          _id: p._id.toString(),
          title: p.title,
          slug: p.slug,
          subtitle: p.subtitle || undefined,
          description: p.description,
          promoType: p.promoType,
          badgeText: p.badgeText,
          image: p.image,
          originalPrice: p.originalPrice || undefined,
          promotionalPrice: p.promotionalPrice || undefined,
          validDaysText: p.validDaysText || undefined,
          startDate: p.startDate ? new Date(p.startDate).toISOString() : "",
          endDate: p.endDate ? new Date(p.endDate).toISOString() : "",
          ctaType: p.ctaType,
          ctaCustomLabel: p.ctaCustomLabel || undefined,
          ctaCustomUrl: p.ctaCustomUrl || undefined,
          isFeatured: Boolean(p.isFeatured),
          branchWhatsapp: bPhone || undefined,
        };
      });
    }
  } catch {
    // Graceful fallback
  }

  return (
    <PageCustomization scope="public" pageKey="home">
    <div className="min-h-screen flex flex-col bg-white text-stone-900 selection:bg-[#03BF62]/30 selection:text-stone-900">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero */}
        <HeroSection bookingUrl={bookingUrl} serviceCount={serviceCount} />

        {/* 3. About preview */}
        <AboutPreview />

        {/* 4. Featured Services */}
        <FeaturedServices bookingUrl={bookingUrl} />

        {/* 5. Wedding Beauty Promotional Section & Packages Preview */}
        {pageVisibility.wedding && (
          <>
            <WeddingPreview />
            <WeddingPackagesPreview packages={weddingPackages} />
          </>
        )}

        {/* 5c. Products Preview Section (Max 4, Real Data Only, Hidden if 0) */}
        {pageVisibility.products && (
          <ProductsPreview
            products={products}
            whatsappNumber={whatsappNumber}
            salonName={salonName}
          />
        )}

        {/* 5d. Promotions Preview Section (Max 3, Real Data Only, Hidden if 0) */}
        {pageVisibility.promotions && (
          <PromotionsPreview
            promotions={promotions}
            whatsappNumber={whatsappNumber}
            bookingUrl={bookingUrl}
            salonName={salonName}
          />
        )}

        {/* 6. Why Choose Salvora */}
        <WhyChooseUs />

        {/* 6. Meet Our Beauty Experts */}
        <BeauticiansPreview />

        {/* 7. Gallery preview */}
        {pageVisibility.gallery && <GalleryPreview />}

        {/* 8. Google Reviews preview */}
        <ReviewPreview />

        {/* 9. Booking CTA */}
        <BookingCTA bookingUrl={bookingUrl} />

        {/* 10. Contact Us Branches Preview (Max 3, Real Data Only) */}
        <BranchesPreview branches={homeBranches} />
      </main>

      {/* 11. Footer */}
      <Footer />
    </div>
    </PageCustomization>
  );
}
