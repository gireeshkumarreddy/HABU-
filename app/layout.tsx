import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ExperienceProvider } from "@/components/providers/experience-provider";
import { IntroSequence } from "@/components/intro/intro-sequence";
import { SiteHeader } from "@/components/layout/site-header";
import { SITE } from "@/lib/site";
import "./globals.css";

// Luxury-modern cinematic grotesque (from the client's approved list) —
// self-hosted by next/font, variable weights, Apple-adjacent metrics.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "deep sea exploration",
    "exosuit",
    "underwater technology",
    "dive systems",
    "HABU",
  ],
  openGraph: {
    title: `${SITE.name} — Built Beyond Human Limits.`,
    description: SITE.description,
    type: "website",
    locale: "en_US",
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Built Beyond Human Limits.`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#020B16",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="bg-abyss font-sans text-white antialiased">
        <ExperienceProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <IntroSequence />
          <SiteHeader />
          <main id="main">{children}</main>
        </ExperienceProvider>
      </body>
    </html>
  );
}
