import type { Metadata } from "next";
import { pageMetadata, siteUrl } from "@/lib/seo";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import SiteNavigation from "@/components/layout/SiteNavigation";
import Footer from "@/components/layout/Footer";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import ConditionalSiteChrome from "@/components/layout/ConditionalSiteChrome";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  ...pageMetadata({ title: "Discover Events & Book Tickets" }),
  metadataBase: new URL(siteUrl),
  applicationName: "Tickety Africa",
  category: "Events and ticketing",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable}`}
    >
      <body className="flex min-h-screen flex-col font-body">
        <AuthSessionProvider>
          <ConditionalSiteChrome />

          <main className="flex-1">
            {children}
          </main>

          <ConditionalSiteChrome footer />

        </AuthSessionProvider>
      </body>
    </html>
  );
}