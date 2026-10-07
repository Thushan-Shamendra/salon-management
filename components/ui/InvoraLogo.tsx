import React from "react";
import Image from "next/image";

interface InvoraLogoProps {
  theme?: "light" | "dark";
  className?: string;
  showIconOnly?: boolean;
}

export default function InvoraLogo({
  theme = "light",
  className = "h-9 sm:h-10 w-auto",
  showIconOnly = false,
}: InvoraLogoProps) {
  if (showIconOnly) {
    return (
      <Image
        src="/images/invora-icon.png"
        alt="INVORA"
        width={44}
        height={44}
        priority
        className={`object-contain rounded-lg ${className}`}
      />
    );
  }

  // Use precisely trimmed brand assets with zero empty top/bottom transparent padding
  const src =
    theme === "dark"
      ? "/images/invora-logo-dark-trimmed.png"
      : "/images/invora-logo-light-trimmed.png";

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Image
        src={src}
        alt="INVORA"
        width={355}
        height={91}
        priority
        className="h-full w-auto object-contain"
      />
    </div>
  );
}
