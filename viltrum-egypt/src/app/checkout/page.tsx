"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Send } from "lucide-react";
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
        <div className="text-center space-y-6 uppercase">
          <h1 className="text-3xl font-display font-bold text-zinc-900 tracking-widest">Cart is Empty</h1>
          <p className="text-zinc-400 text-xs font-bold tracking-widest">Add products before checking out.</p>
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Shop
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

      <main className="min-h-screen bg-white pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 uppercase">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-400 hover:text-zinc-900 transition-all duration-300 mb-12 group"
          >
            <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Shop
          </Link>

          <header className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
            <h1 className="font-display text-6xl md:text-8xl font-bold text-zinc-900 tracking-tighter leading-none">
              Checkout
            </h1>
            <div className="flex items-center gap-2 text-zinc-400 text-[10px] tracking-widest font-bold">
              <ShieldCheck size={16} />
              Secure Payment
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-16">
              <section className="space-y-10">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 bg-zinc-900 text-white flex items-center justify-center font-bold text-xs ring-4 ring-zinc-50">01</span>
                  <h2 className="text-xl font-bold text-zinc-900 tracking-widest">Personal Details</h2>
                </div>
                <CheckoutForm
                  onSubmit={handleFormSubmit}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                />
              </section>

              <section className="space-y-10">
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 bg-zinc-900 text-white flex items-center justify-center font-bold text-xs ring-4 ring-zinc-50">02</span>
                  <h2 className="text-xl font-bold text-zinc-900 tracking-widest">Payment Proof</h2>
                </div>
                <PaymentUpload
                  onUploadComplete={(url) => setScreenshotUrl(url)}
                  uploaded={!!screenshotUrl}
                />
              </section>

              {/* Submit Button */}
              <div className="pt-8">
                <button
                  id="submit-order"
                  onClick={handleFinalSubmit}
                  disabled={!isReadyToSubmit}
                  className={`btn-primary w-full !h-20 text-lg transition-all duration-300 ${
                    !isReadyToSubmit ? "opacity-20 cursor-not-allowed bg-zinc-200 text-zinc-400" : ""
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Send size={18} />
                      <span className="tracking-widest capitalize font-sans font-bold">
                        {!formData
                          ? "Enter Shipping Details"
                          : !screenshotUrl
                          ? "Upload Payment Proof"
                          : "Confirm & Send to WhatsApp"}
                      </span>
                    </div>
                  )}
                </button>
                {!formData && (
                  <p className="mt-4 text-[10px] text-zinc-400 text-center tracking-widest font-bold">
                    Please provide your contact info above first
                  </p>
                )}
              </div>
            </div>

            {/* Order Summary Column */}
            <aside className="lg:col-span-5">
              <div className="bg-zinc-50 p-8 md:p-12 lg:sticky lg:top-36 border border-zinc-100">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-200">
                  <h2 className="text-lg font-bold text-zinc-900 tracking-widest">Summary</h2>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                <div className="space-y-8 mb-12">
                  {cartItems.map((item) => (
                    <div key={`${item.product_id}-${item.size}`} className="flex justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-bold text-zinc-900 tracking-wider">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-bold">
                          Size {item.size} x {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-zinc-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-zinc-200 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 tracking-widest">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 tracking-widest">
                    <span>Shipping</span>
                    <span className="text-zinc-900 italic">TBD</span>
                  </div>
                  <div className="flex justify-between items-center pt-8 border-t border-zinc-200/50 mt-4">
                    <span className="text-xs font-bold text-zinc-900 tracking-widest">Total</span>
                    <span className="text-4xl font-bold text-zinc-900">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-white border border-zinc-200">
                  <p className="text-[9px] text-zinc-500 leading-relaxed text-center font-bold tracking-[0.05em]">
                    Delivery fees are calculated based on your address and will be confirmed via phone call.
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
