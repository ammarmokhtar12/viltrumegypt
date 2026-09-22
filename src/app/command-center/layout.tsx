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
  Home,
  Calculator,
  FileSpreadsheet,
  Package,
  Database,
  Users,
  DollarSign,
  Percent,
  Truck,
  ArrowLeftRight,
} from "lucide-react";

const ALL_NAV = [
  { href: "/command-center",              label: "Dashboard",    icon: BarChart3       },
  { href: "/command-center/orders",       label: "Orders",       icon: ShoppingCart    },
  { href: "/command-center/safwa",        label: "Safwa",        icon: Truck           },
  { href: "/command-center/returns",      label: "Returns",      icon: RotateCcw       },
  { href: "/command-center/replacements", label: "Replacements", icon: ArrowLeftRight  },
  { href: "/command-center/manufacturing",label: "Mfg",          icon: Factory         },
  { href: "/command-center/ad-spend",     label: "Ad Spend",     icon: Megaphone       },
  { href: "/command-center/profit",       label: "Profit",       icon: Calculator      },
  { href: "/command-center/reports",      label: "Reports",      icon: FileSpreadsheet },
  { href: "/command-center/upload",       label: "Upload",       icon: Upload          },
  { href: "/command-center/analytics",    label: "Analytics",    icon: TrendingUp      },
  { href: "/command-center/overview",     label: "Store",        icon: Home            },
  { href: "/command-center/products",     label: "Products",     icon: Package         },
  { href: "/command-center/inventory",    label: "Inventory",    icon: Database        },
  { href: "/command-center/customers",    label: "Customers",    icon: Users           },
  { href: "/command-center/expenses",     label: "Expenses",     icon: DollarSign      },
  { href: "/command-center/affiliates",   label: "Affiliates",   icon: Percent         },
];

export default function CommandCenterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans flex flex-col">
      {/* PWA meta */}
      <meta name="theme-color" content="#0a0a0a" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-zinc-800/60">
        {/* Brand + Logout row */}
        <div className="flex items-center justify-between px-4 sm:px-6 h-12 border-b border-zinc-800/40">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight text-white">VILTRUM</span>
            <span className="text-[8px] font-bold text-red-500 tracking-[0.3em] uppercase border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded">
              CMD
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <Home size={11} /> Storefront
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-red-500/70 hover:text-red-400 border border-zinc-800 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={11} /> Sign Out
            </button>
          </div>
        </div>

        {/* Nav tabs — horizontally scrollable */}
        <nav className="overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-0.5 px-3 py-2 min-w-max">
            {ALL_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-150 ${
                    active
                      ? "bg-red-500/15 text-red-400 border border-red-500/25"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
                  }`}
                >
                  <item.icon size={13} className={active ? "text-red-400" : "text-zinc-600"} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
