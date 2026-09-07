"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle } from "lucide-react";

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || "";

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">تم تأكيد الأوردر</h1>
        <p className="text-secondary text-sm mb-1">
          أوردر رقم <span className="font-bold text-primary">#{orderNumber}</span> اتأكد بنجاح
        </p>
        <p className="text-muted text-xs mb-8">
          هنتواصل معاك خلال 24 ساعة لتأكيد العنوان والشحن
        </p>
        <Link
          href="/products"
          className="inline-block px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          تسوق تاني
        </Link>
      </div>
    </main>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
        </main>
      }
    >
      <OrderConfirmedContent />
    </Suspense>
  );
}
