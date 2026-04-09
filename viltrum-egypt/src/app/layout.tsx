import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VILTRUM EGYPT — Forged in Strength",
  description:
    "Premium compression shirts built for warriors. Inspired by Viltrumite strength. Shop the ultimate athletic wear from Viltrum Egypt.",
  keywords: [
    "compression shirts",
    "athletic wear",
    "Viltrum Egypt",
    "gym wear",
    "fitness apparel",
  ],
  openGraph: {
    title: "VILTRUM EGYPT — Forged in Strength",
    description:
      "Premium compression shirts built for warriors. Shop now.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} data-scroll-behavior="smooth">
      <body className="font-sans antialiased bg-[#0A0A0A] text-viltrum-white">{children}</body>
    </html>
  );
}
