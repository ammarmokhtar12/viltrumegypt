"use client";

import { ShoppingBag, Menu, X, Phone, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart";
import BrandLogo from "@/components/layout/BrandLogo";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  onCartOpen: () => void;
}

export default function Navbar({ onCartOpen }: NavbarProps) {
  const totalItems = useCartStore((s) => s.totalItems);
  const itemCount = totalItems();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isBumping, setIsBumping] = useState(false);
  const [prevCount, setPrevCount] = useState(itemCount);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mounted && itemCount > prevCount) {
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 600);
      setPrevCount(itemCount);
      return () => clearTimeout(timer);
    } else if (itemCount !== prevCount) {
      setPrevCount(itemCount);
    }
  }, [itemCount, prevCount, mounted]);

  if (!mounted) return null;

  const linkClass =
    "font-sans text-foreground hover:text-accent transition-colors";

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? "glass-premium shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="eid-banner overflow-hidden py-2.5 border-b border-border-light/50 relative z-50 select-none rgb-shadow">
        <div className="marquee-container flex whitespace-nowrap">
          <div className="marquee-content flex gap-16 text-[10px] font-semibold uppercase tracking-[0.25em] px-4 font-sans">
            <span className="rgb-glow-text">
              VILTRUM ARMORY — COMPRESSION GEAR FORGED FOR HEROES · UNLEASH YOUR INNER VILTRUMITE
            </span>
            <span className="rgb-glow-text">
              VILTRUM ARMORY — COMPRESSION GEAR FORGED FOR HEROES · UNLEASH YOUR INNER VILTRUMITE
            </span>
          </div>
        </div>
      </div>

      <div
        className={`mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-500 ${
          scrolled ? "py-3" : "py-5"
        }`}
      >
        <div className="flex-shrink-0">
          <BrandLogo size="sm" />
        </div>

        <div className="hidden lg:flex items-center gap-12 uppercase tracking-[0.2em] text-[10px] font-semibold">
          <Link href="/#products" className={linkClass}>
            Collections
          </Link>
          <Link href="/products" className={linkClass}>
            Archive
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201132507383"}`}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Contact
          </a>

          {/* Dark Mode Toggle Desktop */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center p-2 rounded-full hover:bg-secondary/10 transition-colors text-foreground"
            title="Toggle Villain Mode"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme === "dark" ? "dark" : "light"}
                initial={{ y: -20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "dark" ? <Moon size={18} className="text-accent" /> : <Sun size={18} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-foreground font-sans">
            <Phone size={15} className="text-secondary" />
            <span>+201132507383</span>
          </div>

          <button
            id="cart-icon-target"
            onClick={onCartOpen}
            className={`flex items-center group relative p-1 transition-all ${
              isBumping ? "animate-cart-shake" : ""
            }`}
            aria-label="Open cart"
          >
            <div className="relative">
              <ShoppingBag
                strokeWidth={1.5}
                size={26}
                className={`transition-colors duration-300 ${
                  isBumping ? "text-red-500 fill-red-500/20" : "text-foreground group-hover:text-accent"
                }`}
              />
              {itemCount > 0 && (
                <span className={`absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center text-white text-[10px] font-bold rounded-full font-sans transition-all duration-300 ${
                  isBumping ? "bg-red-500 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-secondary"
                }`}>
                  {itemCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-foreground hover:text-accent transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-0 z-40 bg-background/98 backdrop-blur-3xl flex flex-col pt-32 pb-10 px-8"
          >
            <div className="flex flex-col gap-6 flex-1">
              {[
                { name: "Collections", href: "/#products" },
                { name: "Archive", href: "/products" },
                { name: "Contact", href: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201132507383"}` },
              ].map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-display text-4xl font-bold text-foreground hover:text-accent transition-colors uppercase tracking-wider block border-b border-border-light pb-4"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.4 }}
                className="mt-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4 text-foreground">
                  <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201132507383"}`} className="p-3 bg-secondary/10 rounded-full hover:bg-accent hover:text-white transition-colors">
                    <Phone size={24} />
                  </a>
                </div>

                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-3 p-3 bg-secondary/10 rounded-full text-foreground hover:bg-secondary/20 transition-colors font-sans text-sm font-bold uppercase tracking-wider"
                >
                  {theme === "dark" ? (
                    <>
                      <Moon size={20} className="text-accent" />
                      Villain Mode
                    </>
                  ) : (
                    <>
                      <Sun size={20} />
                      Hero Mode
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
