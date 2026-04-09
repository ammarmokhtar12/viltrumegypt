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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Cart is Empty</h1>
          <p className="text-foreground/40">Add products before checking out.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-viltrum-red text-white rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-viltrum-red-light transition-colors"
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

      <main className="min-h-screen bg-background pt-32 pb-20 noise-bg">
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold tracking-widest text-foreground/40 hover:text-viltrum-red transition-all duration-300 uppercase mb-12 group"
          >
            <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Shop
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter uppercase leading-none">
              CHECKOUT
            </h1>
            <div className="flex items-center gap-3 text-foreground/40 text-sm tracking-widest uppercase font-bold">
              <ShieldCheck size={18} className="text-viltrum-red" />
              Secure Checkout
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-10">
              <div className="glass-card rounded-3xl p-8 md:p-10">
                <h2 className="text-xl font-bold text-foreground tracking-widest uppercase mb-10 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-viltrum-red/10 flex items-center justify-center text-viltrum-red text-xs">01</span>
                  Personal Details
                </h2>
                <CheckoutForm
                  onSubmit={handleFormSubmit}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                />
              </div>

              <div className="glass-card rounded-3xl p-8 md:p-10">
                <h2 className="text-xl font-bold text-foreground tracking-widest uppercase mb-10 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-viltrum-red/10 flex items-center justify-center text-viltrum-red text-xs">02</span>
                  Payment Proof
                </h2>
                <PaymentUpload
                  onUploadComplete={(url) => setScreenshotUrl(url)}
                  uploaded={!!screenshotUrl}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  id="submit-order"
                  onClick={handleFinalSubmit}
                  disabled={!isReadyToSubmit}
                  className={`armor-btn w-full !h-20 text-lg ${
                    !isReadyToSubmit ? "opacity-40 cursor-not-allowed grayscale" : ""
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Send size={20} />
                      {!formData
                        ? "Fill Details First"
                        : !screenshotUrl
                        ? "Upload Payment Screenshot"
                        : "Confirm & Send to WhatsApp"}
                    </div>
                  )}
                </button>
              </div>

              {!formData && (
                <p className="text-xs text-foreground/30 text-center tracking-widest uppercase font-bold">
                  Please validate your details above to proceed.
                </p>
              )}
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-5">
              <div className="glass-card rounded-3xl p-8 md:p-10 lg:sticky lg:top-36">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-border-color">
                  <h2 className="text-xl font-bold text-foreground tracking-widest uppercase">
                    Your Order
                  </h2>
                  <span className="px-3 py-1 bg-viltrum-red/10 text-viltrum-red text-[10px] font-black uppercase tracking-tighter rounded-full">
                    {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                <div className="space-y-6 mb-10">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.product_id}-${item.size}`}
                      className="flex justify-between items-start gap-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground uppercase tracking-wide">
                          {item.title}
                        </p>
                        <p className="text-xs text-foreground/40 font-medium bg-foreground/5 px-2 py-0.5 rounded w-fit">
                          Size: {item.size} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-black text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-border-color space-y-4">
                  <div className="flex justify-between items-center text-foreground/40 text-xs tracking-widest uppercase font-bold">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-foreground/40 text-xs tracking-widest uppercase font-bold">
                    <span>Shipping</span>
                    <span className="text-viltrum-red">Calculated on Call</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-sm tracking-widest text-foreground font-black uppercase">
                      Total
                    </span>
                    <span className="text-3xl font-black text-viltrum-red">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-background/50 rounded-2xl border border-border-color/50">
                  <p className="text-[10px] text-foreground/40 leading-relaxed text-center uppercase tracking-widest font-bold">
                    Prices exclude delivery fees. Our team will contact you to confirm shipping.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
