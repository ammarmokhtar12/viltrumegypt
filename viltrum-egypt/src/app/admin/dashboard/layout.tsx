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
  BarChart3,
  Users,
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
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
          <span className="text-xs tracking-[0.2em] text-zinc-400 uppercase font-medium">
            Loading dashboard
          </span>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: BarChart3,
      active: pathname === "/admin/dashboard",
    },
    {
      href: "/admin/dashboard/orders",
      label: "Orders",
      icon: ShoppingCart,
      active: pathname === "/admin/dashboard/orders",
    },
    {
      href: "/admin/dashboard/products",
      label: "Products",
      icon: Package,
      active: pathname === "/admin/dashboard/products",
    },
    {
      href: "/admin/dashboard/customers",
      label: "Customers",
      icon: Users,
      active: pathname === "/admin/dashboard/customers",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between bg-white border-b border-zinc-100 shadow-sm">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-900 text-white flex items-center justify-center rounded-sm">
            <span className="text-[9px] font-display font-bold">V</span>
          </div>
          <span className="font-display text-sm tracking-[0.15em] text-zinc-900">VILTRUM</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[250px] z-40 bg-white border-r border-zinc-100 transform transition-transform duration-500 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-zinc-100">
          <div className="w-8 h-8 bg-zinc-900 text-white flex items-center justify-center rounded-sm">
            <span className="font-display font-bold text-xs">V</span>
          </div>
          <div>
            <p className="font-display text-sm tracking-[0.15em] text-zinc-900 leading-none">VILTRUM</p>
            <p className="text-[9px] text-zinc-400 tracking-wider mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-5 flex-1">
          <p className="text-[9px] tracking-[0.25em] text-zinc-300 uppercase font-semibold px-3 mb-3">
            Menu
          </p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium transition-all duration-200 rounded-md ${
                  item.active
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-zinc-100 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all rounded-md"
          >
            <LayoutDashboard size={16} />
            View Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all w-full rounded-md"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-[250px] min-h-screen pt-14 lg:pt-0">
        <div className="p-5 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
