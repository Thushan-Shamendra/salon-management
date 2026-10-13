"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/ui/icons";
import { trackEvent } from "@/lib/analytics-client";
import { StockStatus } from "@/lib/retail-product-constants";
import { useBranchContext } from "@/components/context/BranchContext";
import { normalizeWhatsAppNumber } from "@/lib/phone";

export interface PublicRetailProduct {
  _id: string;
  name: string;
  slug: string;
  category: string;
  brand?: string;
  image: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  stockStatus: StockStatus;
  size?: string;
  sku?: string;
  isFeatured?: boolean;
  isMostPopular?: boolean;
  isFastMoving?: boolean;
  isDiscountProduct?: boolean;
  branchWhatsapp?: string;
}

interface ProductCardProps {
  product: PublicRetailProduct;
  whatsappNumber?: string;
  salonName?: string;
}

export default function ProductCard({
  product,
  whatsappNumber = "",
  salonName = "Salvora",
}: ProductCardProps) {
  const router = useRouter();
  const { selectedBranchWhatsapp } = useBranchContext();

  const isOutOfStock = product.stockStatus === "out_of_stock";
  const hasValidSalePrice =
    typeof product.salePrice === "number" &&
    product.salePrice >= 0 &&
    product.salePrice < product.price;

  const displayPrice = hasValidSalePrice ? (product.salePrice as number) : product.price;

  const discountPercent =
    hasValidSalePrice && product.price > 0
      ? Math.round(((product.price - (product.salePrice as number)) / product.price) * 100)
      : 0;

  const handleBuyClick = () => {
    trackEvent({
      eventType: "PRODUCT_CLICK",
      entityType: "RetailProduct",
      entityId: product._id,
      metadata: {
        label: product.name,
        category: product.category,
        source: "product-card",
      },
    });

    if (isOutOfStock) return;

    // Resolve WhatsApp number:
    // 1. selected/relevant branch.whatsappNumber
    // 2. active Main Branch.whatsappNumber
    // 3. first active branch.whatsappNumber
    // 4. if no WhatsApp number exists -> /contact
    const cleanPhone =
      normalizeWhatsAppNumber(selectedBranchWhatsapp) ||
      normalizeWhatsAppNumber(product.branchWhatsapp) ||
      normalizeWhatsAppNumber(whatsappNumber);

    if (!cleanPhone) {
      router.push("/contact");
      return;
    }

    const message = encodeURIComponent(
      `Hello ${salonName}! I am interested in purchasing "${product.name}" (LKR ${displayPrice.toLocaleString()}${
        product.sku ? `, SKU: ${product.sku}` : ""
      }). Could you please share availability and ordering details?`
    );

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-3.5 sm:p-4 shadow-2xs hover:shadow-lg transition-all duration-200">
      <div>
        {/* Product Image Frame (Matches Mockup Rounded Frame) */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Low Stock Pill */}
          {product.stockStatus === "low_stock" && (
            <span className="absolute top-2 left-2 rounded-full bg-amber-500/95 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              Low Stock
            </span>
          )}

          {/* Discount / Sale Badge */}
          {hasValidSalePrice && !isOutOfStock && (
            <span className="absolute top-2 right-2 rounded-full bg-[#03BF62] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs uppercase tracking-wider">
              {discountPercent > 0 ? `${discountPercent}% OFF` : "SALE"}
            </span>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="rounded-full bg-stone-900/90 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-3 space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-snug line-clamp-1 group-hover:text-[#03BF62] transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed min-h-[2rem]">
            {product.shortDescription || product.description || ""}
          </p>

          {/* Pricing Row */}
          <div className="pt-2 flex items-baseline gap-2">
            {hasValidSalePrice ? (
              <>
                <span className="text-sm sm:text-base font-extrabold text-stone-900">
                  LKR {(product.salePrice as number).toLocaleString()}
                </span>
                <span className="text-xs text-stone-400 line-through">
                  LKR {product.price.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-extrabold text-stone-900">
                LKR {product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Buy / Enquire Button (Matches Mockup) */}
      <div className="mt-3.5 pt-1">
        <button
          type="button"
          onClick={handleBuyClick}
          disabled={isOutOfStock}
          className={`w-full rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            isOutOfStock
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-[#ECEBEF] text-stone-800 hover:bg-[#03BF62] hover:text-white shadow-2xs active:scale-[0.98]"
          }`}
          aria-label={isOutOfStock ? `${product.name} is out of stock` : `Buy ${product.name}`}
        >
          <span>{isOutOfStock ? "Out of Stock" : "Buy Now"}</span>
          {!isOutOfStock && <ArrowRightIcon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
