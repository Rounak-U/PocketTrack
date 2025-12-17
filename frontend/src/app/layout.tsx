import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { NotificationProvider } from "@/components/ui/notification-context";
import { NotificationContainer } from "@/components/ui/notification-container";
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
        <NotificationProvider>
          <Logo />
          {children}
          <NotificationContainer />
        </NotificationProvider>
      </body>
    </html>
  );
}
