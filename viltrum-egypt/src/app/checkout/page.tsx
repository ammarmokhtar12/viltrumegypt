"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, ShieldCheck, Truck } from "lucide-react";
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
        <h1 className="text-2xl font-bold text-foreground">Your Cart is Empty</h1>
        <p className="text-secondary text-sm">Add products before checking out.</p>
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

      <main className="min-h-screen bg-background pt-24 sm:pt-28">
        {/* Back Link */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={15} />
            <span>Back to products</span>
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-24 sm:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

            {/* Left: Order Summary */}
            <div>
              <div className="space-y-2 mb-10">
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                  Checkout
                </h1>
                <p className="text-base text-secondary">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your order
                </p>
              </div>

              {/* Cart Items */}
              <div className="space-y-5 mb-10">
                {cartItems.map((item) => (
                  <div
                    key={`${item.product_id}-${item.size}`}
                    className="flex gap-4 p-3 rounded-xl bg-surface border border-border-light"
                  >
                    <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-display text-muted/20">V</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-muted mt-1">
                        <span>Size: {item.size}</span>
                        <span>·</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                      <p className="text-sm font-bold text-secondary mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="space-y-3 border-t border-border-light pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Subtotal</span>
                  <span className="text-sm font-medium text-foreground">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Shipping</span>
                  <span className="text-sm font-medium text-emerald-600">Free</span>
                </div>
                <div className="flex items-center justify-between border-t border-border-light pt-3">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-muted">
                  <Truck size={14} />
                  <span className="text-[12px]">Free shipping across Egypt</span>
                </div>
                <div className="flex items-center gap-3 text-muted">
                  <ShieldCheck size={14} />
                  <span className="text-[12px]">Delivery within 3–5 business days</span>
                </div>
              </div>
            </div>

            {/* Right: Checkout Form */}
            <div className="flex flex-col justify-start">
              <div className="max-w-md w-full">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Customer Information</h2>
                    <div className="w-8 h-[2px] bg-accent rounded-full" />
                  </div>

                  <CheckoutForm
                    onSubmit={handleFormSubmit}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                  />

                  {/* Payment Upload */}
                  <div className="space-y-3 border-t border-border-light pt-6">
                    <h2 className="text-lg font-semibold text-foreground mb-1">Payment Proof</h2>
                    <PaymentUpload
                      onUploadComplete={(url) => setScreenshotUrl(url)}
                      uploaded={!!screenshotUrl}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleFinalSubmit}
                    disabled={!isReadyToSubmit}
                    className={`flex w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                      isReadyToSubmit
                        ? "bg-primary text-background hover:opacity-90 shadow-lg shadow-primary/10"
                        : "cursor-not-allowed bg-surface border border-border-light text-muted"
                    }`}
                    style={{ minHeight: "3.25rem" }}
                  >
                    {submitting ? (
                      "Processing..."
                    ) : (
                      <>
                        <Send size={15} />
                        Complete Order
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-muted text-center leading-relaxed">
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
