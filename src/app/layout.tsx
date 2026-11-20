import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const deploymentHost =
  process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (deploymentHost ? `https://${deploymentHost}` : undefined);

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "Girls in Tech | TUT ICT",
  description:
    "Limitless minds. Infinite Code. Find your people, grow your skills, and shape the future of tech with Girls in Tech at TUT Faculty of ICT.",
  openGraph: {
    title: "Girls in Tech | TUT ICT",
    description: BRAND.motto,
    siteName: "Girls in Tech · TUT Faculty of ICT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Girls in Tech | TUT ICT",
    description: BRAND.motto,
  },
  icons: {
    icon: "/brand/git-favicon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <div id="main-content" className="flex-1">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
