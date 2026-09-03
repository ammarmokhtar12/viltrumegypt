"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
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
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin/dashboard");
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
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center mx-auto mb-4 rounded-xl">
            <span className="font-display text-xl">V</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Admin Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1">Viltrum Egypt Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-7 space-y-5">
          <div className="flex items-center gap-2 text-gray-500">
            <Lock size={13} />
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">
              Secure Access
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white font-sans text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all pr-12"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full inline-flex items-center justify-center font-sans bg-gray-900 text-white px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
