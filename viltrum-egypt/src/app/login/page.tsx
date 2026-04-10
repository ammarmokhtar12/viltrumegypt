"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12">
      <div className="max-w-sm w-full px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-10">
          <ArrowLeft size={15} />
          Back to Store
        </Link>
        
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-background font-display text-lg">V</span>
          </div>
          <span className="text-sm font-bold tracking-[0.15em] text-foreground">VILTRUM</span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-secondary">Sign in to your account to continue.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 text-red-500 text-[13px] font-medium rounded-lg text-center border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted block">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted">
                <Mail size={16} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="viltrum-input pl-11"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted block">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted">
                <Lock size={16} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="viltrum-input pl-11"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-secondary">
          New here?{" "}
          <Link href="/register" className="text-foreground font-semibold hover:underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
