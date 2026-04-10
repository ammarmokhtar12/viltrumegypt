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

      if (data?.user) {
        // Sync to profiles table
        await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: name,
          email: email
        });
      }

      if (data?.user?.identities?.length === 0) {
        setError("Account with this email already exists.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12">
      <div className="max-w-md w-full px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors mb-12 font-medium tracking-tight">
          <ArrowLeft size={16} />
          Back to Store
        </Link>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl text-zinc-900 mb-3 tracking-tight font-extrabold">Create Account</h1>
          <p className="text-zinc-600 text-sm font-medium tracking-tight">Join Viltrum to manage your orders and speed up checkout.</p>
        </div>

        {success ? (
          <div className="text-center p-10 bg-white border border-zinc-200 rounded-3xl animate-in fade-in zoom-in duration-500">
             <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <User size={32} />
             </div>
             <h2 className="text-2xl text-zinc-900 mb-2 font-extrabold">Welcome to Viltrum</h2>
             <p className="text-sm text-zinc-600 mb-8 leading-relaxed">Your account has been created successfully. Redirecting you to login...</p>
             <Link href="/login" className="btn-primary w-full">
               Sign In Now
             </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-[13px] font-bold rounded-2xl text-center border border-red-100">
                {error}
              </div>
            )}

            <div className="relative group">
               <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-zinc-900 transition-colors">
                 <User size={18} />
               </div>
               <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="viltrum-input pl-14"
                required
              />
            </div>

            <div className="relative group">
               <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-zinc-900 transition-colors">
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
               <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-zinc-900 transition-colors">
                 <Lock size={18} />
               </div>
               <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                className="viltrum-input pl-14"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
            </button>
          </form>
        )}

        <p className="text-center mt-10 text-sm text-zinc-600 font-medium tracking-tight">
          Already have an account?{" "}
          <Link href="/login" className="text-zinc-900 font-bold hover:underline underline-offset-4">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
