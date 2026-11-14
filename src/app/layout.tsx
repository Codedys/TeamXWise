import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import tabIcon from "./favicon.png";
import appleIcon from "./apple-icon.png";
import "./globals.css";

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const interTight = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["800", "900"],
});

export const metadata: Metadata = {
  title: "Collect",
  description: "Gather group payments into a single Wise Jar from one link.",
  icons: {
    icon: { url: tabIcon.src, type: "image/png", sizes: "32x32" },
    shortcut: tabIcon.src,
    apple: { url: appleIcon.src, type: "image/png", sizes: "180x180" },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
