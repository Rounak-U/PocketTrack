import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";
import { NotificationProvider } from "@/components/ui/notification-context";
import { NotificationContainer } from "@/components/ui/notification-container";
import { FontLoader } from "@/components/FontLoader";
import "./globals.css";

export const metadata: Metadata = {
  title: "PocketTrack | Track Every Rupee",
  description: "Analyze your UPI spending, visualize expenses, and build smarter money habits with PocketTrack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <FontLoader />
        <NotificationProvider>
          <Logo />
          {children}
          <NotificationContainer />
        </NotificationProvider>
      </body>
    </html>
  );
}
