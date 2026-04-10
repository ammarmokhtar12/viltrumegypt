"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background">
      {/* Massive CTA Section */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-32 pb-16 lg:pt-56 lg:pb-32">
        <div className="flex flex-col border-b border-background/20 pb-16 lg:pb-32">
           <h2 className="text-[12vw] leading-[0.8] font-display font-bold uppercase tracking-tighter mb-12">
              JOIN THE<br />
              ARCHIVE
           </h2>
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mt-12 w-full">
              <p className="text-sm font-medium leading-relaxed max-w-sm text-background/70">
                 Secure access to tier-one tactical apparel. Authorized personnel receive priority drops and classified intelligence.
              </p>
              <Link
                href="/register"
                className="bg-background text-foreground flex items-center justify-center h-16 px-12 text-[10px] uppercase font-bold tracking-widest hover:bg-background/80 transition-colors"
              >
                Establish Identity
                <ArrowUpRight strokeWidth={1.5} size={16} className="ml-2" />
              </Link>
           </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mt-16 lg:mt-32">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-background/50 mb-8">Navigation</span>
              <Link href="/" className="text-base font-medium mb-4 hover:opacity-50 transition-opacity">Index</Link>
              <Link href="/products" className="text-base font-medium mb-4 hover:opacity-50 transition-opacity">Archive</Link>
              <Link href="/checkout" className="text-base font-medium mb-4 hover:opacity-50 transition-opacity">Checkout</Link>
           </div>
           
           <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-background/50 mb-8">Identity</span>
              <Link href="/login" className="text-base font-medium mb-4 hover:opacity-50 transition-opacity">Client Login</Link>
              <Link href="/register" className="text-base font-medium mb-4 hover:opacity-50 transition-opacity">Register</Link>
              <Link href="/admin" className="text-base font-medium mb-4 hover:opacity-50 transition-opacity">System Configurator</Link>
           </div>

           <div className="flex flex-col lg:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-background/50 mb-8">Comms</span>
              <a 
                 href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
                 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold uppercase tracking-tighter hover:opacity-50 transition-opacity"
              >
                 +20-103-142-9229
              </a>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-32 pt-8 border-t border-background/20 gap-8">
           <span className="text-4xl lg:text-5xl font-display font-bold tracking-tighter leading-none">
              VILTRUM EGYPT
           </span>
           <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
              © {new Date().getFullYear()} CORE SYSTEMS
           </span>
        </div>
      </div>
    </footer>
  );
}
