"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Lock, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { supabase } from "@/lib/supabase";
import { formatPrice, generateOrderWhatsAppUrl } from "@/lib/utils";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import PaymentUpload from "@/components/checkout/PaymentUpload";
import Image from "next/image";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"vodafone_cash" | "instapay">("vodafone_cash");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    address: string;
    paymentMethod: "vodafone_cash" | "instapay";
  } | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const cartTotal = totalPrice();
  const cartItems = items;

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa]">
        <h1 className="text-2xl font-bold text-[#000] mb-4">Your cart is empty</h1>
        <Link href="/products" className="px-6 py-3 bg-[#000] text-white rounded-lg hover:bg-[#333] transition-colors font-medium">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const handleFormSubmit = (data: any) => {
    setFormData(data);
  };

  const handleFinalSubmit = async () => {
    if (!formData || !formData.name || !formData.phone || !formData.address) {
       alert("Please fill in all contact and shipping details.");
       return;
    }
    // Only require screenshot for instapay
    if (formData.paymentMethod === 'instapay' && !screenshotUrl) {
       alert("Please upload your payment screenshot to proceed.");
       return;
    }

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
      console.error("Order error:", err);
      alert("Failed to submit order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#000] font-sans selection:bg-[#000] selection:text-white pb-24">
      {/* Checkout Navbar */}
      <header className="border-b border-[#e5e5e5] bg-white py-4 px-6 md:px-12 flex items-center justify-between z-10 relative">
         <Link href="/" className="text-2xl font-display font-bold uppercase tracking-tight">VILTRUM</Link>
         <Link href="/products" className="text-sm font-medium flex items-center gap-2 hover:opacity-70 transition-opacity">
            <ArrowLeft size={16} /> Return to Cart
         </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-8 md:pt-16">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 relative">
            
            {/* Left side: Form */}
            <div className="order-2 lg:order-1 max-w-xl">
               
               {/* Breadcrumbs */}
               <div className="text-xs text-[#666] flex items-center gap-2 mb-10">
                  <span className="font-semibold text-[#000]">Information</span>
                  <ChevronRight size={12} />
                  <span className="font-semibold text-[#000]">Shipping</span>
                  <ChevronRight size={12} />
                  <span className="font-semibold text-[#000]">Payment</span>
               </div>

               <CheckoutForm
                  onSubmit={handleFormSubmit}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
               />

               {/* Upload area conditionally rendered dynamically */}
               <div className={`transition-all duration-500 overflow-hidden ${paymentMethod === 'instapay' ? 'max-h-[500px] opacity-100 mt-10' : 'max-h-0 opacity-0 mt-0'}`}>
                  <h2 className="text-xl font-bold text-[#000] mb-4">Payment Verification</h2>
                  <PaymentUpload onUploadComplete={setScreenshotUrl} uploaded={!!screenshotUrl} />
               </div>

               <div className="mt-12 pt-8 border-t border-[#e5e5e5]">
                  <button
                     onClick={handleFinalSubmit}
                     disabled={submitting}
                     className="w-full h-14 bg-[#000] text-white rounded-lg flex items-center justify-center gap-2 font-bold text-base hover:bg-[#222] transition-colors disabled:opacity-50"
                  >
                     {submitting ? "Processing Securely..." : (
                        <>
                           <Lock size={16} /> Complete Order
                        </>
                     )}
                  </button>
               </div>
            </div>

            {/* Right side: Summary */}
            <div className="order-1 lg:order-2">
               <div className="lg:sticky lg:top-10 bg-[#fafafa] p-8 md:p-10 rounded-2xl border border-[#e5e5e5]">
                  <h3 className="font-semibold text-[#000] mb-6">Order Summary</h3>

                  <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                     {cartItems.map(item => (
                        <div key={`${item.product_id}-${item.size}`} className="flex items-center gap-4">
                           <div className="relative w-16 h-16 rounded-lg bg-white border border-[#e5e5e5] overflow-hidden flex-shrink-0">
                              <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full z-10 font-bold border-2 border-white">
                                 {item.quantity}
                              </span>
                              {item.image_url ? (
                                 <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                              ) : (
                                 <div className="w-full h-full bg-[#f0f0f0]" />
                              )}
                           </div>
                           <div className="flex-1">
                              <p className="text-sm font-semibold text-[#000] truncate">{item.title}</p>
                              <p className="text-xs text-[#666] mt-0.5">Size: {item.size}</p>
                           </div>
                           <div className="font-medium text-[#000] text-sm">
                              {formatPrice(item.price * item.quantity)}
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="mt-8 space-y-4 pt-6 border-t border-[#e5e5e5]">
                     <div className="flex justify-between text-sm text-[#444]">
                        <span>Subtotal</span>
                        <span className="font-medium text-[#000]">{formatPrice(cartTotal)}</span>
                     </div>
                     <div className="flex justify-between text-sm text-[#444]">
                        <span>Shipping</span>
                        <span className="font-semibold text-[#000]">FREE</span>
                     </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#e5e5e5] flex justify-between items-baseline">
                     <span className="font-semibold text-[#000]">Total</span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-xs text-[#666] font-medium tracking-wide">EGP</span>
                        <span className="text-3xl font-bold text-[#000] tracking-tight">{formatPrice(cartTotal)}</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </main>
  );
}
