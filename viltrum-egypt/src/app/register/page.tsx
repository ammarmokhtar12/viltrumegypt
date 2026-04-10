"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, Lock, User, CheckCircle } from "lucide-react";

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

        {success ? (
          <div className="text-center p-8 bg-surface border border-border-light rounded-2xl animate-fade-up">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Welcome to Viltrum</h2>
            <p className="text-sm text-secondary mb-6 leading-relaxed">Your account has been created. Redirecting to login...</p>
            <Link href="/login" className="btn-primary w-full">
              Sign In Now
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
              <p className="text-sm text-secondary">Join Viltrum to manage orders and checkout faster.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 text-red-500 text-[13px] font-medium rounded-lg text-center border border-red-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted block">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="viltrum-input pl-11"
                    required
                  />
                </div>
              </div>

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
                    placeholder="Min. 6 characters"
                    className="viltrum-input pl-11"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : "Create Account"}
              </button>
            </form>
          </>
        )}

        <p className="text-center mt-8 text-sm text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-semibold hover:underline underline-offset-4">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
