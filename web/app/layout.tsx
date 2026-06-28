
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Image from "next/image";
import "./globals.css";
import { siteConfig } from "@/lib/site";
import { AuthProvider } from "@/components/auth/AuthProvider";

const neueMontreal = localFont({
  src: [
    {
      path: "../public/fonts/PPNeueMontreal-Medium.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/PPNeueMontreal-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/PPNeueMontreal-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/PPNeueMontreal-Bold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "BizzDeck — Smart Insights for Restaurants on Swiggy & Zomato",
    template: "%s · BizzDeck",
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  authors: [{ name: "BizzDeck" }],
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "BizzDeck — Restaurant Profitability on Swiggy & Zomato",
    description: siteConfig.description,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: "BizzDeck dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BizzDeck — Restaurant Profitability on Swiggy & Zomato",
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: "/assets/logo%20final.jpeg",
    shortcut: "/assets/logo%20final.jpeg",
    apple: "/assets/logo%20final.jpeg",
  },
  category: "business",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7FBF9" },
    { media: "(prefers-color-scheme: dark)", color: "#002E2E" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BizzDeck",
    url: siteConfig.url,
    logo: `${siteConfig.url}/assets/logo%20final.jpeg`,
    sameAs: [],
  };
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "BizzDeck",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "AggregateOffer", lowPrice: "999", highPrice: "3499", priceCurrency: "INR" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "120" },
    description: siteConfig.description,
  };

  return (
    <html lang="en" className={neueMontreal.variable} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link rel="preconnect" href="https://verify.msg91.com" crossOrigin="" />
        <link rel="preconnect" href="https://verify.phone91.com" crossOrigin="" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <div className="mobile-restriction" role="status" aria-live="polite">
          <div className="mobile-restriction__panel">
            <Image
              src="/assets/logo final.jpeg"
              alt="BizzDeck"
              width={120}
              height={48}
              className="mobile-restriction__logo"
              priority
            />
            <p className="mobile-restriction__eyebrow">Desktop experience</p>
            <h1>BizzDeck is not available on mobile phones.</h1>
            <p>Please open this dashboard on a tablet, laptop, desktop, or external monitor.</p>
          </div>
        </div>
        <div className="desktop-app-shell">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
