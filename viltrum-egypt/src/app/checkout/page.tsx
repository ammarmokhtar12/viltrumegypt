"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Send } from "lucide-react";
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6">
        <h1 className="font-display text-3xl text-zinc-900 tracking-wide">Your Cart is Empty</h1>
        <p className="text-zinc-400 text-base">Add products before checking out.</p>
        <Link href="/products" className="btn-primary">
          Browse Products
        </Link>
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

      <main className="min-h-screen bg-white pt-24 sm:pt-28">
        {/* Back Link */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-900 transition-colors duration-300 font-medium"
          >
            <ArrowLeft size={16} />
            <span>Back to products</span>
          </Link>
        </div>

        {/* Checkout — Split Layout (matching product detail page) */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-28 sm:pb-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

            {/* Left: Order Summary (product images + totals) */}
            <div>
              <div className="space-y-4 mb-10">
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-zinc-900 tracking-wide leading-tight">
                  Checkout
                </h1>
                <p className="text-lg text-zinc-400 font-light">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your order
                </p>
              </div>

              {/* Cart Items */}
              <div className="space-y-8 mb-12">
                {cartItems.map((item) => (
                  <div
                    key={`${item.product_id}-${item.size}`}
                    className="flex gap-6"
                  >
                    {/* Item Image */}
                    <div className="relative w-28 h-36 sm:w-32 sm:h-40 bg-zinc-50 flex-shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-zinc-200 font-display text-3xl">V</span>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      <h3 className="text-base font-medium text-zinc-900 leading-snug mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-semibold uppercase tracking-[0.25em] mb-4">
                        <span>Size: {item.size}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-200" />
                        <span>Qty: {item.quantity}</span>
                      </div>
                      <p className="text-lg font-display text-zinc-500 tracking-wider">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="pt-8 border-t border-zinc-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-400">
                    Subtotal
                  </span>
                  <span className="text-base font-medium text-zinc-900">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-400">
                    Shipping
                  </span>
                  <span className="text-base font-medium text-zinc-900">
                    Free
                  </span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-900">
                    Total
                  </span>
                  <span className="text-2xl sm:text-3xl font-display text-zinc-900 tracking-wider">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 pt-10 border-t border-zinc-100 space-y-3">
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-300 font-semibold">
                  Free shipping across Egypt
                </p>
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-300 font-semibold">
                  Delivery within 3–5 business days
                </p>
              </div>
            </div>

            {/* Right: Checkout Form */}
            <div className="flex flex-col justify-start py-0 lg:py-4">
              <div className="max-w-md">
                {/* Form Section */}
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-400 block">
                      Customer Information
                    </label>
                    <div className="w-10 h-[1px] bg-zinc-200" />
                  </div>

                  <CheckoutForm
                    onSubmit={handleFormSubmit}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                  />

                  {/* Payment Upload */}
                  <div className="space-y-4 pt-8 border-t border-zinc-100">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-400 block">
                      Payment Proof
                    </label>
                    <PaymentUpload
                      onUploadComplete={(url) => setScreenshotUrl(url)}
                      uploaded={!!screenshotUrl}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleFinalSubmit}
                    disabled={!isReadyToSubmit}
                    className={`w-full h-14 sm:h-16 flex items-center justify-center gap-3 text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-500 rounded-sm ${
                      isReadyToSubmit
                        ? "bg-zinc-900 text-white hover:bg-zinc-700"
                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    }`}
                  >
                    {submitting ? (
                      "Processing..."
                    ) : (
                      <>
                        <Send size={16} />
                        Complete Order
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-zinc-300 text-center font-semibold tracking-wide leading-relaxed">
                    By completing your order, you agree to our terms of service.
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
