"use client";

import Image from "next/image";
import { useGlobalCustomization } from "@/components/customization/CustomizationProvider";

export default function FooterBackground() {
  const global = useGlobalCustomization();
  return (
    <Image
      src={global.publicFooter?.style?.backgroundImage?.url ?? "/images/footer-bg.jpg"}
      alt="Footer background decoration"
      fill
      sizes="100vw"
      className="object-cover object-left-bottom opacity-75"
      data-customization-role="backgroundImage"
      unoptimized={Boolean(global.publicFooter?.style?.backgroundImage?.url)}
    />
  );
}
