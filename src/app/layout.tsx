
import type { Metadata } from "next";
import "./globals.css";
import WhatsAppWidget from "@/components/ui/WhatsAppWidget";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { Sparkles, LayoutDashboard } from "lucide-react";

export const metadata: Metadata = {
  title: "Prime Apparel Exports | B2B Wholesale Kurtis & Suit Sets",
  description: "India's most reliable B2B ladies ethnic wear wholesale partner. Surat sourcing variety, Mumbai strict QC control, WhatsApp-first service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased flex flex-col min-h-screen text-slate-100 bg-slate-950">
        {/* Mobile NavBar */}
        <NavBar />
        {/* Premium B2B Header Navbar */}
        <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-md border-b border-gold/10 px-4 md:px-12 py-3 md:py-4 flex items-center justify-between hidden md:flex">
          <div className="flex flex-col">
            <Link href="/" className="flex items-center gap-1.5 group">
              <Sparkles className="md:w-5 md:h-5 w-4 h-4 text-gold group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-outfit font-bold tracking-tight text-lg text-white group-hover:text-gold transition-colors">
                PRIME APPAREL
              </span>
            </Link>
            <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Surat Trends, Mumbai Discipline</span>
          </div>

          <nav className="flex items-center gap-4 md:gap-7 text-sm font-medium">
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
            <Link href="/catalog" className="hover:text-gold transition-colors">Catalog</Link>
            <Link href="/register" className="py-1.5 px-4 rounded-full border border-gold/30 hover:border-gold hover:bg-gold/10 transition-all text-sm text-gold font-semibold">
              Register B2B
            </Link>
            <Link href="/login" className="flex items-center gap-1 hover:text-gold transition-colors text-[13px]">
              Login
            </Link>
          </nav>
        </header>

        {/* Global Content */}
        <main className="flex-grow flex flex-col">
          {children}
        </main>

        {/* Dynamic WhatsApp CTAs */}
        <WhatsAppWidget />
      </body>
    </html>
  );
}
