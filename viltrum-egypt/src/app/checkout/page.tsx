"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Send, Lock } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { supabase } from "@/lib/supabase";
import { formatPrice, generateOrderWhatsAppUrl } from "@/lib/utils";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import PaymentUpload from "@/components/checkout/PaymentUpload";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"vodafone_cash" | "instapay">("vodafone_cash");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    address: string;
    paymentMethod: "vodafone_cash" | "instapay";
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const cartTotal = totalPrice();
  const cartItems = items;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-8 uppercase">
          <h1 className="text-4xl font-display font-bold text-zinc-900 tracking-widest leading-tight">Your Cart is Empty</h1>
          <p className="text-zinc-400 text-xs font-bold tracking-[0.3em]">Add products before checking out.</p>
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-3 px-10"
          >
            <ArrowLeft size={16} />
            Explore drops
          </Link>
        </div>
      </div>
    );
  }

  const handleFormSubmit = (data: {
    name: string;
    phone: string;
    address: string;
    paymentMethod: "vodafone_cash" | "instapay";
  }) => {
    setFormData(data);
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    if (!screenshotUrl) return;

    setSubmitting(true);

    try {
      const orderItems = cartItems.map((item) => ({
        product_id: item.product_id,
        title: item.title,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      }));

      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_address: formData.address,
          payment_method: formData.paymentMethod,
          payment_screenshot_url: screenshotUrl,
          items: orderItems,
          total: cartTotal,
          status: "pending",
        })
        .select("order_number")
        .single();

      if (error) throw error;

      const whatsappUrl = generateOrderWhatsAppUrl(
        data.order_number,
        orderItems,
        cartTotal,
        formData.name,
        formData.paymentMethod
      );

      clearCart();
      window.open(whatsappUrl, "_blank");
      router.push("/");
    } catch (err) {
      console.error("Order submission error:", err);
      alert("Failed to submit order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isReadyToSubmit = formData && screenshotUrl && !submitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfefd] to-[#f0f4f0] selection:bg-zinc-900 selection:text-white">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 lg:pt-48">
        <div className="bg-white/40 backdrop-blur-3xl border border-white/50 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Left Column: Product Info (Based on user HTML) */}
            <div className="p-8 md:p-12 lg:p-20 border-b lg:border-b-0 lg:border-r border-zinc-100 flex flex-col justify-center bg-zinc-50/50">
              <div className="space-y-16 max-w-md mx-auto w-full">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black tracking-[0.4em] text-zinc-300 uppercase">Selected Collection</h3>
                  <div className="w-12 h-1 bg-zinc-900" />
                </div>

                <div className="space-y-12 max-h-[60vh] overflow-y-auto pr-4 scrollbar-hide">
                  {cartItems.map((item) => (
                    <div key={`${item.product_id}-${item.size}`} className="space-y-8 group transition-all duration-700">
                      <div className="relative aspect-[4/5] overflow-hidden bg-white group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-700">
                        <img
                          src={item.image_url || ""}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      
                      <div className="space-y-4 uppercase">
                        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight leading-none">{item.title}</h2>
                        <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-zinc-400">
                           <span>Size: {item.size}</span>
                           <span className="w-1 h-1 rounded-full bg-zinc-200" />
                           <span>Qty: {item.quantity}</span>
                        </div>
                        <div className="pt-4 flex items-baseline gap-2">
                          <span className="text-xs font-bold text-zinc-400">EGP</span>
                          <span className="text-4xl font-display font-bold text-zinc-900">{item.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-12 border-t border-zinc-100 flex items-end justify-between uppercase">
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-zinc-400 mb-2">Grand Total</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-zinc-400">EGP</span>
                      <span className="text-6xl font-display font-bold text-zinc-900 tracking-tighter">{cartTotal}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[9px] font-black tracking-widest text-zinc-300">Fast Delivery</span>
                    <ShieldCheck size={24} className="text-zinc-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Payment Form */}
            <div className="p-8 md:p-12 lg:p-20 bg-white">
              <div className="max-w-md mx-auto w-full">
                <div className="mb-16 flex items-center justify-between">
                  <h3 className="text-[10px] font-black tracking-[0.4em] text-zinc-900 uppercase">Secure Transaction</h3>
                  <div className="flex gap-4">
                     <div className="bg-zinc-50 border border-zinc-100 rounded-full px-4 py-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-zinc-400">LIVE</span>
                     </div>
                  </div>
                </div>

                <CheckoutForm
                  onSubmit={handleFormSubmit}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                />

                <div className="mt-16 pt-16 border-t border-zinc-50">
                  <h3 className="text-xs font-bold tracking-[0.3em] text-zinc-900 uppercase mb-8">Payment Validation</h3>
                  <PaymentUpload
                    onUploadComplete={(url) => setScreenshotUrl(url)}
                    uploaded={!!screenshotUrl}
                  />
                </div>

                <div className="mt-16">
                  <button
                    onClick={handleFinalSubmit}
                    disabled={!isReadyToSubmit}
                    className={`group w-full h-16 rounded-full flex items-center justify-center gap-4 transition-all duration-700 uppercase tracking-[0.3em] font-black text-[11px] ${
                      isReadyToSubmit 
                        ? "bg-[#00bfa5] text-white hover:bg-emerald-600 shadow-xl shadow-emerald-600/20" 
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    {submitting ? "Processing..." : "Finish Purchase"}
                    <Send size={16} className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </button>
                  <p className="mt-6 text-[9px] text-zinc-400 text-center font-bold tracking-widest leading-relaxed">
                    By confirming, you agree to the Viltrum terms of service and delivery protocol.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
