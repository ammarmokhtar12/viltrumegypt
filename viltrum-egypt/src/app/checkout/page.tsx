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
            className="btn-primary inline-flex items-center gap-3 px-10 rounded-full"
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
    <div className="min-h-screen bg-gradient-to-br from-[#fdfefd] to-[#f2f7f2] font-sans">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="max-w-5xl mx-auto px-4 pt-32 pb-20 lg:pt-44">
        {/* Main Wrapper like user's #wrapper */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] overflow-hidden rounded-[2.5rem]">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Left Column: #info (Products List) */}
            <div className="p-10 md:p-14 lg:p-16 border-b lg:border-b-0 lg:border-r border-zinc-100/50 flex flex-col bg-zinc-50/30">
              <div className="space-y-12 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
                <div className="flex items-center justify-between opacity-40 mb-8 px-2">
                   <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">
                      <ArrowLeft size={12} /> Back
                   </Link>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Current Collection</span>
                </div>

                {cartItems.map((item) => (
                  <div key={`${item.product_id}-${item.size}`} className="space-y-6 text-center lg:text-left">
                    <div className="relative group">
                      <img
                        src={item.image_url || ""}
                        alt={item.title}
                        className="w-full h-72 object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-white px-4 py-2 border border-zinc-100 rounded-full text-[10px] font-black tracking-widest shadow-sm">
                        SIZE {item.size}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em]">{item.title}</p>
                      <p className="text-[10px] font-black text-zinc-300 tracking-[0.4em]">ART: {item.product_id.slice(0, 8)}</p>
                      
                      <div className="pt-4">
                        <h2 className="text-4xl font-display font-medium text-zinc-900 tracking-tight">
                          {formatPrice(item.price)}
                        </h2>
                      </div>
                    </div>
                  </div>
                ))}

                {cartItems.length > 1 && (
                  <div className="pt-10 mt-10 border-t border-zinc-100/50">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black tracking-widest text-zinc-300 uppercase mb-1">Total Payload</p>
                          <p className="text-5xl font-display font-medium text-zinc-900">{formatPrice(cartTotal)}</p>
                       </div>
                       <div className="flex gap-2">
                          {cartItems.map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                          ))}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: #payment (Checkout Form) */}
            <div className="p-10 md:p-14 lg:p-16 bg-white/50">
              <div className="max-w-sm mx-auto w-full">
                <div className="mb-14 flex items-center justify-between">
                   <div className="flex gap-4">
                      {/* V-Cash / Insta Icons Placeholder */}
                      <div className="w-10 h-6 bg-zinc-50 border border-zinc-100 rounded-md flex items-center justify-center text-[8px] font-black">VC</div>
                      <div className="w-10 h-6 bg-zinc-50 border border-zinc-100 rounded-md flex items-center justify-center text-[8px] font-black">IP</div>
                   </div>
                   <Lock size={16} className="text-zinc-200" />
                </div>

                <div className="space-y-12">
                  <CheckoutForm
                    onSubmit={handleFormSubmit}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    usePillStyle={true}
                  />

                  <div className="space-y-4">
                    <label className="text-[10px] font-black tracking-[0.4em] text-zinc-400 uppercase pl-6">Validation Document</label>
                    <PaymentUpload
                      onUploadComplete={(url) => setScreenshotUrl(url)}
                      uploaded={!!screenshotUrl}
                    />
                  </div>

                  <div className="pt-8">
                    <button
                      onClick={handleFinalSubmit}
                      disabled={!isReadyToSubmit}
                      className={`group w-full h-16 rounded-full flex items-center justify-center gap-4 transition-all duration-700 uppercase tracking-[0.4em] font-black text-[11px] ${
                        isReadyToSubmit 
                          ? "bg-[#00bfa5] text-white hover:bg-[#009688] shadow-2xl shadow-emerald-500/30" 
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      {submitting ? "Validating..." : "Complete Purchase"}
                    </button>
                    <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
                       <ShieldCheck size={12} />
                       <span className="text-[8px] font-black tracking-[0.2em]">PROTECTED BY VILTRUM ENCRYPTION</span>
                    </div>
                  </div>
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
