import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import BottomNavBar from "@/components/BottomNavBar";
import TopBar from "@/components/TopBar";
import { UserProvider } from "@/context/UserContext";
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { createBaseMetadata } from "@/utils/seo/metadata-factory";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { setupGlobalErrorHandler } from "@/utils/error-tracking";
import { CurrencyProvider } from "@/context/CurrencyContext";

// Setup global error tracking
if (typeof window !== "undefined") {
  setupGlobalErrorHandler();
}

const bodyClasses =
  "min-h-screen bg-radiance-creamBackgroundColor text-radiance-charcoalTextColor font-sans antialiased pt-20";

export const metadata: Metadata = createBaseMetadata({
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://jradianceco.com",
  siteName: "JRADIANCE",
  defaultTitle: "JRADIANCE | Premium Cosmetics & Skincare",
  defaultDescription:
    "Authentic skincare and cosmetics for the radiant Nigerian soul.",
  locale: "en_NG",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "JRADIANCE",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://jradianceco.com",
    logo: `${process.env.NEXT_PUBLIC_BASE_URL || "https://jradianceco.com"}/logo-removebg.png`,
    description:
      "Authentic skincare and cosmetics for the radiant Nigerian soul.",
    founder: "Philip Depaytez",
    foundingDate: "2024",
    areaServed: ["NG", "US", "GB", "ZA"],
    brand: {
      "@type": "Brand",
      name: "JRADIANCE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English"],
    },
    sameAs: [
      "https://www.facebook.com/jradianceco",
      "https://www.instagram.com/jradianceco",
      "https://twitter.com/jradianceco",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClasses} suppressHydrationWarning>
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        <ToastProvider>
          <UserProvider>
            <CurrencyProvider>
              <CartProvider>
                <WishlistProvider>
                  <TopBar />

                  <main className="pb-20 md:pb-0">{children}</main>

                  <Analytics />
                  <SpeedInsights />

                  <BottomNavBar />
                </WishlistProvider>
              </CartProvider>
            </CurrencyProvider>
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
