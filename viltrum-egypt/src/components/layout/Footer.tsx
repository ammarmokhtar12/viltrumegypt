"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#211f1c] text-white pt-16 pb-8 font-sans selection:bg-secondary selection:text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-gray-800 pb-12 gap-8">
          <div>
            <Link href="/" className="flex flex-col leading-tight">
              <span className="text-[12px] font-bold tracking-[0.2rem] text-white">VILTRUM</span>
              <span className="text-[12px] font-medium tracking-[0.1rem] text-gray-500">COLLECTION</span>
            </Link>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-4">
            <Link href="/" className="text-sm font-normal text-gray-400 hover:text-white transition-colors">Home</Link>
            <Link href="/products" className="text-sm font-normal text-gray-400 hover:text-white transition-colors">Products</Link>
            <Link href="/checkout" className="text-sm font-normal text-gray-400 hover:text-white transition-colors">Checkout</Link>
            <Link href="/login" className="text-sm font-normal text-gray-400 hover:text-white transition-colors">Login</Link>
            <a 
               href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
               className="text-sm font-normal text-gray-400 hover:text-white transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal leading-tight">
              We Design for the Modern Warrior.
            </h2>
          </div>
          <div className="flex flex-col md:items-end gap-6 text-left md:text-right">
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 flex items-center justify-center border border-gray-700 rounded-full hover:bg-white hover:text-black transition-all">
                <Mail size={18} />
              </a>
            </div>
            <div className="flex flex-col md:items-end">
              <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">Inquiries</span>
              <span className="text-2xl font-light">info@viltrumegypt.com</span>
            </div>
          </div>
        </div>

        <hr className="border-gray-800 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500 italic">
            &copy; {new Date().getFullYear()} Viltrum Egypt. Engineered by Antigravity.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Terms of Service</Link>
            <Link 
              href="/admin" 
              className="w-1 h-1 bg-gray-600 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-default"
              aria-hidden="true"
            >
              .
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

