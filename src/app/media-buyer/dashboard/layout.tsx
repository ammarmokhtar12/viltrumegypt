"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, LogOut } from "lucide-react";

export default function MediaBuyerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/media-buyer/check");
        if (res.ok) setAuthenticated(true);
        else router.push("/media-buyer");
      } catch {
        router.push("/media-buyer");
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/media-buyer/logout", { method: "POST" });
    router.push("/media-buyer");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.3em] text-zinc-500 uppercase font-bold">Loading</span>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f] border-b border-zinc-800/50 z-40 flex items-center justify-between px-4 sm:px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-wider text-white">VILTRUM</span>
            <span className="text-[9px] text-blue-400 font-bold tracking-[0.2em] uppercase ml-2">Media Buyer</span>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors">
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <main className="pt-14 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
