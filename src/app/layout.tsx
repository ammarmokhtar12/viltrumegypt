import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://viltrumegypt.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "VILTRUM EGYPT — Forged in Strength",
    description:
      "Premium compression shirts built for warriors. Shop now.",
    type: "website",
    images: [{ url: "/viltrum-logo.png", width: 512, height: 512, alt: "Viltrum Egypt" }],
  },
};

import AuthProvider from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import ReferralTracker from "@/components/providers/ReferralTracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
              var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
              ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


              ttq.load('D85I6IRC77U26NJHKDKG');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1291786459608780');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1291786459608780&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <ReferralTracker />
            <Toaster position="top-center" expand={true} richColors closeButton />
            <Analytics />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
