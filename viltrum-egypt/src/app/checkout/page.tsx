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

      <main className="min-h-screen bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">

          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white px-6 sm:px-10 lg:px-24 py-12 lg:py-24">
            <div className="max-w-2xl ml-auto">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted transition-colors hover:text-foreground mb-12"
              >
                <ArrowLeft size={14} />
                <span>Return to cart</span>
              </Link>

              <div className="space-y-16">
                <CheckoutForm
                  onSubmit={handleFormSubmit}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                />

                {/* Upload Section */}
                <div className="space-y-8 pt-8 border-t border-border-light">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold text-foreground">Verification</h2>
                    <p className="text-xs text-muted">Upload your payment confirmation screenshot.</p>
                  </div>

                  <PaymentUpload
                    onUploadComplete={(url) => setScreenshotUrl(url)}
                    uploaded={!!screenshotUrl}
                  />
                </div>

                {/* Complete Order */}
                <div className="pt-4">
                  <button
                    onClick={handleFinalSubmit}
                    disabled={!isReadyToSubmit}
                    className={`flex w-full items-center justify-center gap-3 rounded-lg text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                      isReadyToSubmit
                        ? "bg-[#005bd3] text-white hover:bg-[#004bb1] shadow-xl shadow-blue-500/10"
                        : "cursor-not-allowed bg-zinc-100 text-zinc-400"
                    }`}
                    style={{ minHeight: "3.75rem" }}
                  >
                    {submitting ? "Processing..." : "Complete order"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (Sticky sidebar style) */}
          <div className="lg:col-span-5 checkout-sidebar px-6 sm:px-10 lg:px-16 py-12 lg:py-24">
            <div className="max-w-sm">
              {/* Items */}
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={`${item.product_id}-${item.size}`}
                    className="flex items-center gap-4"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 bg-white border border-border-light rounded-xl">
                      <div className="quantity-badge">{item.quantity}</div>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-sm font-display text-muted/20">V</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-muted font-medium mt-0.5">
                        {item.size}
                      </p>
                    </div>
                    
                    <span className="text-sm font-medium text-foreground">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="mt-10 border-t border-zinc-200/60 pt-6 space-y-3">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-foreground/70">Subtotal</span>
                  <span className="text-foreground">{formatPrice(cartTotal)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-foreground/70">Shipping</span>
                  <span className="text-emerald-600">FREE</span>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <span className="text-lg font-bold text-foreground font-display tracking-tight">Total</span>
                  <div className="flex items-baseline gap-1.5 text-foreground font-bold">
                    <span className="text-[10px] opacity-40 uppercase tracking-widest">EGP</span>
                    <span className="text-2xl font-display leading-none">{formatPrice(cartTotal)}</span>
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
