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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
          <span className="text-[11px] tracking-[0.25em] text-zinc-400 uppercase font-semibold">
            Authenticating
          </span>
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
    <div className="min-h-screen bg-zinc-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3.5 flex items-center justify-between bg-white border-b border-zinc-100">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-zinc-900 text-white flex items-center justify-center rounded-sm">
            <span className="text-[10px] font-display font-bold">V</span>
          </div>
          <span className="font-display text-sm tracking-[0.2em] text-zinc-900">
            ADMIN
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] z-40 bg-white border-r border-zinc-100 transform transition-transform duration-500 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Brand */}
        <div className="p-6 pb-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 text-white flex items-center justify-center rounded-sm">
              <span className="font-display font-bold text-sm">V</span>
            </div>
            <div>
              <h2 className="font-display text-sm tracking-[0.2em] text-zinc-900">
                VILTRUM
              </h2>
              <p className="text-[10px] text-zinc-400 tracking-wide">
                Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="p-4 space-y-1">
          <p className="text-[10px] tracking-[0.25em] text-zinc-300 uppercase font-semibold px-3 mb-3">
            Management
          </p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-4 py-3 text-[13px] font-medium transition-all duration-300 group rounded-sm ${
                item.active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={17} />
                {item.label}
              </div>
              {item.active && (
                <ChevronRight size={14} className="opacity-50" />
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1 border-t border-zinc-100">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all duration-300 rounded-sm"
          >
            <LayoutDashboard size={17} />
            View Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300 w-full rounded-sm"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
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
