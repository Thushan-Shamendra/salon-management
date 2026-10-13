"use client";

import Image from "next/image";
import { useGlobalCustomization } from "@/components/customization/CustomizationProvider";

export default function FooterBackground() {
  const global = useGlobalCustomization();
  const customImageUrl = global.publicFooter?.style?.backgroundImage?.url;
  if (!customImageUrl) return null;

  return (
    <Image
      src={customImageUrl}
      alt="Footer background decoration"
      fill
      sizes="100vw"
      className="object-cover object-left-bottom opacity-75"
      data-customization-role="backgroundImage"
      unoptimized
    />
  );
}
