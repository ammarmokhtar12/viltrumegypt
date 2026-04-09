import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
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
    <html
      lang="en"
      className={`${manrope.variable} ${bebasNeue.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
