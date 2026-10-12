import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { customizationFontVariables } from "@/lib/customization-fonts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { BranchProvider } from "@/components/context/BranchContext";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import PageViewTracker from "@/components/analytics/PageViewTracker";

export const metadata: Metadata = {
  title: "SALVORA | Look Beautiful. Feel Confident.",
  description:
    "Experience professional beauty and hair care services designed to help you look and feel your best. Premium styling, treatments, and bridal care.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${customizationFontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BranchProvider>
          <PageViewTracker />
          {children}
          <FloatingWhatsApp />
        </BranchProvider>
      </body>
    </html>
  );
}
