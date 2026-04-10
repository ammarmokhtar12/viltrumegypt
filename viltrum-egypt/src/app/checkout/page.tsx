"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, ShieldCheck, Truck, Package } from "lucide-react";
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6">
        <div className="w-16 h-16 bg-surface border border-border-light rounded-2xl flex items-center justify-center">
          <Package size={28} className="text-muted" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Your Cart is Empty</h1>
        <p className="text-secondary text-base max-w-xs text-center leading-relaxed">
          Looks like you haven&apos;t added anything yet. Browse our collection to find something you love.
        </p>
        <Link href="/products" className="btn-primary mt-2">
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

      <main className="min-h-screen bg-background">
        {/* Header Area */}
        <div className="bg-surface border-b border-border-light">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-12 sm:pt-36 sm:pb-16">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground mb-8"
            >
              <ArrowLeft size={15} />
              <span>Back to products</span>
            </Link>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Checkout
            </h1>
            <p className="text-base sm:text-lg text-secondary mt-3">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your order · {formatPrice(cartTotal)}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">

            {/* Left Column: Form (takes more space) */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="space-y-12">

                {/* Step 1: Customer Info */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                      Your Information
                    </h2>
                  </div>

                  <CheckoutForm
                    onSubmit={handleFormSubmit}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                  />
                </div>

                {/* Step 2: Payment Proof */}
                <div className="space-y-8 pt-8 border-t border-border-light">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                      Upload Payment Proof
                    </h2>
                  </div>

                  <PaymentUpload
                    onUploadComplete={(url) => setScreenshotUrl(url)}
                    uploaded={!!screenshotUrl}
                  />
                </div>

                {/* Submit */}
                <div className="pt-8 border-t border-border-light space-y-6">
                  <button
                    onClick={handleFinalSubmit}
                    disabled={!isReadyToSubmit}
                    className={`flex w-full items-center justify-center gap-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                      isReadyToSubmit
                        ? "bg-primary text-background hover:opacity-90 shadow-lg shadow-primary/10"
                        : "cursor-not-allowed bg-surface border border-border-light text-muted"
                    }`}
                    style={{ minHeight: "3.5rem" }}
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

                  <p className="text-[12px] text-muted text-center leading-relaxed">
                    By completing your order, you agree to our terms of service.
                    Your order will be confirmed via WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary (sticky) */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="lg:sticky lg:top-28">
                <div className="bg-surface border border-border-light rounded-2xl p-7 sm:p-8 space-y-7">
                  <h3 className="text-base font-semibold text-foreground">
                    Order Summary
                  </h3>

                  {/* Items */}
                  <div className="space-y-5">
                    {cartItems.map((item) => (
                      <div
                        key={`${item.product_id}-${item.size}`}
                        className="flex gap-4"
                      >
                        <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-background border border-border-light">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-lg font-display text-muted/20">V</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {item.title}
                          </h4>
                          <p className="text-[12px] text-muted">
                            Size: {item.size} · Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-border-light pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-secondary">Subtotal</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-secondary">Shipping</span>
                      <span className="text-sm font-semibold text-emerald-600">
                        Free
                      </span>
                    </div>

                    <div className="border-t border-border-light pt-4 flex justify-between items-center">
                      <span className="text-base font-semibold text-foreground">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="border-t border-border-light pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                        <Truck size={15} className="text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Free Shipping</p>
                        <p className="text-[11px] text-muted">Across all of Egypt</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                        <ShieldCheck size={15} className="text-muted" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Fast Delivery</p>
                        <p className="text-[11px] text-muted">3–5 business days</p>
                      </div>
                    </div>
                  </div>
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
