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
  Users,
  Home,
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
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-black rounded-full" />
      </div>
    );
  }

  if (!authenticated) return null;

  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
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
      label: "System Users",
      icon: Users,
      active: pathname === "/admin/dashboard/users",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex text-black font-sans">
      {/* Top Navigation Bar on Mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 hover:text-black">
          <Menu size={24} />
        </button>
        <span className="font-bold text-lg">Dashboard</span>
        <button onClick={handleLogout} className="p-2 -mr-2 text-gray-600 hover:text-black">
          <LogOut size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex lg:flex-col ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link href="/admin/dashboard" className="font-bold text-xl tracking-tight">Admin<span className="text-gray-400">Panel</span></Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 hover:text-black">
             <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                item.active ? "bg-gray-100 text-black" : "text-gray-600 hover:bg-gray-50 hover:text-black"
              }`}
            >
              <item.icon size={18} className={item.active ? "text-black" : "text-gray-400"} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
           <Link href="/" className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <Home size={16} /> Storefront
           </Link>
           <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-red-600 border border-transparent rounded-md hover:bg-red-50 transition-colors">
              <LogOut size={16} /> Sign out
           </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
