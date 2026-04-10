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
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center py-12">
      <div className="max-w-md w-full px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-950 transition-colors mb-12 font-medium tracking-tight">
          <ArrowLeft size={16} />
          Back to Store
        </Link>
        
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl sm:text-5xl text-zinc-950 mb-3 tracking-tight font-bold">Welcome Back</h1>
          <p className="text-zinc-400 text-sm font-medium tracking-tight">Sign in to your Viltrum account to view orders and checkout faster.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-[13px] font-bold rounded-2xl text-center border border-red-100">
              {error}
            </div>
          )}

          <div className="relative group">
             <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
               <Mail size={18} />
             </div>
             <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="viltrum-input pl-14"
              required
            />
          </div>

          <div className="relative group">
             <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
               <Lock size={18} />
             </div>
             <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="viltrum-input pl-14"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-10 text-sm text-zinc-400 font-medium tracking-tight">
          New here?{" "}
          <Link href="/register" className="text-zinc-950 font-bold hover:underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
