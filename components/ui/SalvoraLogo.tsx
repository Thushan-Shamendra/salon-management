import React from "react";
import Image from "next/image";

interface SalvoraLogoProps {
  theme?: "light" | "dark";
  className?: string;
  showIconOnly?: boolean;
}

export default function SalvoraLogo({
  theme = "light",
  className = "h-12 sm:h-14 w-auto",
  showIconOnly = false,
}: SalvoraLogoProps) {
  if (showIconOnly) {
    return (
      <Image
        src="/images/salvora-logo-light.png"
        alt="SALVORA"
        width={44}
        height={44}
        priority
        className={`object-contain rounded-lg ${className}`}
      />
    );
  }

  // theme="dark" is for dark backgrounds (e.g. footer, dark sidebar)
  // theme="light" is for light backgrounds (e.g. navbar, modals)
  const src =
    theme === "dark"
      ? "/images/salvora-logo-dark.png"
      : "/images/salvora-logo-light.png";

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Image
        src={src}
        alt="SALVORA"
        width={320}
        height={128}
        priority
        className="h-full w-auto object-contain"
      />
    </div>
  );
}
