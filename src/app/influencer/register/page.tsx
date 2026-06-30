"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle2, Award } from "lucide-react";

export default function InfluencerRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const code = couponCode.trim().toUpperCase();

      // Check if coupon is already taken
      const { data: existing } = await supabase
        .from("influencers")
        .select("id")
        .eq("coupon_code", code)
        .maybeSingle();

      if (existing) {
        setError("This coupon code is already taken. Please choose another one.");
        setLoading(false);
        return;
      }

      // Check if email is already registered
      const { data: existingEmail } = await supabase
        .from("influencers")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (existingEmail) {
        setError("This email is already registered. You can log in to view your status.");
        setLoading(false);
        return;
      }

      // If they are logged in, we link their auth user_id
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      const { error: insertError } = await supabase
        .from("influencers")
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          coupon_code: code,
          password: password.trim(),
          commission_percent: 7.00,
          status: "pending",
          user_id: userId,
        });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError((err as any).message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6 py-16 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-radial from-neutral-200/40 to-transparent blur-3xl -z-10" />
        <div className="max-w-md w-full bg-white border border-neutral-100 rounded-[2.5rem] p-8 md:p-10 space-y-8 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.06)] text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex justify-center">
            <div className="relative w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-serif text-neutral-900 tracking-tight leading-tight">
              Application Submitted!
            </h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Thank you for applying to the Viltrum Egypt Creator Network. Your profile is currently being reviewed by our partnerships team.
            </p>
          </div>

          <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 text-left space-y-2">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">What&apos;s Next?</p>
            <p className="text-xs text-neutral-600 leading-relaxed">
              1. Our team will verify your contact details and social profiles.<br />
              2. Upon approval, you will receive an activation email.<br />
              3. Your custom code <strong className="text-neutral-950 font-bold">&ldquo;{couponCode.toUpperCase()}&rdquo;</strong> will start granting your audience a 5% discount, and you&apos;ll earn a 5% commission.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="w-full h-12 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-primary font-sans flex flex-col justify-center items-center py-12 px-6 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-radial from-neutral-200/30 to-transparent blur-3xl -z-10" />

      <div className="max-w-sm w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors mb-8 cursor-pointer">
          <ArrowLeft size={14} /> Back to Store
        </Link>

        {/* Brand Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="w-12 h-12 bg-primary text-background flex items-center justify-center rounded-xl mb-4 shadow-lg mx-auto sm:mx-0">
            <Award size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Apply as an Influencer</h1>
          <p className="text-sm text-secondary mt-1">Join the Viltrum Egypt team, share your style, and earn 5% commission.</p>
        </div>

        {/* Card Form */}
        <div className="bg-surface border border-border-light rounded-2xl p-7 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 text-red-500 text-xs font-medium rounded-lg text-center border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="Ahmed Ali"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="viltrum-input"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="viltrum-input"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-1.5">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="viltrum-input"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-1.5">Preferred Coupon Code</label>
              <input
                type="text"
                required
                placeholder="e.g. AHMED"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="viltrum-input uppercase font-semibold"
              />
              <p className="text-[9px] text-muted mt-1 leading-relaxed">
                This is the code your followers will use to get 7% off, and that attributes commissions to you.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-1.5">Password (كلمة المرور لحماية حسابك)</label>
              <input
                type="password"
                required
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="viltrum-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? "Submitting Application..." : (
                <>
                  <Send size={14} /> Submit Application
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-secondary leading-relaxed">
          Already an approved partner?{" "}
          <Link href="/influencer/dashboard" className="text-foreground font-semibold hover:underline">
            Go to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
