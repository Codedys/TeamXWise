import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import tabIcon from "./favicon.png";
import appleIcon from "./apple-icon.png";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
