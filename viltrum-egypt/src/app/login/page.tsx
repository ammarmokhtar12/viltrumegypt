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
    <div className="min-h-screen bg-white flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-900 transition-colors mb-12">
          <ArrowLeft size={16} />
          Back to Store
        </Link>
        
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl text-zinc-900 mb-2 tracking-wide">Welcome Back</h1>
          <p className="text-zinc-400 text-sm">Sign in to your Viltrum account to view orders and checkout faster.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-[13px] font-medium rounded-sm text-center">
              {error}
            </div>
          )}

          <div className="relative">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
               <Mail size={16} />
             </div>
             <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full h-14 pl-12 pr-4 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-medium rounded-sm focus:outline-none focus:border-zinc-400 transition-colors placeholder:font-normal placeholder:text-zinc-400"
              required
            />
          </div>

          <div className="relative">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
               <Lock size={16} />
             </div>
             <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-14 pl-12 pr-4 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-medium rounded-sm focus:outline-none focus:border-zinc-400 transition-colors placeholder:font-normal placeholder:text-zinc-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 mt-4 bg-zinc-900 text-white text-[11px] font-semibold tracking-[0.2em] uppercase flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all rounded-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-zinc-500">
          New here?{" "}
          <Link href="/register" className="text-zinc-900 font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
