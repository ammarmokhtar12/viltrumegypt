"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  ShoppingCart,
  RotateCcw,
  Factory,
  Megaphone,
  Upload,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Home,
  ChevronRight,
  Calculator,
  FileSpreadsheet,
  Package,
  Database,
  Users,
  DollarSign,
  Percent,
} from "lucide-react";

const ANALYTICS_NAV = [
  { href: "/command-center", label: "Dashboard", icon: BarChart3 },
  { href: "/command-center/orders", label: "Orders", icon: ShoppingCart },
  { href: "/command-center/returns", label: "Returns", icon: RotateCcw },
  { href: "/command-center/manufacturing", label: "Manufacturing", icon: Factory },
  { href: "/command-center/ad-spend", label: "Ad Spend", icon: Megaphone },
  { href: "/command-center/profit", label: "Profit Calc", icon: Calculator },
  { href: "/command-center/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/command-center/upload", label: "Upload Sheet", icon: Upload },
  { href: "/command-center/analytics", label: "Analytics", icon: TrendingUp },
];

const STORE_NAV = [
  { href: "/command-center/products", label: "Products", icon: Package },
  { href: "/command-center/inventory", label: "Inventory", icon: Database },
  { href: "/command-center/customers", label: "Customers", icon: Users },
  { href: "/command-center/expenses", label: "Expenses", icon: DollarSign },
  { href: "/command-center/affiliates", label: "Affiliates", icon: Percent },
];

export default function CommandCenterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/check");
        if (res.ok) setAuthenticated(true);
        else router.push("/admin");
      } catch {
        router.push("/admin");
      } finally {
        setChecking(false);
      }
    })();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase font-bold">Initializing Command Center</span>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  const isActive = (href: string) => {
    if (href === "/command-center") return pathname === "/command-center";
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
          active
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
        }`}
      >
        <item.icon size={17} className={active ? "text-red-400" : "text-zinc-600 group-hover:text-zinc-300"} />
        <span className="flex-1">{item.label}</span>
        {active && <ChevronRight size={14} className="text-red-500/50" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans flex">
      {/* PWA meta */}
      <meta name="theme-color" content="#0a0a0a" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f] border-b border-zinc-800/50 z-40 flex items-center justify-between px-4 backdrop-blur-xl">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-zinc-400 hover:text-white">
          <Menu size={22} />
        </button>
        <span className="text-sm font-bold tracking-wider uppercase text-zinc-300">Command Center</span>
        <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-400">
          <LogOut size={18} />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0f0f0f] border-r border-zinc-800/50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex lg:flex-col ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/50">
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">VILTRUM</h1>
            <p className="text-[9px] text-red-500 font-bold tracking-[0.3em] uppercase -mt-0.5">Command Center</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* Analytics Section */}
          <p className="px-4 pt-1 pb-2 text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Analytics</p>
          {ANALYTICS_NAV.map(renderNavItem)}

          {/* Divider */}
          <div className="!my-4 mx-4 border-t border-zinc-800/50" />

          {/* Store Management Section */}
          <p className="px-4 pt-1 pb-2 text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Store</p>
          {STORE_NAV.map(renderNavItem)}
        </nav>

        <div className="p-4 border-t border-zinc-800/50 space-y-2">
          <Link href="/" className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-medium text-zinc-500 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 hover:text-zinc-300 transition-colors">
            <Home size={14} /> Storefront
          </Link>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-medium text-red-500/70 rounded-xl hover:bg-red-500/10 transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
