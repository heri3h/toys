import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Toys & Play Guide - International Portal",
  description: "Explore the most engaging car toys for kids, RC speedsters, and creative play sets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
