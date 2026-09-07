"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, AlertTriangle, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MediaBuyerLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/media-buyer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/media-buyer/dashboard");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 rounded-xl">
            <BarChart3 size={24} />
          </div>
          <h1 className="text-xl font-bold text-white">Media Buyer Portal</h1>
          <p className="text-sm text-zinc-500 mt-1">Viltrum Egypt — Ad Performance</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 space-y-5">
          <div className="flex items-center gap-2 text-zinc-500">
            <Lock size={13} />
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">Secure Access</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter media buyer password"
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-all pr-12"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-blue-600 text-white px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
