import React from "react";
import { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { connectDB } from "@/lib/mongodb";
import RetailProduct from "@/models/RetailProduct";
import SalonSettings from "@/models/SalonSettings";
import Branch from "@/models/Branch";
import ProductsHero from "@/components/products/ProductsHero";
import ProductsGridSection from "@/components/products/ProductsGridSection";
import WhyBuyFromSalvora from "@/components/products/WhyBuyFromSalvora";
import ProductsBottomCTA from "@/components/products/ProductsBottomCTA";
import { PublicRetailProduct } from "@/components/products/ProductCard";

import { normalizeWhatsAppNumber } from "@/lib/phone";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products Chosen For You | SALVORA Salon Beauty Essentials",
  description:
    "Discover our handpicked collection of professional salon and beauty retail products. 100% genuine hair care, skin care, nail care, and styling essentials recommended by Salvora.",
  openGraph: {
    title: "Products Chosen For You | SALVORA Salon Essentials",
    description:
      "Handpicked professional salon and beauty retail products recommended by beauty experts.",
    type: "website",
  },
};

export default async function ProductsPage() {
  let products: PublicRetailProduct[] = [];
  let salonName = "Salvora";
  let whatsappNumber = "";

  try {
    await connectDB();
    const [dbProducts, branches, totalBranchCount, settings] = await Promise.all([
      RetailProduct.find({ isActive: true })
        .populate("branchIds", "_id name whatsappNumber")
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean(),
      Branch.find({ isActive: true })
        .sort({ isMain: -1, displayOrder: 1, createdAt: 1 })
        .lean(),
      Branch.countDocuments(),
      SalonSettings.findOne().lean(),
    ]);

    if (settings && settings.salonName) {
      salonName = settings.salonName;
    }

    // Branch is the SINGLE SOURCE OF TRUTH for WhatsApp:
    // 1. active Main Branch.whatsappNumber
    // 2. first active branch.whatsappNumber
    // 3. Legacy SalonSettings fallback ONLY if Branch collection is completely empty
    const mainBranch = branches.find((b) => b.isMain);
    const mainBranchWhatsapp = normalizeWhatsAppNumber(mainBranch?.whatsappNumber);

    const firstActiveBranch = branches.find((b) => normalizeWhatsAppNumber(b.whatsappNumber));
    const firstActiveWhatsapp = normalizeWhatsAppNumber(firstActiveBranch?.whatsappNumber);

    if (mainBranchWhatsapp) {
      whatsappNumber = mainBranchWhatsapp;
    } else if (firstActiveWhatsapp) {
      whatsappNumber = firstActiveWhatsapp;
    } else if (totalBranchCount === 0 && settings?.whatsapp) {
      whatsappNumber = normalizeWhatsAppNumber(settings.whatsapp);
    } else {
      whatsappNumber = "";
    }

    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      products = dbProducts.map((p) => {
        let productBranchWhatsapp = "";
        if (Array.isArray(p.branchIds) && p.branchIds.length > 0) {
          const relevantBranch = p.branchIds.find(
            (b: unknown) =>
              b &&
              typeof b === "object" &&
              "whatsappNumber" in b &&
              normalizeWhatsAppNumber((b as { whatsappNumber?: string }).whatsappNumber)
          ) as { whatsappNumber?: string } | undefined;

          if (relevantBranch?.whatsappNumber) {
            productBranchWhatsapp = normalizeWhatsAppNumber(relevantBranch.whatsappNumber);
          }
        }

        return {
          _id: p._id.toString(),
          name: p.name,
          slug: p.slug,
          category: p.category,
          brand: p.brand,
          image: p.image,
          description: p.description,
          shortDescription: p.shortDescription,
          price: p.price,
          salePrice: p.salePrice ?? undefined,
          stockStatus: p.stockStatus,
          size: p.size,
          sku: p.sku,
          isFeatured: Boolean(p.isFeatured),
          branchWhatsapp: productBranchWhatsapp || undefined,
        };
      });
    }
  } catch (err) {
    console.error("Error loading products page data:", err);
    products = [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FB] text-stone-900">
      <Navbar />
      <main className="flex-1">
        <ProductsHero salonName={salonName} />
        <ProductsGridSection
          initialProducts={products}
          whatsappNumber={whatsappNumber}
          salonName={salonName}
        />
        <WhyBuyFromSalvora salonName={salonName} />
        <ProductsBottomCTA
          whatsappNumber={whatsappNumber}
          salonName={salonName}
        />
      </main>
      <Footer />
    </div>
  );
}
