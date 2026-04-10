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
  BarChart3,
  Users,
  Mail,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-border-light border-t-foreground rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.2em] text-muted uppercase font-bold">
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
      label: "Overview",
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
      label: "Inventory",
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
      label: "Accounts",
      icon: Mail,
      active: pathname === "/admin/dashboard/users",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex overflow-hidden text-foreground">
      {/* Universal Top Header (Mobile & Context) */}
      <div className="fixed top-0 left-0 right-0 z-40 h-16 px-5 sm:px-8 flex items-center justify-between bg-surface/80 backdrop-blur-xl border-b border-border-light">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 text-secondary hover:text-foreground transition-all hover:bg-background rounded-lg lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary text-background flex items-center justify-center rounded-lg">
              <span className="text-xs font-display font-bold">V</span>
            </div>
            <div className="hidden sm:block">
               <p className="text-[10px] font-bold text-muted uppercase tracking-[0.25em] leading-none mb-1">Viltrum Admin</p>
               <p className="text-xs font-bold text-foreground tracking-tight leading-none uppercase">Console</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <Link
             href="/"
             className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-secondary bg-background border border-border-light rounded-lg hover:text-foreground transition-all uppercase tracking-wider"
           >
             <Home size={12} />
             Storefront
           </Link>
           <button
             onClick={handleLogout}
             className="w-9 h-9 flex items-center justify-center text-muted hover:text-red-500 transition-colors bg-background border border-border-light rounded-lg"
             title="Logout"
           >
             <LogOut size={16} />
           </button>
        </div>
      </div>

      {/* Sidebar Overlay/Drawer */}
      <aside
         className={`fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border-light transform transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-border-light shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary text-background flex items-center justify-center rounded-lg">
               <span className="font-display font-bold text-xs uppercase">V</span>
             </div>
             <div>
               <p className="text-[11px] font-bold tracking-[0.2em] text-foreground leading-none">VILTRUM</p>
               <p className="text-[9px] text-muted tracking-wide font-bold mt-1 uppercase">Management</p>
             </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-muted hover:text-foreground transition-colors hover:bg-background rounded-lg lg:hidden">
             <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-8">
          <p className="text-[10px] tracking-[0.25em] text-muted uppercase font-bold px-3 mb-6">
            Main Menu
          </p>
          <div className="space-y-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-xl ${
                  item.active
                    ? "bg-primary text-background shadow-lg shadow-primary/10"
                    : "text-secondary hover:bg-background hover:text-foreground"
                }`}
              >
                <item.icon size={16} className={item.active ? "text-background" : "text-muted group-hover:text-foreground"} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Context */}
        <div className="p-4 border-t border-border-light shrink-0">
          <div className="p-4 bg-background border border-border-light rounded-2xl flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-surface border border-border-light flex items-center justify-center text-[10px] font-bold text-foreground">
                AD
             </div>
             <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">Administrator</p>
                <p className="text-[10px] text-muted truncate">Admin Rights</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Universal Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full min-h-screen pt-16 overflow-y-auto bg-background transition-all lg:ml-72">
        <div className="p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
