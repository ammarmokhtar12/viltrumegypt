"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/layout/BrandLogo";

export default function Footer() {
  const router = useRouter();
  const [clickCount, setClickCount] = useState(0);
  const [bloggerClickCount, setBloggerClickCount] = useState(0);

  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newCount = clickCount + 1;
    if (newCount >= 3) {
      router.push("/admin");
      setClickCount(0);
    } else {
      setClickCount(newCount);
      setTimeout(() => setClickCount(0), 1000);
    }
  };

  const handleBloggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newCount = bloggerClickCount + 1;
    if (newCount >= 3) {
      router.push("/influencer");
      setBloggerClickCount(0);
    } else {
      setBloggerClickCount(newCount);
      setTimeout(() => setBloggerClickCount(0), 1000);
    }
  };

  return (
    <footer className="bg-[#111111] text-white pt-16 pb-8 font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-zinc-800 pb-12 gap-8">
          <BrandLogo variant="light" size="md" />
          <nav className="flex flex-wrap gap-x-10 gap-y-4 uppercase text-[9px] font-semibold tracking-[0.2em] font-sans">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              Collections
            </Link>
            <Link href="/products" className="text-zinc-400 hover:text-white transition-colors">
              Archive
            </Link>
            <Link href="/checkout" className="text-zinc-400 hover:text-white transition-colors">
              Checkout
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229"}`}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-normal leading-tight text-white">
              We Design for the Modern Warrior.
            </h2>
          </div>
          <div className="flex flex-col md:items-end gap-6 text-left md:text-right">
            <a
              href="mailto:info@viltrumegypt.com"
              className="w-10 h-10 flex items-center justify-center border border-zinc-700 rounded-full hover:bg-white hover:text-black transition-all"
              aria-label="Email"
            >
              <Mail size={18} />
            </a>
            <div className="flex flex-col md:items-end">
              <span className="type-eyebrow !text-zinc-500 mb-1">Inquiries</span>
              <a
                href="mailto:info@viltrumegypt.com"
                className="text-xl md:text-2xl font-serif italic text-zinc-200 hover:text-white transition-colors"
              >
                info@viltrumegypt.com
              </a>
            </div>
          </div>
        </div>

        <hr className="border-zinc-800 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] text-viltrum-mist/30 tracking-[0.18em] uppercase">
            © {new Date().getFullYear()} VILTRUM EGYPT. Engineered by Ammar Mokhtar.
          </p>
          <div className="flex items-center gap-6 font-sans">
            <button
              onClick={handlePrivacyClick}
              className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <Link href="#" className="text-xs text-zinc-500 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <button
              onClick={handleBloggerClick}
              className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              Bloggers Dashboard
            </button>
            <Link
              href="/admin"
              className="w-1 h-1 bg-zinc-600 rounded-full opacity-0 hover:opacity-100 transition-opacity"
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
