"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (authError) throw authError;

      if (data?.user?.identities?.length === 0) {
        setError("Account with this email already exists.");
        // eslint-disable-next-line
        return;
      }

      setSuccess(true);
      // Fallback redirect after a short while if auto-login is enabled and confirm is off
      setTimeout(() => {
        router.push("/login");
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12">
      <div className="max-w-md w-full mx-auto px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-900 transition-colors mb-12">
          <ArrowLeft size={16} />
          Back to Store
        </Link>
        
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl text-zinc-900 mb-2 tracking-wide">Create Account</h1>
          <p className="text-zinc-400 text-sm">Join Viltrum to manage your orders and speed up checkout.</p>
        </div>

        {success ? (
          <div className="text-center p-8 bg-zinc-50 border border-zinc-100 rounded-sm">
             <h2 className="font-display text-2xl text-emerald-600 mb-2">Welcome to Viltrum</h2>
             <p className="text-sm text-zinc-500 mb-6">Your account has been created successfully. Redirecting you to login...</p>
             <Link href="/login" className="px-6 py-3 bg-zinc-900 text-white text-[11px] font-semibold tracking-[0.2em] uppercase transition-all rounded-sm">
               Sign In Now
             </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[13px] font-medium rounded-sm text-center">
                {error}
              </div>
            )}

            <div className="relative">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
                 <User size={16} />
               </div>
               <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full h-14 pl-12 pr-4 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-medium rounded-sm focus:outline-none focus:border-zinc-400 transition-colors placeholder:font-normal placeholder:text-zinc-400"
                required
              />
            </div>

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
                placeholder="Password (min 6 characters)"
                className="w-full h-14 pl-12 pr-4 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-medium rounded-sm focus:outline-none focus:border-zinc-400 transition-colors placeholder:font-normal placeholder:text-zinc-400"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-6 bg-zinc-900 text-white text-[11px] font-semibold tracking-[0.2em] uppercase flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all rounded-sm disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Account"}
            </button>
          </form>
        )}

        <p className="text-center mt-8 text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-zinc-900 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
