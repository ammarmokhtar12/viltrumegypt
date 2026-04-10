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
  Mail,
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
    {
      href: "/admin/dashboard/users",
      label: "Registered Users",
      icon: Mail,
      active: pathname === "/admin/dashboard/users",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 px-4 flex items-center justify-between bg-white border-b border-zinc-100 shadow-sm">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-zinc-500 hover:text-zinc-950 transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-950 text-white flex items-center justify-center rounded-md">
            <span className="text-[9px] font-display font-bold">V</span>
          </div>
          <span className="font-display text-sm tracking-[0.15em] text-zinc-950">VILTRUM</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-zinc-950 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
         className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-100 transform transition-transform duration-300 ease-out flex flex-col lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-zinc-950 text-white flex items-center justify-center rounded-lg shadow-sm">
               <span className="font-display font-bold text-xs">V</span>
             </div>
             <div>
               <p className="font-display text-sm tracking-[0.15em] text-zinc-950 leading-none">VILTRUM</p>
               <p className="text-[9px] text-zinc-400 tracking-wider mt-0.5">Admin Panel</p>
             </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-zinc-400 hover:text-zinc-950 transition-colors">
             <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="text-[9px] tracking-[0.25em] text-zinc-400 uppercase font-bold px-2 mb-4">
            Menu
          </p>
          <div className="space-y-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 text-[13px] font-semibold transition-all duration-300 rounded-xl ${
                  item.active
                    ? "bg-zinc-950 text-white shadow-md shadow-zinc-950/10"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                <item.icon size={18} className={item.active ? "text-white" : "text-zinc-400"} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-zinc-100 space-y-1.5 shrink-0 bg-zinc-50">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-3 text-[13px] font-semibold text-zinc-500 hover:text-zinc-950 hover:bg-white transition-all rounded-xl border border-transparent hover:border-zinc-200"
          >
            <LayoutDashboard size={18} />
            View Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 text-[13px] font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-all w-full rounded-xl border border-transparent hover:border-red-100"
          >
            <LogOut size={18} className="hover:text-red-600" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen pt-14 lg:pt-0 overflow-y-auto bg-zinc-50/50">
        <div className="p-4 sm:p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
