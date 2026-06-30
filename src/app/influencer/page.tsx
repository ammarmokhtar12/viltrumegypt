"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, ArrowRight, KeyRound, AlertTriangle } from "lucide-react";

export default function InfluencerPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanCode = code.trim().toUpperCase();

    try {
      const { data, error: dbError } = await supabase
        .from("influencers")
        .select("id, status, coupon_code")
        .eq("coupon_code", cleanCode)
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError("الكود غلط أو غير موجود.");
        return;
      }

      if (data.status === "pending") {
        setError("طلبك لسه تحت المراجعة، هنتواصل معاك بعد الموافقة.");
        return;
      }

      if (data.status === "disabled") {
        setError("الحساب ده متوقف. تواصل مع الإدارة.");
        return;
      }

      // Active influencer — save code to sessionStorage and redirect
      sessionStorage.setItem("influencer_code", cleanCode);
      router.push("/influencer/dashboard");
    } catch (err) {
      setError("حصل خطأ، جرب تاني.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-primary font-sans flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-radial from-neutral-200/40 to-transparent blur-3xl -z-10" />

      <div className="max-w-sm w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 text-white shadow-xl">
            <Award size={26} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
            Viltrum Egypt Creator Network
          </p>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Bloggers Dashboard
          </h1>
          <p className="text-neutral-500 text-xs leading-relaxed">
            اكتب كود الخصم بتاعك عشان تدخل الداشبورد الخاص بيك
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border-light rounded-2xl p-7 shadow-sm">
          <form onSubmit={handleAccess} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-1.5">
                كود الخصم بتاعك
              </label>
              <div className="relative">
                <KeyRound
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="مثال: AHMED"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="viltrum-input pl-10 uppercase font-bold tracking-widest"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 text-red-600 text-xs font-medium rounded-lg border border-red-500/20">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? "جاري التحقق..." : (
                <>دخول الداشبورد <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-secondary">
          مش بلوجر لسه؟{" "}
          <Link href="/influencer/register" className="text-foreground font-semibold hover:underline">
            قدّم طلبك هنا
          </Link>
        </p>
      </div>
    </main>
  );
}
