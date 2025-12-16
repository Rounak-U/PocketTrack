import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TrendingUp } from "lucide-react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PocketTrack | Track Every Rupee",
  description: "Analyze your UPI spending, visualize expenses, and build smarter money habits with PocketTrack.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        {/* PocketTrack Logo */}
        <div className="fixed top-6 left-6 z-50 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-green-400" />
          <span className="text-white font-bold text-xl">
            PocketTrack
          </span>
        </div>
        
        {children}
      </body>
    </html>
  );
}
