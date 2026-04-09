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
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="min-h-screen bg-zinc-50/50 pt-48 pb-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 uppercase tracking-tight">
          {/* Top Progress bar or similar */}
          <div className="flex items-center gap-4 mb-20 text-[10px] font-bold text-zinc-400 tracking-[0.3em]">
             <span>01 CART</span>
             <span className="w-8 h-px bg-zinc-200" />
             <span className="text-zinc-900 border-b border-zinc-900 pb-1">02 CHECKOUT</span>
             <span className="w-8 h-px bg-zinc-200" />
             <span>03 COMPLETE</span>
          </div>

          <header className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
            <div className="space-y-4">
               <Link
                href="/"
                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-400 hover:text-zinc-900 transition-all duration-300 group"
              >
                <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" />
                Back to Store
              </Link>
              <h1 className="font-display text-7xl md:text-9xl font-bold text-zinc-900 leading-none">
                Checkout
              </h1>
            </div>
            
            <div className="flex items-center gap-4 bg-white border border-zinc-100 px-6 py-4">
              <Lock size={16} className="text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-900 tracking-widest">End-to-End Encryption</span>
                <span className="text-[9px] font-bold text-zinc-400">Secure Payment Channel</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-24">
              <section className="space-y-12">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 tracking-widest"> SHIPPING INFO</h2>
                  <span className="text-[10px] font-bold text-zinc-400">STEP 01</span>
                </div>
                <CheckoutForm
                  onSubmit={handleFormSubmit}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                />
              </section>

              <section className="space-y-12">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 tracking-widest">PAYMENT PROOF</h2>
                  <span className="text-[10px] font-bold text-zinc-400">STEP 02</span>
                </div>
                <PaymentUpload
                  onUploadComplete={(url) => setScreenshotUrl(url)}
                  uploaded={!!screenshotUrl}
                />
              </section>

              {/* Submit Button Area */}
              <div className="pt-12">
                <button
                  id="submit-order"
                  onClick={handleFinalSubmit}
                  disabled={!isReadyToSubmit}
                  className={`btn-primary w-full !h-24 text-xl transition-all duration-500 rounded-none ${
                    !isReadyToSubmit ? "opacity-30 cursor-not-allowed bg-zinc-200 text-zinc-400 shadow-none border-zinc-200" : "shadow-2xl shadow-zinc-900/10"
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Finalizing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Send size={20} />
                      <span className="tracking-[0.2em] font-sans font-black">
                        {!formData
                          ? "Required Shipping Info"
                          : !screenshotUrl
                          ? "Pending Payment Transfer"
                          : "Finish & Send To WhatsApp"}
                      </span>
                    </div>
                  )}
                </button>
                {!formData && (
                  <p className="mt-8 text-[11px] text-zinc-400 text-center tracking-[0.2em] font-bold italic">
                    All fields must be completed to activate the dispatch order.
                  </p>
                )}
              </div>
            </div>

            {/* Order Summary Column */}
            <aside className="lg:col-span-5">
              <div className="bg-white p-10 md:p-16 lg:sticky lg:top-40 border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-12 pb-8 border-b border-zinc-100">
                  <h2 className="text-xl font-bold text-zinc-900 tracking-widest">ORDER SUMMARY</h2>
                  <span className="text-[10px] font-bold text-zinc-400 tracking-widest">
                    [{cartItems.length}] UNIT{cartItems.length !== 1 ? 'S' : ''}
                  </span>
                </div>

                <div className="space-y-10 mb-16">
                  {cartItems.map((item) => (
                    <div key={`${item.product_id}-${item.size}`} className="flex justify-between gap-6 group">
                      <div className="space-y-2 flex-1">
                        <p className="text-sm font-bold text-zinc-900 tracking-wider group-hover:text-zinc-500 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-bold tracking-widest bg-zinc-50 px-3 py-1 w-fit">
                          SIZE: {item.size} / QTY: {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-zinc-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-10 border-t border-zinc-100 space-y-6">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 tracking-[0.2em]">
                    <span>SUBTOTAL</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 tracking-[0.2em]">
                    <span>SHIPPING</span>
                    <span className="text-zinc-600 italic">CALCULATED ON DISPATCH</span>
                  </div>
                  <div className="flex justify-between items-center pt-10 border-t border-zinc-100 mt-6">
                    <span className="text-sm font-black text-zinc-900 tracking-[0.1em]">TOTAL ESTIMATE</span>
                    <span className="text-5xl font-bold text-zinc-900">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-16 pt-10 border-t border-zinc-50 flex items-center justify-center gap-4">
                  <ShieldCheck size={16} className="text-zinc-300" />
                  <p className="text-[9px] text-zinc-400 leading-relaxed font-bold tracking-widest text-center">
                    FINAL CONFIRMATION WILL BE PROVIDED VIA WHATSAPP.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
