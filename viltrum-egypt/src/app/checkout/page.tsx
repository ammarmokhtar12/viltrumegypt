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
      <div className="min-h-screen bg-viltrum-black flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-viltrum-white">Cart is Empty</h1>
          <p className="text-viltrum-white/40">Add products before checking out.</p>
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

      <main className="min-h-screen bg-viltrum-black pt-24 pb-12 noise-bg">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-viltrum-white/40 hover:text-viltrum-red transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Shop
          </Link>

          <h1 className="text-3xl md:text-4xl font-black text-viltrum-white mb-8 tracking-tight">
            CHECKOUT
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-3 space-y-6">
              <div className="glass-card rounded-2xl p-6 space-y-6">
                <h2 className="text-lg font-bold text-viltrum-white tracking-widest flex items-center gap-2">
                  <ShieldCheck size={18} className="text-viltrum-red" />
                  YOUR DETAILS
                </h2>
                <CheckoutForm
                  onSubmit={handleFormSubmit}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                />
              </div>

              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-viltrum-white tracking-widest">
                  PAYMENT PROOF
                </h2>
                <PaymentUpload
                  onUploadComplete={(url) => setScreenshotUrl(url)}
                  uploaded={!!screenshotUrl}
                />
              </div>

              {/* Submit Button */}
              <button
                id="submit-order"
                onClick={handleFinalSubmit}
                disabled={!isReadyToSubmit}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-300 ${
                  isReadyToSubmit
                    ? "bg-viltrum-red text-white hover:bg-viltrum-red-light red-glow-hover active:scale-[0.98]"
                    : "bg-viltrum-gray-light text-viltrum-white/30 cursor-not-allowed"
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {!formData
                      ? "Fill in your details first"
                      : !screenshotUrl
                      ? "Upload payment screenshot"
                      : "Confirm Order & Send to WhatsApp"}
                  </>
                )}
              </button>

              {!formData && (
                <p className="text-xs text-viltrum-white/30 text-center">
                  Fill in the form above, then click any field to validate.
                </p>
              )}
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl p-6 space-y-4 lg:sticky lg:top-24">
                <h2 className="text-lg font-bold text-viltrum-white tracking-widest">
                  ORDER SUMMARY
                </h2>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.product_id}-${item.size}`}
                      className="flex justify-between items-center py-2 border-b border-viltrum-white/5"
                    >
                      <div>
                        <p className="text-sm font-medium text-viltrum-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-viltrum-white/40">
                          Size: {item.size} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-viltrum-red">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-viltrum-white/10 flex justify-between items-center">
                  <span className="text-sm tracking-widest text-viltrum-white/50 uppercase">
                    Total
                  </span>
                  <span className="text-2xl font-black text-viltrum-red">
                    {formatPrice(cartTotal)}
                  </span>
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
