"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/check", { method: "GET" });
        if (res.ok) {
          setAuthenticated(true);
        } else {
          router.push("/admin");
        }
      } catch {
        router.push("/admin");
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-viltrum-red border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-[0.2em] text-foreground/60/30 uppercase">Authenticating</span>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Orders",
      icon: ShoppingCart,
      active: pathname === "/admin/dashboard",
    },
    {
      href: "/admin/dashboard/products",
      label: "Products",
      icon: Package,
      active: pathname === "/admin/dashboard/products",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3.5 flex items-center justify-between"
        style={{ background: "rgba(10, 10, 10, 0.98)", borderBottom: "1px solid rgba(240, 240, 240, 0.05)" }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-foreground/60/60 hover:text-foreground hover:bg-viltrum-white/5 transition-all"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-viltrum-red to-viltrum-red-dark flex items-center justify-center">
            <span className="text-white text-[10px] font-display font-black">V</span>
          </div>
          <span className="font-display font-bold text-sm tracking-[0.25em] text-foreground">
            ADMIN
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-foreground/60/40 hover:text-viltrum-red transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] z-40 transform transition-transform duration-500 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "rgba(14, 14, 14, 0.98)",
          borderRight: "1px solid rgba(240, 240, 240, 0.04)",
        }}
      >
        {/* Sidebar Brand */}
        <div className="p-6 pb-5"
          style={{ borderBottom: "1px solid rgba(240, 240, 240, 0.04)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-viltrum-red to-viltrum-red-dark flex items-center justify-center shadow-[0_0_20px_rgba(178,0,0,0.2)]">
              <span className="text-white font-display font-black text-sm">V</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-sm tracking-[0.2em] text-foreground">
                VILTRUM
              </h2>
              <p className="text-[10px] text-foreground/60/30 tracking-wide">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="p-4 space-y-1">
          <p className="text-[10px] tracking-[0.2em] text-foreground/60/25 uppercase font-semibold px-3 mb-3">
            Management
          </p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 group ${
                item.active
                  ? "bg-viltrum-red/10 text-viltrum-red border border-viltrum-red/15"
                  : "text-foreground/60/50 hover:bg-viltrum-white/4 hover:text-foreground border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={17} />
                {item.label}
              </div>
              {item.active && <ChevronRight size={14} className="opacity-50" />}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1"
          style={{ borderTop: "1px solid rgba(240, 240, 240, 0.04)" }}
        >
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium text-foreground/60/35 hover:text-foreground hover:bg-viltrum-white/4 transition-all duration-300"
          >
            <LayoutDashboard size={17} />
            View Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium text-foreground/60/35 hover:text-viltrum-red hover:bg-viltrum-red/5 transition-all duration-300 w-full"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-[260px] min-h-screen pt-[60px] lg:pt-0">
        <div className="p-5 sm:p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
