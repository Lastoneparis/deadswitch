import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import WalletConnect from "@/components/WalletConnect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeadSwitch — Your Crypto Shouldn't Die With You",
  description: "Decentralized dead man's switch for crypto inheritance. If you stop checking in, your family recovers your funds. Chainlink-automated. World ID-verified. On-chain.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "DeadSwitch — Your Crypto Shouldn't Die With You",
    description: "Decentralized crypto inheritance. If you stop checking in, your family gets your crypto. No lawyer. No company. Just math.",
    url: "https://deadswitch.online",
    siteName: "DeadSwitch",
    images: [{ url: "https://deadswitch.online/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeadSwitch — Your Crypto Shouldn't Die With You",
    description: "Decentralized crypto inheritance. Chainlink-automated. World ID-verified.",
    images: ["https://deadswitch.online/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <Providers>
          <Sidebar />
          <div className="flex-1 lg:ml-64">
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
              <div className="flex items-center justify-between px-6 py-3">
                <div />
                <WalletConnect />
              </div>
            </header>
            <main className="p-6 lg:p-10 max-w-6xl mx-auto">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
