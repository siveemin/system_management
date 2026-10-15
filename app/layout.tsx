import type { Metadata, Viewport } from "next";
import { Inter, Battambang, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { DrawerMenu } from "@/components/layout/DrawerMenu";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { SwipeHandler } from "@/components/layout/SwipeHandler";
import { StoreHydrator } from "@/components/StoreHydrator";
import { LanguageFontApplier } from "@/components/LanguageFontApplier";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const battambang = Battambang({
  weight: ["400", "700"],
  subsets: ["khmer", "latin"],
  variable: "--font-khmer",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Inventory",
  description: "Smart warehouse and inventory management.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} ${battambang.variable} ${playfair.variable} font-sans antialiased min-h-full bg-[#F7F3EE] text-[#1A150E]`} suppressHydrationWarning>
        {/* Hydrate store from localStorage after first render */}
        <StoreHydrator />
        {/* Switch to Battambang font when language is Khmer */}
        <LanguageFontApplier />
        {/* Swipe gesture handler (touch only) */}
        <SwipeHandler />
        {/* Slide-out drawer (mobile) */}
        <DrawerMenu />

        {/* Page shell */}
        <div className="flex min-h-screen">
          {/* Desktop sidebar */}
          <div className="hidden lg:flex">
            <Sidebar />
          </div>

          {/* Main content area */}
          <div className="flex flex-col flex-1 min-w-0 lg:pl-[220px]">
            {/* Mobile topbar only */}
            <div className="lg:hidden">
              <AppTopbar />
            </div>

            <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4 pb-24 lg:pb-10 overflow-y-auto max-w-7xl w-full mx-auto">
              {children}
            </main>

            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  );
}
