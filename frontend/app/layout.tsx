import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
import Navbar from "@/components/Navbar";
import OfflineIndicator from "@/components/OfflineIndicator";

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Rack Manager - Shoe Store Management",
  description: "Manage inventory, billing, and analytics for your shoe store",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rack Manager",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-[#0D0D0D] text-gray-200">
        <Navbar />
        {children}
        <OfflineIndicator />
      </body>
    </html>
  );
}
