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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 noise-bg">
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-viltrum-red flex items-center justify-center mx-auto mb-4 red-glow">
            <span className="text-white font-black text-2xl">V</span>
          </div>
          <h1 className="text-2xl font-black tracking-[0.3em] text-foreground">
            ADMIN
          </h1>
          <p className="text-sm text-foreground/30 mt-2">
            Viltrum Egypt Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-2 text-foreground/50">
            <Lock size={16} />
            <span className="text-sm tracking-widest uppercase">Secure Access</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 pr-12 bg-viltrum-gray border border-viltrum-white/10 rounded-xl text-foreground placeholder-viltrum-white/20 focus:outline-none focus:border-viltrum-red/50 transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/50"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
              className="w-full py-3 bg-viltrum-red text-white font-bold text-sm tracking-widest uppercase rounded-xl hover:bg-viltrum-red-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
