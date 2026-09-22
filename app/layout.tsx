import type { Metadata } from "next";
import { Inter, Battambang } from "next/font/google";
import "./globals.css";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { DrawerMenu } from "@/components/layout/DrawerMenu";
import { BottomNav } from "@/components/layout/BottomNav";
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

export const metadata: Metadata = {
  title: "Smart Inventory",
  description: "Smart warehouse and inventory management.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
} as any;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} ${battambang.variable} font-sans antialiased min-h-full bg-[#edf2ed] text-[#1e2e14]`} suppressHydrationWarning>
        {/* Hydrate store from localStorage after first render */}
        <StoreHydrator />
        {/* Switch to Battambang font when language is Khmer */}
        <LanguageFontApplier />
        {/* Swipe gesture handler (touch only) */}
        <SwipeHandler />
        {/* Slide-out drawer */}
        <DrawerMenu />

        {/* Page shell */}
        <div className="flex flex-col min-h-screen">
          <AppTopbar />

          <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto max-w-4xl w-full mx-auto">
            {children}
          </main>

          <BottomNav />
        </div>
      </body>
    </html>
  );
}
